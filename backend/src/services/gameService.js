import createHttpError from "http-errors";
import mongoose from "mongoose";

import { ConversationModel, GameSessionModel } from "#src/models/index.js";
import { findMemberConversation, memberRooms, populateMembers } from "#src/services/conversationService.js";
import { assertManager } from "#src/services/groupService.js";
import { assertCanMessage, canMessageIn, saveEvent, saveMessage } from "#src/services/messageService.js";
import { pushGameInvite } from "#src/services/pushService.js";
import { botLevelFor, recordBotGame } from "#src/services/botRecordService.js";
import { newcomersTo, recordPlay, recordResult } from "#src/services/gameResultService.js";
import { gameOf } from "#src/services/games/catalog.js";
import { isWhisprl } from "#src/services/whisprlService.js";
import {
  backToLobby,
  comeBack,
  declineInvite,
  emptySeats,
  handToBot,
  invite,
  invitedIndexOf,
  isBotOpponent,
  isBotPlaying,
  isEveryoneReady,
  lift,
  missTurn,
  playedTurn,
  playerIndexOf,
  resized,
  seatBot,
  seatIndexOf,
  seatWhisprl,
  setLocked,
  setReady,
  sit,
  stand,
  unreadyAll,
  unseatBot,
  withSeatCount,
} from "#src/services/games/seats.js";

const COUNTDOWN_MS = 5 * 1000;
const LIFT_COOLDOWN_MS = 30 * 1000;
// long enough to see a bot's move land, short enough that nobody waits on it
const BOT_PAUSE_MS = 900;

const audienceOf = (conversationId) => `game:${conversationId}`;

// a game is set up on its settings plus how many are playing, which is the seat count rather than a setting of its own
const tableOf = (session) => ({ ...session.options, players: session.seats.length, seating: seatingOf(session.seats) });

// who is sitting where, so a game can tell the table changed without being told who anyone is
const seatingOf = (seats) => seats.map((seat) => (seat.user ? String(seat.user) : seat.bot ? "bot" : "")).join("|");

// who is watching cannot outlive a restart, so game rooms live in memory while the session itself is saved
const gameRooms = new Map();

const gameRoomOf = (conversationId) => {
  if (!gameRooms.has(conversationId)) {
    gameRooms.set(conversationId, {
      watchers: new Map(),
      // who has the game itself on screen rather than minimised, which decides whose messages float across it
      lookers: new Map(),
      cooldowns: new Map(),
      // seeded from the clock, so a restart never sends a lower revision than a client already holds
      revision: Date.now(),
      queue: Promise.resolve(),
      pending: 0,
      clock: null,
    });
  }
  return gameRooms.get(conversationId);
};

// one change at a time per conversation, or two quick taps could both take the same seat
const serialized = (conversationId, task) => {
  const gameRoom = gameRoomOf(conversationId);
  gameRoom.pending += 1;
  const run = gameRoom.queue
    .then(() => task(gameRoom))
    .finally(() => {
      gameRoom.pending -= 1;
      // dropped only once nothing is queued, so a watch right behind a leave never lands on a discarded one
      if (!gameRoom.pending && !gameRoom.watchers.size && !gameRoom.clock) gameRooms.delete(conversationId);
    });
  gameRoom.queue = run.catch(() => {});
  return run;
};

const countIn = (counts, userId, change) => {
  const left = (counts.get(userId) ?? 0) + change;
  if (left > 0) counts.set(userId, left);
  else counts.delete(userId);
};

const coolDown = (gameRoom, userId) => gameRoom.cooldowns.set(String(userId), Date.now() + LIFT_COOLDOWN_MS);

const forgiveCooldown = (gameRoom, userId) => gameRoom.cooldowns.delete(String(userId));

const cooldownOf = (gameRoom, userId) => {
  const until = gameRoom.cooldowns.get(userId);
  if (until > Date.now()) return until;
  gameRoom.cooldowns.delete(userId);
  return null;
};

const assertNotCoolingDown = (gameRoom, userId) => {
  const until = cooldownOf(gameRoom, userId);
  if (until) throw createHttpError.BadRequest(`You can sit again in ${Math.ceil((until - Date.now()) / 1000)} seconds`);
};

