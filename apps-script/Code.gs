/**
 * Sunrise Quest Board — Phase 2B MVP submission endpoint.
 *
 * This script writes full applications and sanitized review summaries to two
 * separate Google Spreadsheet files. Spreadsheet IDs stay in Script
 * Properties and are never sent to the browser.
 */

var SCHEMA_VERSION = "2B.1";
var PRIVATE_HEADERS = [
  "submission_id",
  "submitted_at_utc",
  "schema_version",
  "client_request_id",
  "full_name",
  "email",
  "phone",
  "zip_code",
  "referral_source",
  "accessibility_health_needs",
  "role_target",
  "availability_shift",
  "event_lead_experience",
  "skills_interests",
  "proof_description",
  "supporting_links",
  "reward_preferences",
  "ack_training_comic",
  "ack_commitment",
  "ack_accuracy",
  "submission_status",
  "withdrawal_token_hash",
  "withdrawn_at_utc"
];

var TEAM_HEADERS = [
  "submission_id",
  "submitted_at_utc",
  "display_name",
  "role_target",
  "availability_shift",
  "skills_summary",
  "supporting_material_available",
  "reward_preferences",
  "readiness_status",
  "team_notes",
  "submission_status",
  "withdrawn_at_utc"
];

var ALLOWED_ROLES = [
  "Power Runner · solar / technical",
  "Green Worker · operations / logistics",
  "Cloud Support · remote digital desk",
  "CE Vendor · vendor / market",
  "Event Lead · experienced coordination"
];

var ALLOWED_SHIFTS = [
  "September 26 · Shift 1 setup / teardown · 9:00 AM–12:00 PM + 5:00 PM–8:00 PM",
  "September 26 · Shift 2 midday · 12:00 PM–3:00 PM",
  "September 26 · Shift 3 afternoon / evening · 2:00 PM–5:00 PM",
  "September 26 · full event day · 9:00 AM–8:00 PM",
  "September 26 · remote support · 12:00 PM–5:00 PM"
];

var ALLOWED_REWARDS = [
  "Quest credits",
  "Volunteer status",
  "Stipend eligible review",
  "Badge progress"
];

var MAX_LENGTHS = {
  fullName: 120,
  email: 254,
  phone: 60,
  zipCode: 20,
  referralSource: 120,
  accessibilityHealthNeeds: 2000,
  eventLeadExperience: 3000,
  skillsInterests: 3000,
  proofDescription: 3000,
  supportingLink: 2000,
  clientRequestId: 100,
  withdrawalToken: 200
};

