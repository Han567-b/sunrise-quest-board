# Sunrise Quest Board Backend MVP

This folder contains the Google Apps Script backend for multi-path applications, privacy-safe team review, restricted uploads, admin decisions, applicant withdrawal, onboarding acknowledgement/email, and internal Player Cards.

Production owner and authorization account: **Han Lin — `han@keytechlabs.org`**.

Do not authorize, deploy, own production resources, or connect Zapier with `hanl34@uw.edu`.

## Files

- `Code.gs` — public submission/withdrawal endpoint and internal admin workflow.
- `Tests.gs` — pure Apps Script smoke tests; it uses fake data and performs no Google writes.
- `appsscript.json` — V8 runtime plus Sheets, Drive, trigger, and send-email scopes.
- `ZAPIER_PLAN.md` — free two-step admin alert boundary and paid-Zap retirement steps.

## Architecture and responsibilities

```text
Public Quest Board
  → Apps Script web app
    → Private Applications (full restricted record)
    → Team Review (privacy-safe restricted review record)
      → admin status edit trigger
        → Private Applications status sync
        → Player Cards after approval only
        → private approval/onboarding email after approval

Resume/certification upload
  → restricted Drive folders
  → internal file IDs in Private Applications only
```

The public endpoint supports only `submit_application` and `withdraw_application`. Admin review is not a public web action; it runs from an installable edit trigger owned by the KTL Workspace account.

## Required Script Properties

In Apps Script, open **Project Settings → Script Properties** and configure:

| Property | Purpose |
| --- | --- |
| `PRIVATE_SHEET_ID` | Restricted Private Applications spreadsheet |
| `TEAM_REVIEW_SHEET_ID` | Restricted Team Review spreadsheet |
| `PLAYER_CARDS_SHEET_ID` | Restricted Player Cards spreadsheet |
| `RESUME_FOLDER_ID` | Restricted Resumes Drive folder |
| `CERTIFICATION_FOLDER_ID` | Restricted Certifications Drive folder |

Never put real IDs in this repository, browser code, logs, screenshots, or documentation.

The script uses the first sheet tab in each configured spreadsheet; it does not depend on a hardcoded tab name.

## Sheet schemas

### Private Applications

The existing 19 columns remain unchanged:

```text
submission_id,first_name,last_name,email,phone,primary_role,secondary_role,skills,availability,reward_preferences,resume_file_id,certification_file_ids,accessibility_notes,heard_about_us,review_status,admin_notes,player_card_created,created_at,updated_at
```

`setupBackend()` appends these private-only extension columns when missing:

```text
zip_code,client_request_id,withdrawal_token_hash,is_withdrawn,withdrawn_at,additional_roles,onboarding_acknowledged,onboarding_acknowledged_at,onboarding_email_status,onboarding_email_sent_at
```

- `zip_code` preserves the existing intake field and never reaches Team Review.
- `client_request_id` prevents duplicate applications when a browser retries.
- `withdrawal_token_hash` stores only a SHA-256 hash, never the raw token.
- `is_withdrawn` defaults to `false`.
- `withdrawn_at` is blank until a verified withdrawal succeeds.
- `additional_roles` stores every selected path after the primary path as a JSON array.
- `secondary_role` remains populated with the first additional path for compatibility with existing records.
- `onboarding_acknowledged` and `onboarding_acknowledged_at` record the required comic/video confirmation at submission time.
- `onboarding_email_status` and `onboarding_email_sent_at` are private delivery controls; they never reach Team Review.

### Team Review

```text
submission_id,name,primary_role,skills_summary,availability_summary,qualification_summary,review_status,admin_notes,player_card_status,last_updated
```

Team Review is created through an explicit allowlist. Its existing `primary_role` column shows a privacy-safe primary/additional path summary for multi-path applications. It must not contain email, phone, accessibility/health notes, resume IDs, certification IDs, document links, withdrawal tokens, or token hashes. Contact details and links accidentally entered into copied free-text summaries are redacted. A withdrawn application is indicated only through the non-sensitive `player_card_status` value `Not Created — Applicant Withdrawn`; `Withdrawn` is not an admin review status.

### Player Cards

