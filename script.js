const quests = [
  {
    title: "Power Runner · Solar Hardware Support",
    skill: "energy",
    role: "Power Runners",
    level: 2,
    rewards: ["credits", "stipend", "badge"],
    duration: "September 26 · full event day",
    score: 96,
    summary: "Prepare solar hardware, check battery status, route cables safely, and keep power notes during setup, live operations, and breakdown.",
    proof: ["Battery and inverter check log", "Cable safety photos", "End-of-night power notes"],
    reason: "Matches the solar/technical role from the MVP brief and turns energy work into a clear quest with proof."
  },
  {
    title: "Green Worker · Infrastructure Setup",
    skill: "logistics",
    role: "Green Workers",
    level: 2,
    rewards: ["credits", "badge"],
    duration: "September 26 · setup + live support",
    score: 92,
    summary: "Set tents, move materials, support site logistics, keep lanes clear, and help the event lead convert the plan into a working site.",
    proof: ["Setup checklist", "Before and after photos", "Crew handoff notes"],
    reason: "Uses the operations role from the brief and copies the marketplace idea of scoped, assignable physical tasks."
  },
  {
    title: "Cloud Support · Remote Operations Desk",
    skill: "community",
    role: "Cloud Support",
    level: 1,
    rewards: ["credits", "badge"],
    duration: "September 26 · remote support",
    score: 89,
    summary: "Track September 26 status updates, route questions, update digital notes, and keep remote documentation useful for on-site teams.",
    proof: ["Support log", "Issue routing notes", "Updated onboarding records"],
    reason: "Makes remote admin visible as real work instead of invisible background help."
  },
  {
    title: "Power Runner · Battery Watch",
    skill: "energy",
    role: "Power Runners",
    level: 3,
    rewards: ["credits", "stipend", "badge"],
    duration: "September 26 · live operations",
    score: 87,
    summary: "Monitor battery levels, report power risks early, and coordinate with the technical lead before power becomes a problem.",
    proof: ["Hourly battery notes", "Risk alerts", "Final stability summary"],
    reason: "Adds a higher-readiness quest for contributors who can handle responsibility during the live event."
  },
  {
    title: "Green Worker · Breakdown & Site Reset",
    skill: "logistics",
    role: "Green Workers",
    level: 1,
    rewards: ["credits", "badge"],
    duration: "September 26 · late night",
    score: 84,
    summary: "Pack equipment, coil cables, clear materials, and help confirm that the site is clean after the fair.",
    proof: ["Breakdown checklist", "Final sweep photos", "Missing item notes"],
    reason: "Keeps the least glamorous work visible, assignable, and creditable."
  },
  {
    title: "Cloud Support · Proof & Feedback Queue",
    skill: "media",
    role: "Cloud Support",
    level: 2,
    rewards: ["credits", "badge"],
    duration: "After September 26",
    score: 82,
    summary: "Collect quest proof, organize photos and logs, prepare feedback notes, and compare expected duties with what happened on site.",
    proof: ["Proof folder", "Feedback summary", "Expectation vs. reality notes"],
    reason: "Connects the live test to measurable learning after September 26."
  }
];

const applicants = [
  {
    name: "Jordan K.",
    role: "Power Runner candidate",
    fit: 94,
    reward: "Stipend eligible",
    signals: ["Solar 101", "Battery checks", "Cable safety"],
    note: "Good for the solar hardware shift: can help unload panels, check batteries, and keep a simple power log."
  },
  {
    name: "Nia R.",
    role: "Green Worker candidate",
    fit: 91,
    reward: "Quest credits",
    signals: ["Tent setup", "Material runs", "Morning setup"],
    note: "Good for infrastructure setup: can move supplies, build the site layout, and support quick crew handoffs."
  },
  {
    name: "Sam L.",
    role: "Cloud Support candidate",
    fit: 88,
    reward: "Badge progress",
    signals: ["Remote admin", "Status notes", "Proof folders"],
    note: "Good for the remote desk: can organize updates, collect proof, and keep the event record clean."
  },
  {
    name: "Eli M.",
    role: "Green Worker candidate",
    fit: 83,
    reward: "Credits + badge",
    signals: ["Breakdown", "Tools", "Final sweep"],
    note: "Good for late-night breakdown: can pack gear, check missing items, and help reset the site after guests leave."
  }
];

const research = [
  {
    name: "Readiness before event day",
    focus: "Before September 26",
    lesson: "The board makes preparation visible: who accepted a role, who read the guide, and who still needs support before the fair.",
    move: "This supports the readiness target before the September 26 Sunrise Fair."
  },
  {
    name: "Role clarity",
    focus: "Five role paths",
    lesson: "Each quest must clearly say role family, responsibilities, shift window, proof required, and reward type.",
    move: "This is why the site uses Power Runners, Green Workers, Cloud Support, CE Vendors, and Event Leads instead of random volunteer titles."
  },
  {
    name: "Marketplace-style matching",
    focus: "Recruiting + assigning",
    lesson: "A lead should be able to compare people by fit, level, proof, reward eligibility, and availability.",
    move: "This translates gig-platform hiring patterns into a community operations system."
  },
  {
    name: "Post-event learning",
    focus: "After September 26",
    lesson: "The MVP is useful only if the team can compare expected duties with what really happened on site.",
    move: "Proof and feedback become the next version of the comic guide and onboarding sheet."
  }
];

