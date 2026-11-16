import { PATH_TESTERS } from "@/routes/paths";

const TESTER_LINK_KEY = "followedTesterLink";
const visitKeyOf = (code) => `testerLinkVisited:${code}`;

export const testerLinkPathOf = (code) => `${PATH_TESTERS}/${code}`;

// kept on this browser while someone signs up or logs in with email, which leaves the tester page
export const rememberTesterLink = (code) => {
  try {
    localStorage.setItem(TESTER_LINK_KEY, code);
  } catch {
    // without storage the person opens the link again once signed in
  }
};

export const rememberedTesterLink = () => {
  try {
    return localStorage.getItem(TESTER_LINK_KEY);
  } catch {
    return null;
  }
};

export const forgetTesterLink = () => {
  try {
    localStorage.removeItem(TESTER_LINK_KEY);
  } catch {
    // storage that can't be reached holds no link to remove
  }
};

// true once for each link on this browser, so reloading the page does not count as another person
export const isFirstVisitTo = (code) => {
  try {
    if (localStorage.getItem(visitKeyOf(code))) return false;
    localStorage.setItem(visitKeyOf(code), "1");
    return true;
  } catch {
    return false;
  }
};
