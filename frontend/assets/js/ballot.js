/* =========================================================
   SmartCampus Election - Ballot JS (FIXED)
   Works with:
   - ballot.html
   - review-ballot.html
   - vote-success.html

   FIX SUMMARY:
   1. localStorage keys are scoped per-student-ID to prevent
      cross-user vote state contamination.
   2. Vote status is verified from the backend on page load.
      localStorage is only a local cache — not the source of truth.
   3. Stale/mismatched localStorage is auto-cleared when a
      different student logs in.
   4. submitFinalVote() calls the backend API. localStorage is
      only updated AFTER a confirmed successful DB save.
   5. Defensive guards for undefined user, null state, bad tokens.
========================================================= */

let ballotCandidates = [];
let ballotPositions = [];

document.addEventListener("DOMContentLoaded", () => {
  // Sanitize stale localStorage before any page logic runs
  sanitizeVoteStorage();

  setupBallotPage();
  setupReviewBallotPage();
  setupVoteSuccessPage();
});

/* =========================================================
   Storage Key Helpers (per-student scoping)
   Keys include the logged-in user's ID so different students
   on the same browser never share vote state.
========================================================= */

function getStudentId() {
  try {
    const raw = localStorage.getItem("smartcampus_auth_user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    // Accept _id or id — whichever field the backend returns
    return String(user._id || user.id || "").trim() || null;
  } catch (e) {
    return null;
  }
}

function getBallotSelectionsKey() {
  const sid = getStudentId();
  return sid
    ? `smartcampus_ballot_selections_${sid}`
    : "smartcampus_ballot_selections";
}

function getVoteSubmittedKey() {
  const sid = getStudentId();
  return sid
    ? `smartcampus_vote_submitted_${sid}`
    : "smartcampus_vote_submitted";
}

function getVoteTimestampKey() {
  const sid = getStudentId();
  return sid
    ? `smartcampus_vote_timestamp_${sid}`
    : "smartcampus_vote_timestamp";
}

/* =========================================================
   Sanitize stale / cross-user vote storage on every page load.
   Clears the OLD global (non-scoped) keys so they can never
   falsely lock out any student.
========================================================= */

function sanitizeVoteStorage() {
  // Always remove the old non-scoped global keys — they are
  // the root cause of false "already voted" on fresh logins.
  localStorage.removeItem("smartcampus_vote_submitted");
  localStorage.removeItem("smartcampus_vote_timestamp");
  localStorage.removeItem("smartcampus_ballot_selections");
}

/* =========================================================
   Main Ballot Page
========================================================= */

async function setupBallotPage() {
  const ballotContent = document.getElementById("ballotContent");
  if (!ballotContent) return;

  // Show a loading placeholder while we verify with the server
  ballotContent.innerHTML = `
    <article class="card" style="text-align: center; padding: 3rem;">
      <div class="loader"></div>
      <p style="margin-top: 1rem;" class="muted">Loading ballot data...</p>
    </article>
  `;

  try {
    const [candidatesRes, positionsRes, hasVoted] = await Promise.all([
      fetch(`${API_BASE_URL}/candidates`),
      fetch(`${API_BASE_URL}/positions`),
      checkVoteStatusFromServer().catch(() => hasVoteSubmittedLocally())
    ]);

    if (!candidatesRes.ok || !positionsRes.ok) throw new Error("Failed to fetch ballot data");

    const candidatesData = await candidatesRes.json();
    const positionsData = await positionsRes.json();

    ballotCandidates = candidatesData.candidates || [];
    ballotPositions = positionsData.positions || [];

    if (hasVoted) {
      renderSubmittedNotice(ballotContent);
    } else {
      clearLocalVoteSubmittedFlag();
      renderBallotContent();
      setupBallotEvents();
    }
    updateLiveSelectionSummary();
  } catch (error) {
    console.error("Ballot loading error:", error);
    ballotContent.innerHTML = `
      <article class="card" style="border: 2px solid var(--secondary-red);">
        <h3 style="color: var(--secondary-red);">Error Loading Ballot</h3>
        <p>There was a problem loading the candidates. Please try again.</p>
        <button onclick="window.location.reload()" class="btn btn-outline">Retry</button>
      </article>
    `;
    updateLiveSelectionSummary();
  }
}

/* =========================================================
   Check vote status against the backend (source of truth).
   Returns a Promise<boolean>.
========================================================= */

async function checkVoteStatusFromServer() {
  const token = localStorage.getItem("smartcampus_auth_token");

  if (!token) {
    // Not logged in — don't treat as voted
    return false;
  }

  // Use the shared apiRequest helper from api.js (loaded before ballot.js)
  // It automatically injects the Authorization header.
  const data = await apiRequest("/student/vote-status", { method: "GET" });

  if (data.hasVoted === true) {
    // Sync local cache so future offline reads stay correct
    localStorage.setItem(getVoteSubmittedKey(), "true");
  }

  return data.hasVoted === true;
}

/* =========================================================
   Local vote-submitted helpers (scoped per student)
========================================================= */

function hasVoteSubmittedLocally() {
  return localStorage.getItem(getVoteSubmittedKey()) === "true";
}

function clearLocalVoteSubmittedFlag() {
  localStorage.removeItem(getVoteSubmittedKey());
  localStorage.removeItem(getVoteTimestampKey());
}

/* =========================================================
   Render Ballot Content
========================================================= */

function renderBallotContent() {
  const ballotContent = document.getElementById("ballotContent");
  if (!ballotContent) return;

  const positionsList = getBallotPositions();
  const selections = getBallotSelections();

  if (!positionsList.length) {
    ballotContent.innerHTML = `
      <article class="card">
        <h3>No Positions Available</h3>
        <p>No election positions are available right now.</p>
      </article>
    `;
    return;
  }

  ballotContent.innerHTML = positionsList
    .map((position, index) => {
      const positionTitle = getPositionTitle(position);
      const candidatesForPosition = getCandidatesForPosition(positionTitle);

      return `
        <section class="ballot-position-section card">
          <div class="ballot-position-head">
            <div>
              <span class="badge badge-gold">Position ${index + 1}</span>
              <h3>${escapeHtml(positionTitle)}</h3>
              <p class="muted">
                Select one candidate for this position.
              </p>
            </div>
          </div>

          ${
            candidatesForPosition.length
              ? `
                <div class="ballot-candidate-grid">
                  ${candidatesForPosition
                    .map((candidate) => {
                      const candidateId = getCandidateId(candidate);
                      const candidateName = getCandidateName(candidate);
                      const candidateManifesto =
                        candidate.manifesto ||
                        candidate.shortBio ||
                        "No manifesto preview available.";

                      const isChecked =
                        String(selections[positionTitle] || "") ===
                        String(candidateId);

                      return `
                        <label class="ballot-candidate-card modern-card ${isChecked ? "selected" : ""}">
                          <input
                            type="radio"
                            name="position-${index}"
                            value="${escapeHtml(candidateId)}"
                            data-position="${escapeHtml(positionTitle)}"
                            data-candidate-id="${escapeHtml(candidateId)}"
                            ${isChecked ? "checked" : ""}
                          />

                          <div class="ballot-card-body">
                            <div class="candidate-card-top">
                              <div class="avatar avatar-lg candidate-avatar">
                                <img src="${getAvatarUrl(candidate)}" alt="${escapeHtml(candidateName)}'s avatar" loading="lazy" />
                              </div>

                              <div>
                                <span class="badge badge-success">
                                  ${escapeHtml(positionTitle)}
                                </span>
                                <h4>${escapeHtml(candidateName)}</h4>
                              </div>
                            </div>

                            <div class="candidate-card-meta">
                              <span>
                                <strong>Department:</strong>
                                ${escapeHtml(candidate.department || "Not specified")}
                              </span>

                              <span>
                                <strong>Session:</strong>
                                ${escapeHtml(candidate.session || "Not specified")}
                              </span>
                            </div>

                            <p class="candidate-card-manifesto">
                              ${escapeHtml(truncateText(candidateManifesto, 130))}
                            </p>

                            <div class="option-actions">
                              <a
                                href="student-candidate-profile.html?id=${encodeURIComponent(candidateId)}"
                                class="btn btn-sm btn-outline"
                                onclick="event.stopPropagation();"
                              >
                                View Profile
                              </a>

                              <button
                                type="button"
                                class="btn btn-sm btn-secondary ballot-manifesto-btn"
                                data-candidate-id="${escapeHtml(candidateId)}"
                              >
                                View Manifesto
                              </button>
                            </div>
                          </div>
                        </label>
                      `;
                    })
                    .join("")}
                </div>
              `
              : `
                <div class="empty-state-mini">
                  <p>No approved candidates found for this position.</p>
                </div>
              `
          }
        </section>
      `;
    })
    .join("");

  setupManifestoButtons();
}

function setupBallotEvents() {
  document.querySelectorAll('input[type="radio"][data-position]').forEach((input) => {
    input.addEventListener("change", () => {
      const positionTitle = input.dataset.position;
      const candidateId = input.dataset.candidateId;

      const selections = getBallotSelections();
      selections[positionTitle] = candidateId;

      saveBallotSelections(selections);
      refreshCandidateCardSelectionStyles();
      updateLiveSelectionSummary();
    });
  });

  const reviewButtons = [
    document.getElementById("reviewBallotBtn"),
    document.getElementById("proceedToReviewBtn"),
    document.getElementById("ballotReviewBtn")
  ].filter(Boolean);

  reviewButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      goToReviewBallot();
    });
  });

  const ballotForm = document.getElementById("ballotForm");

  if (ballotForm) {
    ballotForm.addEventListener("submit", (event) => {
      event.preventDefault();
      goToReviewBallot();
    });
  }
}

