import { createAsyncThunk } from "@reduxjs/toolkit";

import { errorMessageOf, notify } from "@/utils/notify";

export const createApiThunk = (type, request, { notifyErrors = true, ...options } = {}) =>
  createAsyncThunk(
    type,
    async (arg, thunkApi) => {
      try {
        return await request(arg, thunkApi);
      } catch (error) {
        const message = errorMessageOf(error);
        // every request that fails offline says the same thing, so one toast stands for all of them
        if (notifyErrors) notify({ severity: "error", message, id: error?.isOffline ? "offline" : undefined });
        return thunkApi.rejectWithValue(message);
      }
    },
    options
  );

export const notifyResult = (data) => notify({ severity: data.status, message: data.message });

// a refusal the thunk decides on itself, rather than one a request threw, still has to reach the person
export const refuse = (rejectWithValue, message) => {
  notify({ severity: "error", message });
  return rejectWithValue(message);
};
