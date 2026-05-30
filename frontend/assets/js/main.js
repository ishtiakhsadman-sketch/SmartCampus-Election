/* =========================================================
   SmartCampus Election - Main JS
   Handles:
   - Mobile menu
   - Active nav state
   - Countdown timer
   - FAQ accordion
   - Reusable modal logic
   - Home page previews
   - Position cards
   - Timeline rendering
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  setActiveNav();
  setupCountdown();
  setupFAQ();
  renderHomeNoticePreview();
  renderTimelinePreview();
  setupPasswordToggles();

  // Render auth navbar state (logged-in badge vs guest Login/Register)
  if (typeof renderPublicNavAuth === "function") renderPublicNavAuth();

  // Auto-refresh home notices every 15s
  setInterval(() => {
    if (document.getElementById("noticePreview")) {
      renderHomeNoticePreview();
    }
  }, 15000);

  renderFullTimeline();
  renderPositions();
  setupModal();
});

/* Mobile menu */
function setupMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu");

  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
      navMenu.classList.toggle("show");
    });
  }
}

/* Active nav state */
function setActiveNav() {
  const currentPage = document.body.getAttribute("data-page");
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");

    if (
      (currentPage === "index" && href === "index.html") ||
      (currentPage === "about" && href === "about.html") ||
      (currentPage === "positions" && href === "positions.html") ||
      (currentPage === "candidates" && href === "candidates.html") ||
      (currentPage === "candidate-profile" && href === "candidates.html") ||
      (currentPage === "schedule" && href === "schedule.html") ||
      (currentPage === "notices" && href === "notices.html") ||
      (currentPage === "faq" && href === "faq.html") ||
      (currentPage === "contact" && href === "contact.html")
    ) {
      link.classList.add("active");
    }
  });
}

/* Countdown timer */
function setupCountdown() {
  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  // Start with default target
  let targetDate = new Date("May 24, 2026 17:30:00").getTime();

  // Fetch from backend non-blocking
  const API_URL = window.API_BASE_URL || "http://localhost:5001/api";
  fetch(`${API_URL}/election-setup`)
    .then(res => res.json())
    .then(data => {
      // Optional: if data.setup contains a real countdown date, you could parse it here and update targetDate
      // e.g. if (data.setup && data.setup.resultsPublishDate) targetDate = new Date(...).getTime();
    })
    .catch(e => { /* ignore */ });

  function updateCountdown() {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    daysEl.textContent = String(days).padStart(2, "0");
    hoursEl.textContent = String(hours).padStart(2, "0");
    minutesEl.textContent = String(minutes).padStart(2, "0");
    secondsEl.textContent = String(seconds).padStart(2, "0");
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

/* FAQ accordion */
function setupFAQ() {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");

    question.addEventListener("click", () => {
      item.classList.toggle("active");
    });
  });
}

/* Reusable modal logic */
function setupModal() {
  const modal = document.getElementById("globalModal");
  const modalClose = document.getElementById("modalClose");

  if (!modal || !modalClose) return;

  modalClose.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
}

function openModal(content) {
  const modal = document.getElementById("globalModal");
  const modalBody = document.getElementById("modalBody");

  if (modal && modalBody) {
    modalBody.innerHTML = content;
    modal.classList.add("show");
  }
}

function closeModal() {
  const modal = document.getElementById("globalModal");
  if (modal) {
    modal.classList.remove("show");
  }
}

/* Home Notice Preview */
async function renderHomeNoticePreview() {
  const previewContainer = document.getElementById("noticePreview");
  if (!previewContainer) return;
  await loadLatestElectionNotices("noticePreview", 3);
}

