# Automation Test Results

Test date: September 26, 2026

## Scope and evidence levels

This report separates local implementation from external-provider verification. No Zapier, Make, Notion, Mailchimp, Google Drive, or production Google Sheet write was performed for the new comparison work.

| Evidence level | Status |
| --- | --- |
| Locally implemented | Workflow specifications, privacy transformations, consent gates, fake fixtures, automated tests, and documentation |
| Locally tested | Zapier/Make specification completeness, Notion allowlist, PDF report allowlist/dedupe, Mailchimp consent/unsubscribe gates, multi-role tags, PII-safe execution logging |
| Externally tested | None for the three new workflows; credentials and approved test resources were not available |
| Prepared, awaiting authorization | Notion upsert, PDF generation/storage, and Mailchimp add/update scenario definitions |
| Requires additional development | Production automation log; approved report template; dedicated marketing-consent fields; provider-specific exported Zap/Make configurations |

## Synthetic environment

- Fixture file: `automation/fixtures/synthetic-applications.json`
- Synthetic email domain: `.example.test`
- Fake Submission ID: `SQ-20260926-A1B2C3D4`
- Fake file references are visibly marked and are not Google Drive IDs.
- No KTL email, real applicant contact detail, resume, certification, Google resource ID, access token, or provider credential is present.

## New automation tests

Command:

```bash
node --test tests/automation-workflows.test.cjs
```

Result: **8 passed, 0 failed**.

| Test | Result |
| --- | --- |
| All three workflows contain equivalent Zapier and Make trigger/action/error/subscription definitions | PASS |
| Notion upsert uses Submission ID and the Team Review allowlist only | PASS |
| PDF summary has deterministic dedupe/filename and strips private references | PASS |
| Mailchimp requires separate explicit consent and skips withdrawn applicants | PASS |
| Mailchimp preserves unsubscribe status | PASS |
| Eligible Mailchimp payload normalizes email, uses pending opt-in, and preserves multi-path tags | PASS |
| Result logging drops contact and document fields | PASS |
| Fixture contains no production domains or Google resource URLs | PASS |
| Privacy-safe PDF template contains every approved model field and no private-field placeholder | PASS |

The table lists nine assertions across eight Node test cases because the consent/withdrawal/unsubscribe protections are grouped in one case.

## Existing Quest Board regression tests

Initial pre-change command:

```bash
node --test tests/*.test.cjs
```

Initial result before adding the automation suite: **31 passed, 0 failed**.

Coverage included:

- schema 3.0 backward compatibility and schema 3.1 submission;
- required fields and email validation;
- multi-path primary/additional role preservation;
- Private Applications and privacy-safe Team Review writes;
- formula neutralization;
- duplicate request repair;
- resume and supporting document upload, including DOCX;
- non-destructive Team Review status dropdown setup;
- Needs Info, Approved, status reversal guard, Player Card creation, and duplicate protection;
- onboarding email success, missing email, duplicate prevention, and failure retry state;
- applicant withdrawal and invalid token protection;
- Apps Script self-tests and manifest mail scope;
- frontend onboarding, upload, draft, and withdrawal contracts.

The final combined regression result is recorded at the end of this file after all documentation/code checks are complete.

## Privacy/security assertions

Locally verified:

- Notion receives no email, phone, accessibility note, resume ID, supporting-file ID, or withdrawal token/hash.
- PDF summaries receive qualification presence/count, not file IDs or private links.
- Automation logs receive Submission ID and technical outcome only.
- Mailchimp receives contact data only after a dedicated `marketing_consent === true` gate.
- A withdrawn application is ineligible for Mailchimp.
- An unsubscribed Mailchimp member remains unsubscribed.
- No third-party workflow can edit approval, withdrawal, Player Card, or onboarding-email state.

Not externally verified:

- OAuth scopes granted by actual Zapier/Make connections.
- Provider run-history retention settings.
- Restricted Notion/Drive folder permissions.
- Actual Notion, Docs, Drive, or Mailchimp API responses.
- Provider-specific retry behavior under live rate limiting.
- Actual task/credit consumption.

## External test matrix awaiting authorization

| Workflow | Synthetic external tests required |
| --- | --- |
| Team Review → Notion | create, repeat/dedupe, status update, invalid ID, rate-limit retry, restricted access, disconnect/revoke |
| Sheet → Docs/PDF → Drive | template merge, PDF export, deterministic existing-file handling, upload failure, restricted folder inheritance, file size |
| Private Applications → Mailchimp | no-consent skip, double opt-in, existing update, role tags, unsubscribe preservation, withdrawn skip, invalid email, transient retry |

Mailchimp testing must use a test audience and addresses controlled by the tester. It must not send marketing content to real applicants.

## Final combined validation

| Check | Result |
| --- | --- |
| Full Node suite | PASS — 39 tests, 0 failures |
| `script.js` and automation module syntax | PASS |
| Apps Script `Code.gs` / `Tests.gs` syntax through temporary `.js` copies | PASS |
| Workflow/fixture JSON parse | PASS |
| `git diff --check` | PASS |
| Desktop local page load | PASS — no page-level horizontal overflow |
| 390 × 844 responsive check | PASS — no page-level horizontal overflow; application modal fits viewport |
| Browser console | PASS — no warnings or errors during the non-submitting smoke check |
| Existing background/design preservation | PASS — `styles.css` has no local change; hero/background rendered as expected |
| Secret/PII scan | PASS — no private keys, API keys, OAuth tokens, client secrets, production Sheet/Drive IDs, or real applicant data found in intended additions |
| Commit scope | PASS before staging — `AGENTS.md` and `PROJECT_MEMORY.md` remain untracked/excluded; established public Apps Script endpoint is unchanged |

The browser check opened the form but did not submit it. A previously saved synthetic local-browser draft was visible; it was not transmitted and is not a repository file.
