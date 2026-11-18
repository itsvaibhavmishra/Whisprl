import { useParams } from "react-router-dom";

import { SITE_URL } from "@/config";
import { PATH_DASHBOARD, PATH_INVITE } from "@/routes/paths";
import { notify } from "@/utils/notify";
import { isApp } from "@/utils/platform";
import { shareLink } from "@/utils/share";
import { firstWordOf } from "@/utils/names";

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

// the app is served from https://localhost on the phone, so its links point at the website instead
export const linkOrigin = isApp ? SITE_URL : window.location.origin;

export const profileLinkOf = (person) => `${linkOrigin}${contactPathOf(person)}`;

export const copyProfileLink = async (person) => {
  await navigator.clipboard.writeText(profileLinkOf(person));
  notify({ severity: "success", message: "Profile link copied" });
};

export const shareProfile = (person) =>
  shareLink({ title: `${firstWordOf(person.name)} on Whisprl`, url: profileLinkOf(person), copied: "Profile link copied" });

export const shareInvite = (code) =>
  shareLink({ title: "Join me on Whisprl", text: "Let's play and chat on Whisprl", url: `${linkOrigin}${PATH_INVITE}/${code}`, copied: "Invite link copied" });
