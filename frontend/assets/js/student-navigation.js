/* =========================================================
   SmartCampus Election - Student Portal Navigation
   FIXED with private scope to avoid conflict with candidates.js / ballot.js

   Problem fixed:
   candidates.js or ballot.js may also have getInitials().
   This file now uses private function names inside an IIFE.
========================================================= */

(() => {
  document.addEventListener("DOMContentLoaded", () => {
    setupStudentNavigation();
  });

  const studentNavLinks = [
    {
      label: "Dashboard",
      href: "student-dashboard.html",
      matchPages: ["student-dashboard.html"]
    },
    {
      label: "Candidates",
      href: "student-candidates.html",
      matchPages: ["student-candidates.html", "student-candidate-profile.html"]
    },
    {
      label: "Cast Vote",
      href: "ballot.html",
      matchPages: ["ballot.html", "vote-success.html"]
    },
    {
      label: "Review Ballot",
      href: "review-ballot.html",
      matchPages: ["review-ballot.html"]
    },
    {
      label: "Results",
      href: "results.html",
      matchPages: ["results.html"]
    },
    {
      label: "Profile",
      href: "student-profile.html",
      matchPages: ["student-profile.html"]
    }
  ];

  const protectedStudentPages = [
    "student-dashboard.html",
    "student-profile.html",
    "ballot.html",
    "review-ballot.html",
    "vote-success.html",
    "results.html",
    "student-candidates.html",
    "student-candidate-profile.html"
  ];

  function setupStudentNavigation() {
    const currentPage = getCurrentPageName();

    if (!protectedStudentPages.includes(currentPage)) return;

    const auth = getStudentAuth();

    if (!auth.isStudent) {
      window.location.href = "login.html";
      return;
    }

    buildStudentNavbar(auth.user);
    setupStudentAccountDropdown();
  }

  function getCurrentPageName() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf("/") + 1) || "student-dashboard.html";
  }

  function getStudentAuth() {
    const token = localStorage.getItem("smartcampus_auth_token");
    const rawUser = localStorage.getItem("smartcampus_auth_user");

    if (!token || !rawUser) {
      return {
        isStudent: false,
        user: null
      };
    }

    try {
      const parsedUser = JSON.parse(rawUser);
      const role = String(parsedUser.role || "").toLowerCase();

      // "both" role users have student privileges too
      if (role === "student" || role === "candidate" || role === "both") {
        return {
          isStudent: true,
          user: parsedUser
        };
      }

      return {
        isStudent: false,
        user: null
      };
    } catch (error) {
      return {
        isStudent: false,
        user: null
      };
    }
  }

  function isActiveStudentLink(item) {
    const currentPage = getCurrentPageName();
    return item.matchPages.includes(currentPage);
  }

  function buildStudentNavbar(user) {
    const navMenu =
      document.querySelector("[data-student-top-nav]") ||
      document.getElementById("navMenu");

    if (!navMenu) return;

    navMenu.classList.add("student-top-nav");
    navMenu.setAttribute("data-student-top-nav", "true");

    const navLinksHtml = studentNavLinks
      .map((item) => {
        const activeClass = isActiveStudentLink(item) ? "active" : "";

        return `
          <li>
            <a href="${item.href}" class="nav-link student-top-link ${activeClass}">
              ${item.label}
            </a>
          </li>
        `;
      })
      .join("");

    navMenu.innerHTML = `
      ${navLinksHtml}
      <li class="student-account-nav-item">
        ${buildAccountDropdown(user)}
      </li>
    `;
  }

  function buildAccountDropdown(user) {
    const fullName = getStudentDisplayName(user);
    const firstName = getStudentFirstName(user);
    const initials = getStudentInitials(user);
    const role = String((user && user.role) || "").toLowerCase();
    const accountLabel = role === "both" ? "Student &amp; Candidate" : "Student Account";

    return `
      <div class="student-account-wrap" id="studentAccountWrap">
        <button
          type="button"
          class="student-account-btn"
          id="studentAccountBtn"
          aria-expanded="false"
          aria-label="Open student account menu"
        >
          <span class="student-avatar">${escapeStudentHtml(initials)}</span>
          <span class="student-account-name">${escapeStudentHtml(firstName)}</span>
          <span class="student-account-arrow">▾</span>
        </button>

        <div class="student-account-dropdown" id="studentAccountDropdown">
          <div class="student-account-info">
            <span class="student-avatar large">${escapeStudentHtml(initials)}</span>
            <div>
              <strong>${escapeStudentHtml(fullName)}</strong>
              <small>${accountLabel}</small>
            </div>
          </div>

          <a href="student-profile.html" class="student-dropdown-link">
            View Profile
          </a>

          <a href="student-dashboard.html" class="student-dropdown-link">
            Dashboard
          </a>

          ${role === "both" ? `<a href="candidate-dashboard.html" class="student-dropdown-link">Candidate Dashboard</a>` : ""}

          <button type="button" class="student-dropdown-link danger" id="studentLogoutBtn">
            Logout
          </button>
        </div>
      </div>
    `;
  }

  function setupStudentAccountDropdown() {
    const accountBtn = document.getElementById("studentAccountBtn");
    const accountWrap = document.getElementById("studentAccountWrap");
    const logoutBtn = document.getElementById("studentLogoutBtn");

    if (!accountBtn || !accountWrap) return;

    accountBtn.addEventListener("click", (event) => {
      event.stopPropagation();

      const isOpen = accountWrap.classList.toggle("open");
      accountBtn.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
      if (!accountWrap.contains(event.target)) {
        closeStudentDropdown();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeStudentDropdown();
      }
    });

    document.querySelectorAll(".student-top-link").forEach((link) => {
      link.addEventListener("click", closeStudentDropdown);
    });

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        // Clear auth
        const rawUser = localStorage.getItem("smartcampus_auth_user");
        let userId = null;

        try {
          const u = JSON.parse(rawUser || "null");
          if (u) userId = String(u._id || u.id || "").trim() || null;
        } catch (e) { /* ignore */ }

        localStorage.removeItem("smartcampus_auth_token");
        localStorage.removeItem("smartcampus_auth_user");
        localStorage.removeItem("smartcampus_login_as");

        // Clear old global (non-scoped) vote keys
        localStorage.removeItem("smartcampus_vote_submitted");
        localStorage.removeItem("smartcampus_vote_timestamp");
        localStorage.removeItem("smartcampus_ballot_selections");

        // Clear per-student scoped vote keys for this user
        if (userId) {
          localStorage.removeItem(`smartcampus_vote_submitted_${userId}`);
          localStorage.removeItem(`smartcampus_vote_timestamp_${userId}`);
          localStorage.removeItem(`smartcampus_ballot_selections_${userId}`);
        }

        window.location.href = "login.html";
      });
    }
  }

  function closeStudentDropdown() {
    const accountWrap = document.getElementById("studentAccountWrap");
    const accountBtn = document.getElementById("studentAccountBtn");

    if (accountWrap) {
      accountWrap.classList.remove("open");
    }

    if (accountBtn) {
      accountBtn.setAttribute("aria-expanded", "false");
    }
  }

  /* =========================================================
     Private Name + Initials Functions
     These cannot be overwritten by candidates.js or ballot.js
  ========================================================= */

  function normalizeStudentNameValue(value) {
    if (typeof value !== "string") {
      return "";
    }

    const cleaned = value.trim();

    if (!cleaned) {
      return "";
    }

    const lowerCleaned = cleaned.toLowerCase();

    if (
      cleaned === "[object Object]" ||
      lowerCleaned.includes("[object object]") ||
      cleaned.startsWith("[") ||
      cleaned === "undefined" ||
      cleaned === "null"
    ) {
      return "";
    }

    return cleaned;
  }

  function getStudentDisplayName(user) {
    if (!user || typeof user !== "object") {
      return "Student";
    }

    const nameFields = [
      user.fullName,
      user.studentName,
      user.name,
      user.username
    ];

    for (const field of nameFields) {
      const cleanName = normalizeStudentNameValue(field);

      if (cleanName) {
        return cleanName;
      }
    }

    const cleanEmail = normalizeStudentNameValue(user.email);

    if (cleanEmail) {
      return cleanEmail.split("@")[0];
    }

    return "Student";
  }

  function getStudentFirstName(user) {
    const displayName = getStudentDisplayName(user);

    if (displayName.includes("@")) {
      return displayName.split("@")[0];
    }

    return displayName.split(/\s+/)[0] || "Student";
  }

  function getStudentInitials(user) {
    const displayName = getStudentDisplayName(user);

    const cleanForInitials = displayName
      .replace(/[^a-zA-Z\s]/g, " ")
      .trim();

    if (!cleanForInitials) {
      return "ST";
    }

    const words = cleanForInitials
      .split(/\s+/)
      .filter(Boolean);

    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
    }

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return "ST";
  }

  function escapeStudentHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();