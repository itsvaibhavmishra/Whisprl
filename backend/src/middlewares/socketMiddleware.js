import { authenticate } from "#src/services/authService.js";

export const socketMiddleware = async (socket, next) => {
  try {
    const { user, sessionId } = await authenticate(socket.handshake.auth?.token);
    socket.user = user;
    socket.data.sessionId = sessionId;
    next();
  } catch (error) {
    next(error);
  }
};