function refreshCandidateCardSelectionStyles() {
  document.querySelectorAll(".ballot-candidate-card").forEach((card) => {
    const input = card.querySelector('input[type="radio"]');

    if (input && input.checked) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });
}

function goToReviewBallot() {
  // Check local cache first for speed; server is re-checked on review page load
  if (hasVoteSubmittedLocally()) {
    showModalMessage(
      "Vote Already Submitted",
      "Your vote has already been submitted and cannot be edited."
    );
    return;
  }

  const positionsList = getBallotPositions();
  const selections = getBallotSelections();

  const missingPositions = positionsList.filter((position) => {
    const title = getPositionTitle(position);
    return !selections[title];
  });

  if (missingPositions.length) {
    showModalMessage(
      "Complete Your Ballot",
      "Please select one candidate for every available position before reviewing your ballot."
    );
    return;
  }

  window.location.href = "review-ballot.html";
}

/* =========================================================
   Manifesto Modal
========================================================= */

function setupManifestoButtons() {
  document.querySelectorAll(".ballot-manifesto-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const candidateId = button.dataset.candidateId;
      const candidate = getCandidateById(candidateId);

      if (!candidate) {
        showModalMessage("Candidate Not Found", "Candidate information could not be loaded.");
        return;
      }

      const candidateName = getCandidateName(candidate);
      const manifesto =
        candidate.manifesto ||
        candidate.shortBio ||
        "No manifesto has been added for this candidate.";

      const goals = getCandidateGoals(candidate);

      showModalMessage(
        `${escapeHtml(candidateName)} Manifesto`,
        `
          <p>${escapeHtml(manifesto)}</p>

          <h3>Campaign Goals</h3>

          <ul class="styled-list">
            ${goals.map((goal) => `<li>${escapeHtml(goal)}</li>`).join("")}
          </ul>
        `
      );
    });
  });
}

