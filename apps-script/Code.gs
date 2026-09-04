/**
 * Sunrise Quest Board backend MVP.
 *
 * Production ownership and authorization must use han@keytechlabs.org.
 * Resource IDs are read only from Script Properties. This code never changes
 * Drive or spreadsheet sharing; all production resources must remain Restricted.
 */

var SCHEMA_VERSION = "3.1";
var SUPPORTED_SUBMISSION_SCHEMA_VERSIONS = ["3.0", "3.1"];

var PRIVATE_BASE_HEADERS = [
  "submission_id",
  "first_name",
  "last_name",
  "email",
  "phone",
  "primary_role",
  "secondary_role",
  "skills",
  "availability",
  "reward_preferences",
  "resume_file_id",
  "certification_file_ids",
  "accessibility_notes",
  "heard_about_us",
  "review_status",
  "admin_notes",
  "player_card_created",
  "created_at",
  "updated_at"
];

// Private-only extension columns are appended without replacing the existing 19 columns.
var PRIVATE_INTERNAL_HEADERS = [
  "zip_code",
  "client_request_id",
  "withdrawal_token_hash",
  "is_withdrawn",
  "withdrawn_at",
  "additional_roles",
  "onboarding_acknowledged",
  "onboarding_acknowledged_at",
  "onboarding_email_status",
  "onboarding_email_sent_at"
];

var TEAM_REVIEW_HEADERS = [
  "submission_id",
  "name",
  "primary_role",
  "skills_summary",
  "availability_summary",
  "qualification_summary",
  "review_status",
  "admin_notes",
  "player_card_status",
  "last_updated"
];

var PLAYER_CARD_HEADERS = [
  "player_id",
  "submission_id",
  "name",
  "primary_role",
  "secondary_role",
  "skills",
  "verified_qualifications",
  "badges",
  "quest_credits",
  "completed_quests",
  "stipend_eligibility",
  "member_status",
  "public_profile_consent",
  "created_at",
  "updated_at"
];

// Player Card extensions preserve multi-path participation without replacing the MVP columns.
var PLAYER_CARD_INTERNAL_HEADERS = [
  "additional_roles",
  "role_history",
  "onboarding_acknowledged",
  "onboarding_acknowledged_at"
];

var REVIEW_STATUSES = [
  "Pending Review",
  "Approved",
  "Rejected",
  "Needs Info"
];

var DEFAULT_REVIEW_STATUS = "Pending Review";
var DEFAULT_PLAYER_CARD_STATUS = "Not Created";
var WITHDRAWN_PLAYER_CARD_STATUS = "Not Created — Applicant Withdrawn";
var ONBOARDING_EMAIL_NOT_SENT = "Not Sent";
var ONBOARDING_EMAIL_SENDING = "Sending";
var ONBOARDING_EMAIL_SENT = "Sent";
var ONBOARDING_EMAIL_FAILED = "Failed";
var ONBOARDING_EMAIL_MISSING = "Missing Email";
var APPROVAL_EMAIL_SUBJECT = "Your Sunrise Quest application is approved";

var ALLOWED_ROLES = [
  "Power Runner · solar / technical",
  "Green Worker · operations / logistics",
  "Cloud Support · remote digital desk",
  "CE Vendor · vendor / market",
  "Event Lead · experienced coordination"
];

var ALLOWED_SHIFTS = [
  "September 26 · Shift 1 setup / teardown · 9:00 AM–12:00 PM + 5:00 PM–8:00 PM",
  "September 26 · Shift 2 · 12:00 PM–3:00 PM",
  "September 26 · Shift 3 · 2:00 PM–5:00 PM"
];

var ALLOWED_REWARDS = [
  "Quest credits",
  "Volunteer status",
  "Stipend eligible review",
  "Badge progress"
];

var FILE_RULES = {
  maxResumeBytes: 5 * 1024 * 1024,
  maxCertificationBytes: 5 * 1024 * 1024,
  maxCertificationCount: 3,
  maxCombinedBytes: 12 * 1024 * 1024,
  resumeMimeTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ],
  certificationMimeTypes: [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ]
};

var MAX_LENGTHS = {
  firstName: 80,
  lastName: 80,
  email: 254,
  phone: 60,
  zipCode: 20,
  skills: 3000,
  availability: 1000,
  accessibilityNotes: 2000,
  heardAboutUs: 240,
  clientRequestId: 100,
  withdrawalToken: 200,
  adminNotes: 3000
};

/** Public web-app entry point. Admin changes are intentionally not exposed here. */
function doPost(e) {
  var context = { stage: "parse", submissionId: "" };

  try {
    var payload = parseRequest_(e);
    var action = cleanString_(payload.action || "submit_application");

    if (action === "withdraw_application") {
      return handleWithdrawal_(payload, context);
    }

    if (action !== "submit_application") {
      return errorResponse_("UNSUPPORTED_ACTION", "This request action is not supported.", {
        stage: context.stage
      });
    }

    return handleApplicationSubmission_(payload, context);
  } catch (error) {
    logSafeError_(error, context);
    return errorResponse_("SERVER_ERROR", "The application service could not complete the request.", {
      stage: context.stage,
      submissionId: context.submissionId,
      retryable: true
    });
  }
}