function doPost(e) {
  var requestContext = { submissionId: "", stage: "parse" };

  try {
    var payload = parseRequest_(e);
    if (cleanString_(payload.action) === "withdraw_application") {
      return handleWithdrawal_(payload, requestContext);
    }
    requestContext.stage = "validate";
    var validation = validatePayload_(payload);

    if (!validation.valid) {
      return errorResponse_("VALIDATION_ERROR", "Please review the highlighted application fields.", {
        fieldErrors: validation.fieldErrors
      });
    }

    var normalized = normalizePayload_(payload);
    var config = getConfig_();
    var lock = LockService.getScriptLock();

    if (!lock.tryLock(10000)) {
      return errorResponse_("SERVICE_BUSY", "The application service is busy. Please try again.");
    }

    try {
      requestContext.stage = "duplicate_check";
      var privateSheet = getSheet_(config.privateSpreadsheetId, config.privateSheetName, PRIVATE_HEADERS);
      var teamSheet = getSheet_(config.teamSpreadsheetId, config.teamSheetName, TEAM_HEADERS);
      var existing = findSubmissionByClientRequest_(privateSheet, normalized.clientRequestId);

      if (existing) {
        requestContext.submissionId = existing.submissionId;
        if (!sheetContainsValue_(teamSheet, "submission_id", existing.submissionId)) {
          requestContext.stage = "team_retry";
          try {
            appendTeamReviewRow_(teamSheet, buildTeamReviewRow_(normalized, existing.submissionId, existing.submittedAtUtc));
          } catch (teamRetryError) {
            logError_("TEAM_WRITE_FAILED", requestContext, teamRetryError);
            return errorResponse_(
              "TEAM_WRITE_FAILED",
              "Your private application was received, but the team review copy still needs to be retried.",
              { submissionId: existing.submissionId }
            );
          }
        }
        return successResponse_(existing.submissionId, existing.submittedAtUtc, true);
      }

      requestContext.stage = "generate_id";
      var submissionId = generateSubmissionId_();
      var submittedAtUtc = new Date().toISOString();
      requestContext.submissionId = submissionId;

      requestContext.stage = "private_write";
      try {
        appendPrivateApplication_(privateSheet, buildPrivateRow_(normalized, submissionId, submittedAtUtc));
      } catch (privateError) {
        logError_("PRIVATE_WRITE_FAILED", requestContext, privateError);
        return errorResponse_(
          "PRIVATE_WRITE_FAILED",
          "The application could not be saved. Please try again."
        );
      }

      requestContext.stage = "team_write";
      try {
        appendTeamReviewRow_(teamSheet, buildTeamReviewRow_(normalized, submissionId, submittedAtUtc));
      } catch (teamError) {
        logError_("TEAM_WRITE_FAILED", requestContext, teamError);
        return errorResponse_(
          "TEAM_WRITE_FAILED",
          "Your private application was received, but the team review copy needs to be retried.",
          { submissionId: submissionId }
        );
      }

      return successResponse_(submissionId, submittedAtUtc, false);
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    var code = error && error.publicCode ? error.publicCode : "INTERNAL_ERROR";
    var message = error && error.publicMessage
      ? error.publicMessage
      : "The application could not be submitted. Please try again.";
    logError_(code, requestContext, error);
    return errorResponse_(code, message, requestContext.submissionId ? { submissionId: requestContext.submissionId } : null);
  }
}

function parseRequest_(e) {
  if (!e || !e.postData || typeof e.postData.contents !== "string" || !e.postData.contents.trim()) {
    throw publicError_("INVALID_JSON", "The application request was empty.");
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw publicError_("INVALID_JSON", "The application data could not be read.");
  }
}

function validatePayload_(payload) {
  var errors = {};
  var applicant = payload && payload.applicant ? payload.applicant : {};
  var application = payload && payload.application ? payload.application : {};
  var acknowledgements = payload && payload.acknowledgements ? payload.acknowledgements : {};
  var links = normalizeStringArray_(application.supportingLinks);
  var rewards = normalizeStringArray_(application.rewardPreferences);

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { valid: false, fieldErrors: { form: "Application data is missing." } };
  }
  if (cleanString_(payload.schemaVersion) !== SCHEMA_VERSION) errors.schemaVersion = "This application version is no longer supported.";
  validateRequiredText_(errors, "clientRequestId", payload.clientRequestId, MAX_LENGTHS.clientRequestId);
  validateRequiredText_(errors, "withdrawalToken", payload.withdrawalToken, MAX_LENGTHS.withdrawalToken);
  validateRequiredText_(errors, "fullName", applicant.fullName, MAX_LENGTHS.fullName);
  validateRequiredText_(errors, "email", applicant.email, MAX_LENGTHS.email);
  validateRequiredText_(errors, "phone", applicant.phone, MAX_LENGTHS.phone);
  validateRequiredText_(errors, "zipCode", applicant.zipCode, MAX_LENGTHS.zipCode);
  validateRequiredText_(errors, "referralSource", applicant.referralSource, MAX_LENGTHS.referralSource);
  validateOptionalText_(errors, "accessibilityHealthNeeds", applicant.accessibilityHealthNeeds, MAX_LENGTHS.accessibilityHealthNeeds);
  validateRequiredText_(errors, "skillsInterests", application.skillsInterests, MAX_LENGTHS.skillsInterests);
  validateOptionalText_(errors, "proofDescription", application.proofDescription, MAX_LENGTHS.proofDescription);
  validateOptionalText_(errors, "eventLeadExperience", application.eventLeadExperience, MAX_LENGTHS.eventLeadExperience);

  if (cleanString_(payload.clientRequestId) && !/^[A-Za-z0-9._:-]{8,100}$/.test(cleanString_(payload.clientRequestId))) {
    errors.clientRequestId = "The application request identifier is invalid.";
  }
  if (cleanString_(payload.withdrawalToken) && !/^[A-Za-z0-9._:-]{16,200}$/.test(cleanString_(payload.withdrawalToken))) {
    errors.withdrawalToken = "The application withdrawal identifier is invalid.";
  }

  if (cleanString_(applicant.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanString_(applicant.email))) {
    errors.email = "Enter a valid email address.";
  }
  if (ALLOWED_ROLES.indexOf(cleanString_(application.roleTarget)) === -1) errors.roleTarget = "Choose a valid Sunrise role.";
  if (ALLOWED_SHIFTS.indexOf(cleanString_(application.availabilityShift)) === -1) errors.availabilityShift = "Choose a valid event shift.";
  if (cleanString_(application.roleTarget).indexOf("Event Lead") === 0 && !cleanString_(application.eventLeadExperience)) {
    errors.eventLeadExperience = "Event Lead applicants must describe their coordination experience.";
  }
  if (!rewards.length || rewards.some(function (reward) { return ALLOWED_REWARDS.indexOf(reward) === -1; })) {
    errors.rewardPreferences = "Choose at least one valid reward preference.";
  }
  if (links.length > 10) errors.supportingLinks = "Add no more than 10 supporting links.";
  links.forEach(function (link) {
    if (link.length > MAX_LENGTHS.supportingLink || !isSafeHttpUrl_(link)) {
      errors.supportingLinks = "Use complete http:// or https:// links, one per line.";
    }
  });
  if (acknowledgements.trainingComic !== true) errors.ackTrainingComic = "Confirm that you reviewed the Sunrise guide.";
  if (acknowledgements.commitment !== true) errors.ackCommitment = "Confirm your role and shift commitment.";
  if (acknowledgements.accuracy !== true) errors.ackAccuracy = "Confirm that the application is accurate.";

  return { valid: Object.keys(errors).length === 0, fieldErrors: errors };
}

