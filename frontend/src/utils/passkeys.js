import { encodeText, fromBase64, toBase64 } from "@/utils/crypto/encoding";
import { unwrapPrivateKey, wrapPrivateKey } from "@/utils/crypto/keyWrap";

// the same salt every time, so a passkey always gives the same secret for Whisprl
const prfSalt = () => encodeText("whisprl passkey prf v1");
const PASSKEY_KEY = "whisprl passkey key v1";

const toBase64Url = (buffer) => toBase64(buffer).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64Url = (text) => fromBase64(text.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(text.length / 4) * 4, "="));

const credentialIdsOf = (credentials = []) => credentials.map((credential) => ({ ...credential, id: fromBase64Url(credential.id) }));

// a browser reports a cancelled prompt as NotAllowedError, which means nothing to the person who cancelled it
const READABLE_ERRORS = {
  NotAllowedError: "The passkey request was cancelled or timed out",
  InvalidStateError: "That passkey is already added",
};

const asReadable = (error) => ({
  error: { status: "error", message: READABLE_ERRORS[error?.name] ?? "This browser could not use a passkey" },
});

export const canUsePasskeys = () => Boolean(window.PublicKeyCredential && navigator.credentials);

export const randomChallenge = () => toBase64Url(crypto.getRandomValues(new Uint8Array(32)));

const asJson = (credential, response) => ({
  id: credential.id,
  rawId: toBase64Url(credential.rawId),
  type: credential.type,
  authenticatorAttachment: credential.authenticatorAttachment,
  clientExtensionResults: {},
  response,
});

export const createPasskey = async (options) => {
  const credential = await navigator.credentials
    .create({
      publicKey: {
        ...options,
        challenge: fromBase64Url(options.challenge),
        user: { ...options.user, id: fromBase64Url(options.user.id) },
        excludeCredentials: credentialIdsOf(options.excludeCredentials),
        extensions: { ...options.extensions, prf: {} },
      },
    })
    .catch((error) => Promise.reject(asReadable(error)));

  const { response } = credential;
  return {
    response: asJson(credential, {
      clientDataJSON: toBase64Url(response.clientDataJSON),
      attestationObject: toBase64Url(response.attestationObject),
      transports: response.getTransports?.() ?? [],
    }),
    canUnlock: Boolean(credential.getClientExtensionResults().prf?.enabled),
  };
};

// prfSecret is null where the browser or the passkey cannot produce one, and then only a recovery key unlocks
export const authenticateWithPasskey = async ({ challenge, allowCredentials, ...options }) => {
  const credential = await navigator.credentials
    .get({
      publicKey: {
        userVerification: "required",
        ...options,
        challenge: fromBase64Url(challenge),
        allowCredentials: credentialIdsOf(allowCredentials).map((allowed) => ({ type: "public-key", ...allowed })),
        extensions: { prf: { eval: { first: prfSalt() } } },
      },
    })
    .catch((error) => Promise.reject(asReadable(error)));

  const { response } = credential;
  return {
    response: asJson(credential, {
      clientDataJSON: toBase64Url(response.clientDataJSON),
      authenticatorData: toBase64Url(response.authenticatorData),
      signature: toBase64Url(response.signature),
      ...(response.userHandle && { userHandle: toBase64Url(response.userHandle) }),
    }),
    prfSecret: credential.getClientExtensionResults().prf?.results?.first ?? null,
  };
};

export const lockWithPasskey = (privateKey, prfSecret, keyId) => wrapPrivateKey(privateKey, prfSecret, keyId, PASSKEY_KEY);

export const unlockWithPasskey = (backup, prfSecret) => unwrapPrivateKey(backup, prfSecret, PASSKEY_KEY);
