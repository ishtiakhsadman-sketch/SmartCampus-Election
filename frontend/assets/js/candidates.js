/* =========================================================
   SmartCampus Election - Candidates JS
   Works for:
   - Public candidates.html
   - Public candidate-profile.html
   - Student student-candidates.html
   - Student student-candidate-profile.html
========================================================= */
// Keep a global reference for filtering
let globalCandidates = [];
let globalPositions = [];

document.addEventListener("DOMContentLoaded", () => {
  setupCandidatePage();
  // renderCandidateProfile handles its own fetch if needed, but we'll adapt it.
});

/* -----------------------------
   Candidate Directory
----------------------------- */

async function setupCandidatePage() {
  const candidateList = document.getElementById("candidateList");
  const searchInput = document.getElementById("candidateSearch");
  const positionFilter = document.getElementById("positionFilter");
  const sortSelect = document.getElementById("sortCandidates");
  const clearFiltersBtn = document.getElementById("clearCandidateFilters");

  if (!candidateList) {
    // If not candidate list page, it might be profile page
    renderCandidateProfile();
    return;
  }

  // 1. Show loading state
  candidateList.innerHTML = `
    <article class="card" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
      <div class="loader"></div>
      <p style="margin-top: 1rem;" class="muted">Loading candidates...</p>
    </article>
  `;

  try {
    // 2. Fetch data concurrently
    const [candidatesRes, positionsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/candidates`),
      fetch(`${API_BASE_URL}/positions`)
    ]);

    if (!candidatesRes.ok || !positionsRes.ok) throw new Error("Failed to fetch data");

    const candidatesData = await candidatesRes.json();
    const positionsData = await positionsRes.json();

    globalCandidates = candidatesData.candidates || [];
    globalPositions = positionsData.positions || [];

    // 3. Populate filters and render
    populatePositionFilter(globalPositions);

    const params = new URLSearchParams(window.location.search);
    const selectedPositionFromURL = params.get("position");

    if (selectedPositionFromURL && positionFilter) {
      positionFilter.value = selectedPositionFromURL;
    }

    renderCandidateCards(getFilteredCandidates());

    // 4. Setup listeners
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        renderCandidateCards(getFilteredCandidates());
      });
    }

    if (positionFilter) {
      positionFilter.addEventListener("change", () => {
        renderCandidateCards(getFilteredCandidates());
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        renderCandidateCards(getFilteredCandidates());
      });
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (positionFilter) positionFilter.value = "all";
        if (sortSelect) sortSelect.value = "name-asc";

        renderCandidateCards(getFilteredCandidates());
      });
    }

  } catch (error) {
    console.error("Error loading candidates:", error);
    candidateList.innerHTML = `
      <article class="card candidate-empty-state" style="grid-column: 1 / -1; border: 2px solid var(--secondary-red);">
        <div class="empty-icon" style="color: var(--secondary-red);">⚠</div>
        <h3>Failed to Load Data</h3>
        <p>There was a problem fetching the candidate list. Please try again later.</p>
        <button type="button" class="btn btn-outline" onclick="window.location.reload()">Retry</button>
      </article>
    `;
  }
}

function populatePositionFilter(positionsList) {
  const positionFilter = document.getElementById("positionFilter");
  if (!positionFilter) return;

  positionFilter.innerHTML = `<option value="all">All Positions</option>`;

  // Use positions from DB if available, otherwise derive from candidates
  let positions = positionsList || [];
  if (!positions.length && globalCandidates.length) {
    const seen = new Set();
    globalCandidates.forEach(c => {
      const p = c.desiredPosition || c.position;
      if (p && !seen.has(p)) { seen.add(p); positions.push({ title: p }); }
    });
  }

  positions.forEach((position) => {
    const option = document.createElement("option");
    option.value = position.title;
    option.textContent = position.title;
    positionFilter.appendChild(option);
  });
}

function getFilteredCandidates() {
  if (!globalCandidates) return [];

  let filtered = [...globalCandidates];

  const searchInput = document.getElementById("candidateSearch");
  const positionFilter = document.getElementById("positionFilter");
  const sortSelect = document.getElementById("sortCandidates");

  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const selectedPosition = positionFilter ? positionFilter.value : "all";
  const selectedSort = sortSelect ? sortSelect.value : "name-asc";

  if (searchTerm) {
    filtered = filtered.filter((candidate) => {
      const name = getCandidateName(candidate).toLowerCase();
      const department = String(candidate.department || "").toLowerCase();
      const position = String(candidate.desiredPosition || candidate.position || "").toLowerCase();
      const session = String(candidate.session || "").toLowerCase();

      return (
        name.includes(searchTerm) ||
        department.includes(searchTerm) ||
        position.includes(searchTerm) ||
        session.includes(searchTerm)
      );
    });
  }

  if (selectedPosition !== "all") {
    filtered = filtered.filter((candidate) => {
      const pos = candidate.desiredPosition || candidate.position || "";
      return pos === selectedPosition;
    });
  }

  filtered.sort((a, b) => {
    switch (selectedSort) {
      case "name-desc":
        return getCandidateName(b).localeCompare(getCandidateName(a));

      case "department-asc":
        return String(a.department || "").localeCompare(String(b.department || ""));

      case "position-asc":
        return String(a.desiredPosition || a.position || "").localeCompare(String(b.desiredPosition || b.position || ""));

      case "name-asc":
      default:
        return getCandidateName(a).localeCompare(getCandidateName(b));
    }
  });

  return filtered;
}

function renderCandidateCards(candidateArray) {
  const candidateList = document.getElementById("candidateList");
  const resultCount = document.getElementById("candidateResultCount");

  if (!candidateList) return;

  if (resultCount) {
    resultCount.textContent = `Showing ${candidateArray.length} candidate${candidateArray.length === 1 ? "" : "s"}`;
  }

  if (!candidateArray.length) {
    candidateList.innerHTML = `
      <article class="card candidate-empty-state">
        <div class="empty-icon">🔎</div>
        <h3>No Candidates Found</h3>
        <p>
          No candidate matches your current search or filter.
          Try clearing filters or searching with a different keyword.
        </p>
        <button type="button" class="btn btn-primary" onclick="resetCandidateFiltersFromEmptyState()">
          Reset Filters
        </button>
      </article>
    `;
    return;
  }

  candidateList.innerHTML = candidateArray
    .map((candidate) => buildCandidateCard(candidate))
    .join("");
}

function buildCandidateCard(candidate) {
  const candidateId = getCandidateId(candidate);
  const candidateName = getCandidateName(candidate);
  const position = candidate.desiredPosition || candidate.position || "Candidate";
  const manifesto = candidate.manifesto || candidate.shortBio || "No manifesto preview available.";
  const firstGoal = getCandidateGoals(candidate)[0] || "Student representation";

  return `
    <article class="card candidate-card-modern modern-card fade-in">
      <div class="candidate-card-top">
        <div class="avatar avatar-lg candidate-avatar">
          <img src="${getAvatarUrl(candidate)}" alt="${escapeHtml(candidateName)}'s avatar" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(candidateName)}&background=146b3a&color=fff&size=150';" loading="lazy" />
        </div>

        <div>
          <span class="badge badge-gold candidate-position-badge">${escapeHtml(position)}</span>
          <h3 class="candidate-card-title">${escapeHtml(candidateName)}</h3>
        </div>
      </div>

      <div class="candidate-card-meta">
        <span><strong>Department:</strong> ${escapeHtml(candidate.department || "Not specified")}</span>
        <span><strong>Session:</strong> ${escapeHtml(candidate.session || "Not specified")}</span>
      </div>

      <p class="candidate-card-manifesto">
        ${truncateText(manifesto, 135)}
      </p>

      <div class="candidate-card-highlight">
        <strong>Campaign Focus</strong>
        <span>${firstGoal}</span>
      </div>

      <div class="candidate-card-actions">
        <a href="${getCandidateProfileUrl(candidateId)}" class="btn btn-outline">View Profile</a>
        <a href="${getVoteUrl()}" class="btn btn-outline">${getVoteButtonText()}</a>
      </div>
    </article>
  `;
}

window.resetCandidateFiltersFromEmptyState = function () {
  const searchInput = document.getElementById("candidateSearch");
  const positionFilter = document.getElementById("positionFilter");
  const sortSelect = document.getElementById("sortCandidates");

  if (searchInput) searchInput.value = "";
  if (positionFilter) positionFilter.value = "all";
  if (sortSelect) sortSelect.value = "name-asc";

  renderCandidateCards(getFilteredCandidates());
};

/* -----------------------------
   Candidate Profile
----------------------------- */

async function renderCandidateProfile() {
  const profileContainer = document.getElementById("candidateProfileContainer");
  if (!profileContainer) return;

  const params = new URLSearchParams(window.location.search);
  const candidateId = params.get("id");

  if (!candidateId) {
    profileContainer.innerHTML = `
      <article class="card candidate-empty-state">
        <div class="empty-icon">⚠</div>
        <h3>Invalid Candidate Link</h3>
        <p>No candidate ID provided.</p>
        <a href="${getBackToCandidatesUrl()}" class="btn btn-secondary">Back to Candidates</a>
      </article>
    `;
    return;
  }

  profileContainer.innerHTML = `
    <article class="card" style="text-align: center; padding: 3rem;">
      <div class="loader"></div>
      <p class="muted">Loading candidate profile...</p>
    </article>
  `;

  try {
    const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`);
    if (!response.ok) throw new Error("Candidate not found");

    const data = await response.json();
    const candidate = data.candidate;

    if (!candidate) {
      throw new Error("Candidate data is null");
    }

    const candidateName = getCandidateName(candidate);
    const candidateBio = candidate.bio || candidate.shortBio || "Candidate profile information is available for election review.";
    const candidateContact = getCandidateContact(candidate);
    const candidateGoals = getCandidateGoals(candidate);
    const manifesto = candidate.manifesto || "No manifesto has been added yet.";

    profileContainer.innerHTML = `
      <section class="campaign-profile fade-in">
        <article class="card campaign-profile-hero modern-card card-premium">
          <div class="avatar avatar-lg campaign-profile-photo">
            <img src="${getAvatarUrl(candidate)}" alt="${escapeHtml(candidateName)}'s profile photo" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(candidateName)}&background=146b3a&color=fff&size=150';" />
          </div>

        <div class="campaign-profile-info">
          <span class="badge badge-gold">${candidate.position || "Candidate"}</span>
          <h2>${candidateName}</h2>
          <p class="campaign-profile-bio">${candidateBio}</p>

          <div class="profile-meta-grid">
            <div class="profile-meta-pill">
              <strong>Department</strong>
              <span>${candidate.department || "Not specified"}</span>
            </div>

            <div class="profile-meta-pill">
              <strong>Session</strong>
              <span>${candidate.session || "Not specified"}</span>
            </div>

            <div class="profile-meta-pill">
              <strong>Contact</strong>
              <span>${candidateContact}</span>
            </div>
          </div>

          <div class="profile-action-row">
            <a href="${getVoteUrl()}" class="btn btn-primary">${getVoteButtonText()}</a>

            <a href="${getCandidateDirectoryUrl(candidate.position)}" class="btn btn-outline">
              Compare Same Position
            </a>

            <a href="${getBackToCandidatesUrl()}" class="btn btn-secondary">
              Back to Candidates
            </a>
          </div>
        </div>
      </article>

      <div class="campaign-profile-grid">
        <article class="card campaign-section-card manifesto-card">
          <span class="badge badge-success">Manifesto</span>
          <h3>Candidate Manifesto</h3>
          <p>${manifesto}</p>
        </article>

        <article class="card campaign-section-card">
          <span class="badge badge-gold">Campaign Goals</span>
          <h3>Key Goals</h3>

          <ul class="goal-list-upgraded">
            ${
              candidateGoals.length
                ? candidateGoals.map((goal, index) => `
                    <li class="goal-item">
                      <span>${index + 1}</span>
                      <p>${goal}</p>
                    </li>
                  `).join("")
                : `
                    <li class="goal-item">
                      <span>1</span>
                      <p>Support student leadership and fair representation.</p>
                    </li>
                  `
            }
          </ul>
        </article>

        <article class="card campaign-section-card campaign-contact-panel">
          <span class="badge badge-danger">Contact Placeholder</span>
          <h3>Campaign Communication</h3>
          <p>
            For campaign-related communication, use the sample contact:
          </p>
          <p class="candidate-contact-text">${candidateContact}</p>

          <div class="hero-actions">
            <a href="mailto:${candidateContact}" class="btn btn-outline">Email Candidate</a>
            <a href="${getVoteUrl()}" class="btn btn-primary">${getVoteButtonText()}</a>
          </div>
        </article>

        ${buildGalleryHtml(candidate.galleryPhotos)}

      </div>
    </section>
  `;
  } catch (error) {
    console.error("Error loading candidate profile:", error);
    profileContainer.innerHTML = `
      <article class="card candidate-empty-state" style="border: 2px solid var(--secondary-red);">
        <div class="empty-icon" style="color: var(--secondary-red);">⚠</div>
        <h3>Candidate Not Found</h3>
        <p>The candidate profile could not be loaded or does not exist.</p>
        <a href="${getBackToCandidatesUrl()}" class="btn btn-primary btn-modern">Back to Candidate Directory</a>
      </article>
    `;
  }
}

