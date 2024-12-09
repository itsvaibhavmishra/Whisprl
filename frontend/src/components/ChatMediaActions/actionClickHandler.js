import { imageSelectHandler } from "../upload/handlers/imageSelectHandler";

const actionHandler = (type) => {
  switch (type) {
    case "gaming":
      return console.log("gaming click");

    case "photo":
      // handling photo click
      imageSelectHandler();
      break;

    case "document":
      return console.log("doc click");

    case "contact":
      return console.log("contact click");

    default:
      break;
  }

  return null;
};

export default actionHandler;
