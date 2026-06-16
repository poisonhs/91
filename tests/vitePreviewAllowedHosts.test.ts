import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const viteConfigSource = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");

test("vite preview allows proxied hosts", () => {
  assert.match(viteConfigSource, /preview:\s*\{[\s\S]*allowedHosts:\s*true/);
});
