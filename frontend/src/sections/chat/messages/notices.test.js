import { noticeOf } from "@/sections/chat/messages/notices";
import { summaryOf } from "@/utils/messageSummary";

const ME = { _id: "me", firstName: "Mei" };
const WHISPRL = { _id: "whisprl", firstName: "Whisprl" };

const reportNotice = (type, about, name) => noticeOf({ type, about, name }, ME, WHISPRL);

test("a report names a person, their status or a group the way the reporter met them", () => {
  expect(reportNotice("reportReceived", "person", "Aisha Khan").text).toContain("about **Aisha Khan**.");
  expect(reportNotice("reportActioned", "status", "Aisha Khan").text).toContain("about **Aisha Khan's status**");
  expect(summaryOf({ notice: { type: "reportDismissed", about: "group", name: "Game night" } })).toBe("We looked at your report about Game night");
});

test("a dismissed report points at the rules, and suggests blocking a person or leaving a group", () => {
  expect(reportNotice("reportDismissed", "person", "Aisha Khan").text).toMatch(/\[rules\]\(\/docs\/tnc\).*block them\.$/);
  expect(reportNotice("reportDismissed", "group", "Game night").text).toMatch(/leave the group\.$/);
});

test("markup in a reported name is dropped rather than followed", () => {
  expect(reportNotice("reportReceived", "person", "[click](/settings)").text).toContain("**click/settings**");
});

test("an announcement shows the words staff wrote, with its button, and a plain line in the chat list", () => {
  const button = { kind: "open", label: "Invite friends", to: "/contacts" };
  const notice = { type: "announcement", text: "**New:** [invite](/contacts) your friends", button };
  expect(noticeOf(notice, ME, WHISPRL)).toEqual({ text: notice.text, actions: [button] });
  expect(noticeOf({ ...notice, button: undefined }, ME, WHISPRL).actions).toEqual([]);
  expect(summaryOf({ notice })).toBe("New: invite your friends");
});
