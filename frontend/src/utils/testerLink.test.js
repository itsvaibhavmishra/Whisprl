import { beforeEach, describe, expect, it } from "vitest";

import { forgetTesterLink, isFirstVisitTo, rememberTesterLink, rememberedTesterLink, testerLinkPathOf } from "@/utils/testerLink";

describe("tester links", () => {
  beforeEach(() => localStorage.clear());

  it("keeps a link's code until it is forgotten", () => {
    rememberTesterLink("50b-iEyV");
    expect(rememberedTesterLink()).toBe("50b-iEyV");
    forgetTesterLink();
    expect(rememberedTesterLink()).toBeNull();
  });

  it("counts a browser's first visit to each link only once", () => {
    expect(isFirstVisitTo("50b-iEyV")).toBe(true);
    expect(isFirstVisitTo("50b-iEyV")).toBe(false);
    expect(isFirstVisitTo("other-1")).toBe(true);
  });

  it("builds the page a code opens", () => {
    expect(testerLinkPathOf("50b-iEyV")).toBe("/testers/50b-iEyV");
  });
});
