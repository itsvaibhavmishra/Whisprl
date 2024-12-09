import { imageSelectHandler } from "../upload/UploadImage";

const actionHandler = (type, dispatch) => {
  switch (type) {
    case "gaming":
      return console.log("gaming click");

    case "photo":
      // handling photo click
      imageSelectHandler(dispatch);
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
