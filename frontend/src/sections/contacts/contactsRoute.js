import { useParams } from "react-router-dom";

import { PATH_DASHBOARD } from "@/routes/paths";
import { notify } from "@/utils/notify";

const ROOT = PATH_DASHBOARD.general.contacts;

export const REQUESTS_PATH = `${ROOT}/requests`;
export const FIND_PATH = `${ROOT}/find`;
const PANES = ["requests", "find"];

// a person's address is their username, the same link they can share, or their id when they have none
export const contactPathOf = (person) => `${ROOT}/${person.username ? `@${person.username}` : person._id}`;

export const isAddressOf = (person, handle) => handle === `@${person.username}` || handle === person._id;

export const useContactsAddress = () => {
  const { "*": rest = "" } = useParams();
  return { isRequests: rest === "requests", isFinding: rest === "find", handle: rest && !PANES.includes(rest) ? rest : null };
};

export const profileLinkOf = (person) => `${window.location.origin}${contactPathOf(person)}`;

export const copyProfileLink = async (person) => {
  await navigator.clipboard.writeText(profileLinkOf(person));
  notify({ severity: "success", message: "Profile link copied" });
};

// a phone opens its own share sheet, anything else copies the link
export const canShareNatively = () => Boolean(navigator.share) && window.matchMedia("(pointer: coarse)").matches;

export const shareProfile = async (person) => {
  if (!canShareNatively()) return copyProfileLink(person);
  return navigator.share({ title: `${person.firstName} on Whisprl`, url: profileLinkOf(person) }).catch(() => {});
};
