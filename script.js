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
    duration: "Pre-event + event day remote",
    score: 89,
    summary: "Track status updates, route questions, update digital notes, and keep remote documentation useful for on-site teams.",
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
    duration: "Post-event",
    score: 82,
    summary: "Collect quest proof, organize photos and logs, prepare feedback notes, and compare expected duties with what happened on site.",
    proof: ["Proof folder", "Feedback summary", "Expectation vs. reality notes"],
    reason: "Connects the live test to measurable learning after September 26."
  }
];

const applicants = [
  {
    name: "Jordan K.",
    role: "Power Runner",
    fit: 94,
    reward: "Stipend eligible",
    signals: ["Solar 101", "Site Safety", "2 setup shifts"],
    note: "Strong candidate for solar hardware support because the proof history already matches technical setup work."
  },
  {
    name: "Nia R.",
    role: "Green Worker",
    fit: 91,
    reward: "Quest credits",
    signals: ["Tent setup", "Material runs", "Crew standup"],
    note: "Best for infrastructure setup and event-day logistics because availability covers the highest-pressure window."
  },
  {
    name: "Sam L.",
    role: "Cloud Support",
    fit: 88,
    reward: "Badge progress",
    signals: ["Remote admin", "Status notes", "Proof folders"],
    note: "Good fit for remote operations because the work is documentation-heavy and time-sensitive."
  },
  {
    name: "Eli M.",
    role: "Green Worker",
    fit: 83,
    reward: "Credits + badge",
    signals: ["Breakdown", "Tools", "Final sweep"],
    note: "Useful late-night crew member for site reset, especially if the board needs backup coverage."
  }
];

const research = [
  {
    name: "Readiness by September 20",
    focus: "Before event week",
    lesson: "The board makes preparation visible: who accepted a role, who read the guide, and who still needs support.",
    move: "This supports Adam's 100% readiness target before the September 26 Sunrise Fair."
  },
  {
    name: "Role clarity",
    focus: "Three character roles",
    lesson: "Each quest must clearly say role family, responsibilities, shift window, proof required, and reward type.",
    move: "This is why the site uses Power Runners, Green Workers, and Cloud Support instead of random volunteer titles."
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
  ["4. Prepare", "Assigned contributors read the comic guide/manual and confirm readiness before September 20."],
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
    percent: 96,
    title: "Quest Party Lead",
    meta: "Level 4 readiness · lead support · 52 credits · 8 badges",
    note: "Ready to coordinate a small team, review proof, and help update the next playbook."
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
const saveApplication = document.querySelector("#saveApplication");
const applicationStatus = document.querySelector("#applicationStatus");
const levelButtons = document.querySelectorAll("[data-level]");
let currentView = "recommended";

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
      liveScore: Math.max(42, Math.min(99, quest.score + (level - quest.level) * 4))
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
      <button type="button" class="shortlist-button">Shortlist</button>
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

document.querySelectorAll("[data-open-panel]").forEach((button) => {
  button.addEventListener("click", () => {
    const panel = document.getElementById(button.dataset.openPanel);
    if (!panel) return;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    document.querySelector(".scrim")?.classList.add("open");
  });
});

document.querySelectorAll("[data-close-panel]").forEach((button) => {
  button.addEventListener("click", () => {
    const panel = document.querySelector(".side-panel");
    panel?.classList.remove("open");
    panel?.setAttribute("aria-hidden", "true");
    document.querySelector(".scrim")?.classList.remove("open");
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
    if (publishStatus) {
      publishStatus.textContent = "This quest is now visible in the applicant queue for Power Runners.";
    }
  });
}

document.addEventListener("click", (event) => {
  if (!event.target.classList.contains("shortlist-button")) return;
  event.target.textContent = "Shortlisted";
  event.target.disabled = true;
});

if (saveApplication) {
  saveApplication.addEventListener("click", () => {
    if (applicationStatus) {
      applicationStatus.textContent = "Draft Player Card saved for review. It can be matched to open quests next.";
    }
  });
}

updatePlayerProgress();
renderResearch();
renderTimeline();
renderApplicants();
renderQuests();
