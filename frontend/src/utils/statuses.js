// a text status names one of these by its place, so what it shows is always one of them
export const TEXT_BACKGROUNDS = ["#4F46C8", "#0F766E", "#B4471A", "#A3245E", "#1F2A37", "#1D6FA5"];

export const backgroundOf = (index) => TEXT_BACKGROUNDS[index] ?? TEXT_BACKGROUNDS[0];

// shorter words are set larger, so a single line fills the card the way a long one does
export const textSizeOf = (text) => {
  if (text.length < 60) return 34;
  return text.length < 200 ? 26 : 19;
};

export const isLive = (status, now = Date.now()) => new Date(status.expiresAt).getTime() > now;

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// an update lives a day, so how long ago it went up says more than the clock time it went up at
export const ageOf = (time, now = Date.now()) => {
  const elapsed = Math.max(0, now - new Date(time).getTime());
  if (elapsed < MINUTE) return "Just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  return elapsed < 24 * HOUR ? `${Math.floor(elapsed / HOUR)}h ago` : "Yesterday";
};

export const reactionsOf = (views) => views.map((view) => view.reaction).filter(Boolean);

export const topReactions = (reactions) => [...new Set(reactions)].slice(0, 3).join("");

export const reactionsLine = (count) => (count === 1 ? "1 reaction" : `${count} reactions`);

// a shared card can reach someone its owner blocked or hides updates from, so only a reply or a mention carries the preview
export const quoteOfStatus = ({ _id, owner, content, expiresAt }, about) => ({
  _id,
  about,
  ownerId: owner._id,
  ownerName: owner.firstName,
  preview: about === "share" ? undefined : content.file?.preview,
  expiresAt,
});


// each person's statuses oldest first, and whoever posted last first
export const groupByOwner = (statuses) => {
  const groups = new Map();
  statuses.forEach((status) => {
    const group = groups.get(status.owner._id) ?? { owner: status.owner, statuses: [] };
    group.statuses.push(status);
    groups.set(status.owner._id, group);
  });
  return [...groups.values()]
    .map((group) => ({ ...group, latestAt: group.statuses.at(-1).createdAt, hasUnseen: group.statuses.some((status) => !status.isViewed) }))
    .sort((one, other) => new Date(other.latestAt) - new Date(one.latestAt));
};
