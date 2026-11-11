import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { publicKeyOf } from "@/utils/crypto/keys";
import { currentDeviceKeys } from "@/utils/crypto/messageCipher";
import { safetyNumberOf } from "@/utils/crypto/safetyNumber";

const NO_CODE = { digits: null, keyId: null };

// their key as your chat with them encrypts to it, which is the one worth checking; a profile's copy only when there is no chat
const theirKeyOf = (person, conversations) => {
  const direct = conversations.find((conversation) => !conversation.isGroup && conversation.users?.some((member) => member._id === person._id));
  const member = direct?.users.find((candidate) => candidate._id === person._id);
  return (member ?? person).publicKeys?.at(-1) ?? null;
};

const useSafetyNumber = (person) => {
  const meId = useSelector((state) => state.user.user._id);
  const isReady = useSelector((state) => state.encryption.status === "ready");
  const conversations = useSelector((state) => state.chat.conversations);
  const theirKey = theirKeyOf(person, conversations);
  const [code, setCode] = useState(NO_CODE);

  useEffect(() => {
    const own = currentDeviceKeys();
    if (!isReady || !own || !theirKey?.publicKey) return undefined;
    let isCurrent = true;
    publicKeyOf(own.privateKey)
      .then((publicKey) => safetyNumberOf({ userId: meId, publicKey }, { userId: person._id, publicKey: theirKey.publicKey }))
      .then((digits) => isCurrent && setCode({ digits, keyId: theirKey.keyId }));
    return () => {
      isCurrent = false;
    };
  }, [isReady, meId, person._id, theirKey?.publicKey, theirKey?.keyId]);

  // a code worked out for a key they have since replaced is never shown against the new one
  return isReady && code.keyId === theirKey?.keyId ? code : NO_CODE;
};

export default useSafetyNumber;
