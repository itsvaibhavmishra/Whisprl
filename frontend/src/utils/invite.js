const INVITE_KEY = "followedInvite";

// kept on this browser until sign-up and setup are done, so the invite survives logins that leave the page
export const rememberInvite = (code) => {
  try {
    localStorage.setItem(INVITE_KEY, code);
  } catch {
    // without storage the invite still shows who sent it, it just can't open their profile after sign-up
  }
};

export const rememberedInvite = () => {
  try {
    return localStorage.getItem(INVITE_KEY);
  } catch {
    return null;
  }
};

export const forgetInvite = () => {
  try {
    localStorage.removeItem(INVITE_KEY);
  } catch {
    // storage that can't be reached holds no invite to remove
  }
};
