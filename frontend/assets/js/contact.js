/* =========================================================
   SmartCampus Election - Contact Form JS
   Sends contact messages to backend + MongoDB
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setupContactForm();
});

function getContactValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function showContactModal(title, message) {
  if (typeof openModal === "function") {
    openModal(`<h2>${title}</h2><p>${message}</p>`);
  } else {
    alert(`${title}\n${message}`);
  }
}

function isContactEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setupContactForm() {
  const contactForm = document.getElementById("contactForm");

  if (!contactForm) return;

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector("button[type='submit']");

    const fullName = getContactValue("contactName");
    const email = getContactValue("contactEmail");
    const subject = getContactValue("contactSubject");
    const message = getContactValue("contactMessage");

    if (!fullName || !email || !subject || !message) {
      showContactModal("Missing Information", "Please fill in all contact form fields.");
      return;
    }

    if (!isContactEmailValid(email)) {
      showContactModal("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (message.length < 10) {
      showContactModal("Message Too Short", "Please write a message with at least 10 characters.");
      return;
    }

    const originalButtonText = submitButton ? submitButton.textContent : "";

    try {
      if (submitButton) {
        submitButton.textContent = "Sending Message...";
        submitButton.disabled = true;
      }

      const response = await apiRequest("/contact", {
        method: "POST",
        body: {
          fullName,
          email,
          subject,
          message
        }
      });

      showContactModal("Message Sent", response.message || "Your message has been sent successfully.");

      contactForm.reset();
    } catch (error) {
      showContactModal("Message Failed", error.message || "Could not send your message. Please try again.");
    } finally {
      if (submitButton) {
        submitButton.textContent = originalButtonText || "Send Message";
        submitButton.disabled = false;
      }
    }
  });
}