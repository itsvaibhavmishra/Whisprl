import { test } from "node:test";
import assert from "node:assert/strict";

import { changeUpdatePolicy } from "#src/services/updatePolicyService.js";

const OWNER = { _id: "owner" };
const refusal = (details) => changeUpdatePolicy(OWNER, { isShown: true, isListed: false, reason: "Play has 7", ...details });

test("a change needs a reason and an on or off for each switch", async () => {
  await assert.rejects(refusal({ reason: "  " }), /Say why you are doing this/);
  await assert.rejects(refusal({ isShown: "yes" }), /Choose on or off for each/);
  await assert.rejects(refusal({ isListed: undefined }), /Choose on or off for each/);
});
