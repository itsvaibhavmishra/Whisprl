import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";

import { rootPersistConfig, rootReducer } from "@/redux/rootReducer";
import { addPendingMessage } from "@/redux/slices/chatSlice";

const STORAGE_KEY = "redux-root";

const upload = {
  localId: "local-1",
  dataUrl: "data:image/png;base64,iVBORw0KGgo=",
  fileName: "holiday.png",
  status: "uploading",
  convo_id: "conversation-1",
};

// Writes slices the way redux-persist does: each one serialised inside the outer object.
const saveAsAnEarlierVisit = (slices) => {
  const withMeta = { ...slices, _persist: { version: -1, rehydrated: true } };
  const serialised = Object.fromEntries(
    Object.entries(withMeta).map(([name, state]) => [name, JSON.stringify(state)])
  );
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialised));
};

const readSavedChat = () =>
  JSON.parse(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).chat);

const openTheApp = () =>
  new Promise((resolve) => {
    const store = configureStore({
      reducer: persistReducer(rootPersistConfig, rootReducer),
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
    });
    const persistor = persistStore(store, null, () => resolve({ store, persistor }));
  });

afterEach(() => window.localStorage.clear());

test("chat saved before uploads existed comes back with room for them", async () => {
  saveAsAnEarlierVisit({
    chat: { conversations: [{ _id: "conversation-1" }], messages: [] },
  });

  const { store } = await openTheApp();
  const { chat } = store.getState();

  expect(chat.pendingMessages).toEqual([]);
  expect(chat.files).toEqual([]);
  expect(chat.conversations).toEqual([{ _id: "conversation-1" }]);
});

test("an upload saved by an earlier build is not restored as stuck forever", async () => {
  saveAsAnEarlierVisit({
    chat: { conversations: [], messages: [], pendingMessages: [upload] },
  });

  const { store } = await openTheApp();

  expect(store.getState().chat.pendingMessages).toEqual([]);
});

test("an upload in flight is kept in memory and never written to storage", async () => {
  const { store, persistor } = await openTheApp();

  store.dispatch(addPendingMessage(upload));
  await persistor.flush();

  expect(store.getState().chat.pendingMessages).toEqual([upload]);
  expect(readSavedChat().pendingMessages).toEqual([]);
});
