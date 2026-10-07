const EVENT_WINDOW = 10 * 1000;

// a fixed window per socket and event: cheap, and enough to stop one connection flooding the database
export const withinBudget = (limit, handler) => {
  let windowStart = 0;
  let used = 0;

  return (...args) => {
    const now = Date.now();
    if (now - windowStart >= EVENT_WINDOW) {
      windowStart = now;
      used = 0;
    }
    used += 1;
    if (used <= limit) return handler(...args);

    const acknowledge = args.find((arg) => typeof arg === "function");
    acknowledge?.({ status: "error", message: "You are sending too fast, slow down a little", retryable: true });
  };
};
