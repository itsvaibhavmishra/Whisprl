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
        if (notifyErrors) notify({ severity: "error", message });
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
