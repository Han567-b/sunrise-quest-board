const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const PRIVATE_HEADERS = [
  "submission_id", "first_name", "last_name", "email", "phone",
  "primary_role", "secondary_role", "skills", "availability",
  "reward_preferences", "resume_file_id", "certification_file_ids",
  "accessibility_notes", "heard_about_us", "review_status", "admin_notes",
  "player_card_created", "created_at", "updated_at"
];

const TEAM_HEADERS = [
  "submission_id", "name", "primary_role", "skills_summary",
  "availability_summary", "qualification_summary", "review_status",
  "admin_notes", "player_card_status", "last_updated"
];

const PLAYER_HEADERS = [
  "player_id", "submission_id", "name", "primary_role", "secondary_role",
  "skills", "verified_qualifications", "badges", "quest_credits",
  "completed_quests", "stipend_eligibility", "member_status",
  "public_profile_consent", "created_at", "updated_at"
];

class MockRange {
  constructor(sheet, row, column, rowCount = 1, columnCount = 1) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.rowCount = rowCount;
    this.columnCount = columnCount;
  }

  getValues() {
    const values = [];
    for (let rowOffset = 0; rowOffset < this.rowCount; rowOffset += 1) {
      const row = [];
      for (let columnOffset = 0; columnOffset < this.columnCount; columnOffset += 1) {
        row.push(this.sheet.valueAt(this.row + rowOffset, this.column + columnOffset));
      }
      values.push(row);
    }
    return values;
  }

  setValue(value) {
    this.sheet.setValueAt(this.row, this.column, value);
    return this;
  }

  getRow() {
    return this.row;
  }

  getColumn() {
    return this.column;
  }

  getSheet() {
    return this.sheet;
  }
}

class MockSheet {
  constructor(name, headers) {
    this.name = name;
    this.data = [headers.slice()];
  }

  getName() {
    return this.name;
  }

  getLastColumn() {
    return this.data.reduce((maximum, row) => Math.max(maximum, row.length), 0);
  }

  getLastRow() {
    for (let index = this.data.length - 1; index >= 0; index -= 1) {
      if (this.data[index].some((value) => value !== "" && value !== null && value !== undefined)) {
        return index + 1;
      }
    }
    return 0;
  }

  getRange(row, column, rowCount, columnCount) {
    return new MockRange(this, row, column, rowCount, columnCount);
  }

  appendRow(values) {
    this.data.push(values.slice());
  }

  valueAt(row, column) {
    return this.data[row - 1]?.[column - 1] ?? "";
  }

  setValueAt(row, column, value) {
    while (this.data.length < row) this.data.push([]);
    while (this.data[row - 1].length < column) this.data[row - 1].push("");
    this.data[row - 1][column - 1] = value;
  }

  recordAt(row) {
    return Object.fromEntries(this.data[0].map((header, index) => [header, this.valueAt(row, index + 1)]));
  }
}

class MockFolder {
  constructor(prefix) {
    this.prefix = prefix;
    this.files = [];
    this.fail = false;
  }

  getName() {
    return this.prefix;
  }

  createFile(blob) {
    if (this.fail) throw new Error("Simulated Drive write failure");
    const file = {
      id: `${this.prefix}-${this.files.length + 1}`,
      blob,
      trashed: false,
      getId() { return this.id; },
      setTrashed(value) { this.trashed = value; }
    };
    this.files.push(file);
    return file;
  }
}

