import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

import { COMMUNITY, SITE_URL } from "@/config";

const WELCOME = {
  title: "Whisprl | Free Real-Time MERN Chat App",
  description: `Whisprl is a free, real-time MERN chat app. Message friends instantly, share photos and documents, and see who is online and typing. Join ${COMMUNITY.people} people chatting.`,
};

const PAGES = {
  "/auth/welcome": WELCOME,
  "/auth/login": {
    title: "Log in | Whisprl",
    description:
      "Log in to Whisprl, the free real-time MERN chat app, and pick up your conversations where you left off.",
  },
  "/auth/register": {
    title: "Create a free account | Whisprl",
    description:
      "Create a free Whisprl account and chat with your friends in real time, with photo and document sharing built in.",
  },
  "/docs/tnc": {
    title: "Terms and conditions | Whisprl",
    description: "The terms and conditions for using Whisprl, the real-time MERN chat app.",
  },
  "/chat": { title: "Chats | Whisprl", description: WELCOME.description },
};

// Steps inside a flow, which a search result should never land someone in the middle of.
const UNLISTED = ["/auth/verify", "/auth/forgot-password", "/auth/reset-password", "/404"];

const titleFromPath = (path) => {
  const lastSegment = path.split("/").filter(Boolean).pop();
  if (!lastSegment) return WELCOME.title;
  const words = lastSegment
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  return `${words.join(" ")} | Whisprl`;
};

const HelmetHandler = () => {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
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