const seatView = ({ user, ready, locked, invited, bot, away, official }) => ({
  user: user ? String(user) : null,
  ready: Boolean(ready),
  locked: Boolean(locked),
  invited: invited ? String(invited) : null,
  bot: Boolean(bot),
  away: Boolean(away),
  official: Boolean(official),
});

const stateViewFor = (session, viewerId) => {
  if (!session.state) return null;
  const seat = session.status === "playing" ? playerIndexOf(session.seats, viewerId) : -1;
  return gameOf(session.game).viewFor(session.state, seat);
};

const lookersOf = (gameRoom) => [...gameRoom.lookers.keys()];

// nobody is sent the raw session: each person gets only what they may see
const viewFor = (conversation, session, gameRoom, viewerId) => ({
  conversationId: String(conversation._id),
  revision: gameRoom.revision,
  lookers: lookersOf(gameRoom),
  session: session && {
    game: session.game,
    status: session.status,
    startsAt: session.startsAt ?? null,
    turn: session.status === "playing" ? gameOf(session.game).turnOf(session.state) : null,
    // a wait rather than a moment, so a phone whose clock is off still starts the turn when the last play has shown
    turnStartsIn: session.status === "playing" && session.turnStartsAt ? Math.max(0, new Date(session.turnStartsAt).getTime() - Date.now()) : 0,
    turnEndsAt: session.status === "playing" ? session.turnEndsAt : null,
    turnSeconds: gameOf(session.game).turnSeconds,
    seats: session.seats.map(seatView),
    // a group's manager can set how many play, within what the game allows
    players: { min: gameOf(session.game).minPlayers, max: gameOf(session.game).maxPlayers },
    options: session.options ?? null,
    cooldownUntil: cooldownOf(gameRoom, viewerId),
    state: stateViewFor(session, viewerId),
    isFirstGame: session.status === "playing" && (session.newcomers ?? []).some((newcomer) => String(newcomer) === viewerId),
    result: session.result ? { ...session.result, showsIn: Math.max(0, new Date(session.result.showsAt ?? 0).getTime() - Date.now()) } : null,
  },
});

// a game is still someone's while it is being played and their seat is not the bot's, which it becomes when they leave it
export const ongoingFor = (session, userId) =>
  session?.status === "playing" && session.seats.some((seat) => String(seat.user) === String(userId) && !seat.bot)
    ? { conversationId: String(session.conversation), game: session.game }
    : null;

const broadcast = async (io, gameRoom, conversation, session) => {
  gameRoom.revision += 1;
  const sockets = await io.in(audienceOf(conversation._id)).fetchSockets();
  sockets.forEach((socket) => socket.emit("game_state", viewFor(conversation, session, gameRoom, socket.data.userId)));
  // every member hears whether this is a game of theirs, so the app's main pages can offer the way back without watching it
  memberRooms(conversation).forEach((userId) =>
    io.to(userId).emit("my_game", { conversationId: String(conversation._id), game: ongoingFor(session, userId)?.game ?? null, table: session?.game ?? null })
  );
};

export const ongoingGameOf = async (userId) => {
  const session = await GameSessionModel.findOne({ status: "playing", seats: { $elemMatch: { user: userId, bot: { $ne: true } } } })
    .sort({ updatedAt: -1 })
    .select("conversation game status seats")
    .lean();
  return ongoingFor(session, userId);
};

const save = (session) => GameSessionModel.replaceOne({ conversation: session.conversation }, session, { upsert: true });

const loadSession = (conversationId) => GameSessionModel.findOne({ conversation: conversationId }).lean();

const settled = (session) => {
  if (session.status === "playing") return session;
  // every seat taken and ready, so a table set for four waits for four
  if (!isEveryoneReady(session.seats, session.seats.length)) return { ...session, status: "lobby", startsAt: undefined };
  if (session.status === "countdown") return session;
  return { ...session, status: "countdown", startsAt: new Date(Date.now() + COUNTDOWN_MS) };
};

const isTurnOf = (session, index) => gameOf(session.game).turnOf(session.state) === index;

// a clock starts once the last play has finished showing, and a game can say how long that takes and how long its bot thinks
const withTurnClock = (session, playOutMs = 0) => {
  const game = gameOf(session.game);
  const startsAt = Date.now() + playOutMs;
  const wait = isBotPlaying(session.seats[game.turnOf(session.state)]) ? (game.thinkMs?.(session.state) ?? BOT_PAUSE_MS) : game.turnSeconds * 1000;
  return { ...session, turnStartsAt: new Date(startsAt), turnEndsAt: new Date(startsAt + wait) };
};