function handleApplicationSubmission_(payload, context) {
  context.stage = "validate";
  var validation = validateApplication_(payload);
  if (!validation.valid) {
    return errorResponse_("VALIDATION_ERROR", "Please review the highlighted application fields.", {
      fieldErrors: validation.fieldErrors,
      stage: context.stage
    });
  }

  var normalized = normalizeApplication_(payload);
  var config = getConfig_();
  var lock = LockService.getScriptLock();

  if (!lock.tryLock(15000)) {
    return errorResponse_("SERVICE_BUSY", "The application service is busy. Please try again.", {
      retryable: true
    });
  }

  try {
    context.stage = "load_sheets";
    var privateSheet = getConfiguredSheet_(config.privateSheetId, PRIVATE_BASE_HEADERS, PRIVATE_INTERNAL_HEADERS);
    var teamSheet = getConfiguredSheet_(config.teamReviewSheetId, TEAM_REVIEW_HEADERS, []);

    context.stage = "duplicate_check";
    var existing = findObjectByValue_(privateSheet, "client_request_id", normalized.clientRequestId);
    if (existing) {
      context.submissionId = cleanString_(existing.record.submission_id);
      context.stage = "team_review_write";
      repairTeamReviewRecord_(teamSheet, existing.record);
      return successResponse_({
        submissionId: context.submissionId,
        submittedAt: isoString_(existing.record.created_at),
        reviewStatus: cleanString_(existing.record.review_status) || DEFAULT_REVIEW_STATUS,
        withdrawalToken: normalized.withdrawalToken,
        duplicate: true
      });
    }

    context.stage = "prepare";
    var submissionId = generateSubmissionId_();
    var now = nowIso_();
    context.submissionId = submissionId;
    var createdFiles = [];

    try {
      context.stage = "file_upload";
      var uploaded = uploadApplicationFiles_(normalized.files, submissionId, config, createdFiles);
      var privateRecord = buildPrivateRecord_(normalized, submissionId, now, uploaded);

      context.stage = "private_write";
      appendObject_(privateSheet, privateRecord);

      context.stage = "team_review_write";
      upsertTeamReview_(teamSheet, privateRecord);
    } catch (writeError) {
      // Uploaded files are removed only if the private historical row was not saved.
      if (context.stage === "file_upload" || context.stage === "private_write") {
        trashFiles_(createdFiles);
      }
      throw writeError;
    }

    return successResponse_({
      submissionId: submissionId,
      submittedAt: now,
      reviewStatus: DEFAULT_REVIEW_STATUS,
      withdrawalToken: normalized.withdrawalToken,
      duplicate: false
    });
  } catch (error) {
    logSafeError_(error, context);
    var message = context.stage === "team_review_write"
      ? "Your private application was saved, but the review copy needs repair. Retry with the same request."
      : "The application could not be saved. Please try again.";
    return errorResponse_("SUBMISSION_FAILED", message, {
      stage: context.stage,
      submissionId: context.submissionId,
      retryable: true
    });
  } finally {
    lock.releaseLock();
  }
}