function normalizePayload_(payload) {
  return {
    schemaVersion: SCHEMA_VERSION,
    clientRequestId: cleanString_(payload.clientRequestId),
    withdrawalToken: cleanString_(payload.withdrawalToken),
    applicant: {
      fullName: cleanString_(payload.applicant.fullName),
      email: cleanString_(payload.applicant.email).toLowerCase(),
      phone: cleanString_(payload.applicant.phone),
      zipCode: cleanString_(payload.applicant.zipCode),
      referralSource: cleanString_(payload.applicant.referralSource),
      accessibilityHealthNeeds: cleanString_(payload.applicant.accessibilityHealthNeeds)
    },
    application: {
      roleTarget: cleanString_(payload.application.roleTarget),
      availabilityShift: cleanString_(payload.application.availabilityShift),
      eventLeadExperience: cleanString_(payload.application.eventLeadExperience),
      skillsInterests: cleanString_(payload.application.skillsInterests),
      proofDescription: cleanString_(payload.application.proofDescription),
      supportingLinks: normalizeStringArray_(payload.application.supportingLinks),
      rewardPreferences: normalizeStringArray_(payload.application.rewardPreferences)
    },
    acknowledgements: {
      trainingComic: payload.acknowledgements.trainingComic === true,
      commitment: payload.acknowledgements.commitment === true,
      accuracy: payload.acknowledgements.accuracy === true
    }
  };
}

function generateSubmissionId_() {
  var properties = PropertiesService.getScriptProperties();
  var sequence = Number(properties.getProperty("SUBMISSION_SEQUENCE") || "0") + 1;
  properties.setProperty("SUBMISSION_SEQUENCE", String(sequence));
  return "SQ-20260926-" + String(sequence).padStart(6, "0");
}

function buildPrivateRow_(payload, submissionId, submittedAtUtc) {
  return [
    submissionId,
    submittedAtUtc,
    payload.schemaVersion,
    payload.clientRequestId,
    payload.applicant.fullName,
    payload.applicant.email,
    preserveTextCell_(payload.applicant.phone),
    preserveTextCell_(payload.applicant.zipCode),
    payload.applicant.referralSource,
    payload.applicant.accessibilityHealthNeeds,
    payload.application.roleTarget,
    payload.application.availabilityShift,
    payload.application.eventLeadExperience,
    payload.application.skillsInterests,
    payload.application.proofDescription,
    payload.application.supportingLinks.join("\n"),
    payload.application.rewardPreferences.join(", "),
    payload.acknowledgements.trainingComic,
    payload.acknowledgements.commitment,
    payload.acknowledgements.accuracy,
    "Submitted",
    hashToken_(payload.withdrawalToken),
    ""
  ];
}