const playOutMsOf = (game, state) => game.playOutMs?.(state) ?? 0;

const startingFactsOf = async (session) => {
  const [botLevel, newcomers] = await Promise.all([botLevelFor(session), newcomersTo(session)]);
  return { botLevel, newcomers };
};

// Ready is agreeing to start, so it clears once the game does
const startGame = (session, facts) => {
  const game = gameOf(session.game);
  const state = game.setup(session.state, tableOf(session));
  const started = { ...session, ...facts, status: "playing", startsAt: undefined, result: undefined, seats: unreadyAll(session.seats), state };
  return withTurnClock(started, playOutMsOf(game, state));
};

// a person's clock runs on through a play that leaves their turn unfinished, while a bot still takes its pause
const keepsClock = (game, session, state) => Boolean(game.isMidTurn?.(state)) && !isBotPlaying(session.seats[game.turnOf(state)]);

// a finished game goes back to its lobby with the final board and who won still showing
// a finished game goes back to its lobby with the final board and who won still showing
const finished = (session, state, winningSeats, { showsInMs = 0, leftBy } = {}) => ({
  ...session,
  status: "lobby",
  state,
  turnStartsAt: undefined,
  turnEndsAt: undefined,
  botLevel: undefined,
  newcomers: undefined,
  result: {
    winners: winningSeats.map((seat) => ({ user: session.seats[seat].user ? String(session.seats[seat].user) : null, bot: Boolean(session.seats[seat].bot) })),
    seats: winningSeats,
    leftBy,
    endedAt: new Date(),
    // shown once the last play has finished showing, as a turn's clock waits for it
    showsAt: new Date(Date.now() + showsInMs),
  },
  seats: backToLobby(session.seats),
});

export const played = (session, index, move) => {
  const game = gameOf(session.game);
  const state = game.play(session.state, index, move);
  const outcome = game.outcome(state);
  if (!outcome) return keepsClock(game, session, state) ? { ...session, state } : withTurnClock({ ...session, state }, playOutMsOf(game, state));
  return finished(session, state, outcome.winners, { showsInMs: playOutMsOf(game, state) });
};

const playedForAbsent = (session) => {
  const game = gameOf(session.game);
  const index = game.turnOf(session.state);
  // a bot someone chose to face tries harder than one covering for a player who walked away
  const level = isBotOpponent(session.seats[index]) ? (session.botLevel ?? "medium") : "standIn";
  return played({ ...session, seats: missTurn(session.seats, index) }, index, game.botMove(session.state, index, level));
};

const BOT_REACTION_CHANCE = 0.5;
const BOT_REACTION_GAP_MS = 6000;
const ENDING_REACTIONS = { won: ["🥳", "😎"], lost: ["😭", "😡"], drawn: ["🫠", "😜"] };

const anyOf = (items) => items[Math.floor(Math.random() * items.length)];

const endingFor = ({ seats }, index) => {
  if (!seats.length) return "drawn";
  return seats.includes(index) ? "won" : "lost";
};

// a chosen bot always reacts to how a game ends, and to only some of what happens on the way, never twice in quick succession
const reactAsBot = (io, gameRoom, conversationId, before, after) => {
  if (before?.status !== "playing" || !after?.state) return;
  const game = gameOf(before.game);
  const isEnding = Boolean(after.result);
  if (!isEnding && (Date.now() < gameRoom.botReactsAfter || Math.random() > BOT_REACTION_CHANCE)) return;
  const [reaction] = before.seats.flatMap((seat, index) => {
    if (!isBotOpponent(seat)) return [];
    const moment = isEnding ? endingFor(after.result, index) : game.momentFor?.(before.state, after.state, index);
    const choices = ENDING_REACTIONS[moment] ?? game.reactions?.[moment];
    // Whisprl reacts as itself, while a chosen bot has no account and is known by its seat
    const thrower = seat.official ? { user: String(seat.user) } : { seat: index };
    return choices ? [{ ...thrower, emoji: anyOf(choices) }] : [];
  });
  if (!reaction) return;
  gameRoom.botReactsAfter = Date.now() + BOT_REACTION_GAP_MS;
  // thrown once the play has finished showing, so the face matches what just happened on the board
  setTimeout(() => io.to(audienceOf(conversationId)).emit("game_reaction", { conversationId, ...reaction }), playOutMsOf(game, after.state));
};

