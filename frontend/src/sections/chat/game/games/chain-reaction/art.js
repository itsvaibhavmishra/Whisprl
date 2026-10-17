const FOLDER = `${process.env.PUBLIC_URL}/games/chain-reaction`;

const art = {
  scene: `${FOLDER}/scene.webp`,
  // the masthead is drawn into this scene, so it is pinned to the top at the masthead's width to line up with it
  anchor: "top",
  // width over height, so the room can size the scene to cover the panel
  ratio: 887 / 1774,
  logo: `${FOLDER}/logo.webp`,
  cat: `${FOLDER}/cat.webp`,
  robot: `${FOLDER}/robot.webp`,
  // fetched only when music is turned on, so it never costs anyone who leaves it off
  music: `${FOLDER}/music.m4a`,
  // a station in space wants more of them than a garden at dusk, in the orbs' own colours as well as gold
  fireflies: [
    { left: 8, top: 34, every: 14, from: 1 },
    { left: 22, top: 47, every: 17, from: 6, glow: "120, 220, 255" },
    { left: 33, top: 28, every: 12, from: 3.5, glow: "190, 160, 255" },
    { left: 58, top: 38, every: 15, from: 8 },
    { left: 77, top: 30, every: 18, from: 2, glow: "120, 220, 255" },
    { left: 86, top: 52, every: 13, from: 10, glow: "255, 140, 220" },
    { left: 12, top: 70, every: 16, from: 5, glow: "190, 160, 255" },
    { left: 30, top: 82, every: 19, from: 12 },
    { left: 52, top: 66, every: 14, from: 7.5, glow: "120, 220, 255" },
    { left: 70, top: 78, every: 17, from: 1.8, glow: "255, 140, 220" },
    { left: 88, top: 88, every: 15, from: 9 },
    { left: 46, top: 90, every: 20, from: 4, glow: "190, 160, 255" },
  ],
};

export default art;
