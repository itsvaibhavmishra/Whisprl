import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const versions = JSON.parse(readFileSync("android/app-versions.json", "utf8"));
const versionCode = Number(readFileSync("android/app/build.gradle", "utf8").match(/^\s*versionCode (\d+)/m)[1]);
const isVersionCode = (value) => Number.isInteger(value) && value >= 1;

// edited by hand, so a slip is caught here rather than on people's phones
describe("android/app-versions.json", () => {
  test("live updates reach an app that exists", () => {
    expect(isVersionCode(versions.liveUpdateFloor)).toBe(true);
    expect(versions.liveUpdateFloor).toBeLessThanOrEqual(versionCode);
  });

  test("an app is never reminded of a version newer than the one being built", () => {
    if (versions.recommended !== null) expect(isVersionCode(versions.recommended) && versions.recommended <= versionCode).toBe(true);
    if (versions.required !== null) expect(isVersionCode(versions.required) && versions.required <= versionCode).toBe(true);
  });

  test("nothing is required that is not also recommended", () => {
    if (versions.required !== null) expect(versions.recommended).toBeGreaterThanOrEqual(versions.required);
  });
});
