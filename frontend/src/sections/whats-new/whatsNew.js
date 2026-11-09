import content from "@/sections/whats-new/releases.json";

// a development build shows the upcoming highlights as if released, so they can be read before they ship
const preview = import.meta.env.DEV && content.upcoming.length ? [{ version: "next", date: null, highlights: content.upcoming }] : [];

export const RELEASES = [...preview, ...content.releases];

// everything released before Whisprl went public on Play was a beta, and says so
export const releaseTitle = ({ version, date, beta }) => {
  if (!date) return "Preview of the next release";
  return beta ? `Whisprl ${version} beta` : `Whisprl ${version}`;
};

export const releaseNote = ({ date }) =>
  date ? `Released ${new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}` : "Only development builds show this";