const timeline = [
  ["1. Intake", "Contributor creates a Player Card with target role, skills, proof, reward preference, and availability."],
  ["2. Match", "Quest Board recommends roles by skill focus, experience level, and reward type."],
  ["3. Shortlist", "Event leads compare applicants and choose the best-fit Quest Party for the September test."],
  ["4. Prepare", "Assigned contributors read the comic guide/manual and confirm readiness before September 26."],
  ["5. Execute & Verify", "Crews complete event-day work, submit proof, earn credits or badge progress, and feed learning back into the system."]
];

const readinessByLevel = {
  1: {
    percent: 38,
    title: "New Quest Applicant",
    meta: "Level 1 readiness · guided work · 6 credits",
    note: "Good for beginner-friendly tasks with a clear lead and short checklist."
  },
  2: {
    percent: 68,
    title: "Prepared Greenworker",
    meta: "Level 2 readiness · standard quest · 18 credits · 3 badges",
    note: "Ready for event-day work with normal check-ins and proof requirements."
  },
  3: {
    percent: 84,
    title: "Reliable Crew Support",
    meta: "Level 3 readiness · complex quest · 31 credits · 5 badges",
    note: "Ready for higher-trust roles like battery watch, shift handoffs, and live troubleshooting."
  },
  4: {
    percent: 100,
    title: "Quest Party Lead",
    meta: "Level 4 readiness · lead-ready · 52 credits · 8 badges",
    note: "Fully ready to coordinate a small Quest Party, review proof, and help update the next playbook."
  }
};

const questGrid = document.querySelector("#questGrid");
const questDetail = document.querySelector("#questDetail");
const matcher = document.querySelector("#matcher");
const skillInput = document.querySelector("#skill");
const experienceInput = document.querySelector("#experience");
const researchGrid = document.querySelector("#researchGrid");
const timelineEl = document.querySelector("#timeline");
const applicantGrid = document.querySelector("#applicantGrid");
const experienceValue = document.querySelector("#experienceValue");
const levelPercent = document.querySelector("#levelPercent");
const levelBar = document.querySelector("#levelBar");
const playerMeta = document.querySelector("#playerMeta");
const playerTitle = document.querySelector("#playerTitle");
const readinessNote = document.querySelector("#readinessNote");
const publishQuest = document.querySelector("#publishQuest");
const publishStatus = document.querySelector("#publishStatus");
const undoPublish = document.querySelector("#undoPublish");
const saveApplication = document.querySelector("#saveApplication");
const applicationStatus = document.querySelector("#applicationStatus");
const savedApplicationCard = document.querySelector("#savedApplicationCard");
const editApplication = document.querySelector("#editApplication");
const deleteApplication = document.querySelector("#deleteApplication");
const applicationForm = document.querySelector("#applicationForm");
const applicationStepPanels = document.querySelectorAll("[data-step-panel]");
const applicationStepButtons = document.querySelectorAll("[data-application-step]");
const previousApplicationStep = document.querySelector("#previousApplicationStep");
const nextApplicationStep = document.querySelector("#nextApplicationStep");
const applicationStepStatus = document.querySelector("#applicationStepStatus");
const roleInput = document.querySelector("#role");
const leadExperienceField = document.querySelector("#leadExperienceField");
const roleTimelineSection = document.querySelector("#role-timeline");
const roleChoiceButtons = document.querySelectorAll("[data-role-choice]");
const applicationProgressBar = document.querySelector("#applicationProgressBar");
const applicationWorkspace = document.querySelector(".application-workspace");
const submitApplication = document.querySelector("#submitApplication");
const applicationSuccess = document.querySelector("#applicationSuccess");
const editCompletedApplication = document.querySelector("#editCompletedApplication");
const resumeFileInput = document.querySelector("#resumeFile");
const resumeDropzone = document.querySelector("#resumeDropzone");
const resumeFileCard = document.querySelector("#resumeFileCard");
const resumeFileName = document.querySelector("#resumeFileName");
const resumeFileMeta = document.querySelector("#resumeFileMeta");
const removeResumeFile = document.querySelector("#removeResumeFile");
const resumeRestoreNote = document.querySelector("#resumeRestoreNote");
const levelButtons = document.querySelectorAll("[data-level]");
const APPLICATION_DRAFT_KEY = "sunriseQuestApplicationDraftV2";
const APPLICATION_RECEIPT_KEY = "sunriseQuestSubmissionReceiptV1";
const SUBMISSION_ENDPOINT = document.querySelector('meta[name="sunrise-submission-endpoint"]')?.content.trim() || "";
let currentView = "recommended";
let currentApplicationStep = 1;
let applicationOpenTrigger = null;
let selectedResumeFile = null;
let savedResumeMetadata = null;
let draftSaveTimer = null;
let applicationCompletedLocally = false;
let draftWasExplicitlySaved = false;
let applicationClientRequestId = "";
let lastSubmissionReceipt = null;
let applicationSubmitting = false;

function selectedRewards() {
  if (!matcher) return [];
  return [...matcher.querySelectorAll('input[name="reward"]:checked')].map((item) => item.value);
}

function currentLevel() {
  return Number(experienceInput ? experienceInput.value : 2);
}

function filteredQuests() {
  const skill = skillInput ? skillInput.value : "all";
  const level = currentLevel();
  const rewards = selectedRewards();

  return quests
    .filter((quest) => skill === "all" || quest.skill === skill)
    .filter((quest) => currentView === "all" || quest.level <= level + 1)
    .filter((quest) => quest.rewards.some((reward) => rewards.includes(reward)))
    .map((quest) => ({
      ...quest,
      liveScore: Math.max(42, Math.min(100, quest.score + (level - quest.level) * 4))
    }))
    .sort((a, b) => b.liveScore - a.liveScore);
}

