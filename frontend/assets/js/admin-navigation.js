/* =========================================================
   SmartCampus Election - Admin Navigation
   Correct admin-only version
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setupAdminNavigation();
});

const adminNavLinks = [
  {
    label: "Dashboard",
    href: "admin-dashboard.html",
    matchPages: ["admin-dashboard.html"]
  },
  {
    label: "Setup",
    href: "election-setup.html",
    matchPages: ["election-setup.html"]
  },
  {
    label: "Positions",
    href: "admin-positions.html",
    matchPages: ["admin-positions.html"]
  },
  {
    label: "Candidates",
    href: "admin-candidates.html",
    matchPages: ["admin-candidates.html"]
  },
  {
    label: "Voters",
    href: "admin-voters.html",
    matchPages: ["admin-voters.html"]
  },
  {
    label: "Ballot",
    href: "admin-ballot.html",
    matchPages: ["admin-ballot.html"]
  },
  {
    label: "Notices",
    href: "admin-notices.html",
    matchPages: ["admin-notices.html"]
  },
  {
    label: "Results",
    href: "admin-results.html",
    matchPages: ["admin-results.html"]
  },
  {
    label: "Messages",
    href: "admin-contact-messages.html",
    matchPages: ["admin-contact-messages.html"]
  },
  {
    label: "Audit",
    href: "admin-audit-log.html",
    matchPages: ["admin-audit-log.html"]
  }
];

const protectedAdminPages = [
  "admin-dashboard.html",
  "election-setup.html",
  "admin-positions.html",
  "admin-candidates.html",
  "admin-voters.html",
  "admin-ballot.html",
  "admin-notices.html",
  "admin-results.html",
  "admin-contact-messages.html",
  "admin-audit-log.html"
];

function setupAdminNavigation() {
  const currentPage = getCurrentAdminPageName();

  if (!protectedAdminPages.includes(currentPage)) return;

  const auth = getAdminAuth();

  if (!auth.isAdmin) {
    window.location.href = "login.html";
    return;
  }

  buildAdminTopNav();
  setupAdminLogout();
}

function getCurrentAdminPageName() {
  const path = window.location.pathname;
  return path.substring(path.lastIndexOf("/") + 1) || "admin-dashboard.html";
}

function getAdminAuth() {
  const token = localStorage.getItem("smartcampus_auth_token");
  const rawUser = localStorage.getItem("smartcampus_auth_user");

  if (!token || !rawUser) {
    return {
      isAdmin: false,
      user: null
    };
  }

  try {
    const user = JSON.parse(rawUser);
    const role = String(user.role || "").toLowerCase();

    if (role === "admin") {
      return {
        isAdmin: true,
        user
      };
    }

    return {
      isAdmin: false,
      user: null
    };
  } catch (error) {
    return {
      isAdmin: false,
      user: null
    };
  }
}

function isActiveAdminLink(item) {
  const currentPage = getCurrentAdminPageName();
  return item.matchPages.includes(currentPage);
}

function buildAdminTopNav() {
  const navMenu =
    document.querySelector("[data-admin-top-nav]") ||
    document.getElementById("navMenu");

  if (!navMenu) return;

  navMenu.classList.add("admin-top-nav");
  navMenu.setAttribute("data-admin-top-nav", "true");

  const navLinksHtml = adminNavLinks
    .map((item) => {
      const activeClass = isActiveAdminLink(item) ? "active" : "";

      return `
        <li>
          <a href="${item.href}" class="nav-link admin-top-link ${activeClass}">
            ${item.label}
          </a>
        </li>
      `;
    })
    .join("");

  navMenu.innerHTML = `
    ${navLinksHtml}
    <li>
      <button type="button" class="btn btn-sm btn-outline admin-logout-btn" id="adminLogoutBtn">
        Logout
      </button>
    </li>
  `;
}

function setupAdminLogout() {
  const logoutBtn = document.getElementById("adminLogoutBtn");

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("smartcampus_auth_token");
    localStorage.removeItem("smartcampus_auth_user");

    window.location.href = "login.html";
  });
}