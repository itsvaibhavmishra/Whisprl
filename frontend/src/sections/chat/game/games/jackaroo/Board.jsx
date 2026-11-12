import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
import { useReducedMotion } from "motion/react";
import { useSelector } from "react-redux";

import { selectViewReceivedAt } from "@/redux/slices/gameSlice";
import { boardArtOf } from "@/sections/chat/game/games/jackaroo/art";
import Banner from "@/sections/chat/game/games/jackaroo/Banner";
import { narrowed, nextStep, pillOf, THROWS } from "@/sections/chat/game/games/jackaroo/choices";
import { BOARD, marbleKey, pointOf, shownSeatOf, viewOf } from "@/sections/chat/game/games/jackaroo/geometry";
import Hand from "@/sections/chat/game/games/jackaroo/Hand";
import { ModeContext } from "@/sections/chat/game/games/jackaroo/mode";
import layout from "@/sections/chat/game/games/jackaroo/layout.json";
import PALETTE, { toneOf } from "@/sections/chat/game/games/jackaroo/palette";
import { Crowd, Marbles, Marks, Preview, ShutHome, Swirls, Targets, shutHolesOf } from "@/sections/chat/game/games/jackaroo/Pieces";
import Player from "@/sections/chat/game/games/jackaroo/Players";
import { BONUS, DEAL, dealStartOf, flyToPile, lengthOf, playOut } from "@/sections/chat/game/games/jackaroo/playback";
import Prompt from "@/sections/chat/game/games/jackaroo/Prompt";
import { preloadSounds, SOUNDS } from "@/sections/chat/game/games/jackaroo/sounds";
import { Deck, DiscardStamp, Pile, Shoe, TheirCards } from "@/sections/chat/game/games/jackaroo/Table";
import TurnTrail from "@/sections/chat/game/games/jackaroo/TurnTrail";
import useHasPassed from "@/sections/chat/game/useHasPassed";
import { firstNameIn } from "@/utils/groups";
import { sayerAt } from "@/sections/chat/game/useRoomChatter";

const SHADOW_SPILL = (layout.sprites.boardShadow / layout.board - 1) * 50;
// the players sit just off two corners of the board, over its rim, so the board leaves them this much height
const RIM_OVERLAP = 14;
// the board's bottom corners are empty past its scalloped edge, so your corner rises into it and stays clear of the prompt centred over your cards
const CORNER_OVERLAP = 52;
const PLAYERS_ROOM = 112;
// four players sit over the round board's empty corners, half off its square, as the reference seats them, so it needs far less room
const TEAM_PLAYERS_ROOM = 60;
const TEAM_CORNER_LIFT = 30;
// the round four-armed board runs this share of its width past each side of the screen, as the reference draws it, so its holes are bigger
const TEAM_BLEED = 0.12;
// a corner's distance in from the board's side to the screen's edge, or out beside a board narrower than the room
const EDGE = "max(-48px, calc((100% - 100cqw) / 2))";
const REFUSAL_MS = 2500;
// about a fingertip, so marbles nearer each other than this on screen are numbered before one is taken
const CROWD_PX = 44;

const nameOf = (seat, conversation, meId) => {
  if (seat?.bot) return "The bot";
  return seat?.user ? firstNameIn(conversation, seat.user, meId) : "Them";
};

const parseMarble = (value) => {
  const [owner, id] = value.split(".").map(Number);
  return { owner, id };
};

const homeOf = (places) => places.filter((place) => place.at === "home").length;

