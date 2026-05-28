import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const drivesPageSource = readFileSync(
  new URL("../src/admin/DrivesPage.tsx", import.meta.url),
  "utf8"
);

test("spider91 drive form does not expose advanced crawler credentials", () => {
  assert.doesNotMatch(drivesPageSource, /target_new/);
  assert.doesNotMatch(drivesPageSource, /crawl_hour/);
  assert.doesNotMatch(drivesPageSource, /python_path/);
  assert.doesNotMatch(drivesPageSource, /script_path/);
});
