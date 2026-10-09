import { GetOnboarding, MarkWhatsNewSeen } from "@/redux/slices/actions/onboardingActions";
import { GetMyProfile, UpdateProfile, UpdateSuggestionSetting } from "@/redux/slices/actions/userActions";
import userReducer, { updateUser } from "@/redux/slices/userSlice";

const stale = { user: { firstName: "Aria", activityStatus: "", friendCount: 3 } };
const saved = { user: { firstName: "Aria", activityStatus: "Out climbing until Sunday" } };

test("a profile load that a save overtook keeps the save, and still fills the summary", () => {
  const actions = [
    GetMyProfile.pending("read"),
    UpdateProfile.pending("save", {}),
    UpdateProfile.fulfilled(saved, "save", {}),
    GetMyProfile.fulfilled(stale, "read"),
  ];
  const state = actions.reduce(userReducer, undefined);

  expect(state.user.activityStatus).toBe("Out climbing until Sunday");
  expect(state.accountSummary).toEqual({ friendCount: 3 });
});

test("a profile load with no save in between fills the profile", () => {
  const state = [GetMyProfile.pending("read"), GetMyProfile.fulfilled(saved, "read")].reduce(userReducer, undefined);

  expect(state.user.activityStatus).toBe("Out climbing until Sunday");
});

test("the suggestions switch keeps what the server saved, even when a renewed session lands in between", () => {
  const actions = [
    UpdateSuggestionSetting.pending("save", false),
    updateUser({ suggestToFriendsOfFriends: true }),
    UpdateSuggestionSetting.fulfilled({ suggestToFriendsOfFriends: false }, "save", false),
  ];

  expect(actions.reduce(userReducer, undefined).user.suggestToFriendsOfFriends).toBe(false);
});

test("a refused change puts the switch back", () => {
  const actions = [UpdateSuggestionSetting.pending("save", false), UpdateSuggestionSetting.rejected(new Error("offline"), "save", false)];

  expect(actions.reduce(userReducer, undefined).user.suggestToFriendsOfFriends).toBe(true);
});

test("a setup progress read that a save overtook keeps the save", () => {
  const actions = [
    GetOnboarding.pending("read"),
    MarkWhatsNewSeen.pending("seen", "next"),
    MarkWhatsNewSeen.fulfilled({ user: { whatsNewSeen: "next" } }, "seen", "next"),
    GetOnboarding.fulfilled({ user: { whatsNewSeen: null } }, "read"),
  ];

  expect(actions.reduce(userReducer, undefined).user.whatsNewSeen).toBe("next");
});

test("a setup progress read with no save in between brings the account up to date", () => {
  const actions = [GetOnboarding.pending("read"), GetOnboarding.fulfilled({ user: { whatsNewSeen: "2.1.0" } }, "read")];

  expect(actions.reduce(userReducer, undefined).user.whatsNewSeen).toBe("2.1.0");
});
