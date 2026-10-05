import { combineReducers } from "redux";
import { createTransform } from "redux-persist";
import storage from "redux-persist/lib/storage";
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";
import {
  authReducer,
  chatReducer,
  contactReducer,
  encryptionReducer,
  userReducer,
} from "./slices";

// Decrypted text must never reach disk, a stored chat would carry stale keys, and an upload's preview would eat the quota.
const keepOnlyWhatIsSafeToStore = (chat) => ({
  ...chat,
  messages: [],
  conversations: [],
  activeConversation: null,
  activeConvoFriendship: null,
  files: [],
  activeFileIndex: 0,
  pendingMessages: [],
});

const chatStoredWithoutMessages = createTransform(keepOnlyWhatIsSafeToStore, keepOnlyWhatIsSafeToStore, {
  whitelist: ["chat"],
});

const rootPersistConfig = {
  key: "root",
  storage,
  keyPrefix: "redux-",
  // Merging onto initial state gives a field added since a user's last visit its default.
  stateReconciler: autoMergeLevel2,
  transforms: [chatStoredWithoutMessages],
  blacklist: ["encryption"],
};

const rootReducer = combineReducers({
  user: userReducer,
  auth: authReducer,
  chat: chatReducer,
  contact: contactReducer,
  encryption: encryptionReducer,
});

export { rootPersistConfig, rootReducer };
