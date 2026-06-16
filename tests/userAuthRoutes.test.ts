import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const adminRequireSource = readFileSync(
  new URL("../src/admin/RequireAuth.tsx", import.meta.url),
  "utf8"
);

test("app uses separate viewer and admin login routes", () => {
  assert.match(appSource, /path="\/login"/);
  assert.match(appSource, /path="\/register"/);
  assert.match(appSource, /path="\/admin\/login"/);
  assert.match(appSource, /<RequireUserAuth>/);
  assert.match(appSource, /<RequireAuth>/);
});

test("admin auth redirects to admin login page", () => {
  assert.match(adminRequireSource, /to="\/admin\/login"/);
  assert.doesNotMatch(adminRequireSource, /to="\/login"/);
});
