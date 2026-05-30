/* =========================================================
   SmartCampus Election - Premium Notices JS
   Handles:
   - Notice loading from MongoDB via backend API
   - Search, category filtering, sorting
   - Read More modal with full details
   - Auto-refresh every 12 seconds (admin sync)
   - Correct MongoDB _id string handling for onclick
========================================================= */

let backendNotices = [];
let pollingInterval;

document.addEventListener("DOMContentLoaded", () => {
  setupNoticesPage();
});

async function setupNoticesPage() {
  const noticesList    = document.getElementById("noticesList");
  const categoryFilter = document.getElementById("noticeCategoryFilter");

  if (!noticesList || !categoryFilter) return;

  // Show loading state immediately
  noticesList.innerHTML = `<div style="padding:3rem; text-align:center; color:#475569;">
    <span style="font-size:2rem; display:block; margin-bottom:12px;">⏳</span>
    <strong>Loading official notices…</strong>
  </div>`;

  await fetchAndRenderNotices();

  // Auto-refresh every 12 seconds for admin sync
  pollingInterval = setInterval(fetchAndRenderNotices, 12000);

  // Search
  const searchInput = document.getElementById("noticeSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => renderNotices(getFilteredNotices()));
  }

  // Category filter
  categoryFilter.addEventListener("change", () => renderNotices(getFilteredNotices()));

  // Sort
  const sortSelect = document.getElementById("noticeSort");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => renderNotices(getFilteredNotices()));
  }

  // Clear filters
  const clearButton = document.getElementById("clearNoticeFilters");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      categoryFilter.value = "all";
      if (sortSelect) sortSelect.value = "latest";
      renderNotices(getFilteredNotices());
    });
  }
}

/* ── Fetch from backend ───────────────────────────────── */