```text
player_id,submission_id,name,primary_role,secondary_role,skills,verified_qualifications,badges,quest_credits,completed_quests,stipend_eligibility,member_status,public_profile_consent,created_at,updated_at
```

New cards start with internal-safe defaults: no verified qualifications, empty badge and quest lists, zero credits, `Active` member status, and `public_profile_consent = false`.

`setupBackend()` also appends these Player Card extension columns when missing:

```text
additional_roles,role_history,onboarding_acknowledged,onboarding_acknowledged_at
```

`additional_roles` preserves the complete current multi-path selection. `role_history` is a JSON history of approved role sets so a Player Card is not permanently limited to one path. This is lightweight history readiness; a future admin advancement workflow will be required before coordinators can formally add verified promotions or completed role assignments.

## Access-control policy

Manually verify each production resource:

| Resource | Required access |
| --- | --- |
| Quest Board - Private Applications | Restricted |
| Quest Board - Team Review | Restricted |
| Quest Board - Player Cards | Restricted by default |
| Resumes folder | Restricted |
| Certifications folder | Restricted |
| Other Proof folder | Restricted |

Grant only named KTL team members the access their work requires. Public Player Card visibility requires an applicant's explicit opt-in; a Player Card is internal by default.

The code deliberately does not call Drive sharing APIs. Web-app access allows the public form to call the endpoint; it does not make Sheets, folders, or files public.

## Application workflow

1. Validate required fields, email, one or more allowed roles, shifts/rewards, onboarding acknowledgement, and file limits.
2. Accept the current schema `3.1` and legacy schema `3.0` submissions; reject older stale form contracts.
3. Reuse `client_request_id` for idempotent retry protection.
4. Generate a unique submission ID and UTC timestamps.
5. Upload optional files to the configured restricted folders.
6. Save the first selected path as `primary_role`, retain the first additional path in `secondary_role`, and preserve every additional path in `additional_roles`.
7. Save the full record and onboarding acknowledgement to Private Applications with `Pending Review`.
8. Create one privacy-safe Team Review row with the complete path summary and `Not Created` Player Card status.
9. Return a receipt and the browser-supplied raw withdrawal token. Only the token hash is stored server-side.

If a Team Review write fails after the private row succeeds, retry the same request. Its `client_request_id` repairs the review row without creating a duplicate private record or duplicate upload.

### Upload limits

- Resume: optional PDF, DOC, or DOCX; maximum 5 MB.
- Certifications: up to three PDF, JPG, or PNG files; maximum 5 MB each.
- Combined request uploads: maximum 12 MB.
- Stored filenames use the submission ID, a neutral label, and a sanitized original filename.

File IDs are stored only in Private Applications. Upload code never changes file sharing.

## Admin workflow

Supported `review_status` values are exactly:

- `Pending Review`
- `Approved`
- `Rejected`
- `Needs Info`

New applications default to `Pending Review`. New Team Review records default to `Not Created` for Player Card status.

After `installAdminReviewTrigger()` is installed, an authorized admin edits `review_status` or `admin_notes` in Team Review. The trigger validates the status and synchronizes it to Private Applications. `Approved` creates or updates one Player Card by `submission_id`, copies the full approved path set and onboarding acknowledgement, and records the role set once in `role_history`; retries cannot create a duplicate card or history entry. It then privately looks up first name, email, and primary role and sends the approval/onboarding email through `MailApp` under the trigger owner's KTL Workspace authorization. A withdrawn application cannot be approved, create a card, or receive this email.

Email delivery state stays only in Private Applications:

- `Not Sent` — no approval email attempt has been claimed.
- `Sending` — a send was claimed; automatic retries stop to avoid an uncertain duplicate.
- `Sent` — Google accepted the send; `onboarding_email_sent_at` contains the timestamp.
- `Failed` — Google returned a send error; approval and Player Card remain saved, and reprocessing the Approved row retries.
- `Missing Email` — the private email is blank or invalid; Player Card remains saved and no message is attempted.

Repeated processing of an Approved row with `Sent` does not send again. Do not add these delivery fields or the email address to Team Review. Disable the older paid `Approved → Filter → Lookup → Gmail` Zap after this Apps Script version is verified, or duplicate emails could occur.

