const isOperatorKey = (key) => key.startsWith("$") || key.includes(".");

const withoutOperators = (value) => {
  if (Array.isArray(value)) return value.map(withoutOperators);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isOperatorKey(key))
      .map(([key, inner]) => [key, withoutOperators(inner)])
  );
};

// a "$gt" or "a.b" key would reach Mongo as an operator, and Express 5 leaves a bodiless request's body undefined
export const plainBody = (req, res, next) => {
  req.body = withoutOperators(req.body ?? {});
  next();
};
