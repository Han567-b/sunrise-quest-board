# Zapier vs. Make for Sunrise Quest Board

Reviewed: September 26, 2026. Vendor pricing, quotas, and app actions change; confirm the linked official pages before purchase or production activation.

## Executive recommendation

Keep the current architecture as the production baseline:

1. Google Apps Script remains the system of record and owns sensitive submission storage, approval processing, withdrawal, Player Card creation, and approval/onboarding email.
2. Keep the live two-step Zapier Free workflow `New Team Review row → Admin Alert`. It uses the privacy-safe Team Review sheet and fits Zapier Free.
3. Do not replace the backend with Zapier or Make.
4. If Jessica wants a practical comparison pilot, test Make first with a **synthetic, privacy-safe Team Review → Notion** scenario. Its visual router and lower paid entry price make it the better learning platform for multi-step workflows, but its polling credit model and third-party data exposure must be understood.
5. Do not activate Mailchimp until the application has a separate, explicit marketing-consent field and KTL approves the privacy/communications policy.
6. Generate reports from a privacy-minimized allowlist and place them in a pre-shared Restricted Drive folder. Do not create public links.

Zapier is the easier tool for a simple one-trigger/one-action alert. Make is stronger for visually inspecting complex branching, transformations, and error routes. Apps Script remains safer and less expensive for the existing Google-centered, privacy-sensitive workflow.

## Platform and plan comparison

| Area | Zapier | Make | Quest Board conclusion |
| --- | --- | --- | --- |
| Builder experience | Linear trigger/action editor; generally easier for a first automation | Visual scenario canvas with routers, filters, aggregators, and explicit data bundles; more powerful but a steeper learning curve | Zapier for the existing alert; Make for a supervised multi-step pilot |
| Free plan | 100 tasks/month, one user, 15-minute polling, two-step Zaps only | 1,000 credits/month, visual builder, routers and filters, 15-minute minimum schedule, two active scenarios, 5 MB files, five-minute execution limit, seven-day logs | Neither free plan can run all three proposed production workflows safely and continuously |
| Entry paid plan | Professional starts at $19.99/month; multi-step Zaps, premium apps, webhooks, versions, Autoreplay, and more error controls | Core is shown at $12/month for 10,000 credits; unlimited active scenarios, one-minute schedules, API access, 100 MB files, and 30-day logs | Make is less expensive at the displayed entry tier, but credits are consumed per module operation |
| Team plan | Starts at $69/month; 25 users, shared Zaps/folders/connections, SAML SSO | Teams is shown at $38/month for 10,000 credits; team roles and shared templates | Either requires a paid tier for controlled shared ownership; exact billing terms should be reconfirmed |
| Usage accounting | Triggers/poll checks do not count; each successful external action normally counts as a task. Some built-in tools such as Filter, Formatter, and Paths do not count as tasks | Most non-AI module operations consume one credit. Polling triggers consume a credit even when no record is returned; routers, filters, and error handlers do not | Make polling can exhaust Free without useful work; prefer a webhook or paid plan if it is adopted |
| Multi-step logic | Paid plan required beyond one trigger and one action | Routers/filters are available on Free, subject to credits and two active scenarios | Make is better for an inexpensive prototype; Zapier Free remains right only for Zap 1 |
| Error handling | Free supports run history and manual replay; paid Professional adds Autoreplay, versions, custom error settings, and alerts | Error-handler routes, incomplete executions, and automatic/custom retries; confidential-data settings can reduce retained payloads | Both need idempotency before replay; no platform retry should create duplicate Notion pages, PDFs, contacts, Player Cards, or emails |
| Collaboration | Free/Professional are single-seat; Team adds shared connections and workspace controls | Teams adds team roles/templates; higher tiers add governance features | Production ownership must be an organizational KTL account, never a personal/education account |
| App breadth | 9,000+ advertised app connections | 3,000+ advertised apps | Both cover Google Sheets, Docs, Drive, Notion, and Mailchimp |
| Data privacy | Third-party processor with app connections and run/test data. Standard Zap content and account data follow Zapier retention rules; custom retention is an advanced control | Third-party processor with scenario history. “Keep data confidential” can prevent payload storage in logs; incomplete executions may retain payloads when enabled | Transfer only approved allowlists; keep Private Applications and uploaded documents inside Restricted KTL Google Workspace whenever possible |

