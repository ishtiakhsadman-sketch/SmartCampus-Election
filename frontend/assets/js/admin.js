/* =========================================================
   SmartCampus Election - Admin JS
   Handles:
   - Populate dashboard stats from mock data
   - Filter/search tables
   - Approve/reject simulation
   - Notice publish/unpublish simulation
   - Simple add/edit interactions
   - Election phase toggle UI
   - Admin results publish state
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeAdminData();
  renderAdminDashboard();
  setupElectionSetupPage();
  setupPositionsPage();
  setupCandidatesPage();
  setupVotersPage();
  setupBallotConfigPage();
  setupNoticesPage();
  setupAdminResultsPage();
  renderAuditLogTable();
  setupExportPlaceholder();
});

/* -----------------------------------------
   Storage Keys
----------------------------------------- */
const ADMIN_KEYS = {
  electionSetup: "smartcampus_admin_election_setup",
  candidateStatuses: "smartcampus_admin_candidate_statuses",
  notices: "smartcampus_admin_notices",
  positions: "smartcampus_admin_positions",
  voters: "smartcampus_admin_voters",
  ballotConfig: "smartcampus_admin_ballot_config",
  resultsPublished: "smartcampus_admin_results_published",
  auditLog: "smartcampus_admin_audit_log"
};

/* -----------------------------------------
   Initial Data Setup
----------------------------------------- */
function initializeAdminData() {
  if (!localStorage.getItem(ADMIN_KEYS.electionSetup)) {
    localStorage.setItem(
      ADMIN_KEYS.electionSetup,
      JSON.stringify({
        title: "SmartCampus Election",
        session: "2025-26",
        nominationDates: "Apr 2 - Apr 5",
        scrutinyDates: "Apr 6 - Apr 8",
        campaignPeriod: "Apr 11 - Apr 17",
        votingPeriod: "Apr 18 - Apr 19",
        resultsPublishDate: "Apr 21, 2026",
        phase: "Configuration",
        votingEnabled: false
      })
    );
  }

  if (!localStorage.getItem(ADMIN_KEYS.candidateStatuses) && typeof candidates !== 'undefined') {
    const statuses = candidates.map((candidate, index) => ({
      id: candidate.id,
      status: index < 8 ? "Approved" : index < 14 ? "Pending" : "Rejected"
    }));
    localStorage.setItem(ADMIN_KEYS.candidateStatuses, JSON.stringify(statuses));
  }

  if (!localStorage.getItem(ADMIN_KEYS.notices) && typeof notices !== 'undefined') {
    const adminNotices = notices.map((notice, index) => ({
      ...notice,
      published: index < 4
    }));
    localStorage.setItem(ADMIN_KEYS.notices, JSON.stringify(adminNotices));
  }

  if (!localStorage.getItem(ADMIN_KEYS.positions) && typeof positions !== 'undefined') {
    localStorage.setItem(ADMIN_KEYS.positions, JSON.stringify(positions));
  }

  if (!localStorage.getItem(ADMIN_KEYS.voters)) {
    const voters = [
      { name: "Rahim Uddin", id: "SC-2026-1001", department: "Computer Science", verificationStatus: "Verified", votingStatus: "Voted" },
      { name: "Nusrat Islam", id: "SC-2026-1002", department: "English", verificationStatus: "Verified", votingStatus: "Not Voted" },
      { name: "Sabbir Hossain", id: "SC-2026-1003", department: "Business Administration", verificationStatus: "Pending", votingStatus: "Not Voted" },
      { name: "Farhana Akter", id: "SC-2026-1004", department: "Physics", verificationStatus: "Verified", votingStatus: "Voted" },
      { name: "Mehedi Hasan", id: "SC-2026-1005", department: "Law", verificationStatus: "Verified", votingStatus: "Not Voted" },
      { name: "Sadia Karim", id: "SC-2026-1006", department: "Public Health", verificationStatus: "Pending", votingStatus: "Not Voted" },
      { name: "Arif Chowdhury", id: "SC-2026-1007", department: "Bangla", verificationStatus: "Verified", votingStatus: "Voted" },
      { name: "Maliha Ahmed", id: "SC-2026-1008", department: "Economics", verificationStatus: "Verified", votingStatus: "Not Voted" }
    ];
    localStorage.setItem(ADMIN_KEYS.voters, JSON.stringify(voters));
  }

  if (!localStorage.getItem(ADMIN_KEYS.ballotConfig) && typeof positions !== 'undefined') {
    const ballotConfig = positions.map((position, index) => ({
      title: position.title,
      visible: true,
      seatLimit: position.seats,
      orderLabel: `Order ${index + 1}`
    }));
    localStorage.setItem(ADMIN_KEYS.ballotConfig, JSON.stringify(ballotConfig));
  }

  if (!localStorage.getItem(ADMIN_KEYS.resultsPublished)) {
    localStorage.setItem(ADMIN_KEYS.resultsPublished, "false");
  }

  if (!localStorage.getItem(ADMIN_KEYS.auditLog)) {
    const initialLogs = [
      { admin: "Admin User", action: "Created Notice", module: "Notices", datetime: "2026-04-01 10:30 AM", status: "Success" },
      { admin: "Admin User", action: "Updated Election Setup", module: "Election Setup", datetime: "2026-04-02 09:15 AM", status: "Success" },
      { admin: "Admin User", action: "Reviewed Candidate", module: "Candidates", datetime: "2026-04-07 12:40 PM", status: "Pending" },
      { admin: "Admin User", action: "Saved Ballot Config", module: "Ballot", datetime: "2026-04-10 03:25 PM", status: "Success" }
    ];
    localStorage.setItem(ADMIN_KEYS.auditLog, JSON.stringify(initialLogs));
  }
}

/* -----------------------------------------
   Helpers
----------------------------------------- */
function getElectionSetup() {
  return JSON.parse(localStorage.getItem(ADMIN_KEYS.electionSetup) || "{}");
}

function getCandidateStatuses() {
  return JSON.parse(localStorage.getItem(ADMIN_KEYS.candidateStatuses) || "[]");
}

function setCandidateStatuses(data) {
  localStorage.setItem(ADMIN_KEYS.candidateStatuses, JSON.stringify(data));
}