function handleWithdrawal_(payload, context) {
  context.stage = "withdraw_validate";
  var submissionId = cleanString_(payload.submissionId);
  var withdrawalToken = cleanString_(payload.withdrawalToken);
  var fieldErrors = {};

  if (!/^SQ-\d{8}-[A-F0-9]{8}$/.test(submissionId)) {
    fieldErrors.submissionId = "A valid submission ID is required.";
  }
  if (!/^[A-Za-z0-9._-]{32,200}$/.test(withdrawalToken)) {
    fieldErrors.withdrawalToken = "A valid withdrawal token is required.";
  }
  if (Object.keys(fieldErrors).length) {
    return errorResponse_("VALIDATION_ERROR", "The withdrawal request is incomplete.", {
      fieldErrors: fieldErrors,
      stage: context.stage
    });
  }

  var config = getConfig_();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    return errorResponse_("SERVICE_BUSY", "The application service is busy. Please try again.", {
      retryable: true
    });
  }

  try {
    context.stage = "withdraw_lookup";
    context.submissionId = submissionId;
    var privateSheet = getConfiguredSheet_(config.privateSheetId, PRIVATE_BASE_HEADERS, PRIVATE_INTERNAL_HEADERS);
    var teamSheet = getConfiguredSheet_(config.teamReviewSheetId, TEAM_REVIEW_HEADERS, []);
    var match = findObjectByValue_(privateSheet, "submission_id", submissionId);

    if (!match || !constantTimeEqual_(cleanString_(match.record.withdrawal_token_hash), hashToken_(withdrawalToken))) {
      return errorResponse_("WITHDRAWAL_NOT_AUTHORIZED", "The withdrawal link is invalid or expired.", {
        stage: context.stage
      });
    }

    var wasAlreadyWithdrawn = isTrue_(match.record.is_withdrawn);
    context.stage = "withdraw_update";
    var now = nowIso_();
    var withdrawnAt = wasAlreadyWithdrawn ? (isoString_(match.record.withdrawn_at) || now) : now;
    if (!wasAlreadyWithdrawn) {
      updateObjectFields_(privateSheet, match.rowNumber, {
        is_withdrawn: true,
        withdrawn_at: withdrawnAt,
        updated_at: now
      });
      match.record.is_withdrawn = true;
      match.record.withdrawn_at = withdrawnAt;
      match.record.updated_at = now;
    }

    // Always repair dependent records, including on an idempotent retry.
    upsertTeamReview_(teamSheet, match.record);

    // A pre-existing card remains an internal historical record and is made non-public.
    var playerSheet = getConfiguredSheet_(config.playerCardsSheetId, PLAYER_CARD_HEADERS, PLAYER_CARD_INTERNAL_HEADERS);
    var playerMatch = findObjectByValue_(playerSheet, "submission_id", submissionId);
    if (playerMatch) {
      updateObjectFields_(playerSheet, playerMatch.rowNumber, {
        member_status: "Withdrawn",
        public_profile_consent: false,
        updated_at: now
      });
    }

    return successResponse_({
      submissionId: submissionId,
      withdrawn: true,
      withdrawnAt: withdrawnAt,
      duplicate: wasAlreadyWithdrawn
    });
  } catch (error) {
    logSafeError_(error, context);
    return errorResponse_("WITHDRAWAL_FAILED", "The application could not be withdrawn. Please try again.", {
      stage: context.stage,
      retryable: true
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Run once after deploying, while signed in as han@keytechlabs.org.
 * It appends only missing internal Private Applications columns and verifies
 * all required resource headers. It does not change sharing permissions.
 */
function setupBackend() {
  var config = getConfig_();
  var privateSheet = getConfiguredSheet_(config.privateSheetId, PRIVATE_BASE_HEADERS, PRIVATE_INTERNAL_HEADERS);
  var teamSheet = getConfiguredSheet_(config.teamReviewSheetId, TEAM_REVIEW_HEADERS, []);
  var playerSheet = getConfiguredSheet_(config.playerCardsSheetId, PLAYER_CARD_HEADERS, PLAYER_CARD_INTERNAL_HEADERS);
  DriveApp.getFolderById(config.resumeFolderId).getName();
  DriveApp.getFolderById(config.certificationFolderId).getName();

  return {
    ok: true,
    schemaVersion: SCHEMA_VERSION,
    privateSheet: privateSheet.getName(),
    teamReviewSheet: teamSheet.getName(),
    playerCardsSheet: playerSheet.getName()
  };
}

/**
 * Installs the admin-only edit trigger. Run interactively as han@keytechlabs.org.
 * The trigger watches Team Review edits without exposing admin actions publicly.
 */
function installAdminReviewTrigger() {
  var config = getConfig_();
  var triggers = ScriptApp.getProjectTriggers();
  var exists = triggers.some(function (trigger) {
    return trigger.getHandlerFunction() === "onTeamReviewEdit";
  });

  if (!exists) {
    ScriptApp.newTrigger("onTeamReviewEdit")
      .forSpreadsheet(config.teamReviewSheetId)
      .onEdit()
      .create();
  }

  return { ok: true, created: !exists };
}

/** Installable trigger handler. Do not rename without reinstalling the trigger. */
function onTeamReviewEdit(e) {
  if (!e || !e.range) {
    throw new Error("onTeamReviewEdit must run from an installable spreadsheet edit trigger.");
  }

  var config = getConfig_();
  if (String(e.source.getId()) !== String(config.teamReviewSheetId)) {
    return;
  }

  var sheet = e.range.getSheet();
  var headers = getHeaders_(sheet);
  var reviewColumn = headerIndex_(headers, "review_status") + 1;
  var notesColumn = headerIndex_(headers, "admin_notes") + 1;

  if (e.range.getRow() < 2 || (e.range.getColumn() !== reviewColumn && e.range.getColumn() !== notesColumn)) {
    return;
  }

  processAdminReviewRow_(sheet, e.range.getRow(), config);
}

/** Manual repair/backfill helper for rows edited before the trigger was installed. */
function processAllTeamReviewRows() {
  var config = getConfig_();
  var teamSheet = getConfiguredSheet_(config.teamReviewSheetId, TEAM_REVIEW_HEADERS, []);
  var lastRow = teamSheet.getLastRow();
  var results = [];

  for (var rowNumber = 2; rowNumber <= lastRow; rowNumber += 1) {
    try {
      results.push(processAdminReviewRow_(teamSheet, rowNumber, config));
    } catch (error) {
      results.push({ rowNumber: rowNumber, ok: false, error: cleanString_(error.message) });
    }
  }

  return results;
}

function processAdminReviewRow_(teamSheet, rowNumber, config) {
  var teamRecord = objectFromRow_(teamSheet, rowNumber);
  var submissionId = cleanString_(teamRecord.submission_id);
  var requestedStatus = cleanString_(teamRecord.review_status);
  var adminNotes = truncate_(redactTeamText_(teamRecord.admin_notes), MAX_LENGTHS.adminNotes);

  if (!submissionId) {
    return { rowNumber: rowNumber, ok: false, skipped: true };
  }
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    throw new Error("The backend is busy. Retry the review update.");
  }

  try {
    var privateSheet = getConfiguredSheet_(config.privateSheetId, PRIVATE_BASE_HEADERS, PRIVATE_INTERNAL_HEADERS);
    var privateMatch = findObjectByValue_(privateSheet, "submission_id", submissionId);
    if (!privateMatch) {
      throw new Error("No Private Applications record matches " + submissionId + ".");
    }

    if (REVIEW_STATUSES.indexOf(requestedStatus) === -1) {
      updateObjectFields_(teamSheet, rowNumber, {
        review_status: cleanString_(privateMatch.record.review_status) || DEFAULT_REVIEW_STATUS,
        last_updated: nowIso_()
      });
      throw new Error("Unsupported review status: " + requestedStatus);
    }

    var currentStatus = cleanString_(privateMatch.record.review_status) || DEFAULT_REVIEW_STATUS;
    if (currentStatus === "Approved" && requestedStatus !== "Approved") {
      updateObjectFields_(teamSheet, rowNumber, {
        review_status: currentStatus,
        last_updated: nowIso_()
      });
      throw new Error("Approved status cannot be reversed automatically. Resolve the Player Card manually first.");
    }

    if (isTrue_(privateMatch.record.is_withdrawn) && requestedStatus === "Approved") {
      updateObjectFields_(teamSheet, rowNumber, {
        review_status: cleanString_(privateMatch.record.review_status) || DEFAULT_REVIEW_STATUS,
        player_card_status: WITHDRAWN_PLAYER_CARD_STATUS,
        last_updated: nowIso_()
      });
      throw new Error("A withdrawn application cannot be approved or create a Player Card.");
    }

    var now = nowIso_();
    updateObjectFields_(privateSheet, privateMatch.rowNumber, {
      review_status: requestedStatus,
      admin_notes: adminNotes,
      updated_at: now
    });
    privateMatch.record.review_status = requestedStatus;
    privateMatch.record.admin_notes = adminNotes;
    privateMatch.record.updated_at = now;

    var cardResult = null;
    var onboardingEmailResult = null;
    if (requestedStatus === "Approved") {
      var playerSheet = getConfiguredSheet_(config.playerCardsSheetId, PLAYER_CARD_HEADERS, PLAYER_CARD_INTERNAL_HEADERS);
      cardResult = createOrUpdatePlayerCard_(playerSheet, privateMatch.record, now);
      updateObjectFields_(privateSheet, privateMatch.rowNumber, {
        player_card_created: true,
        updated_at: now
      });
      privateMatch.record.player_card_created = true;
    }

    updateObjectFields_(teamSheet, rowNumber, {
      review_status: requestedStatus,
      admin_notes: adminNotes,
      player_card_status: isTrue_(privateMatch.record.player_card_created) ? "Created" : DEFAULT_PLAYER_CARD_STATUS,
      last_updated: now
    });

    if (requestedStatus === "Approved") {
      onboardingEmailResult = sendApprovalOnboardingEmail_(
        privateSheet,
        privateMatch.rowNumber,
        privateMatch.record
      );
    }

    return {
      rowNumber: rowNumber,
      submissionId: submissionId,
      reviewStatus: requestedStatus,
      playerCard: cardResult,
      onboardingEmail: onboardingEmailResult,
      ok: true
    };
  } finally {
    lock.releaseLock();
  }
}

function createOrUpdatePlayerCard_(playerSheet, privateRecord, now) {
  if (isTrue_(privateRecord.is_withdrawn)) {
    throw new Error("Withdrawn applications cannot create Player Cards.");
  }

  var submissionId = cleanString_(privateRecord.submission_id);
  var existing = findObjectByValue_(playerSheet, "submission_id", submissionId);
  var additionalRoles = additionalRolesFromPrivateRecord_(privateRecord);
  var onboardingAcknowledged = isTrue_(privateRecord.onboarding_acknowledged);
  var onboardingAcknowledgedAt = onboardingAcknowledged
    ? (isoString_(privateRecord.onboarding_acknowledged_at) || isoString_(privateRecord.created_at) || now)
    : "";
  var roleHistory = updatedRoleHistory_(existing ? existing.record : null, privateRecord, now);
  var sharedFields = {
    submission_id: submissionId,
    name: fullName_(privateRecord.first_name, privateRecord.last_name),
    primary_role: cleanString_(privateRecord.primary_role),
    secondary_role: additionalRoles[0] || "",
    additional_roles: JSON.stringify(additionalRoles),
    role_history: JSON.stringify(roleHistory),
    skills: cleanString_(privateRecord.skills),
    stipend_eligibility: rewardIncludes_(privateRecord.reward_preferences, "Stipend eligible review")
      ? "Eligible for Review"
      : "Not Requested",
    member_status: "Active",
    onboarding_acknowledged: onboardingAcknowledged,
    onboarding_acknowledged_at: onboardingAcknowledgedAt,
    updated_at: now
  };

  if (existing) {
    updateObjectFields_(playerSheet, existing.rowNumber, sharedFields);
    return {
      created: false,
      playerId: cleanString_(existing.record.player_id)
    };
  }

  var record = {
    player_id: generatePlayerId_(),
    submission_id: submissionId,
    name: sharedFields.name,
    primary_role: sharedFields.primary_role,
    secondary_role: sharedFields.secondary_role,
    additional_roles: sharedFields.additional_roles,
    role_history: sharedFields.role_history,
    skills: sharedFields.skills,
    verified_qualifications: "",
    badges: "[]",
    quest_credits: 0,
    completed_quests: "[]",
    stipend_eligibility: sharedFields.stipend_eligibility,
    member_status: "Active",
    public_profile_consent: false,
    onboarding_acknowledged: sharedFields.onboarding_acknowledged,
    onboarding_acknowledged_at: sharedFields.onboarding_acknowledged_at,
    created_at: now,
    updated_at: now
  };
  appendObject_(playerSheet, record);
  return { created: true, playerId: record.player_id };
}

/**
 * Sends approval onboarding from the account that owns the installable trigger.
 * Production trigger ownership and authorization must remain han@keytechlabs.org.
 * The private claim prevents repeat Approved processing from sending twice.
 */
function sendApprovalOnboardingEmail_(privateSheet, rowNumber, privateRecord) {
  if (isTrue_(privateRecord.is_withdrawn)) {
    return { sent: false, skipped: true, reason: "withdrawn" };
  }

  var status = cleanString_(privateRecord.onboarding_email_status) || ONBOARDING_EMAIL_NOT_SENT;
  var sentAt = isoString_(privateRecord.onboarding_email_sent_at);
  if (status === ONBOARDING_EMAIL_SENT || sentAt) {
    return { sent: false, skipped: true, duplicate: true, sentAt: sentAt };
  }
  if (status === ONBOARDING_EMAIL_SENDING) {
    return { sent: false, skipped: true, duplicate: true, reason: "send_already_claimed" };
  }

  var email = cleanString_(privateRecord.email).toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    updateObjectFields_(privateSheet, rowNumber, {
      onboarding_email_status: ONBOARDING_EMAIL_MISSING,
      updated_at: nowIso_()
    });
    privateRecord.onboarding_email_status = ONBOARDING_EMAIL_MISSING;
    return { sent: false, skipped: true, reason: "missing_email" };
  }

  var message = buildApprovalOnboardingEmail_(privateRecord);
  updateObjectFields_(privateSheet, rowNumber, {
    onboarding_email_status: ONBOARDING_EMAIL_SENDING,
    updated_at: nowIso_()
  });
  privateRecord.onboarding_email_status = ONBOARDING_EMAIL_SENDING;

  try {
    MailApp.sendEmail({
      to: email,
      subject: APPROVAL_EMAIL_SUBJECT,
      body: message.body,
      name: "Sunrise Quest Board"
    });
  } catch (error) {
    updateObjectFields_(privateSheet, rowNumber, {
      onboarding_email_status: ONBOARDING_EMAIL_FAILED,
      updated_at: nowIso_()
    });
    privateRecord.onboarding_email_status = ONBOARDING_EMAIL_FAILED;
    // Do not include an address, name, message body, or provider response in logs/errors.
    throw new Error("Approval and Player Card were saved, but the onboarding email could not be sent. Reprocess the Approved row to retry.");
  }

  sentAt = nowIso_();
  updateObjectFields_(privateSheet, rowNumber, {
    onboarding_email_status: ONBOARDING_EMAIL_SENT,
    onboarding_email_sent_at: sentAt,
    updated_at: sentAt
  });
  privateRecord.onboarding_email_status = ONBOARDING_EMAIL_SENT;
  privateRecord.onboarding_email_sent_at = sentAt;
  return { sent: true, sentAt: sentAt };
}

function buildApprovalOnboardingEmail_(privateRecord) {
  var firstName = cleanString_(privateRecord.first_name) || "there";
  var primaryRole = cleanString_(privateRecord.primary_role) || "To be confirmed";
  return {
    subject: APPROVAL_EMAIL_SUBJECT,
    body: [
      "Hi " + firstName + ",",
      "",
      "Your Sunrise Quest application has been approved.",
      "",
      "Primary role: " + primaryRole,
      "",
      "Please review the onboarding materials before participating in the event.",
      "",
      "We’ll share the next steps and event details with you shortly.",
      "",
      "Sunrise Quest Board",
      "KeyTech Labs"
    ].join("\n")
  };
}

function validateApplication_(payload) {
  var fieldErrors = {};
  var applicant = payload && payload.applicant ? payload.applicant : {};
  var application = payload && payload.application ? payload.application : {};
  var acknowledgements = payload && payload.acknowledgements ? payload.acknowledgements : {};
  var files = payload && payload.files ? payload.files : {};
  var clientRequestId = cleanString_(payload && payload.clientRequestId);
  var withdrawalToken = cleanString_(payload && payload.withdrawalToken);

  if (SUPPORTED_SUBMISSION_SCHEMA_VERSIONS.indexOf(cleanString_(payload && payload.schemaVersion)) === -1) {
    fieldErrors.schemaVersion = "This application form version is no longer supported. Refresh and try again.";
  }

  validateRequiredText_(fieldErrors, "firstName", applicant.firstName, MAX_LENGTHS.firstName);
  validateRequiredText_(fieldErrors, "lastName", applicant.lastName, MAX_LENGTHS.lastName);
  validateRequiredText_(fieldErrors, "email", applicant.email, MAX_LENGTHS.email);
  validateRequiredText_(fieldErrors, "phone", applicant.phone, MAX_LENGTHS.phone);
  validateRequiredText_(fieldErrors, "zipCode", applicant.zipCode, MAX_LENGTHS.zipCode);
  validateRequiredText_(fieldErrors, "heardAboutUs", applicant.heardAboutUs, MAX_LENGTHS.heardAboutUs);
  validateRequiredText_(fieldErrors, "skills", application.skills, MAX_LENGTHS.skills);
  validateRequiredText_(fieldErrors, "availability", application.availability, MAX_LENGTHS.availability);

  var email = cleanString_(applicant.email).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }
  if (cleanString_(applicant.accessibilityNotes).length > MAX_LENGTHS.accessibilityNotes) {
    fieldErrors.accessibilityNotes = "Keep accessibility notes under " + MAX_LENGTHS.accessibilityNotes + " characters.";
  }
  var selectedRoles = selectedRolesFromApplication_(application);
  if (!selectedRoles.length) {
    fieldErrors.selectedRoles = "Select one or more participation paths.";
  } else if (selectedRoles.some(function (role) { return ALLOWED_ROLES.indexOf(role) === -1; })) {
    fieldErrors.selectedRoles = "Choose only valid participation paths.";
  }

  var availability = cleanString_(application.availability);
  if (availability && ALLOWED_SHIFTS.indexOf(availability) === -1) {
    fieldErrors.availability = "Choose a valid availability window.";
  }

  var rewards = normalizeStringArray_(application.rewardPreferences);
  if (!rewards.length || rewards.some(function (reward) { return ALLOWED_REWARDS.indexOf(reward) === -1; })) {
    fieldErrors.rewardPreferences = "Choose at least one valid reward preference.";
  }

  if (!isTrue_(acknowledgements.onboardingMaterials) && !isTrue_(acknowledgements.trainingComic)) {
    fieldErrors.onboardingMaterials = "Confirm that you reviewed the onboarding materials.";
  }
  if (!isTrue_(acknowledgements.commitment)) {
    fieldErrors.commitment = "Confirm your event commitment.";
  }
  if (!isTrue_(acknowledgements.accuracy)) {
    fieldErrors.accuracy = "Confirm that the application is accurate.";
  }
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(clientRequestId)) {
    fieldErrors.clientRequestId = "A valid client request ID is required.";
  }
  if (!/^[A-Za-z0-9._-]{32,200}$/.test(withdrawalToken)) {
    fieldErrors.withdrawalToken = "A valid withdrawal token is required.";
  }

  validateFiles_(files, fieldErrors);
  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors: fieldErrors };
}

