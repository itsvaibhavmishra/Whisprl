import { createSlice } from "@reduxjs/toolkit";

import { GetTeam } from "@/redux/slices/actions/adminActions";
import { logout } from "@/redux/slices/userSlice";

const initialState = { team: null };

const slice = createSlice({
  name: "admin",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(GetTeam.fulfilled, (state, action) => {
        state.team = action.payload.members;
      })
      .addCase(logout, () => initialState);
  },
});

export default slice.reducer;
