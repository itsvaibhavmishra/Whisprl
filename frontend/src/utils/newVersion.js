const RELOADED_AT_KEY = "whisprl-reloaded-for-new-version";
const RELOAD_WINDOW_MS = 60 * 1000;

// a deploy replaces the files a tab opened earlier still asks for, so its next page fails to load until it reloads
export const isMissingCode = (name, message) => name === "ChunkLoadError" || /Loading (CSS )?chunk \S+ failed/.test(message ?? "");

// storage that cannot be read counts as a reload just now, so the tab shows the crash screen rather than looping
const lastReloadAt = () => {
  try {
    return Number(sessionStorage.getItem(RELOADED_AT_KEY)) || 0;
  } catch {
    return Date.now();
  }
};

// read once when the page loads, so the crash screen and the report filter always give the same answer
const pageLoadedAt = Date.now();
const isFreshFromReload = pageLoadedAt - lastReloadAt() < RELOAD_WINDOW_MS;

// a page that a reload just brought back and that still finds code missing has a real problem, not an old copy
export const canReloadForNewVersion = () => navigator.onLine && !(isFreshFromReload && Date.now() - pageLoadedAt < RELOAD_WINDOW_MS);

export const reloadForNewVersion = () => {
  try {
    sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
  } catch {
    // the reload still fixes this tab, and the failed read above keeps it from reloading again
  }
  window.location.reload();
};
