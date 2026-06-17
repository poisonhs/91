import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adminLayoutSource = readFileSync(
  new URL("../src/admin/AdminLayout.tsx", import.meta.url),
  "utf8"
);

test("admin sidebar users entry uses the expected Chinese label", () => {
  assert.match(adminLayoutSource, /to="\/admin\/users"[\s\S]*用户管理/);
});
