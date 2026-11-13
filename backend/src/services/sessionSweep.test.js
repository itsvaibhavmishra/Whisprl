import { test } from "node:test";
import assert from "node:assert/strict";

import { socketsWithoutSession } from "#src/services/sessionService.js";

const socket = (sessionId) => ({ data: { sessionId } });

test("only sockets whose session is gone are closed", () => {
  const sockets = [socket("live"), socket("ended"), socket(undefined)];
  assert.deepEqual(
    socketsWithoutSession(sockets, new Set(["live"])).map((each) => each.data.sessionId),
    ["ended"]
  );
});
