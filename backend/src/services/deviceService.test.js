import { test } from "node:test";
import assert from "node:assert/strict";

import { deviceNameOf, isDeviceId } from "#src/services/deviceService.js";
import newDeviceMail from "#src/templates/mail/newDevice.js";

const AGENTS = {
  chromeOnWindows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  edgeOnWindows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
  safariOnIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  chromeOnIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1",
  firefoxOnMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:132.0) Gecko/20100101 Firefox/132.0",
  chromeOnAndroid: "Mozilla/5.0 (Linux; Android 14; CPH2661) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
  samsungOnAndroid:
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36",
  firefoxOnLinux: "Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0",
};

test("a browser is named with the system it runs on", () => {
  assert.equal(deviceNameOf(AGENTS.chromeOnWindows), "Chrome on Windows");
  assert.equal(deviceNameOf(AGENTS.edgeOnWindows), "Edge on Windows");
  assert.equal(deviceNameOf(AGENTS.safariOnIphone), "Safari on iPhone");
  assert.equal(deviceNameOf(AGENTS.chromeOnIphone), "Chrome on iPhone");
  assert.equal(deviceNameOf(AGENTS.firefoxOnMac), "Firefox on Mac");
  assert.equal(deviceNameOf(AGENTS.chromeOnAndroid), "Chrome on Android");
  assert.equal(deviceNameOf(AGENTS.samsungOnAndroid), "Samsung Internet on Android");
  assert.equal(deviceNameOf(AGENTS.firefoxOnLinux), "Firefox on Linux");
});

test("the app is named as the app, whatever its web view says", () => {
  assert.equal(deviceNameOf(AGENTS.chromeOnAndroid, "android"), "the Whisprl app on Android");
});

test("a device that says nothing familiar is still named", () => {
  assert.equal(deviceNameOf(undefined), "a device we don't recognise");
  assert.equal(deviceNameOf("curl/8.7.1"), "a device we don't recognise");
});

test("only a random UUID counts as a device id", () => {
  assert.equal(isDeviceId("3b241101-e2bb-4255-8caf-4136c566a962"), true);
  assert.equal(isDeviceId("3B241101-E2BB-4255-8CAF-4136C566A962"), false);
  assert.equal(isDeviceId("not-a-device"), false);
  assert.equal(isDeviceId({ $ne: null }), false);
  assert.equal(isDeviceId(undefined), false);
});

test("the mail names the device and puts the person's name in as text", () => {
  const { html, text } = newDeviceMail("Tom <b>", "Chrome on Windows");
  assert.ok(html.includes("Hey Tom &lt;b&gt;,"));
  assert.ok(html.includes("from Chrome on Windows"));
  assert.ok(text.includes("Hey Tom <b>,"));
  assert.ok(text.includes("Reset your password"));
});
