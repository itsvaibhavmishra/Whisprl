import { createApiThunk, notifyResult } from "@/redux/slices/actions/apiThunk";
import { GetConversations, GetMessages } from "@/redux/slices/actions/chatActions";
import { GetFriends } from "@/redux/slices/actions/userActions";
import { removeFriend } from "@/redux/slices/userSlice";
import axios from "@/utils/axios";
import { sealNote } from "@/utils/crypto/noteCipher";
import { notify } from "@/utils/notify";

// ------------- Get User Data Thunk -------------
export const GetUserData = createApiThunk(
  "user/getUserData",
  async (userId) => (await axios.get("/user/getUserData", { params: { userId } })).data
);

// ------------- Remove Friend Thunk -------------
export const RemoveFriend = createApiThunk("friends/remove-friend", async (friend_id, { dispatch }) => {
  const { data } = await axios.post("/friends/remove-friend", { friend_id });
  dispatch(removeFriend(data));
  notifyResult(data);
  return data;
});

// ------------- Find Profile Thunk -------------
export const FindProfile = createApiThunk(
  "user/findProfile",
  async (username) => (await axios.get("/user/getUserData", { params: { username } })).data,
  { notifyErrors: false }
);

// ------------- Find Everyone Thunk -------------
export const FindEveryone = createApiThunk(
  "user/people",
  async ({ keyword, page = 0 }) => (await axios.get("/user/people", { params: { search: keyword, page } })).data
);

// ------------- Suggestions Thunks -------------
export const GetSuggestions = createApiThunk("friends/suggestions", async () => (await axios.get("/friends/suggestions")).data, { notifyErrors: false });

export const HideSuggestion = createApiThunk("friends/hide-suggestion", async (userId) => (await axios.delete(`/friends/suggestions/${userId}`)).data);

// ------------- Get Requests Thunk -------------
export const GetRequests = createApiThunk("friends/requests", async () => (await axios.get("/friends/requests")).data);

// ------------- Search Users Thunk -------------
export const SearchForUsers = createApiThunk(
  "user/search",
  async ({ keyword, page = 0 }) => (await axios.get("/user/search", { params: { search: keyword, page } })).data
);

// the server names the chat a note is sealed for, since it may be one the two already share
const sealedNoteFor = async (userId, text, meId) => {
  const { data } = await axios.get(`/friends/note-target/${userId}`);
  const cipher = await sealNote(text, { conversationId: data.conversationId, meId, recipient: { _id: userId, publicKeys: data.publicKeys } });
  return { conversationId: data.conversationId, cipher };
};

// ------------- Send Request Thunk -------------
export const SendRequest = createApiThunk("friends/send-request", async ({ userId, text = "" }, { getState }) => {
  const words = text.trim();
  const note = words ? await sealedNoteFor(userId, words, getState().user.user._id) : undefined;
  const { data } = await axios.post("/friends/send-request", { receiver_id: userId, note });
  notifyResult(data);
  return data;
});

// ------------- Cancel Request Thunk -------------
export const CancelRequest = createApiThunk("friends/cancel-request", async (receiver_id) => {
  const { data } = await axios.post("/friends/cancel-request", { receiver_id });
  notifyResult(data);
  return data;
});

// ------------- Accept/Reject Request Thunk -------------
export const AcceptRejectRequest = createApiThunk("friends/accept-reject-request", async ({ sender_id, type }) => {
  const { data } = await axios.post("/friends/accept-reject-request", { sender_id, action_type: type });
  notifyResult(data);
  return data;
});

const nameOf = (person) => `${person.firstName} ${person.lastName}`;

// the server tells every tab of both people, the acting one too, so the lists refetch only here; the kind picks what to say
export const RequestsChanged =
  ({ kind, person, conversationId }) =>
  (dispatch, getState) => {
    dispatch(GetRequests());
    if (kind === "accepted" || kind === "answered") {
      dispatch(GetFriends());
      dispatch(GetConversations());
      if (conversationId && getState().chat.activeConversation?._id === conversationId) dispatch(GetMessages(conversationId));
    }
    if (kind === "received") notify({ severity: "info", message: `${nameOf(person)} wants to be friends` });
    if (kind === "accepted") notify({ severity: "success", message: `${nameOf(person)} accepted your request` });
  };

export const FriendsChanged = () => (dispatch) => {
  dispatch(GetFriends());
  dispatch(GetConversations());
};
