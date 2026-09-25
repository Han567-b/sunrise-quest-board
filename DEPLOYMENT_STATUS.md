# Sunrise Quest Board Deployment Status

Status date: September 26, 2026

## Executive status

| Area | Status |
| --- | --- |
| Existing public GitHub Pages release | Active at the established public site; verification will be repeated after the next push |
| Existing production Apps Script | Previously deployed and used by the public site; current production source/version has not been retrieved in this session |
| Previous unfinished frontend/backend improvements | Present locally, tested, not yet committed/pushed at the start of this work |
| New Zapier vs. Make technical preparation | Implemented locally with synthetic tests; no external workflow activated |
| Apps Script production synchronization | Blocked by missing authenticated deployment/source-retrieval tooling |
| Git commit | Created from the reviewed local release set; hash is reported in the release handoff |
| Git push | Intentionally held until the matching Apps Script files are deployed with the KTL account |

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

## Production management inspection

No `.clasp.json`, authenticated `clasp` installation, Apps Script API project mapping, GitHub CLI, or other production Apps Script source-management configuration was found. A connected Chrome session can reach the Apps Script project, but the active Google account is `hanl34@uw.edu`; an explicit `authuser=han@keytechlabs.org` attempt remained on the UW account. No source was read, changed, saved, or deployed from that session because production work must use `han@keytechlabs.org`.

No safe authenticated command or browser session is therefore available to:

1. download and back up the production source;
2. compare production source with local source;
3. verify the exact current deployment version;
4. create a new version or update the existing deployment.

Production Script Properties, spreadsheet/folder IDs, trigger ownership, and sharing state cannot be inspected from the repository. They must not be guessed or reconstructed from screenshots.

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

Even though it is non-destructive by design, it should not be run in production until source sync is complete and the production sheet backup/access check is confirmed.

## New automation integration status

| Integration | State | Production effect |
| --- | --- | --- |
| Existing Zapier Free admin alert | Existing/live per project record | Preserved; no change |
| Team Review → Notion | Prepared locally | None; not connected/authorized |
| Application summary → PDF → Drive | Prepared locally | None; no template/folder connection |
| Consented applicant → Mailchimp | Blocked by missing explicit marketing-consent field | None; cannot subscribe anyone |

No real applicant data, production upload, email, marketing contact, or external API call was created during the new work.

## Minimum safe Apps Script release handoff

Because automated deployment is unavailable, the remaining production step cannot be completed without an authenticated Google Workspace interaction. The minimum safe manual handoff, after this repository commit is finalized, will be:

1. Sign in to the existing production Apps Script project as `han@keytechlabs.org`.
2. Back up or copy the current project source and note the actual active deployment version.
3. Compare and replace only `Code.gs` and `Tests.gs` with the committed versions; do not change Script Properties, deployment access, or `appsscript.json`.
4. Run `runBackendSelfTests()` and confirm completion.
5. Run `setupBackend()` once to add the dropdown/freeze guardrails and any missing safe extension headers.
6. Create a new version on the existing deployment (do not create a new endpoint) and record the actual version number.
7. Confirm the installable `onTeamReviewEdit` trigger still belongs to `han@keytechlabs.org` and all resources remain Restricted.

This is intentionally not assigned a presumed “Version 4”; the actual production project must determine the next version.

## Deployment blockers and non-blockers

- **Blocker for backend deployment:** no Apps Script source/deployment channel authenticated as `han@keytechlabs.org`; the reachable Chrome session is on the prohibited UW account and was left unchanged.
- **Not a blocker for local testing/documentation:** all new automation work uses synthetic fixtures and pure local tests.
- **Potential blocker for pushing frontend/backend together:** the frontend file handling changes should not be publicly released before the corresponding local Apps Script upload rules are synchronized. The final Git decision must preserve this compatibility boundary.
- **Blocker for external pilots:** approved Zapier/Make/Notion/Mailchimp accounts and test resources are not connected.
- **Blocker for Mailchimp production:** no dedicated explicit marketing-consent fields or approved consent copy.

## Post-release verification checklist

- GitHub Pages deploy completes from the new commit.
- Public site loads with no visual/background regression.
- Active frontend still targets the established production Apps Script endpoint.
- One non-destructive page-load/navigation smoke test passes.
- Backend source is not claimed deployed until the Apps Script project confirms the committed code and actual deployment version.
- Private Applications, Team Review, Player Cards, uploads, templates, and reports remain Restricted.
