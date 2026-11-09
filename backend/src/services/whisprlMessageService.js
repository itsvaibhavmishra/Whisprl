import { ConversationModel, UserModel } from "#src/models/index.js";
import { directConversationIdOf, populateMembers } from "#src/services/conversationService.js";
import { saveMessage } from "#src/services/messageService.js";
import { pushWords } from "#src/services/pushService.js";
import { whisprlAccountId } from "#src/services/whisprlService.js";
import { reportError } from "#src/utils/errorReports.js";

const chatWith = async (userId) => {
  const whisprlId = whisprlAccountId();
  const existingId = await directConversationIdOf(whisprlId, userId);
  const conversation = existingId
    ? await ConversationModel.findById(existingId)
    : await ConversationModel.create({ name: "Whisprl", isGroup: false, users: [whisprlId, userId] });
  return populateMembers(conversation);
};

const subjectOf = ({ about, name }) => ({ person: name, status: `${name}'s status`, group: name })[about];

// what a notification says for each message worth one; the welcome arrives while someone is already in the app
const PUSHED_WORDS = {
  inviteJoined: ({ name }) => `${name} joined Whisprl from your invite 🎉`,
  reportReceived: (notice) => `We got your report about ${subjectOf(notice)}`,
  reportActioned: (notice) => `We took action on your report about ${subjectOf(notice)}`,
  reportDismissed: (notice) => `We looked at your report about ${subjectOf(notice)}`,
};

export const sendFromWhisprl = async (io, userId, notice) => {
  if (!whisprlAccountId()) return;
  const conversation = await chatWith(userId);
  const { message } = await saveMessage(conversation, { sender: whisprlAccountId(), notice });
  io?.to(String(userId)).emit("message_received", message);
  const words = PUSHED_WORDS[notice.type]?.(notice);
  if (words) await pushWords(conversation, message.sender, words);
};

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