function getAdminNotices() {
  return JSON.parse(localStorage.getItem(ADMIN_KEYS.notices) || "[]");
}

function setAdminNotices(data) {
  localStorage.setItem(ADMIN_KEYS.notices, JSON.stringify(data));
}

function getAdminPositions() {
  return JSON.parse(localStorage.getItem(ADMIN_KEYS.positions) || "[]");
}

function setAdminPositions(data) {
  localStorage.setItem(ADMIN_KEYS.positions, JSON.stringify(data));
}

function getAdminVoters() {
  return JSON.parse(localStorage.getItem(ADMIN_KEYS.voters) || "[]");
}

function getBallotConfig() {
  return JSON.parse(localStorage.getItem(ADMIN_KEYS.ballotConfig) || "[]");
}

function setBallotConfig(data) {
  localStorage.setItem(ADMIN_KEYS.ballotConfig, JSON.stringify(data));
}

function getAuditLog() {
  return JSON.parse(localStorage.getItem(ADMIN_KEYS.auditLog) || "[]");
}

function addAuditLog(action, module, status) {
  const logs = getAuditLog();
  logs.unshift({
    admin: "Admin User",
    action,
    module,
    datetime: new Date().toLocaleString(),
    status
  });
  localStorage.setItem(ADMIN_KEYS.auditLog, JSON.stringify(logs));
}

function getCandidateStatusById(candidateId) {
  const statuses = getCandidateStatuses();
  return statuses.find((item) => item.id === candidateId)?.status || "Pending";
}

function statusBadgeClass(status) {
  switch (status) {
    case "Approved":
    case "Verified":
    case "Success":
    case "Published":
    case "Active":
    case "Voted":
      return "status-approved";
    case "Pending":
    case "Draft":
      return "status-pending";
    case "Rejected":
    case "Failed":
    case "Unpublished":
    case "Not Voted":
      return "status-rejected";
    default:
      return "status-pending";
  }
}

function showAdminModal(title, content) {
  if (typeof openModal === "function") {
    openModal(`<h2>${title}</h2><div>${content}</div>`);
  }
}

/* XSS-safe string escaping for admin tables and modals */
function adminEscapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* -----------------------------------------
   Dashboard
----------------------------------------- */
function renderAdminDashboard() {
  const totalVotersEl = document.getElementById("statTotalVoters");
  if (!totalVotersEl) return;

  const voters = getAdminVoters();
  const candidateStatuses = getCandidateStatuses();
  const adminNotices = getAdminNotices();
  const electionSetup = getElectionSetup();

  const verifiedVoters = voters.filter((voter) => voter.verificationStatus === "Verified").length;
  const votesCast = voters.filter((voter) => voter.votingStatus === "Voted").length;
  const approvedNominations = candidateStatuses.filter((item) => item.status === "Approved").length;
  const rejectedNominations = candidateStatuses.filter((item) => item.status === "Rejected").length;
  const activeNotices = adminNotices.filter((notice) => notice.published).length;
  const turnoutPercentage = voters.length ? ((votesCast / voters.length) * 100).toFixed(1) : "0.0";

  document.getElementById("statTotalVoters").textContent = voters.length;
  document.getElementById("statVerifiedVoters").textContent = verifiedVoters;
  document.getElementById("statTotalCandidates").textContent = "...";
  document.getElementById("statApprovedNominations").textContent = "...";
  document.getElementById("statRejectedNominations").textContent = "...";
  
  if (typeof apiRequest === "function") {
    apiRequest("/admin/candidates").then(res => {
      if (res.success && res.candidates) {
        document.getElementById("statTotalCandidates").textContent = res.candidates.length;
        document.getElementById("statApprovedNominations").textContent = res.candidates.filter(c => c.status === "Approved").length;
        document.getElementById("statRejectedNominations").textContent = res.candidates.filter(c => c.status === "Rejected").length;
      }
    }).catch(err => console.error(err));
  }
  document.getElementById("statActiveNotices").textContent = activeNotices;
  document.getElementById("statElectionPhase").textContent = electionSetup.phase || "Configuration";
  document.getElementById("statTurnoutPercentage").textContent = `${turnoutPercentage}%`;
  document.getElementById("statVotesCast").textContent = votesCast;

  const phaseBadge = document.getElementById("adminElectionPhaseBadge");
  if (phaseBadge) {
    phaseBadge.textContent = `Phase: ${electionSetup.phase || "Configuration"}`;
  }

  const activitiesContainer = document.getElementById("adminRecentActivities");
  if (activitiesContainer) {
    const logs = getAuditLog().slice(0, 4);
    activitiesContainer.innerHTML = logs
      .map(
        (log) => `
        <article class="widget-row">
          <div>
            <h3>${log.action}</h3>
            <p class="muted">${log.module} • ${log.datetime}</p>
          </div>
          <span class="status-badge ${statusBadgeClass(log.status)}">${log.status}</span>
        </article>
      `
      )
      .join("");
  }
}

/* -----------------------------------------
   Election Setup
----------------------------------------- */
function setupElectionSetupPage() {
  const form = document.getElementById("electionSetupForm");
  if (!form) return;

  const previewContainer = document.getElementById("electionSetupPreview");
  const data = getElectionSetup();

  document.getElementById("electionTitle").value = data.title || "";
  document.getElementById("electionSession").value = data.session || "";
  document.getElementById("nominationDates").value = data.nominationDates || "";
  document.getElementById("scrutinyDates").value = data.scrutinyDates || "";
  document.getElementById("campaignPeriod").value = data.campaignPeriod || "";
  document.getElementById("votingPeriod").value = data.votingPeriod || "";
  document.getElementById("resultsPublishDate").value = data.resultsPublishDate || "";
  document.getElementById("electionPhaseSelect").value = data.phase || "Configuration";
  document.getElementById("votingEnabledToggle").checked = !!data.votingEnabled;

  renderElectionSetupPreview();

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const updated = {
      title: document.getElementById("electionTitle").value.trim(),
      session: document.getElementById("electionSession").value.trim(),
      nominationDates: document.getElementById("nominationDates").value.trim(),
      scrutinyDates: document.getElementById("scrutinyDates").value.trim(),
      campaignPeriod: document.getElementById("campaignPeriod").value.trim(),
      votingPeriod: document.getElementById("votingPeriod").value.trim(),
      resultsPublishDate: document.getElementById("resultsPublishDate").value.trim(),
      phase: document.getElementById("electionPhaseSelect").value,
      votingEnabled: document.getElementById("votingEnabledToggle").checked
    };

    localStorage.setItem(ADMIN_KEYS.electionSetup, JSON.stringify(updated));
    addAuditLog("Updated Election Setup", "Election Setup", "Success");
    renderElectionSetupPreview();
    showAdminModal("Settings Saved", "<p>Election setup has been saved successfully.</p>");
  });

  if (previewContainer) {
    renderElectionSetupPreview();
  }
}

