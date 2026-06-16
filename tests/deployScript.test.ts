import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const deployScript = readFileSync(new URL("../deploy.sh", import.meta.url), "utf8");

test("deploy script does not use login shells for build commands", () => {
  assert.doesNotMatch(deployScript, /as_deploy_user bash -lc "cd '\$REPO_DIR' && npm (ci|install)"/);
  assert.doesNotMatch(deployScript, /as_deploy_user bash -lc "cd '\$REPO_DIR' && npm run build"/);
  assert.doesNotMatch(deployScript, /as_deploy_user bash -lc "cd '\$REPO_DIR\/backend' && go build -o server \.\/cmd\/server"/);
});
