/* =========================================================
   SmartCampus Election — Page Transitions
   - Creates a red-green loading overlay on DOM ready
   - Fades in the overlay before navigating to internal links
========================================================= */

(function () {
  "use strict";

  /* ── 1. Create Overlay ───────────────────────────────── */
  function createOverlay() {
    if (document.querySelector(".page-transition-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "page-transition-overlay";
    overlay.setAttribute("aria-hidden", "true");
    
    const textSpan = document.createElement("span");
    textSpan.className = "page-transition-text";
    textSpan.textContent = "Loading";
    
    overlay.appendChild(textSpan);
    document.body.appendChild(overlay);
  }

  /* ── 2. Page LEAVE animation (then navigate) ─────────── */
  function playLeave(destination) {
    let overlay = document.querySelector(".page-transition-overlay");
    if (!overlay) {
      createOverlay();
      overlay = document.querySelector(".page-transition-overlay");
    }

    if (!overlay) {
      window.location.href = destination;
      return;
    }

    // Fade overlay in
    overlay.classList.add("active");

    // After fade completes, navigate
    let navigated = false;
    const triggerNav = () => {
      if (!navigated) {
        navigated = true;
        window.location.href = destination;
      }
    };

    overlay.addEventListener("transitionend", triggerNav, { once: true });
    setTimeout(triggerNav, 400);
  }

  /* ── 3. Intercept all internal <a> clicks ────────────── */
  function interceptLinks() {
    document.addEventListener("click", function (e) {
      // Walk up the DOM in case click was on a child element
      const anchor = e.target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip: external links, mailto, tel, hash-only, download
      const isExternal =
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        anchor.hasAttribute("download") ||
        anchor.getAttribute("target") === "_blank";

      if (isExternal) return;

      // Skip if modifier key held (open in new tab etc.)
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      playLeave(href);
    });
  }

  /* ── 4. Boot ─────────────────────────────────────────── */
  // Run as soon as the DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    createOverlay();
    // Ensure overlay is hidden on load
    const overlay = document.querySelector(".page-transition-overlay");
    if (overlay) {
      overlay.classList.remove("active");
    }
    interceptLinks();
  }
})();
