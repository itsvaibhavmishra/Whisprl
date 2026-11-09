const plugin = vi.hoisted(() => ({
  ready: vi.fn(async () => {}),
  getBlockedBundles: vi.fn(async () => ({ bundleIds: [] })),
  getBundles: vi.fn(async () => ({ bundleIds: [] })),
  downloadBundle: vi.fn(async () => {}),
  setNextBundle: vi.fn(async () => {}),
  reload: vi.fn(async () => {}),
}));

vi.mock("@capawesome/capacitor-live-update", () => ({ LiveUpdate: plugin }));
vi.mock("@capacitor/app", () => ({ App: { getInfo: async () => ({ build: "9" }), addListener: vi.fn() } }));
vi.mock("@capacitor/core", () => ({
  CapacitorHttp: { get: async () => ({ status: 200, data: { version: "99.0.0", minNativeVersion: 1, url: "https://updates.test/99.zip", signature: "s" } }) },
}));
vi.mock("@/utils/platform", () => ({ isApp: true }));
vi.mock("@/redux/store", () => ({ store: { getState: () => ({ auth: { isLoggedIn: true }, chat: { drafts: { chat1: "half typed" } } }) } }));

let applyStagedUpdate;

beforeAll(async () => {
  vi.stubEnv("REACT_APP_UPDATE_URL", "https://updates.test/latest.json");
  const liveUpdate = await import("@/utils/liveUpdate");
  applyStagedUpdate = liveUpdate.applyStagedUpdate;
  await liveUpdate.startLiveUpdates();
  await vi.waitFor(() => expect(plugin.setNextBundle).toHaveBeenCalledWith({ bundleId: "99.0.0" }));
});

beforeEach(() => {
  plugin.reload.mockClear();
  document.body.innerHTML = "";
});

test("a waiting version holds off while something is typed or a dialog is open", () => {
  document.body.innerHTML = '<input type="email" value="maya@" />';
  applyStagedUpdate();
  document.body.innerHTML = '<div role="dialog"></div>';
  applyStagedUpdate();
  expect(plugin.reload).not.toHaveBeenCalled();
});

test("a waiting version takes over on the next screen, bringing the screen and drafts with it", () => {
  document.body.innerHTML = '<input type="checkbox" value="on" /><input type="search" value="  " />';
  window.history.replaceState(null, "", "/chat/chat1");
  applyStagedUpdate();
  expect(plugin.reload).toHaveBeenCalledTimes(1);
  expect(JSON.parse(localStorage.getItem("whisprl-update-carry-over"))).toEqual(
    expect.objectContaining({ path: "/chat/chat1", drafts: { chat1: "half typed" }, leftAt: null, isLocked: false })
  );
});
