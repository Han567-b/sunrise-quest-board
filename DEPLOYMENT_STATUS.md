# Sunrise Quest Board Deployment Status

Status date: September 26, 2026

## Executive status

| Area | Status |
| --- | --- |
| Existing public GitHub Pages release | Active at the established public site; post-release verification remains required after the status commit |
| Production Apps Script | `Code.gs` and `Tests.gs` synchronized with the KTL project; Web App Version 2 deployed September 26, 2026 at 1:53 AM on the existing endpoint |
| Previous unfinished frontend/backend improvements | Committed and synchronized with the production backend |
| New Zapier vs. Make technical preparation | Implemented locally with synthetic tests; no external workflow activated |
| Apps Script production synchronization | Completed manually using `han@keytechlabs.org`; self-tests and `setupBackend()` completed successfully |
| Git release commit | `7d7abd0` (`Prepare automation comparison and application safeguards`) |
| Git push | Release commit is present on `origin/main`; this deployment-status update will be pushed after final regression checks |

## Repository baseline

- Baseline local/remote commit at the start: `3e81105` (`Add multi-path applications and approval onboarding`).
- Branch: `main`.
- Existing Zap 1 remains `New Team Review row → Admin Alert`; no code or schema change replaces it.
- `AGENTS.md` and `PROJECT_MEMORY.md` are local untracked guidance files and must remain untracked, unchanged, and excluded from commits.

## Unfinished production update inherited from the previous session

The current local work adds:

- clearer application guidance;
- one resume plus up to three supporting documents;
- PDF, DOC, DOCX, JPG, and PNG support as appropriate;
- additive multi-batch file selection, filename display, and individual removal;
- 5 MB per-file and 12 MB combined limits;
- draft filename recovery with explicit reattachment notice;
- strict four-status Team Review dropdown and frozen header;
- related tests and documentation.

The backend files identified for production synchronization are:

```text
apps-script/Code.gs
apps-script/Tests.gs
```

`apps-script/appsscript.json` has no local change in this update.

## Production synchronization record

The production synchronization was completed manually in the existing KTL Apps Script project while signed in as `han@keytechlabs.org`:

1. the repository versions of `Code.gs` and `Tests.gs` were copied into the existing project;
2. `runBackendSelfTests()` completed without an error;
3. `setupBackend()` completed successfully;
4. the existing Web App deployment was updated to Version 2 on September 26, 2026 at 1:53 AM;
5. the established public Web App endpoint remained unchanged.

`appsscript.json` did not change in this release and did not require another synchronization. No new endpoint, Script Property, production resource ID, or sharing change was created. Production Script Properties and sharing state are intentionally not stored in this repository.

## `setupBackend()` safety inspection

The local function currently:

1. reads IDs from existing Script Properties;
2. opens the configured Private Applications, Team Review, and Player Cards sheets;
3. validates base headers and appends only missing extension headers;
4. freezes the Team Review first row;
5. applies strict `Pending Review / Approved / Rejected / Needs Info` validation to the status column and adds a header note;
6. checks that configured Restricted upload folders are accessible;
7. returns resource names and setup status.

It does **not**:

- delete rows, files, sheets, folders, or historical applications;
- overwrite existing application values;
- add `Withdrawn` to review statuses;
- change Script Properties;
- install or remove triggers;
- change Drive/Sheet sharing;
- create public links.

The function completed successfully in production after source synchronization.

## New automation integration status

| Integration | State | Production effect |
| --- | --- | --- |
| Existing Zapier Free admin alert | Existing/live per project record | Preserved; no change |
| Team Review → Notion | Prepared locally | None; not connected/authorized |
| Application summary → PDF → Drive | Prepared locally | None; no template/folder connection |
| Consented applicant → Mailchimp | Blocked by missing explicit marketing-consent field | None; cannot subscribe anyone |

No real applicant data, production upload, email, marketing contact, or external API call was created during the new work.

## Completed Apps Script release handoff

- Production account: `han@keytechlabs.org`.
- Synchronized files: `apps-script/Code.gs` and `apps-script/Tests.gs`.
- Manifest: unchanged.
- Apps Script self-tests: passed.
- Backend setup/guardrails: completed.
- Existing Web App deployment: updated to Version 2 without changing its endpoint.
- Trigger architecture: unchanged; `onTeamReviewEdit` remains the required installable handler.
- Required access policy: Private Applications, Team Review, Player Cards, and uploaded documents remain Restricted.

## Deployment blockers and non-blockers

- **Backend deployment:** complete through the KTL-owned Apps Script project.
- **Not a blocker for local testing/documentation:** all new automation work uses synthetic fixtures and pure local tests.
- **Frontend/backend compatibility boundary:** cleared because the matching Apps Script upload rules are now deployed on the existing endpoint.
- **Blocker for external pilots:** approved Zapier/Make/Notion/Mailchimp accounts and test resources are not connected.
- **Blocker for Mailchimp production:** no dedicated explicit marketing-consent fields or approved consent copy.

## Post-release verification checklist

- GitHub Pages deploy completes from the new commit.
- Public site loads with no visual/background regression.
- Active frontend still targets the established production Apps Script endpoint.
- One non-destructive page-load/navigation smoke test passes.
- Production Apps Script Version 2 is the confirmed matching backend release.
- Private Applications, Team Review, Player Cards, uploads, templates, and reports remain Restricted.
