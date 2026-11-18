import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { signInReviewer } from "#src/services/authService.js";

describe("signInReviewer", () => {
  afterEach(() => {
    delete process.env.REVIEW_ACCOUNT_EMAIL;
    delete process.env.REVIEW_ACCOUNT_PASSWORD;
  });

  it("refuses everyone while no review account is set", async () => {
    await assert.rejects(signInReviewer("review@example.com", "anything"), { status: 401 });
  });

  it("refuses another email, and the review email with the wrong password", async () => {
    process.env.REVIEW_ACCOUNT_EMAIL = "review@example.com";
    process.env.REVIEW_ACCOUNT_PASSWORD = "the-right-one";
    await assert.rejects(signInReviewer("someone@example.com", "the-right-one"), { status: 401 });
    await assert.rejects(signInReviewer("review@example.com", "the-wrong-one"), { status: 401 });
    await assert.rejects(signInReviewer(undefined, undefined), { status: 401 });
  });
});
