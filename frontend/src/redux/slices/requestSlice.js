import { createSlice, isAnyOf, isFulfilled, isPending, isRejected } from "@reduxjs/toolkit";

// every async thunk in flight, by its type and request id, so each screen can wait on exactly the request it made
const typeOf = (action) => action.type.slice(0, action.type.lastIndexOf("/"));

// a string or number argument names what the request is for, like the friend a card belongs to
const subjectOf = (arg) => (typeof arg === "string" || typeof arg === "number" ? arg : null);

const slice = createSlice({
  name: "requests",
  initialState: { inFlight: {}, settled: {} },
  reducers: {},
  extraReducers(builder) {
    builder
      .addMatcher(isPending, (state, action) => {
        const type = typeOf(action);
        state.inFlight[type] = { ...state.inFlight[type], [action.meta.requestId]: subjectOf(action.meta.arg) };
      })
      .addMatcher(isAnyOf(isFulfilled, isRejected), (state, action) => {
        const type = typeOf(action);
        state.settled[type] = true;
        const inFlight = state.inFlight[type];
        if (!inFlight) return;
        delete inFlight[action.meta.requestId];
        if (!Object.keys(inFlight).length) delete state.inFlight[type];
      });
  },
});

export const selectIsLoading = (state, thunk, subject) => {
  const inFlight = Object.values(state.requests.inFlight[thunk.typePrefix] ?? {});
  return subject === undefined ? inFlight.length > 0 : inFlight.includes(subject);
};

// a list that has never arrived is unknown, not empty
export const selectHasSettled = (state, thunk) => Boolean(state.requests.settled[thunk.typePrefix]);

export default slice.reducer;