const deadlineOf = (session) => {
  if (session?.status === "countdown") return new Date(session.startsAt).getTime();
  if (session?.status === "playing") return new Date(session.turnEndsAt).getTime();
  return null;
};

// only deadlines are stored, so the one timer a game room runs is rebuilt whenever its session changes
const syncClock = (io, gameRoom, conversationId, session) => {
  clearTimeout(gameRoom.clock);
  gameRoom.clock = null;
  const deadline = deadlineOf(session);
  if (!deadline) return;

  gameRoom.clock = setTimeout(
    () => {
      gameRoom.clock = null;
      reachDeadline(io, conversationId, deadline).catch((error) => console.error(`[games] ${error.message}`));
    },
    Math.max(0, deadline - Date.now())
  );
};

const reachDeadline = (io, conversationId, deadline) =>
  serialized(conversationId, async (gameRoom) => {
    const session = await loadSession(conversationId);
    // anything that changed the session since moved its deadline and set a timer of its own
    if (deadlineOf(session) !== deadline) return;
    const next = session.status === "countdown" ? startGame(session, await startingFactsOf(session)) : playedForAbsent(session);
    await save(next);
    await Promise.all([recordPlay(session, next), recordResult(session, next), recordBotGame(session, next)]);
    syncClock(io, gameRoom, conversationId, next);
    reactAsBot(io, gameRoom, conversationId, session, next);
    await broadcast(io, gameRoom, await ConversationModel.findById(conversationId), next);
  });

const assertGroupManager = (conversation, userId) => {
  if (!conversation.isGroup) throw createHttpError.BadRequest("Only groups manage their seats");
  assertManager(conversation, userId);
};

const assertRunsGames = (conversation, userId) => {
  if (conversation.isGroup) assertManager(conversation, userId);
};

const requireSession = (session) => {
  if (!session) throw createHttpError.BadRequest("No game is open here");
  return session;
};

const requireLobby = (session) => {
  if (requireSession(session).status === "playing") throw createHttpError.BadRequest("Wait for the game being played to finish");
  return session;
};

const requirePlaying = (session) => {
  if (requireSession(session).status !== "playing") throw createHttpError.BadRequest("No game is being played");
  return session;
};

// only a game being played holds someone, who chooses to leave it first; a seat in another lobby is simply given up for this one
const leaveOtherTables = async (io, conversation, userId) => {
  const elsewhere = await GameSessionModel.find({
    conversation: { $ne: conversation._id },
    seats: { $elemMatch: { user: userId, bot: { $ne: true } } },
  }).lean();
  const playing = elsewhere.find((session) => session.status === "playing");
  if (playing) {
    throw createHttpError(409, "You are already playing another game", {
      details: { code: "seated_elsewhere", conversationId: String(playing.conversation), game: playing.game },
    });
  }
  // a table that closed in the meantime has nobody left to stand up from
  await Promise.all(elsewhere.map((lobby) => actInGame(io, userId, { conversationId: String(lobby.conversation), type: "stand" }).catch(() => {})));
};

const open = async ({ io, conversation, session, userId, details }) => {
  const game = gameOf(details.game);
  assertRunsGames(conversation, userId);
  const options = game.options?.defaults;
  // a table opens with the fewest seats its game needs, and a group's manager adds more
  if (conversation.isGroup) {
    if (session) requireLobby(session);
    return { conversation: conversation._id, game: game.id, status: "lobby", options, seats: resized(session?.seats ?? [], game.minPlayers) };
  }
  if (session) throw createHttpError.BadRequest("There is already a game in this chat");
  await leaveOtherTables(io, conversation, userId);
  // proposing in a chat between two people is taking a seat and saving the other for them, which Whisprl takes itself
  const seats = sit(emptySeats(game.minPlayers), 0, userId);
  const peerId = conversation.users.map((member) => String(member._id ?? member)).find((id) => id !== String(userId));
  return {
    conversation: conversation._id,
    game: game.id,
    status: "lobby",
    options,
    seats: isWhisprl(peerId) ? seatWhisprl(seats, 1, peerId) : invite(seats, 1, peerId),
  };
};

