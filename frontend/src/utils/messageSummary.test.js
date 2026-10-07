import { quoteSummaryOf, summaryOf } from "@/utils/messageSummary";

const viewOnce = (viewedBy = [], extra = {}) => ({ sender: { _id: "sender" }, viewOnce: true, viewedBy, file: { kind: "image" }, attachment: { status: "ready" }, ...extra });

test("a quoted view-once photo says what it is until it is opened", () => {
  expect(quoteSummaryOf(viewOnce(), "sender")).toBe("View once photo");
  expect(quoteSummaryOf(viewOnce([], { file: { kind: "video" } }), "reader")).toBe("View once video");
});

test("its sender sees it opened once anyone has opened it", () => {
  expect(quoteSummaryOf(viewOnce(["reader"]), "sender")).toBe("Opened");
});

test("anyone else sees it opened only once they have opened it themselves", () => {
  expect(quoteSummaryOf(viewOnce(["someone else"]), "reader")).toBe("View once photo");
  expect(quoteSummaryOf(viewOnce(["reader"]), "reader")).toBe("Opened");
  expect(quoteSummaryOf(viewOnce([], { attachment: { status: "opened" } }), "reader")).toBe("Opened");
});

test("a quote of anything else reads as its summary", () => {
  expect(quoteSummaryOf({ message: "see you at 6" }, "reader")).toBe("see you at 6");
});

test("files read as one photo or video, a group of them as photos, and anything else as a file", () => {
  expect(summaryOf({ files: [{ fileType: "image" }] })).toBe("Photo");
  expect(summaryOf({ files: [{ fileType: "video" }] })).toBe("Video");
  expect(summaryOf({ files: [{ fileType: "image" }, { fileType: "video" }] })).toBe("Photos");
  expect(summaryOf({ files: [{ fileType: "document" }] })).toBe("File");
});
