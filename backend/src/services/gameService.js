import createHttpError from "http-errors";
import mongoose from "mongoose";

import { ConversationModel, GameSessionModel } from "#src/models/index.js";
import { findMemberConversation } from "#src/services/conversationService.js";
import { assertManager } from "#src/services/groupService.js";
import { assertCanMessage } from "#src/services/messageService.js";
import { recordResult } from "#src/services/gameResultService.js";
import { gameOf } from "#src/services/games/catalog.js";
import {
  backToLobby,
  comeBack,
  declineInvite,
  emptySeats,
  handToBot,
  invite,
  invitedIndexOf,
  isBotPlaying,
  isEveryoneReady,
  lift,
  missTurn,
  playedTurn,
  playerIndexOf,
  resized,
  seatIndexOf,
  setLocked,
  setReady,
  sit,
  stand,
  unreadyAll,
  vacate,
} from "#src/services/games/seats.js";

const COUNTDOWN_MS = 5 * 1000;
const LIFT_COOLDOWN_MS = 30 * 1000;
// long enough to see a bot's move land, short enough that nobody waits on it
const BOT_PAUSE_MS = 900;
const ROOM_SEATS = 8;

const audienceOf = (conversationId) => `game:${conversationId}`;

// -------------------------- Game rooms --------------------------
// who is here, and the room seats that show it, cannot outlive a restart, so game rooms live in memory
const gameRooms = new Map();

