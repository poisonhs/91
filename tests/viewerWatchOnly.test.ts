import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const detailPageSource = readFileSync(
  new URL("../src/pages/VideoDetailPage.tsx", import.meta.url),
  "utf8"
);
const shortsPageSource = readFileSync(
  new URL("../src/pages/ShortsPage.tsx", import.meta.url),
  "utf8"
);

test("video detail page is watch-only for viewer users", () => {
  assert.doesNotMatch(detailPageSource, /VideoActions/);
  assert.doesNotMatch(detailPageSource, /deleteVideo/);
  assert.doesNotMatch(detailPageSource, /updateVideoTags/);
  assert.doesNotMatch(detailPageSource, /fetchTags/);
  assert.doesNotMatch(detailPageSource, /onTagsChange=/);
  assert.doesNotMatch(detailPageSource, /availableTags=/);
});

test("shorts page does not expose like or hide actions", () => {
  assert.doesNotMatch(shortsPageSource, /hideVideo/);
  assert.doesNotMatch(shortsPageSource, /\/api\/video\/\$\{encodeURIComponent\(videoId\)\}\/like/);
  assert.doesNotMatch(shortsPageSource, /Heart/);
  assert.doesNotMatch(shortsPageSource, /EyeOff/);
  assert.doesNotMatch(shortsPageSource, /onLikeToggle/);
  assert.doesNotMatch(shortsPageSource, /onHideSuccess/);
});