/* -----------------------------
   Page Routing Helpers
----------------------------- */

function getCurrentPageName() {
  return window.location.pathname.split("/").pop();
}

function isStudentCandidatePage() {
  const currentPage = getCurrentPageName();

  return (
    currentPage === "student-candidates.html" ||
    currentPage === "student-candidate-profile.html"
  );
}

function getCandidateProfileUrl(candidateId) {
  if (isStudentCandidatePage()) {
    return `student-candidate-profile.html?id=${candidateId}`;
  }

  return `candidate-profile.html?id=${candidateId}`;
}

function getBackToCandidatesUrl() {
  if (isStudentCandidatePage()) {
    return "student-candidates.html";
  }

  return "candidates.html";
}

function getCandidateDirectoryUrl(position) {
  const baseUrl = isStudentCandidatePage()
    ? "student-candidates.html"
    : "candidates.html";

  if (!position) return baseUrl;

  return `${baseUrl}?position=${encodeURIComponent(position)}`;
}

function getVoteUrl() {
  return isStudentCandidatePage() ? "ballot.html" : "login.html";
}

function getVoteButtonText() {
  return isStudentCandidatePage() ? "Vote" : "Login to Vote";
}

/* -----------------------------
   Data Helpers
----------------------------- */

function getCandidateId(candidate) {
  return candidate.id || candidate._id;
}

