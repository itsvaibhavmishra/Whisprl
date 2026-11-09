import { confirmWithPasskey } from "@/redux/slices/actions/adminActions";
import { createApiThunk, notifyResult, refuse } from "@/redux/slices/actions/apiThunk";
import axios from "@/utils/axios";
import { loadDeviceKeys } from "@/utils/crypto/keyStore";
import { authenticateWithPasskey, createPasskey, lockWithPasskey, randomChallenge } from "@/utils/passkeys";
import { isStaff } from "@/utils/roles";

export const GetPasskeys = createApiThunk("passkeys/list", async () => (await axios.get("/passkeys")).data, { notifyErrors: false });

// the passkey's secret locks this browser's copy of the account key, so the passkey can unlock it elsewhere
const lockWithSecret = async (credentialId, prfSecret, getState) => {
  const { keyId, privateKey } = await loadDeviceKeys(getState().user.user._id);
  const { data } = await axios.put(`/keys/passkeys/${encodeURIComponent(credentialId)}`, {
    keyId,
    ...(await lockWithPasskey(privateKey, prfSecret, keyId)),
  });
  notifyResult(data);
  return data;
};

export const LinkPasskey = createApiThunk("passkeys/link", async (credentialId, { getState, rejectWithValue }) => {
  const { prfSecret } = await authenticateWithPasskey({ challenge: randomChallenge(), allowCredentials: [{ id: credentialId }] });
  if (!prfSecret) return refuse(rejectWithValue, "This passkey logs you in, but this browser cannot use it to unlock messages");
  return lockWithSecret(credentialId, prfSecret, getState);
});

export const AddPasskey = createApiThunk("passkeys/add", async (_, { dispatch, getState }) => {
  const { data: registration } = await axios.post("/passkeys/options");
  const confirmation = registration.confirmation && (await authenticateWithPasskey(registration.confirmation)).response;
  const { response, canUnlock, prfSecret } = await createPasskey(registration.options);
  const { data } = await axios.post("/passkeys", { response, confirmation });
  notifyResult(data);

  if (!canUnlock || getState().encryption.status !== "ready") return data;
  // a browser that hands back the secret as the passkey is made saves asking for the passkey a second time
  if (prfSecret) return lockWithSecret(response.id, prfSecret, getState);
  const linked = await dispatch(LinkPasskey(response.id));
  return LinkPasskey.fulfilled.match(linked) ? linked.payload : data;
});

export const RemovePasskey = createApiThunk("passkeys/remove", async (passkeyId, { getState }) => {
  const confirmation = isStaff(getState().user.user.role) ? await confirmWithPasskey() : undefined;
  const { data } = await axios.delete(`/passkeys/${passkeyId}`, { data: { confirmation } });
  notifyResult(data);
  return data;
});
