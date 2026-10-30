import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
import { useReducedMotion } from "motion/react";
import { useSelector } from "react-redux";

import { selectViewReceivedAt } from "@/redux/slices/gameSlice";
import art from "@/sections/chat/game/games/jackaroo/art";
import Banner from "@/sections/chat/game/games/jackaroo/Banner";
import { narrowed, nextStep, pillOf, THROWS } from "@/sections/chat/game/games/jackaroo/choices";
import { marbleKey, pointOf } from "@/sections/chat/game/games/jackaroo/geometry";
import Hand from "@/sections/chat/game/games/jackaroo/Hand";
import layout from "@/sections/chat/game/games/jackaroo/layout.json";
import PALETTE, { toneOf } from "@/sections/chat/game/games/jackaroo/palette";
import { Crowd, Marbles, Marks, Preview, ShutHome, Swirls, Targets } from "@/sections/chat/game/games/jackaroo/Pieces";
import Player from "@/sections/chat/game/games/jackaroo/Players";
import { BONUS, DEAL, dealStartOf, flyToPile, lengthOf, playOut } from "@/sections/chat/game/games/jackaroo/playback";
import Prompt from "@/sections/chat/game/games/jackaroo/Prompt";
import { preloadSounds, SOUNDS } from "@/sections/chat/game/games/jackaroo/sounds";
import { Deck, DiscardStamp, Pile, Shoe, TheirCards } from "@/sections/chat/game/games/jackaroo/Table";
import useHasPassed from "@/sections/chat/game/useHasPassed";
import { firstNameIn } from "@/utils/groups";

const SHADOW_SPILL = (layout.sprites.boardShadow / layout.board - 1) * 50;
// the players sit just off two corners of the board, over its rim, so the board leaves them this much height
const RIM_OVERLAP = 14;
// the board's bottom left corner is empty past its scalloped edge, so your corner rises into it and stays clear of the prompt centred over your cards
const CORNER_OVERLAP = 52;
const PLAYERS_ROOM = 112;
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

// the board as the reference lays it out: the other player off its top right, you off its bottom left, and your cards at the foot
const NO_HOMES = [];

