import assert from "node:assert/strict";
import { describe, it } from "node:test";

import accountNoticeMail from "#src/templates/mail/accountNotice.js";
import otpMail from "#src/templates/mail/otp.js";
import { escapeHtml } from "#src/templates/mail/layout.js";

const MARKUP = `<img src=x onerror="alert(1)">`;

describe("escapeHtml", () => {
  it("turns every character that could start markup into text", () => {
    assert.equal(escapeHtml(`Tom & Jerry <b>"hi"</b> it's`), "Tom &amp; Jerry &lt;b&gt;&quot;hi&quot;&lt;/b&gt; it&#39;s");
  });
});

describe("emails", () => {
  it("put a name into the HTML as text, and into the plain version as typed", () => {
    const { html, text } = otpMail(`Tom & ${MARKUP}`, "123456");
    assert.ok(html.includes("Hey Tom &amp; &lt;img src=x onerror=&quot;alert(1)&quot;&gt;,"));
    assert.ok(!html.includes(MARKUP));
    assert.ok(text.includes(`Hey Tom & ${MARKUP},`));
  });

  it("put the reason staff gave into the HTML as text", () => {
    const { html, text } = accountNoticeMail({ name: "Ava", heading: "Your account is suspended", body: "It ends soon.", reason: `Spam & ${MARKUP}` });
    assert.ok(html.includes("Spam &amp; &lt;img"));
    assert.ok(!html.includes(MARKUP));
    assert.ok(text.includes(`Spam & ${MARKUP}`));
  });
});
