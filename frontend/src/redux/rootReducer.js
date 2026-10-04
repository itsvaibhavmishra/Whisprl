import { combineReducers } from "redux";
import { createTransform } from "redux-persist";
import storage from "redux-persist/lib/storage";
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";
import {
  authReducer,
  chatReducer,
  contactReducer,
  userReducer,
} from "./slices";

// An upload dies with the page, and its base64 preview would eat the localStorage quota.
const forgetUploads = (chat) => ({
  ...chat,
  files: [],
  activeFileIndex: 0,
  pendingMessages: [],
});

const uploadsLiveOnlyInMemory = createTransform(forgetUploads, forgetUploads, {
  whitelist: ["chat"],
});

const rootPersistConfig = {
  key: "root",
  storage,
  keyPrefix: "redux-",
  // Merging onto initial state gives a field added since a user's last visit its default.
  stateReconciler: autoMergeLevel2,
  transforms: [uploadsLiveOnlyInMemory],
};

const rootReducer = combineReducers({
  user: userReducer,
  auth: authReducer,
  chat: chatReducer,
  contact: contactReducer,
});

export { rootPersistConfig, rootReducer };