// someone else at a table between two people, a person or Whisprl, who would be left with a game nobody finished
const hasOpponent = (session, userId) => session.seats.some((seat) => seat.user && String(seat.user) !== String(userId));

// between two people only someone at the table closes it, and a game against anyone but the bot is left instead, which loses it
const close = ({ conversation, session, userId }) => {
  requireSession(session);
  if (conversation.isGroup) {
    assertRunsGames(conversation, userId);
    return null;
  }
  if (seatIndexOf(session.seats, userId) === -1) throw createHttpError.BadRequest("Only someone playing can close the game");
  if (session.status === "playing" && hasOpponent(session, userId)) throw createHttpError.BadRequest("Leave the game instead, which counts as a loss");
  return null;
};

const cancel = ({ conversation, session, userId }) => {
  assertGroupManager(conversation, userId);
  requirePlaying(session);
  return {
    ...session,
    status: "lobby",
    state: undefined,
    turnStartsAt: undefined,
    turnEndsAt: undefined,
    result: undefined,
    seats: backToLobby(session.seats),
  };
};

const sitDown = async ({ io, conversation, session, gameRoom, userId, details }) => {
  requireLobby(session);
  assertNotCoolingDown(gameRoom, userId);
  await leaveOtherTables(io, conversation, userId);
  // someone new at the table means everyone agrees again
  return { ...session, seats: unreadyAll(sit(session.seats, details.index, userId)) };
};

// leaving a game of two, against a person or Whisprl, hands them the win; a bigger table plays on with a bot in the seat
const forfeits = (session, userId) => session.seats.length === 2 && hasOpponent(session, userId);

const standUp = ({ conversation, session, userId }) => {
  requireSession(session);
  // a game against the bot alone is left with nothing owed, so it simply closes
  if (session.status === "playing" && !conversation.isGroup && !hasOpponent(session, userId)) return null;
  if (session.status === "playing" && forfeits(session, userId)) {
    const leaving = seatIndexOf(session.seats, userId);
    return finished(session, session.state, [1 - leaving], { leftBy: String(userId) });
  }
  if (session.status === "playing") {
    const next = { ...session, seats: handToBot(session.seats, userId) };
    return isTurnOf(session, seatIndexOf(session.seats, userId)) ? withTurnClock(next) : next;
  }
  return { ...session, seats: unreadyAll(stand(session.seats, userId)) };
};

const makeMove = ({ session, userId, details }) => {
  const index = playerIndexOf(requirePlaying(session).seats, userId);
  if (index === -1) throw createHttpError.BadRequest("You are not playing");
  if (!isTurnOf(session, index)) throw createHttpError.BadRequest("It is not your turn");
  // moving is coming back, for someone the bot was covering
  return played({ ...session, seats: playedTurn(comeBack(session.seats, userId), index) }, index, details.move);
};

const returnToSeat = ({ session, userId }) => {
  const next = { ...requirePlaying(session), seats: comeBack(session.seats, userId) };
  return isTurnOf(session, seatIndexOf(session.seats, userId)) ? withTurnClock(next) : next;
};

const markReady = ({ session, userId, details }) => ({ ...requireLobby(session), seats: setReady(session.seats, userId, details.ready) });

// whoever is at the table sets it up, and in a group whoever runs its seats can too
const assertMayChangeTable = (conversation, session, userId) => {
  if (seatIndexOf(session.seats, userId) !== -1) return;
  if (!conversation.isGroup) throw createHttpError.BadRequest("Take a seat first");
  assertManager(conversation, userId);
};

const changeBot = ({ conversation, session, userId, details }) => {
  assertMayChangeTable(conversation, requireLobby(session), userId);
  // between two people, choosing the bot takes back a challenge nobody has answered yet
  const open = conversation.isGroup || !details.seated ? session.seats : setLocked(session.seats, details.index, false);
  const seats = details.seated ? seatBot(open, details.index) : unseatBot(session.seats, details.index);
  return { ...session, seats: unreadyAll(seats) };
};

// a game's own settings, checked against how many are playing, because the two constrain each other
const changeSettings = ({ conversation, session, userId, details }) => {
  const game = gameOf(requireLobby(session).game);
  if (!game.options) throw createHttpError.BadRequest("This game has no settings");
  assertMayChangeTable(conversation, session, userId);
  const options = { ...session.options, ...details.options };
  game.options.assert({ ...options, players: session.seats.length });
  // the table changed, so everyone agrees to it again
  return { ...session, options, seats: unreadyAll(session.seats) };
};

