// APP_ORIGIN holds the origins the Android app and any preview build are served from, separated by commas
export const allowedOrigins = [process.env.FRONT_URL || "http://localhost:3000", ...(process.env.APP_ORIGIN?.split(",") ?? [])]
  .map((origin) => origin.trim())
  .filter(Boolean);
