const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");

test("application form exposes the fields required by backend schema 3.0", () => {
  [
    "firstName", "lastName", "email", "phone", "zip", "referral", "accessibility",
    "role", "secondaryRole", "availability", "interests", "resumeFile",
    "certificationFiles", "ackGuide", "ackCommitment", "ackAccuracy"
  ].forEach((id) => assert.match(html, new RegExp(`id=["']${id}["']`)));
  assert.match(script, /schemaVersion:\s*"3\.0"/);
  assert.match(script, /primaryRole:\s*value\("#role"\)/);
  assert.match(script, /secondaryRole:\s*value\("#secondaryRole"\)/);
});

test("file upload contract includes resume and certification descriptors", () => {
  assert.match(script, /resume:\s*selectedResumeFile\s*\?\s*await fileToDescriptor/);
  assert.match(script, /certifications:\s*await Promise\.all/);
  assert.match(html, /id="certificationFiles"[^>]*multiple/);
});

test("browser draft is explicit and excludes accessibility notes and file contents", () => {
  const draftBlock = script.slice(
    script.indexOf("function collectApplicationDraft()"),
    script.indexOf("function populateSavedDraftCard")
  );
  assert.equal(draftBlock.includes('value("#accessibility")'), false);
  assert.equal(draftBlock.includes("base64"), false);
  assert.match(script, /function scheduleDraftSave\(\) \{\s*if \(!draftWasExplicitlySaved\) return;/);
  assert.match(script, /localStorage\.removeItem\(LEGACY_APPLICATION_DRAFT_KEY\)/);
});

test("withdrawal remains separate from admin review status", () => {
  assert.match(script, /action:\s*"withdraw_application"/);
  assert.doesNotMatch(script, /reviewStatus:\s*"Withdrawn"/);
});
