import { describe, expect, test, vi } from "vitest";

vi.mock("@/utils/nativeFeatures", () => ({ hasNative: () => false }));

const { noticeFor } = await import("@/utils/playUpdate");

const VERSIONS = { recommended: 7, required: null };
const POLICY = { isShown: true, isListed: false };
const PLAY = { isOffered: true, canFlexible: true, canImmediate: true };

describe("noticeFor", () => {
  test("nothing is shown while staff keep the reminder off", () => {
    expect(noticeFor({ build: 6, versions: VERSIONS, policy: { ...POLICY, isShown: false }, play: PLAY })).toBeNull();
    expect(noticeFor({ build: 6, versions: { ...VERSIONS, required: 7 }, policy: { isShown: false, isListed: true }, play: null })).toBeNull();
  });

  test("an app at or above every version the code names is told nothing", () => {
    expect(noticeFor({ build: 7, versions: VERSIONS, policy: POLICY, play: PLAY })).toBeNull();
    expect(noticeFor({ build: 6, versions: { recommended: null, required: null }, policy: { ...POLICY, isListed: true }, play: null })).toBeNull();
  });

  test("Play's background download is offered for a recommended update, and its full-screen one for a required update", () => {
    expect(noticeFor({ build: 6, versions: VERSIONS, policy: POLICY, play: PLAY })).toEqual({ level: "recommended", via: "play", flow: "flexible" });
    expect(noticeFor({ build: 6, versions: { ...VERSIONS, required: 7 }, policy: POLICY, play: PLAY })).toEqual({
      level: "required",
      via: "play",
      flow: "immediate",
    });
  });

  test("whichever flow Play allows is used when the preferred one is not", () => {
    expect(noticeFor({ build: 6, versions: VERSIONS, policy: POLICY, play: { ...PLAY, canFlexible: false } })).toMatchObject({ flow: "immediate" });
    expect(noticeFor({ build: 6, versions: { ...VERSIONS, required: 7 }, policy: POLICY, play: { ...PLAY, canImmediate: false } })).toMatchObject({
      flow: "flexible",
    });
  });

  test("a Play install with nothing newer offered yet is told nothing, so a staged rollout never sends people looking", () => {
    expect(noticeFor({ build: 6, versions: VERSIONS, policy: POLICY, play: { ...PLAY, isOffered: false } })).toBeNull();
  });

  test("a Play install Play will not update in the app is sent to the listing it came from", () => {
    expect(noticeFor({ build: 6, versions: VERSIONS, policy: POLICY, play: { ...PLAY, canFlexible: false, canImmediate: false } })).toEqual({
      level: "recommended",
      via: "listing",
    });
  });

  test("an app Play did not install is sent to the listing only once it is open to everyone", () => {
    expect(noticeFor({ build: 6, versions: VERSIONS, policy: POLICY, play: null })).toBeNull();
    expect(noticeFor({ build: 6, versions: VERSIONS, policy: { ...POLICY, isListed: true }, play: null })).toEqual({ level: "recommended", via: "listing" });
  });
});
