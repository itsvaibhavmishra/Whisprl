import { docSelectHandler } from "@/sections/chat/attachments/docSelectHandler";
import { imageSelectHandler } from "@/sections/chat/attachments/imageSelectHandler";

const actionHandler = (type) => {
  switch (type) {
    case "gaming":
      return console.log("gaming click");

    case "photo":
      // handling photo/video click
      imageSelectHandler();
      break;

    case "document":
      docSelectHandler();
      break;

    case "contact":
      return console.log("contact click");

    default:
      break;
  }

  return null;
};

export default actionHandler;
