import { badgesPathOf } from "@/routes/paths";
import { linkOrigin } from "@/sections/contacts/contactsRoute";
import { shareLink } from "@/utils/share";

export const shareBadge = (badge, personId) => {
  const url = `${linkOrigin}${badgesPathOf(personId)}`;
  const text = `I earned the ${badge.name} badge on Whisprl`;
  return shareLink({ title: badge.name, text, url, copy: `${text}: ${url}`, copied: "Badge link copied" });
};
