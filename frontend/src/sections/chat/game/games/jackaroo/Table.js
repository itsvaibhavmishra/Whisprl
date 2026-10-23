import { forwardRef, memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { useForkRef } from "@mui/material/utils";

import CardBack, { BACK_RATIO } from "@/sections/chat/game/games/jackaroo/CardBack";
import CardFace, { CARD_RATIO } from "@/sections/chat/game/games/jackaroo/CardFace";
import FONTS from "@/sections/chat/game/games/jackaroo/fonts";
import { share } from "@/sections/chat/game/games/jackaroo/geometry";
import layout from "@/sections/chat/game/games/jackaroo/layout.json";
import { arriveAsBonus, DEAL, dealOrder, flyBack, flyIn, growFrom } from "@/sections/chat/game/games/jackaroo/playback";
import { SOUNDS } from "@/sections/chat/game/games/jackaroo/sounds";
import useGlide from "@/sections/chat/game/games/jackaroo/useGlide";

const { card: CARD, pile: PILE, shoe: SHOE } = layout;
const CARD_HEIGHT = CARD.width / CARD_RATIO;
// the card under the top one shows only as an edge, so the pile reads as a pile without hiding the board
const SHOWN = 2;

// a card centred on a point by its own shape, since the back is taller than the face
const cardAt = ({ x, y }, ratio = CARD_RATIO) => ({
  position: "absolute",
  left: share(x - CARD.width / 2),
  top: share(y - CARD.width / ratio / 2),
  width: share(CARD.width),
  pointerEvents: "none",
});

// the red queen's pick fills this share of the board's height, centred on the pile
const PICK_HEIGHT = 44;
const stampDown = keyframes`from { transform: translate(-50%, -50%) rotate(-10deg) scale(1.8); opacity: 0; } to { transform: translate(-50%, -50%) rotate(-10deg) scale(1); opacity: 1; }`;
const popIn = keyframes`from { transform: scale(0.8); opacity: 0; } to { transform: none; opacity: 1; }`;

// a card's tilt on the pile comes from its own id, so it lies the same way for everyone and every render
const tiltOf = (id) => ([...id].reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 13) - 6;

// where new cards are dealt from: the design has no deck on the table, so it is a point in the board's centre
export const Shoe = memo(forwardRef((_, ref) => <Box ref={ref} sx={{ ...cardAt(SHOE), height: share(CARD_HEIGHT) }} />));

// the cards played so far, the last one on top; the tilt sits on an inner layer, so one flying in can be animated without undoing it
export const Pile = forwardRef(({ pile, tonesOf }, topRef) =>
  pile.slice(-SHOWN).map((played, index, shown) => {
    const isTop = index === shown.length - 1;
    return (
      // a card only thrown away lands greyed, as the reference shows a discard
      <Box
        key={played.card.id}
        ref={isTop ? topRef : undefined}
        data-pile
        sx={{ ...cardAt(PILE), filter: played.thrown ? "grayscale(0.7) brightness(0.82)" : "none" }}
      >
        <Box
          sx={{
            transform: `rotate(${isTop ? tiltOf(played.card.id) / 3 : tiltOf(played.card.id)}deg)`,
            filter: "drop-shadow(0 6px 10px rgba(40, 20, 6, 0.4))",
          }}
        >
          <CardFace card={played.card} tones={tonesOf(played.seat)} />
        </Box>
      </Box>
    );
  })
);

const placesInFan = (fan) => [...(fan?.querySelectorAll("[data-back]") ?? [])].map((back) => back.getBoundingClientRect());

// the red queen's pick: each of the other player's cards grows out of its place in their fan to lie face down and large in the board's centre, and the cards not taken fly back
export const TheirCards = ({ count, fan, taken, isAnswered, isStill, onTake, onBack }) => {
  const rowRef = useRef(null);
  // the card you take sets off for the middle at once, so the server's answer arrives while it is already moving
  const [shift, setShift] = useState({ x: 0, y: 0 });
  const take = (index, card) => {
    const row = rowRef.current.getBoundingClientRect();
    const box = card.getBoundingClientRect();
    const middle = { x: row.left + row.width / 2, y: row.top + row.height / 2 };
    setShift({ x: middle.x - (box.left + box.width / 2), y: middle.y - (box.top + box.height / 2) });
    SOUNDS.cardIn();
    onTake(index, { left: middle.x - card.offsetWidth / 2, top: middle.y - card.offsetHeight / 2, width: card.offsetWidth, height: card.offsetHeight });
  };
  useEffect(() => {
    SOUNDS.fan();
  }, []);
  useLayoutEffect(() => {
    const places = placesInFan(fan);
    if (isStill || !places.length) return undefined;
    const cards = [...rowRef.current.querySelectorAll("[data-pick]")];
    const growing = cards.map((card, index) => growFrom(card, places[Math.min(index, places.length - 1)], index * DEAL.cardGap));
    return () => growing.forEach((animation) => animation.cancel());
  }, [fan, isStill]);
  useLayoutEffect(() => {
    if (taken === null) return undefined;
    const places = placesInFan(fan);
    if (isStill || !places.length) {
      onBack();
      return undefined;
    }
    // their fan already holds one card fewer, so each card after the taken one goes back a place to the left
    const placeOf = (index) => places[Math.min(index < taken ? index : index - 1, places.length - 1)];
    const cards = [...rowRef.current.querySelectorAll("[data-pick]")];
    const going = cards.flatMap((card, index) => (index === taken ? [] : [flyBack(card, placeOf(index))]));
    Promise.allSettled(going.map((animation) => animation.finished)).then(onBack);
    return () => going.forEach((animation) => animation.cancel());
  }, [taken, fan, isStill, onBack]);
  return (
    <Stack
      ref={rowRef}
      direction="row"
      alignItems="center"
      justifyContent="center"
      sx={{
        position: "absolute",
        zIndex: 4,
        left: "6%",
        right: "6%",
        top: `${PILE.y / 10 - PICK_HEIGHT / 2}%`,
        bottom: `${100 - PILE.y / 10 - PICK_HEIGHT / 2}%`,
      }}
    >
      {Array.from({ length: count }, (_, index) => {
        const tilt = `rotate(${(index - (count - 1) / 2) * 5}deg)`;
        return (
          <ButtonBase
            key={index}
            data-taken={index === taken || undefined}
            aria-label={`Their card ${index + 1}`}
            disabled={taken !== null}
            onClick={(event) => take(index, event.currentTarget)}
            sx={{
              width: "21%",
              mx: "1%",
              zIndex: index === taken ? 1 : "auto",
              borderRadius: "8%",
              transform: index === taken ? `translate(${shift.x}px, ${shift.y}px) scale(1.04)` : tilt,
              filter: index === taken ? "drop-shadow(0 0 10px rgba(255, 228, 140, 0.95))" : "drop-shadow(0 8px 12px rgba(0, 0, 0, 0.5))",
              transition: index === taken ? "transform 360ms cubic-bezier(0.2, 0.8, 0.3, 1)" : "transform 160ms ease",
              "&:hover, &.Mui-focusVisible": { transform: `${tilt} translateY(-8px)` },
            }}
          >
            {/* once the server says what the card was, the play turns it over from here, so it is hidden under that */}
            <Box data-pick sx={{ width: "100%", opacity: index === taken && isAnswered ? 0 : 1 }}>
              <CardBack />
            </Box>
          </ButtonBase>
        );
      })}
    </Stack>
  );
};

// a big red stamp over the pile while a ten's victim chooses what to throw away
export const DiscardStamp = () => (
  <Typography
    sx={{
      position: "absolute",
      zIndex: 3,
      left: share(PILE.x),
      top: share(PILE.y),
      transform: "translate(-50%, -50%) rotate(-10deg)",
      px: "2.5cqmin",
      border: "0.7cqmin solid #d3192d",
      borderRadius: "1.6cqmin",
      bgcolor: "rgba(255, 250, 240, 0.88)",
      color: "#d3192d",
      fontFamily: FONTS.body,
      fontWeight: 800,
      fontSize: "8cqmin",
      lineHeight: 1.15,
      letterSpacing: "0.04em",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
      pointerEvents: "none",
      animation: `${stampDown} 260ms cubic-bezier(0.3, 0.7, 0.4, 1.2)`,
      "@media (prefers-reduced-motion: reduce)": { animation: "none" },
    }}
  >
    DISCARD
  </Typography>
);

// the round's deck in the board's centre while it deals, counting down as each card leaves it
export const Deck = ({ left, dealt }) => {
  const [gone, setGone] = useState(0);
  useEffect(() => {
    const deal = (index) => {
      setGone(index + 1);
      SOUNDS.cardIn(0.3);
    };
    const timers = Array.from({ length: dealt }, (_, index) => setTimeout(() => deal(index), DEAL.firstCardAt + index * DEAL.cardGap));
    return () => timers.forEach(clearTimeout);
  }, [dealt]);
  return (
    <Box
      sx={{ ...cardAt(SHOE, BACK_RATIO), zIndex: 2, animation: `${popIn} 200ms ease-out`, "@media (prefers-reduced-motion: reduce)": { animation: "none" } }}
    >
      {[2, 1, 0].map((layer) => (
        <Box
          key={layer}
          sx={{
            position: layer ? "absolute" : "relative",
            inset: 0,
            transform: `translate(${layer * 2}px, ${layer * -2}px)`,
            filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4))",
          }}
        >
          <CardBack />
        </Box>
      ))}
      <Typography
        sx={{
          position: "absolute",
          left: "50%",
          bottom: -6,
          transform: "translate(-50%, 100%)",
          px: 1,
          borderRadius: 99,
          bgcolor: "rgba(20, 12, 8, 0.85)",
          color: "#f6ebdd",
          fontFamily: FONTS.body,
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        {left - gone}
      </Typography>
    </Box>
  );
};

// someone else's hand, face down, so the cards they hold can be counted but not read; new ones fly in from the deck or swell in as a bonus
export const Fan = memo(
  forwardRef(({ count, arrival, shoeRef, isStill, isAway, size = 26 }, ref) => {
    const rowRef = useRef(null);
    const fanRef = useForkRef(rowRef, ref);
    useGlide(rowRef, isStill);
    const lastCount = useRef(arrival?.isOpening ? 0 : count);
    useLayoutEffect(() => {
      const before = lastCount.current;
      lastCount.current = count;
      if (isStill || !arrival || count <= before) return;
      // a deal fills hands the round emptied, so the card they last played never stays behind as one of the new ones
      const backs = [...rowRef.current.querySelectorAll("[data-back]")].slice(arrival.kind === "deal" ? 0 : before);
      if (arrival.kind === "bonus") backs.forEach((back) => arriveAsBonus(back, arrival.at));
      const shoe = shoeRef?.current?.getBoundingClientRect();
      if (arrival.kind === "deal" && shoe) backs.forEach((back, index) => flyIn(back, shoe, arrival.at + dealOrder(index, arrival.isFirst)));
    }, [count, arrival, shoeRef, isStill]);
    return (
      <Box ref={fanRef} sx={{ display: "flex", alignItems: "flex-end", height: size / 0.6, pl: `${size * 0.3}px`, visibility: isAway ? "hidden" : "visible" }}>
        {Array.from({ length: count }, (_, index) => {
          const spread = index - (count - 1) / 2;
          return (
            <Box
              key={index}
              data-glide={index}
              sx={{
                width: size,
                ml: `${-size * 0.3}px`,
                transform: `rotate(${spread * 6}deg) translateY(${Math.abs(spread) * 1.5}px)`,
                filter: "drop-shadow(0 2px 3px rgba(0, 0, 0, 0.45))",
              }}
            >
              <Box data-back>
                <CardBack />
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  })
);