const NO_HOMES = [];
// every player sits off the corner by their own base, as the reference seats them, so you are bottom left and a partner or a lone rival top right
const CORNERS = { 2: ["bottomLeft", "topRight"], 4: ["bottomLeft", "topLeft", "topRight", "bottomRight"] };
const ON_RIGHT = ["topRight", "bottomRight"];
// a corner above the board sits on its rim; one below rises into the empty corner past its scalloped edge, moving out beside a board narrower than the room
const CORNER_PLACE = {
  topRight: { right: 0, bottom: `calc(100% - ${RIM_OVERLAP}px)` },
  topLeft: { left: 0, bottom: `calc(100% - ${RIM_OVERLAP}px)` },
  bottomLeft: { left: EDGE, top: `calc(100% - ${CORNER_OVERLAP}px)` },
  bottomRight: { right: EDGE, top: `calc(100% - ${CORNER_OVERLAP}px)` },
};
const TEAM_CORNER_PLACE = {
  topRight: { right: EDGE, top: -TEAM_CORNER_LIFT },
  topLeft: { left: EDGE, top: -TEAM_CORNER_LIFT },
  bottomLeft: { left: EDGE, bottom: -TEAM_CORNER_LIFT },
  bottomRight: { right: EDGE, bottom: -TEAM_CORNER_LIFT },
};

