// Effects drawn over the board for a moment, each made as its own element and removed once its animation ends.
import FONTS from "@/sections/chat/game/games/jackaroo/fonts";

const CONFETTI = ["#4cd964", "#ffd23f", "#ff5fa2", "#4aa8ff"];

// an element of an effect, placed at a point on the board
const place = (layer, point, style) => {
  const element = document.createElement("div");
  Object.assign(element.style, { position: "absolute", left: `${point.x / 10}%`, top: `${point.y / 10}%`, pointerEvents: "none", ...style });
  layer.appendChild(element);
  return element;
};

// a piece of an effect centred on a point and sized in shares of the board
export const spawn = (layer, point, size, style) => place(layer, point, { width: `${size}%`, height: `${size}%`, margin: `-${size / 2}%`, ...style });

export const removedWhenDone = (animation) => {
  const remove = () => animation.effect.target.remove();
  animation.finished.then(remove, remove);
  return animation;
};

// a puff of white dust where a marble is knocked out
export const dust = (layer, point, scale) => {
  const soft = "radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.55) 45%, rgba(255, 255, 255, 0) 70%)";
  const puff = spawn(layer, point, 8, { borderRadius: "50%", background: soft });
  const pieces = [
    puff.animate(
      [
        { transform: "scale(0.3)", opacity: 1 },
        { transform: "scale(1.9)", opacity: 0 },
      ],
      { duration: 520, easing: "ease-out" }
    ),
  ];
  for (let index = 0; index < 7; index += 1) {
    const angle = (index / 7) * Math.PI * 2 + Math.random() * 0.4;
    const reach = (26 + Math.random() * 22) * scale;
    const wisp = spawn(layer, point, 4, { borderRadius: "50%", background: soft });
    pieces.push(
      wisp.animate(
        [
          { transform: "translate(0, 0) scale(0.6)", opacity: 0.9 },
          { transform: `translate(${Math.cos(angle) * reach}px, ${Math.sin(angle) * reach}px) scale(1.5)`, opacity: 0 },
        ],
        { duration: 560 + Math.random() * 120, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" }
      )
    );
  }
  return pieces.map(removedWhenDone);
};

// the board jolts a little under a knock-out, settling within a moment
export const shake = (stage, scale) => {
  const reach = Math.max(2, 7 * scale);
  return stage.animate(
    [
      { transform: "translate(0, 0)" },
      { transform: `translate(${-reach}px, ${reach * 0.4}px)` },
      { transform: `translate(${reach * 0.8}px, ${-reach * 0.5}px)` },
      { transform: `translate(${-reach * 0.5}px, ${reach * 0.3}px)` },
      { transform: `translate(${reach * 0.2}px, 0)` },
      { transform: "translate(0, 0)" },
    ],
    { duration: 320, easing: "ease-out" }
  );
};

// gold glitter twinkling round the hole a marble has just settled into at home
export const glitter = (layer, point, scale) =>
  Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * Math.PI * 2 + Math.random() * 0.5;
    const reach = (18 + Math.random() * 34) * scale;
    const star = spawn(layer, point, 1.6 + Math.random() * 1.4, {
      background: "radial-gradient(circle, #fffbe8 0%, #ffe07a 35%, rgba(255, 200, 70, 0) 70%)",
      clipPath: "polygon(50% 0, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0 50%, 39% 39%)",
    });
    return removedWhenDone(
      star.animate(
        [
          { transform: "translate(0, 0) scale(0) rotate(0deg)", opacity: 0 },
          { transform: `translate(${Math.cos(angle) * reach * 0.6}px, ${Math.sin(angle) * reach * 0.6}px) scale(1.3) rotate(90deg)`, opacity: 1, offset: 0.35 },
          { transform: `translate(${Math.cos(angle) * reach}px, ${Math.sin(angle) * reach}px) scale(0) rotate(180deg)`, opacity: 0 },
        ],
        { duration: 700 + Math.random() * 400, delay: Math.random() * 180, easing: "ease-out", fill: "backwards" }
      )
    );
  });

// the winning home bursts into gold beads
export const goldBurst = (layer, point, scale) =>
  Array.from({ length: 10 }, (_, index) => {
    const angle = (index / 10) * Math.PI * 2 + Math.random() * 0.5;
    const reach = (40 + Math.random() * 50) * scale;
    const bead = spawn(layer, point, 1.2 + Math.random() * 1.2, {
      borderRadius: "50%",
      background: "radial-gradient(circle at 35% 30%, #fff 0, #ffd36b 45%, rgba(0, 0, 0, 0.45) 100%)",
    });
    return removedWhenDone(
      bead.animate(
        [
          { transform: "translate(0, 0) scale(1)", opacity: 1 },
          { transform: `translate(${Math.cos(angle) * reach}px, ${Math.sin(angle) * reach}px) scale(0.3)`, opacity: 0 },
        ],
        { duration: 520 + Math.random() * 160, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" }
      )
    );
  });

// a word called out in the game's gold lettering, centred on a point
export const goldWord = (layer, point, scale, text, size) => {
  const word = place(layer, point, {
    transform: "translate(-50%, -50%)",
    whiteSpace: "nowrap",
    font: `700 ${size * scale}px ${FONTS.display}, serif`,
    background: "linear-gradient(180deg, #fff3b0 0%, #ffd34d 45%, #f08a1c 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextStroke: `${Math.max(1, 2.4 * scale)}px #7a2a0c`,
    filter: "drop-shadow(0 3px 4px rgba(60, 20, 0, 0.5))",
  });
  word.textContent = text;
  return word;
};

// "AWESOME!" over the home lane with confetti shooting up and falling, as the reference cheers a marble home
export const awesome = (layer, point, scale) => {
  const word = goldWord(layer, point, scale, "AWESOME!", 78);
  const pieces = [
    word.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.3)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1.15)", opacity: 1, offset: 0.2 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1, offset: 0.32 },
        { transform: "translate(-50%, -62%) scale(1)", opacity: 1, offset: 0.8 },
        { transform: "translate(-50%, -80%) scale(0.96)", opacity: 0 },
      ],
      { duration: 1200, easing: "ease-out" }
    ),
  ];
  for (let index = 0; index < 18; index += 1) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    const reach = (90 + Math.random() * 90) * scale;
    const peak = { x: Math.cos(angle) * reach, y: Math.sin(angle) * reach };
    const strip = spawn(layer, point, 1.4, { height: "0.7%", borderRadius: "1px", background: CONFETTI[index % CONFETTI.length] });
    pieces.push(
      strip.animate(
        [
          { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
          { transform: `translate(${peak.x}px, ${peak.y}px) rotate(${180 + Math.random() * 180}deg)`, opacity: 1, offset: 0.45, easing: "ease-in" },
          { transform: `translate(${peak.x * 1.3}px, ${peak.y + 70 * scale}px) rotate(${400 + Math.random() * 200}deg)`, opacity: 0 },
        ],
        { duration: 1100 + Math.random() * 200, easing: "cubic-bezier(0.15, 0.7, 0.4, 1)" }
      )
    );
  }
  return pieces.map(removedWhenDone);
};
