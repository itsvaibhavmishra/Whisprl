// a newcomer meets a dumb bot twice, then the expert, then a dumb bot again; after that the bot follows how they are doing
export const levelFor = ({ played = 0, recent = [] } = {}) => {
  if (played < 2 || played === 3) return "dumb";
  if (played === 2 || (played > 5 && played % 5 === 4)) return "expert";
  if (recent.length === 2 && recent.every((result) => result === "lost")) return "dumb";
  if (recent.length === 2 && recent.every((result) => result === "won")) return "pro";
  return "medium";
};
