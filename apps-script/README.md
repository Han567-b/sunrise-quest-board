# Sunrise Quest Board — Apps Script MVP

This folder contains the Phase 2B MVP submission backend. It deliberately uses
two separate Spreadsheet files so link viewers of the team review file cannot
open private application data.

## Files

- `Code.gs` — POST endpoint, validation, Submission ID generation, idempotency,
  private application writing, and sanitized team review writing.
- `appsscript.json` — V8 runtime and the minimum Spreadsheet OAuth scope.

## Required Spreadsheet files

Create two different Google Spreadsheet files.

### 1. Sunrise Private Applications

Keep this file **Restricted**. Create a sheet named `Applications_Private` with
this exact first row:

```text
submission_id,submitted_at_utc,schema_version,client_request_id,full_name,email,phone,zip_code,referral_source,accessibility_health_needs,role_target,availability_shift,event_lead_experience,skills_interests,proof_description,supporting_links,reward_preferences,ack_training_comic,ack_commitment,ack_accuracy
```

### 2. Sunrise Team Review

Set this file to **Anyone with the link can view**, do not publish it to the web,
and invite Event Lead editors separately. Create a sheet named `Team_Review`
with this exact first row:

```text
submission_id,submitted_at_utc,display_name,role_target,availability_shift,skills_summary,supporting_material_available,reward_preferences,readiness_status,team_notes
```

The endpoint creates this row through an explicit allowlist. It never includes
email, phone, zip code, accessibility or health needs, referral source,
supporting URLs, proof text, or Event Lead experience. Email addresses, phone
numbers, and URLs accidentally entered in the skills field are redacted before
the skills summary reaches this file.

## Script Properties

In Apps Script, open **Project Settings → Script Properties** and add:

| Property | Value |
| --- | --- |
| `PRIVATE_SPREADSHEET_ID` | ID of the restricted private applications file |
| `TEAM_SPREADSHEET_ID` | ID of the sanitized team review file |
| `PRIVATE_SHEET_NAME` | `Applications_Private` |
| `TEAM_SHEET_NAME` | `Team_Review` |
| `SUBMISSION_SEQUENCE` | `0` for the first deployment |

The script rejects configuration that points both destinations at the same
Spreadsheet file.

## Initial setup

1. Create the two Spreadsheet files with the sharing rules above.
2. Add the Script Properties.
3. Copy this folder into an Apps Script project, or use `clasp` if available.
4. Run `setupSheets` once from the Apps Script editor. It creates missing tabs
   and headers, but refuses to overwrite an existing non-matching header row.
5. Review and authorize the Spreadsheet permission.

## Web app deployment

Deploy as a Web app that executes as the deployment owner. The access setting
must allow the public Quest Board to call it. Copy only the resulting `/exec`
URL into the public configuration slot in `index.html`:

```html
<meta name="sunrise-submission-endpoint" content="https://script.google.com/macros/s/DEPLOYMENT_ID/exec">
```

The Web app URL is public by design; it is not a secret. Spreadsheet IDs,
authorization tokens, and private configuration must remain in Script
Properties and must never be added to GitHub Pages.

## Request contract

```json
{
  "schemaVersion": "2B.1",
  "clientRequestId": "browser-generated-uuid",
  "clientCompletedAt": "2026-08-24T12:00:00.000Z",
  "applicant": {
    "fullName": "Example Applicant",
    "email": "applicant@example.com",
    "phone": "+1 555 0100",
    "zipCode": "10001",
    "referralSource": "Sunrise Fair team",
    "accessibilityHealthNeeds": ""
  },
  "application": {
    "roleTarget": "Power Runner · solar / technical",
    "availabilityShift": "September 26 · Shift 2 midday · 12:00 PM–3:00 PM",
    "eventLeadExperience": "",
    "skillsInterests": "Solar setup and battery checks",
    "proofDescription": "Completed prior event setup training",
    "supportingLinks": ["https://example.com/resume"],
    "rewardPreferences": ["Quest credits", "Badge progress"]
  },
  "acknowledgements": {
    "trainingComic": true,
    "commitment": true,
    "accuracy": true
  }
}
```

Resume and certification binaries are intentionally not part of the MVP. An
applicant supplies shareable `http://` or `https://` links instead.

## Response contract

Success:

```json
{
  "ok": true,
  "submissionId": "SQ-20260926-000001",
  "submittedAtUtc": "2026-08-24T12:00:01.000Z",
  "duplicate": false
}
```

Failure responses use `ok: false` and one of these public codes:

- `INVALID_JSON`
- `VALIDATION_ERROR`
- `CONFIG_ERROR`
- `PRIVATE_WRITE_FAILED`
- `TEAM_WRITE_FAILED`
- `SERVICE_BUSY`
- `INTERNAL_ERROR`

No response exposes a Spreadsheet ID, private row, supporting URL, or internal
authorization detail.

## MVP operational note

The two Spreadsheet writes are not a database transaction. If the private row
is written but the sanitized team row fails, the response includes the assigned
Submission ID and asks the browser to retry. The same `clientRequestId` repairs
the missing team row without creating a second private application.
