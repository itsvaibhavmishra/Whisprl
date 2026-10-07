import { configureStore } from "@reduxjs/toolkit";
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistReducer, persistStore } from "redux-persist";
import { rootPersistConfig, rootReducer } from "@/redux/rootReducer";

const store = configureStore({
  reducer: persistReducer(rootPersistConfig, rootReducer),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // only development builds run these checks, and the message list is too long for the immutability one
      immutableCheck: false,
      serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] },
    }),
  devTools: process.env.REACT_APP_NODE === "local",
});

const persistor = persistStore(store);

export { store, persistor };