async function fetchAndRenderNotices() {
  try {
    const base = (typeof API_BASE_URL !== "undefined" && API_BASE_URL)
      ? API_BASE_URL
      : "http://localhost:5001/api";

    // Add timestamp to bust any browser/proxy cache — ensures unpublish changes are seen immediately
    const url = `${base}/public/notices?_=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (!data.success) throw new Error(data.message || "API returned failure");

    const list = data.notices || data.data || [];

    // ALWAYS update backendNotices — including setting it to [] when all are unpublished
    // This is the critical fix: previously a stale non-empty backendNotices could persist
    backendNotices = list.map(n => ({
      ...n,
      _id: n._id || n.id,
      id: n._id || n.id,
      displayDate: new Date(n.createdAt || n.date).toLocaleDateString()
    }));

    // Always refresh the category dropdown so admin-added/removed categories appear
    populateNoticeCategories();

    renderImportantNotices();
    renderNotices(getFilteredNotices(), { fromFilter: false });

  } catch (error) {
    console.error("Failed to load backend notices:", error);
    const noticesList = document.getElementById("noticesList");
    // Only overwrite the UI with the error state if there are no previously loaded notices
    // This avoids flashing an error card during a brief network hiccup
    if (noticesList && backendNotices.length === 0) {
      noticesList.innerHTML = `
        <article class="card notice-empty-state">
          <div class="empty-icon" style="color:#ef4444; font-size:2.5rem;">⚠️</div>
          <h3>Failed to load notices</h3>
          <p>We couldn't connect to the server. Please check your connection and try again.</p>
          <button type="button" class="btn btn-outline" onclick="fetchAndRenderNotices()">
            Retry
          </button>
        </article>
      `;
    }
  }
}

/* ── Category dropdown ───────────────────────────────── */

function populateNoticeCategories() {
  const categoryFilter = document.getElementById("noticeCategoryFilter");
  if (!categoryFilter) return;

  const currentValue = categoryFilter.value;
  const categories   = [...new Set(backendNotices.map(n => n.category).filter(Boolean))];

  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value       = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });

  // Restore previously selected value if still valid
  if (categories.includes(currentValue)) {
    categoryFilter.value = currentValue;
  }
}

/* ── Filter + Sort ───────────────────────────────────── */

function getFilteredNotices() {
  const searchInput    = document.getElementById("noticeSearchInput");
  const categoryFilter = document.getElementById("noticeCategoryFilter");
  const sortSelect     = document.getElementById("noticeSort");

  const searchTerm       = searchInput    ? searchInput.value.trim().toLowerCase() : "";
  const selectedCategory = categoryFilter ? categoryFilter.value : "all";
  const selectedSort     = sortSelect     ? sortSelect.value     : "latest";

  let filtered = [...backendNotices];

  if (searchTerm) {
    filtered = filtered.filter(n => {
      return (
        String(n.title    || "").toLowerCase().includes(searchTerm) ||
        String(n.category || "").toLowerCase().includes(searchTerm) ||
        String(n.summary  || "").toLowerCase().includes(searchTerm) ||
        String(n.details  || "").toLowerCase().includes(searchTerm)
      );
    });
  }

  if (selectedCategory !== "all") {
    filtered = filtered.filter(n => n.category === selectedCategory);
  }

  filtered.sort((a, b) => {
    if (selectedSort === "oldest")   return new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date);
    if (selectedSort === "category") return String(a.category).localeCompare(String(b.category));
    return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date); // latest first
  });

  return filtered;
}

/* ── Render helpers ──────────────────────────────────── */

function renderImportantNotices() {
  const importantGrid = document.getElementById("importantNoticesGrid");
  if (!importantGrid) return;

  const priorityCategories = ["Deadline", "Voting", "Results", "Announcement"];
  let importantNotices = backendNotices.filter(n => priorityCategories.includes(n.category));
  if (!importantNotices.length) importantNotices = backendNotices.slice(0, 3);

  importantGrid.innerHTML = importantNotices
    .slice(0, 4)
    .map(n => buildNoticeCard(n, true))
    .join("");
}

function renderNotices(noticeArray, opts = {}) {
  const noticesList  = document.getElementById("noticesList");
  const resultCount  = document.getElementById("noticeResultCount");
  if (!noticesList) return;

  if (resultCount) {
    resultCount.textContent = `Showing ${noticeArray.length} notice${noticeArray.length === 1 ? "" : "s"}`;
  }

  if (!noticeArray.length) {
    // Differentiate: zero published notices from DB vs zero results from filtering
    const noPublishedAtAll = backendNotices.length === 0;

    if (noPublishedAtAll) {
      noticesList.innerHTML = `
        <article class="card notice-empty-state">
          <div class="empty-icon" style="font-size:2.5rem;">📭</div>
          <h3>No Published Notices</h3>
          <p>There are no official notices published yet. Check back soon for election updates and announcements.</p>
        </article>`;
    } else {
      noticesList.innerHTML = `
        <article class="card notice-empty-state">
          <div class="empty-icon">🔎</div>
          <h3>No notices found</h3>
          <p>No notice matches your current search or filter. Try clearing filters or using another keyword.</p>
          <button type="button" class="btn btn-primary" onclick="resetNoticeFilters()">Clear Filters</button>
        </article>`;
    }
    return;
  }

  noticesList.innerHTML = noticeArray.map(n => buildNoticeCard(n, false)).join("");
}

/* ── Card builder ────────────────────────────────────── */

function buildNoticeCard(notice, isImportant) {
  const icon        = getNoticeIcon(notice.category);
  const badgeClass  = getNoticeBadgeClass(notice.category);
  const urgencyText = getUrgencyText(notice.category);

  // FIX: Pass the MongoDB _id as a JSON-safe quoted attribute value.
  // Previously the raw ObjectId string was embedded unquoted into onclick="showNoticeDetails(6645abc...)"
  // which the browser evaluates as an identifier expression — causing a ReferenceError.
  const safeId = String(notice._id || notice.id || "").replace(/['"\\]/g, "");

  return `
    <article class="card notice-card-premium ${isImportant ? "notice-card-important" : ""}">
      <div class="notice-card-top">
        <span class="notice-icon-circle">${icon}</span>
        <div class="notice-badge-stack">
          <span class="notice-category-badge ${badgeClass}">${escapeHtml(notice.category)}</span>
          <span class="notice-urgency-label">${urgencyText}</span>
        </div>
      </div>

      <p class="notice-date-text">Date: ${notice.displayDate || notice.date || ""}</p>

      <h3>${escapeHtml(notice.title)}</h3>

      <p>${escapeHtml(notice.summary || "")}</p>

      <div class="notice-card-footer">
        <span>Official Notice</span>
        <button class="btn btn-outline" type="button" onclick="showNoticeDetails('${safeId}')">
          Read More
        </button>
      </div>
    </article>`;
}

/* ── Read More modal ─────────────────────────────────── */

window.showNoticeDetails = function showNoticeDetails(noticeId) {
  // Look up by _id string — works correctly after auto-refresh
  const notice = backendNotices.find(item =>
    String(item._id || item.id) === String(noticeId)
  );

  if (!notice) {
    console.warn("showNoticeDetails: notice not found for id", noticeId);
    return;
  }

  const detailsHtml = (notice.details && notice.details.trim())
    ? `<div class="notice-modal-details" style="margin-top:1rem; padding-top:1rem; border-top:1px solid #e2e8f0;">
        <p><strong>Full Details:</strong></p>
        <p style="white-space:pre-wrap; line-height:1.7;">${escapeHtml(notice.details)}</p>
       </div>`
    : `<p style="color:#94a3b8; margin-top:1rem; font-style:italic;">No additional details available for this notice.</p>`;

  const modalContent = `
    <div style="padding: 0.5rem 0;">
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:1.25rem;">
        <span class="badge badge-success">${escapeHtml(notice.category || "Notice")}</span>
        <span class="badge badge-gold">Official</span>
      </div>
      <h2 style="font-size:1.35rem; font-weight:800; color:#0f172a; margin-bottom:0.5rem;">
        ${escapeHtml(notice.title)}
      </h2>
      <p style="color:#64748b; font-size:0.9rem; margin-bottom:1rem;">
        📅 Date: <strong>${notice.displayDate || notice.date || "N/A"}</strong>
      </p>
      ${notice.summary
        ? `<p style="color:#374151; line-height:1.7;">${escapeHtml(notice.summary)}</p>`
        : ""}
      ${detailsHtml}
    </div>`;

  if (typeof openModal === "function") {
    openModal(modalContent);
  } else {
    // Fallback: use the globalModal directly if main.js hasn't attached openModal yet
    const modal     = document.getElementById("globalModal");
    const modalBody = document.getElementById("modalBody");
    if (modal && modalBody) {
      modalBody.innerHTML = modalContent;
      modal.classList.add("show");
    } else {
      alert(`${notice.title}\n\n${notice.summary || ""}\n\n${notice.details || "No details."}`);
    }
  }
};

/* ── Reset filters ───────────────────────────────────── */

window.resetNoticeFilters = function resetNoticeFilters() {
  const searchInput    = document.getElementById("noticeSearchInput");
  const categoryFilter = document.getElementById("noticeCategoryFilter");
  const sortSelect     = document.getElementById("noticeSort");
  if (searchInput)    searchInput.value    = "";
  if (categoryFilter) categoryFilter.value = "all";
  if (sortSelect)     sortSelect.value     = "latest";
  renderNotices(getFilteredNotices());
};

/* ── Helpers ─────────────────────────────────────────── */

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getNoticeIcon(category) {
  const icons = {
    Deadline:     "⏰",
    Verification: "✅",
    Announcement: "📢",
    Voting:       "🗳️",
    Results:      "🏆",
    Policy:       "📌",
    General:      "📰"
  };
  return icons[category] || "📢";
}

function getNoticeBadgeClass(category) {
  if (category === "Deadline" || category === "Voting")         return "notice-badge-danger";
  if (category === "Results"  || category === "Announcement")   return "notice-badge-gold";
  return "notice-badge-success";
}

function getUrgencyText(category) {
  if (category === "Deadline")     return "Action Needed";
  if (category === "Voting")       return "Voting Update";
  if (category === "Results")      return "Final Update";
  if (category === "Verification") return "Review Stage";
  if (category === "Announcement") return "Official Update";
  return "Information";
}