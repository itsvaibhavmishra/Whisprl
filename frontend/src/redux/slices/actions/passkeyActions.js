import { createApiThunk, notifyResult, refuse } from "@/redux/slices/actions/apiThunk";
import axios from "@/utils/axios";
import { loadDeviceKeys } from "@/utils/crypto/deviceKeyStore";
import { authenticateWithPasskey, createPasskey, lockWithPasskey, randomChallenge } from "@/utils/passkeys";

// ------------- List Passkeys -------------
export const GetPasskeys = createApiThunk("passkeys/list", async () => (await axios.get("/passkeys")).data);

// ------------- Link A Passkey To Messages -------------
// the passkey's secret locks this browser's copy of the account key, so the passkey can unlock it elsewhere
export const LinkPasskey = createApiThunk("passkeys/link", async (credentialId, { getState, rejectWithValue }) => {
  const { prfSecret } = await authenticateWithPasskey({ challenge: randomChallenge(), allowCredentials: [{ id: credentialId }] });
  if (!prfSecret) return refuse(rejectWithValue, "This passkey logs you in, but this browser cannot use it to unlock messages");

  const { keyId, privateKey } = await loadDeviceKeys(getState().user.user._id);
  const { data } = await axios.put(`/keys/passkeys/${encodeURIComponent(credentialId)}`, {
    keyId,
    ...(await lockWithPasskey(privateKey, prfSecret, keyId)),
  });
  notifyResult(data);
  return data;
});

// ------------- Add Passkey -------------
export const AddPasskey = createApiThunk("passkeys/add", async (_, { dispatch, getState }) => {
  const { data: registration } = await axios.post("/passkeys/options");
  const { response, canUnlock } = await createPasskey(registration.options);
  const { data } = await axios.post("/passkeys", { response });
  notifyResult(data);

  if (!canUnlock || getState().encryption.status !== "ready") return data;
  const linked = await dispatch(LinkPasskey(response.id));
  return LinkPasskey.fulfilled.match(linked) ? linked.payload : data;
});

// ------------- Remove Passkey -------------
export const RemovePasskey = createApiThunk("passkeys/remove", async (passkeyId) => {
  const { data } = await axios.delete(`/passkeys/${passkeyId}`);
  notifyResult(data);
  return data;
});