An `Approved` decision cannot be reversed automatically while its Player Card remains active. Resolve or deactivate the internal card first under an authorized KTL admin process, then correct the source records deliberately. This guard prevents a rejected applicant from retaining an accidentally active card.

Use `processAllTeamReviewRows()` once if rows were edited before the trigger was installed. It is also a repair/backfill helper.

## Withdrawal workflow

The applicant's browser receipt retains the raw token. A withdrawal succeeds only when its SHA-256 hash matches the restricted private record.

On success:

- the Private Applications row remains as historical data;
- `is_withdrawn` becomes `true`;
- `withdrawn_at` receives a UTC timestamp;
- Team Review receives only the safe withdrawal indication;
- no Player Card can be created afterward;
- if a card already exists, it remains internal history, becomes `Withdrawn`, and public consent is forced to `false`.

## Deployment with the KTL account

Complete these steps while signed in as **`han@keytechlabs.org`**:

1. Open the production Apps Script project.
2. Replace its local source with `Code.gs`, `Tests.gs`, and `appsscript.json` from this folder.
3. Confirm all five Script Properties are present. Do not paste their values into source code.
4. Run `runBackendSelfTests()`; confirm every result has `passed: true`. The updated manifest requests permission to send email on behalf of the active KTL account.
5. Run `setupBackend()` once. Review and approve the requested Sheets, Drive, trigger, and send-email scopes. Confirm the two private email columns were appended; existing rows and values are not overwritten.
6. Confirm the existing installable `onTeamReviewEdit` trigger is owned by `han@keytechlabs.org`. Reinstallation is unnecessary if it already exists and is owned by that account.
7. Run `processAllTeamReviewRows()` only if existing Team Review rows need synchronization.
8. Deploy a **new Web app version** that executes as the deployment owner and accepts calls from the public Quest Board.
9. Copy the resulting `/exec` URL into the `sunrise-submission-endpoint` meta tag in `index.html`.
10. Use fake applicant data to perform one end-to-end submission, Team Review check, approval, Player Card check, and withdrawal test. Remove or clearly label fake rows/files afterward according to KTL policy.

Interactive account switching, OAuth consent, Workspace admin approval, trigger installation, and web-app deployment must be completed manually. Stop if the active account is not `han@keytechlabs.org`.

## Testing

Local automated tests use in-memory Sheets/Drive fakes and never touch Google:

```bash
node --test tests/*.test.cjs
```

Covered cases include valid submission, legacy single-role compatibility, multi-path preservation, onboarding acknowledgement, missing required fields, invalid email, Private Applications write, privacy-safe Team Review sync, duplicate submission protection, approval, Player Card creation/history, duplicate card protection, approval-email copy, duplicate email protection, withdrawn and missing-email skips, send-failure retry, withdrawal, and upload failure handling.

Apps Script pure smoke tests:

1. Select `runBackendSelfTests` in the Apps Script editor.
2. Run it as `han@keytechlabs.org`.
3. Confirm all returned entries have `passed: true`.

Google writes, Drive uploads, installable triggers, and web-app permissions still require the manual KTL Workspace end-to-end test described above.

## Privacy rules

- Full applicant data stays in Private Applications.
- Team Review uses only the allowlisted review fields.
- Uploaded documents stay in restricted KTL Drive folders.
- Do not log request bodies, email, phone, health/accessibility notes, raw tokens, or file IDs.
- Keep onboarding email status/timestamps in Private Applications only; Team Review never receives them.
- Store user-provided strings as literal Sheet values so formula-like input cannot execute.
- Redact contact details and links from free-text fields copied into Team Review.
- Do not commit Google IDs, credentials, tokens, or secrets.
- Player Cards remain internal unless an applicant explicitly opts in.
- Approval is required before card creation.
- Withdrawn applications remain historical and cannot create cards.

## Free automation boundary

Zap 1, the two-step Zapier Free workflow `New Team Review row → Gmail admin alert`, is live. Zap 2, `Approved → Onboarding Email`, was built and tested in Zapier but is being moved to the deployed Apps Script workflow so it does not depend on Zapier Filter, Lookup, or another paid multi-step feature. See `ZAPIER_PLAN.md` for the final handoff and deactivation checklist.
