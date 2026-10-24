import { combineReducers } from "@reduxjs/toolkit";
import { createTransform } from "redux-persist";
import storage from "redux-persist/lib/storage";
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";
import {
  adminReducer,
  authReducer,
  chatReducer,
  contactReducer,
  encryptionReducer,
  gameReducer,
  requestReducer,
  statusReducer,
  userReducer,
} from "@/redux/slices";

// loading flags and decrypted text never reach disk: a saved flag would keep a button spinning on every later visit
const PERSISTED_FIELDS = { auth: ["isLoggedIn", "otpEmail"], user: ["user"] };

const lastingFieldsOf = (slice, key) =>
  Object.fromEntries((PERSISTED_FIELDS[key] ?? []).filter((field) => field in slice).map((field) => [field, slice[field]]));

const onlyLastingFields = createTransform(lastingFieldsOf, lastingFieldsOf);

const rootPersistConfig = {
  key: "root",
  storage,
  keyPrefix: "redux-",
  // Merging onto initial state gives a field added since a user's last visit its default.
  stateReconciler: autoMergeLevel2,
  transforms: [onlyLastingFields],
  whitelist: Object.keys(PERSISTED_FIELDS),
};

const rootReducer = combineReducers({
  user: userReducer,
  auth: authReducer,
  chat: chatReducer,
  contact: contactReducer,
  encryption: encryptionReducer,
  requests: requestReducer,
  status: statusReducer,
  admin: adminReducer,
  game: gameReducer,
});

export { rootPersistConfig, rootReducer };
