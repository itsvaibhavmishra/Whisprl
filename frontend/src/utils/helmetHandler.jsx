import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

import { COMMUNITY, SITE_URL } from "@/config";

const WELCOME = {
  title: "Whisprl: Chat & Games | Play with friends in every chat",
  description: `Whisprl is a free chat app with games built in. Play Jackaroo, Chain Reaction, Dots and Boxes and Tic-tac-toe inside your chats, with every message end-to-end encrypted. Join ${COMMUNITY.people} people.`,
};

const PAGES = {
  "/auth/welcome": WELCOME,
  "/auth/login": {
    title: "Sign in | Whisprl",
    description: "Sign in to Whisprl: Chat & Games with Google to chat and play games with your friends, with every message end-to-end encrypted.",
  },
  "/docs/tnc": {
    title: "Terms and conditions | Whisprl",
    description: "The terms and conditions for using Whisprl: Chat & Games.",
  },
  "/docs/privacy": {
    title: "Privacy policy | Whisprl",
    description: "What Whisprl stores, why, who else handles it, how long it is kept and how to have it deleted.",
  },
  "/docs/delete-account": {
    title: "Delete your account | Whisprl",
    description: "How to delete your Whisprl account from the website or the Android app, and what is deleted and kept.",
  },
  "/docs/child-safety": {
    title: "Child safety standards | Whisprl",
    description: "Whisprl's standards against child sexual abuse and exploitation, how to report it, and who to contact.",
  },
  "/chat": { title: "Chats | Whisprl", description: WELCOME.description },
  "/testers": { title: "Become a tester | Whisprl", description: "Help test the Whisprl Android app before it reaches everyone." },
  "/admin/requests": { title: "Game requests | Whisprl", description: WELCOME.description },
};

// Steps inside a flow, which a search result should never land someone in the middle of.
const UNLISTED = ["/auth/review", "/testers", "/404"];

// pages opened with an id or a code, which stays out of titles and canonical links
const OPENED_BY_CODE = ["/chat", "/testers"];

const titleFromPath = (path) => {
  const lastSegment = path.split("/").filter(Boolean).pop();
  if (!lastSegment) return WELCOME.title;
  const words = lastSegment.split(/[_-]/).map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  return `${words.join(" ")} | Whisprl`;
};

const HelmetHandler = () => {
  const { pathname } = useLocation();
  const trimmed = pathname.replace(/\/+$/, "") || "/";
  const path = OPENED_BY_CODE.find((page) => trimmed.startsWith(`${page}/`)) ?? trimmed;
  const { title, description } = PAGES[path] || {
    title: titleFromPath(path),
    description: WELCOME.description,
  };
  const url = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {UNLISTED.includes(path) && <meta name="robots" content="noindex" />}
    </Helmet>
  );
};

export default HelmetHandler;
