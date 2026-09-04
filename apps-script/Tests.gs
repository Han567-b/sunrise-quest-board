/**
 * Pure Apps Script smoke tests. These use fake data and do not read or write
 * Google Sheets or Drive. Run runBackendSelfTests from the editor.
 */
function runBackendSelfTests() {
  var tests = [
    testValidApplication_,
    testMissingRequiredField_,
    testInvalidEmail_,
    testMultiPathMapping_,
    testApprovalEmailContent_,
    testTeamReviewPrivacy_,
    testSheetFormulaGuard_,
    testWithdrawnCardGuard_
  ];
  var results = tests.map(function (testFunction) {
    try {
      testFunction();
      return { name: testFunction.name, passed: true };
    } catch (error) {
      return { name: testFunction.name, passed: false, error: cleanString_(error.message) };
    }
  });
  var failed = results.filter(function (result) { return !result.passed; });
  if (failed.length) {
    throw new Error("Backend self-tests failed: " + JSON.stringify(failed));
  }
  return results;
}

function testValidApplication_() {
  assertTest_(validateApplication_(fakeApplicationPayload_()).valid, "Valid fake application should pass validation.");
}

function testMissingRequiredField_() {
  var payload = fakeApplicationPayload_();
  payload.applicant.firstName = "";
  var validation = validateApplication_(payload);
  assertTest_(!validation.valid && validation.fieldErrors.firstName, "Missing first name should fail validation.");
}

function testInvalidEmail_() {
  var payload = fakeApplicationPayload_();
  payload.applicant.email = "invalid-email";
  var validation = validateApplication_(payload);
  assertTest_(!validation.valid && validation.fieldErrors.email, "Invalid email should fail validation.");
}

function testMultiPathMapping_() {
  var payload = fakeApplicationPayload_();
  var normalized = normalizeApplication_(payload);
  var record = buildPrivateRecord_(
    normalized,
    "SQ-20990101-MULTI001",
    "2099-01-01T00:00:00.000Z",
    { resumeFileId: "", certificationFileIds: [] }
  );
  var teamRecord = buildTeamReviewRecord_(record);
  assertTest_(record.primary_role === payload.application.selectedRoles[0], "First selected path should be primary.");
  assertTest_(JSON.parse(record.additional_roles).length === 2, "Every additional path should be stored.");
  assertTest_(teamRecord.primary_role.indexOf("Event Lead") !== -1, "Team Review should summarize every selected path.");
  assertTest_(record.onboarding_acknowledged === true, "Onboarding acknowledgement should be stored.");
  assertTest_(record.onboarding_email_status === ONBOARDING_EMAIL_NOT_SENT, "New applications should not be marked emailed.");
}

function testApprovalEmailContent_() {
  var message = buildApprovalOnboardingEmail_({
    first_name: "Fake",
    primary_role: "Cloud Support · remote digital desk"
  });
  assertTest_(message.subject === "Your Sunrise Quest application is approved", "Approval subject should match the required copy.");
  assertTest_(message.body.indexOf("Hi Fake,") === 0, "Approval email should use the private first name.");
  assertTest_(message.body.indexOf("Primary role: Cloud Support · remote digital desk") !== -1, "Approval email should include the private primary role.");
}

function testTeamReviewPrivacy_() {
  var payload = fakeApplicationPayload_();
  payload.application.skills = "Email fake.private@example.test, call 206-555-0199, or open https://drive.google.com/private.";
  var record = buildPrivateRecord_(
    normalizeApplication_(payload),
    "SQ-20990101-AAAAAAAA",
    "2099-01-01T00:00:00.000Z",
    { resumeFileId: "private-resume-id", certificationFileIds: ["private-certification-id"] }
  );
  var teamRecord = buildTeamReviewRecord_(record);
  ["email", "phone", "zip_code", "accessibility_notes", "resume_file_id", "certification_file_ids", "withdrawal_token_hash", "onboarding_email_status", "onboarding_email_sent_at"]
    .forEach(function (forbidden) {
      assertTest_(!Object.prototype.hasOwnProperty.call(teamRecord, forbidden), "Team Review exposed " + forbidden + ".");
    });
  assertTest_(JSON.stringify(teamRecord).indexOf("private-resume-id") === -1, "Team Review exposed a private file ID.");
  assertTest_(JSON.stringify(teamRecord).indexOf("fake.private@example.test") === -1, "Team Review exposed an email from free text.");
  assertTest_(JSON.stringify(teamRecord).indexOf("206-555-0199") === -1, "Team Review exposed a phone number from free text.");
  assertTest_(JSON.stringify(teamRecord).indexOf("drive.google.com") === -1, "Team Review exposed a private link from free text.");
}

function testSheetFormulaGuard_() {
  assertTest_(sanitizeSheetValue_("=IMPORTDATA(\"https://example.test\")").charAt(0) === "'", "Formula-like text must be stored literally.");
  assertTest_(sanitizeSheetValue_("Ordinary text") === "Ordinary text", "Ordinary text should remain unchanged.");
}

function testWithdrawnCardGuard_() {
  var record = buildPrivateRecord_(
    normalizeApplication_(fakeApplicationPayload_()),
    "SQ-20990101-BBBBBBBB",
    "2099-01-01T00:00:00.000Z",
    { resumeFileId: "", certificationFileIds: [] }
  );
  record.is_withdrawn = true;
  var threw = false;
  try {
    createOrUpdatePlayerCard_({}, record, "2099-01-01T00:00:01.000Z");
  } catch (error) {
    threw = /Withdrawn applications/.test(error.message);
  }
  assertTest_(threw, "Withdrawn application should be blocked before a Player Card write.");
}

function fakeApplicationPayload_() {
  return {
    action: "submit_application",
    schemaVersion: "3.1",
    clientRequestId: "fake-request-00000001",
    withdrawalToken: "fake-withdrawal-token-00000000000001",
    applicant: {
      firstName: "Fake",
      lastName: "Applicant",
      email: "fake.applicant@example.test",
      phone: "555-0100",
      zipCode: "98092",
      accessibilityNotes: "",
      heardAboutUs: "Test fixture"
    },
    application: {
      selectedRoles: [
        "Cloud Support · remote digital desk",
        "Green Worker · operations / logistics",
        "Event Lead · experienced coordination"
      ],
      primaryRole: "Cloud Support · remote digital desk",
      secondaryRoles: ["Green Worker · operations / logistics", "Event Lead · experienced coordination"],
      secondaryRole: "Green Worker · operations / logistics",
      skills: "Fake documentation skill",
      availability: "September 26 · Shift 2 · 12:00 PM–3:00 PM",
      rewardPreferences: ["Quest credits"]
    },
    acknowledgements: {
      onboardingMaterials: true,
      trainingComic: true,
      commitment: true,
      accuracy: true
    },
    files: { resume: null, certifications: [] }
  };
}

function assertTest_(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
