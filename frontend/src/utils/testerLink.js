import { PATH_TESTERS } from "@/routes/paths";

const visitKeyOf = (code) => `testerLinkVisited:${code}`;

export const testerLinkPathOf = (code) => `${PATH_TESTERS}/${code}`;

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