function updatePlayerProgress() {
  const level = currentLevel();
  const state = readinessByLevel[level] || readinessByLevel[2];
  if (experienceValue) experienceValue.textContent = `Level ${level}`;
  if (levelPercent) levelPercent.textContent = `${state.percent}%`;
  if (levelBar) levelBar.style.width = `${state.percent}%`;
  if (playerMeta) playerMeta.textContent = state.meta;
  if (playerTitle) playerTitle.textContent = state.title;
  if (readinessNote) readinessNote.textContent = state.note;
  levelButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.level) === level);
  });
}

function rewardLabel(reward) {
  const labels = {
    credits: "Quest credits",
    stipend: "Stipend eligible",
    badge: "Badge progress"
  };
  return labels[reward] || reward;
}

function renderQuests() {
  if (!questGrid) return;
  updatePlayerProgress();
  const list = filteredQuests();
  questGrid.innerHTML = "";

  if (!list.length) {
    questGrid.innerHTML = '<div class="detail-box"><h3>No matches yet</h3><p>Try a different skill focus or select more reward types.</p></div>';
    if (questDetail) {
      questDetail.innerHTML = '<p class="eyebrow">Selected quest</p><h3>No active match</h3><p>The filters are too narrow right now.</p>';
    }
    return;
  }

  list.forEach((quest, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `quest-card${index === 0 ? " active" : ""}`;
    card.innerHTML = `
      <div>
        <div class="quest-meta">
          <span>${quest.role}</span>
          <span>Level ${quest.level}</span>
        </div>
        <h3>${quest.title}</h3>
      </div>
      <p>${quest.summary}</p>
      <div class="card-footer">
        <span>${quest.duration}</span>
        <span class="match-score">${quest.liveScore}% fit</span>
      </div>
    `;
    card.addEventListener("click", () => {
      document.querySelectorAll(".quest-card").forEach((item) => item.classList.remove("active"));
      card.classList.add("active");
      renderDetail(quest);
    });
    questGrid.appendChild(card);
  });

  renderDetail(list[0]);
}

function renderDetail(quest) {
  if (!questDetail) return;
  questDetail.innerHTML = `
    <p class="eyebrow">Selected quest</p>
    <h3>${quest.title}</h3>
    <p>${quest.summary}</p>
    <div class="tag-row">${quest.rewards.map((reward) => `<span>${rewardLabel(reward)}</span>`).join("")}</div>
    <ul>
      ${quest.proof.map((item) => `<li>${item}</li>`).join("")}
    </ul>
    <p><strong>Why this match works:</strong> ${quest.reason}</p>
  `;
}

function renderResearch() {
  if (!researchGrid) return;
  researchGrid.innerHTML = research.map((item) => `
    <article class="platform-card">
      <div>
        <p class="eyebrow">${item.focus}</p>
        <h3>${item.name}</h3>
      </div>
      <p><strong>What it explains:</strong> ${item.lesson}</p>
      <p><strong>How the page uses it:</strong> ${item.move}</p>
    </article>
  `).join("");
}

function renderApplicants() {
  if (!applicantGrid) return;
  applicantGrid.innerHTML = applicants.map((person) => `
    <article class="applicant-card">
      <div>
        <span class="fit-pill">${person.fit}% fit</span>
        <h4>${person.name}</h4>
        <p>${person.role} · ${person.reward}</p>
      </div>
      <div class="tag-row">${person.signals.map((signal) => `<span>${signal}</span>`).join("")}</div>
      <p>${person.note}</p>
      <div class="card-actions">
        <button type="button" class="shortlist-button">Invite to quest</button>
        <button type="button" class="undo-button undo-invite" hidden>Cancel invite</button>
      </div>
    </article>
  `).join("");
}

function renderTimeline() {
  if (!timelineEl) return;
  timelineEl.innerHTML = timeline.map(([title, body]) => `
    <article class="timeline-step">
      <strong>${title}</strong>
      <p>${body}</p>
    </article>
  `).join("");
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    currentView = button.dataset.view;
    document.querySelectorAll("[data-view]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderQuests();
  });
});

function updateApplicationReview() {
  const review = (key, value) => {
    const target = document.querySelector(`[data-review="${key}"]`);
    if (target) target.textContent = value;
  };
  const name = document.querySelector("#name")?.value.trim() || "Draft contributor";
  const email = document.querySelector("#email")?.value.trim();
  const phone = document.querySelector("#phone")?.value.trim();
  const contact = [email, phone].filter(Boolean).join(" · ") || "Not added yet";
  const role = roleInput?.value || "Power Runner · solar / technical";
  const availability = document.querySelector("#availability")?.value || "September 26 · Shift 1 setup / teardown · 9:00 AM–12:00 PM + 5:00 PM–8:00 PM";
  const skills = document.querySelector("#interests")?.value.trim() || "No skills added yet";
  const proofText = document.querySelector("#proof")?.value.trim();
  const supportingLinks = document.querySelector("#supportingLinks")?.value.trim();
  const proof = proofText || "No proof added yet";
  const links = supportingLinks
    ? supportingLinks.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).join(" · ")
    : "No links added";
  const rewards = [...document.querySelectorAll('input[name="applicationReward"]:checked')]
    .map((item) => item.value)
    .join(", ") || "No reward preference selected";

  review("name", name);
  review("contact", contact);
  review("role", role);
  review("availability", availability);
  review("skills", skills);
  review("proof", proof);
  review("links", links);
  review("rewards", rewards);
}

