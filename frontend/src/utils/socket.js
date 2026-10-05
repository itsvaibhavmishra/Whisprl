import io from "socket.io-client";

import { getAccessToken } from "@/utils/axios";

const API_ORIGIN = new URL(process.env.REACT_APP_API_ORIGIN || "http://localhost:8000/api").origin;

// the token is read on every connection attempt, so a reconnect always carries the latest one
export const socket = io(API_ORIGIN, {
  autoConnect: false,
  auth: (provide) => provide({ token: getAccessToken() }),
});
