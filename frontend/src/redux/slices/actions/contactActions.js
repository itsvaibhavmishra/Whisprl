import { createApiThunk, notifyResult } from "@/redux/slices/actions/apiThunk";
import { GetFriends } from "@/redux/slices/actions/userActions";
import { removeFriend } from "@/redux/slices/userSlice";
import axios from "@/utils/axios";

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

// ------------- Get Friend Requests Thunk -------------
export const GetFriendRequests = createApiThunk(
  "friends/get-requests",
  async () => (await axios.get("/friends/get-requests")).data
);

// ------------- Get Sent Requests Thunk -------------
export const GetSentRequests = createApiThunk(
  "friends/get-sent-requests",
  async () => (await axios.get("/friends/get-sent-requests")).data
);

// ------------- Search Users Thunk -------------
export const SearchForUsers = createApiThunk(
  "user/search",
  async ({ keyword, page = 0 }) => (await axios.get("/user/search", { params: { search: keyword, page } })).data
);

// ------------- Send Request Thunk -------------
export const SendRequest = createApiThunk("friends/send-request", async (receiver_id) => {
  const { data } = await axios.post("/friends/send-request", { receiver_id });
  notifyResult(data);
  return data;
});

// ------------- Unsend Request Thunk -------------
export const UnsendRequest = createApiThunk("friends/cancel-request", async (receiver_id) => {
  const { data } = await axios.post("/friends/cancel-request", { receiver_id });
  notifyResult(data);
  return data;
});

// ------------- Accept/Reject Request Thunk -------------
export const AcceptRejectRequest = createApiThunk(
  "friends/accept-reject-request",
  async ({ sender_id, type }, { dispatch }) => {
    const { data } = await axios.post("/friends/accept-reject-request", { sender_id, action_type: type });
    if (type === "accept") dispatch(GetFriends());
    notifyResult(data);
    return data;
  }
);
