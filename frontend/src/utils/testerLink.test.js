import { beforeEach, describe, expect, it } from "vitest";

import { isFirstVisitTo, testerLinkPathOf } from "@/utils/testerLink";

describe("tester links", () => {
  beforeEach(() => localStorage.clear());

  it("counts a browser's first visit to each link only once", () => {
    expect(isFirstVisitTo("50b-iEyV")).toBe(true);
    expect(isFirstVisitTo("50b-iEyV")).toBe(false);
    expect(isFirstVisitTo("other-1")).toBe(true);
  });

  it("builds the page a code opens", () => {
    expect(testerLinkPathOf("50b-iEyV")).toBe("/testers/50b-iEyV");
  });
});
