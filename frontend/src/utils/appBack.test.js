import { DEFAULT_AUTH, DEFAULT_PATH } from "@/config";
import { PREVIOUS_PAGE, backTargetOf } from "@/utils/appBack";

describe("backTargetOf", () => {
  it("goes one level up from a screen inside a tab", () => {
    expect(backTargetOf("/chat/6ad616737b5260316f3a6766")).toBe("/chat");
    expect(backTargetOf("/settings/privacy")).toBe("/settings");
    expect(backTargetOf("/contacts/@ava")).toBe("/contacts");
  });

  it("goes to the chats from any other tab", () => {
    expect(backTargetOf("/status")).toBe(DEFAULT_PATH);
    expect(backTargetOf("/contacts")).toBe(DEFAULT_PATH);
    expect(backTargetOf("/settings/")).toBe(DEFAULT_PATH);
  });

  it("leaves the app from the chats and from the start of sign-in", () => {
    expect(backTargetOf("/chat")).toBeNull();
    expect(backTargetOf("/auth/welcome")).toBeNull();
    expect(backTargetOf("/setup")).toBeNull();
  });

  it("goes back to the welcome screen from the other sign-in pages", () => {
    expect(backTargetOf("/auth/login")).toBe(DEFAULT_AUTH);
  });

  it("returns to wherever a document or the admin panel was opened from", () => {
    expect(backTargetOf("/docs/privacy")).toBe(PREVIOUS_PAGE);
    expect(backTargetOf("/admin/requests")).toBe(PREVIOUS_PAGE);
  });
});