function validateFiles_(files, fieldErrors) {
  var resume = files && files.resume ? files.resume : null;
  var certifications = files && Array.isArray(files.certifications) ? files.certifications : [];
  var combined = 0;

  if (resume) {
    var resumeSize = validateFileDescriptor_(resume, "resume", FILE_RULES.resumeMimeTypes, FILE_RULES.maxResumeBytes, fieldErrors);
    combined += resumeSize;
  }
  if (certifications.length > FILE_RULES.maxCertificationCount) {
    fieldErrors.certifications = "Upload no more than " + FILE_RULES.maxCertificationCount + " certification files.";
  }
  certifications.forEach(function (file, index) {
    combined += validateFileDescriptor_(
      file,
      "certifications",
      FILE_RULES.certificationMimeTypes,
      FILE_RULES.maxCertificationBytes,
      fieldErrors,
      index
    );
  });
  if (combined > FILE_RULES.maxCombinedBytes) {
    fieldErrors.files = "Combined uploads must be 12 MB or less.";
  }
}

function validateFileDescriptor_(file, fieldName, allowedTypes, maxBytes, fieldErrors, index) {
  var suffix = typeof index === "number" ? " #" + (index + 1) : "";
  var name = sanitizeFileName_(file && file.name);
  var mimeType = cleanString_(file && file.mimeType).toLowerCase();
  var size = Number(file && file.size);
  var base64 = cleanBase64_(file && file.base64);

  if (!name || !base64) {
    fieldErrors[fieldName] = "File" + suffix + " is incomplete.";
    return 0;
  }
  if (allowedTypes.indexOf(mimeType) === -1) {
    fieldErrors[fieldName] = "File" + suffix + " has an unsupported type.";
  }
  if (!isFinite(size) || size <= 0 || size > maxBytes) {
    fieldErrors[fieldName] = "File" + suffix + " exceeds the 5 MB limit or has an invalid size.";
    return 0;
  }
  if (base64.length > Math.ceil(maxBytes / 3) * 4 + 8) {
    fieldErrors[fieldName] = "File" + suffix + " exceeds the 5 MB limit.";
  }
  return size;
}