/* Global Shared Notice Loader */
window.loadLatestElectionNotices = async function (containerId, limit = 3) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const API_URL = window.API_BASE_URL || "http://localhost:5001/api";
    const res = await fetch(`${API_URL}/public/notices?_=${Date.now()}`, { cache: "no-store" });
    const data = await res.json();

    if (data.success && data.notices) {
      if (data.notices.length === 0) {
        container.innerHTML = '<p style="padding: 1rem; color: var(--text-muted);">No recent notices available.</p>';
        return;
      }

      const latestNotices = data.notices.slice(0, limit);

      // Determine if we are rendering in the dashboard widget row style or home card style
      if (container.classList.contains("dashboard-widget-list")) {
        container.innerHTML = latestNotices.map((notice) => `
          <article class="widget-row">
            <div>
              <span class="badge badge-danger">${notice.category || 'General'}</span>
              <h3>${notice.title}</h3>
              <p class="muted">${new Date(notice.createdAt || notice.date).toLocaleDateString()}</p>
            </div>
            <a href="notices.html" class="btn btn-sm btn-outline">Details</a>
          </article>
        `).join("");
      } else {
        container.innerHTML = latestNotices.map((notice) => `
          <article class="card">
            <span class="badge badge-danger">${notice.category || 'General'}</span>
            <h3>${notice.title}</h3>
            <p class="muted">${new Date(notice.createdAt || notice.date).toLocaleDateString()}</p>
            <p>${notice.summary || ''}</p>
            <a href="notices.html" class="text-link">Read More</a>
          </article>
        `).join("");
      }
    }
  } catch (err) {
    console.error("Error loading notices:", err);
    container.innerHTML = '<p style="padding: 1rem; color: var(--text-muted);">Failed to load notices.</p>';
  }
};
/* Timeline Preview */
function renderTimelinePreview() {
  const previewContainer = document.getElementById("timelinePreview");
  if (!previewContainer || typeof electionTimeline === "undefined") return;

  const preview = electionTimeline.slice(0, 4);

  previewContainer.innerHTML = preview
    .map(
      (item) => `
      <article class="timeline-item">
        <div class="timeline-date">${item.date}</div>
        <div>
          <h3>${item.stage}</h3>
          <p>${item.description}</p>
        </div>
      </article>
    `
    )
    .join("");
}

/* Full Timeline */
function renderFullTimeline() {
  const fullTimeline = document.getElementById("fullTimeline");
  if (!fullTimeline || typeof electionTimeline === "undefined") return;

  fullTimeline.innerHTML = electionTimeline
    .map(
      (item) => `
      <article class="timeline-item">
        <div class="timeline-date">${item.date}</div>
        <div>
          <h3>${item.stage}</h3>
          <p>${item.description}</p>
        </div>
      </article>
    `
    )
    .join("");
}

/* Positions Rendering */
async function renderPositions() {
  const positionsGrid = document.getElementById("positionsGrid");
  if (!positionsGrid) return;

  try {
    const res = await apiRequest("/positions");
    if (res.success && res.positions) {
      positionsGrid.innerHTML = res.positions
        .map(
          (position) => `
          <article class="card">
            <span class="badge badge-gold">${position.seats} Seat${position.seats > 1 ? "s" : ""}</span>
            <h3>${position.title}</h3>
            <p>${position.responsibility}</p>
            <p><strong>Candidate Count:</strong> ${position.candidateCount || 0}</p>
            <a href="candidates.html?position=${encodeURIComponent(position.title)}" class="btn btn-outline">View Candidates</a>
          </article>
        `
        )
        .join("");
    }
  } catch (error) {
    positionsGrid.innerHTML = `<p style="color:red; text-align:center;">Failed to load positions</p>`;
  }
}

/* Password Visibility Toggles */
function setupPasswordToggles() {
  const passwordInputs = document.querySelectorAll('input[type="password"]');

  passwordInputs.forEach(input => {
    // Avoid double wrapping if this setup function is invoked multiple times
    if (input.parentElement.classList.contains('password-container')) return;

    // Create a beautiful modern wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'password-container';

    // Insert wrapper in the DOM before the input field
    input.parentNode.insertBefore(wrapper, input);

    // Move input field into our wrapper
    wrapper.appendChild(input);

    // Create dynamic toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'password-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle password visibility');

    // Clean inline SVGs for eye representation (feather/heroicons style)
    const eyeOpenSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.76 8.5 7.378 6 12 6c4.622 0 8.24 2.5 9.964 5.678c.08.149.08.328 0 .477C20.24 15.5 16.622 18 12 18c-4.622 0-8.24-2.5-9.964-5.678z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    `;

    const eyeClosedSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.895 7.895L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    `;

    // Set initial icon state to eyeClosed (since default input type is password)
    toggleBtn.innerHTML = eyeClosedSvg;
    wrapper.appendChild(toggleBtn);

    // Dynamic visibility toggle handler
    toggleBtn.addEventListener('click', () => {
      if (input.type === 'password') {
        input.type = 'text';
        toggleBtn.innerHTML = eyeOpenSvg;
        toggleBtn.setAttribute('aria-label', 'Hide password');
      } else {
        input.type = 'password';
        toggleBtn.innerHTML = eyeClosedSvg;
        toggleBtn.setAttribute('aria-label', 'Show password');
      }
    });
  });
}