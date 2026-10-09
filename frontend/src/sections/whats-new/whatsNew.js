import content from "@/sections/whats-new/releases.json";

// a development build shows the upcoming highlights as if released, so they can be read before they ship
const preview = process.env.NODE_ENV === "development" && content.upcoming.length ? [{ version: "next", date: null, highlights: content.upcoming }] : [];

export const RELEASES = [...preview, ...content.releases];

// each release shows once, and only to an account that was already here when it came out
export const unseenReleaseFor = (user, releases = RELEASES) => {
  const [latest] = releases;
  if (!latest || user.whatsNewSeen === latest.version) return null;
  return !latest.date || new Date(user.createdAt) < new Date(latest.date) ? latest : null;
};

export const releaseTitle = ({ version, date }) => (date ? `Whisprl ${version}` : "Preview of the next release");

export const releaseNote = ({ date }) =>
  date ? `Released ${new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}` : "Only development builds show this";
