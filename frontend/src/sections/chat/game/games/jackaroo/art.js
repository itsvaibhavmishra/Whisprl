import masthead from "@/sections/chat/game/games/jackaroo/masthead.json";

const FOLDER = `${process.env.PUBLIC_URL}/games/jackaroo`;

// cut from the user's designs, so every piece shares their paint and light
const art = {
  scene: `${FOLDER}/scene.webp`,
  // the masthead is placed in this scene's own coordinates, so it is pinned to the top at the masthead's width to line up with it
  anchor: "top",
  // width over height, so the room can size the scene to the panel
  ratio: masthead.scene.width / masthead.scene.height,
  // a phone is taller than the design, so the scene keeps the design's width and fades into the room's colour below it
  fadesAtFoot: true,
  title: `${FOLDER}/title.webp`,
  wordmark: `${FOLDER}/wordmark.webp`,
  startBoard: `${FOLDER}/start-board.webp`,
  board: `${FOLDER}/board.webp`,
  boardShadow: `${FOLDER}/board-shadow.webp`,
  swirl: `${FOLDER}/swirl.webp`,
  shadow: `${FOLDER}/shadow.webp`,
  card: `${FOLDER}/card.webp`,
  cardBack: `${FOLDER}/card-back.webp`,
  marble: (tone) => `${FOLDER}/marble-${tone}.webp`,
  ring: (tone) => `${FOLDER}/ring-${tone}.webp`,
  // fetched only when music is turned on, so it never costs anyone who leaves it off
  music: `${FOLDER}/music.m4a`,
};

export default art;