const changeSeats = ({ conversation, session, userId, details }) => {
  const game = gameOf(requireLobby(session).game);
  assertGroupManager(conversation, userId);
  const count = details.count;
  if (!Number.isInteger(count) || count < game.minPlayers || count > game.maxPlayers) {
    throw createHttpError.BadRequest(`This game seats between ${game.minPlayers} and ${game.maxPlayers} players`);
  }
  game.options?.assert({ ...session.options, players: count });
  return { ...session, seats: unreadyAll(withSeatCount(session.seats, count)) };
};

const liftOut = ({ conversation, session, gameRoom, userId, details }) => {
  assertGroupManager(conversation, userId);
  const { seats, lifted } = lift(requireLobby(session).seats, details.index);
  coolDown(gameRoom, lifted);
  return { ...session, seats: unreadyAll(seats) };
};

const lockSeat = ({ conversation, session, userId, details }) => {
  assertGroupManager(conversation, userId);
  return { ...session, seats: setLocked(requireLobby(session).seats, details.index, details.locked) };
};

const inviteToSeat = ({ io, conversation, session, gameRoom, userId, details }) => {
  assertGroupManager(conversation, userId);
  const guest = String(details.userId);
  if (!mongoose.isValidObjectId(guest) || !conversation.users.some((member) => member.equals(guest))) {
    throw createHttpError.BadRequest("They are not in this group");
  }

  const next = { ...session, seats: invite(requireLobby(session).seats, details.index, guest) };
  // saving a seat for someone takes back the lift that put them on a cooldown
  forgiveCooldown(gameRoom, guest);
  io.to(guest).emit("game_invited", { conversationId: String(conversation._id), game: session.game, from: userId });
  return next;
};

const answerInvite = async ({ io, conversation, session, gameRoom, userId, details }) => {
  requireSession(session);
  const index = invitedIndexOf(session.seats, userId);
  if (index === -1) throw createHttpError.BadRequest("That invite was withdrawn");

  // accepting is agreeing to play, so the seat taken is ready too
  if (details.accept) {
    const seated = await sitDown({ io, conversation, session, gameRoom, userId, details: { index } });
    return { ...seated, seats: setReady(seated.seats, userId, true) };
  }
  io.to(audienceOf(conversation._id)).emit("game_notice", { conversationId: String(conversation._id), type: "invite_declined", user: userId });
  // turned down between two people, the seat is freed, so the one who asked can play the bot instead
  return { ...session, seats: conversation.isGroup ? declineInvite(session.seats, userId) : setLocked(session.seats, index, false) };
};

const ACTIONS = {
  open,
  close,
  cancel,
  sit: sitDown,
  stand: standUp,
  ready: markReady,
  move: makeMove,
  back: returnToSeat,
  lift: liftOut,
  lock: lockSeat,
  bot: changeBot,
  settings: changeSettings,
  seats: changeSeats,
  invite: inviteToSeat,
  answer: answerInvite,
};

// only a table opening and closing earn a line in the chat, so playing a game does not fill it
const TABLE_EVENTS = { open: "game_opened", close: "game_closed" };

// between two people opening a game is a challenge, answered from the message it sends
const challenge = async (io, members, challenger, guest, game) => {
  const notice = { type: "challenge", user: guest._id, name: guest.firstName, game: game.id, gameName: game.name };
  const { message } = await saveMessage(members, { sender: challenger._id, notice });
  io.to(memberRooms(members)).emit("message_received", message);
  io.to(String(guest._id)).emit("game_invited", { conversationId: String(members._id), game: game.id, from: String(challenger._id) });
  await pushGameInvite(members, challenger, game.name);
};

const announceTable = async (io, conversation, userId, type, before, after) => {
  const eventType = TABLE_EVENTS[type];
  if (!eventType || (type === "open" && before)) return;
  const game = gameOf((after ?? before).game);
  const members = await populateMembers(conversation);
  const guest = !members.isGroup && members.users.find((member) => String(member._id) !== userId);
  if (type === "open" && guest && !isWhisprl(guest._id)) {
    await challenge(
      io,
      members,
      members.users.find((member) => String(member._id) === userId),
      guest,
      game
    );
    return;
  }
  const { message } = await saveEvent(members, userId, eventType, { name: game.name });
  io.to(memberRooms(members)).emit("message_received", message);
};

