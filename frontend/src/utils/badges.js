// Cloudinary resizes on delivery, so each place asks for twice its size and stays sharp on dense screens
export const badgeArtAt = (url, size) => url.replace("/upload/", `/upload/w_${size * 2},h_${size * 2},c_fit,f_auto,q_auto/`);

export const badgeDateOf = (date) => new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

export const SHOWN_BESIDE_NAME = 3;

export const badgeCountOf = (count) => (count === 1 ? "1 badge" : `${count} badges`);

// the gallery and the showcase draw the same copy, so opening a badge never waits for a larger one to load
export const SHOWCASE_SIZE = 220;

const monthOf = (date) => new Date(date).toLocaleDateString(undefined, { month: "long" });

export const badgeDayOf = (date) => new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short" });

// newest first, each year holding its months and each month its badges, for the Progress timeline
export function badgesByYearAndMonth(badges) {
  const years = new Map();
  [...badges]
    .sort((first, second) => new Date(second.awardedAt) - new Date(first.awardedAt))
    .forEach((badge) => {
      const awarded = new Date(badge.awardedAt);
      const year = awarded.getFullYear();
      const monthKey = `${year}-${awarded.getMonth()}`;
      if (!years.has(year)) years.set(year, { year, count: 0, months: new Map() });
      const entry = years.get(year);
      entry.count += 1;
      if (!entry.months.has(monthKey)) entry.months.set(monthKey, { key: monthKey, label: monthOf(awarded), badges: [] });
      entry.months.get(monthKey).badges.push(badge);
    });
  return [...years.values()].map((entry) => ({ ...entry, months: [...entry.months.values()] }));
}