function buildTeamReviewRow_(payload, submissionId, submittedAtUtc) {
  var hasSupportingMaterial = Boolean(
    payload.application.proofDescription || payload.application.supportingLinks.length
  );
  return [
    submissionId,
    submittedAtUtc,
    buildDisplayName_(payload.applicant.fullName),
    payload.application.roleTarget,
    payload.application.availabilityShift,
    summarize_(redactTeamText_(payload.application.skillsInterests), 240),
    hasSupportingMaterial ? "Yes" : "No",
    payload.application.rewardPreferences.join(", "),
    hasSupportingMaterial ? "Ready for Review" : "Needs Follow-Up",
    "",
    "Submitted",
    ""
  ];
}

function appendPrivateApplication_(sheet, row) {
  appendSanitizedRow_(sheet, row, PRIVATE_HEADERS.length);
}

function appendTeamReviewRow_(sheet, row) {
  appendSanitizedRow_(sheet, row, TEAM_HEADERS.length);
}

function handleWithdrawal_(payload, requestContext) {
  var validation = validateWithdrawalPayload_(payload);
  if (!validation.valid) {
    return errorResponse_("VALIDATION_ERROR", "The withdrawal request is incomplete.", {
      fieldErrors: validation.fieldErrors
    });
  }

  var config = getConfig_();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return errorResponse_("SERVICE_BUSY", "The application service is busy. Please try again.");
  }

  try {
    requestContext.stage = "withdrawal_lookup";
    requestContext.submissionId = cleanString_(payload.submissionId);
    var privateSheet = getSheet_(config.privateSpreadsheetId, config.privateSheetName, PRIVATE_HEADERS);
    var teamSheet = getSheet_(config.teamSpreadsheetId, config.teamSheetName, TEAM_HEADERS);
    var privateRowNumber = findRowByValue_(privateSheet, "submission_id", requestContext.submissionId);

    if (!privateRowNumber) {
      throw publicError_("WITHDRAWAL_NOT_AUTHORIZED", "This application could not be withdrawn from this browser.");
    }

    var privateMap = headerIndexMap_(PRIVATE_HEADERS);
    var privateValues = privateSheet.getRange(privateRowNumber, 1, 1, PRIVATE_HEADERS.length).getDisplayValues()[0];
    var expectedHash = privateValues[privateMap.withdrawal_token_hash];
    var providedHash = hashToken_(cleanString_(payload.withdrawalToken));
    if (!expectedHash || !secureEquals_(expectedHash, providedHash)) {
      throw publicError_("WITHDRAWAL_NOT_AUTHORIZED", "This application could not be withdrawn from this browser.");
    }

    var withdrawnAtUtc = privateValues[privateMap.withdrawn_at_utc] || new Date().toISOString();
    requestContext.stage = "private_withdrawal_write";
    updateRowStatus_(privateSheet, privateRowNumber, PRIVATE_HEADERS, "Withdrawn", withdrawnAtUtc);

    requestContext.stage = "team_withdrawal_write";
    var teamRowNumber = findRowByValue_(teamSheet, "submission_id", requestContext.submissionId);
    if (teamRowNumber) {
      updateRowStatus_(teamSheet, teamRowNumber, TEAM_HEADERS, "Withdrawn", withdrawnAtUtc);
    }

    return jsonResponse_({
      ok: true,
      action: "withdrawn",
      submissionId: requestContext.submissionId,
      withdrawnAtUtc: withdrawnAtUtc
    });
  } finally {
    lock.releaseLock();
  }
}