const playableConversation = async (conversationId, userId) => {
  const conversation = await findMemberConversation(conversationId, userId);
  await assertCanMessage(conversation, userId);
  return conversation;
};

export const actInGame = (io, userId, { conversationId, type, ...details }) => {
  if (!Object.hasOwn(ACTIONS, type) || !mongoose.isValidObjectId(conversationId)) {
    return Promise.reject(createHttpError.BadRequest("That is not something you can do in a game"));
  }
  const id = String(conversationId);

  return serialized(id, async (gameRoom) => {
    // read together, since each read is a round trip to the database and every move waits on both
    const [conversation, session] = await Promise.all([playableConversation(id, userId), loadSession(id)]);
    const next = await ACTIONS[type]({ io, conversation, session, gameRoom, userId: String(userId), details });

    const after = next && settled(next);
    if (after) {
      await save(after);
      await Promise.all([recordPlay(session, after), recordResult(session, after), recordBotGame(session, after)]);
    } else await GameSessionModel.deleteOne({ conversation: id });

    syncClock(io, gameRoom, id, after);
    reactAsBot(io, gameRoom, id, session, after);
    await broadcast(io, gameRoom, conversation, after);
    await announceTable(io, conversation, String(userId), type, session, after);
  });
};

export const watchGame = async (io, socket, conversationId) => {
  if (!mongoose.isValidObjectId(conversationId)) throw createHttpError.BadRequest("That chat does not exist");
  const id = String(conversationId);
  // a socket watches one chat's game at a time, the one open on its screen
  if (socket.data.watching !== id) await stopWatching(io, socket);

  return serialized(id, async (gameRoom) => {
    const userId = socket.data.userId;
    const [conversation, session] = await Promise.all([findMemberConversation(id, userId), loadSession(id)]);
    if (socket.data.watching !== id) {
      socket.join(audienceOf(id));
      socket.data.watching = id;
      countIn(gameRoom.watchers, userId, 1);
    }

    // after a restart this is how a countdown or a turn that was running gets picked back up
    syncClock(io, gameRoom, id, session);
    // without a game nobody else has anything to update, so only the newcomer hears there is none
    if (session) await broadcast(io, gameRoom, conversation, session);
    else socket.emit("game_state", viewFor(conversation, null, gameRoom, userId));
  });
};

const announceLookers = (io, conversationId, gameRoom) =>
  io.to(audienceOf(conversationId)).emit("game_lookers", { conversationId, users: lookersOf(gameRoom) });

export const stopWatching = (io, socket) => {
  const id = socket.data.watching;
  if (!id) return Promise.resolve();
  const wasLooking = socket.data.isLooking;
  socket.data.watching = undefined;
  socket.data.isLooking = false;
  socket.leave(audienceOf(id));

  return serialized(id, (gameRoom) => {
    const userId = socket.data.userId;
    countIn(gameRoom.watchers, userId, -1);
    if (!wasLooking) return;
    countIn(gameRoom.lookers, userId, -1);
    announceLookers(io, id, gameRoom);
  });
};

export const lookAtGame = (io, socket, isLooking) => {
  const id = socket.data.watching;
  const looking = isLooking === true;
  if (!id || Boolean(socket.data.isLooking) === looking) return Promise.resolve();
  socket.data.isLooking = looking;
  return serialized(id, (gameRoom) => {
    countIn(gameRoom.lookers, socket.data.userId, looking ? 1 : -1);
    announceLookers(io, id, gameRoom);
  });
};

// the emoji anyone at a game can throw, the same nine the tray offers; they are shown and gone, never saved
const REACTIONS = ["😂", "😭", "😜", "😘", "😎", "😡", "😱", "🫠", "🥳"];

export const reactInGame = async (socket, emoji) => {
  const id = socket.data.watching;
  if (!id || !REACTIONS.includes(emoji)) throw createHttpError.BadRequest("That reaction is not available");
  // ex-friends and blocked people stay in an old chat's room, so a reaction goes only where a message could
  if (!(await canMessageIn(id, socket.data.userId))) throw createHttpError.Forbidden("You can't send anything in this chat");
  socket.to(audienceOf(id)).emit("game_reaction", { conversationId: id, user: socket.data.userId, emoji });
};
