import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const navigationCss = readFileSync(
  new URL("../src/styles/navigation.css", import.meta.url),
  "utf8"
);

const topBarSource = readFileSync(
  new URL("../src/components/TopBar.tsx", import.meta.url),
  "utf8"
);

const appSource = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const adminLayoutSource = readFileSync(
  new URL("../src/admin/AdminLayout.tsx", import.meta.url),
  "utf8"
);

function ruleBody(css: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `Expected CSS rule for ${selector}`);
  return match[1];
}

test("mobile menu links fill the full expanded menu row", () => {
  const baseBody = ruleBody(navigationCss, ".main-nav__link");
  assert.match(baseBody, /display\s*:\s*(?:inline-)?flex\b/);

  const openBody = ruleBody(navigationCss, ".main-nav.is-open .main-nav__link");
  assert.match(openBody, /width\s*:\s*100%/);
});

test("top bar does not render inactive public auth links", () => {
  assert.doesNotMatch(topBarSource, /href="#(?:register|login)"/);
  assert.doesNotMatch(topBarSource, />\s*(?:注册|登录)\s*</);
});

test("admin app exposes invite code navigation and route", () => {
  assert.match(appSource, /path="invites"/);
  assert.match(adminLayoutSource, /to="\/admin\/invites"/);
});
