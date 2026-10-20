import { ActivityModel } from "#src/models/index.js";
import { utcDayOf } from "#src/utils/utcDays.js";

// the Android app is served from Capacitor's own origin, so anything else is the website
const ANDROID_APP_ORIGIN = "https://localhost";

export const platformOf = (req) => (req.get("origin") === ANDROID_APP_ORIGIN ? "android" : "web");

// counting someone as active must never stand in the way of signing them in
export const recordActivity = (user_id, platform) => {
  const today = { user: user_id, day: utcDayOf(new Date()) };
  ActivityModel.updateOne(today, { $setOnInsert: today, $addToSet: { platforms: platform } }, { upsert: true }).catch((error) =>
    console.error(`[activity] ${error.message}`)
  );
};