function normalizeApplication_(payload) {
  var applicant = payload.applicant || {};
  var application = payload.application || {};
  var acknowledgements = payload.acknowledgements || {};
  var files = payload.files || {};
  var selectedRoles = selectedRolesFromApplication_(application);

  return {
    clientRequestId: cleanString_(payload.clientRequestId),
    withdrawalToken: cleanString_(payload.withdrawalToken),
    applicant: {
      firstName: cleanString_(applicant.firstName),
      lastName: cleanString_(applicant.lastName),
      email: cleanString_(applicant.email).toLowerCase(),
      phone: cleanString_(applicant.phone),
      zipCode: cleanString_(applicant.zipCode),
      accessibilityNotes: cleanString_(applicant.accessibilityNotes),
      heardAboutUs: cleanString_(applicant.heardAboutUs)
    },
    application: {
      selectedRoles: selectedRoles,
      primaryRole: selectedRoles[0] || "",
      additionalRoles: selectedRoles.slice(1),
      secondaryRole: selectedRoles[1] || "",
      skills: cleanString_(application.skills),
      availability: cleanString_(application.availability),
      rewardPreferences: normalizeStringArray_(application.rewardPreferences)
    },
    acknowledgements: {
      onboardingMaterials: isTrue_(acknowledgements.onboardingMaterials) || isTrue_(acknowledgements.trainingComic),
      trainingComic: isTrue_(acknowledgements.onboardingMaterials) || isTrue_(acknowledgements.trainingComic),
      commitment: isTrue_(acknowledgements.commitment),
      accuracy: isTrue_(acknowledgements.accuracy)
    },
    files: {
      resume: files.resume ? normalizeFileDescriptor_(files.resume) : null,
      certifications: Array.isArray(files.certifications)
        ? files.certifications.map(normalizeFileDescriptor_)
        : []
    }
  };
}

