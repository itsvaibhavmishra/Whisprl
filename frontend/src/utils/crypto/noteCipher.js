import { encryptMessage, openMessage } from "@/utils/crypto/messageCipher";
import { decodePayload, encodePayload } from "@/utils/messagePayload";

// sealed exactly as the first message of the chat it opens, so accepting moves it in without re-encrypting
const chatOf = (conversationId, meId, person) => ({ _id: conversationId, isGroup: false, users: [{ _id: meId }, person] });

export const sealNote = (text, { conversationId, meId, recipient }) =>
  encryptMessage(encodePayload({ text }), chatOf(conversationId, meId, recipient), meId);

export const openNote = async ({ note, conversationId, person }, { meId, isMine }) => {
  const plaintext = await openMessage({ cipher: note, sender: isMine ? meId : person._id }, chatOf(conversationId, meId, person));
  return decodePayload(plaintext).text;
};
