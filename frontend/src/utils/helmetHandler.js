import React from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const HelmetHandler = () => {
  const location = useLocation();

  const capitalize = (str) => {
    // Replace underscores and dashes with spaces
    str = str.replace(/[_-]/g, " ");

    // Split the string by spaces
    const words = str.split(" ");

    // Capitalize the first character of each word
    const capitalizedWords = words.map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    });

    // Join the words back together with spaces
    return capitalizedWords.join(" ");
  };

  const getPageMetadata = () => {
    const pathSegments = location.pathname.split("/");
    const firstSegment = pathSegments[1];
    const lastSegment = pathSegments[pathSegments.length - 1];
    const capitalizedLastSegment = capitalize(lastSegment);

    switch (firstSegment) {
      // managing all auth routes
      case "auth":
        if (lastSegment === "welcome") {
          return {
            title: "Whisprl | Real-Time MERN Chat App by Vaibhaw Mishra",
            description:
              "Welcome to Whisprl, a Real-Time web based Chat App developed by Vaibhaw Mishra with advanced features. Make friends, connect and enjoy your stay.",
            keywords:
              "whisprl, vaibhaw mishra, chat, chat app, mern, message, welcome",
          };
        } else {
          return {
            title: `${capitalizedLastSegment} | Whisprl`,
            description:
              "Robust authentication system of Whisprl | Login or Register and connect with your friends on an exciting journey.",
            keywords:
              "login, register, create account, whisprl, vaibhaw mishra, chat, chat app, mern, message, welcome",
          };
        }

      case "app":
        return {
          title: `All Chats | Whisprl`,
          description:
            "Chat, share memes and video call with all your friends with Whisprl's robust communication system on the go.",
        };

      // metadata for all default routes
      default:
        return {
          title: `${capitalizedLastSegment} | Whisprl`,
          description:
            "Welcome to Whisprl, a Real-Time web based Chat App developed by Vaibhaw Mishra with advanced features. Make friends, connect and enjoy your stay.",
          keywords:
            "whisprl, vaibhaw mishra, chat, chat app, mern, message, welcome",
        };
    }
  };

  const { title, description, keywords } = getPageMetadata();

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
    </Helmet>
  );
};

export default HelmetHandler;
