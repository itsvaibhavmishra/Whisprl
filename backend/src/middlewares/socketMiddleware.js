import createHttpError from "http-errors";

import { authenticate } from "#src/services/authService.js";
import { hasPassedAgeCheck } from "#src/services/onboardingService.js";

export const socketMiddleware = async (socket, next) => {
  try {
    const { user, sessionId } = await authenticate(socket.handshake.auth?.token);
    if (!hasPassedAgeCheck(user)) throw createHttpError.Forbidden("Finish setting up your account first");
    socket.user = user;
    socket.data.sessionId = sessionId;
    next();
  } catch (error) {
    next(error);
  }
};
