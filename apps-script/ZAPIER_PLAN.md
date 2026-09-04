# Free Long-Term Automation Architecture

Zapier Free is used only for the simple internal new-application alert. Apps Script owns application storage, approval logic, withdrawal verification, Player Card creation, and applicant onboarding email. Production connections and Apps Script authorization must use `han@keytechlabs.org`.

Current meeting status:

- Zap 1, `New Application → Admin Alert`, is live as the free two-step workflow.
- Zap 2, `Approved → Onboarding Email`, was built and tested in Zapier but is being retired in favor of the deployed Apps Script implementation, avoiding a paid multi-step dependency.

## Keep: one free two-step Zap

1. Trigger: new row in Restricted `Quest Board - Team Review`.
2. Action: Gmail sends an internal admin alert.

This remains compatible with Zapier Free because it has one trigger and one action, with no Filter or Lookup step. Transfer only privacy-safe Team Review values such as submission ID, path summary, review status, and qualification summary. Do not include applicant email, phone, accessibility notes, withdrawal data, document IDs, or private links.

## Remove: paid approval/onboarding Zap

Do not keep the old `Approved → Filter → Lookup Private Applications → Gmail` Zap as the long-term workflow. Turn it off after the Apps Script replacement is deployed and verified so applicants cannot receive duplicate approval messages.

The installable Apps Script `onTeamReviewEdit` trigger now handles approval onboarding:

1. Detect `review_status = Approved` in Team Review.
2. Use the privacy-safe `submission_id` to find the Restricted Private Applications row.
3. Preserve the existing duplicate-safe Player Card creation/update.
4. Read first name, email, and primary role only from Private Applications.
5. Skip withdrawn records and missing/invalid email addresses.
6. Send from the KTL Workspace account that owns the trigger.
7. Store only private delivery state in `onboarding_email_status` and `onboarding_email_sent_at`.

Repeated Approved processing skips records already marked `Sent`. A provider failure records `Failed`, leaves approval and Player Card data intact, and can be retried by reprocessing the Approved row. A `Sending` claim prevents an uncertain prior delivery from automatically sending a duplicate; reconcile that private row manually before changing its status.

Before relying on the automation, verify the Apps Script project and installable trigger are authorized by `han@keytechlabs.org`, all Sheets and Drive folders remain Restricted, the free admin-alert Zap is connected with the same KTL account, and the paid approval Zap is disabled.