function validateWithdrawalPayload_(payload) {
  var errors = {};
  if (cleanString_(payload.schemaVersion) !== SCHEMA_VERSION) {
    errors.schemaVersion = "This application version is no longer supported.";
  }
  validateRequiredText_(errors, "submissionId", payload.submissionId, 80);
  validateRequiredText_(errors, "withdrawalToken", payload.withdrawalToken, MAX_LENGTHS.withdrawalToken);
  if (cleanString_(payload.submissionId) && !/^SQ-\d{8}-\d{6}$/.test(cleanString_(payload.submissionId))) {
    errors.submissionId = "The Submission ID is invalid.";
  }
  if (cleanString_(payload.withdrawalToken) && !/^[A-Za-z0-9._:-]{16,200}$/.test(cleanString_(payload.withdrawalToken))) {
    errors.withdrawalToken = "The withdrawal identifier is invalid.";
  }
  return { valid: Object.keys(errors).length === 0, fieldErrors: errors };
}

function updateRowStatus_(sheet, rowNumber, headers, status, timestamp) {
  var headerMap = headerIndexMap_(headers);
  sheet.getRange(rowNumber, headerMap.submission_status + 1).setValue(sanitizeCellValue_(status));
  sheet.getRange(rowNumber, headerMap.withdrawn_at_utc + 1).setValue(sanitizeCellValue_(timestamp));
}

function appendSanitizedRow_(sheet, row, expectedLength) {
  if (!Array.isArray(row) || row.length !== expectedLength) {
    throw new Error("Row does not match the configured schema.");
  }
  sheet.appendRow(row.map(sanitizeCellValue_));
}

function getConfig_() {
  var properties = PropertiesService.getScriptProperties();
  var config = {
    privateSpreadsheetId: properties.getProperty("PRIVATE_SPREADSHEET_ID"),
    teamSpreadsheetId: properties.getProperty("TEAM_SPREADSHEET_ID"),
    privateSheetName: properties.getProperty("PRIVATE_SHEET_NAME") || "Applications_Private",
    teamSheetName: properties.getProperty("TEAM_SHEET_NAME") || "Team_Review"
  };

  if (!config.privateSpreadsheetId || !config.teamSpreadsheetId) {
    throw publicError_("CONFIG_ERROR", "The application service is not configured yet.");
  }
  if (config.privateSpreadsheetId === config.teamSpreadsheetId) {
    throw publicError_("CONFIG_ERROR", "Private and team review data must use separate spreadsheet files.");
  }
  return config;
}

function getSheet_(spreadsheetId, sheetName, expectedHeaders) {
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) throw publicError_("CONFIG_ERROR", "A required application sheet is missing.");
  assertHeaders_(sheet, expectedHeaders);
  return sheet;
}

function assertHeaders_(sheet, expectedHeaders) {
  var actual = sheet.getRange(1, 1, 1, expectedHeaders.length).getDisplayValues()[0];
  if (actual.join("|") !== expectedHeaders.join("|")) {
    throw publicError_("CONFIG_ERROR", "A required application sheet has the wrong columns.");
  }
}

function setupSheets() {
  var config = getConfig_();
  setHeaders_(SpreadsheetApp.openById(config.privateSpreadsheetId), config.privateSheetName, PRIVATE_HEADERS);
  setHeaders_(SpreadsheetApp.openById(config.teamSpreadsheetId), config.teamSheetName, TEAM_HEADERS);
}

function setHeaders_(spreadsheet, sheetName, headers) {
  var sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
  if (sheet.getLastRow() > 0 && sheet.getLastColumn() > 0 && sheet.getRange(1, 1).getDisplayValue()) {
    assertHeaders_(sheet, headers);
    return;
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
}

function findSubmissionByClientRequest_(sheet, clientRequestId) {
  var rowNumber = findRowByValue_(sheet, "client_request_id", clientRequestId);
  if (!rowNumber) return null;
  var headerMap = headerIndexMap_(PRIVATE_HEADERS);
  var values = sheet.getRange(rowNumber, 1, 1, PRIVATE_HEADERS.length).getDisplayValues()[0];
  return {
    submissionId: values[headerMap.submission_id],
    submittedAtUtc: values[headerMap.submitted_at_utc]
  };
}

function sheetContainsValue_(sheet, headerName, value) {
  return Boolean(findRowByValue_(sheet, headerName, value));
}

function findRowByValue_(sheet, headerName, value) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var columnIndex = headers.indexOf(headerName) + 1;
  if (!columnIndex || sheet.getLastRow() < 2) return 0;
  var match = sheet.getRange(2, columnIndex, sheet.getLastRow() - 1, 1)
    .createTextFinder(String(value))
    .matchEntireCell(true)
    .findNext();
  return match ? match.getRow() : 0;
}

