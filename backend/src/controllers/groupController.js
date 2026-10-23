import { addMembers, announceGroupChange, createGroup, removeMember, setAdmin, updateGroupDetails } from "#src/services/groupService.js";

const handle = (change) => async (req, res) => {
  const result = await change(req);
  announceGroupChange(req.app.get("io"), result);
  res.status(200).json({ status: "success", group: result.group });
};

export const createNewGroup = handle((req) => createGroup(req.user, req.body));

export const updateGroup = handle((req) => updateGroupDetails(req.user, req.params.group_id, req.body, req.file));

export const addGroupMembers = handle((req) => addMembers(req.user, req.params.group_id, req.body.member_ids));

export const removeGroupMember = handle((req) => removeMember(req.user, req.params.group_id, req.params.user_id));

export const makeAdmin = handle((req) => setAdmin(req.user, req.params.group_id, req.params.user_id, true));

export const dropAdmin = handle((req) => setAdmin(req.user, req.params.group_id, req.params.user_id, false));