Official plan references: [Zapier Free plan](https://help.zapier.com/hc/en-us/articles/32337438839565-What-s-included-in-Zapier-s-Free-plan), [Zapier pricing](https://zapier.com/pricing), [Zapier task usage](https://zapier.com/pricing/rates), [Make pricing](https://www.make.com/en/pricing), and [Make credit accounting](https://help.make.com/credits).

The displayed prices above are vendor list prices observed on the review date. They may depend on billing interval, task/credit tier, currency, tax, discounts, or later changes. Notion, Mailchimp, and Google Workspace subscriptions are separate from automation-platform fees.

## A. Documents and PDF reports

### Verified capability

Both platforms can implement this sequence:

```text
Restricted Google Sheet row
  → validate/report eligibility
  → populate a Google Docs template
  → export the Google Doc as PDF
  → upload the PDF to a Restricted Drive folder
  → write a minimal success/failure record
```

Zapier provides Google Docs template creation and a Google Drive `Export File` action for Workspace files, including PDF. Make provides Google Docs template modules plus Google Drive download/export and upload modules. References: [Zapier Google Docs](https://help.zapier.com/hc/en-us/articles/8495967034765-How-to-get-started-with-Google-Docs-on-Zapier), [Zapier Google Drive actions](https://zapier.com/apps/google-drive/integrations), [Make Google Docs modules](https://apps.make.com/google-docs-modules), and [Make Google Drive modules](https://apps.make.com/google-drive-modules).

### Recommended report types

- Privacy-safe individual application summary: submission ID, name, selected paths, skills summary, availability summary, qualification-presence summary, status, timestamps.
- Recruitment report: aggregated counts by path/status/shift, with no direct identifiers where individual detail is unnecessary.
- Event operations report: approved staffing counts, shift coverage, and operational gaps. Contact lists should remain a separate Restricted operational artifact with explicit need-to-know access.

### Privacy and deduplication

- Do not place email, phone, accessibility/health notes, raw file IDs, private links, or withdrawal tokens in routine reports.
- Use `submission_id + report_type` as the idempotency key and deterministic filename, for example `SQ-…-application-summary.pdf`.
- Search for an existing output before creation or replace only a known prior version.
- Give named KTL staff access to the parent folder once. Do not create `Anyone with the link` permissions.
- Make Free limits processed files to 5 MB. The current application allows a combined upload total of 12 MB, so source uploads must not be passed through a Make Free PDF scenario. [Make file limits](https://www.make.com/en/pricing)

### Practical comparison

Zapier is simpler to build but requires a paid multi-step plan. Make exposes every file conversion and branch visually and can be prototyped on Free, but a continuously polled scenario consumes credits even with no new record. Because the data and destination are already in Google Workspace, a later native Apps Script report generator may remain the lowest-exposure production option.

## B. Notion database integration

### Recommended direction

Use a one-way projection:

```text
Restricted Team Review (source of truth)
  → search Notion by Submission ID
  → update if found / create if absent
  → never write approval decisions back from Notion
```

The prepared mapping uses only Team Review fields: submission ID, name, path summary, skills summary, availability summary, qualification summary, review status, Player Card status, and last updated. The Notion database must be private and explicitly shared only with the KTL integration and authorized staff.

Both platforms can search, create, and update Notion records. Zapier's Notion integration supports Data Source item search/create/update and requires explicit page/database access. Make's current Notion modules support Data Source operations; legacy database modules should not be used for new builds because of Notion's newer data-source API model. References: [Zapier Notion setup and limits](https://help.zapier.com/hc/en-us/articles/8496102470541-How-to-get-started-with-Notion-on-Zapier) and [Make Notion modules](https://apps.make.com/notion).

### Consistency model

- `submission_id` is the unique key; never deduplicate by name.
- Google Sheets remains authoritative for review status, withdrawal, and Player Card state.
- Notion is a read-oriented coordination view, not an alternate approval interface.
- A one-way sync avoids looped updates, timestamp races, conflicting edits, and accidental weakening of Apps Script validation.
- Two-way sync should be considered only after field ownership and conflict resolution are formally specified. It is not recommended for the MVP.

## C. Mailchimp integration

### Technical capability

Both platforms support member search, add/update, tags, and unsubscribe-related operations. Zapier exposes subscriber search/create/update, tagging, and unsubscribe triggers/actions. Make exposes search/add/update member modules, tags, double opt-in support, unsubscribe watchers, and marketing-permission fields. References: [Zapier Mailchimp integration](https://help.zapier.com/hc/en-us/articles/8495967673485-How-to-get-started-with-Mailchimp-on-Zapier) and [Make Mailchimp modules](https://apps.make.com/mailchimp-modules).

### Current blocker and safe design

The Quest Board currently records application consent and onboarding acknowledgement, but it does **not** have a separate marketing-consent field. Those existing confirmations are not permission to subscribe someone to marketing. Therefore, the prepared workflow remains disabled and locally returns `explicit_marketing_consent_required` unless a dedicated Boolean is exactly `true`.

If KTL approves a future implementation:

1. Add clearly worded, optional marketing consent separate from application terms.
2. Store consent value and timestamp in Private Applications only.
3. Skip withdrawn applications and invalid/missing emails.
4. Find the audience member by normalized email to prevent duplicates.
5. Never automatically resubscribe a member whose Mailchimp status is `unsubscribed`.
6. Use `pending`/double opt-in for new members.
7. Apply path tags such as `Sunrise:Power Runner` only after eligibility succeeds.
8. Log outcome/reason without logging the email address.

## Reliability, retries, and result logging

Every proposed workflow uses an idempotency key and a minimal log schema:

```text
workflow_id, platform, submission_id, outcome, reason, attempt
```

Do not log email, phone, accessibility information, Drive IDs, private links, document contents, or tokens. A future `Automation Log` sheet should be Restricted and separate from Team Review so the existing Team Review schema and Zap 1 remain unchanged.

Zapier Free supports manual replay of errored runs; paid plans add Autoreplay. Make can use Break/Resume handlers and incomplete executions, but incomplete execution storage can retain payloads. Enable Make's confidential-data setting and keep sensitive values out of routes when possible. References: [Zapier replay](https://help.zapier.com/hc/en-us/articles/8496241726989-Replay-Zap-runs), [Make retry handler](https://help.make.com/retry-error-handler), [Make incomplete executions](https://help.make.com/incomplete-executions), and [Make scenario settings](https://help.make.com/scenario-settings).

## Privacy, access, and maintenance

- Production connections must use `han@keytechlabs.org` or a future approved KTL service account; never `hanl34@uw.edu`.
- Keep Private Applications, Team Review, Player Cards, uploads, templates, reports, Notion data source, and automation logs Restricted.
- Use least-privilege OAuth connections and document who owns each connection.
- Do not move approval, withdrawal, Player Card, or approval-email logic out of Apps Script.
- Review third-party run-history retention before sending applicant data. Zapier documents its [data retention and deletion](https://zapier.com/legal/data-retention-deletion) and [privacy controls](https://zapier.com/legal/data-privacy); Make documents [security controls](https://www.make.com/en/security), scenario history, and confidential-data settings.
- Use synthetic records for builder tests. Delete test records and revoke unused connections after evaluation.

## Additional useful automations

| Candidate | Recommended owner | Timing |
| --- | --- | --- |
| New Team Review row → internal admin alert | Existing Zapier Free Zap 1 | Keep live |
| Approved → applicant onboarding email | Existing Apps Script | Keep live; do not duplicate in Zapier/Make |
| Needs Info → controlled applicant follow-up | Apps Script, after template and business rules are approved | Near-term candidate |
| Privacy-safe Team Review → Notion coordination view | Make comparison pilot | Synthetic pilot first |
| Approved staffing/shift coverage report | Apps Script or one approved platform | After report template approval |
| Failed automation digest without PII | Apps Script or selected platform | Useful after more workflows exist |
| Event reminders | Apps Script or selected platform | Requires message template and recipient policy |

## Final selection guidance

- **Today:** Apps Script + Zapier Free Zap 1 is the recommended production architecture.
- **For Jessica's learning pilot:** Make is the stronger comparison candidate for a synthetic multi-step Notion workflow because its routers and data flow are visible.
- **For production cross-app expansion:** choose only after KTL reviews data processing, account ownership, expected monthly volume, consent language, and who will monitor failures.
- **Do not activate all three on Make Free:** only two scenarios can be active, and 15-minute polling can consume about 2,880 trigger credits per scenario in a 30-day month before processing any new rows. A webhook-driven design or paid plan is required for efficient always-on use.

The machine-readable workflow definitions and local privacy gates are in [`automation/workflow-specs.json`](automation/workflow-specs.json) and [`automation/workflow-model.cjs`](automation/workflow-model.cjs).