const JackarooBoard = ({ state, seats, conversation, session, onMove, onLeave }) => {
  const meId = useSelector((store) => store.user.user._id);
  useEffect(preloadSounds, []);
  const isStill = useReducedMotion();
  const mySeat = seats.findIndex((seat) => seat.user === meId);
  const view = useMemo(() => viewOf(state.mode, mySeat), [state.mode, mySeat]);
  const boardArt = boardArtOf(state.mode);
  const seatCount = state.marbles.length;
  const isTeams = seatCount > 2;
  const boardWidth = isTeams
    ? `min(calc(100cqw * ${1 + 2 * TEAM_BLEED}), calc(100cqh - ${TEAM_PLAYERS_ROOM}px))`
    : `min(100cqw, calc(100cqh - ${PLAYERS_ROOM}px))`;
  const placeOf = (corner) => (isTeams ? TEAM_CORNER_PLACE : CORNER_PLACE)[corner];
  // turns pass round the table, and a ten or a red queen hits the player after the one who played it
  const nextOf = useCallback((seat) => (seat + 1) % seatCount, [seatCount]);
  const victim = nextOf(Math.max(mySeat, 0));
  const toneKey = state.marbles.map((_, seat) => toneOf(state, seat)).join(",");
  const tones = useMemo(() => toneKey.split(",").map(Number), [toneKey]);
  const handTones = useMemo(() => ({ mine: tones[Math.max(mySeat, 0)], theirs: tones[victim] }), [tones, mySeat, victim]);
  const tonesOf = useCallback((seat) => ({ mine: tones[seat], theirs: tones[nextOf(seat)] }), [tones, nextOf]);

  // a turn only begins once the last play has finished showing, which is when its clock starts
  const receivedAt = useSelector(selectViewReceivedAt);
  // a view the server sends again with no new play, as when someone opens the chat, keeps the timings of what is already showing
  const [timing, setTiming] = useState(() => ({
    plays: state.plays,
    arrivedAt: receivedAt,
    turnEndsAt: session.turnEndsAt,
    turnStartsAt: receivedAt + session.turnStartsIn,
  }));
  if (timing.plays !== state.plays || timing.turnEndsAt !== session.turnEndsAt) {
    setTiming({
      plays: state.plays,
      arrivedAt: timing.plays === state.plays ? timing.arrivedAt : receivedAt,
      turnEndsAt: session.turnEndsAt,
      turnStartsAt: timing.turnEndsAt === session.turnEndsAt ? timing.turnStartsAt : receivedAt + session.turnStartsIn,
    });
  }
  const hasTurnStarted = useHasPassed(timing.turnStartsAt);
  // the room shows the result once the winning play has played out, and with no deal to come the empty hand gives up its room then
  const isResultShown = useHasPassed(session.result ? receivedAt + session.result.showsIn : null) && Boolean(session.result);
  // a deal only plays out for plays that arrive while the board is open, never again when it is reopened
  const firstSeenPlays = useRef(state.plays);
  const isFresh = state.plays > firstSeenPlays.current || state.plays === 0;
  const dealAt = isFresh ? dealStartOf(state.lastPlay) : null;
  const hasDealStarted = useHasPassed(dealAt === null ? 0 : timing.arrivedAt + dealAt);
  const hasDeckGone = useHasPassed(dealAt === null ? 0 : timing.arrivedAt + dealAt + DEAL.deckGoesAt);
  // a bonus card joins its hand only when it turns up, so the cards already there make room for it then and not before
  const isBonusFresh = isFresh && Boolean(state.lastPlay?.bonus);
  const hasBonusCome = useHasPassed(isBonusFresh ? timing.arrivedAt + lengthOf(state.lastPlay) + BONUS.appearsAfter : 0);
  // a home opens or shuts when the marble at its door lands or leaves, not while it is still on its way
  const hasPlayedOut = useHasPassed(isFresh && state.lastPlay ? timing.arrivedAt + lengthOf(state.lastPlay) : 0);
  const blockedHomes = state.blockedHomes ?? NO_HOMES;
  const [shutHomes, setShutHomes] = useState(blockedHomes);
  if (hasPlayedOut && shutHomes !== blockedHomes) setShutHomes(blockedHomes);
  const shutHoles = useMemo(() => shutHolesOf(shutHomes, state.marbles), [shutHomes, state.marbles]);
  const bonusSeat = isBonusFresh && !hasBonusCome ? state.lastPlay.seat : null;
  const hand = useMemo(() => (bonusSeat === mySeat ? state.hand.slice(0, -1) : state.hand), [bonusSeat, mySeat, state.hand]);
  useEffect(() => {
    if (isBonusFresh && hasBonusCome) SOUNDS.cardIn(0.6);
  }, [isBonusFresh, hasBonusCome]);
  // each player's new cards come from the deal or, earned, as a bonus
  const arrivals = useMemo(
    () =>
      Array.from({ length: seatCount }, (_, seat) => {
        if (state.lastPlay?.bonus && state.lastPlay.seat === seat) return { kind: "bonus", at: 0 };
        return dealAt === null ? null : { kind: "deal", at: dealAt, isFirst: state.turn === seat, isOpening: state.plays === 0 };
      }),
    [seatCount, state.lastPlay, state.turn, state.plays, dealAt]
  );
  // once a play is sent the hand waits for the server's answer, since a second tap would only be refused
  const [sentAt, setSentAt] = useState(null);
  // a card you put down is yours to finish as soon as it lands, so its choices never wait on the clock
  const shownCard = state.shown?.seat === mySeat ? state.shown.card : null;
  // a finish sent before the server had its card down is still on its way while that card shows
  const isWaiting = sentAt === state.plays || (sentAt === state.plays - 1 && Boolean(shownCard));
  const isMyTurn = mySeat !== -1 && state.turn === mySeat && state.winner === null && !isWaiting && (hasTurnStarted || Boolean(shownCard));
  const options = useMemo(() => (isMyTurn ? state.options : []), [isMyTurn, state.options]);
  // once a turn, so a refused play that hands the turn back does not knock again
  const knockedFor = useRef(null);
  useEffect(() => {
    if (!isMyTurn || knockedFor.current === state.plays) return;
    knockedFor.current = state.plays;
    SOUNDS.turn();
  }, [isMyTurn, state.plays]);
  const isThrowing = options.length > 0 && options.every((option) => THROWS.includes(option.kind));
  const throwsHand = options.find((option) => option.kind === "discardAll");

  // a card is picked, played onto the pile, then asked what it still needs; all of it belongs to one play, so the next starts afresh
  const [choice, setChoice] = useState({ plays: state.plays });
  // the server putting your card down is the same play going on, so the choices already made for it carry over
  if (shownCard && !(choice.plays === state.plays && choice.card === shownCard.id && choice.isPlayed)) {
    setChoice(choice.card === shownCard.id ? { ...choice, plays: state.plays, isPlayed: true } : { plays: state.plays, card: shownCard.id, isPlayed: true });
  }
  const chosen = choice.plays === state.plays ? choice : { plays: state.plays };
  const pickedCard = state.hand.find((card) => card.id === chosen.card) ?? (shownCard?.id === chosen.card ? shownCard : undefined);
  const step = chosen.isPlayed && isMyTurn ? nextStep(options, chosen) : null;

  // a refused play is said over the hand, where the turn's own prompts are, and the turn starts over
  const [refusal, setRefusal] = useState(null);
  useEffect(() => {
    if (!refusal) return undefined;
    const timer = setTimeout(() => setRefusal(null), REFUSAL_MS);
    return () => clearTimeout(timer);
  }, [refusal]);
  const send = async (move) => {
    // a card put down is answered while its choices are made, so only a finished play holds the hand
    if (!move.show) setSentAt(state.plays);
    const result = await onMove(move, { isQuiet: true });
    if (result?.meta?.requestStatus === "rejected") {
      setSentAt(null);
      setChoice({ plays: state.plays });
      setPick(null);
      setRefusal(result.payload);
    }
  };

  // each answer narrows the card's plays, and the play goes as soon as only one is left; the red queen still has a card to pick
  const choose = (next) => {
    const after = nextStep(options, next);
    if (after.play && after.play.kind !== "takeCard") send({ key: after.play.key });
    setChoice(next);
  };

  // a played card flies to the pile from its own place in the hand, measured before the hand hides it
  const playedFrom = useRef(null);
  const flownId = useRef(null);
  const handRef = useRef(null);
  const playCard = () => {
    playedFrom.current = handRef.current?.querySelector(`[data-card="${chosen.card}"]`)?.getBoundingClientRect() ?? null;
    flownId.current = chosen.card;
    const next = { ...chosen, isPlayed: true };
    const after = nextStep(options, next);
    // a card with choices still to make goes down for both players now, and its choices are made while the server takes it
    if (!after.play || after.play.kind === "takeCard") send({ show: chosen.card });
    choose(next);
  };
  // the card you take from them is sent at once and stays lifted until the server shows what it was
  const [pick, setPick] = useState(null);
  const onPickBack = useCallback(() => setPick((current) => current && { ...current, isBack: true }), []);
  const tappedTo = useRef(null);
  const take = (index, rect) => {
    tappedTo.current = rect;
    setPick({ plays: state.plays, count: state.hands[victim], taken: index, isBack: false });
    setChoice({ ...chosen, taken: index });
    send({ key: step.play.key, taken: index });
  };

  const pickMarble = (value) => {
    const marble = parseMarble(value);
    choose(step.marbles ? { ...chosen, marble } : { ...chosen, second: marble });
  };
  // the marbles the picked card could take next, where they sit on screen
  const choosable = step?.marbles ?? step?.seconds ?? [];
  const labelOf = (owner) => {
    if (owner === mySeat) return "Your marble";
    return isTeams && state.team[owner] === state.team[mySeat] ? "Your partner's marble" : "Their marble";
  };
  const targets = choosable.map((marble) => ({
    value: marbleKey(marble),
    ...pointOf(state.marbles[marble.owner][marble.id], marble.owner, view),
    label: labelOf(marble.owner),
  }));
  // a tap among marbles too close to tell apart numbers them, and belongs to this one question, so any answer closes it
  const [crowd, setCrowd] = useState(null);
  const crowded = crowd?.chosen === chosen ? targets.filter((target) => crowd.values.includes(target.value)) : [];

  // handlers read the latest board from here, so they keep one identity and never redraw what they are passed to
  const latest = useRef();
  latest.current = { chosen, step, playCard, choose, state, targets, pickMarble };
  const onCard = useCallback((id) => {
    const current = latest.current;
    if (current.chosen.card === id) current.playCard();
    else setChoice({ plays: current.state.plays, card: id });
  }, []);
  const onSelect = useCallback((id) => setChoice({ plays: latest.current.state.plays, card: id }), []);
  const onDrop = useCallback((id) => {
    if (latest.current.chosen.card === id) latest.current.playCard();
  }, []);
  const onTarget = useCallback((event) => {
    const { targets: all, chosen: current, pickMarble: pick } = latest.current;
    const tapped = all.find((target) => target.value === event.currentTarget.dataset.value);
    const scale = stageRef.current.offsetWidth / BOARD;
    const near = all.filter((target) => Math.hypot(target.x - tapped.x, target.y - tapped.y) * scale < CROWD_PX);
    if (near.length > 1) setCrowd({ chosen: current, values: near.map((target) => target.value) });
    else pick(tapped.value);
  }, []);
  const onCrowdPick = useCallback((event) => latest.current.pickMarble(event.currentTarget.dataset.value), []);

  const playableIds = useMemo(() => new Set(chosen.isPlayed ? [] : options.map((option) => option.card)), [chosen.isPlayed, options]);
  const pills = useMemo(() => new Map(state.hand.map((card) => [card.id, pillOf(options, card.id)])), [state.hand, options]);
  const mustThrow = Boolean(state.pending) || isThrowing;
  const isAlarmed = isMyTurn && !chosen.isPlayed && mustThrow;
  const isPicking = chosen.isPlayed && (step?.play?.kind === "takeCard" || chosen.taken !== undefined);
  // the pick stays until its card is answered and the others are back in their fan, so nothing in it vanishes mid-flight
  const isPickAnswered = pick !== null && state.plays !== pick.plays;
  const livePick = pick && !(pick.isBack && isPickAnswered) ? pick : null;
  const isPickShown = isPicking || livePick !== null;

  // the moves the picked card could still make, drawn on the board until one is sent
  const previewed = chosen.card && isMyTurn ? narrowed(options, chosen).filter((option) => option.moves?.length === 1) : [];
  // the pile holds this round's cards, the last round's until the deal clears them, and a card just played before the server has it
  const pileRound = dealAt !== null && !hasDealStarted ? state.round - 1 : state.round;
  const played = chosen.isPlayed && pickedCard && !shownCard ? [{ card: pickedCard, seat: mySeat, thrown: mustThrow, round: state.round }] : [];
  const pile = [...state.pile, ...played].filter((entry) => entry.round === pileRound);

  const prompt = (() => {
    if (refusal) return { text: refusal, isAlarm: true };
    if (mySeat === -1) return state.winner === null && hasTurnStarted ? { text: `${nameOf(seats[state.turn], conversation, meId)}'s turn` } : null;
    if (!isMyTurn) return null;
    if (state.pending) return { text: "Discard a card!", isAlarm: true };
    if (throwsHand)
      return { text: "No cards available", isAlarm: true, buttons: [{ label: "Discard all", look: "all", onClick: () => send({ key: throwsHand.key }) }] };
    if (isThrowing) return { text: "No cards available, please discard", isAlarm: true };
    if (step?.actions) {
      const labels = { move: `Move ${pickedCard.rank}`, new: "New marble", discard: "Discard" };
      return {
        text: "What do you want to do?",
        isOverCards: true,
        buttons: step.actions.map((action) => ({ label: labels[action], look: "choice", onClick: () => choose({ ...chosen, action }) })),
      };
    }
    if (crowded.length > 0) return { text: "Which marble? Tap its number" };
    if (step?.marbles) return { text: "Choose a marble" };
    if (step?.steps)
      return {
        text: "Choose steps",
        isOverCards: true,
        buttons: step.steps.map((steps) => ({ label: String(steps), look: "steps", onClick: () => choose({ ...chosen, steps }) })),
      };
    if (step?.seconds) return { text: "Choose the other marble" };
    if (step?.play?.kind === "takeCard") return { text: "Choose a card" };
    return null;
  })();

  const stageRef = useRef(null);
  const effectsRef = useRef(null);
  const pileTopRef = useRef(null);
  const shoeRef = useRef(null);
  const fanRefs = useRef({});
  const marbles = useRef(new Map());
  const register = useCallback((key, element) => {
    if (element) marbles.current.set(key, element);
    else marbles.current.delete(key);
  }, []);

  useLayoutEffect(() => {
    if (!chosen.isPlayed) return undefined;
    const flight = isStill ? null : flyToPile(pileTopRef.current, playedFrom.current);
    if (flight) flight.finished.then(SOUNDS.cardDown, () => {});
    else SOUNDS.cardDown();
    return () => flight?.finish();
  }, [chosen.isPlayed, chosen.card, isStill]);

  // keyed on the play count, so a view sent again with the same play never cuts the one showing short
  const shownPlays = useRef(state.plays);
  useLayoutEffect(() => {
    const before = shownPlays.current;
    shownPlays.current = state.plays;
    const { state: current } = latest.current;
    if (isStill || !current.lastPlay || current.plays !== before + 1) return undefined;
    const stage = stageRef.current;
    const playView = {
      ...view,
      mode: current.mode,
      scale: stage.offsetWidth / BOARD,
      mySeat,
      team: current.team,
      winners: current.winners,
      placeOf: (marble) => current.marbles[marble.owner][marble.id],
    };
    const { seat, card } = current.lastPlay;
    const handOf = (owner) => (owner === mySeat ? handRef.current : fanRefs.current[owner])?.getBoundingClientRect();
    return playOut(current.lastPlay, playView, {
      stage,
      effects: effectsRef.current,
      marbles: marbles.current,
      pileCards: [...stage.querySelectorAll("[data-pile]")],
      // a card you played flew to the pile the moment you played it, and one put down earlier is already there
      playedFrom: card?.id === flownId.current || current.lastPlay.shownFirst ? null : handOf(seat),
      // the card you took turns over from wherever it is on its way to the middle, or from the middle once the pick has gone
      takenFrom: seat === mySeat ? (stage.querySelector("[data-taken]")?.getBoundingClientRect() ?? tappedTo.current) : handOf(nextOf(seat)),
      myHand: handRef.current,
    });
  }, [state.plays, isStill, view, mySeat, nextOf]);

  // each other player's fan of hidden cards is kept by seat, so a card can fly from or to it
  const keepFans = useMemo(
    () =>
      Array.from({ length: seatCount }, (_, seat) => (element) => {
        fanRefs.current[seat] = element;
      }),
    [seatCount]
  );
  const isPlaying = session.status === "playing";
  // one clock object for the turn, so a player's corner only redraws when something it shows has changed
  const clockSeat = isPlaying && hasTurnStarted ? session.turn : null;
  const clock = useMemo(
    () => ({ startsAt: timing.turnStartsAt, ms: session.turnMs ?? session.turnSeconds * 1000, seconds: session.turnSeconds }),
    [timing.turnStartsAt, session.turnMs, session.turnSeconds]
  );
  const playerAt = (seat) => ({
    seat: seats[seat],
    sayer: sayerAt(seats[seat], seat),
    conversation,
    meId,
    colour: PALETTE[tones[seat]],
    clock: clockSeat === seat ? clock : null,
    tag: state.pending?.seat === seat ? "DISCARD" : null,
    home: homeOf(state.marbles[seat]),
    team: isTeams ? "AB"[state.team[seat]] : null,
  });
  // the seat drawn at the bottom shows its marbles home, as your cards are below it; everyone else shows their hidden cards
  const players = state.marbles.map((_, seat) => {
    const shown = shownSeatOf(seat, view);
    const corner = CORNERS[seatCount][shown];
    const isBottom = shown === 0;
    return { seat, corner, isBottom };
  });

  return (
    <ModeContext.Provider value={state.mode}>
      <Box sx={{ position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {isMyTurn && pickedCard && !chosen.isPlayed && <Banner key={pickedCard.id} card={pickedCard} tones={handTones} />}
        {/* the board is measured against both sides of the space it is given, keeping room for the players at its corners */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "grid",
            placeItems: "center",
            containerType: "size",
            px: isTeams ? 0 : 1,
            overflowX: isTeams ? "clip" : "visible",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: boardWidth,
              aspectRatio: "1",
              // a grid centres its item only while it fits, so a board wider than the screen is centred by its own width, overflowing both sides alike
              ...(isTeams && { justifySelf: "start", ml: `calc((100cqw - ${boardWidth}) / 2)` }),
            }}
          >
            <Box
              ref={stageRef}
              data-board
              onClick={(event) => {
                if (event.target !== event.currentTarget) return;
                setCrowd(null);
                if (!chosen.isPlayed) setChoice({ plays: state.plays });
              }}
              sx={{ position: "absolute", inset: 0, userSelect: "none" }}
            >
              <Box
                component="img"
                alt=""
                src={boardArt.boardShadow}
                sx={{ position: "absolute", inset: `-${SHADOW_SPILL}%`, width: `${100 + SHADOW_SPILL * 2}%`, pointerEvents: "none" }}
              />
              <Box component="img" alt="Jackaroo board" src={boardArt.board} sx={{ position: "absolute", inset: 0, width: "100%", pointerEvents: "none" }} />
              <Marks tones={tones} view={view} shut={shutHoles} />
              <Swirls view={view} isStill={isStill} />
              <Shoe ref={shoeRef} at={view.layout.shoe} />
              <Pile ref={pileTopRef} pile={pile} tonesOf={tonesOf} at={view.layout.pile} />
              {!isStill && dealAt !== null && hasDealStarted && !hasDeckGone && (
                <Deck key={state.round} left={state.deal.left} dealt={state.deal.each * seatCount} at={view.layout.shoe} />
              )}
              {state.pending && <DiscardStamp at={view.layout.pile} />}
              <ShutHome holes={shutHoles} view={view} />
              <Marbles
                marbles={state.marbles}
                tones={tones}
                view={view}
                winners={state.winners}
                glowsAfter={isFresh && !isStill && state.lastPlay ? lengthOf(state.lastPlay) : 0}
                register={register}
              />
              <Preview moves={previewed.map((option) => option.moves[0])} marbles={state.marbles} tones={tones} view={view} />
              <TurnTrail turn={isPlaying ? session.turn : null} startsAt={timing.turnStartsAt} view={view} isStill={isStill} />
              <Box ref={effectsRef} sx={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
              <Targets targets={targets} onPick={onTarget} />
              {crowded.length > 0 && <Crowd targets={crowded} onPick={onCrowdPick} />}
              {isPickShown && (
                <TheirCards
                  count={livePick?.count ?? state.hands[victim]}
                  fan={fanRefs.current[victim]}
                  at={view.layout.pile}
                  taken={livePick?.taken ?? null}
                  isReady={Boolean(shownCard)}
                  isAnswered={isPickAnswered}
                  isStill={isStill}
                  onTake={take}
                  onBack={onPickBack}
                />
              )}
            </Box>
            {players.map(({ seat, corner, isBottom }) => (
              <Box key={seat} sx={{ position: "absolute", zIndex: 2, ...placeOf(corner) }}>
                {isBottom ? (
                  <Player {...playerAt(seat)} isBelow onLeave={seat === mySeat && isPlaying ? onLeave : null} />
                ) : (
                  <Player
                    {...playerAt(seat)}
                    cardsHeld={state.hands[seat] - (chosen.taken !== undefined && seat === victim ? 1 : 0) - (bonusSeat === seat ? 1 : 0)}
                    isHandAway={isPickShown && seat === victim}
                    arrival={arrivals[seat]}
                    shoeRef={shoeRef}
                    isStill={isStill}
                    isOnRight={ON_RIGHT.includes(corner)}
                    isBelow={corner.startsWith("bottom")}
                    isCompact={isTeams && corner.startsWith("top")}
                    ref={keepFans[seat]}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ position: "relative", flexShrink: 0, containerType: "inline-size" }}>
          <Prompt {...prompt} isOverHand={mySeat !== -1} />
          {mySeat !== -1 && !isResultShown && (
            <Hand
              ref={handRef}
              cards={hand}
              tones={handTones}
              pickedId={chosen.isPlayed ? null : chosen.card}
              awayId={chosen.isPlayed ? chosen.card : null}
              playableIds={playableIds}
              isMyTurn={isMyTurn}
              isGreyed={(!isMyTurn && state.winner === null) || Boolean(prompt?.isOverCards)}
              isAlarmed={isAlarmed}
              pills={pills}
              onPick={onCard}
              onSelect={onSelect}
              onDrop={onDrop}
              shoeRef={shoeRef}
              arrival={arrivals[mySeat]}
              isStill={isStill}
            />
          )}
        </Box>
      </Box>
    </ModeContext.Provider>
  );
};

export default memo(JackarooBoard);
