import { encryptMessage, openMessage } from "@/utils/crypto/messageCipher";

// a status is sealed like a group message whose members are the owner and everyone allowed to see it
const statusScopeOf = (people) => ({ _id: "status", isGroup: true, users: people });

export const encryptStatus = (content, sealedFor, ownerId) =>
  encryptMessage(JSON.stringify(content), statusScopeOf(sealedFor), ownerId);

export const openStatus = async (status) =>
  JSON.parse(await openMessage({ cipher: status.cipher, sender: status.owner._id }, statusScopeOf([status.owner])));

const REACTION_BINDING = "status-reaction";

// a reaction is sealed between the person reacting and the update's owner, and bound to that one update
const reactionScopeOf = (status, people) => ({ _id: status._id, users: people });

export const encryptStatusReaction = (emoji, status, reactorId) =>
  encryptMessage(emoji, reactionScopeOf(status, [status.owner]), reactorId, REACTION_BINDING);

export const openStatusReaction = (reaction, status, reactor) =>
  openMessage({ cipher: reaction, sender: reactor._id }, reactionScopeOf(status, [status.owner, reactor]), REACTION_BINDING);
