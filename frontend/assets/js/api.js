/* =========================================================
   SmartCampus Election - API Helper
   Connects frontend pages with the Express backend API
========================================================= */

const API_BASE_URL = window.SMARTCAMPUS_API_BASE_URL || "http://localhost:5001/api";
const AUTH_TOKEN_KEY = "smartcampus_auth_token";
const AUTH_USER_KEY = "smartcampus_auth_user";

function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function saveAuthSession(data) {
  if (data.token) localStorage.setItem(AUTH_TOKEN_KEY, data.token);
  if (data.user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
}

function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = { ...(options.headers || {}) };

  // Only set Content-Type to JSON if body is not FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  } else if (!options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body: (options.body && !(options.body instanceof FormData)) ? JSON.stringify(options.body) : options.body
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Global 401 handler — stale/invalid token → force re-login
    if (response.status === 401) {
      clearAuthSession();
      window.location.href = "login.html";
      throw new Error(data.message || "Unauthorized");
    }
    throw new Error(data.message || "API request failed");
  }

  return data;
}

function redirectByRole(role) {
  if (role === "admin") window.location.href = "admin-dashboard.html";
  else if (role === "both") {
    const loginAs = localStorage.getItem("smartcampus_login_as");
    if (loginAs === "student") window.location.href = "student-dashboard.html";
    else window.location.href = "candidate-dashboard.html";
  }
  else if (role === "candidate") window.location.href = "candidate-dashboard.html";
  else window.location.href = "student-dashboard.html";
}

function requireLogin(allowedRoles = []) {
  const user = getAuthUser();
  const token = getAuthToken();

  if (!token || !user) {
    window.location.href = "login.html";
    return false;
  }

  if (allowedRoles.length) {
    // "both" role satisfies either "student" or "candidate" requirements
    const userRole = user.role;
    const hasAccess =
      allowedRoles.includes(userRole) ||
      (userRole === "both" && (allowedRoles.includes("student") || allowedRoles.includes("candidate")));
    if (!hasAccess) {
      redirectByRole(userRole);
      return false;
    }
  }

  return true;
}

/* =========================================================
   Candidate Photo Upload Helpers
========================================================= */

async function uploadCandidateProfilePhoto(file) {
  const formData = new FormData();
  formData.append("photo", file);

  return apiRequest("/candidate/profile-photo", {
    method: "PUT",
    body: formData
  });
}

async function uploadCandidateGalleryPhotos(files) {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("photos", files[i]);
  }

  return apiRequest("/candidate/gallery", {
    method: "POST",
    body: formData
  });
}

async function deleteCandidateGalleryPhoto(photoId) {
  return apiRequest(`/candidate/gallery/${photoId}`, {
    method: "DELETE"
  });
}

/* =========================================================
   Shared Navbar Auth Renderer
   Call renderPublicNavAuth() on any public page so the
   Login/Register buttons swap out for a user badge when
   a valid session token exists.
========================================================= */

function getInitials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join("").slice(0, 2);
}

function getDashboardLink(role) {
  if (role === "admin") return "admin-dashboard.html";
  if (role === "both") {
    const loginAs = localStorage.getItem("smartcampus_login_as");
    if (loginAs === "student") return "student-dashboard.html";
    return "candidate-dashboard.html";
  }
  if (role === "candidate") return "candidate-dashboard.html";
  return "student-dashboard.html";
}

function renderPublicNavAuth() {
  const navMenu = document.getElementById("navMenu");
  if (!navMenu) return;

  // Find and remove hardcoded or previously injected auth items
  const authItems = navMenu.querySelectorAll("li:has(a[href='login.html']), li:has(a[href='register.html']), .dynamic-auth-item");
  authItems.forEach(el => el.remove());

  const user  = getAuthUser();
  const token = getAuthToken();

  if (token && user) {
    const initials     = getInitials(user.studentName || user.name || user.email || "");
    const displayName  = (user.studentName || user.name || user.email || "User").split(" ")[0];
    const dashLink     = getDashboardLink(user.role);

    const li = document.createElement("li");
    li.className = "dynamic-auth-item";
    li.innerHTML = `
      <div class="nav-user-badge" style="display:flex;align-items:center;gap:12px;">
        <a href="${dashLink}" style="
          display:inline-flex; align-items:center; gap:8px;
          padding:5px 14px 5px 5px; border-radius:999px;
          border:2px solid #d4af37; background:#ffffff;
          color:#0f4f2d; font-size:0.95rem; font-weight:800;
          text-decoration:none; transition:0.25s ease;
        " onmouseover="this.style.background='#e8f5ee';this.style.transform='translateY(-1px)';"
           onmouseout="this.style.background='#ffffff';this.style.transform='none';">
          <span style="
            width:32px; height:32px; border-radius:50%;
            background:linear-gradient(135deg, #146b3a, #c62828);
            color:#ffffff; font-weight:900; font-size:0.78rem;
            display:inline-grid; place-items:center; flex-shrink:0;
            box-shadow: 0 4px 10px rgba(20, 107, 58, 0.2);
          ">${initials}</span>
          <span>${displayName}</span>
        </a>
        <button onclick="logoutUser()" style="
          padding:8px 16px; border-radius:999px; border:1.5px solid #c62828;
          color:#c62828; background:transparent; font-weight:700; font-size:0.85rem;
          cursor:pointer; transition:all 0.2s; min-height: 40px;
        " onmouseover="this.style.background='#c62828';this.style.color='#fff';"
           onmouseout="this.style.background='transparent';this.style.color='#c62828';">
          Logout
        </button>
      </div>
    `;
    navMenu.appendChild(li);
  } else {
    // Guest: restore Login + Register buttons
    const loginLi = document.createElement("li");
    loginLi.className = "dynamic-auth-item";
    loginLi.innerHTML = `<a href="login.html" class="btn btn-sm btn-outline btn-modern">Login</a>`;
    const registerLi = document.createElement("li");
    registerLi.className = "dynamic-auth-item";
    registerLi.innerHTML = `<a href="register.html" class="btn btn-sm btn-primary btn-modern">Register</a>`;
    navMenu.appendChild(loginLi);
    navMenu.appendChild(registerLi);
  }
}

function logoutUser() {
  clearAuthSession();
  window.location.href = "login.html";
}