function uploadApplicationFiles_(files, submissionId, config, createdFiles) {
  var resumeId = "";
  var certificationIds = [];

  if (files.resume) {
    var resumeFolder = DriveApp.getFolderById(config.resumeFolderId);
    var resumeFile = createDriveFile_(resumeFolder, files.resume, submissionId, "resume");
    createdFiles.push(resumeFile);
    resumeId = resumeFile.getId();
  }

  if (files.certifications.length) {
    var certificationFolder = DriveApp.getFolderById(config.certificationFolderId);
    files.certifications.forEach(function (file, index) {
      var created = createDriveFile_(certificationFolder, file, submissionId, "cert-" + (index + 1));
      createdFiles.push(created);
      certificationIds.push(created.getId());
    });
  }

  return { resumeFileId: resumeId, certificationFileIds: certificationIds };
}

function createDriveFile_(folder, descriptor, submissionId, label) {
  var bytes;
  try {
    bytes = Utilities.base64Decode(descriptor.base64);
  } catch (error) {
    throw new Error("An uploaded file could not be decoded.");
  }
  if (bytes.length !== Number(descriptor.size)) {
    throw new Error("An uploaded file did not match its declared size.");
  }

  var storedName = submissionId + "_" + label + "_" + sanitizeFileName_(descriptor.name);
  var blob = Utilities.newBlob(bytes, descriptor.mimeType, storedName);
  // The configured destination folder must already be Restricted; permissions are never changed here.
  return folder.createFile(blob);
}

function buildPrivateRecord_(normalized, submissionId, now, uploaded) {
  return {
    submission_id: submissionId,
    first_name: normalized.applicant.firstName,
    last_name: normalized.applicant.lastName,
    email: normalized.applicant.email,
    phone: normalized.applicant.phone,
    zip_code: normalized.applicant.zipCode,
    primary_role: normalized.application.primaryRole,
    secondary_role: normalized.application.secondaryRole,
    additional_roles: JSON.stringify(normalized.application.additionalRoles),
    skills: normalized.application.skills,
    availability: normalized.application.availability,
    reward_preferences: JSON.stringify(normalized.application.rewardPreferences),
    resume_file_id: uploaded.resumeFileId,
    certification_file_ids: JSON.stringify(uploaded.certificationFileIds),
    accessibility_notes: normalized.applicant.accessibilityNotes,
    heard_about_us: normalized.applicant.heardAboutUs,
    review_status: DEFAULT_REVIEW_STATUS,
    admin_notes: "",
    player_card_created: false,
    created_at: now,
    updated_at: now,
    client_request_id: normalized.clientRequestId,
    withdrawal_token_hash: hashToken_(normalized.withdrawalToken),
    is_withdrawn: false,
    withdrawn_at: "",
    onboarding_acknowledged: normalized.acknowledgements.onboardingMaterials,
    onboarding_acknowledged_at: normalized.acknowledgements.onboardingMaterials ? now : "",
    onboarding_email_status: ONBOARDING_EMAIL_NOT_SENT,
    onboarding_email_sent_at: ""
  };
}

function buildTeamReviewRecord_(privateRecord) {
  var isWithdrawn = isTrue_(privateRecord.is_withdrawn);
  var certificationIds = parseStoredArray_(privateRecord.certification_file_ids);
  var qualificationParts = [];
  if (cleanString_(privateRecord.resume_file_id)) {
    qualificationParts.push("Resume on file");
  }
  if (certificationIds.length) {
    qualificationParts.push(certificationIds.length + " certification file(s) on file");
  }
  if (!qualificationParts.length) {
    qualificationParts.push("No uploaded qualifications");
  }

  return {
    submission_id: cleanString_(privateRecord.submission_id),
    name: truncate_(redactTeamText_(fullName_(privateRecord.first_name, privateRecord.last_name)), 160),
    primary_role: summarizeRoles_(privateRecord),
    skills_summary: truncate_(redactTeamText_(privateRecord.skills), 1000),
    availability_summary: truncate_(cleanString_(privateRecord.availability), 500),
    qualification_summary: qualificationParts.join("; "),
    review_status: cleanString_(privateRecord.review_status) || DEFAULT_REVIEW_STATUS,
    admin_notes: truncate_(redactTeamText_(privateRecord.admin_notes), MAX_LENGTHS.adminNotes),
    player_card_status: isWithdrawn
      ? WITHDRAWN_PLAYER_CARD_STATUS
      : (isTrue_(privateRecord.player_card_created) ? "Created" : DEFAULT_PLAYER_CARD_STATUS),
    last_updated: isoString_(privateRecord.updated_at) || nowIso_()
  };
}

