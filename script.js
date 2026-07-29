const quests = [
  {
    title: "Power Runner",
    skill: "energy",
    level: 2,
    rewards: ["credits", "badge"],
    duration: "Event day",
    score: 96,
    summary: "Monitor batteries, solar microgrid connections, cable safety, and stage power during the event.",
    proof: ["Battery status photos", "Energy notes in Captain's Log", "Post-event carbon offset summary"],
    source: "Fast role matching plus milestone tracking"
  },
  {
    title: "Cloud Support Guide",
    skill: "community",
    level: 1,
    rewards: ["credits", "badge"],
    duration: "Remote",
    score: 88,
    summary: "Help vendors and participants navigate the event map, schedule, and support questions from off-site.",
    proof: ["Support log", "Resolved request count", "Escalation notes"],
    source: "Guided recommendations adapted for community navigation"
  },
  {
    title: "Green Build Crew",
    skill: "logistics",
    level: 2,
    rewards: ["credits", "stipend", "badge"],
    duration: "Prep + event",
    score: 91,
    summary: "Set up garden build materials, confirm tools, and coordinate role handoffs across the build party.",
    proof: ["Setup checklist", "Team handoff notes", "Completion photos"],
    source: "Skill packaging transformed into clear quest scopes"
  },
  {
    title: "Story Capture Lead",
    skill: "media",
    level: 3,
    rewards: ["credits", "badge"],
    duration: "Event + post",
    score: 83,
    summary: "Collect photos, short interviews, and proof of completed work for the event recap and player cards.",
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
    title: "Site Safety Scout",
    skill: "logistics",
    level: 2,
    rewards: ["credits", "badge"],
    duration: "Event day",
    score: 86,
    summary: "Walk the site map, check trip hazards, flag equipment issues, and document safety fixes.",
    proof: ["Safety checklist", "Before and after photos", "Issue resolution notes"],
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
    focus: "Power, operations, cloud",
    lesson: "The MVP depends on three clear character roles with different responsibilities.",
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

function renderQuests() {
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
    <p><strong>Research pattern:</strong> ${quest.source}.</p>
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
renderQuests();
renderResearch();
renderTimeline();
