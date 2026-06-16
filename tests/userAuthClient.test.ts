import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const requestSource = readFileSync(
  new URL("../src/auth/request.ts", import.meta.url),
  "utf8"
);
const videosSource = readFileSync(
  new URL("../src/data/videos.ts", import.meta.url),
  "utf8"
);
const actionsSource = readFileSync(
  new URL("../src/components/VideoActions.tsx", import.meta.url),
  "utf8"
);
const shortsSource = readFileSync(
  new URL("../src/pages/ShortsPage.tsx", import.meta.url),
  "utf8"
);

test("viewer request helper dispatches unauthorized event on 401", () => {
  assert.match(requestSource, /new Event\("vs:user-unauthorized"\)/);
  assert.match(requestSource, /res\.status === 401/);
});

test("viewer-facing API callers use the shared auth-aware request helper", () => {
  assert.match(videosSource, /from "\@\/auth\/request"/);
  assert.match(actionsSource, /from "\@\/auth\/request"/);
  assert.match(shortsSource, /from "\@\/auth\/request"/);
});
