import { createAsyncThunk } from "@reduxjs/toolkit";

import { createApiThunk, refuse } from "@/redux/slices/actions/apiThunk";
import { DeliverWaitingMessages, GetConversations, GetMessages } from "@/redux/slices/actions/chatActions";
import { updateMemberKeys } from "@/redux/slices/chatSlice";
import axios from "@/utils/axios";
import { forgetDeviceKeys, loadDeviceKeys, saveDeviceKeys } from "@/utils/crypto/deviceKeyStore";
import { exportPublicKey, generateAccountKeys, keyIdOf } from "@/utils/crypto/keys";
import { setDeviceKeys } from "@/utils/crypto/messageCipher";
import { createRecoveryKey, lockPrivateKey, parseRecoveryKey, unlockPrivateKey } from "@/utils/crypto/recoveryKey";
import { authenticateWithPasskey, randomChallenge, unlockWithPasskey } from "@/utils/passkeys";

const keepOnThisDevice = async (userId, deviceKeys) => {
  await saveDeviceKeys(userId, deviceKeys);
  setDeviceKeys(deviceKeys);
};

const refreshChats = (dispatch, getState) => {
  dispatch(GetConversations());
  dispatch(DeliverWaitingMessages());
  const { activeConversation } = getState().chat;
  if (activeConversation) dispatch(GetMessages(activeConversation._id));
};

const lockWithNewRecoveryKey = async (privateKey, keyId) => {
  const recoveryKey = createRecoveryKey();
  const sealed = await lockPrivateKey(privateKey, parseRecoveryKey(recoveryKey), keyId);
  return { recoveryKey, backup: { keyId, ...sealed } };
};

// ------------- Prepare Encryption -------------
export const PrepareEncryption = createApiThunk(
  "encryption/prepare",
  async (_, { getState }) => {
    const userId = getState().user.user._id;
    const [{ data }, stored] = await Promise.all([axios.get("/keys"), loadDeviceKeys(userId)]);
    const currentKeyId = data.publicKeys.at(-1)?.keyId ?? null;

    if (!currentKeyId) return { status: "setup", currentKeyId };

    if (stored?.keyId === currentKeyId) {
      setDeviceKeys(stored);
      return { status: "ready", currentKeyId };
    }

    return { status: "locked", currentKeyId };
  },
  { notifyErrors: false }
);

// ------------- Create Account Key -------------
export const CreateAccountKey = createApiThunk("encryption/create-key", async (_, { getState, dispatch }) => {
  const userId = getState().user.user._id;
  const { publicKey, privateKey } = await generateAccountKeys();
  const encodedPublicKey = await exportPublicKey(publicKey);
  const keyId = await keyIdOf(encodedPublicKey);
  const { recoveryKey, backup } = await lockWithNewRecoveryKey(privateKey, keyId);

  const { data } = await axios.post("/keys", {
    publicKey: encodedPublicKey,
    backup,
    replacing: getState().encryption.currentKeyId,
  });
  await keepOnThisDevice(userId, { keyId, privateKey });
  dispatch(updateMemberKeys({ userId, publicKeys: data.publicKeys }));

  return { recoveryKey, currentKeyId: keyId };
});

// ------------- Unlock With Recovery Key -------------
export const UnlockWithRecoveryKey = createApiThunk(
  "encryption/unlock",
  async (typedKey, { getState, dispatch, rejectWithValue }) => {
    const recoveryBytes = parseRecoveryKey(typedKey);
    if (!recoveryBytes) {
      return rejectWithValue("A recovery key is 24 letters and numbers, like ABCD-EFGH-…");
    }

    const { data } = await axios.get("/keys");
    const privateKey = await unlockPrivateKey(data.keyBackup, recoveryBytes).catch(() => null);
    if (!privateKey) return rejectWithValue("That recovery key does not match this account");

    await keepOnThisDevice(getState().user.user._id, { keyId: data.keyBackup.keyId, privateKey });
    refreshChats(dispatch, getState);
  },
  { notifyErrors: false }
);

// ------------- Unlock With Passkey -------------
export const keepKeyFromPasskey = async (userId, keyBackup, prfSecret) =>
  keepOnThisDevice(userId, { keyId: keyBackup.keyId, privateKey: await unlockWithPasskey(keyBackup, prfSecret) });

const NO_PASSKEY_UNLOCK = "This browser cannot unlock your messages with a passkey. Use your recovery key instead.";

export const UnlockWithPasskey = createApiThunk("encryption/unlock-passkey", async (_, { getState, dispatch, rejectWithValue }) => {
  const { data } = await axios.get("/keys/passkeys");
  if (!data.passkeys.length) {
    return refuse(rejectWithValue, "None of your passkeys unlock messages yet. Use your recovery key, then turn it on in Settings.");
  }

  const { response, prfSecret } = await authenticateWithPasskey({
    challenge: randomChallenge(),
    allowCredentials: data.passkeys.map(({ credentialId, transports }) => ({ id: credentialId, transports })),
  });
  const linked = data.passkeys.find((passkey) => passkey.credentialId === response.id);
  if (!prfSecret || !linked) return refuse(rejectWithValue, NO_PASSKEY_UNLOCK);

  await keepKeyFromPasskey(getState().user.user._id, linked.keyBackup, prfSecret);
  refreshChats(dispatch, getState);
});

// ------------- Replace Recovery Key -------------
export const ReplaceRecoveryKey = createApiThunk("encryption/replace-recovery-key", async (_, { getState }) => {
  const { keyId, privateKey } = await loadDeviceKeys(getState().user.user._id);
  const { recoveryKey, backup } = await lockWithNewRecoveryKey(privateKey, keyId);
  await axios.put("/keys/backup", backup);
  return { recoveryKey };
});

// ------------- Forget Device Keys -------------
export const ForgetDeviceKeys = createAsyncThunk("encryption/forget", async (userId) => {
  setDeviceKeys(null);
  await forgetDeviceKeys(userId).catch(() => {});
});
