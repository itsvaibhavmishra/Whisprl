const FOLDER = `${process.env.PUBLIC_URL}/games/dots-and-boxes`;

const art = {
  scene: `${FOLDER}/scene.webp`,
  // the masthead is drawn onto the desk in this scene, so it is pinned to the top at full width to line up with it
  anchor: "top",
  // width over height, so the room can size the scene to cover the panel
  ratio: 897 / 1754,
  board: `${FOLDER}/board.webp`,
  notebook: `${FOLDER}/notebook.webp`,
  cat: `${FOLDER}/cat.webp`,
  title: `${FOLDER}/title.webp`,
  // fetched only when music is turned on, so it never costs anyone who leaves it off
  music: `${FOLDER}/music.m4a`,
};

export default art;
