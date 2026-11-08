import { openViewOnceFile } from "@/utils/attachments";

beforeEach(() => {
  globalThis.fetch = async () => new Response("bytes");
});

test("our own media keeps its type, codec details included", async () => {
  expect((await openViewOnceFile({ url: "voice", mimeType: "audio/webm;codecs=opus" })).type).toBe("audio/webm;codecs=opus");
});

test("any other type is handed over as plain bytes", async () => {
  expect((await openViewOnceFile({ url: "page", mimeType: "text/html" })).type).toBe("application/octet-stream");
});
