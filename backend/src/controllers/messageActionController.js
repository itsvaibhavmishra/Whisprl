import { announcePins } from "./conversationController.js";
import { memberRooms } from "../services/conversationService.js";
import { deleteForEveryone, editMessage, hideForMe, setReaction } from "../services/messageActionService.js";

const handle = (action) => async (req, res, next) => {
  try {
    await action(req, req.app.get("io"));
    res.status(200).json({ status: "success" });
  } catch (error) {
    next(error);
  }
};

const announceUpdate = (io, { conversation, message }) => io.to(memberRooms(conversation)).emit("message_updated", message);

// -------------------------- Edit --------------------------
export const edit = handle(async (req, io) =>
  announceUpdate(io, await editMessage(req.params.message_id, req.user._id, req.body.cipher))
);

// -------------------------- Delete For Everyone --------------------------
export const removeForEveryone = handle(async (req, io) => {
  const { conversation, message, isGone, wasPinned } = await deleteForEveryone(req.params.message_id, req.user._id);
  const rooms = memberRooms(conversation);

  if (isGone) io.to(rooms).emit("message_removed", { _id: message._id, conversation: message.conversation });
  else io.to(rooms).emit("message_updated", message);
  if (wasPinned) await announcePins(io, conversation);
});

// -------------------------- Delete For Me --------------------------
// only this person's other tabs hear about it, since nobody else's chat changes
export const removeForMe = handle(async (req, io) =>
  io.to(String(req.user._id)).emit("message_removed", await hideForMe(req.params.message_id, req.user._id))
);

// -------------------------- Reactions --------------------------
export const react = handle(async (req, io) =>
  announceUpdate(io, await setReaction(req.params.message_id, req.user._id, req.body.cipher))
);

export const unreact = handle(async (req, io) =>
  announceUpdate(io, await setReaction(req.params.message_id, req.user._id, null))
);
