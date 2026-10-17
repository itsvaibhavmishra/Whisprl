const FOLDER = `${process.env.PUBLIC_URL}/games/tic-tac-toe`;

const art = {
  scene: `${FOLDER}/scene.webp`,
  // pinned to the top so the sky and the sleeping cat stay in view above the title, however tall the panel
  anchor: "top",
  // width over height, so the room can size the scene to cover the panel
  ratio: 1024 / 1536,
  board: `${FOLDER}/board.webp`,
  // fetched only when music is turned on, so it never costs anyone who leaves it off
  music: `${FOLDER}/music.m4a`,
  wordOf: (word) => `${FOLDER}/title-${word}.webp`,
};

export default art;
