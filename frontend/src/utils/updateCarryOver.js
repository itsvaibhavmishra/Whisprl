// What a live update's reload would otherwise lose, kept for the one start that follows it.
const KEY = "whisprl-update-carry-over";

let carried;

export const carryOver = (state) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // with storage refused the update still applies, only without bringing the screen back
  }
};

// read once and removed, so only the start straight after the reload sees it, however often it is asked
export const carriedOver = () => {
  if (carried === undefined) {
    try {
      carried = JSON.parse(localStorage.getItem(KEY));
      localStorage.removeItem(KEY);
    } catch {
      carried = null;
    }
  }
  return carried;
};