/* =========================================================
   Live Selection Summary
========================================================= */

function updateLiveSelectionSummary() {
  const summaryContainers = [
    document.getElementById("selectionSummary"),
    document.getElementById("liveSelectionSummary"),
    document.getElementById("ballotSelectionSummary"),
    document.getElementById("selectedCandidatesSummary"),
    document.querySelector("[data-selection-summary]")
  ].filter(Boolean);

  if (!summaryContainers.length) return;

  const selections = getBallotSelections();
  const positionsList = getBallotPositions();

  const selectedCount = Object.keys(selections).length;
  const totalCount = positionsList.length;

  const summaryHtml = `
    <div class="selection-summary-box">
      <div class="selection-summary-head">
        <h3>Live Selection Summary</h3>
        <span class="badge badge-gold">${selectedCount}/${totalCount} Selected</span>
      </div>

      ${
        totalCount
          ? positionsList
              .map((position) => {
                const positionTitle = getPositionTitle(position);
                const candidateId = selections[positionTitle];
                const candidate = candidateId ? getCandidateById(candidateId) : null;

                return `
                  <div class="selection-summary-row">
                    <span>${escapeHtml(positionTitle)}</span>
                    <strong>
                      ${
                        candidate
                          ? escapeHtml(getCandidateName(candidate))
                          : "Not selected yet"
                      }
                    </strong>
                  </div>
                `;
              })
              .join("")
          : `<p class="muted">No positions available.</p>`
      }
    </div>
  `;

  summaryContainers.forEach((container) => {
    container.innerHTML = summaryHtml;
  });
}

