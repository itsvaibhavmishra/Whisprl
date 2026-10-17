const FOLDER = `${process.env.PUBLIC_URL}/games/tic-tac-toe`;

const art = {
  scene: `${FOLDER}/scene.webp`,
  // the scene is 2:3 and a phone is taller, so its top edge carries on in what it ends on
  beyond: "linear-gradient(90deg, #C0A6FA 0%, #AA97FA 30%, #9C91F4 52%, #A396F4 72%, #F9D0F9 100%)",
  board: `${FOLDER}/board.webp`,
  // fetched only when music is turned on, so it never costs anyone who leaves it off
  music: `${FOLDER}/music.m4a`,
  wordOf: (word) => `${FOLDER}/title-${word}.webp`,
};

export default art;
