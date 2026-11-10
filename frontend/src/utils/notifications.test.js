import { describe, expect, test, vi } from "vitest";

import { openNotified, setChatOpener, setPageOpener } from "@/utils/notifications";

describe("openNotified", () => {
  const openChat = vi.fn();
  const openPage = vi.fn();
  setChatOpener(openChat);
  setPageOpener(openPage);

  test("a push that names one of Whisprl's pages opens that page", () => {
    openNotified({ path: "/contacts/requests" });
    expect(openPage).toHaveBeenCalledWith("/contacts/requests");
  });

  test("a push about a chat opens the chat", () => {
    openNotified({ conversationId: "abc" });
    expect(openChat).toHaveBeenCalledWith("abc");
  });

  test("an address on another site is never opened as a page", () => {
    openPage.mockClear();
    openNotified({ path: "//example.com", conversationId: "abc" });
    openNotified({ path: "https://example.com", conversationId: "abc" });
    expect(openPage).not.toHaveBeenCalled();
  });
});