function createHarness() {
  const privateSheet = new MockSheet("Sheet1", PRIVATE_HEADERS);
  const teamSheet = new MockSheet("Sheet1", TEAM_HEADERS);
  const playerSheet = new MockSheet("Sheet1", PLAYER_HEADERS);
  const spreadsheets = {
    private: { getSheets: () => [privateSheet] },
    team: { getSheets: () => [teamSheet] },
    players: { getSheets: () => [playerSheet] }
  };
  const folders = {
    resumes: new MockFolder("resume"),
    certifications: new MockFolder("certification")
  };
  const mail = {
    messages: [],
    fail: false
  };
  let uuidCounter = 0;

  const sandbox = {
    Array,
    Date,
    JSON,
    Math,
    Number,
    Object,
    RegExp,
    String,
    console: { error() {} },
    isFinite,
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput(content) {
        return {
          content,
          setMimeType() { return this; },
          getContent() { return this.content; }
        };
      }
    },
    LockService: {
      getScriptLock() {
        return { tryLock: () => true, releaseLock() {} };
      }
    },
    PropertiesService: {
      getScriptProperties() {
        const properties = {
          PRIVATE_SHEET_ID: "private",
          TEAM_REVIEW_SHEET_ID: "team",
          PLAYER_CARDS_SHEET_ID: "players",
          RESUME_FOLDER_ID: "resumes",
          CERTIFICATION_FOLDER_ID: "certifications"
        };
        return { getProperty: (key) => properties[key] || "" };
      }
    },
    SpreadsheetApp: {
      openById(id) {
        if (!spreadsheets[id]) throw new Error(`Unknown spreadsheet: ${id}`);
        return spreadsheets[id];
      }
    },
    DriveApp: {
      getFolderById(id) {
        if (!folders[id]) throw new Error(`Unknown folder: ${id}`);
        return folders[id];
      }
    },
    MailApp: {
      sendEmail(message) {
        if (mail.fail) throw new Error("Simulated mail provider failure with private details");
        mail.messages.push(structuredClone(message));
      }
    },
    ScriptApp: {
      getProjectTriggers: () => [],
      newTrigger: () => ({
        forSpreadsheet() { return this; },
        onEdit() { return this; },
        create() { return this; }
      })
    },
    Utilities: {
      Charset: { UTF_8: "utf8" },
      DigestAlgorithm: { SHA_256: "sha256" },
      base64Decode(value) { return Array.from(Buffer.from(value, "base64")); },
      computeDigest(_algorithm, value) {
        return Array.from(crypto.createHash("sha256").update(value, "utf8").digest());
      },
      formatDate(date) {
        return date.toISOString().slice(0, 10).replace(/-/g, "");
      },
      getUuid() {
        uuidCounter += 1;
        return `00000000-0000-4000-8000-${String(uuidCounter).padStart(12, "0")}`;
      },
      newBlob(bytes, mimeType, name) { return { bytes, mimeType, name }; }
    }
  };

  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(__dirname, "..", "apps-script", "Code.gs"), "utf8");
  vm.runInContext(source, sandbox, { filename: "Code.gs" });

  function request(payload) {
    const response = sandbox.doPost({ postData: { contents: JSON.stringify(payload) } });
    return JSON.parse(response.getContent());
  }

  return { sandbox, privateSheet, teamSheet, playerSheet, folders, mail, request };
}

function validPayload(overrides = {}) {
  const payload = {
    action: "submit_application",
    schemaVersion: "3.0",
    clientRequestId: "request-0000000001",
    withdrawalToken: "withdrawal-token-00000000000000000001",
    applicant: {
      firstName: "Test",
      lastName: "Applicant",
      email: "test.applicant@example.test",
      phone: "555-0100",
      zipCode: "98092",
      accessibilityNotes: "",
      heardAboutUs: "Community partner"
    },
    application: {
      primaryRole: "Cloud Support · remote digital desk",
      secondaryRole: "Green Worker · operations / logistics",
      skills: "Scheduling and spreadsheet triage",
      availability: "September 26 · Shift 2 · 12:00 PM–3:00 PM",
      rewardPreferences: ["Quest credits", "Badge progress"]
    },
    acknowledgements: {
      trainingComic: true,
      commitment: true,
      accuracy: true
    },
    files: { resume: null, certifications: [] }
  };
  return merge(payload, overrides);
}

function merge(target, source) {
  const result = structuredClone(target);
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = { ...(result[key] || {}), ...value };
    } else {
      result[key] = value;
    }
  }
  return result;
}

