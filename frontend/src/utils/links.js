const LINK = /\b(?:https?:\/\/|www\.)[^\s<>"']+[^\s<>"'.,;:!?)\]]/gi;

const hrefOf = (link) => (link.startsWith("www.") ? `https://${link}` : link);

export const linksIn = (text = "") => [...text.matchAll(LINK)].map(([link]) => ({ link, href: hrefOf(link) }));

export const splitLinks = (text = "") => {
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ text: match[0], href: hrefOf(match[0]) });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
};
