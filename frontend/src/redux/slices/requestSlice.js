import { createSlice, isAnyOf, isFulfilled, isPending, isRejected } from "@reduxjs/toolkit";

// every async thunk in flight, by its type and request id, so each screen can wait on exactly the request it made
const typeOf = (action) => action.type.slice(0, action.type.lastIndexOf("/"));

// a string or number argument names what the request is for, like the friend a card belongs to
const subjectOf = (arg) => (typeof arg === "string" || typeof arg === "number" ? arg : null);

const slice = createSlice({
  name: "requests",
  initialState: {},
  reducers: {},
  extraReducers(builder) {
    builder
      .addMatcher(isPending, (state, action) => {
        state[typeOf(action)] = { ...state[typeOf(action)], [action.meta.requestId]: subjectOf(action.meta.arg) };
      })
      .addMatcher(isAnyOf(isFulfilled, isRejected), (state, action) => {
        const inFlight = state[typeOf(action)];
        if (!inFlight) return;
        delete inFlight[action.meta.requestId];
        if (!Object.keys(inFlight).length) delete state[typeOf(action)];
      });
  },
});

export const selectIsLoading = (state, thunk, subject) => {
  const inFlight = Object.values(state.requests[thunk.typePrefix] ?? {});
  return subject === undefined ? inFlight.length > 0 : inFlight.includes(subject);
};

export default slice.reducer;