function headerIndexMap_(headers) {
  return headers.reduce(function (map, header, index) {
    map[header] = index;
    return map;
  }, {});
}

function validateRequiredText_(errors, field, value, maxLength) {
  var text = cleanString_(value);
  if (!text) errors[field] = "This field is required.";
  else if (text.length > maxLength) errors[field] = "This field is too long.";
}

function validateOptionalText_(errors, field, value, maxLength) {
  if (value !== undefined && value !== null && typeof value !== "string") {
    errors[field] = "This field has an invalid value.";
    return;
  }
  if (cleanString_(value).length > maxLength) errors[field] = "This field is too long.";
}

function normalizeStringArray_(value) {
  if (Array.isArray(value)) {
    return value.map(cleanString_).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(/\r?\n/).map(cleanString_).filter(Boolean);
  }
  return [];
}

function cleanString_(value) {
  return typeof value === "string" ? value.trim().replace(/\r\n/g, "\n") : "";
}

function isSafeHttpUrl_(value) {
  return /^https?:\/\/[^\s]+$/i.test(value);
}

function sanitizeCellValue_(value) {
  if (typeof value !== "string") return value;
  var normalized = value.replace(/\u0000/g, "");
  return /^[=+\-@]/.test(normalized) ? "'" + normalized : normalized;
}

function preserveTextCell_(value) {
  var text = cleanString_(value);
  return text ? "'" + text : "";
}

function hashToken_(token) {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    cleanString_(token),
    Utilities.Charset.UTF_8
  );
  return digest.map(function (byte) {
    return ("0" + ((byte + 256) % 256).toString(16)).slice(-2);
  }).join("");
}

function secureEquals_(left, right) {
  var a = String(left || "");
  var b = String(right || "");
  var mismatch = a.length ^ b.length;
  var length = Math.max(a.length, b.length);
  for (var index = 0; index < length; index += 1) {
    mismatch |= (a.charCodeAt(index % Math.max(a.length, 1)) || 0)
      ^ (b.charCodeAt(index % Math.max(b.length, 1)) || 0);
  }
  return mismatch === 0;
}

function buildDisplayName_(fullName) {
  var parts = cleanString_(fullName).split(/\s+/).filter(Boolean);
  if (!parts.length) return "Applicant";
  if (/@|https?:\/\/|\d{3,}/i.test(fullName)) return "Applicant";
  if (parts.length === 1) return parts[0];
  return parts[0] + " " + parts[parts.length - 1].charAt(0).toUpperCase() + ".";
}

function redactTeamText_(value) {
  return cleanString_(value)
    .replace(/https?:\/\/\S+/gi, "[link removed]")
    .replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/gi, "[contact removed]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[contact removed]");
}

function summarize_(value, maxLength) {
  var text = cleanString_(value).replace(/\s+/g, " ");
  return text.length <= maxLength ? text : text.slice(0, maxLength - 1).trim() + "…";
}

function successResponse_(submissionId, submittedAtUtc, duplicate) {
  return jsonResponse_({
    ok: true,
    submissionId: submissionId,
    submittedAtUtc: submittedAtUtc,
    duplicate: Boolean(duplicate)
  });
}

function errorResponse_(code, message, extra) {
  var body = { ok: false, code: code, message: message };
  if (extra && extra.fieldErrors) body.fieldErrors = extra.fieldErrors;
  if (extra && extra.submissionId) body.submissionId = extra.submissionId;
  return jsonResponse_(body);
}

function jsonResponse_(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function publicError_(code, message) {
  var error = new Error(message);
  error.publicCode = code;
  error.publicMessage = message;
  return error;
}

function logError_(code, context, error) {
  console.error(JSON.stringify({
    code: code,
    stage: context && context.stage ? context.stage : "unknown",
    submissionId: context && context.submissionId ? context.submissionId : "",
    technicalMessage: error && error.message ? String(error.message).slice(0, 500) : "Unknown error"
  }));
}
