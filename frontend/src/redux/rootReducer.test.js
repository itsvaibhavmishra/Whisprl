import { configureStore } from "@reduxjs/toolkit";
import { FLUSH, PERSIST, REHYDRATE, persistReducer, persistStore } from "redux-persist";

import { rootPersistConfig, rootReducer } from "@/redux/rootReducer";
import { messageArrived, queueMessage } from "@/redux/slices/chatSlice";

const STORAGE_KEY = "redux-root";

// Writes slices the way redux-persist does: each one serialised inside the outer object.
const saveAsAnEarlierVisit = (slices) => {
  const withMeta = { ...slices, _persist: { version: -1, rehydrated: true } };
  const serialised = Object.fromEntries(
    Object.entries(withMeta).map(([name, state]) => [name, JSON.stringify(state)])
  );
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialised));
};

const openTheApp = () =>
  new Promise((resolve) => {
    const store = configureStore({
      reducer: persistReducer(rootPersistConfig, rootReducer),
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: { ignoredActions: [FLUSH, PERSIST, REHYDRATE] } }),
    });
    const persistor = persistStore(store, null, () => resolve({ store, persistor }));
  });

afterEach(() => window.localStorage.clear());

test("chat saved by an earlier build comes back without its messages", async () => {
  saveAsAnEarlierVisit({
    chat: { conversations: [], messages: [], pendingMessages: [{ localId: "local-1" }] },
  });

  const { store } = await openTheApp();
  const { chat } = store.getState();

  expect(chat.messages).toEqual([]);
  expect(chat.outbox).toEqual([]);
  expect(chat.files).toEqual([]);
});

test("decrypted text is never written to storage", async () => {
  const { store, persistor } = await openTheApp();
  store.dispatch(queueMessage({ clientId: "client-1", conversationId: "conversation-1", text: "an unsent secret" }));
  store.dispatch(messageArrived({ _id: "message-1", conversation: "conversation-1", message: "a decrypted secret" }));
  await persistor.flush();

  expect(store.getState().chat.outbox[0].text).toBe("an unsent secret");
  expect(window.localStorage.getItem(STORAGE_KEY)).not.toContain("secret");
});

test("an access token saved by an earlier build is dropped", async () => {
  saveAsAnEarlierVisit({ user: { user: { _id: "user-1", firstName: "Alice", token: "header.payload.signature" } } });

  const { store, persistor } = await openTheApp();
  await persistor.flush();

  expect(store.getState().user.user).toEqual(expect.objectContaining({ _id: "user-1", firstName: "Alice" }));
  expect(store.getState().user.user.token).toBeUndefined();
  expect(window.localStorage.getItem(STORAGE_KEY)).not.toContain("header.payload.signature");
});

test("a request in flight when the page closed does not leave a button loading forever", async () => {
  saveAsAnEarlierVisit({
    auth: { isLoggedIn: false, isLoading: true, error: false, otpEmail: "a@example.com" },
    user: { isLoading: true, user: { _id: "user-1" } },
    contact: { isSearchLoading: true, isRequestsLoading: true },
  });

  const { store } = await openTheApp();
  const { auth, user, contact, requests } = store.getState();

  expect(auth).toEqual({ isLoggedIn: false, otpEmail: "a@example.com" });
  expect(user).not.toHaveProperty("isLoading");
  expect(contact).not.toHaveProperty("isSearchLoading");
  expect(requests).toEqual({ inFlight: {}, settled: {} });
});
