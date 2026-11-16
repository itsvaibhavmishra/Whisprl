import { createApiThunk } from "@/redux/slices/actions/apiThunk";
import axios from "@/utils/axios";
import { isFirstVisitTo } from "@/utils/testerLink";

// these run on their own behind what the person is doing, so one that fails stays quiet and is tried again later
const QUIET = { notifyErrors: false };

export const GetMyBadges = createApiThunk("badge/mine", async () => (await axios.get("/badges/mine")).data, QUIET);

export const GetPromotion = createApiThunk("badge/promotion", async (code) => (await axios.get(`/promotions/${code}`)).data, QUIET);

export const JoinPromotion = createApiThunk("badge/join", async (code) => (await axios.post(`/promotions/${code}/join`)).data, QUIET);

// the funnel behind a tester link: how many opened it, then how many reached each step
export const CountPromotionVisit = createApiThunk(
  "badge/visit",
  async (code) => {
    if (isFirstVisitTo(code)) await axios.post(`/promotions/${code}/visits`);
  },
  QUIET
);

export const MarkPromotionStep = createApiThunk("badge/step", async ({ code, step }) => (await axios.put(`/promotions/${code}/steps/${step}`)).data, QUIET);

export const ClaimBadges = createApiThunk("badge/claim", async (badgeIds, { dispatch }) => {
  const { data } = await axios.put("/badges/claim", { badgeIds });
  dispatch(GetMyBadges());
  return data;
});

export const SaveBadgeArrangement = createApiThunk("badge/arrange", async (arrangement, { dispatch }) => {
  const { data } = await axios.put("/badges/arrangement", arrangement);
  dispatch(GetMyBadges());
  return data;
});
