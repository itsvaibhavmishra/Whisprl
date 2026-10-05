import { configureStore, createAsyncThunk } from "@reduxjs/toolkit";

import requestReducer, { selectIsLoading } from "@/redux/slices/requestSlice";

const waitable = () => {
  let finish;
  const done = new Promise((resolve) => {
    finish = resolve;
  });
  return { done, finish };
};

const SearchFriends = createAsyncThunk("friends/search", ({ done }) => done);
const SendRequest = createAsyncThunk("friends/send-request", (receiverId, { extra }) => extra[receiverId].done);

test("each request has its own loader, and one card's request does not load another", async () => {
  const gates = { bob: waitable(), carol: waitable() };
  const store = configureStore({
    reducer: { requests: requestReducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: { extraArgument: gates }, serializableCheck: false }),
  });
  const isLoading = (thunk, subject) => selectIsLoading(store.getState(), thunk, subject);

  const search = waitable();
  const searching = store.dispatch(SearchFriends(search));
  const toBob = store.dispatch(SendRequest("bob"));

  expect(isLoading(SearchFriends)).toBe(true);
  expect(isLoading(SendRequest, "bob")).toBe(true);
  expect(isLoading(SendRequest, "carol")).toBe(false);

  search.finish();
  await searching;
  expect(isLoading(SearchFriends)).toBe(false);
  expect(isLoading(SendRequest)).toBe(true);

  gates.bob.finish();
  await toBob;
  expect(isLoading(SendRequest)).toBe(false);
  expect(store.getState().requests).toEqual({});
});
