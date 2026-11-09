import { ConversationModel, UserModel } from "#src/models/index.js";
import { memberRooms } from "#src/services/conversationService.js";
import { clientMessageOf, saveNoticeInEach } from "#src/services/messageService.js";
import { pushWords } from "#src/services/pushService.js";
import { whisprlAccountId } from "#src/services/whisprlService.js";
import { reportError } from "#src/utils/errorReports.js";

// each person's chat with Whisprl, made for whoever has not had one yet
const chatsWith = async (whisprlId, userIds) => {
  const found = await ConversationModel.find({ isGroup: false, $and: [{ users: whisprlId }, { users: { $in: userIds } }] })
    .select("users")
    .lean();
  const chatOf = new Map(found.map((chat) => [String(chat.users.find((member) => String(member) !== String(whisprlId))), chat]));
  const missing = userIds.filter((userId) => !chatOf.has(String(userId)));
  const made = await ConversationModel.insertMany(missing.map((userId) => ({ name: "Whisprl", isGroup: false, users: [whisprlId, userId] })));
  made.forEach((chat, index) => chatOf.set(String(missing[index]), chat));
  return userIds.map((userId) => chatOf.get(String(userId)));
};

// a notification shows plain words, so the bold and links a chat draws are taken out
const unmarked = (text) =>
  text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\(\/[^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const subjectOf = ({ about, name }) => ({ person: name, status: `${name}'s status`, group: name })[about];

// what a notification says for each message worth one; the welcome arrives while someone is already in the app
const PUSHED_WORDS = {
  inviteJoined: ({ name }) => `${name} joined Whisprl from your invite 🎉`,
  reportReceived: (notice) => `We got your report about ${subjectOf(notice)}`,
  reportActioned: (notice) => `We took action on your report about ${subjectOf(notice)}`,
  reportDismissed: (notice) => `We looked at your report about ${subjectOf(notice)}`,
  announcement: ({ text }) => unmarked(text),
  gameAdded: ({ name }) => `You asked for ${name}, and it's here now 🎉`,
  birthday: ({ name }) => `Happy birthday, ${name} 🎂`,
};

// the same message to a whole batch of people in a few writes between them, rather than a few each; returns how many it reached
export const sendFromWhisprlToEach = async (io, userIds, notice, { isPushed = true } = {}) => {
  const whisprlId = whisprlAccountId();
  if (!whisprlId || !userIds.length) return 0;
  const [chats, whisprl] = await Promise.all([chatsWith(whisprlId, userIds), UserModel.findById(whisprlId).select("firstName lastName avatar").lean()]);
  const messages = await saveNoticeInEach(chats, whisprlId, notice);
  const chatOf = new Map(chats.map((chat) => [String(chat._id), chat]));
  const reached = messages.map((message) => chatOf.get(String(message.conversation)));
  messages.forEach((message, index) => io?.to(memberRooms(reached[index], whisprlId)).emit("message_received", clientMessageOf(message, whisprl)));
  const words = isPushed && PUSHED_WORDS[notice.type]?.(notice);
  if (words && reached.length) await pushWords(reached, whisprl, words);
  return messages.length;
};

export const sendFromWhisprl = (io, userId, notice) => sendFromWhisprlToEach(io, [userId], notice);

const fullName = ({ firstName, lastName }) => `${firstName} ${lastName}`.trim();

// a ban swaps a profile for a placeholder, so the name the reporter knew comes from the profile set aside
const reportedNameOf = async ({ reportedUser, conversation }) => {
  if (!reportedUser) return (await ConversationModel.findById(conversation).select("name").lean())?.name;
  const person = await UserModel.findById(reportedUser).select("firstName lastName +hiddenProfile").lean();
  if (!person) return null;
  return fullName(person.hiddenProfile?.firstName ? person.hiddenProfile : person);
};

const aboutOf = ({ reportedStatus, reportedUser }) => {
  if (reportedStatus) return "status";
  return reportedUser ? "person" : "group";
};

// tells whoever reported that it arrived, and later how it ended; the report or decision stands even if this fails
export const tellReporter = async (io, report, type) => {
  try {
    const [reporter, name] = await Promise.all([UserModel.exists({ _id: report.reporter, deletedAt: { $exists: false } }), reportedNameOf(report)]);
    if (reporter && name) await sendFromWhisprl(io, report.reporter, { type, about: aboutOf(report), name });
  } catch (error) {
    reportError(error, report.reporter);
  }
};

// claimed before it is sent, so two servers starting together never welcome anyone twice
export const welcomeToWhisprl = async (userId) => {
  const claimed = await UserModel.updateOne({ _id: userId, whisprlWelcomedAt: { $exists: false } }, { whisprlWelcomedAt: new Date() });
  if (claimed.modifiedCount) await sendFromWhisprl(null, userId, { type: "welcome" });
};

// everyone already here when Whisprl arrived is welcomed once too
export const welcomeEveryone = async () => {
  const waiting = UserModel.find({ verified: true, deletedAt: { $exists: false }, badge: { $ne: "official" }, whisprlWelcomedAt: { $exists: false } })
    .select("_id")
    .lean()
    .cursor();
  for await (const { _id } of waiting) await welcomeToWhisprl(_id);
};