/* =========================================================
   Review Ballot Page
========================================================= */

async function setupReviewBallotPage() {
  const reviewContainer =
    document.getElementById("reviewBallotContent") ||
    document.getElementById("reviewBallotList") ||
    document.getElementById("reviewContent") ||
    document.getElementById("reviewBallotSummary");

  if (!reviewContainer) return;

  // Show loading while checking server
  reviewContainer.innerHTML = `
    <article class="card" style="text-align: center; padding: 3rem;">
      <div class="loader"></div>
      <p style="margin-top: 1rem;" class="muted">Loading ballot review...</p>
    </article>
  `;

  try {
    const [candidatesRes, positionsRes, hasVoted] = await Promise.all([
      fetch(`${API_BASE_URL}/candidates`),
      fetch(`${API_BASE_URL}/positions`),
      checkVoteStatusFromServer().catch(() => hasVoteSubmittedLocally())
    ]);

    if (!candidatesRes.ok || !positionsRes.ok) throw new Error("Failed to fetch ballot data");

    const candidatesData = await candidatesRes.json();
    const positionsData = await positionsRes.json();

    ballotCandidates = candidatesData.candidates || [];
    ballotPositions = positionsData.positions || [];

    if (hasVoted) {
      renderReviewSubmittedNotice(reviewContainer);
    } else {
      clearLocalVoteSubmittedFlag();
      renderReviewBallot(reviewContainer);
      setupReviewActions();
    }
  } catch (error) {
    console.error("Review loading error:", error);
    reviewContainer.innerHTML = `
      <article class="card" style="border: 2px solid var(--secondary-red);">
        <h3 style="color: var(--secondary-red);">Error Loading Review</h3>
        <p>There was a problem loading the candidates. Please try again.</p>
        <button onclick="window.location.reload()" class="btn btn-outline">Retry</button>
      </article>
    `;
  }
}

function renderReviewSubmittedNotice(reviewContainer) {
  // Hide panel head if present
  const panel = reviewContainer.closest('.review-summary-panel');
  if (panel) {
    const head = panel.querySelector('.panel-head');
    if (head) head.style.display = 'none';
  }

  reviewContainer.innerHTML = `
    <article class="card vote-lock-card">
      <span class="badge badge-success">Submitted</span>
      <h2>You have already submitted your vote.</h2>
      <p>You cannot edit your ballot or submit another vote.</p>
      <div style="margin-top: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">
        <a href="student-dashboard.html" class="btn btn-primary">Go to Dashboard</a>
        <a href="results.html" class="btn btn-outline">View Results</a>
      </div>
    </article>
  `;

  // Hide the other panels
  const warningPanel = document.querySelector(".final-warning-panel");
  if (warningPanel) warningPanel.style.display = "none";

  const confirmPanel = document.querySelector(".confirm-submit-panel");
  if (confirmPanel) confirmPanel.style.display = "none";

  const guidanceSidebar = document.querySelector(".review-guidance-card");
  if (guidanceSidebar) guidanceSidebar.style.display = "none";
}

function renderReviewBallot(reviewContainer) {
  const selections = getBallotSelections();
  const positionsList = getBallotPositions();

  if (!Object.keys(selections).length) {
    reviewContainer.innerHTML = `
      <article class="card">
        <h2>No Ballot Selection Found</h2>
        <p>Please select your candidates before reviewing your ballot.</p>
        <a href="ballot.html" class="btn btn-primary">Go to Ballot</a>
      </article>
    `;
    return;
  }

  reviewContainer.innerHTML = `
    <article class="card review-warning-card">
      <span class="badge badge-danger">Final Review</span>
      <h2>Please review carefully</h2>
      <p>
        Votes cannot be edited after final confirmation.
        Make sure every selected candidate is correct before submitting.
      </p>
    </article>

    <div class="review-ballot-list">
      ${positionsList
        .map((position) => {
          const positionTitle = getPositionTitle(position);
          const candidateId = selections[positionTitle];
          const candidate = candidateId ? getCandidateById(candidateId) : null;

          return `
            <article class="card review-candidate-card">
              <span class="badge badge-gold">${escapeHtml(positionTitle)}</span>

              ${
                candidate
                  ? `
                    <h3>${escapeHtml(getCandidateName(candidate))}</h3>
                    <p><strong>Department:</strong> ${escapeHtml(candidate.department || "Not specified")}</p>
                    <p><strong>Session:</strong> ${escapeHtml(candidate.session || "Not specified")}</p>
                    <p>${escapeHtml(truncateText(candidate.manifesto || candidate.shortBio || "", 160))}</p>
                  `
                  : `
                    <h3>No candidate selected</h3>
                    <p class="muted">Please go back and select a candidate for this position.</p>
                  `
              }
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function setupReviewActions() {
  const editButtons = [
    document.getElementById("editBallotBtn"),
    document.getElementById("backToBallotBtn")
  ].filter(Boolean);

  editButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "ballot.html";
    });
  });

  const confirmButtons = [
    document.getElementById("confirmVoteBtn"),
    document.getElementById("submitVoteBtn"),
    document.getElementById("finalSubmitBtn"),
    document.getElementById("confirmSubmissionBtn")
  ].filter(Boolean);

  confirmButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      submitFinalVote(button);
    });
  });

  const reviewForm = document.getElementById("reviewBallotForm");

  if (reviewForm) {
    reviewForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitFinalVote(null);
    });
  }
}