const JackarooBoard = ({ state, seats, conversation, session, onMove, onLeave }) => {
  const meId = useSelector((store) => store.user.user._id);
  useEffect(preloadSounds, []);
  const isStill = useReducedMotion();
  const mySeat = seats.findIndex((seat) => seat.user === meId);
  const isTurned = mySeat === 1;
  const rival = mySeat === -1 ? 1 : 1 - mySeat;
  const [firstTone, secondTone] = [toneOf(state, 0), toneOf(state, 1)];
  const tones = useMemo(() => [firstTone, secondTone], [firstTone, secondTone]);
  const handTones = useMemo(() => ({ mine: tones[mySeat === -1 ? 0 : mySeat], theirs: tones[rival] }), [tones, mySeat, rival]);
  const tonesOf = useCallback((seat) => ({ mine: tones[seat], theirs: tones[1 - seat] }), [tones]);

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
  const bonusSeat = isBonusFresh && !hasBonusCome ? state.lastPlay.seat : null;
  const hand = useMemo(() => (bonusSeat === mySeat ? state.hand.slice(0, -1) : state.hand), [bonusSeat, mySeat, state.hand]);
  useEffect(() => {
    if (isBonusFresh && hasBonusCome) SOUNDS.cardIn(0.6);
  }, [isBonusFresh, hasBonusCome]);
  // each player's new cards come from the deal or, earned, as a bonus
  const arrivals = useMemo(
    () =>
      [0, 1].map((seat) => {
        if (state.lastPlay?.bonus && state.lastPlay.seat === seat) return { kind: "bonus", at: 0 };
        return dealAt === null ? null : { kind: "deal", at: dealAt, isFirst: state.turn === seat, isOpening: state.plays === 0 };
      }),
    [state.lastPlay, state.turn, state.plays, dealAt]
  );
  // once a play is sent the hand waits for the server's answer, since a second tap would only be refused
  const [sentAt, setSentAt] = useState(null);
  // a card you put down is yours to finish as soon as it lands, so its choices never wait on the clock
  const shownCard = state.shown?.seat === mySeat ? state.shown.card : null;
  const isMyTurn = mySeat !== -1 && state.turn === mySeat && state.winner === null && sentAt !== state.plays && (hasTurnStarted || Boolean(shownCard));
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
  const chosen = choice.plays === state.plays ? choice : { plays: state.plays, ...(shownCard && { card: shownCard.id, isPlayed: true }) };
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
    setSentAt(state.plays);
    const result = await onMove(move, { isQuiet: true });
    if (result?.meta?.requestStatus === "rejected") {
      setSentAt(null);
      setChoice({ plays: state.plays });
      setPick(null);
      setRefusal(result.payload);
    }
  };

  // each answer narrows the card's plays, and the play goes as soon as only one is left; a card with choices still to make goes down first
  const choose = (next) => {
    const after = nextStep(options, next);
    if (after.play && after.play.kind !== "takeCard") send({ key: after.play.key });
    else if (!state.shown) send({ show: next.card });
    setChoice(next);
  };

  // a played card flies to the pile from its own place in the hand, measured before the hand hides it
  const playedFrom = useRef(null);
  const flownId = useRef(null);
  const handRef = useRef(null);
  const playCard = () => {
    playedFrom.current = handRef.current?.querySelector(`[data-card="${chosen.card}"]`)?.getBoundingClientRect() ?? null;
    flownId.current = chosen.card;
    choose({ ...chosen, isPlayed: true });
  };
  // the card you take from them is sent at once and stays lifted until the server shows what it was
  const [pick, setPick] = useState(null);
  const onPickBack = useCallback(() => setPick((current) => current && { ...current, isBack: true }), []);
  const tappedTo = useRef(null);
  const take = (index, rect) => {
    tappedTo.current = rect;
    setPick({ plays: state.plays, count: state.hands[rival], taken: index, isBack: false });
    setChoice({ ...chosen, taken: index });
    send({ key: step.play.key, taken: index });
  };

  const pickMarble = (value) => {
    const marble = parseMarble(value);
    choose(step.marbles ? { ...chosen, marble } : { ...chosen, second: marble });
  };
  // the marbles the picked card could take next, where they sit on screen
  const choosable = step?.marbles ?? step?.seconds ?? [];
  const targets = choosable.map((marble) => ({
    value: marbleKey(marble),
    ...pointOf(state.marbles[marble.owner][marble.id], marble.owner, isTurned),
    label: marble.owner === mySeat ? "Your marble" : "Their marble",
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
    const scale = stageRef.current.offsetWidth / layout.board;
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
        buttons: step.actions.map((action) => ({ label: labels[action], look: "choice", onClick: () => choose({ ...chosen, action }) })),
      };
    }
    if (crowded.length > 0) return { text: "Which marble? Tap its number" };
    if (step?.marbles) return { text: "Choose a marble" };
    if (step?.steps)
      return {
        text: "Choose steps",
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
    const view = {
      scale: stage.offsetWidth / layout.board,
      isTurned,
      mySeat,
      winner: current.winner,
      placeOf: (marble) => current.marbles[marble.owner][marble.id],
    };
    const { seat, card } = current.lastPlay;
    const handOf = (owner) => (owner === mySeat ? handRef.current : fanRefs.current[owner])?.getBoundingClientRect();
    return playOut(current.lastPlay, view, {
      stage,
      effects: effectsRef.current,
      marbles: marbles.current,
      pileCards: [...stage.querySelectorAll("[data-pile]")],
      // a card you played flew to the pile the moment you played it, and one put down earlier is already there
      playedFrom: card?.id === flownId.current || current.lastPlay.shownFirst ? null : handOf(seat),
      // the card you took turns over from wherever it is on its way to the middle, or from the middle once the pick has gone
      takenFrom: seat === mySeat ? (stage.querySelector("[data-taken]")?.getBoundingClientRect() ?? tappedTo.current) : handOf(1 - seat),
      myHand: handRef.current,
    });
  }, [state.plays, isStill, isTurned, mySeat]);

  const top = isTurned ? 0 : 1;
  const keepFan = useCallback(
    (element) => {
      fanRefs.current[top] = element;
    },
    [top]
  );
  const bottom = 1 - top;
  const isPlaying = session.status === "playing";
  // one clock object for the turn, so a player's corner only redraws when something it shows has changed
  const clockSeat = isPlaying && hasTurnStarted ? session.turn : null;
  const clock = useMemo(() => ({ startsAt: timing.turnStartsAt, seconds: session.turnSeconds }), [timing.turnStartsAt, session.turnSeconds]);
  const playerAt = (seat) => ({
    seat: seats[seat],
    conversation,
    meId,
    colour: PALETTE[tones[seat]],
    clock: clockSeat === seat ? clock : null,
    tag: state.pending?.seat === seat ? "DISCARD" : null,
    home: homeOf(state.marbles[seat]),
  });

  return (
    <Box sx={{ position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      {isMyTurn && pickedCard && !chosen.isPlayed && <Banner key={pickedCard.id} card={pickedCard} tones={handTones} />}
      {/* the board is measured against both sides of the space it is given, keeping room for the players at its corners */}
      <Box sx={{ flex: 1, minHeight: 0, display: "grid", placeItems: "center", containerType: "size", px: 1 }}>
        <Box sx={{ position: "relative", width: `min(100cqw, calc(100cqh - ${PLAYERS_ROOM}px))`, aspectRatio: "1" }}>
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
              src={art.boardShadow}
              sx={{ position: "absolute", inset: `-${SHADOW_SPILL}%`, width: `${100 + SHADOW_SPILL * 2}%`, pointerEvents: "none" }}
            />
            <Box component="img" alt="Jackaroo board" src={art.board} sx={{ position: "absolute", inset: 0, width: "100%", pointerEvents: "none" }} />
            <Marks tones={tones} isTurned={isTurned} />
            <Swirls isTurned={isTurned} isStill={isStill} />
            <Shoe ref={shoeRef} />
            <Pile ref={pileTopRef} pile={pile} tonesOf={tonesOf} />
            {!isStill && dealAt !== null && hasDealStarted && !hasDeckGone && <Deck key={state.round} left={state.deal.left} dealt={state.deal.each * 2} />}
            {state.pending && <DiscardStamp />}
            <ShutHome seats={shutHomes} marbles={state.marbles} isTurned={isTurned} />
            <Marbles
              marbles={state.marbles}
              tones={tones}
              isTurned={isTurned}
              winner={state.winner}
              glowsAfter={isFresh && !isStill && state.lastPlay ? lengthOf(state.lastPlay) : 0}
              register={register}
            />
            <Preview moves={previewed.map((option) => option.moves[0])} marbles={state.marbles} tones={tones} isTurned={isTurned} />
            <Box ref={effectsRef} sx={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
            <Targets targets={targets} onPick={onTarget} />
            {crowded.length > 0 && <Crowd targets={crowded} onPick={onCrowdPick} />}
            {isPickShown && (
              <TheirCards
                count={livePick?.count ?? state.hands[rival]}
                fan={fanRefs.current[rival]}
                taken={livePick?.taken ?? null}
                isAnswered={isPickAnswered}
                isStill={isStill}
                onTake={take}
                onBack={onPickBack}
              />
            )}
          </Box>
          {/* the other player sits off the board's top right corner and you off its bottom left, over the rim, as the reference seats them */}
          <Box sx={{ position: "absolute", zIndex: 2, right: 0, bottom: `calc(100% - ${RIM_OVERLAP}px)` }}>
            <Player
              {...playerAt(top)}
              cardsHeld={state.hands[top] - (chosen.taken === undefined ? 0 : 1) - (bonusSeat === top ? 1 : 0)}
              isHandAway={isPickShown}
              arrival={arrivals[top]}
              shoeRef={shoeRef}
              isStill={isStill}
              isOnRight
              ref={keepFan}
            />
          </Box>
          {/* a board narrower than the room leaves space beside it, which your corner moves out into so your name stays off the rim */}
          <Box sx={{ position: "absolute", zIndex: 2, left: "calc(-1 * min(48px, (100cqw - 100%) / 2))", top: `calc(100% - ${CORNER_OVERLAP}px)` }}>
            <Player {...playerAt(bottom)} onLeave={bottom === mySeat && isPlaying ? onLeave : null} />
          </Box>
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
            isGreyed={!isMyTurn && state.winner === null}
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
  );
};

export default memo(JackarooBoard);