function renderElectionSetupPreview() {
  const previewContainer = document.getElementById("electionSetupPreview");
  if (!previewContainer) return;

  const data = getElectionSetup();

  previewContainer.innerHTML = `
    <article class="summary-row">
      <div>
        <h4>${data.title || "SmartCampus Election"}</h4>
        <p class="summary-muted">Session: ${data.session || "-"}</p>
      </div>
      <span class="status-badge ${data.votingEnabled ? "status-approved" : "status-rejected"}">
        ${data.votingEnabled ? "Voting Enabled" : "Voting Disabled"}
      </span>
    </article>
    <article class="summary-row">
      <div>
        <h4>Nomination Dates</h4>
        <p class="summary-muted">${data.nominationDates || "-"}</p>
      </div>
      <span class="badge badge-gold">Phase</span>
    </article>
    <article class="summary-row">
      <div>
        <h4>Current Election Phase</h4>
        <p class="summary-muted">${data.phase || "Configuration"}</p>
      </div>
      <span class="status-badge status-approved">${data.phase || "Configuration"}</span>
    </article>
  `;
}

/* -----------------------------------------
   Positions
----------------------------------------- */
let _adminPositionsCache = [];

function setupPositionsPage() {
  const tableBody = document.getElementById("positionsTableBody");
  if (!tableBody) return;

  renderPositionsTable();

  const addBtn = document.getElementById("addPositionBtn");
  const form = document.getElementById("positionForm");
  const resetBtn = document.getElementById("resetPositionFormBtn");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      document.getElementById("positionEditIndex").value = "";
      form.reset();
      showAdminModal("Add Position", "<p>Use the form below the table to add a new position.</p>");
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      form.reset();
      document.getElementById("positionEditIndex").value = "";
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const editId = document.getElementById("positionEditIndex").value;
    const title = document.getElementById("positionTitleInput").value.trim();
    const seats = Number(document.getElementById("positionSeatInput").value);
    const responsibility = document.getElementById("positionDescriptionInput").value.trim();

    if (!title || !seats || !responsibility) {
      showAdminModal("Missing Data", "<p>Please complete all position form fields.</p>");
      return;
    }

    try {
      const payload = { title, seats, responsibility };
      let res;
      if (editId !== "") {
        res = await apiRequest(`/admin/positions/${editId}`, { method: "PUT", body: payload });
      } else {
        res = await apiRequest("/admin/positions", { method: "POST", body: payload });
      }
      
      if (res.success) {
        addAuditLog(editId !== "" ? "Edited Position" : "Added Position", "Positions", "Success");
        renderPositionsTable();
        form.reset();
        document.getElementById("positionEditIndex").value = "";
      }
    } catch (err) {
      showAdminModal("Error", `<p>${err.message}</p>`);
    }
  });
}