const gameRoomOf = (conversationId) => {
  if (!gameRooms.has(conversationId)) {
    gameRooms.set(conversationId, {
      watchers: new Map(),
      // the owner's seat is always theirs, so only the other seven are stored
      seats: emptySeats(ROOM_SEATS - 1),
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

const coolDown = (gameRoom, userId) => gameRoom.cooldowns.set(String(userId), Date.now() + LIFT_COOLDOWN_MS);

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

// the room seat at 0 is the owner's, so a client's room seat index is one ahead of the stored one
const storedRoomIndexOf = (index) => {
  if (index === 0) throw createHttpError.BadRequest("That seat is kept for the group's owner");
  return index - 1;
};

// -------------------------- Views --------------------------
const seatView = ({ user, ready, locked, invited, bot, away }) => ({
  user: user ? String(user) : null,
  ready: Boolean(ready),
  locked: Boolean(locked),
  invited: invited ? String(invited) : null,
  bot: Boolean(bot),
  away: Boolean(away),
});

const roomSeatsOf = (conversation, gameRoom) => {
  if (!conversation.isGroup) return [];
  const owner = String(conversation.owner);
  return [{ ...seatView({ user: owner }), reserved: true, present: gameRoom.watchers.has(owner) }, ...gameRoom.seats.map(seatView)];
};

const stateViewFor = (session, viewerId) => {
  if (!session.state) return null;
  const seat = session.status === "playing" ? playerIndexOf(session.seats, viewerId) : -1;
  return gameOf(session.game).viewFor(session.state, seat);
};

// nobody is sent the raw session: each person gets only what they may see
const viewFor = (conversation, session, gameRoom, viewerId) => ({
  conversationId: String(conversation._id),
  revision: gameRoom.revision,
  session: session && {
    game: session.game,
    minPlayers: gameOf(session.game).minPlayers,
    status: session.status,
    startsAt: session.startsAt ?? null,
    turn: session.status === "playing" ? gameOf(session.game).turnOf(session.state) : null,
    turnEndsAt: session.status === "playing" ? session.turnEndsAt : null,
    seats: session.seats.map(seatView),
    roomSeats: roomSeatsOf(conversation, gameRoom),
    here: [...gameRoom.watchers.keys()],
    cooldownUntil: cooldownOf(gameRoom, viewerId),
    state: stateViewFor(session, viewerId),
    result: session.result ?? null,
  },
});

const broadcast = async (io, gameRoom, conversation, session) => {
  gameRoom.revision += 1;
  const sockets = await io.in(audienceOf(conversation._id)).fetchSockets();
  sockets.forEach((socket) => socket.emit("game_state", viewFor(conversation, session, gameRoom, socket.data.userId)));
};

// -------------------------- Turns --------------------------
const save = (session) => GameSessionModel.replaceOne({ conversation: session.conversation }, session, { upsert: true });

const loadSession = (conversationId) => GameSessionModel.findOne({ conversation: conversationId }).lean();

const settled = (session) => {
  if (session.status === "playing") return session;
  if (!isEveryoneReady(session.seats, gameOf(session.game).minPlayers)) return { ...session, status: "lobby", startsAt: undefined };
  if (session.status === "countdown") return session;
  return { ...session, status: "countdown", startsAt: new Date(Date.now() + COUNTDOWN_MS) };
};

const isTurnOf = (session, index) => gameOf(session.game).turnOf(session.state) === index;

const withTurnClock = (session) => {
  const game = gameOf(session.game);
  const wait = isBotPlaying(session.seats[game.turnOf(session.state)]) ? BOT_PAUSE_MS : game.turnSeconds * 1000;
  return { ...session, turnEndsAt: new Date(Date.now() + wait) };
};

// Ready is agreeing to start, so it clears once the game does
const startGame = (session) =>
  withTurnClock({
    ...session,
    status: "playing",
    startsAt: undefined,
    result: undefined,
    seats: unreadyAll(session.seats),
    state: gameOf(session.game).setup(session.state),
  });

// a finished game goes back to its lobby with the final board and who won still showing
const played = (session, index, move) => {
  const game = gameOf(session.game);
  const state = game.play(session.state, index, move);
  const outcome = game.outcome(state);
  if (!outcome) return withTurnClock({ ...session, state });
  const winners = outcome.winners.map((winner) => ({ user: String(session.seats[winner].user), bot: Boolean(session.seats[winner].bot) }));
  return { ...session, status: "lobby", state, turnEndsAt: undefined, result: { winners }, seats: backToLobby(session.seats) };
};

const playedForAbsent = (session) => {
  const game = gameOf(session.game);
  const index = game.turnOf(session.state);
  return played({ ...session, seats: missTurn(session.seats, index) }, index, game.botMove(session.state, index));
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

  gameRoom.clock = setTimeout(() => {
    gameRoom.clock = null;
    reachDeadline(io, conversationId, deadline).catch((error) => console.error(`[games] ${error.message}`));
  }, Math.max(0, deadline - Date.now()));
};

const reachDeadline = (io, conversationId, deadline) =>
  serialized(conversationId, async (gameRoom) => {
    const session = await loadSession(conversationId);
    // anything that changed the session since moved its deadline and set a timer of its own
    if (deadlineOf(session) !== deadline) return;
    const next = session.status === "countdown" ? startGame(session) : playedForAbsent(session);
    await save(next);
    await recordResult(session, next);
    syncClock(io, gameRoom, conversationId, next);
    await broadcast(io, gameRoom, await ConversationModel.findById(conversationId), next);
  });

// -------------------------- Permissions --------------------------
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

const isRoomSeat = ({ kind }) => kind === "room";

// -------------------------- Actions --------------------------
// someone already playing elsewhere chooses to leave that game first, so this only says where
const assertNotSeatedElsewhere = async (conversation, userId) => {
  const elsewhere = await GameSessionModel.findOne({
    conversation: { $ne: conversation._id },
    seats: { $elemMatch: { user: userId, bot: { $ne: true } } },
  }).lean();
  if (!elsewhere) return;
  throw createHttpError(409, "You are already sitting in another game", {
    details: { code: "seated_elsewhere", conversationId: String(elsewhere.conversation), game: elsewhere.game },
  });
};

const open = async ({ conversation, session, userId, details }) => {
  const game = gameOf(details.game);
  assertRunsGames(conversation, userId);
  if (conversation.isGroup) {
    if (session) requireLobby(session);
    return { conversation: conversation._id, game: game.id, status: "lobby", seats: resized(session?.seats ?? [], game.maxPlayers) };
  }
  if (session) throw createHttpError.BadRequest("There is already a game in this chat");
  await assertNotSeatedElsewhere(conversation, userId);
  // proposing in a chat between two people is taking a seat
  return { conversation: conversation._id, game: game.id, status: "lobby", seats: sit(emptySeats(game.maxPlayers), 0, userId) };
};

const close = ({ conversation, session, userId }) => {
  requireSession(session);
  assertRunsGames(conversation, userId);
  return null;
};

const cancel = ({ conversation, session, userId }) => {
  assertGroupManager(conversation, userId);
  requirePlaying(session);
  return { ...session, status: "lobby", state: undefined, turnEndsAt: undefined, result: undefined, seats: backToLobby(session.seats) };
};

const sitDown = async ({ conversation, session, gameRoom, userId, details }) => {
  requireSession(session);
  assertNotCoolingDown(gameRoom, userId);
  if (isRoomSeat(details)) {
    if (!conversation.isGroup) throw createHttpError.BadRequest("Only groups have room seats");
    // a room seat says someone is here, so only someone with the chat open can hold one
    if (!gameRoom.watchers.has(userId)) throw createHttpError.BadRequest("Open the chat to take a seat");
    gameRoom.seats = sit(gameRoom.seats, storedRoomIndexOf(details.index), userId);
    return session;
  }
  requireLobby(session);
  await assertNotSeatedElsewhere(conversation, userId);
  // someone new at the table means everyone agrees again
  return { ...session, seats: unreadyAll(sit(session.seats, details.index, userId)) };
};

const standUp = ({ session, gameRoom, userId, details }) => {
  requireSession(session);
  if (isRoomSeat(details)) {
    gameRoom.seats = stand(gameRoom.seats, userId);
    return session;
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

const liftOut = ({ conversation, session, gameRoom, userId, details }) => {
  assertGroupManager(conversation, userId);
  requireSession(session);
  if (isRoomSeat(details)) {
    const { seats, lifted } = lift(gameRoom.seats, storedRoomIndexOf(details.index));
    gameRoom.seats = seats;
    coolDown(gameRoom, lifted);
    return session;
  }
  const { seats, lifted } = lift(requireLobby(session).seats, details.index);
  coolDown(gameRoom, lifted);
  return { ...session, seats: unreadyAll(seats) };
};

const lockSeat = ({ conversation, session, gameRoom, userId, details }) => {
  assertGroupManager(conversation, userId);
  requireSession(session);
  if (isRoomSeat(details)) {
    gameRoom.seats = setLocked(gameRoom.seats, storedRoomIndexOf(details.index), details.locked);
    return session;
  }
  return { ...session, seats: setLocked(requireLobby(session).seats, details.index, details.locked) };
};

const inviteToSeat = ({ io, conversation, session, gameRoom, userId, details }) => {
  assertGroupManager(conversation, userId);
  requireSession(session);
  const guest = String(details.userId);
  if (!mongoose.isValidObjectId(guest) || !conversation.users.some((member) => member.equals(guest))) {
    throw createHttpError.BadRequest("They are not in this group");
  }

  let next = session;
  if (isRoomSeat(details)) gameRoom.seats = invite(gameRoom.seats, storedRoomIndexOf(details.index), guest);
  else next = { ...session, seats: invite(requireLobby(session).seats, details.index, guest) };

  io.to(guest).emit("game_invited", { conversationId: String(conversation._id), game: session.game, kind: details.kind, from: userId });
  return next;
};

const answerInvite = ({ io, conversation, session, gameRoom, userId, details }) => {
  requireSession(session);
  const seats = isRoomSeat(details) ? gameRoom.seats : session.seats;
  const index = invitedIndexOf(seats, userId);
  if (index === -1) throw createHttpError.BadRequest("That invite was withdrawn");

  if (details.accept) {
    const seatIndex = isRoomSeat(details) ? index + 1 : index;
    return sitDown({ conversation, session, gameRoom, userId, details: { kind: details.kind, index: seatIndex } });
  }
  io.to(audienceOf(conversation._id)).emit("game_notice", { conversationId: String(conversation._id), type: "invite_declined", user: userId });
  if (isRoomSeat(details)) {
    gameRoom.seats = declineInvite(gameRoom.seats, userId);
    return session;
  }
  return { ...session, seats: declineInvite(session.seats, userId) };
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
  invite: inviteToSeat,
  answer: answerInvite,
};

// -------------------------- Entry points --------------------------
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
    const conversation = await playableConversation(id, userId);
    const session = await loadSession(id);
    const next = await ACTIONS[type]({ io, conversation, session, gameRoom, userId: String(userId), details });

    const after = next && settled(next);
    if (after) {
      await save(after);
      await recordResult(session, after);
    } else {
      await GameSessionModel.deleteOne({ conversation: id });
      // room seats only exist while a game does
      gameRoom.seats = emptySeats(ROOM_SEATS - 1);
    }

    syncClock(io, gameRoom, id, after);
    await broadcast(io, gameRoom, conversation, after);
  });
};

export const watchGame = async (io, socket, conversationId) => {
  if (!mongoose.isValidObjectId(conversationId)) throw createHttpError.BadRequest("That chat does not exist");
  const id = String(conversationId);
  // a socket watches one chat's game at a time, the one open on its screen
  if (socket.data.watching !== id) await stopWatching(io, socket);

  return serialized(id, async (gameRoom) => {
    const userId = socket.data.userId;
    const conversation = await findMemberConversation(id, userId);
    if (socket.data.watching !== id) {
      socket.join(audienceOf(id));
      socket.data.watching = id;
      gameRoom.watchers.set(userId, (gameRoom.watchers.get(userId) ?? 0) + 1);
    }

    const session = await loadSession(id);
    // after a restart this is how a countdown or a turn that was running gets picked back up
    syncClock(io, gameRoom, id, session);
    // without a game nobody else has anything to update, so only the newcomer hears there is none
    if (session) await broadcast(io, gameRoom, conversation, session);
    else socket.emit("game_state", viewFor(conversation, null, gameRoom, userId));
  });
};

export const stopWatching = (io, socket) => {
  const id = socket.data.watching;
  if (!id) return Promise.resolve();
  socket.data.watching = undefined;
  socket.leave(audienceOf(id));

  return serialized(id, async (gameRoom) => {
    const userId = socket.data.userId;
    const stillHere = (gameRoom.watchers.get(userId) ?? 1) - 1;
    if (stillHere > 0) gameRoom.watchers.set(userId, stillHere);
    else {
      gameRoom.watchers.delete(userId);
      // a room seat says someone is here, so it goes when the last of their tabs does
      gameRoom.seats = vacate(gameRoom.seats, userId);
    }

    const [conversation, session] = await Promise.all([ConversationModel.findById(id), loadSession(id)]);
    if (conversation && session) await broadcast(io, gameRoom, conversation, session);
  });
};
