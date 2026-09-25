"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const model = require("../automation/workflow-model.cjs");
const fixtures = require("../automation/fixtures/synthetic-applications.json");
const specs = require("../automation/workflow-specs.json");

const PRIVATE_MARKERS = [
  "email",
  "phone",
  "accessibility_notes",
  "resume_file_id",
  "certification_file_ids",
  "withdrawal_token_hash"
];

test("workflow specifications cover Zapier and Make for all three requested integrations", () => {
  assert.equal(specs.workflows.length, 3);
  assert.deepEqual(
    specs.workflows.map((workflow) => workflow.id).sort(),
    ["application-summary-to-pdf", "consented-applicant-to-mailchimp", "team-review-to-notion"]
  );
  specs.workflows.forEach((workflow) => {
    assert.ok(workflow.dedupe_key);
    assert.ok(workflow.validation.length);
    assert.ok(workflow.zapier.trigger);
    assert.ok(workflow.zapier.actions.length);
    assert.ok(workflow.zapier.error_policy);
    assert.ok(workflow.zapier.subscription);
    assert.ok(workflow.make.trigger);
    assert.ok(workflow.make.actions.length);
    assert.ok(workflow.make.error_policy);
    assert.ok(workflow.make.subscription);
  });
});

test("Notion upsert is keyed by submission ID and exposes only the Team Review allowlist", () => {
  const source = {
    ...fixtures.team_review,
    email: "must-not-leak@example.test",
    phone: "000-000-0000",
    accessibility_notes: "must not leak",
    resume_file_id: "must-not-leak",
    withdrawal_token_hash: "must-not-leak"
  };
  const result = model.buildNotionUpsert(source);
  const serialized = JSON.stringify(result).toLowerCase();

  assert.equal(result.dedupe_key, source.submission_id);
  assert.equal(result.lookup.value, source.submission_id);
  PRIVATE_MARKERS.forEach((marker) => assert.equal(serialized.includes(marker), false));
  assert.equal(serialized.includes("must-not-leak"), false);
  assert.equal(serialized.includes("admin_notes"), false);
});

test("PDF report model has a deterministic filename and strips private references", () => {
  const result = model.buildReportSummary(fixtures.private_application);
  const serialized = JSON.stringify(result);

  assert.equal(result.dedupe_key, "SQ-20260926-A1B2C3D4:application-summary");
  assert.equal(result.output_name, "SQ-20260926-A1B2C3D4-application-summary.pdf");
  assert.deepEqual(result.fields.additional_roles, ["Cloud Support · remote digital desk"]);
  assert.match(result.fields.qualification_summary, /Resume on file/);
  assert.equal(serialized.includes("example.test"), false);
  assert.equal(serialized.includes("SYNTHETIC-NOT-A-DRIVE-ID"), false);
  assert.equal(serialized.includes("accessibility"), false);
  assert.equal(serialized.includes("withdrawal"), false);
});

test("Mailchimp model requires separate explicit consent and preserves unsubscribe", () => {
  const noConsent = model.buildMailchimpUpsert({
    ...fixtures.private_application,
    marketing_consent: false
  });
  const withdrawn = model.buildMailchimpUpsert({
    ...fixtures.private_application,
    is_withdrawn: true
  });
  const unsubscribed = model.buildMailchimpUpsert(fixtures.private_application, {
    existingStatus: "unsubscribed"
  });

  assert.deepEqual(noConsent.reason, "explicit_marketing_consent_required");
  assert.deepEqual(withdrawn.reason, "withdrawn");
  assert.deepEqual(unsubscribed.reason, "preserve_unsubscribe");
});

test("eligible Mailchimp model uses pending opt-in, normalized email, and multi-path tags", () => {
  const result = model.buildMailchimpUpsert({
    ...fixtures.private_application,
    email: "  SYNTHETIC.APPLICANT@EXAMPLE.TEST "
  });

  assert.equal(result.eligible, true);
  assert.equal(result.email_address, "synthetic.applicant@example.test");
  assert.equal(result.dedupe_key, "synthetic.applicant@example.test");
  assert.equal(result.status_if_new, "pending");
  assert.equal(result.preserve_unsubscribed, true);
  assert.deepEqual(result.tags, ["Sunrise:Power Runner", "Sunrise:Cloud Support"]);
});

test("automation execution logs cannot contain contact or document data", () => {
  const result = model.buildExecutionLog({
    workflow_id: "team-review-to-notion",
    platform: "synthetic",
    submission_id: fixtures.team_review.submission_id,
    outcome: "prepared",
    reason: "local_test",
    attempt: 1,
    email: "must-not-log@example.test",
    phone: "000-000-0000",
    resume_file_id: "must-not-log"
  });
  const serialized = JSON.stringify(result);

  assert.deepEqual(Object.keys(result), model.LOG_ALLOWLIST);
  assert.equal(serialized.includes("example.test"), false);
  assert.equal(serialized.includes("must-not-log"), false);
});

test("synthetic fixtures contain no real email domains or Google resource identifiers", () => {
  const fixturePath = path.join(__dirname, "../automation/fixtures/synthetic-applications.json");
  const source = fs.readFileSync(fixturePath, "utf8");
  assert.match(source, /@example\.test/);
  assert.doesNotMatch(source, /script\.google\.com|docs\.google\.com|drive\.google\.com/);
  assert.doesNotMatch(source, /@keytechlabs\.org|@uw\.edu/);
});

test("PDF report template matches the privacy-safe report model", () => {
  const templatePath = path.join(__dirname, "../automation/templates/privacy-safe-application-summary.md");
  const template = fs.readFileSync(templatePath, "utf8");
  model.REPORT_ALLOWLIST.forEach((field) => {
    assert.match(template, new RegExp(`\\{\\{${field}\\}\\}`));
  });
  PRIVATE_MARKERS.forEach((marker) => {
    assert.doesNotMatch(template, new RegExp(`\\{\\{${marker}\\}\\}`));
  });
});
