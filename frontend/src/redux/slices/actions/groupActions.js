import { createApiThunk, notifyResult } from "@/redux/slices/actions/apiThunk";
import { OpenConversation } from "@/redux/slices/actions/chatActions";
import { groupUpdated } from "@/redux/slices/chatSlice";
import axios from "@/utils/axios";

// the same update whether it came back from this tab's request or from another member's change
export const GroupUpdated = (group) => (dispatch, getState) =>
  dispatch(groupUpdated({ group, userId: getState().user.user._id }));

const changeGroup = (type, request, message) =>
  createApiThunk(type, async (arg, { dispatch }) => {
    const { data } = await request(arg);
    dispatch(GroupUpdated(data.group ?? { _id: arg.groupId, users: [] }));
    if (message) notifyResult({ status: "success", message });
    return data;
  });

// ------------- Create Group -------------
export const CreateGroup = createApiThunk("groups/create", async ({ name, memberIds }, { dispatch }) => {
  const { data } = await axios.post("/groups", { name, member_ids: memberIds });
  dispatch(GroupUpdated(data.group));
  dispatch(OpenConversation({ ...data.group, latestMessage: null }));
  return data;
});

// ------------- Name and Photo -------------
const pictureOf = async (blobUrl) => new File([await (await fetch(blobUrl)).blob()], "group.jpg", { type: "image/jpeg" });

export const UpdateGroup = changeGroup(
  "groups/update",
  async ({ groupId, name, picture }) => {
    const form = new FormData();
    if (name !== undefined) form.append("name", name);
    if (picture?.startsWith("blob:")) form.append("picture", await pictureOf(picture));
    if (picture === "") form.append("removePicture", "true");
    return axios.patch(`/groups/${groupId}`, form);
  },
  "Group updated"
);

// ------------- Members -------------
export const AddGroupMembers = changeGroup(
  "groups/add-members",
  ({ groupId, memberIds }) => axios.post(`/groups/${groupId}/members`, { member_ids: memberIds }),
  "Added to the group"
);

const removeMember = ({ groupId, userId }) => axios.delete(`/groups/${groupId}/members/${userId}`);

export const RemoveGroupMember = changeGroup("groups/remove-member", removeMember);

export const LeaveGroup = changeGroup("groups/leave", removeMember, "You left the group");

// ------------- Admins -------------
export const SetGroupAdmin = changeGroup("groups/set-admin", ({ groupId, userId, makeAdmin }) =>
  makeAdmin ? axios.put(`/groups/${groupId}/admins/${userId}`) : axios.delete(`/groups/${groupId}/admins/${userId}`)
);