function updateLeadExperienceField() {
  if (!leadExperienceField) return;
  leadExperienceField.hidden = !roleInput?.value.startsWith("Event Lead");
}

function updateRoleChoiceState() {
  roleChoiceButtons.forEach((button) => {
    const isActive = button.dataset.roleChoice === roleInput?.value;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Unknown size";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validationContainer(input) {
  if (!input) return null;
  if (input.name === "applicationReward") return document.querySelector(".reward-choice-grid");
  if (["ackGuide", "ackCommitment", "ackAccuracy"].includes(input.id)) return document.querySelector("#acknowledgementList");
  if (input.id === "role") return document.querySelector(".role-picker");
  return input.closest(".field") || input.parentElement;
}

function clearValidationError(input) {
  const container = validationContainer(input);
  if (!container) return;
  container.classList.remove("has-error");
  container.querySelectorAll("[data-validation-error]").forEach((item) => item.remove());
  if (input) input.removeAttribute("aria-invalid");
}

function setValidationError(input, message) {
  const container = validationContainer(input);
  if (!container) return;
  clearValidationError(input);
  container.classList.add("has-error");
  input?.setAttribute("aria-invalid", "true");
  const error = document.createElement("p");
  error.className = "field-error";
  error.dataset.validationError = "true";
  error.textContent = message;
  container.appendChild(error);
}

function validateApplicationStep(step, revealErrors = true) {
  const checks = [];
  const addRequired = (selector, message) => {
    const input = document.querySelector(selector);
    if (!input) return;
    let valid = Boolean(input.value?.trim());
    if (valid && input.type === "email") valid = input.validity.valid;
    checks.push({ input, valid, message: input.type === "email" && input.value && !input.validity.valid ? "Enter a valid email address." : message });
  };

  if (step === 1) {
    addRequired("#name", "Add your name to continue.");
    addRequired("#email", "Add your email to continue.");
    addRequired("#phone", "Add your phone number to continue.");
    addRequired("#zip", "Add your zip code to continue.");
    addRequired("#referral", "Choose how you heard about this opportunity.");
  }
  if (step === 2) {
    addRequired("#role", "Choose a role target.");
    addRequired("#availability", "Choose an event-day shift.");
    if (roleInput?.value.startsWith("Event Lead")) {
      addRequired("#leadExperience", "Tell us about your coordination experience.");
    }
  }
  if (step === 3) {
    addRequired("#interests", "Add at least one skill or interest.");
    const linksInput = document.querySelector("#supportingLinks");
    const invalidLink = parseSupportingLinks(linksInput?.value).find((link) => !isValidSupportingLink(link));
    checks.push({
      input: linksInput,
      valid: !invalidLink,
      message: "Use complete http:// or https:// links, one per line."
    });
  }
  if (step === 4) {
    const firstReward = document.querySelector('input[name="applicationReward"]');
    const valid = Boolean(document.querySelector('input[name="applicationReward"]:checked'));
    checks.push({ input: firstReward, valid, message: "Choose at least one participation or reward preference." });
  }
  if (step === 5) {
    [
      ["#ackGuide", "Confirm that you reviewed and understand the guide."],
      ["#ackCommitment", "Confirm that you can commit to this role and shift."],
      ["#ackAccuracy", "Confirm that your information is accurate and ready to submit."]
    ].forEach(([selector, message]) => {
      const input = document.querySelector(selector);
      checks.push({ input, valid: Boolean(input?.checked), message });
    });
  }

  checks.forEach(({ input, valid, message }) => {
    if (valid) clearValidationError(input);
    else if (revealErrors) setValidationError(input, message);
  });
  const firstInvalid = checks.find((check) => !check.valid)?.input || null;
  return { valid: !firstInvalid, firstInvalid };
}

function focusInvalidField(input) {
  if (!input) return;
  if (input.id === "role") roleChoiceButtons[0]?.focus();
  else input.focus();
}

function updateCompletedSteps() {
  applicationStepButtons.forEach((button) => {
    const step = Number(button.dataset.applicationStep);
    button.classList.toggle("complete", step < currentApplicationStep && validateApplicationStep(step, false).valid);
  });
}

function collectApplicationDraft() {
  const value = (selector) => document.querySelector(selector)?.value || "";
  return {
    version: 2,
    clientRequestId: getOrCreateClientRequestId(),
    updatedAt: new Date().toISOString(),
    currentStep: currentApplicationStep,
    savedExplicitly: draftWasExplicitlySaved,
    completedLocally: false,
    completedAt: "",
    name: value("#name"),
    email: value("#email"),
    phone: value("#phone"),
    zip: value("#zip"),
    referral: value("#referral"),
    accessibility: value("#accessibility"),
    role: value("#role"),
    availability: value("#availability"),
    leadExperience: value("#leadExperience"),
    interests: value("#interests"),
    proof: value("#proof"),
    supportingLinks: value("#supportingLinks"),
    rewards: [...document.querySelectorAll('input[name="applicationReward"]:checked')].map((item) => item.value),
    acknowledgements: {
      guide: Boolean(document.querySelector("#ackGuide")?.checked),
      commitment: Boolean(document.querySelector("#ackCommitment")?.checked),
      accuracy: Boolean(document.querySelector("#ackAccuracy")?.checked)
    },
    resume: selectedResumeFile
      ? { name: selectedResumeFile.name, size: selectedResumeFile.size, type: selectedResumeFile.type }
      : savedResumeMetadata
  };
}

function populateSavedDraftCard(data = collectApplicationDraft()) {
  document.querySelector("#savedCardName").textContent = data.name.trim() || "Draft contributor";
  document.querySelector("#savedCardRole").textContent = data.role || "selected role";
  document.querySelector("#savedCardAvailability").textContent = data.availability || "selected availability";
  document.querySelector("#savedCardSkills").textContent = data.interests.trim() || "No skills added yet";
  document.querySelector("#savedCardProof").textContent = data.proof.trim() || "No proof added yet";
}

function persistApplicationDraft({ explicit = false } = {}) {
  if (!applicationForm) return false;
  if (explicit) draftWasExplicitlySaved = true;
  const data = collectApplicationDraft();
  try {
    localStorage.setItem(APPLICATION_DRAFT_KEY, JSON.stringify(data));
    if (explicit) {
      populateSavedDraftCard(data);
      if (savedApplicationCard) savedApplicationCard.hidden = false;
      applicationWorkspace?.classList.add("has-draft");
      if (applicationStatus) applicationStatus.textContent = "Draft saved in this browser. It has not been submitted to the Sunrise team.";
    }
    return true;
  } catch (error) {
    if (applicationStatus) applicationStatus.textContent = "This browser could not save the draft. Keep this page open and try again.";
    return false;
  }
}

function scheduleDraftSave() {
  window.clearTimeout(draftSaveTimer);
  draftSaveTimer = window.setTimeout(() => persistApplicationDraft(), 250);
}

function restoreApplicationDraft() {
  let data;
  try {
    data = JSON.parse(localStorage.getItem(APPLICATION_DRAFT_KEY) || "null");
  } catch (error) {
    data = null;
  }
  if (!data || data.version !== 2 || !applicationForm) return false;

  applicationClientRequestId = typeof data.clientRequestId === "string" ? data.clientRequestId : "";

  ["name", "email", "phone", "zip", "referral", "accessibility", "role", "availability", "leadExperience", "interests", "proof", "supportingLinks"]
    .forEach((key) => {
      const input = document.querySelector(`#${key}`);
      if (input && typeof data[key] === "string") input.value = data[key];
    });
  document.querySelectorAll('input[name="applicationReward"]').forEach((input) => {
    input.checked = Array.isArray(data.rewards) && data.rewards.includes(input.value);
  });
  if (data.acknowledgements) {
    document.querySelector("#ackGuide").checked = Boolean(data.acknowledgements.guide);
    document.querySelector("#ackCommitment").checked = Boolean(data.acknowledgements.commitment);
    document.querySelector("#ackAccuracy").checked = Boolean(data.acknowledgements.accuracy);
  }
  savedResumeMetadata = data.resume || null;
  if (savedResumeMetadata?.name && resumeRestoreNote) {
    resumeRestoreNote.textContent = `${savedResumeMetadata.name} was listed in this draft. Please attach the file again before final submission.`;
    resumeRestoreNote.hidden = false;
  }
  draftWasExplicitlySaved = Boolean(data.savedExplicitly);
  applicationCompletedLocally = false;
  currentApplicationStep = Math.max(1, Math.min(5, Number(data.currentStep) || 1));
  updateLeadExperienceField();
  updateRoleChoiceState();
  updateApplicationReview();
  if (draftWasExplicitlySaved) {
    populateSavedDraftCard(data);
    if (savedApplicationCard) savedApplicationCard.hidden = false;
    applicationWorkspace?.classList.add("has-draft");
  }
  return true;
}

function updateResumeFileUi() {
  if (selectedResumeFile) {
    if (resumeFileName) resumeFileName.textContent = selectedResumeFile.name;
    if (resumeFileMeta) resumeFileMeta.textContent = `${formatFileSize(selectedResumeFile.size)} · ready on this device`;
    if (resumeFileCard) resumeFileCard.hidden = false;
    if (resumeDropzone) resumeDropzone.hidden = true;
    if (resumeRestoreNote) resumeRestoreNote.hidden = true;
  } else {
    if (resumeFileCard) resumeFileCard.hidden = true;
    if (resumeDropzone) resumeDropzone.hidden = false;
  }
  updateApplicationReview();
}

function acceptResumeFile(file) {
  if (!file) return;
  const allowed = ["pdf", "doc", "docx"];
  const extension = file.name.split(".").pop()?.toLowerCase();
  const field = document.querySelector(".resume-upload-field");
  field?.querySelectorAll("[data-validation-error]").forEach((item) => item.remove());
  field?.classList.remove("has-error");
  if (!allowed.includes(extension)) {
    setValidationError(resumeFileInput, "Choose a PDF, DOC, or DOCX file.");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    setValidationError(resumeFileInput, "This file is larger than 10 MB.");
    return;
  }
  selectedResumeFile = file;
  savedResumeMetadata = { name: file.name, size: file.size, type: file.type };
  updateResumeFileUi();
  scheduleDraftSave();
}

function parseSupportingLinks(value) {
  return String(value || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function isValidSupportingLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function getOrCreateClientRequestId() {
  if (applicationClientRequestId) return applicationClientRequestId;
  applicationClientRequestId = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `sq-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return applicationClientRequestId;
}

function buildSubmissionPayload() {
  const value = (selector) => document.querySelector(selector)?.value.trim() || "";
  return {
    schemaVersion: "2B.1",
    clientRequestId: getOrCreateClientRequestId(),
    clientCompletedAt: new Date().toISOString(),
    applicant: {
      fullName: value("#name"),
      email: value("#email"),
      phone: value("#phone"),
      zipCode: value("#zip"),
      referralSource: value("#referral"),
      accessibilityHealthNeeds: value("#accessibility")
    },
    application: {
      roleTarget: value("#role"),
      availabilityShift: value("#availability"),
      eventLeadExperience: value("#leadExperience"),
      skillsInterests: value("#interests"),
      proofDescription: value("#proof"),
      supportingLinks: parseSupportingLinks(value("#supportingLinks")),
      rewardPreferences: [...document.querySelectorAll('input[name="applicationReward"]:checked')].map((item) => item.value)
    },
    acknowledgements: {
      trainingComic: Boolean(document.querySelector("#ackGuide")?.checked),
      commitment: Boolean(document.querySelector("#ackCommitment")?.checked),
      accuracy: Boolean(document.querySelector("#ackAccuracy")?.checked)
    }
  };
}

async function submitApplicationToEndpoint(payload) {
  if (!SUBMISSION_ENDPOINT) {
    throw new Error("The Sunrise submission endpoint has not been configured yet. Your draft is still saved in this browser.");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(SUBMISSION_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      mode: "cors",
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal
    });
    if (!response.ok) throw new Error("The Sunrise application service did not respond successfully. Please try again.");
    const result = await response.json();
    if (!result?.ok) {
      const error = new Error(result?.message || "The application could not be submitted. Please try again.");
      error.result = result;
      throw error;
    }
    return result;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("The submission took too long. Your draft is safe; please try again.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function applyServerFieldErrors(fieldErrors = {}) {
  const fieldMap = {
    fullName: "#name",
    email: "#email",
    phone: "#phone",
    zipCode: "#zip",
    referralSource: "#referral",
    accessibilityHealthNeeds: "#accessibility",
    roleTarget: "#role",
    availabilityShift: "#availability",
    eventLeadExperience: "#leadExperience",
    skillsInterests: "#interests",
    proofDescription: "#proof",
    supportingLinks: "#supportingLinks",
    rewardPreferences: 'input[name="applicationReward"]',
    ackTrainingComic: "#ackGuide",
    ackCommitment: "#ackCommitment",
    ackAccuracy: "#ackAccuracy"
  };
  let firstInvalid = null;
  Object.entries(fieldErrors).forEach(([field, message]) => {
    const input = document.querySelector(fieldMap[field]);
    if (!input) return;
    setValidationError(input, message);
    if (!firstInvalid) firstInvalid = input;
  });
  return firstInvalid;
}

function saveSubmissionReceipt(result, payload) {
  lastSubmissionReceipt = {
    submissionId: result.submissionId,
    submittedAtUtc: result.submittedAtUtc,
    name: payload.applicant.fullName,
    role: payload.application.roleTarget,
    availability: payload.application.availabilityShift
  };
  try {
    localStorage.setItem(APPLICATION_RECEIPT_KEY, JSON.stringify(lastSubmissionReceipt));
  } catch (error) {
    // The visible confirmation still contains the Submission ID.
  }
}

function restoreSubmissionReceipt() {
  try {
    const receipt = JSON.parse(localStorage.getItem(APPLICATION_RECEIPT_KEY) || "null");
    if (!receipt?.submissionId) return false;
    lastSubmissionReceipt = receipt;
    applicationCompletedLocally = true;
    return true;
  } catch (error) {
    return false;
  }
}

function showApplicationSuccess(receipt = lastSubmissionReceipt) {
  applicationWorkspace.hidden = true;
  applicationSuccess.hidden = false;
  document.querySelector("#successApplicantName").textContent = receipt?.name || "contributor";
  document.querySelector("#successSubmissionId").textContent = receipt?.submissionId || "Pending";
  document.querySelector("#successRole").textContent = receipt?.role || "Selected role";
  document.querySelector("#successAvailability").textContent = receipt?.availability || "Selected shift";
  if (applicationProgressBar) applicationProgressBar.style.width = "100%";
  applicationStepButtons.forEach((button) => button.classList.add("complete"));
}

function showApplicationForm(step = currentApplicationStep) {
  applicationWorkspace.hidden = false;
  applicationSuccess.hidden = true;
  showApplicationStep(step);
}

function showApplicationStep(step) {
  currentApplicationStep = Math.max(1, Math.min(5, Number(step) || 1));
  applicationStepPanels.forEach((panel) => {
    const isActive = Number(panel.dataset.stepPanel) === currentApplicationStep;
    panel.hidden = !isActive;
    panel.classList.toggle("active", isActive);
  });
  applicationStepButtons.forEach((button) => {
    const isActive = Number(button.dataset.applicationStep) === currentApplicationStep;
    button.classList.toggle("active", isActive);
    if (isActive) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  if (previousApplicationStep) previousApplicationStep.hidden = currentApplicationStep === 1;
  if (nextApplicationStep) nextApplicationStep.hidden = currentApplicationStep === 5;
  if (saveApplication) saveApplication.hidden = false;
  if (submitApplication) submitApplication.hidden = currentApplicationStep !== 5;
  if (applicationStepStatus) applicationStepStatus.textContent = `Step ${currentApplicationStep} of 5`;
  if (applicationProgressBar) applicationProgressBar.style.width = `${currentApplicationStep * 20}%`;
  if (currentApplicationStep === 5) updateApplicationReview();
  updateCompletedSteps();
}

function closeApplicationPanel() {
  const panel = document.querySelector(".application-modal");
  panel?.classList.remove("open");
  panel?.setAttribute("aria-hidden", "true");
  document.querySelector(".scrim")?.classList.remove("open");
  document.body.classList.remove("application-open");
  applicationOpenTrigger?.focus();
}

function reorderRoleJourneys() {
  if (!roleTimelineSection) return;
  [".timeline-lead", ".timeline-power", ".timeline-green", ".timeline-cloud", ".timeline-vendor"]
    .forEach((selector) => {
      const journey = roleTimelineSection.querySelector(selector);
      if (journey) roleTimelineSection.appendChild(journey);
    });
}

document.querySelectorAll("[data-open-panel]").forEach((button) => {
  button.addEventListener("click", () => {
    const panel = document.getElementById(button.dataset.openPanel);
    if (!panel) return;
    applicationOpenTrigger = button;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    document.querySelector(".scrim")?.classList.add("open");
    document.body.classList.add("application-open");
    if (applicationCompletedLocally) showApplicationSuccess();
    else showApplicationForm(currentApplicationStep);
    panel.querySelector(".close-button")?.focus();
  });
});

document.querySelectorAll("[data-close-panel]").forEach((button) => {
  button.addEventListener("click", closeApplicationPanel);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.querySelector(".application-modal.open")) {
    closeApplicationPanel();
  }
});

applicationStepButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetStep = Number(button.dataset.applicationStep);
    if (targetStep <= currentApplicationStep) {
      showApplicationStep(targetStep);
      return;
    }
    for (let step = currentApplicationStep; step < targetStep; step += 1) {
      const result = validateApplicationStep(step, true);
      if (!result.valid) {
        showApplicationStep(step);
        if (applicationStatus) applicationStatus.textContent = "Complete the required fields before moving forward.";
        window.setTimeout(() => focusInvalidField(result.firstInvalid), 0);
        return;
      }
    }
    showApplicationStep(targetStep);
    scheduleDraftSave();
  });
});

if (previousApplicationStep) {
  previousApplicationStep.addEventListener("click", () => showApplicationStep(currentApplicationStep - 1));
}

if (nextApplicationStep) {
  nextApplicationStep.addEventListener("click", () => {
    const result = validateApplicationStep(currentApplicationStep, true);
    if (!result.valid) {
      if (applicationStatus) applicationStatus.textContent = "Complete the required fields before moving forward.";
      focusInvalidField(result.firstInvalid);
      return;
    }
    if (applicationStatus) applicationStatus.textContent = "";
    showApplicationStep(currentApplicationStep + 1);
    scheduleDraftSave();
  });
}

if (roleInput) {
  roleInput.addEventListener("change", () => {
    updateLeadExperienceField();
    updateRoleChoiceState();
  });
}

roleChoiceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!roleInput) return;
    roleInput.value = button.dataset.roleChoice;
    updateLeadExperienceField();
    updateRoleChoiceState();
    clearValidationError(roleInput);
    scheduleDraftSave();
  });
});

if (matcher) matcher.addEventListener("input", renderQuests);
if (experienceInput) {
  experienceInput.addEventListener("input", renderQuests);
  experienceInput.addEventListener("change", renderQuests);
}

levelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!experienceInput) return;
    experienceInput.value = button.dataset.level;
    renderQuests();
  });
});

if (publishQuest) {
  publishQuest.addEventListener("click", () => {
    publishQuest.textContent = "Draft published";
    publishQuest.disabled = true;
    if (undoPublish) undoPublish.hidden = false;
    if (publishStatus) {
      publishStatus.textContent = "This quest is now visible in the applicant queue for Power Runners.";
    }
  });
}

if (undoPublish) {
  undoPublish.addEventListener("click", () => {
    publishQuest.textContent = "Save this quest";
    publishQuest.disabled = false;
    undoPublish.hidden = true;
    if (publishStatus) {
      publishStatus.textContent = "Quest save was undone. It is back in draft mode.";
    }
  });
}

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("shortlist-button")) {
    const actions = event.target.closest(".card-actions");
    const undoButton = actions?.querySelector(".undo-invite");
    event.target.textContent = "Invite saved";
    event.target.disabled = true;
    if (undoButton) undoButton.hidden = false;
  }

  if (event.target.classList.contains("undo-invite")) {
    const actions = event.target.closest(".card-actions");
    const inviteButton = actions?.querySelector(".shortlist-button");
    if (inviteButton) {
      inviteButton.textContent = "Invite to quest";
      inviteButton.disabled = false;
    }
    event.target.hidden = true;
  }
});

if (saveApplication) {
  saveApplication.addEventListener("click", () => {
    persistApplicationDraft({ explicit: true });
  });
}

if (editApplication) {
  editApplication.addEventListener("click", () => {
    applicationCompletedLocally = false;
    showApplicationForm(1);
    document.querySelector("#name")?.focus();
    if (applicationStatus) {
      applicationStatus.textContent = "Editing mode: update the fields, then save the draft again.";
    }
  });
}

if (deleteApplication) {
  deleteApplication.addEventListener("click", () => {
    applicationForm?.reset();
    localStorage.removeItem(APPLICATION_DRAFT_KEY);
    draftWasExplicitlySaved = false;
    applicationCompletedLocally = false;
    applicationClientRequestId = "";
    selectedResumeFile = null;
    savedResumeMetadata = null;
    if (resumeFileInput) resumeFileInput.value = "";
    if (savedApplicationCard) savedApplicationCard.hidden = true;
    applicationWorkspace?.classList.remove("has-draft");
    applicationForm?.querySelectorAll(".has-error").forEach((item) => item.classList.remove("has-error"));
    applicationForm?.querySelectorAll("[data-validation-error]").forEach((item) => item.remove());
    updateLeadExperienceField();
    updateRoleChoiceState();
    updateResumeFileUi();
    if (resumeRestoreNote) resumeRestoreNote.hidden = true;
    showApplicationForm(1);
    if (applicationStatus) {
      applicationStatus.textContent = "Draft deleted. You can start a new Player Card.";
    }
  });
}

if (submitApplication) {
  submitApplication.addEventListener("click", async () => {
    if (applicationSubmitting) return;
    for (let step = 1; step <= 5; step += 1) {
      const result = validateApplicationStep(step, true);
      if (!result.valid) {
        showApplicationStep(step);
        if (applicationStatus) applicationStatus.textContent = "Your application still needs a few required details.";
        window.setTimeout(() => focusInvalidField(result.firstInvalid), 0);
        return;
      }
    }
    persistApplicationDraft({ explicit: true });
    const payload = buildSubmissionPayload();
    applicationSubmitting = true;
    submitApplication.disabled = true;
    submitApplication.textContent = "Submitting…";
    applicationForm?.setAttribute("aria-busy", "true");
    if (applicationStatus) applicationStatus.textContent = "Sending your application securely to the Sunrise team…";

    try {
      const result = await submitApplicationToEndpoint(payload);
      saveSubmissionReceipt(result, payload);
      applicationCompletedLocally = true;
      localStorage.removeItem(APPLICATION_DRAFT_KEY);
      draftWasExplicitlySaved = false;
      if (savedApplicationCard) savedApplicationCard.hidden = true;
      applicationWorkspace?.classList.remove("has-draft");
      if (applicationStatus) applicationStatus.textContent = "";
      showApplicationSuccess(lastSubmissionReceipt);
    } catch (error) {
      const firstInvalid = applyServerFieldErrors(error.result?.fieldErrors);
      if (firstInvalid) focusInvalidField(firstInvalid);
      if (applicationStatus) applicationStatus.textContent = error.message || "The application could not be submitted. Your draft is still saved.";
    } finally {
      applicationSubmitting = false;
      submitApplication.disabled = false;
      submitApplication.textContent = "Submit Application";
      applicationForm?.removeAttribute("aria-busy");
    }
  });
}

if (editCompletedApplication) {
  editCompletedApplication.addEventListener("click", () => {
    applicationForm?.reset();
    localStorage.removeItem(APPLICATION_RECEIPT_KEY);
    localStorage.removeItem(APPLICATION_DRAFT_KEY);
    lastSubmissionReceipt = null;
    applicationCompletedLocally = false;
    applicationClientRequestId = "";
    currentApplicationStep = 1;
    draftWasExplicitlySaved = false;
    selectedResumeFile = null;
    savedResumeMetadata = null;
    if (savedApplicationCard) savedApplicationCard.hidden = true;
    applicationWorkspace?.classList.remove("has-draft");
    updateLeadExperienceField();
    updateRoleChoiceState();
    updateApplicationReview();
    showApplicationForm(1);
  });
}

if (resumeDropzone && resumeFileInput) {
  resumeDropzone.addEventListener("click", () => resumeFileInput.click());
  resumeDropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      resumeFileInput.click();
    }
  });
  ["dragenter", "dragover"].forEach((type) => {
    resumeDropzone.addEventListener(type, (event) => {
      event.preventDefault();
      resumeDropzone.classList.add("drag-over");
    });
  });
  ["dragleave", "drop"].forEach((type) => {
    resumeDropzone.addEventListener(type, (event) => {
      event.preventDefault();
      resumeDropzone.classList.remove("drag-over");
    });
  });
  resumeDropzone.addEventListener("drop", (event) => acceptResumeFile(event.dataTransfer?.files?.[0]));
  resumeFileInput.addEventListener("change", () => acceptResumeFile(resumeFileInput.files?.[0]));
}

if (removeResumeFile) {
  removeResumeFile.addEventListener("click", () => {
    selectedResumeFile = null;
    savedResumeMetadata = null;
    if (resumeFileInput) resumeFileInput.value = "";
    if (resumeRestoreNote) resumeRestoreNote.hidden = true;
    updateResumeFileUi();
    scheduleDraftSave();
  });
}

if (applicationForm) {
  applicationForm.addEventListener("input", (event) => {
    clearValidationError(event.target);
    updateApplicationReview();
    scheduleDraftSave();
  });
  applicationForm.addEventListener("change", (event) => {
    clearValidationError(event.target);
    updateApplicationReview();
    scheduleDraftSave();
  });
}

updatePlayerProgress();
renderResearch();
renderTimeline();
reorderRoleJourneys();
renderApplicants();
renderQuests();
updateLeadExperienceField();
updateRoleChoiceState();
restoreApplicationDraft();
restoreSubmissionReceipt();
updateResumeFileUi();
if (applicationCompletedLocally) showApplicationSuccess(lastSubmissionReceipt);
else showApplicationForm(currentApplicationStep);