test("valid application writes Private Applications and returns a receipt", () => {
  const harness = createHarness();
  const result = harness.request(validPayload());

  assert.equal(result.ok, true);
  assert.match(result.submissionId, /^SQ-\d{8}-[A-F0-9]{8}$/);
  assert.equal(harness.privateSheet.getLastRow(), 2);
  const record = harness.privateSheet.recordAt(2);
  assert.equal(record.review_status, "Pending Review");
  assert.equal(record.player_card_created, false);
  assert.equal(record.is_withdrawn, false);
  assert.equal(record.withdrawn_at, "");
  assert.notEqual(record.withdrawal_token_hash, validPayload().withdrawalToken);
});

test("legacy schema 3.0 single-role submissions remain compatible", () => {
  const harness = createHarness();
  const result = harness.request(validPayload({ application: { secondaryRole: "" } }));

  assert.equal(result.ok, true);
  const record = harness.privateSheet.recordAt(2);
  assert.equal(record.primary_role, "Cloud Support · remote digital desk");
  assert.equal(record.secondary_role, "");
  assert.deepEqual(JSON.parse(record.additional_roles), []);
  assert.equal(record.onboarding_acknowledged, true);
});

test("missing required field is rejected without writing", () => {
  const harness = createHarness();
  const result = harness.request(validPayload({ applicant: { firstName: "" } }));

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "VALIDATION_ERROR");
  assert.equal(result.error.fieldErrors.firstName, "This field is required.");
  assert.equal(harness.privateSheet.getLastRow(), 1);
});

test("invalid email is rejected", () => {
  const harness = createHarness();
  const result = harness.request(validPayload({ applicant: { email: "not-an-email" } }));

  assert.equal(result.ok, false);
  assert.equal(result.error.fieldErrors.email, "Enter a valid email address.");
});

test("unsupported form schema is rejected before any write", () => {
  const harness = createHarness();
  const result = harness.request(validPayload({ schemaVersion: "2B.1" }));

  assert.equal(result.ok, false);
  assert.match(result.error.fieldErrors.schemaVersion, /no longer supported/);
  assert.equal(harness.privateSheet.getLastRow(), 1);
});

