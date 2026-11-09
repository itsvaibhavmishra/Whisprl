import { ConversationModel, UserModel } from "#src/models/index.js";
import { directConversationIdOf, populateMembers } from "#src/services/conversationService.js";
import { saveMessage } from "#src/services/messageService.js";
import { whisprlAccountId } from "#src/services/whisprlService.js";

const chatWith = async (userId) => {
  const whisprlId = whisprlAccountId();
  const existingId = await directConversationIdOf(whisprlId, userId);
  const conversation = existingId
    ? await ConversationModel.findById(existingId)
    : await ConversationModel.create({ name: "Whisprl", isGroup: false, users: [whisprlId, userId] });
  return populateMembers(conversation);
};

export const sendFromWhisprl = async (io, userId, notice) => {
  if (!whisprlAccountId()) return;
  const conversation = await chatWith(userId);
  const { message } = await saveMessage(conversation, { sender: whisprlAccountId(), notice });
  io?.to(String(userId)).emit("message_received", message);
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
