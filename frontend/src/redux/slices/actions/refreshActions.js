import { GetConversations } from "@/redux/slices/actions/chatActions";
import { GetRequests } from "@/redux/slices/actions/contactActions";
import { GetOngoingGame } from "@/redux/slices/actions/gameActions";
import { GetDiscover, GetStatuses } from "@/redux/slices/actions/statusActions";
import { GetFriends, GetMyProfile, GetOnlineFriends } from "@/redux/slices/actions/userActions";

// what a pull down on each main page fetches again, and the game banner above them all
const refreshing =
  (...thunks) =>
  () =>
  (dispatch) =>
    Promise.all([...thunks, GetOngoingGame].map((thunk) => dispatch(thunk())));

export const RefreshChats = refreshing(GetConversations, GetOnlineFriends);

export const RefreshStatus = refreshing(GetStatuses, GetDiscover);

export const RefreshContacts = refreshing(GetFriends, GetRequests);

export const RefreshSettings = refreshing(GetMyProfile);
