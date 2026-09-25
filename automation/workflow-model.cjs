"use strict";

const TEAM_REVIEW_ALLOWLIST = Object.freeze([
  "submission_id",
  "name",
  "primary_role",
  "skills_summary",
  "availability_summary",
  "qualification_summary",
  "review_status",
  "player_card_status",
  "last_updated"
]);

const REPORT_ALLOWLIST = Object.freeze([
  "submission_id",
  "name",
  "primary_role",
  "additional_roles",
  "skills_summary",
  "availability_summary",
  "qualification_summary",
  "review_status",
  "created_at",
  "updated_at"
]);

const LOG_ALLOWLIST = Object.freeze([
  "workflow_id",
  "platform",
  "submission_id",
  "outcome",
  "reason",
  "attempt"
]);

const ROLE_TAGS = Object.freeze({
  "Power Runner": "Sunrise:Power Runner",
  "Green Worker": "Sunrise:Green Worker",
  "Cloud Support": "Sunrise:Cloud Support",
  "CE Vendor": "Sunrise:CE Vendor",
  "Event Lead": "Sunrise:Event Lead"
});

function clean(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function requireSubmissionId(record) {
  const submissionId = clean(record && record.submission_id);
  if (!/^SQ-\d{8}-[A-F0-9]{8}$/.test(submissionId)) {
    throw new Error("A valid Sunrise submission_id is required.");
  }
  return submissionId;
}

function select(record, allowlist) {
  return allowlist.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(record || {}, key)) {
      result[key] = record[key];
    }
    return result;
  }, {});
}

function parseRoles(record) {
  const roles = [];
  const add = (value) => {
    const normalized = clean(value);
    if (normalized && !roles.includes(normalized)) roles.push(normalized);
  };

  add(record && record.primary_role);
  add(record && record.secondary_role);

  let additional = record && record.additional_roles;
  if (typeof additional === "string") {
    try {
      additional = JSON.parse(additional || "[]");
    } catch (_error) {
      additional = additional.split(",");
    }
  }
  if (Array.isArray(additional)) additional.forEach(add);
  return roles;
}

function baseRoleName(role) {
  return clean(role).split("·")[0].trim();
}

function isValidEmail(value) {
  const email = clean(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isTrue(value) {
  return value === true || clean(value).toLowerCase() === "true";
}

function qualificationSummary(record) {
  const parts = [];
  if (clean(record && record.resume_file_id)) parts.push("Resume on file");

  let supporting = record && record.certification_file_ids;
  if (typeof supporting === "string") {
    try {
      supporting = JSON.parse(supporting || "[]");
    } catch (_error) {
      supporting = [];
    }
  }
  const count = Array.isArray(supporting) ? supporting.length : 0;
  if (count) parts.push(`${count} supporting document(s) on file`);
  return parts.join("; ") || "No supporting documents on file";
}

function buildNotionUpsert(teamReviewRecord) {
  const submissionId = requireSubmissionId(teamReviewRecord);
  const safe = select(teamReviewRecord, TEAM_REVIEW_ALLOWLIST);

  return {
    dedupe_key: submissionId,
    lookup: { property: "Submission ID", value: submissionId },
    properties: {
      "Submission ID": submissionId,
      Name: clean(safe.name),
      "Path Summary": clean(safe.primary_role),
      "Skills Summary": clean(safe.skills_summary),
      "Availability Summary": clean(safe.availability_summary),
      "Qualification Summary": clean(safe.qualification_summary),
      "Review Status": clean(safe.review_status),
      "Player Card Status": clean(safe.player_card_status),
      "Last Updated": clean(safe.last_updated)
    }
  };
}

function buildReportSummary(privateRecord) {
  const submissionId = requireSubmissionId(privateRecord);
  const roles = parseRoles(privateRecord);
  const safe = {
    submission_id: submissionId,
    name: [clean(privateRecord.first_name), clean(privateRecord.last_name)].filter(Boolean).join(" "),
    primary_role: roles[0] || "",
    additional_roles: roles.slice(1),
    skills_summary: clean(privateRecord.skills),
    availability_summary: clean(privateRecord.availability),
    qualification_summary: qualificationSummary(privateRecord),
    review_status: clean(privateRecord.review_status),
    created_at: clean(privateRecord.created_at),
    updated_at: clean(privateRecord.updated_at)
  };

  return {
    dedupe_key: `${submissionId}:application-summary`,
    template_key: "privacy-safe-application-summary-v1",
    fields: select(safe, REPORT_ALLOWLIST),
    output_name: `${submissionId}-application-summary.pdf`
  };
}

function buildMailchimpUpsert(privateRecord, options = {}) {
  const submissionId = requireSubmissionId(privateRecord);
  if (isTrue(privateRecord.is_withdrawn)) {
    return { eligible: false, submission_id: submissionId, reason: "withdrawn" };
  }
  if (privateRecord.marketing_consent !== true) {
    return { eligible: false, submission_id: submissionId, reason: "explicit_marketing_consent_required" };
  }

  const email = clean(privateRecord.email).toLowerCase();
  if (!isValidEmail(email)) {
    return { eligible: false, submission_id: submissionId, reason: "missing_or_invalid_email" };
  }
  if (clean(options.existingStatus).toLowerCase() === "unsubscribed") {
    return { eligible: false, submission_id: submissionId, reason: "preserve_unsubscribe" };
  }

  const tags = parseRoles(privateRecord)
    .map((role) => ROLE_TAGS[baseRoleName(role)])
    .filter(Boolean);

  return {
    eligible: true,
    submission_id: submissionId,
    dedupe_key: email,
    email_address: email,
    status_if_new: "pending",
    update_existing: true,
    preserve_unsubscribed: true,
    merge_fields: {
      FNAME: clean(privateRecord.first_name),
      LNAME: clean(privateRecord.last_name)
    },
    tags
  };
}

function buildExecutionLog(entry) {
  const log = select(entry || {}, LOG_ALLOWLIST);
  if (log.submission_id) requireSubmissionId({ submission_id: log.submission_id });
  log.attempt = Number.isInteger(log.attempt) && log.attempt > 0 ? log.attempt : 1;
  return log;
}

module.exports = {
  TEAM_REVIEW_ALLOWLIST,
  REPORT_ALLOWLIST,
  LOG_ALLOWLIST,
  buildNotionUpsert,
  buildReportSummary,
  buildMailchimpUpsert,
  buildExecutionLog,
  isValidEmail,
  parseRoles
};
