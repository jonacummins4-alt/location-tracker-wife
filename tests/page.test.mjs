import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Amy's page has no anon key and signs in as amy", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const client = readFileSync(new URL("../tracker-page.js", import.meta.url), "utf8");
  assert.equal(html.includes("eyJ"), false);
  assert.equal(html.includes("rest/v1"), false);
  assert.equal(html.includes("SUPABASE_KEY"), false);
  assert.equal(html.includes("const P="), false);
  assert.equal(html.includes("send-password-hint"), false);
  assert.equal(html.includes('TRACKER_PERSON = "amy"'), true);
  assert.equal(html.includes("tracker-page.js"), true);
  assert.equal(client.includes("functions/v1/tracker-api"), true);
  assert.equal(client.includes("eyJ"), false);
});
