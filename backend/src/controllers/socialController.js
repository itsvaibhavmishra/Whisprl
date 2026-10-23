import { signInWithProvider } from "#src/services/socialAuthService.js";
import { respondWithSession } from "#src/controllers/authController.js";

const socialLogin = (provider) => async (req, res) => {
  const user = await signInWithProvider(provider, req.body.code);

  await respondWithSession(req, res, user, "Logged In");
};

export const googleAuth = socialLogin("google");

export const githubAuth = socialLogin("github");

export const linkedinAuth = socialLogin("linkedin");
