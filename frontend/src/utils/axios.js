import axios from "axios";

// Set the base URL for all axios requests
axios.defaults.baseURL =
  process.env.REACT_APP_API_ORIGIN || "http://localhost:8000/api";

// Set credentials to true
axios.defaults.withCredentials = true;

// kept in memory only, so a script injected into the page cannot read a stored one
let accessToken = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token) => {
  accessToken = token || null;
};

axios.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

export default axios;