function upsertTeamReview_(teamSheet, privateRecord) {
  var record = buildTeamReviewRecord_(privateRecord);
  var existing = findObjectByValue_(teamSheet, "submission_id", record.submission_id);
  if (existing) {
    if (cleanString_(existing.record.admin_notes)) {
      record.admin_notes = truncate_(redactTeamText_(existing.record.admin_notes), MAX_LENGTHS.adminNotes);
    }
    updateObjectFields_(teamSheet, existing.rowNumber, record);
    return { created: false, rowNumber: existing.rowNumber };
  }
  appendObject_(teamSheet, record);
  return { created: true, rowNumber: teamSheet.getLastRow() };
}

function repairTeamReviewRecord_(teamSheet, privateRecord) {
  if (!findObjectByValue_(teamSheet, "submission_id", cleanString_(privateRecord.submission_id))) {
    upsertTeamReview_(teamSheet, privateRecord);
  }
}

function getConfig_() {
  var properties = PropertiesService.getScriptProperties();
  var config = {
    privateSheetId: cleanString_(properties.getProperty("PRIVATE_SHEET_ID")),
    teamReviewSheetId: cleanString_(properties.getProperty("TEAM_REVIEW_SHEET_ID")),
    playerCardsSheetId: cleanString_(properties.getProperty("PLAYER_CARDS_SHEET_ID")),
    resumeFolderId: cleanString_(properties.getProperty("RESUME_FOLDER_ID")),
    certificationFolderId: cleanString_(properties.getProperty("CERTIFICATION_FOLDER_ID"))
  };
  var missing = [];
  Object.keys(config).forEach(function (key) {
    if (!config[key]) {
      missing.push(key);
    }
  });
  if (missing.length) {
    throw new Error("Missing required Script Properties: " + missing.join(", "));
  }
  return config;
}

function getConfiguredSheet_(spreadsheetId, requiredHeaders, appendHeaders) {
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheets = spreadsheet.getSheets();
  if (!sheets.length) {
    throw new Error("The configured spreadsheet has no sheets.");
  }
  var sheet = sheets[0];
  ensureSheetHeaders_(sheet, requiredHeaders, appendHeaders || []);
  return sheet;
}

function ensureSheetHeaders_(sheet, requiredHeaders, appendHeaders) {
  var headers = getHeaders_(sheet);
  if (!headers.length) {
    throw new Error("The configured sheet is missing its header row.");
  }
  requiredHeaders.forEach(function (header) {
    if (headers.indexOf(header) === -1) {
      throw new Error("Missing required sheet column: " + header);
    }
  });
  appendHeaders.forEach(function (header) {
    if (headers.indexOf(header) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      headers.push(header);
    }
  });
}

function getHeaders_(sheet) {
  var lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) {
    return [];
  }
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (value) {
    return cleanString_(value);
  });
}

function appendObject_(sheet, record) {
  var headers = getHeaders_(sheet);
  var row = headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(record, header) ? sanitizeSheetValue_(record[header]) : "";
  });
  sheet.appendRow(row);
}

function objectFromRow_(sheet, rowNumber) {
  var headers = getHeaders_(sheet);
  var values = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  var record = {};
  headers.forEach(function (header, index) {
    record[header] = values[index];
  });
  return record;
}

function updateObjectFields_(sheet, rowNumber, fields) {
  var headers = getHeaders_(sheet);
  Object.keys(fields).forEach(function (field) {
    var index = headerIndex_(headers, field);
    if (index === -1) {
      throw new Error("Cannot update missing sheet column: " + field);
    }
    sheet.getRange(rowNumber, index + 1).setValue(sanitizeSheetValue_(fields[field]));
  });
}

function findObjectByValue_(sheet, header, value) {
  var headers = getHeaders_(sheet);
  var columnIndex = headerIndex_(headers, header);
  if (columnIndex === -1) {
    throw new Error("Missing lookup column: " + header);
  }
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return null;
  }
  var values = sheet.getRange(2, columnIndex + 1, lastRow - 1, 1).getValues();
  var target = cleanString_(value);
  for (var i = 0; i < values.length; i += 1) {
    if (cleanString_(values[i][0]) === target) {
      return { rowNumber: i + 2, record: objectFromRow_(sheet, i + 2) };
    }
  }
  return null;
}

function headerIndex_(headers, header) {
  return headers.indexOf(header);
}

function parseRequest_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing request body.");
  }
  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw new Error("Request body must be valid JSON.");
  }
}

function successResponse_(data) {
  var body = { ok: true, schemaVersion: SCHEMA_VERSION };
  Object.keys(data || {}).forEach(function (key) {
    body[key] = data[key];
  });
  return jsonResponse_(body);
}

function errorResponse_(code, message, details) {
  var body = {
    ok: false,
    schemaVersion: SCHEMA_VERSION,
    error: { code: code, message: message }
  };
  Object.keys(details || {}).forEach(function (key) {
    body.error[key] = details[key];
  });
  return jsonResponse_(body);
}

function jsonResponse_(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function generateSubmissionId_() {
  var stamp = Utilities.formatDate(new Date(), "UTC", "yyyyMMdd");
  return "SQ-" + stamp + "-" + uuidCompact_().slice(0, 8);
}

function generatePlayerId_() {
  return "SQP-" + uuidCompact_().slice(0, 12);
}

function uuidCompact_() {
  return Utilities.getUuid().replace(/-/g, "").toUpperCase();
}

function hashToken_(token) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    cleanString_(token),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function (byte) {
    var value = byte < 0 ? byte + 256 : byte;
    return ("0" + value.toString(16)).slice(-2);
  }).join("");
}