/* =========================================================
   Submit Final Vote — calls backend API.
   localStorage is ONLY updated after a confirmed DB save.
========================================================= */

async function submitFinalVote(buttonEl) {
  // Guard: prevent double-submit
  if (hasVoteSubmittedLocally()) {
    showModalMessage(
      "Vote Already Submitted",
      "Your vote has already been submitted."
    );
    return;
  }

  const selections = getBallotSelections();

  if (!Object.keys(selections).length) {
    showModalMessage(
      "No Ballot Found",
      "Please select your candidates before submitting."
    );
    return;
  }

  const token = localStorage.getItem("smartcampus_auth_token");

  if (!token) {
    showModalMessage(
      "Not Logged In",
      "Your session has expired. Please log in again."
    );
    return;
  }

  // Disable the button while submitting to prevent double clicks
  if (buttonEl) {
    buttonEl.disabled = true;
    buttonEl.textContent = "Submitting…";
  }

  try {
    // Build the votes array — include candidateName so the backend
    // can store a readable snapshot even for mock-data candidates.
    const votes = Object.entries(selections).map(([position, candidateId]) => {
      const candidate = getCandidateById(candidateId);
      return {
        candidateId,
        candidateName: candidate ? getCandidateName(candidate) : "",
        position
      };
    });

    // Use shared apiRequest from api.js — handles auth token + base URL automatically.
    const data = await apiRequest("/student/vote", {
      method: "POST",
      body: { votes }
    });

    if (data.success) {
      // ✅ ONLY after a confirmed backend save do we write to localStorage
      localStorage.setItem(getVoteSubmittedKey(), "true");
      localStorage.setItem(getVoteTimestampKey(), new Date().toISOString());

      // Clear temporary selections
      localStorage.removeItem(getBallotSelectionsKey());

      showModalMessage(
        "Vote Submitted",
        "Your vote has been submitted successfully. Redirecting to confirmation page…"
      );

      setTimeout(() => {
        window.location.href = "vote-success.html";
      }, 900);
    } else {
      if (buttonEl) {
        buttonEl.disabled = false;
        buttonEl.textContent = "Confirm Submission";
      }

      showModalMessage(
        "Submission Failed",
        data.message || "Could not submit your vote. Please try again."
      );
    }
  } catch (err) {
    // apiRequest throws on non-2xx — check if it's an "already voted" case
    const errMsg = String(err.message || "");

    if (errMsg.toLowerCase().includes("already")) {
      // Backend confirmed already voted — sync local cache
      localStorage.setItem(getVoteSubmittedKey(), "true");

      showModalMessage(
        "Already Voted",
        "You have already submitted your vote."
      );

      if (buttonEl) {
        buttonEl.disabled = true;
        buttonEl.style.display = "none";
      }

      // Also clear selections since they already voted
      localStorage.removeItem(getBallotSelectionsKey());

      const reviewContainer = document.getElementById("reviewBallotSummary");
      if (reviewContainer) renderReviewSubmittedNotice(reviewContainer);

    } else {
      if (buttonEl) {
        buttonEl.disabled = false;
        buttonEl.textContent = "Confirm Submission";
      }

      showModalMessage(
        "Submission Failed",
        errMsg || "Could not reach the server. Please check your connection and try again."
      );
    }
  }
}

/* =========================================================
   Vote Success Page
========================================================= */

