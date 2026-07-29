const quests = [
  {
    title: "Solar Micro-Grid Support",
    skill: "energy",
    level: 2,
    rewards: ["credits", "badge"],
    duration: "Event day",
    score: 96,
    summary: "Support Marcus Johnson with solar panel unloading, micro-grid setup, battery checks, cable safety, and power-down.",
    proof: ["Battery status photos", "Energy notes in Captain's Log", "Post-event carbon offset summary"],
    source: "Fast role matching plus milestone tracking"
  },
  {
    title: "Event Operations Support",
    skill: "community",
    level: 1,
    rewards: ["credits", "badge"],
    duration: "Event day",
    score: 88,
    summary: "Support Maya Chen with setup coordination, volunteer check-ins, schedule updates, and crew handoffs.",
    proof: ["Check-in log", "Resolved request count", "Handoff notes"],
    source: "Guided recommendations adapted for community navigation"
  },
  {
    title: "Refreshments Station Support",
    skill: "logistics",
    level: 2,
    rewards: ["credits", "stipend", "badge"],
    duration: "Event day",
    score: 91,
    summary: "Support Rosa Delgado with local vendor setup, refreshments flow, food safety reminders, and guest care.",
    proof: ["Station checklist", "Vendor handoff notes", "Service photos"],
    source: "Skill packaging transformed into clear quest scopes"
  },
  {
    title: "Story & Proof Capture",
    skill: "media",
    level: 3,
    rewards: ["credits", "badge"],
    duration: "Event + post",
    score: 83,
    summary: "Capture photos, short quotes, proof of completed work, and story moments for the event recap and Player Cards.",
    proof: ["Media folder", "Contributor quotes", "Tagged quest evidence"],
    source: "Portfolio-style proof redesigned as visible contribution history"
  },
  {
    title: "Onboarding Host",
    skill: "community",
    level: 1,
    rewards: ["credits", "badge"],
    duration: "Pre-event",
    score: 79,
    summary: "Welcome new contributors, explain quest rules, and help them choose a beginner-friendly role.",
    proof: ["Attendance list", "Matched player cards", "Orientation feedback"],
    source: "Simple categories plus guided recommendations"
  },
  {
    title: "Breakdown Crew",
    skill: "logistics",
    level: 2,
    rewards: ["credits", "badge"],
    duration: "Late night",
    score: 86,
    summary: "Join the full crew after the last audience leaves: pack equipment, coil cables, clear the field, and support final inspection.",
    proof: ["Breakdown checklist", "Before and after photos", "Final sweep notes"],
    source: "Marketplace trust signals applied to event operations"
  }
];

const research = [
  {
    name: "Readiness Check",
    focus: "Before September 20",
    lesson: "Every recruited Greenworker needs to understand the quest before event week.",
    quest: "Use the page to confirm who has reviewed the comic/manual, chosen a role, and knows the next step."
  },
  {
    name: "Role Clarity",
    focus: "Director, solar, refreshments",
    lesson: "The MVP depends on clear support roles connected to the actual crew structure.",
    quest: "Show each role's duties, required skills, event window, deliverables, and support contacts."
  },
  {
    name: "Live Coordination",
    focus: "During the event",
    lesson: "On-site teams and remote support need the same map, timeline, and status language.",
    quest: "Use quest cards, checklists, and status updates to reduce confusion during setup, operation, and breakdown."
  },
  {
    name: "Proof & Feedback",
    focus: "After September 26",
    lesson: "The test is only useful if expectation and reality can be compared after the fair.",
    quest: "Collect photos, notes, completion evidence, and feedback so Player Cards and future quests improve."
  }
];

const applicants = [
  {
    name: "Jordan K.",
    role: "Solar Micro-Grid Support",
    fit: 94,
    rate: "Stipend eligible",
    signals: ["Solar 101", "Site Safety", "2 event shifts"],
    note: "Best match for supporting Marcus Johnson during solar unload, power-up, and final cable breakdown."
  },
  {
    name: "Nia R.",
    role: "Event Operations Support",
    fit: 89,
    rate: "Quest credits",
    signals: ["Crew check-in", "Schedule notes", "Guest support"],
    note: "Strong fit for supporting Maya Chen with volunteer flow, standup notes, and on-site coordination."
  },
  {
    name: "Eli M.",
    role: "Refreshments Station Support",
    fit: 86,
    rate: "Credits + badge",
    signals: ["Food safety", "Vendor support", "Guest care"],
    note: "Good match for helping Rosa Delgado with refreshments setup, local vendor care, and service flow."
  },
  {
    name: "Sam L.",
    role: "Story Capture",
    fit: 82,
    rate: "Quest credits",
    signals: ["Photo proof", "Interview notes", "Post-event"],
    note: "Best for collecting evidence and turning completed work into Player Card proof."
  }
];

