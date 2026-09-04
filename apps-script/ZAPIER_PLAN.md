# Future Zapier Integration Plan

Zapier is optional and must not own application storage, approval logic, withdrawal verification, or Player Card creation. Production connections must use `han@keytechlabs.org`, and each Zap must transfer the minimum data needed.

| Automation | Trigger | Action | Minimum data transferred | Privacy considerations | Necessary? |
| --- | --- | --- | --- | --- | --- |
| New application alert | New privacy-safe Team Review row | Notify the internal admin channel | Submission ID, role, review status | Do not send contact data, accessibility notes, tokens, or file references | No; useful for response time |
| Needs Info follow-up | Review status changes to `Needs Info` | Ask an internal admin to send a follow-up, or send from an approved KTL mail workflow | Submission ID and status; retrieve contact data only inside an authorized KTL-controlled step | Avoid putting applicant contact data in shared task tools or logs | No; manual follow-up is acceptable for MVP |
| Approval onboarding | Review status changes to `Approved` and Player Card is created | Send onboarding email | Applicant email, first name, role, Player ID, approved onboarding link | Email is private; use a KTL-owned connection and no uploaded-document links | No; Apps Script can send later if preferred |
| Player Card notification | New Player Card row | Notify internal operations | Player ID, submission ID, role, member status | Internal destination only; omit consent and private source data unless required | No; convenience only |
| Event reminder | Approved active member reaches a scheduled event window | Send reminder | First name, approved contact channel, role, shift | Respect opt-out/withdrawal and avoid exposing the recipient list | No; useful at larger scale |

Before enabling any Zap, verify the connected Google account is `han@keytechlabs.org`, review Zap history retention, restrict destination access, test with fake data, and confirm that withdrawn applicants are excluded.
