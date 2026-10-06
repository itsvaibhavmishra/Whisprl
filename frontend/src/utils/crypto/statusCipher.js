import { encryptMessage, openMessage } from "@/utils/crypto/messageCipher";

// a status is sealed like a group message whose members are the owner and everyone allowed to see it
const statusScopeOf = (people) => ({ _id: "status", isGroup: true, users: people });

export const encryptStatus = (content, sealedFor, ownerId) =>
  encryptMessage(JSON.stringify(content), statusScopeOf(sealedFor), ownerId);

export const openStatus = async (status) =>
  JSON.parse(await openMessage({ cipher: status.cipher, sender: status.owner._id }, statusScopeOf([status.owner])));
