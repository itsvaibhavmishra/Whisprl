import { EndSession } from "@/redux/slices/actions/authActions";
import { updateUser } from "@/redux/slices/userSlice";
import axios from "@/utils/axios";
import { forgetSessionKey, loadSessionKey, saveSessionKey } from "@/utils/crypto/keyStore";
import { signChallenge } from "@/utils/crypto/sessionKeys";
import { notify } from "@/utils/notify";

// a token is renewed a minute before it runs out, so no request leaves with one about to expire
const RENEW_EARLY_MS = 60 * 1000;
// a sleeping server can take most of a minute to wake, but a renewal that never answers must not hold up every request
const RENEWAL_TIMEOUT_MS = 90 * 1000;

const OFFLINE = { error: { status: "error", message: "Could not reach Whisprl, check your connection" } };
const LOGGED_OUT = { isLoggedOut: true };

let store;
// only for a browser that could not store the key, which then lasts as long as this tab does
let unstoredSession = null;
let token = null;
let renewing = null;
let hasEnded = false;
let isLoggingOut = false;

export const injectStore = (appStore) => {
  store = appStore;
};

// the stored session is shared by every tab, so a login in one is picked up by the others
const currentSession = async () => {
  const userId = store.getState().user.user._id;
  if (unstoredSession?.userId === userId) return unstoredSession;
  // a read that fails rejects, failing this request rather than logging anyone out
  return (await loadSessionKey(userId)) ?? null;
};

const keepToken = ({ accessToken, expiresIn }, sessionId) => {
  token = { value: accessToken, sessionId, renewAt: Date.now() + expiresIn * 1000 - RENEW_EARLY_MS };
};

export const startSession = async ({ user, sessionId, accessToken, expiresIn }, privateKey) => {
  hasEnded = false;
  isLoggingOut = false;
  keepToken({ accessToken, expiresIn }, sessionId);
  unstoredSession = await saveSessionKey(user._id, { sessionId, privateKey }).then(
    () => null,
    () => ({ userId: user._id, sessionId, privateKey })
  );
};

// whatever notices first ends the session for the whole tab, once, and a logout announces itself
const endSessionOnce = (options) => {
  if (!hasEnded && !isLoggingOut) {
    hasEnded = true;
    notify({ severity: "info", message: "You were logged out. Log in again to carry on." });
    store.dispatch(EndSession(options));
  }
  return Promise.reject(LOGGED_OUT);
};

const renew = async () => {
  const session = await currentSession();
  // a browser without a session key, such as one updated from before them, keeps its encryption keys for the next login
  if (!session) return endSessionOnce({ keepDeviceKeys: true });

  const { sessionId, privateKey } = session;
  const asRenewal = { anonymous: true, sessionId, timeout: RENEWAL_TIMEOUT_MS };
  const { challenge } = (await axios.post("/auth/session/challenge", null, asRenewal)).data;
  const signature = await signChallenge(privateKey, challenge);
  const { data } = await axios.post("/auth/session/token", { sessionId, challenge, signature }, asRenewal);

  // a logout while this was on its way leaves its token unused
  if (hasEnded) return Promise.reject(LOGGED_OUT);
  keepToken(data, sessionId);
  store.dispatch(updateUser(data.user));
  return token;
};

const currentToken = () => {
  if (hasEnded) return Promise.reject(LOGGED_OUT);
  if (token && Date.now() < token.renewAt) return Promise.resolve(token);
  renewing ??= renew().finally(() => {
    renewing = null;
  });
  return renewing;
};

export const ensureAccessToken = () => currentToken().then(({ value }) => value);

export const dropAccessToken = () => {
  token = null;
};

export const forgetSession = async (userId, endedSessionId) => {
  hasEnded = true;
  unstoredSession = null;
  token = null;
  await forgetSessionKey(userId, endedSessionId).catch(() => {});
};

const isReplaced = async (sessionId) => {
  const session = await currentSession();
  return Boolean(session) && session.sessionId !== sessionId;
};

// a token another request has already renewed is kept, so a burst of rejected requests renews once
const retryWithNewToken = (config) => {
  if (config.headers.Authorization === `Bearer ${token?.value}`) dropAccessToken();
  return axios({ ...config, isRetry: true });
};

// a session that another login has replaced since the request left is not this browser being logged out
const onSessionEnded = async (config) => {
  if (!(await isReplaced(config.sessionId))) return endSessionOnce({ sessionId: config.sessionId });
  return config.anonymous || config.isRetry ? Promise.reject(LOGGED_OUT) : retryWithNewToken(config);
};

// a logout ends the session this browser keeps, even if this tab was still using an older one
const prepareLogout = async () => {
  isLoggingOut = true;
  if ((await currentSession())?.sessionId !== token?.sessionId) dropAccessToken();
};

axios.interceptors.request.use(async (config) => {
  if (config.anonymous || !store.getState().auth.isLoggedIn) return config;
  if (config.endsSession) await prepareLogout();
  const { value, sessionId } = await currentToken();
  config.headers.Authorization = `Bearer ${value}`;
  config.sessionId = sessionId;
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    // stopped before it left, by an ended session or a failed renewal, so it already says why
    if (!error.isAxiosError) return Promise.reject(error);
    if (!error.response) return Promise.reject(OFFLINE);

    const { config, response } = error;
    const code = response.data?.error?.code;
    if (code === "session_ended") return onSessionEnded(config);
    if (code === "token_invalid" && !config.isRetry) return retryWithNewToken(config);
    return Promise.reject(response.data || OFFLINE);
  }
);
