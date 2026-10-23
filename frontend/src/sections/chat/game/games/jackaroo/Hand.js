import { forwardRef, memo, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { useForkRef } from "@mui/material/utils";

import art from "@/sections/chat/game/games/jackaroo/art";
import CardFace, { CARD_RATIO } from "@/sections/chat/game/games/jackaroo/CardFace";
import { rankOf, suitOf } from "@/sections/chat/game/games/jackaroo/cards";
import FONTS from "@/sections/chat/game/games/jackaroo/fonts";
import { BONUS, dealOrder, flyIn } from "@/sections/chat/game/games/jackaroo/playback";
import useGlide from "@/sections/chat/game/games/jackaroo/useGlide";

// how far a finger moves before a touch becomes a drag, so a tap that wobbles is still a tap
const DRAG_FROM = 8;
const PILLS = { Kill: "#c3172b", Finish: "#2e9d4a" };
// four of them span about three quarters of the width, edge to edge, as the design lays them
const CARD_WIDTH = "min(18vw, 10.5vh, 92px)";
const SLOT = `0 1 ${CARD_WIDTH}`;
const ROOM_BELOW = "clamp(20px, 5.5vh, 48px)";
// the design's picked card: a bold light blue edge round the card itself, and a blue glow beyond it
const EDGE = { boxShadow: "0 0 0 2.5px #9bd5ff, 0 0 0 4px rgba(61, 155, 255, 0.9), 0 0 16px 4px rgba(40, 130, 255, 0.75)" };
// cards that must be thrown away are outlined in red and pulse, as the reference game asks for a discard
const throb = keyframes`0%, 100% { opacity: 1; } 50% { opacity: 0.35; }`;
const ALARM = {
  boxShadow: "0 0 0 2.5px #ff5a4f, 0 0 12px 3px rgba(255, 60, 50, 0.7)",
  animation: `${throb} 1.1s ease-in-out infinite`,
  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
};
const GLOW = "drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4))";
const RESTING = "drop-shadow(0 5px 8px rgba(0, 0, 0, 0.45))";

// measured off the design's hand: the outer cards lean out about 7 degrees and sit a little lower, the inner two nearly straight
const spreadOf = (index, count) => index - (count - 1) / 2;
const tiltOf = (index, count) => spreadOf(index, count) * 4.6;
const dropOf = (index, count) => spreadOf(index, count) ** 2 * 2.2;

// the browser's own drag of an image would take the pointer away and cancel ours, so a card is never dragged that way
const stopNativeDrag = (event) => event.preventDefault();

const HandCard = memo(({ card, tones, tilt, drop, gap, isPicked, isDim, isEnabled, isAlarmed, pill, onPointerDown, onClick }) => (
  <ButtonBase
    data-card={card.id}
    data-glide={card.id}
    disabled={!isEnabled}
    onClick={onClick}
    onPointerDown={onPointerDown}
    onDragStart={stopNativeDrag}
    aria-label={`${rankOf(card)} of ${suitOf(card)}`}
    aria-pressed={isPicked}
    sx={{
      position: "relative",
      flex: SLOT,
      minWidth: 0,
      mx: gap,
      // a picked card is drawn over its neighbours, its glow included
      zIndex: isPicked ? 2 : "auto",
      display: "block",
      borderRadius: "9%",
      touchAction: "none",
      "& img": { pointerEvents: "none", WebkitUserDrag: "none" },
      // the card is turned and lifted on its own layer, so a drag can move the button freely without undoing the fan
      "& > .lift": {
        // a picked card keeps its place in the fan and only lifts a little, as the design's picked card does
        transform: `translateY(${drop - (isPicked ? 6 : 0)}px) rotate(${tilt}deg)`,
        transformOrigin: "50% 100%",
        // a card that cannot be played is darkened rather than faded, so where it overlaps another nothing shows through
        filter: isPicked ? GLOW : `${RESTING}${isDim ? " brightness(0.68) saturate(0.75)" : ""}`,
        transition: "transform 180ms ease, filter 180ms ease",
      },
      // the edge follows the card's own rounded corners, which a filter could only blur
      "& > .lift::after": {
        content: '""',
        position: "absolute",
        inset: 0,
        borderRadius: "6.5% / 4.6%",
        pointerEvents: "none",
        ...(isPicked ? EDGE : isAlarmed && ALARM),
      },
      "&.Mui-focusVisible > .lift::after": EDGE,
    }}
  >
    <Box className="lift" sx={{ position: "relative" }}>
      <CardFace card={card} tones={tones} />
      {/* the card's back, shown only while it is dealt or earned face down, with the gold +1 a bonus card carries */}
      <Box data-back sx={{ position: "absolute", inset: 0, opacity: 0, pointerEvents: "none" }}>
        <Box component="img" alt="" src={art.cardBack} sx={{ display: "block", width: "100%", height: "100%", objectFit: "cover", borderRadius: "7% / 5%" }} />
        <Typography
          data-plus
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            opacity: 0,
            fontFamily: FONTS.display,
            fontWeight: 700,
            fontSize: 28,
            color: "#ffd34d",
            WebkitTextStroke: "1.5px #5a2a08",
            textShadow: "0 2px 6px rgba(0, 0, 0, 0.6)",
          }}
        >
          +1
        </Typography>
      </Box>
      {pill && (
        <Box
          sx={{
            position: "absolute",
            zIndex: 1,
            top: 0,
            right: "8%",
            transform: "translateY(-45%)",
            px: "7px",
            borderRadius: 99,
            bgcolor: PILLS[pill],
            color: "#fff",
            fontFamily: FONTS.body,
            fontWeight: 700,
            fontSize: 11,
            lineHeight: "17px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.35)",
          }}
        >
          {pill}
        </Box>
      )}
    </Box>
  </ButtonBase>
));

