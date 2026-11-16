import { createSlice, isAnyOf } from "@reduxjs/toolkit";

import { ClaimBadges, GetMyBadges, GetPromotion, JoinPromotion } from "@/redux/slices/actions/badgeActions";

const slice = createSlice({
  name: "badge",
  initialState: { offered: [], promotion: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(GetMyBadges.fulfilled, (state, action) => {
        state.offered = action.payload.offered;
      })
      .addCase(ClaimBadges.pending, (state, action) => {
        state.offered = state.offered.filter((badge) => !action.meta.arg.includes(badge.id));
      })
      .addMatcher(isAnyOf(GetPromotion.fulfilled, JoinPromotion.fulfilled), (state, action) => {
        state.promotion = action.payload;
      });
  },
});

export default slice.reducer;