async function renderPositionsTable() {
  const tableBody = document.getElementById("positionsTableBody");
  if (!tableBody) return;

  // Guard: if no token, redirect to login immediately
  const token = typeof getAuthToken === "function" ? getAuthToken() : localStorage.getItem("smartcampus_auth_token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Show loading row
  tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#888;padding:16px;">Loading positions...</td></tr>`;

  try {
    const res = await apiRequest("/admin/positions");
    if (res.success) {
      _adminPositionsCache = res.positions || [];
      if (_adminPositionsCache.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#888;padding:16px;">No positions found. Add one below.</td></tr>`;
        return;
      }
      tableBody.innerHTML = _adminPositionsCache
        .map(
          (position) => `
          <tr>
            <td>${adminEscapeHtml(position.title)}</td>
            <td>${position.seats}</td>
            <td>${adminEscapeHtml(position.responsibility)}</td>
            <td>${position.candidateCount !== undefined ? position.candidateCount : 0}</td>
            <td>
              <div class="table-actions">
                <button class="table-btn edit" type="button" onclick="editPosition('${position._id}')">Edit</button>
                <button class="table-btn delete" type="button" onclick="deletePosition('${position._id}')">Delete</button>
              </div>
            </td>
          </tr>
        `
        )
        .join("");
    } else {
      throw new Error(res.message || "Unknown server error");
    }
  } catch (err) {
    console.error("renderPositionsTable failed:", err);
    // If it's an auth error, redirect to login
    if (err.message && (err.message.toLowerCase().includes("token") || err.message.toLowerCase().includes("unauthorized") || err.message.toLowerCase().includes("no token"))) {
      window.location.href = "login.html";
      return;
    }
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:red;padding:16px;">Error loading positions: ${err.message}. Check console for details.</td></tr>`;
  }
}

window.editPosition = function (id) {
  const item = _adminPositionsCache.find(p => p._id === id);
  if (!item) return;

  document.getElementById("positionEditIndex").value = item._id;
  document.getElementById("positionTitleInput").value = item.title;
  document.getElementById("positionSeatInput").value = item.seats;
  document.getElementById("positionDescriptionInput").value = item.responsibility;
};

window.deletePosition = async function (id) {
  if (!confirm("Are you sure you want to delete this position?")) return;
  try {
    const res = await apiRequest(`/admin/positions/${id}`, { method: "DELETE" });
    if (res.success) {
      addAuditLog("Deleted Position", "Positions", "Success");
      renderPositionsTable();
    }
  } catch (err) {
    showAdminModal("Error", `<p>${err.message}</p>`);
  }
};

/* -----------------------------------------
   Candidates
----------------------------------------- */
function setupCandidatesPage() {
  const tableBody = document.getElementById("adminCandidatesTableBody");
  if (!tableBody) return;

  const searchInput = document.getElementById("candidateAdminSearch");
  const statusFilter = document.getElementById("candidateAdminStatusFilter");

  async function render(isAutoRefresh = false) {
    const query = searchInput.value.toLowerCase().trim();
    const selectedStatus = statusFilter.value;

    try {
      const res = await apiRequest("/admin/candidates");
      if (!res.success) throw new Error(res.message || "Failed to load candidates");
      const fetchedCandidates = res.candidates || [];

      window._adminCandidatesData = fetchedCandidates;

      const rows = fetchedCandidates.filter((candidate) => {
        const name = candidate.fullName || candidate.name || "";
        const department = candidate.department || "";
        const position = candidate.desiredPosition || candidate.position || "";
        const status = candidate.status || "Pending";

        const matchQuery =
          name.toLowerCase().includes(query) ||
          department.toLowerCase().includes(query) ||
          position.toLowerCase().includes(query);

        const matchStatus = selectedStatus === "all" || status === selectedStatus;
        return matchQuery && matchStatus;
      });

      if (rows.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:#64748b;">No candidates found.</td></tr>`;
      } else {
        tableBody.innerHTML = rows
          .map((candidate) => {
            const status = candidate.status || "Pending";
            const name = adminEscapeHtml(candidate.fullName || candidate.name || "");
            const department = adminEscapeHtml(candidate.department || "");
            const session = adminEscapeHtml(candidate.session || "");
            const position = adminEscapeHtml(candidate.desiredPosition || candidate.position || "");
            const id = candidate._id;

            const isApproved = status === "Approved";
            const isRejected = status === "Rejected";

            const approveBtn = isApproved 
              ? `<button class="table-btn approve" type="button" disabled style="opacity: 0.45; cursor: not-allowed;" title="Candidate already approved">Approve</button>`
              : `<button class="table-btn approve" type="button" onclick="updateCandidateStatus('${id}', 'Approved')">Approve</button>`;

            const rejectBtn = isRejected 
              ? `<button class="table-btn reject" type="button" disabled style="opacity: 0.45; cursor: not-allowed;" title="Candidate already rejected">Reject</button>`
              : `<button class="table-btn reject" type="button" onclick="updateCandidateStatus('${id}', 'Rejected')">Reject</button>`;

            return `
              <tr>
                <td style="font-weight: 700; color: var(--primary-green-dark);">${name}</td>
                <td>${department}</td>
                <td>${session}</td>
                <td>${position}</td>
                <td><span class="status-badge ${statusBadgeClass(status)}">${status}</span></td>
                <td>
                  <div class="table-actions">
                    <button class="table-btn view" type="button" onclick="viewCandidate('${id}')">View</button>
                    ${approveBtn}
                    ${rejectBtn}
                  </div>
                </td>
              </tr>
            `;
          })
          .join("");
      }
    } catch (err) {
      console.error(err);
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Failed to load candidates. Check console.</td></tr>`;
    }
  }

  searchInput.addEventListener("input", () => render(false));
  statusFilter.addEventListener("change", () => render(false));
  render(false);

  // Auto-refresh every 15 seconds
  if (window._candidateRefreshInterval) {
    clearInterval(window._candidateRefreshInterval);
  }
  window._candidateRefreshInterval = setInterval(() => {
    // Only refresh if the candidate table is still in the DOM
    if (document.getElementById("adminCandidatesTableBody")) {
      render(true);
    } else {
      clearInterval(window._candidateRefreshInterval);
    }
  }, 15000);
}

function resolveAdminUrl(url) {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  if (!url.startsWith("/") && !url.startsWith("uploads/")) {
    // Seeded image names in mock data like 'avatar.png'
    return `assets/images/${url}`;
  }
  const apiBase = typeof API_BASE_URL !== "undefined" ? API_BASE_URL : (window.API_BASE_URL || "http://localhost:5001/api");
  const host = apiBase.replace("/api", "");
  return url.startsWith("/") ? host + url : host + "/" + url;
}

window.viewCandidate = function (candidateId) {
  const candidate = (window._adminCandidatesData || []).find((item) => item._id === candidateId);
  if (!candidate) return;

  const name = adminEscapeHtml(candidate.fullName || candidate.name || "");
  const department = adminEscapeHtml(candidate.department || "");
  const session = adminEscapeHtml(candidate.session || "");
  const position = adminEscapeHtml(candidate.desiredPosition || candidate.position || "");
  const manifesto = adminEscapeHtml(candidate.manifesto || candidate.bio || "No manifesto provided.");
  const slogan = adminEscapeHtml(candidate.slogan || "No slogan provided.");
  const studentId = adminEscapeHtml(candidate.studentId || candidate.roll || "");
  const email = adminEscapeHtml(candidate.email || candidate.contactPlaceholder || "");

  // Resolve Profile Image
  const photo = candidate.avatarUrl || candidate.photoUrl || "";
  const photoUrl = resolveAdminUrl(photo);
  const photoHtml = photoUrl
    ? `<div style="flex-shrink:0; text-align:center; margin-bottom:15px; margin-right:20px;">
         <img src="${adminEscapeHtml(photoUrl)}" alt="${name}'s Photo" style="width:110px; height:110px; border-radius:50%; object-fit:cover; border:3px solid #146b3a; box-shadow:0 4px 12px rgba(0,0,0,0.1);" onerror="this.src='assets/images/default-avatar.png'"/>
       </div>`
    : `<div style="flex-shrink:0; text-align:center; margin-bottom:15px; margin-right:20px;">
         <div style="width:110px; height:110px; border-radius:50%; border:3px dashed #d4af37; background:#fffdf5; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#a58316; font-size:0.8rem; padding:10px; text-align:center;">No Photo</div>
       </div>`;

  // Resolve Documents
  const docs = candidate.documents || [];
  let docsHtml = `<p style="font-style:italic; color:#64748b; margin:0;">No documents uploaded.</p>`;
  if (docs.length > 0) {
    docsHtml = `<ul style="list-style: none; padding-left: 0; margin: 0;">` + docs.map(d => {
      const docUrl = resolveAdminUrl(d.url);
      return `<li style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.15rem; line-height: 1;">📄</span>
                <a href="${adminEscapeHtml(docUrl)}" target="_blank" style="color: #146b3a; font-weight: 700; text-decoration: underline;">${adminEscapeHtml(d.originalName || d.filename)}</a>
                <span style="color:#64748b; font-size:0.8rem;">(${(d.size / 1024).toFixed(1)} KB)</span>
              </li>`;
    }).join("") + `</ul>`;
  }

  // Resolve Gallery Photos
  const gallery = candidate.galleryPhotos || [];
  let galleryHtml = `<p style="font-style:italic; color:#64748b; margin:0;">No campaign photos uploaded.</p>`;
  if (gallery.length > 0) {
    galleryHtml = `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(110px, 1fr)); gap:12px; margin-top:8px;">` +
      gallery.map(p => {
        const gUrl = resolveAdminUrl(p.url);
        return `<div style="border-radius:8px; overflow:hidden; border:1px solid #e2e8f0; aspect-ratio:1.2; background:#f8fafc; position:relative; box-shadow:0 2px 6px rgba(0,0,0,0.03);">
                  <img src="${adminEscapeHtml(gUrl)}" alt="Gallery Photo" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='assets/images/photo-placeholder.png'"/>
                </div>`;
      }).join("") + `</div>`;
  }

  showAdminModal(
    "Candidate Profile Details",
    `
      <div style="font-family: inherit; color:#172033; max-width:100%;">
        <!-- Profile header -->
        <div style="display:flex; align-items:center; flex-wrap:wrap; margin-bottom:20px; border-bottom:1px solid #e2e8f0; padding-bottom:15px;">
          ${photoHtml}
          <div style="flex:1; min-width:200px;">
            <h3 style="margin:0 0 5px 0; color:#0f4f2b; font-size:1.35rem; font-weight:800; line-height:1.2;">${name}</h3>
            <span style="display:inline-block; padding:4px 12px; background:#fdecec; color:#c62828; font-weight:800; border-radius:12px; font-size:0.82rem; margin-bottom:8px;">${position}</span>
            <div style="font-size:0.88rem; color:#475569; line-height: 1.4;">
              <div>🏛️ <strong>Department:</strong> ${department}</div>
              <div>📅 <strong>Session:</strong> ${session}</div>
            </div>
          </div>
        </div>
        
        <!-- Quick Stats -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
          <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid #e2e8f0;">
            <strong style="color:#0f4f2b; font-size:0.85rem; display:block; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">Student Credentials</strong>
            <span style="font-size:0.88rem; display:block;"><strong>ID:</strong> ${studentId}</span>
            <span style="font-size:0.88rem; display:block; word-break:break-all;"><strong>Email:</strong> ${email}</span>
          </div>
          <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid #e2e8f0;">
            <strong style="color:#0f4f2b; font-size:0.85rem; display:block; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">Campaign Slogan</strong>
            <span style="font-style:italic; font-size:0.88rem; color:#9a7412; display:block; line-height:1.45;">“ ${slogan} ”</span>
          </div>
        </div>

        <!-- Manifesto section -->
        <div style="margin-bottom:20px;">
          <h4 style="margin:0 0 8px 0; color:#0f4f2b; font-weight:800; font-size:0.95rem; border-bottom:1.5px solid #e2e8f0; padding-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">Manifesto &amp; Bio</h4>
          <p style="font-size:0.92rem; line-height:1.6; margin:5px 0 0 0; color:#334155; white-space:pre-line; word-break:break-word;">${manifesto}</p>
        </div>

        <!-- Documents section -->
        <div style="margin-bottom:20px;">
          <h4 style="margin:0 0 8px 0; color:#0f4f2b; font-weight:800; font-size:0.95rem; border-bottom:1.5px solid #e2e8f0; padding-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">Nomination Documents</h4>
          <div style="margin-top:8px;">${docsHtml}</div>
        </div>

        <!-- Gallery section -->
        <div style="margin-bottom:15px;">
          <h4 style="margin:0 0 8px 0; color:#0f4f2b; font-weight:800; font-size:0.95rem; border-bottom:1.5px solid #e2e8f0; padding-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">Campaign Gallery</h4>
          ${galleryHtml}
        </div>
        
        <!-- Actions footer -->
        <div style="text-align:right; margin-top:20px; border-top:1px solid #e2e8f0; padding-top:15px; display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" class="btn btn-sm btn-outline" onclick="closeModal()" style="font-weight:900; border-radius:20px; padding: 6px 16px;">Close Details</button>
        </div>
      </div>
    `
  );
};

window.updateCandidateStatus = async function (candidateId, newStatus) {
  try {
    const res = await apiRequest("/admin/candidates/" + candidateId + "/status", {
      method: "PUT",
      body: { status: newStatus }
    });

    if (res.success) {
      addAuditLog(newStatus + " Candidate", "Candidates", "Success");
      setupCandidatesPage();
      renderAdminDashboard();
    } else {
      showAdminModal("Error", "<p>Failed to update candidate status.</p>");
    }
  } catch (err) {
    console.error("updateCandidateStatus error:", err);
    showAdminModal("Error", "<p>" + (err.message || "An error occurred while updating status.") + "</p>");
  }
};

/* -----------------------------------------
   Voters  —  live data from MongoDB
----------------------------------------- */
let _votersCache = [];

async function setupVotersPage() {
  const tableBody = document.getElementById("adminVotersTableBody");
  if (!tableBody) return;

  const searchInput        = document.getElementById("voterSearchInput");
  const verificationFilter = document.getElementById("voterVerificationFilter");
  const votingFilter       = document.getElementById("voterVotingStatusFilter");
  const exportBtn          = document.getElementById("exportVotersBtn");

  // Update export button label
  if (exportBtn) {
    exportBtn.textContent = "Export Voters CSV";
    exportBtn.onclick = () => {
      const token = typeof getAuthToken === "function" ? getAuthToken() : localStorage.getItem("smartcampus_auth_token");
      window.open(`${window.SMARTCAMPUS_API_BASE_URL || "http://localhost:5001/api"}/admin/voters/export?token=${encodeURIComponent(token || "")}`, "_blank");
    };
  }

  // Render with current filter/search
  function render() {
    const query             = (searchInput?.value || "").toLowerCase().trim();
    const verificationValue = verificationFilter?.value || "all";
    const votingValue       = votingFilter?.value || "all";

    const filtered = _votersCache.filter((v) => {
      const matchQuery =
        (v.name  || "").toLowerCase().includes(query) ||
        (v.studentId || "").toLowerCase().includes(query) ||
        (v.department || "").toLowerCase().includes(query) ||
        (v.email || "").toLowerCase().includes(query);

      const matchVerification =
        verificationValue === "all" || v.verificationStatus === verificationValue;

      const matchVoting = votingValue === "all" || v.votingStatus === votingValue;

      return matchQuery && matchVerification && matchVoting;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#888;padding:16px;">No voters found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered
      .map((voter) => {
        const isVerified = voter.verificationStatus === "Verified";
        const btnText = isVerified ? "Unverify" : "Verify";
        const btnClass = isVerified ? "reject" : "approve";

        return `
        <tr>
          <td>${adminEscapeHtml(voter.name || "—")}</td>
          <td>${adminEscapeHtml(voter.studentId || "—")}</td>
          <td>${adminEscapeHtml(voter.email || "—")}</td>
          <td>${adminEscapeHtml(voter.department || "—")}</td>
          <td><span class="status-badge ${statusBadgeClass(voter.verificationStatus)}">${voter.verificationStatus || "—"}</span></td>
          <td><span class="status-badge ${statusBadgeClass(voter.votingStatus)}">${voter.votingStatus || "Not Voted"}</span></td>
          <td>
            <div class="table-actions">
              <button class="table-btn ${btnClass}" type="button" onclick="toggleVoterVerification('${voter._id}')">${btnText}</button>
            </div>
          </td>
        </tr>
      `;
      })
      .join("");
  }

  // Fetch from API
  tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#888;padding:16px;">Loading voters...</td></tr>`;

  try {
    const res = await apiRequest("/admin/voters");
    if (res.success) {
      _votersCache = res.voters || [];
      render();
    } else {
      throw new Error(res.message || "Failed to load voters");
    }
  } catch (err) {
    // 401 "User not found" / stale token → api.js global handler already redirected to login.html
    // Only other errors reach here (network failure, etc.)
    console.error("setupVotersPage error:", err);
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#c62828;padding:16px;">
      Failed to load voters: ${err.message}.<br>
      <a href="login.html" style="color:#146b3a;font-weight:700;">Please log in again →</a>
    </td></tr>`;
  }

  window.toggleVoterVerification = async function(id) {
    try {
      const res = await apiRequest(`/admin/voters/${id}/verify`, { method: "PUT" });
      if (res.success) {
        addAuditLog(`Voter verified toggled: ${res.verificationStatus}`, "Voters", "Success");
        // Update local cache to re-render without full refetch immediately
        const voter = _votersCache.find(v => v._id === id);
        if (voter) {
          voter.verificationStatus = res.verificationStatus;
          render();
        }
        renderAdminDashboard();
      } else {
        showAdminModal("Error", `<p>${res.message || "Failed to toggle verification."}</p>`);
      }
    } catch (err) {
      console.error(err);
      showAdminModal("Error", `<p>${err.message || "Error communicating with server."}</p>`);
    }
  };

  searchInput?.addEventListener("input", render);
  verificationFilter?.addEventListener("change", render);
  votingFilter?.addEventListener("change", render);
}


/* -----------------------------------------
   Ballot Config
----------------------------------------- */
function setupBallotConfigPage() {
  const list = document.getElementById("ballotConfigList");
  if (!list) return;

  renderBallotConfig();

  const saveBtn = document.getElementById("saveBallotConfigBtn");
  saveBtn.addEventListener("click", () => {
    const rows = document.querySelectorAll(".ballot-config-row");
    const updated = Array.from(rows).map((row) => ({
      title: row.dataset.title,
      visible: row.querySelector(".ballot-visible-toggle").checked,
      seatLimit: Number(row.querySelector(".ballot-seat-limit").value),
      orderLabel: row.querySelector(".ballot-order-label").value.trim()
    }));

    setBallotConfig(updated);
    addAuditLog("Saved Ballot Configuration", "Ballot", "Success");
    renderBallotConfig();
    showAdminModal("Ballot Saved", "<p>Ballot configuration has been updated successfully.</p>");
  });
}

function renderBallotConfig() {
  const list = document.getElementById("ballotConfigList");
  const preview = document.getElementById("adminBallotPreview");
  if (!list || !preview) return;

  const config = getBallotConfig();

  list.innerHTML = config
    .map(
      (item) => {
        const initials = item.title ? item.title.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";
        return `
        <article class="ballot-card ballot-config-row" data-title="${item.title}">
          <div class="ballot-card-info">
            <div class="ballot-card-icon">
              <span>${initials}</span>
            </div>
            <div class="ballot-card-text">
              <h4>${adminEscapeHtml(item.title)}</h4>
              <p class="summary-muted">Adjust candidate display, seat counts, and priority order.</p>
            </div>
          </div>
          <div class="ballot-card-settings">
            <div class="settings-group">
              <div class="setting-item toggle-setting">
                <span class="setting-label">Visibility</span>
                <label class="switch">
                  <input type="checkbox" class="ballot-visible-toggle" ${item.visible ? "checked" : ""} />
                  <span class="slider round"></span>
                </label>
              </div>
              
              <div class="setting-item input-setting">
                <label class="setting-label">Seat Limit</label>
                <div class="number-input-wrapper">
                  <input type="number" min="1" class="ballot-seat-limit" value="${item.seatLimit}" placeholder="Seats" />
                </div>
              </div>
            </div>
            
            <div class="settings-group">
              <div class="setting-item input-setting full-width">
                <label class="setting-label">Display Order</label>
                <div class="order-input-wrapper">
                  <input type="text" class="ballot-order-label" value="${item.orderLabel}" placeholder="e.g. Order 1" />
                </div>
              </div>
            </div>
          </div>
        </article>
      `;
      }
    )
    .join("");

  const visibleItems = config.filter((item) => item.visible);

  preview.innerHTML = visibleItems
    .map(
      (item) => `
      <article class="summary-row">
        <div>
          <h4>${adminEscapeHtml(item.title)}</h4>
          <p class="summary-muted">${adminEscapeHtml(item.orderLabel)}</p>
        </div>
        <span class="badge badge-gold">Seat Limit: ${item.seatLimit}</span>
      </article>
    `
    )
    .join("");
}


/* -----------------------------------------
   Notices  — wired to MongoDB backend API
   All operations call apiRequest() so the
   public Notice Board reflects changes immediately.
----------------------------------------- */
function setupNoticesPage() {
  const tableBody = document.getElementById("adminNoticesTableBody");
  const form      = document.getElementById("noticeForm");
  if (!tableBody || !form) return;

  // Load live notices from the backend on page open
  loadAndRenderAdminNotices();

  document.getElementById("resetNoticeFormBtn").addEventListener("click", () => {
    form.reset();
    document.getElementById("noticeEditIndex").value = "";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const editId = document.getElementById("noticeEditIndex").value.trim();

    const payload = {
      title:     document.getElementById("noticeTitleInput").value.trim(),
      category:  document.getElementById("noticeCategoryInput").value.trim(),
      date:      document.getElementById("noticeDateInput").value.trim(),
      summary:   document.getElementById("noticeSummaryInput").value.trim(),
      details:   document.getElementById("noticeDetailsInput").value.trim(),
      published: document.getElementById("noticePublishedInput").checked
    };

    if (!payload.title || !payload.category || !payload.date) {
      showAdminModal("Missing Data", "<p>Please provide title, category, and date.</p>");
      return;
    }

    try {
      if (editId) {
        // Update existing notice in MongoDB (includes published state)
        const res = await apiRequest(`/admin/notices/${editId}`, { method: "PUT", body: payload });
        if (!res.success) throw new Error(res.message || "Update failed");
        addAuditLog("Edited Notice", "Notices", "Success");
      } else {
        // Create new notice in MongoDB
        const res = await apiRequest("/admin/notices", { method: "POST", body: payload });
        if (!res.success) throw new Error(res.message || "Create failed");
        addAuditLog("Created Notice", "Notices", "Success");
      }

      await loadAndRenderAdminNotices();
      form.reset();
      document.getElementById("noticeEditIndex").value = "";
    } catch (err) {
      console.error("Save notice error:", err);
      showAdminModal("Error", `<p>Failed to save notice: ${err.message}</p>`);
    }
  });
}

/* Load all notices from MongoDB and render the table */
async function loadAndRenderAdminNotices() {
  const tableBody = document.getElementById("adminNoticesTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:#64748b;">⏳ Loading notices from database…</td></tr>`;

  try {
    const res = await apiRequest("/admin/notices");
    if (!res.success) throw new Error(res.message || "Failed to load notices");
    renderAdminNoticesTable(res.notices || []);
  } catch (err) {
    console.error("Load admin notices error:", err);
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:#ef4444;">⚠️ Failed to load notices. Check that the backend server is running.</td></tr>`;
  }
}

/* Render the notices table from the given array (fresh from MongoDB) */
function renderAdminNoticesTable(noticeList) {
  const tableBody = document.getElementById("adminNoticesTableBody");
  if (!tableBody) return;

  if (!noticeList.length) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:#64748b;">No notices yet. Create one using the form above.</td></tr>`;
    return;
  }

  tableBody.innerHTML = noticeList
    .map(
      (notice) => `
      <tr>
        <td>${notice.title}</td>
        <td>${notice.category}</td>
        <td>${notice.date}</td>
        <td>
          <span class="status-badge ${statusBadgeClass(notice.published ? "Published" : "Unpublished")}">
            ${notice.published ? "Published" : "Unpublished"}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <button class="table-btn edit" type="button" onclick="editNotice('${notice._id}')">Edit</button>
            <button class="table-btn ${notice.published ? "unpublish" : "publish"}" type="button" onclick="toggleNoticePublish('${notice._id}')">
              ${notice.published ? "Unpublish" : "Publish"}
            </button>
            <button class="table-btn delete" type="button" onclick="deleteNotice('${notice._id}')">Delete</button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");
}

/* Populate form fields so admin can edit an existing notice */
window.editNotice = async function (noticeId) {
  try {
    const res = await apiRequest("/admin/notices");
    const notice = (res.notices || []).find(
      (n) => String(n._id) === String(noticeId)
    );
    if (!notice) {
      showAdminModal("Error", "<p>Notice not found.</p>");
      return;
    }

    document.getElementById("noticeEditIndex").value        = notice._id;
    document.getElementById("noticeTitleInput").value       = notice.title    || "";
    document.getElementById("noticeCategoryInput").value    = notice.category || "";
    document.getElementById("noticeDateInput").value        = notice.date     || "";
    document.getElementById("noticeSummaryInput").value     = notice.summary  || "";
    document.getElementById("noticeDetailsInput").value     = notice.details  || "";
    document.getElementById("noticePublishedInput").checked = !!notice.published;

    // Scroll to form for usability
    document.getElementById("noticeForm")?.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    console.error("Edit notice error:", err);
    showAdminModal("Error", `<p>Could not load notice: ${err.message}</p>`);
  }
};

/* Toggle publish/unpublish in MongoDB via the dedicated endpoint */
window.toggleNoticePublish = async function (noticeId) {
  try {
    const res = await apiRequest(`/admin/notices/${noticeId}/publish`, { method: "PUT" });
    if (!res.success) throw new Error(res.message || "Toggle failed");

    const isNowPublished = res.notice?.published;
    addAuditLog(
      isNowPublished ? "Published Notice" : "Unpublished Notice",
      "Notices",
      "Success"
    );
    // Reload the table so publish state is accurate from MongoDB
    await loadAndRenderAdminNotices();
  } catch (err) {
    console.error("Toggle publish error:", err);
    showAdminModal("Error", `<p>Failed to toggle publish status: ${err.message}</p>`);
  }
};

/* Permanently delete a notice from MongoDB */
window.deleteNotice = async function (noticeId) {
  if (!confirm("Delete this notice? This action cannot be undone.")) return;

  try {
    const res = await apiRequest(`/admin/notices/${noticeId}`, { method: "DELETE" });
    if (!res.success) throw new Error(res.message || "Delete failed");

    addAuditLog("Deleted Notice", "Notices", "Success");
    await loadAndRenderAdminNotices();
  } catch (err) {
    console.error("Delete notice error:", err);
    showAdminModal("Error", `<p>Failed to delete notice: ${err.message}</p>`);
  }
};

/* -----------------------------------------
   Results
----------------------------------------- */
function setupAdminResultsPage() {
  const label = document.getElementById("adminCountingStatusLabel");
  const publishBtn = document.getElementById("publishResultsBtn");
  if (!label || !publishBtn) return;

  // Initialize state from backend setup
  apiRequest("/public/election-setup").then(res => {
    if (res.success && res.setup) {
      renderAdminResultsState(res.setup.resultsPublished);
    }
  }).catch(err => console.error("Error fetching setup:", err));

  publishBtn.addEventListener("click", async () => {
    try {
      const res = await apiRequest("/admin/results/publish", { method: "PUT" });
      if (res.success) {
        addAuditLog(res.resultsPublished ? "Published Results" : "Unpublished Results", "Results", "Success");
        renderAdminResultsState(res.resultsPublished);
        showAdminModal("Success", `<p>${res.message}</p>`);
      }
    } catch (err) {
      console.error(err);
      showAdminModal("Error", "<p>Failed to toggle publish status.</p>");
    }
  });
}

function renderAdminResultsState(isPublished) {
  const label = document.getElementById("adminCountingStatusLabel");
  const button = document.getElementById("publishResultsBtn");
  const winnerCards = document.getElementById("adminWinnerSummaryCards");
  const tabsContainer = document.getElementById("adminResultsTabs");
  const contentContainer = document.getElementById("adminResultsTabContent");
  const chartContainer = document.getElementById("adminResultsChartSection");

  if (!label || !button || !winnerCards || !tabsContainer || !contentContainer || !chartContainer) return;

  label.textContent = isPublished ? "Results Published" : "Counting In Progress";
  button.textContent = isPublished ? "Unpublish Results" : "Publish Results";

  // Fetch real admin results
  apiRequest("/admin/results").then(res => {
    if (res.success && res.data && res.data.positions) {
      const positionsData = res.data.positions;
      
      if (positionsData.length === 0) {
        winnerCards.innerHTML = "<p>No positions found.</p>";
        return;
      }

      winnerCards.innerHTML = positionsData
        .map(pos => {
          const ranking = pos.candidates;
          const winner = ranking.length > 0 ? ranking[0] : null;

          if (!winner) return "";

          return `
            <article class="card winner-card">
              <span class="badge badge-gold">${isPublished ? "Published Winner" : "Projected Leader"}</span>
              <h3>${pos.title}</h3>
              <p class="winner-highlight">${winner.name}</p>
              <p><strong>Votes:</strong> ${winner.votes}</p>
            </article>
          `;
        })
        .join("");

      tabsContainer.innerHTML = positionsData
        .map(
          (pos, index) => `
          <button class="btn ${index === 0 ? "btn-primary" : "btn-outline"} admin-result-tab-btn" type="button" data-index="${index}">
            ${pos.title}
          </button>
        `
        )
        .join("");

      if (positionsData.length > 0) {
        renderAdminResultsTabContent(positionsData[0].title, positionsData[0].candidates, contentContainer);
        renderAdminResultsChart(positionsData[0].title, positionsData[0].candidates, chartContainer);
      }

      document.querySelectorAll(".admin-result-tab-btn").forEach((buttonEl) => {
        buttonEl.addEventListener("click", () => {
          document.querySelectorAll(".admin-result-tab-btn").forEach((btn) => {
            btn.classList.remove("btn-primary");
            btn.classList.add("btn-outline");
          });

          buttonEl.classList.remove("btn-outline");
          buttonEl.classList.add("btn-primary");

          const posIndex = buttonEl.dataset.index;
          const pos = positionsData[posIndex];
          renderAdminResultsTabContent(pos.title, pos.candidates, contentContainer);
          renderAdminResultsChart(pos.title, pos.candidates, chartContainer);
        });
      });
    }
  }).catch(err => console.error("Error fetching admin results:", err));
}




function renderAdminResultsTabContent(positionTitle, ranking, container) {
  container.innerHTML = `
    <article class="summary-row">
      <div>
        <h4>${positionTitle}</h4>
        <p class="summary-muted">Ranked candidates for this position.</p>
      </div>
      <span class="badge badge-gold">${ranking.length} Candidates</span>
    </article>
    ${ranking
      .map((entry, index) => `
        <article class="summary-row">
          <div>
            <h4>${entry.name || "Unknown Candidate"}</h4>
            <p class="summary-muted">${entry.department || "-"} • ${entry.votes} votes</p>
          </div>
          <span class="status-badge ${index === 0 ? "status-approved" : "status-pending"}">
            ${index === 0 ? "Leading" : "Trailing"}
          </span>
        </article>
      `)
      .join("")}
  `;
}

function renderAdminResultsChart(positionTitle, ranking, container) {
  const maxVotes = ranking[0]?.votes || 1;

  container.innerHTML = `
    <article class="result-position-card">
      <h3>${positionTitle}</h3>
      ${ranking
        .map((entry) => {
          const width = maxVotes > 0 ? ((entry.votes / maxVotes) * 100).toFixed(1) : 0;

          return `
            <div class="result-candidate-row">
              <div class="result-label-row">
                <span>${entry.name || "Unknown Candidate"}</span>
                <span>${entry.votes} votes</span>
              </div>
              <div class="result-bar-track">
                <div class="result-bar-fill" style="width: ${width}%;"></div>
              </div>
            </div>
          `;
        })
        .join("")}
    </article>
  `;
}

/* -----------------------------------------
   Audit Log
----------------------------------------- */
function renderAuditLogTable() {
  const tableBody = document.getElementById("adminAuditLogTableBody");
  if (!tableBody) return;

  const logs = getAuditLog();

  tableBody.innerHTML = logs
    .map(
      (log) => `
      <tr>
        <td>${log.admin}</td>
        <td>${log.action}</td>
        <td>${log.module}</td>
        <td>${log.datetime}</td>
        <td><span class="status-badge ${statusBadgeClass(log.status)}">${log.status}</span></td>
      </tr>
    `
    )
    .join("");
}