// what lies under a dropped card: a marble or hole it was dropped on, or the board itself
const dropTargetAt = (x, y) => {
  for (const element of document.elementsFromPoint(x, y)) {
    if (element.dataset.value !== undefined && element.closest("[data-board]")) return { value: element.dataset.value };
    if (element.dataset.board !== undefined) return { isBoard: true };
  }
  return null;
};

// your cards, fanned until your turn straightens them: one tap lifts a card, a second plays it, or drag it onto the board
const Hand = forwardRef(
  ({ cards, tones, pickedId, awayId, playableIds, isMyTurn, isGreyed, isAlarmed, pills, onPick, onSelect, onDrop, shoeRef, arrival, isStill }, ref) => {
    // a game's opening deal arrives with the hand itself, so it is dealt into an empty one
    const lastCards = useRef(arrival?.isOpening ? [] : cards);
    const rowRef = useRef(null);
    const handRef = useForkRef(rowRef, ref);
    const drag = useRef(null);
    const latest = useRef();
    latest.current = { onPick, onSelect, onDrop, pickedId };
    useGlide(rowRef, isStill);
    // how new cards arrive is read when they do, so a redraw with the same cards never replays or reopens anything
    const arrivalRef = useRef(arrival);
    arrivalRef.current = arrival;

    useLayoutEffect(() => {
      const previous = lastCards.current;
      lastCards.current = cards;
      const had = new Set(previous.map((card) => card.id));
      const arrived = cards.filter((card) => !had.has(card.id));
      const arriving = arrivalRef.current;
      if (isStill || !arriving || !arrived.length) return;
      const shoe = shoeRef.current?.getBoundingClientRect();
      arrived.forEach((card, index) => {
        const element = rowRef.current?.querySelector(`[data-card="${card.id}"]`);
        if (!element) return;
        const layers = { back: element.querySelector("[data-back]") };
        if (arriving.kind === "deal" && shoe) flyIn(element, shoe, arriving.at + dealOrder(index, arriving.isFirst), layers);
        if (arriving.kind === "bonus") {
          // a bonus card comes in from the screen's right edge, level with the hand
          const at = element.getBoundingClientRect();
          const edge = { left: window.innerWidth + 10, top: at.top - 30, width: at.width, height: at.height };
          flyIn(element, edge, arriving.at, { ...layers, flight: BONUS.flight, plus: element.querySelector("[data-plus]") });
        }
      });
    }, [cards, shoeRef, isStill]);

    // a drag moves the card with transform alone and never re-renders, so it keeps up with the finger on a slow phone
    const onPointerMove = useCallback((event) => {
      const held = drag.current;
      if (!held || event.pointerId !== held.pointer) return;
      const dx = event.clientX - held.x;
      const dy = event.clientY - held.y;
      if (!held.isDragging) {
        if (Math.hypot(dx, dy) < DRAG_FROM) return;
        held.isDragging = true;
        held.element.setPointerCapture(event.pointerId);
        held.element.style.zIndex = "10";
        if (latest.current.pickedId !== held.id) latest.current.onSelect(held.id);
      }
      held.element.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`;
    }, []);

    const onPointerUp = useCallback(
      (event) => {
        const held = drag.current;
        if (!held || event.pointerId !== held.pointer) return;
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        if (!held.isDragging) {
          drag.current = null;
          return;
        }
        const target = event.type === "pointerup" ? dropTargetAt(event.clientX, event.clientY) : null;
        const { element } = held;
        const from = element.style.transform;
        element.style.transform = "";
        element.style.zIndex = "";
        // the card glides back to the hand; if it was played, the hand drops it once the server agrees
        element.animate([{ transform: from }, { transform: "none" }], { duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)" });
        if (target) latest.current.onDrop(held.id, target);
        // the click a released drag still fires is swallowed, so letting go is never also a second tap
        held.isReleased = true;
        setTimeout(() => {
          if (drag.current === held) drag.current = null;
        }, 0);
      },
      [onPointerMove]
    );

    const onPointerDown = useCallback(
      (event) => {
        if (event.button !== 0) return;
        drag.current = { id: event.currentTarget.dataset.card, element: event.currentTarget, pointer: event.pointerId, x: event.clientX, y: event.clientY };
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);
      },
      [onPointerMove, onPointerUp]
    );

    // a drag still held when the hand goes leaves nothing listening behind it
    useEffect(
      () => () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
      },
      [onPointerMove, onPointerUp]
    );

    const onClick = useCallback((event) => {
      if (drag.current?.isReleased) return;
      latest.current.onPick(event.currentTarget.dataset.card);
    }, []);

    // a card played onto the pile leaves the row at once, while its choices are still being made
    const shown = cards.filter((card) => card.id !== awayId);
    // the design's fan sits edge to edge with the slightest overlap; the reference's row on your turn leaves small gaps
    const gap = isMyTurn ? "3px" : "-1px";

    return (
      <Box
        ref={handRef}
        // an empty hand keeps its height, so the board never jumps between a round's last card and the next deal
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          px: 2,
          pt: 3,
          pb: ROOM_BELOW,
          minHeight: `calc(${CARD_WIDTH} / ${CARD_RATIO} + 24px + ${ROOM_BELOW})`,
          flexShrink: 0,
        }}
      >
        {shown.map((card, index) => (
          <HandCard
            key={card.id}
            card={card}
            tones={tones}
            tilt={isMyTurn ? 0 : tiltOf(index, shown.length)}
            drop={isMyTurn ? 0 : dropOf(index, shown.length)}
            gap={gap}
            isPicked={pickedId === card.id}
            isDim={isMyTurn ? !playableIds.has(card.id) : isGreyed}
            isEnabled={isMyTurn && playableIds.has(card.id)}
            isAlarmed={isAlarmed}
            pill={isMyTurn ? pills.get(card.id) : null}
            onPointerDown={onPointerDown}
            onClick={onClick}
          />
        ))}
      </Box>
    );
  }
);

export default memo(Hand);
