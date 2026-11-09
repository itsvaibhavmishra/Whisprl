import { UserModel } from "#src/models/index.js";
import { sendFromWhisprl } from "#src/services/whisprlMessageService.js";
import { reportError } from "#src/utils/errorReports.js";

// nobody's time zone is known, so every greeting goes out at one morning hour by India's clock, where most people are
const INDIA_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const GREETING_HOUR = 9;

// saves searching for birthdays every minute; the yearly mark is what stops a second greeting
let lastGreetedDay = null;

const isLeapYear = (year) => new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1;

// someone born on 29 February is greeted on the 28th in a year without one
export const birthdaysOn = (indiaDate) => {
  const today = { day: indiaDate.getUTCDate(), month: indiaDate.getUTCMonth() + 1 };
  const isLeapDayMissing = today.month === 2 && today.day === 28 && !isLeapYear(indiaDate.getUTCFullYear());
  return isLeapDayMissing ? [today, { day: 29, month: 2 }] : [today];
};

const whoseBirthdayIsOn = (indiaDate) =>
  UserModel.find({
    $or: birthdaysOn(indiaDate).map(({ day, month }) => ({ "birthday.day": day, "birthday.month": month })),
    birthdayGreetedIn: { $ne: indiaDate.getUTCFullYear() },
    verified: true,
    deletedAt: { $exists: false },
    bannedAt: { $exists: false },
    badge: { $ne: "official" },
  })
    .select("firstName")
    .lean();

// each person is marked for this year before being greeted, so two servers or a restart never greet anyone twice
const claimedForYear = async (people, year) => {
  const claims = await Promise.all(
    people.map((person) => UserModel.updateOne({ _id: person._id, birthdayGreetedIn: { $ne: year } }, { birthdayGreetedIn: year }))
  );
  return people.filter((_, index) => claims[index].modifiedCount);
};

export const greetBirthdays = async (io) => {
  const indiaDate = new Date(Date.now() + INDIA_OFFSET_MS);
  const day = indiaDate.toISOString().slice(0, 10);
  if (indiaDate.getUTCHours() < GREETING_HOUR || lastGreetedDay === day) return;

  const people = await claimedForYear(await whoseBirthdayIsOn(indiaDate), indiaDate.getUTCFullYear());
  // each greeting names its own person, so they go out one by one; a day holds few birthdays
  for (const person of people) {
    await sendFromWhisprl(io, person._id, { type: "birthday", name: person.firstName }).catch((error) => reportError(error, person._id));
  }
  lastGreetedDay = day;
};
