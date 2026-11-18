import { signInWithGoogle } from "#src/services/socialAuthService.js";
import { respondWithSession } from "#src/controllers/authController.js";

export const googleAuth = async (req, res) => {
  const user = await signInWithGoogle(req.body.code);

  await respondWithSession(req, res, user, "Logged in");
};
