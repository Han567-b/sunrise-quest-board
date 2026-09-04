const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");

test("application form exposes the fields required by backend schema 3.1", () => {
  [
    "firstName", "lastName", "email", "phone", "zip", "referral", "accessibility",
    "role", "roleSelectionSummary", "availability", "interests", "resumeFile",
    "certificationFiles", "ackGuide", "ackCommitment", "ackAccuracy"
  ].forEach((id) => assert.match(html, new RegExp(`id=["']${id}["']`)));
  assert.match(script, /schemaVersion:\s*"3\.1"/);
  assert.match(script, /selectedRoles:\s*selectedApplicationRoles\.slice\(\)/);
  assert.match(script, /primaryRole:\s*selectedApplicationRoles\[0\]/);
  assert.match(script, /secondaryRoles:\s*selectedApplicationRoles\.slice\(1\)/);
  assert.match(html, /Select one or more paths that fit you\./);
  assert.equal((html.match(/data-role-choice=/g) || []).length, 5);
  assert.doesNotMatch(html, /id=["']secondaryRole["']/);
});

test("onboarding links and acknowledgement are present before final submit", () => {
  assert.match(html, /class="panel-note onboarding-materials"/);
  assert.match(html, /sunrisecomics-jd2k6wxp\.manus\.space/);
  assert.match(html, /youtube\.com\/watch\?v=fnqctMfo0f4/);
  assert.match(html, /id="ackGuide"[^>]*required/);
  assert.match(script, /onboardingMaterials:\s*Boolean\(document\.querySelector\("#ackGuide"\)/);
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
