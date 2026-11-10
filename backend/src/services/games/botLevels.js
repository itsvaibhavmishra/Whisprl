// how hard the bot plays a person is a hidden skill from 0, its weakest, to 100, its best, kept per person and game
const LEVELS = ["dumb", "medium", "pro", "expert"];
const TOP = 100;
const LEVEL_GAP = TOP / (LEVELS.length - 1);
export const MEDIUM_SKILL = LEVEL_GAP;
const NEWCOMER_GAMES = 8;
const REGULAR_GAMES = 4;
const RECENT_RESULTS = 3;
const RELIEF = 10;
const SPICE = 10;
const SURPRISE = 12;
const SURPRISE_CHANCE = 1 / 7;
const SURPRISE_HARDER = 2 / 3;

// a loss steps further than a win, settling players on winning three games in five; a draw eases it, or a game that mostly draws would climb into a wall
const STEPS = {
  newcomer: { won: 10, lost: -15, drawn: -4 },
  regular: { won: 4, lost: -6, drawn: -2 },
};

const clamp = (skill) => Math.min(Math.max(skill, 0), TOP);

// a record with no skill yet starts a regular at medium and anyone newer at the bottom
export const skillOf = ({ skill, played = 0 } = {}) => skill ?? (played >= REGULAR_GAMES ? MEDIUM_SKILL : 0);

// each move is played by one of the two levels either side of the skill, the nearer more often, so strength slides rather than jumps
export const levelAt = (skill, random = Math.random) => {
  const position = clamp(skill) / LEVEL_GAP;
  const lower = Math.floor(position);
  if (lower >= LEVELS.length - 1) return LEVELS.at(-1);
  return random() < position - lower ? LEVELS[lower + 1] : LEVELS[lower];
};

export const skillAfter = (record, result) => {
  const steps = (record?.played ?? 0) < NEWCOMER_GAMES ? STEPS.newcomer : STEPS.regular;
  return clamp(skillOf(record) + steps[result]);
};

export const recentAfter = (record, result) => [...(record?.recent ?? []), result].slice(-RECENT_RESULTS);

const isRun = (recent, result, length) => recent.length >= length && recent.slice(-length).every((each) => each === result);

// one game's skill: a little easier after two losses, a little harder after three wins, and now and then a notch either way
export const skillForGame = (record, random = Math.random) => {
  const recent = record?.recent ?? [];
  let shift = 0;
  if (isRun(recent, "lost", 2)) shift -= RELIEF;
  else if (isRun(recent, "won", RECENT_RESULTS)) shift += SPICE;
  if (random() < SURPRISE_CHANCE) shift += random() < SURPRISE_HARDER ? SURPRISE : -SURPRISE;
  return clamp(skillOf(record) + shift);
};