test("multi-path submission preserves primary, additional paths, Team Review summary, and Player Card history", () => {
  const harness = createHarness();
  const selectedRoles = [
    "Power Runner · solar / technical",
    "Cloud Support · remote digital desk",
    "Event Lead · experienced coordination"
  ];
  const result = harness.request(validPayload({
    schemaVersion: "3.1",
    application: {
      selectedRoles,
      primaryRole: selectedRoles[0],
      secondaryRoles: selectedRoles.slice(1),
      secondaryRole: selectedRoles[1]
    },
    acknowledgements: { onboardingMaterials: true, trainingComic: true }
  }));

  assert.equal(result.ok, true);
  const privateRecord = harness.privateSheet.recordAt(2);
  assert.equal(privateRecord.primary_role, selectedRoles[0]);
  assert.equal(privateRecord.secondary_role, selectedRoles[1]);
  assert.deepEqual(JSON.parse(privateRecord.additional_roles), selectedRoles.slice(1));
  assert.equal(privateRecord.onboarding_acknowledged, true);
  assert.match(privateRecord.onboarding_acknowledged_at, /^\d{4}-/);

  const teamRecord = harness.teamSheet.recordAt(2);
  selectedRoles.forEach((role) => assert.match(teamRecord.primary_role, new RegExp(role.split(" · ")[0])));
  assert.equal(Object.prototype.hasOwnProperty.call(teamRecord, "additional_roles"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(teamRecord, "onboarding_acknowledged_at"), false);

  const statusColumn = harness.teamSheet.data[0].indexOf("review_status") + 1;
  harness.teamSheet.setValueAt(2, statusColumn, "Approved");
  harness.sandbox.processAdminReviewRow_(harness.teamSheet, 2, harness.sandbox.getConfig_());
  harness.sandbox.processAdminReviewRow_(harness.teamSheet, 2, harness.sandbox.getConfig_());

  const card = harness.playerSheet.recordAt(2);
  assert.equal(card.primary_role, selectedRoles[0]);
  assert.deepEqual(JSON.parse(card.additional_roles), selectedRoles.slice(1));
  assert.equal(JSON.parse(card.role_history).length, 1);
  assert.deepEqual(JSON.parse(card.role_history)[0].additional_roles, selectedRoles.slice(1));
  assert.equal(card.onboarding_acknowledged, true);
  assert.equal(card.public_profile_consent, false);
});

test("Team Review sync contains only the privacy-safe schema", () => {
  const harness = createHarness();
  const payload = validPayload({
    applicant: { accessibilityNotes: "Private health detail" },
    application: {
      skills: "Email private.person@example.test, call 206-555-0199, or open https://drive.google.com/private"
    },
    files: {
      resume: {
        name: "resume.pdf",
        mimeType: "application/pdf",
        size: 4,
        base64: Buffer.from("test").toString("base64")
      },
      certifications: []
    }
  });
  const result = harness.request(payload);
  assert.equal(result.ok, true);

  const teamRecord = harness.teamSheet.recordAt(2);
  assert.deepEqual(Object.keys(teamRecord), TEAM_HEADERS);
  const serialized = JSON.stringify(teamRecord);
  assert.equal(serialized.includes(payload.applicant.email), false);
  assert.equal(serialized.includes(payload.applicant.phone), false);
  assert.equal(serialized.includes(payload.applicant.zipCode), false);
  assert.equal(serialized.includes(payload.applicant.accessibilityNotes), false);
  assert.equal(serialized.includes("private.person@example.test"), false);
  assert.equal(serialized.includes("206-555-0199"), false);
  assert.equal(serialized.includes("drive.google.com"), false);
  assert.match(teamRecord.skills_summary, /\[contact removed\]/);
  assert.match(teamRecord.skills_summary, /\[link removed\]/);
  assert.equal(serialized.includes("resume-1"), false);
  assert.equal(serialized.includes("onboarding_email_status"), false);
  assert.equal(serialized.includes("onboarding_email_sent_at"), false);
  assert.equal(teamRecord.qualification_summary, "Resume on file");
});

test("user-provided spreadsheet text is neutralized against formula execution", () => {
  const harness = createHarness();
  const result = harness.request(validPayload({
    applicant: { firstName: '=HYPERLINK("https://example.test","Click")' },
    application: { skills: '=IMPORTDATA("https://example.test")' }
  }));

  assert.equal(result.ok, true);
  assert.match(harness.privateSheet.recordAt(2).first_name, /^'/);
  assert.match(harness.privateSheet.recordAt(2).skills, /^'/);
  assert.match(harness.teamSheet.recordAt(2).name, /^'/);
  assert.match(harness.teamSheet.recordAt(2).skills_summary, /^'/);
});

test("duplicate client request repairs safely without duplicate rows", () => {
  const harness = createHarness();
  const payload = validPayload();
  const first = harness.request(payload);
  const second = harness.request(payload);

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(second.duplicate, true);
  assert.equal(second.submissionId, first.submissionId);
  assert.equal(harness.privateSheet.getLastRow(), 2);
  assert.equal(harness.teamSheet.getLastRow(), 2);
});

test("duplicate retry repairs a missing Team Review row", () => {
  const harness = createHarness();
  const payload = validPayload();
  const first = harness.request(payload);
  harness.teamSheet.data.splice(1, 1);

  const retry = harness.request(payload);
  assert.equal(retry.ok, true);
  assert.equal(retry.duplicate, true);
  assert.equal(retry.submissionId, first.submissionId);
  assert.equal(harness.privateSheet.getLastRow(), 2);
  assert.equal(harness.teamSheet.getLastRow(), 2);
});

test("resume and certification uploads store IDs only in Private Applications", () => {
  const harness = createHarness();
  const resumeBytes = Buffer.from("fake resume");
  const certificationBytes = Buffer.from("fake certificate");
  const result = harness.request(validPayload({
    files: {
      resume: {
        name: "resume.pdf",
        mimeType: "application/pdf",
        size: resumeBytes.length,
        base64: resumeBytes.toString("base64")
      },
      certifications: [{
        name: "certificate.png",
        mimeType: "image/png",
        size: certificationBytes.length,
        base64: certificationBytes.toString("base64")
      }]
    }
  }));

  assert.equal(result.ok, true);
  const privateRecord = harness.privateSheet.recordAt(2);
  assert.equal(privateRecord.resume_file_id, "resume-1");
  assert.deepEqual(JSON.parse(privateRecord.certification_file_ids), ["certification-1"]);
  const teamSerialized = JSON.stringify(harness.teamSheet.recordAt(2));
  assert.equal(teamSerialized.includes("resume-1"), false);
  assert.equal(teamSerialized.includes("certification-1"), false);
  assert.equal(harness.teamSheet.recordAt(2).qualification_summary, "Resume on file; 1 certification file(s) on file");
});

test("Needs Info and admin notes synchronize to Private Applications", () => {
  const harness = createHarness();
  harness.request(validPayload());
  const headers = harness.teamSheet.data[0];
  harness.teamSheet.setValueAt(2, headers.indexOf("review_status") + 1, "Needs Info");
  harness.teamSheet.setValueAt(2, headers.indexOf("admin_notes") + 1, "Ask for an updated availability window.");

  const result = harness.sandbox.processAdminReviewRow_(harness.teamSheet, 2, harness.sandbox.getConfig_());
  assert.equal(result.ok, true);
  assert.equal(harness.privateSheet.recordAt(2).review_status, "Needs Info");
  assert.equal(harness.privateSheet.recordAt(2).admin_notes, "Ask for an updated availability window.");
  assert.equal(harness.playerSheet.getLastRow(), 1);
});

test("invalid admin status is reverted and rejected", () => {
  const harness = createHarness();
  harness.request(validPayload());
  const headers = harness.teamSheet.data[0];
  harness.teamSheet.setValueAt(2, headers.indexOf("review_status") + 1, "Withdrawn");

  assert.throws(
    () => harness.sandbox.processAdminReviewRow_(harness.teamSheet, 2, harness.sandbox.getConfig_()),
    /Unsupported review status/
  );
  assert.equal(harness.teamSheet.recordAt(2).review_status, "Pending Review");
  assert.equal(harness.privateSheet.recordAt(2).review_status, "Pending Review");
});

test("Approved review creates one internal Player Card with safe defaults", () => {
  const harness = createHarness();
  const submitted = harness.request(validPayload());
  const teamHeaders = harness.teamSheet.data[0];
  harness.teamSheet.setValueAt(2, teamHeaders.indexOf("review_status") + 1, "Approved");
  const config = harness.sandbox.getConfig_();

  const first = harness.sandbox.processAdminReviewRow_(harness.teamSheet, 2, config);
  const second = harness.sandbox.processAdminReviewRow_(harness.teamSheet, 2, config);

  assert.equal(first.ok, true);
  assert.equal(first.playerCard.created, true);
  assert.equal(second.playerCard.created, false);
  assert.equal(harness.playerSheet.getLastRow(), 2);
  const card = harness.playerSheet.recordAt(2);
  assert.equal(card.submission_id, submitted.submissionId);
  assert.equal(card.public_profile_consent, false);
  assert.equal(card.badges, "[]");
  assert.equal(card.quest_credits, 0);
  assert.equal(card.completed_quests, "[]");
  assert.equal(card.member_status, "Active");
  assert.equal(harness.mail.messages.length, 1);
});

test("Approved review sends the required onboarding email from the private application", () => {
  const harness = createHarness();
  harness.request(validPayload());
  const teamHeaders = harness.teamSheet.data[0];
  harness.teamSheet.setValueAt(2, teamHeaders.indexOf("review_status") + 1, "Approved");

  const result = harness.sandbox.processAdminReviewRow_(harness.teamSheet, 2, harness.sandbox.getConfig_());

  assert.equal(result.ok, true);
  assert.equal(result.onboardingEmail.sent, true);
  assert.equal(harness.mail.messages.length, 1);
  assert.deepEqual(harness.mail.messages[0], {
    to: "test.applicant@example.test",
    subject: "Your Sunrise Quest application is approved",
    body: [
      "Hi Test,",
      "",
      "Your Sunrise Quest application has been approved.",
      "",
      "Primary role: Cloud Support · remote digital desk",
      "",
      "Please review the onboarding materials before participating in the event.",
      "",
      "We’ll share the next steps and event details with you shortly.",
      "",
      "Sunrise Quest Board",
      "KeyTech Labs"
    ].join("\n"),
    name: "Sunrise Quest Board"
  });
  const privateRecord = harness.privateSheet.recordAt(2);
  assert.equal(privateRecord.onboarding_email_status, "Sent");
  assert.match(privateRecord.onboarding_email_sent_at, /^\d{4}-/);
});

test("reprocessing Approved does not send a duplicate onboarding email", () => {
  const harness = createHarness();
  harness.request(validPayload());
  const statusColumn = harness.teamSheet.data[0].indexOf("review_status") + 1;
  harness.teamSheet.setValueAt(2, statusColumn, "Approved");
  const config = harness.sandbox.getConfig_();

  harness.sandbox.processAdminReviewRow_(harness.teamSheet, 2, config);
  const repeated = harness.sandbox.processAdminReviewRow_(harness.teamSheet, 2, config);

  assert.equal(harness.mail.messages.length, 1);
  assert.equal(repeated.onboardingEmail.sent, false);
  assert.equal(repeated.onboardingEmail.duplicate, true);
  assert.equal(harness.playerSheet.getLastRow(), 2);
});

test("Approved with a missing private email creates the card but skips email safely", () => {
  const harness = createHarness();
  harness.request(validPayload());
  const privateHeaders = harness.privateSheet.data[0];
  harness.privateSheet.setValueAt(2, privateHeaders.indexOf("email") + 1, "");
  const teamHeaders = harness.teamSheet.data[0];
  harness.teamSheet.setValueAt(2, teamHeaders.indexOf("review_status") + 1, "Approved");

  const result = harness.sandbox.processAdminReviewRow_(harness.teamSheet, 2, harness.sandbox.getConfig_());

  assert.equal(result.ok, true);
  assert.equal(result.onboardingEmail.reason, "missing_email");
  assert.equal(harness.mail.messages.length, 0);
  assert.equal(harness.privateSheet.recordAt(2).onboarding_email_status, "Missing Email");
  assert.equal(harness.privateSheet.recordAt(2).onboarding_email_sent_at, "");
  assert.equal(harness.playerSheet.getLastRow(), 2);
});

test("email send failure preserves approval and card, records failure, and retries safely", () => {
  const harness = createHarness();
  harness.request(validPayload());
  const teamHeaders = harness.teamSheet.data[0];
  harness.teamSheet.setValueAt(2, teamHeaders.indexOf("review_status") + 1, "Approved");
  const config = harness.sandbox.getConfig_();
  harness.mail.fail = true;

  assert.throws(
    () => harness.sandbox.processAdminReviewRow_(harness.teamSheet, 2, config),
    /Approval and Player Card were saved/
  );
  assert.equal(harness.privateSheet.recordAt(2).review_status, "Approved");
  assert.equal(harness.privateSheet.recordAt(2).player_card_created, true);
  assert.equal(harness.privateSheet.recordAt(2).onboarding_email_status, "Failed");
  assert.equal(harness.privateSheet.recordAt(2).onboarding_email_sent_at, "");
  assert.equal(harness.teamSheet.recordAt(2).player_card_status, "Created");
  assert.equal(harness.playerSheet.getLastRow(), 2);
  assert.equal(harness.mail.messages.length, 0);

  harness.mail.fail = false;
  const retry = harness.sandbox.processAdminReviewRow_(harness.teamSheet, 2, config);
  assert.equal(retry.onboardingEmail.sent, true);
  assert.equal(harness.mail.messages.length, 1);
  assert.equal(harness.playerSheet.getLastRow(), 2);
  assert.equal(harness.privateSheet.recordAt(2).onboarding_email_status, "Sent");
});

test("Approved status cannot be reversed while its Player Card remains active", () => {
  const harness = createHarness();
  harness.request(validPayload());
  const headers = harness.teamSheet.data[0];
  const statusColumn = headers.indexOf("review_status") + 1;
  harness.teamSheet.setValueAt(2, statusColumn, "Approved");
  harness.sandbox.processAdminReviewRow_(harness.teamSheet, 2, harness.sandbox.getConfig_());
  harness.teamSheet.setValueAt(2, statusColumn, "Rejected");

  assert.throws(
    () => harness.sandbox.processAdminReviewRow_(harness.teamSheet, 2, harness.sandbox.getConfig_()),
    /cannot be reversed automatically/
  );
  assert.equal(harness.teamSheet.recordAt(2).review_status, "Approved");
  assert.equal(harness.privateSheet.recordAt(2).review_status, "Approved");
  assert.equal(harness.playerSheet.recordAt(2).member_status, "Active");
});

test("withdrawal preserves the private row and prevents Player Card creation", () => {
  const harness = createHarness();
  const payload = validPayload();
  const submitted = harness.request(payload);
  const withdrawn = harness.request({
    action: "withdraw_application",
    submissionId: submitted.submissionId,
    withdrawalToken: payload.withdrawalToken
  });

  assert.equal(withdrawn.ok, true);
  assert.equal(withdrawn.withdrawn, true);
  assert.equal(harness.privateSheet.getLastRow(), 2);
  assert.equal(harness.privateSheet.recordAt(2).is_withdrawn, true);
  assert.match(harness.privateSheet.recordAt(2).withdrawn_at, /^\d{4}-/);
  assert.equal(harness.teamSheet.recordAt(2).player_card_status, "Not Created — Applicant Withdrawn");

  const repeated = harness.request({
    action: "withdraw_application",
    submissionId: submitted.submissionId,
    withdrawalToken: payload.withdrawalToken
  });
  assert.equal(repeated.ok, true);
  assert.equal(repeated.duplicate, true);
  assert.equal(repeated.withdrawnAt, withdrawn.withdrawnAt);

  const teamHeaders = harness.teamSheet.data[0];
  harness.teamSheet.setValueAt(2, teamHeaders.indexOf("review_status") + 1, "Approved");
  assert.throws(
    () => harness.sandbox.processAdminReviewRow_(harness.teamSheet, 2, harness.sandbox.getConfig_()),
    /withdrawn application cannot be approved/i
  );
  assert.equal(harness.playerSheet.getLastRow(), 1);
  assert.equal(harness.mail.messages.length, 0);
});

test("invalid withdrawal token does not change the historical application", () => {
  const harness = createHarness();
  const payload = validPayload();
  const submitted = harness.request(payload);
  const result = harness.request({
    action: "withdraw_application",
    submissionId: submitted.submissionId,
    withdrawalToken: "wrong-withdrawal-token-000000000000000"
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "WITHDRAWAL_NOT_AUTHORIZED");
  assert.equal(harness.privateSheet.recordAt(2).is_withdrawn, false);
  assert.equal(harness.privateSheet.recordAt(2).withdrawn_at, "");
});

test("file upload failure returns an error and leaves no application row", () => {
  const harness = createHarness();
  harness.folders.resumes.fail = true;
  const bytes = Buffer.from("fake resume content");
  const result = harness.request(validPayload({
    files: {
      resume: {
        name: "resume.pdf",
        mimeType: "application/pdf",
        size: bytes.length,
        base64: bytes.toString("base64")
      },
      certifications: []
    }
  }));

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "SUBMISSION_FAILED");
  assert.equal(result.error.stage, "file_upload");
  assert.equal(harness.privateSheet.getLastRow(), 1);
  assert.equal(harness.teamSheet.getLastRow(), 1);
});

test("Apps Script editor self-tests pass with the production backend source", () => {
  const harness = createHarness();
  const testsSource = fs.readFileSync(path.join(__dirname, "..", "apps-script", "Tests.gs"), "utf8");
  vm.runInContext(testsSource, harness.sandbox, { filename: "Tests.gs" });

  const results = harness.sandbox.runBackendSelfTests();

  assert.equal(results.length, 8);
  assert.equal(results.every((result) => result.passed), true);
});

test("Apps Script manifest declares the mail scope required by approval onboarding", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "apps-script", "appsscript.json"), "utf8"));
  assert.equal(manifest.oauthScopes.includes("https://www.googleapis.com/auth/script.send_mail"), true);
});