function setupVoteSuccessPage() {
  const timestamp =
    localStorage.getItem(getVoteTimestampKey()) ||
    new Date().toISOString();

  const formatted = formatDateTime(timestamp);

  const timestampElements = [
    document.getElementById("voteTimestamp"),
    document.getElementById("voteTime"),
    document.getElementById("submissionTime")
  ].filter(Boolean);

  timestampElements.forEach((element) => {
    element.textContent = formatted;
  });
}

/* =========================================================
   Submitted Notice (ballot.html locked state)
========================================================= */

function renderSubmittedNotice(container) {
  container.innerHTML = `
    <article class="card vote-lock-card">
      <span class="badge badge-success">Vote Submitted</span>
      <h2>You have already submitted your vote.</h2>
      <p>
        For election integrity, your ballot cannot be edited after final confirmation.
      </p>
      <div style="margin-top: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">
        <a href="student-dashboard.html" class="btn btn-primary">Go to Dashboard</a>
        <a href="results.html" class="btn btn-outline">View Results</a>
      </div>
    </article>
  `;
}

/* =========================================================
   Data Helpers — Ballot Selections (per-student scoped)
========================================================= */

function getBallotSelections() {
  try {
    const saved = localStorage.getItem(getBallotSelectionsKey());
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    return {};
  }
}

function saveBallotSelections(selections) {
  localStorage.setItem(getBallotSelectionsKey(), JSON.stringify(selections));
}

function getBallotPositions() {
  if (ballotPositions && ballotPositions.length) {
    return ballotPositions;
  }

  if (ballotCandidates && ballotCandidates.length) {
    const uniquePositions = [
      ...new Set(ballotCandidates.map((candidate) => getCandidatePosition(candidate)).filter(Boolean))
    ];

    return uniquePositions.map((title, index) => ({
      id: index + 1,
      title
    }));
  }

  return [];
}

function getCandidatesForPosition(positionTitle) {
  if (!ballotCandidates || !ballotCandidates.length) {
    return [];
  }

  return ballotCandidates.filter((candidate) => {
    const candidatePosition = getCandidatePosition(candidate);
    const status = String(candidate.status || "Approved").toLowerCase();

    const isSamePosition = candidatePosition === positionTitle;
    const isNotRejected = status !== "rejected";

    return isSamePosition && isNotRejected;
  });
}

function getPositionTitle(position) {
  return position.title || position.name || position.position || "Untitled Position";
}

function getCandidatePosition(candidate) {
  return candidate.position || candidate.desiredPosition || "";
}

function getCandidateId(candidate) {
  return candidate.id || candidate._id;
}

function getCandidateById(candidateId) {
  if (!ballotCandidates || !ballotCandidates.length) {
    return null;
  }

  return ballotCandidates.find((candidate) => {
    return String(getCandidateId(candidate)) === String(candidateId);
  });
}

function getCandidateName(candidate) {
  return candidate.name || candidate.fullName || "Unnamed Candidate";
}

function getCandidateGoals(candidate) {
  if (Array.isArray(candidate.goals)) {
    return candidate.goals;
  }

  if (typeof candidate.goals === "string") {
    return candidate.goals
      .split(",")
      .map((goal) => goal.trim())
      .filter(Boolean);
  }

  if (typeof candidate.achievements === "string") {
    return candidate.achievements
      .split(",")
      .map((goal) => goal.trim())
      .filter(Boolean);
  }

  return ["Support students and improve campus leadership."];
}

/* =========================================================
   UI Helpers
========================================================= */

function showModalMessage(title, content) {
  if (typeof openModal === "function") {
    openModal(`
      <h2>${title}</h2>
      ${
        String(content).includes("<")
          ? content
          : `<p>${content}</p>`
      }
    `);
  } else {
    alert(`${title}\n${stripHtml(content)}`);
  }
}

function getAvatarUrl(candidate) {
  let url = candidate.avatarUrl || candidate.avatar;
  if (url) {
    // Convert relative urls if they do not start with http
    if (!url.startsWith('http')) {
      const baseUrl = API_BASE_URL.replace('/api', '');
      url = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
    }
    return url;
  }
  const name = getCandidateName(candidate);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=146b3a&color=fff&size=150&rounded=true&font-size=0.4&bold=true`;
}

function getInitials(name) {
  return String(name || "ST")
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function truncateText(text, maxLength) {
  const cleanText = String(text || "");

  if (cleanText.length <= maxLength) return cleanText;

  return `${cleanText.slice(0, maxLength).trim()}...`;
}

function formatDateTime(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, "");
}