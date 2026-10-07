import { keyOf } from "@/sections/chat/conversation/displayItems";
import { fileKeyOf, filesOf, isMediaFile } from "@/utils/messageFiles";

export const mediaItemsOf = (messages) => messages.flatMap((message) => filesOf(message).filter(isMediaFile).map((file) => ({ file, message })));

export const mediaKeyOf = ({ file, message }) => `${keyOf(message)}:${fileKeyOf(file)}`;
