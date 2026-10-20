import { BACK, NEXT_TAB, PREVIOUS_TAB, PUSH, motionBetween, stepMotion } from "@/utils/screenMotion";

describe("motionBetween", () => {
  it("pushes into a deeper screen of the same tab and comes back out of it", () => {
    expect(motionBetween("/chat", "/chat/6ad616737b5260316f3a6766")).toBe(PUSH);
    expect(motionBetween("/settings/privacy", "/settings")).toBe(BACK);
    expect(motionBetween("/contacts/@ava", "/contacts")).toBe(BACK);
  });

  it("slides between tabs in the order of the tab bar", () => {
    expect(motionBetween("/chat", "/status")).toBe(NEXT_TAB);
    expect(motionBetween("/contacts", "/status")).toBe(PREVIOUS_TAB);
    expect(motionBetween("/settings/privacy", "/chat")).toBe(PREVIOUS_TAB);
    expect(motionBetween("/status", "/settings")).toBe(NEXT_TAB);
  });

  it("pushes a screen opened from another tab, such as a chat started from a profile", () => {
    expect(motionBetween("/contacts/@ava", "/chat/6ad616737b5260316f3a6766")).toBe(PUSH);
    expect(motionBetween("/status", "/chat/6ad616737b5260316f3a6766")).toBe(PUSH);
  });

  it("leaves the screen in place for a chat's details, which open in a drawer", () => {
    expect(motionBetween("/chat/6ad616737b5260316f3a6766", "/chat/6ad616737b5260316f3a6766/info")).toBeNull();
    expect(motionBetween("/chat/6ad616737b5260316f3a6766/info", "/chat/6ad616737b5260316f3a6766")).toBeNull();
  });

  it("does not slide between screens side by side, nor outside the app's tabs", () => {
    expect(motionBetween("/contacts/requests", "/contacts/find")).toBeNull();
    expect(motionBetween("/auth/login", "/chat")).toBeNull();
    expect(motionBetween("/chat", "/chat")).toBeNull();
  });

  it("pushes a document and comes back from it", () => {
    expect(motionBetween("/settings/about", "/docs/privacy")).toBe(PUSH);
    expect(motionBetween("/docs/privacy", "/settings/about")).toBe(BACK);
  });
});

describe("stepMotion", () => {
  it("slides back only for a step back the app takes", () => {
    expect(stepMotion(-1)).toBe(BACK);
    expect(stepMotion(0)).toBeNull();
  });
});