function constantTimeEqual_(left, right) {
  left = String(left || "");
  right = String(right || "");
  var mismatch = left.length ^ right.length;
  var length = Math.max(left.length, right.length);
  for (var i = 0; i < length; i += 1) {
    mismatch |= (left.charCodeAt(i % (left.length || 1)) || 0) ^ (right.charCodeAt(i % (right.length || 1)) || 0);
  }
  return mismatch === 0;
}

function normalizeFileDescriptor_(file) {
  return {
    name: sanitizeFileName_(file.name),
    mimeType: cleanString_(file.mimeType).toLowerCase(),
    size: Number(file.size),
    base64: cleanBase64_(file.base64)
  };
}

function cleanBase64_(value) {
  return String(value || "").replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
}

function sanitizeFileName_(value) {
  var name = cleanString_(value).replace(/[^A-Za-z0-9._-]+/g, "-");
  name = name.replace(/^-+|-+$/g, "");
  return truncate_(name || "upload", 120);
}

function trashFiles_(files) {
  files.forEach(function (file) {
    try {
      file.setTrashed(true);
    } catch (ignored) {
      // Best-effort cleanup only. Do not log file names or IDs.
    }
  });
}

function validateRequiredText_(fieldErrors, fieldName, value, maxLength) {
  var text = cleanString_(value);
  if (!text) {
    fieldErrors[fieldName] = "This field is required.";
  } else if (text.length > maxLength) {
    fieldErrors[fieldName] = "Keep this field under " + maxLength + " characters.";
  }
}

function normalizeStringArray_(value) {
  var array = Array.isArray(value) ? value : [];
  var unique = [];
  array.forEach(function (item) {
    var text = cleanString_(item);
    if (text && unique.indexOf(text) === -1) {
      unique.push(text);
    }
  });
  return unique;
}

/** Accepts schema 3.1 multi-path input and the schema 3.0 primary/secondary shape. */
function selectedRolesFromApplication_(application) {
  application = application || {};
  var selected = normalizeStringArray_(application.selectedRoles);
  if (selected.length) {
    return selected;
  }

  var legacy = [application.primaryRole]
    .concat(normalizeStringArray_(application.secondaryRoles))
    .concat([application.secondaryRole]);
  return normalizeStringArray_(legacy);
}

function additionalRolesFromPrivateRecord_(privateRecord) {
  var primaryRole = cleanString_(privateRecord.primary_role);
  var additional = normalizeStringArray_(parseStoredArray_(privateRecord.additional_roles));
  var legacySecondaryRole = cleanString_(privateRecord.secondary_role);
  if (legacySecondaryRole && additional.indexOf(legacySecondaryRole) === -1) {
    additional.unshift(legacySecondaryRole);
  }
  return additional.filter(function (role) {
    return role && role !== primaryRole && ALLOWED_ROLES.indexOf(role) !== -1;
  });
}

function allRolesFromPrivateRecord_(privateRecord) {
  return normalizeStringArray_([cleanString_(privateRecord.primary_role)]
    .concat(additionalRolesFromPrivateRecord_(privateRecord)));
}

function summarizeRoles_(privateRecord) {
  var roles = allRolesFromPrivateRecord_(privateRecord);
  if (!roles.length) {
    return "";
  }
  if (roles.length === 1) {
    return roles[0];
  }
  return roles.map(function (role, index) {
    return (index === 0 ? "Primary: " : "Additional: ") + role;
  }).join(" · ");
}

function updatedRoleHistory_(existingCard, privateRecord, now) {
  var history = parseStoredArray_(existingCard && existingCard.role_history).filter(function (entry) {
    return entry && typeof entry === "object" && !Array.isArray(entry);
  });
  var roles = allRolesFromPrivateRecord_(privateRecord);
  var primaryRole = roles[0] || "";
  var additionalRoles = roles.slice(1);
  var signature = JSON.stringify(roles);
  var alreadyRecorded = history.some(function (entry) {
    return JSON.stringify(normalizeStringArray_([entry.primary_role].concat(entry.additional_roles || []))) === signature;
  });

  if (!alreadyRecorded) {
    history.push({
      primary_role: primaryRole,
      additional_roles: additionalRoles,
      effective_at: now,
      source: "Approved application"
    });
  }
  return history;
}

function parseStoredArray_(value) {
  if (Array.isArray(value)) {
    return value;
  }
  try {
    var parsed = JSON.parse(cleanString_(value) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function rewardIncludes_(storedRewards, target) {
  return parseStoredArray_(storedRewards).indexOf(target) !== -1;
}

function fullName_(firstName, lastName) {
  return [cleanString_(firstName), cleanString_(lastName)].filter(Boolean).join(" ");
}

/** Removes contact details and private links from fields allowed into Team Review. */
function redactTeamText_(value) {
  return cleanString_(value)
    .replace(/(?:https?:\/\/|www\.|(?:docs|drive)\.google\.com\/)\S+/gi, "[link removed]")
    .replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/gi, "[contact removed]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[contact removed]");
}

/** Prevents user-provided text from being interpreted as a Sheets formula. */
function sanitizeSheetValue_(value) {
  if (typeof value !== "string") {
    return value;
  }
  var normalized = value.replace(/\u0000/g, "");
  return /^[=+\-@]/.test(normalized) ? "'" + normalized : normalized;
}

function cleanString_(value) {
  return value === null || typeof value === "undefined" ? "" : String(value).trim();
}

function truncate_(value, maximum) {
  var text = cleanString_(value);
  return text.length > maximum ? text.slice(0, maximum) : text;
}

function isTrue_(value) {
  return value === true || cleanString_(value).toLowerCase() === "true" || cleanString_(value) === "1";
}

function isoString_(value) {
  if (!value) {
    return "";
  }
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return value.toISOString();
  }
  return cleanString_(value);
}

function nowIso_() {
  return new Date().toISOString();
}

function logSafeError_(error, context) {
  console.error(JSON.stringify({
    code: "BACKEND_ERROR",
    stage: context && context.stage ? context.stage : "unknown",
    submissionId: context && context.submissionId ? context.submissionId : "",
    errorType: error && error.name ? cleanString_(error.name) : "Error"
  }));
}
