import io from "socket.io-client";

import { ensureAccessToken } from "@/utils/session";

const API_ORIGIN = new URL(process.env.REACT_APP_API_ORIGIN || "http://localhost:8000/api").origin;

// every connection attempt asks for a token, so a reconnect never carries an expired one
export const socket = io(API_ORIGIN, {
  autoConnect: false,
  auth: (provide) => ensureAccessToken().then((token) => provide({ token }), () => provide({})),
});
