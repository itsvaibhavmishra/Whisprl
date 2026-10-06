import { combineReducers } from "redux";
import { createTransform } from "redux-persist";
import storage from "redux-persist/lib/storage";
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";
import {
  authReducer,
  chatReducer,
  contactReducer,
  encryptionReducer,
  requestReducer,
  statusReducer,
  userReducer,
} from "@/redux/slices";

// loading flags and decrypted text never reach disk: a saved flag would keep a button spinning on every later visit
const PERSISTED_FIELDS = { auth: ["isLoggedIn", "otpEmail"], user: ["user"] };

const lastingFieldsOf = (slice, key) =>
  Object.fromEntries((PERSISTED_FIELDS[key] ?? []).filter((field) => field in slice).map((field) => [field, slice[field]]));

// a profile stored by an older build can still carry an access token, and the token must stay in memory only
const withoutToken = ({ token, ...profile }) => profile;

const onlyLastingFields = createTransform(lastingFieldsOf, (slice, key) => {
  const kept = lastingFieldsOf(slice, key);
  return kept.user ? { ...kept, user: withoutToken(kept.user) } : kept;
});

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
});

export { rootPersistConfig, rootReducer };