const timeline = [
  ["1. Intake", "Create a Player Card with skills, interests, availability, and previous contribution proof."],
  ["2. Match", "Browse open quests or receive recommended roles based on level, skill fit, and event needs."],
  ["3. Standup", "Join the shared pre-event meeting, confirm responsibilities, and review the site kit."],
  ["4. Execute", "Complete assigned quest steps, coordinate with the Quest Party, and update the Captain's Log."],
  ["5. Verify", "Submit proof, receive feedback, earn credits and badges, and improve future events."]
];

const questGrid = document.querySelector("#questGrid");
const questDetail = document.querySelector("#questDetail");
const matcher = document.querySelector("#matcher");
const researchGrid = document.querySelector("#researchGrid");
const timelineEl = document.querySelector("#timeline");
const applicantGrid = document.querySelector("#applicantGrid");
const experienceValue = document.querySelector("#experienceValue");
const levelPercent = document.querySelector("#levelPercent");
const levelBar = document.querySelector("#levelBar");
const playerMeta = document.querySelector("#playerMeta");
const playerTitle = document.querySelector("#playerTitle");
let currentView = "recommended";

function selectedRewards() {
  return [...matcher.querySelectorAll('input[name="reward"]:checked')].map((item) => item.value);
}

function filteredQuests() {
  const skill = matcher.skill.value;
  const level = Number(matcher.experience.value);
  const rewards = selectedRewards();

  return quests
    .filter((quest) => skill === "all" || quest.skill === skill)
    .filter((quest) => currentView === "all" || quest.level <= level + 1)
    .filter((quest) => quest.rewards.some((reward) => rewards.includes(reward)))
    .sort((a, b) => b.score - a.score);
}

function updatePlayerProgress() {
  const level = Number(matcher.experience.value);
  const readinessByLevel = {
    1: { percent: 42, title: "New Event Contributor", meta: "Level 1 contributor · 6 credits · 1 badge" },
    2: { percent: 68, title: "Solar Support Candidate", meta: "Level 2 contributor · 18 credits · 3 badges" },
    3: { percent: 84, title: "Reliable Crew Support", meta: "Level 3 contributor · 31 credits · 5 badges" },
    4: { percent: 96, title: "Quest Party Lead", meta: "Level 4 contributor · 52 credits · 8 badges" }
  };
  const state = readinessByLevel[level];
  if (experienceValue) experienceValue.textContent = `Level ${level}`;
  if (levelPercent) levelPercent.textContent = `${state.percent}%`;
  if (levelBar) levelBar.style.width = `${state.percent}%`;
  if (playerMeta) playerMeta.textContent = state.meta;
  if (playerTitle) playerTitle.textContent = state.title;
}

function renderQuests() {
  updatePlayerProgress();
  const list = filteredQuests();
  questGrid.innerHTML = "";

  if (!list.length) {
    questGrid.innerHTML = '<div class="detail-box"><h3>No matches yet</h3><p>Try another skill focus or reward type.</p></div>';
    return;
  }

  list.forEach((quest, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `quest-card${index === 0 ? " active" : ""}`;
    card.innerHTML = `
      <div>
        <div class="quest-meta">
          <span>${quest.duration}</span>
          <span>Level ${quest.level}</span>
        </div>
        <h3>${quest.title}</h3>
      </div>
      <p>${quest.summary}</p>
      <div class="card-footer">
        <span>${quest.rewards.join(" + ")}</span>
        <span class="match-score">${quest.score}% fit</span>
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
  questDetail.innerHTML = `
    <p class="eyebrow">Selected quest</p>
    <h3>${quest.title}</h3>
    <p>${quest.summary}</p>
    <div class="tag-row">${quest.rewards.map((reward) => `<span>${reward}</span>`).join("")}</div>
    <ul>
      ${quest.proof.map((item) => `<li>${item}</li>`).join("")}
    </ul>
    <p><strong>Why this match works:</strong> ${quest.source}.</p>
  `;
}

function renderResearch() {
  researchGrid.innerHTML = research.map((platform) => `
    <article class="platform-card">
      <div>
        <p class="eyebrow">${platform.focus}</p>
        <h3>${platform.name}</h3>
      </div>
      <p><strong>What works:</strong> ${platform.lesson}</p>
      <p><strong>Quest Board move:</strong> ${platform.quest}</p>
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
        <p>${person.role} · ${person.rate}</p>
      </div>
      <div class="tag-row">${person.signals.map((signal) => `<span>${signal}</span>`).join("")}</div>
      <p>${person.note}</p>
      <button type="button">Shortlist</button>
    </article>
  `).join("");
}

function renderTimeline() {
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
    document.getElementById(button.dataset.openPanel).classList.add("open");
    document.querySelector(".scrim").classList.add("open");
  });
});

document.querySelectorAll("[data-close-panel]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".side-panel").classList.remove("open");
    document.querySelector(".scrim").classList.remove("open");
  });
});

matcher.addEventListener("input", renderQuests);
updatePlayerProgress();
renderQuests();
renderResearch();
renderTimeline();
renderApplicants();
