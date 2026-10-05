import { createSlice } from "@reduxjs/toolkit";

import {
  CreateAccountKey,
  ForgetDeviceKeys,
  PrepareEncryption,
  UnlockWithRecoveryKey,
} from "@/redux/slices/actions/encryptionActions";

// status: 'checking' | 'setup' | 'locked' | 'ready' | 'failed'
const initialState = {
  status: "checking",
  currentKeyId: null,
  unlockOpen: true,
};

const slice = createSlice({
  name: "encryption",
  initialState,
  reducers: {
    setUnlockOpen: (state, action) => {
      state.unlockOpen = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(PrepareEncryption.pending, (state) => {
        state.status = "checking";
      })
      .addCase(PrepareEncryption.fulfilled, (_, action) => ({ ...initialState, ...action.payload }))
      .addCase(PrepareEncryption.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(CreateAccountKey.fulfilled, (state, action) => {
        state.status = "ready";
        state.currentKeyId = action.payload.currentKeyId;
      })
      .addCase(UnlockWithRecoveryKey.fulfilled, (state) => {
        state.status = "ready";
      })
      .addCase(ForgetDeviceKeys.fulfilled, () => initialState);
  },
});

export const { setUnlockOpen } = slice.actions;

export default slice.reducer;
