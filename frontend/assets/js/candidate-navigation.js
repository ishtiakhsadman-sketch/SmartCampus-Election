/* =========================================================
   SmartCampus Election - Candidate Navigation
   Top-navbar-only layout for candidate pages
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setupCandidateNavigation();
});

const candidateNavLinks = [
  {
    label: "Dashboard",
    href: "candidate-dashboard.html",
    matchPages: ["candidate-dashboard.html"]
  },
  {
    label: "Nomination",
    href: "nomination.html",
    matchPages: ["nomination.html"]
  },
  {
    label: "Manage Profile",
    href: "candidate-manage-profile.html",
    matchPages: ["candidate-manage-profile.html"]
  },
  {
    label: "Campaign Preview",
    href: "candidate-campaign.html",
    matchPages: ["candidate-campaign.html"]
  }
];

const protectedCandidatePages = [
  "candidate-dashboard.html",
  "nomination.html",
  "candidate-manage-profile.html",
  "candidate-campaign.html"
];

function setupCandidateNavigation() {
  const currentPage = getCurrentCandidatePageName();

  if (!protectedCandidatePages.includes(currentPage)) return;

  const auth = getCandidateAuth();

  if (!auth.isCandidate) {
    window.location.href = "login.html";
    return;
  }

  buildCandidateTopNav();
  setupCandidateLogout();
}

function getCurrentCandidatePageName() {
  const path = window.location.pathname;
  return path.substring(path.lastIndexOf("/") + 1) || "candidate-dashboard.html";
}

function getCandidateAuth() {
  const token = localStorage.getItem("smartcampus_auth_token");
  const rawUser = localStorage.getItem("smartcampus_auth_user");

  if (!token || !rawUser) {
    return {
      isCandidate: false,
      user: null
    };
  }

  try {
    const user = JSON.parse(rawUser);
    const role = String(user.role || "").toLowerCase();

    // "both" role users also have candidate privileges
    if (role === "candidate" || role === "both") {
      return {
        isCandidate: true,
        user
      };
    }

    return {
      isCandidate: false,
      user: null
    };
  } catch (error) {
    return {
      isCandidate: false,
      user: null
    };
  }
}

function isActiveCandidateLink(item) {
  const currentPage = getCurrentCandidatePageName();
  return item.matchPages.includes(currentPage);
}

function buildCandidateTopNav() {
  const navMenu =
    document.querySelector("[data-candidate-top-nav]") ||
    document.getElementById("navMenu");

  if (!navMenu) return;

  navMenu.classList.add("candidate-top-nav");
  navMenu.setAttribute("data-candidate-top-nav", "true");

  const navLinksHtml = candidateNavLinks
    .map((item) => {
      const activeClass = isActiveCandidateLink(item) ? "active" : "";

      return `
        <li>
          <a href="${item.href}" class="nav-link candidate-top-link ${activeClass}">
            ${item.label}
          </a>
        </li>
      `;
    })
    .join("");

  navMenu.innerHTML = `
    ${navLinksHtml}
    <li>
      <button type="button" class="btn btn-sm btn-outline candidate-logout-btn" id="candidateLogoutBtn">
        Logout
      </button>
    </li>
  `;
}

function setupCandidateLogout() {
  const logoutBtn = document.getElementById("candidateLogoutBtn");

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("smartcampus_auth_token");
    localStorage.removeItem("smartcampus_auth_user");

    window.location.href = "login.html";
  });
}