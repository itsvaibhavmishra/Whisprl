import { memberRooms } from "#src/services/conversationService.js";
import { addMembers, createGroup, removeMember, setAdmin, updateGroupDetails } from "#src/services/groupService.js";

// everyone still in the group, and anyone who just left it, hears about the change; newcomers join its room first
const announce = (io, { group, groupId, events, departed }) => {
  const room = String(groupId);
  const members = group ? memberRooms(group) : [];
  const leavers = departed.map(String);

  if (members.length) io.in(members).socketsJoin(room);
  if (leavers.length) io.in(leavers).socketsLeave(room);

  const recipients = [...members, ...leavers];
  if (recipients.length) io.to(recipients).emit("group_updated", group?.toJSON() ?? { _id: groupId, users: [] });
  events.forEach((event) => io.to(members).emit("message_received", event));
};

const handle = (change) => async (req, res, next) => {
  try {
    const result = await change(req);
    announce(req.app.get("io"), result);
    res.status(200).json({ status: "success", group: result.group });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Create Group --------------------------
export const createNewGroup = handle((req) => createGroup(req.user, req.body));

// -------------------------- Name and Photo --------------------------
export const updateGroup = handle((req) => updateGroupDetails(req.user, req.params.group_id, req.body, req.file));

// -------------------------- Members --------------------------
export const addGroupMembers = handle((req) => addMembers(req.user, req.params.group_id, req.body.member_ids));

export const removeGroupMember = handle((req) => removeMember(req.user, req.params.group_id, req.params.user_id));

// -------------------------- Admins --------------------------
export const makeAdmin = handle((req) => setAdmin(req.user, req.params.group_id, req.params.user_id, true));

export const dropAdmin = handle((req) => setAdmin(req.user, req.params.group_id, req.params.user_id, false));
