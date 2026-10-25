import { createApiThunk, notifyResult } from "@/redux/slices/actions/apiThunk";
import { EndSession } from "@/redux/slices/actions/authActions";
import { updateUser } from "@/redux/slices/userSlice";
import axios from "@/utils/axios";
import { notify } from "@/utils/notify";

const blobUrlToFile = async (blobUrl, fileName) => {
  const blob = await (await fetch(blobUrl)).blob();
  return new File([blob], fileName, { type: blob.type });
};

export const UpdateProfile = createApiThunk(
  "user/update-profile",
  async ({ firstName, lastName, activityStatus, birthday, coverPattern, coverPalette, ...images }, { getState }) => {
    const saved = getState().user.user;
    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("activityStatus", activityStatus);
    formData.append("birthday", birthday);
    formData.append("coverPattern", coverPattern);
    formData.append("coverPalette", coverPalette);
    for (const [kind, removeField] of [
      ["avatar", "removeAvatar"],
      ["cover", "removeCover"],
    ]) {
      if (images[kind].startsWith("blob:")) {
        formData.append(kind, await blobUrlToFile(images[kind], `${kind}.jpg`));
      } else if (!images[kind] && saved[kind]) {
        formData.append(removeField, "true");
      }
    }

    const { data } = await axios.post("/user/update-profile", formData);
    Object.values(images)
      .filter((image) => image.startsWith("blob:"))
      .forEach((image) => URL.revokeObjectURL(image));
    notifyResult(data);
    return data;
  }
);

export const GetMyProfile = createApiThunk("user/me", async () => (await axios.get("/user/me")).data, { notifyErrors: false });

export const ChangePassword = createApiThunk("user/change-password", async (passwords) => {
  const { data } = await axios.post("/user/change-password", passwords);
  notifyResult(data);
  return data;
});

export const SendDeletionCode = createApiThunk("user/deletion-code", async () => {
  const { data } = await axios.post("/user/deletion/code");
  notifyResult(data);
  return data;
});

// the server has already logged the account out everywhere, so this device follows without a logout of its own
export const DeleteAccount = createApiThunk("user/delete-account", async (body, { dispatch }) => {
  const { data } = await axios.post("/user/deletion", body, { endsSession: true });
  await dispatch(EndSession());
  notify({ severity: "info", message: data.message });
  return data;
});

export const SearchFriends = createApiThunk(
  "friends/search",
  async ({ keyword, page = 0 }) => (await axios.get("/friends/search", { params: { search: keyword, page } })).data,
  { notifyErrors: false }
);

export const GetFriends = createApiThunk("friends/get-friends", async () => (await axios.get("/friends/get-friends")).data, { notifyErrors: false });

export const GetOnlineFriends = createApiThunk("friends/online-friends", async () => (await axios.get("/friends/online-friends")).data, {
  notifyErrors: false,
});

export const CheckUsername = createApiThunk("user/check-username", async (username) => (await axios.get("/user/username", { params: { username } })).data, {
  notifyErrors: false,
});

export const UpdateUsername = createApiThunk("user/update-username", async (username) => (await axios.put("/user/username", { username })).data);

// shown at once and put back if the server refuses
export const UpdateQuickReactions = createApiThunk("user/quick-reactions", async (reactions, { dispatch, getState }) => {
  const before = getState().user.user.quickReactions;
  dispatch(updateUser({ quickReactions: reactions }));
  try {
    return (await axios.put("/user/quick-reactions", { reactions })).data;
  } catch (error) {
    dispatch(updateUser({ quickReactions: before }));
    throw error;
  }
});

export const UpdateGameAudio = createApiThunk(
  "user/game-audio",
  async ({ gameId, effects, music }) => (await axios.put(`/user/game-audio/${gameId}`, { effects, music })).data
);

export const UpdateSuggestionSetting = createApiThunk(
  "user/suggestions",
  async (suggestToFriendsOfFriends) => (await axios.put("/user/suggestions", { suggestToFriendsOfFriends })).data
);

export const UpdateBirthdaySetting = createApiThunk(
  "user/birthday-visibility",
  async (showBirthdayToFriends) => (await axios.put("/user/birthday-visibility", { showBirthdayToFriends })).data
);
