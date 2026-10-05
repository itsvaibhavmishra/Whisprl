import { EndSession } from "@/redux/slices/actions/authActions";
import { updateUser } from "@/redux/slices/userSlice";
import axios, { getAccessToken, setAccessToken } from "@/utils/axios";

let store;
let refreshing = null;

export const injectStore = (appStore) => {
  store = appStore;
};

const OFFLINE = { error: { status: "error", message: "Could not reach Whisprl, check your connection" } };

// every caller waiting on an expired token shares one refresh, so the session cookie rotates once
export const refreshAccessToken = () => {
  refreshing ??= axios
    .post("/auth/refresh-token", null, { skipSessionRefresh: true })
    .then(({ data }) => {
      setAccessToken(data.accessToken);
      store.dispatch(updateUser(data.user));
      return data.accessToken;
    })
    .catch((error) => {
      // a busy or waking server is not a reason to sign out and forget this browser's keys
      if (error.status === 401) store.dispatch(EndSession());
      throw error;
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
};

export const ensureAccessToken = () => (getAccessToken() ? Promise.resolve(getAccessToken()) : refreshAccessToken());

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) return Promise.reject(OFFLINE);

    const request = error.config;
    const canRefresh =
      error.response.status === 401 && !request.skipSessionRefresh && !request.retried && store.getState().auth.isLoggedIn;

    if (canRefresh) {
      request.retried = true;
      await refreshAccessToken();
      return axios(request);
    }

    return Promise.reject({ ...(error.response.data || OFFLINE), status: error.response.status });
  }
);