function getCandidateName(candidate) {
  return candidate.name || candidate.fullName || "Unnamed Candidate";
}

function getCandidateContact(candidate) {
  return candidate.contact || candidate.contactPlaceholder || candidate.email || "candidate@smartcampus.edu";
}

function getCandidateGoals(candidate) {
  if (Array.isArray(candidate.goals)) {
    return candidate.goals;
  }

  if (typeof candidate.goals === "string") {
    return candidate.goals.split(",").map((goal) => goal.trim()).filter(Boolean);
  }

  if (typeof candidate.achievements === "string") {
    return candidate.achievements.split(",").map((goal) => goal.trim()).filter(Boolean);
  }

  return [];
}

/* -----------------------------
   UI Helpers
----------------------------- */

function getAvatarUrl(candidate) {
  let url = candidate.avatarUrl || candidate.avatar;
  if (url) {
    // Convert relative urls if they do not start with http
    if (!url.startsWith('http')) {
      // Remove any leading slash to avoid double slashes if API_BASE_URL has a trailing slash (it doesn't, it's /api)
      // Actually we just prepend the host URL. API_BASE_URL is "http://localhost:5001/api". We want "http://localhost:5001"
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
  if (!text) return "";
  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength).trim()}...`;
}

// Add escapeHtml to prevent XSS
function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Safe gallery HTML builder — avoids nested template literal syntax errors
function buildGalleryHtml(galleryPhotos) {
  if (!galleryPhotos || galleryPhotos.length === 0) return "";

  const baseUrl = API_BASE_URL.replace("/api", "");

  let photosHtml = "";
  for (let i = 0; i < galleryPhotos.length; i++) {
    const photo = galleryPhotos[i];
    let pUrl = photo.url || "";
    if (pUrl && !pUrl.startsWith("http")) {
      pUrl = pUrl.startsWith("/") ? (baseUrl + pUrl) : (baseUrl + "/" + pUrl);
    }
    const captionHtml = photo.caption
      ? "<p class='muted' style='margin-top:0.5rem;font-size:0.8rem;'>" + escapeHtml(photo.caption) + "</p>"
      : "";
    photosHtml +=
      "<div class='card' style='padding:0.5rem;text-align:center;border:1px solid var(--glass-border);'>" +
      "<img src='" + pUrl + "' alt='Gallery Photo' style='width:100%;height:120px;object-fit:cover;border-radius:8px;' onerror=\"this.style.display='none'\" />" +
      captionHtml +
      "</div>";
  }

  return (
    "<article class='card campaign-section-card candidate-gallery-card' style='grid-column: 1 / -1;'>" +
    "<span class='badge badge-gold'>Gallery</span>" +
    "<h3>Campaign Photos</h3>" +
    "<div style='display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:1rem;margin-top:1rem;'>" +
    photosHtml +
    "</div></article>"
  );
}

function getBackToCandidatesUrl() {
  const currentPage = window.location.pathname.split("/").pop();

  if (currentPage === "student-candidate-profile.html") {
    return "student-candidates.html";
  }

  return "candidates.html";
}