/* =========================================================
   SmartCampus Election - Admin Contact Messages
   Admin inbox + reply system
========================================================= */

let allContactMessages = [];
let selectedContactMessage = null;

document.addEventListener("DOMContentLoaded", () => {
  if (!requireLogin(["admin"])) return;

  setupAdminContactMessagesPage();
});

function setupAdminContactMessagesPage() {
  const refreshBtn = document.getElementById("refreshMessagesBtn");
  const searchInput = document.getElementById("messageSearchInput");
  const statusFilter = document.getElementById("messageStatusFilter");
  const clearBtn = document.getElementById("clearMessageFiltersBtn");
  const replyForm = document.getElementById("replyMessageForm");
  const replyCloseBtn = document.getElementById("replyModalClose");
  const markClosedBtn = document.getElementById("markClosedBtn");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadContactMessages);
  }

  if (searchInput) {
    searchInput.addEventListener("input", renderFilteredMessages);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", renderFilteredMessages);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      statusFilter.value = "all";
      renderFilteredMessages();
    });
  }

  if (replyForm) {
    replyForm.addEventListener("submit", handleSendReply);
  }

  if (replyCloseBtn) {
    replyCloseBtn.addEventListener("click", closeReplyModal);
  }

  if (markClosedBtn) {
    markClosedBtn.addEventListener("click", handleMarkClosed);
  }

  loadContactMessages();
}

async function loadContactMessages() {
  const list = document.getElementById("adminContactMessagesList");

  try {
    if (list) {
      list.innerHTML = `
        <article class="admin-contact-empty card">
          <h3>Loading messages...</h3>
          <p class="muted">Please wait while contact messages are loaded.</p>
        </article>
      `;
    }

    const data = await apiRequest("/admin/contact-messages");

    allContactMessages = Array.isArray(data.messages) ? data.messages : [];

    updateContactStats();
    renderFilteredMessages();
  } catch (error) {
    if (list) {
      list.innerHTML = `
        <article class="admin-contact-empty card">
          <h3>Could not load messages</h3>
          <p class="muted">${error.message}</p>
        </article>
      `;
    }

    showModalMessage("Load Failed", error.message);
  }
}

function updateContactStats() {
  const total = allContactMessages.length;
  const newCount = allContactMessages.filter((msg) => msg.status === "New").length;
  const repliedCount = allContactMessages.filter((msg) => msg.status === "Replied").length;
  const closedCount = allContactMessages.filter((msg) => msg.status === "Closed").length;

  setText("statTotalMessages", total);
  setText("statNewMessages", newCount);
  setText("statRepliedMessages", repliedCount);
  setText("statClosedMessages", closedCount);
}

function renderFilteredMessages() {
  const list = document.getElementById("adminContactMessagesList");
  const resultCount = document.getElementById("messageResultCount");
  const searchInput = document.getElementById("messageSearchInput");
  const statusFilter = document.getElementById("messageStatusFilter");

  if (!list) return;

  const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const selectedStatus = statusFilter ? statusFilter.value : "all";

  let filtered = [...allContactMessages];

  if (selectedStatus !== "all") {
    filtered = filtered.filter((msg) => msg.status === selectedStatus);
  }

  if (searchTerm) {
    filtered = filtered.filter((msg) => {
      return (
        String(msg.fullName || "").toLowerCase().includes(searchTerm) ||
        String(msg.email || "").toLowerCase().includes(searchTerm) ||
        String(msg.subject || "").toLowerCase().includes(searchTerm) ||
        String(msg.message || "").toLowerCase().includes(searchTerm)
      );
    });
  }

  if (resultCount) {
    resultCount.textContent = `Showing ${filtered.length} message${filtered.length === 1 ? "" : "s"}`;
  }

  if (!filtered.length) {
    list.innerHTML = `
      <article class="admin-contact-empty card">
        <div class="empty-icon">📭</div>
        <h3>No messages found</h3>
        <p class="muted">Try clearing filters or checking again later.</p>
      </article>
    `;
    return;
  }

  list.innerHTML = filtered.map(buildMessageCard).join("");

  document.querySelectorAll("[data-reply-id]").forEach((button) => {
    button.addEventListener("click", () => {
      openReplyModal(button.dataset.replyId);
    });
  });

  document.querySelectorAll("[data-read-id]").forEach((button) => {
    button.addEventListener("click", () => {
      updateMessageStatus(button.dataset.readId, "Read");
    });
  });
}

function buildMessageCard(message) {
  const statusClass = getStatusBadgeClass(message.status);
  const preview = shortenText(message.message, 140);
  const submittedDate = formatDate(message.createdAt);
  const repliedInfo = message.repliedAt
    ? `<p class="summary-muted"><strong>Replied:</strong> ${formatDate(message.repliedAt)}</p>`
    : "";

  return `
    <article class="card admin-contact-message-card ${message.status === "New" ? "new-message-card" : ""} ${message.status === "Closed" ? "closed-message-card" : ""}">
      <div class="admin-contact-card-top">
        <div>
          <span class="badge ${statusClass}">${message.status || "New"}</span>
          <h3>${escapeHtml(message.subject)}</h3>
          <p class="summary-muted">
            From <strong>${escapeHtml(message.fullName)}</strong> &lt;${escapeHtml(message.email)}&gt;
          </p>
        </div>

        <div class="admin-contact-date">
          <span>${submittedDate}</span>
        </div>
      </div>

      <p>${escapeHtml(preview)}</p>

      ${message.adminReply ? `
        <div class="admin-reply-preview">
          <strong>Admin Reply:</strong>
          <p>${escapeHtml(shortenText(message.adminReply, 120))}</p>
        </div>
      ` : ""}

      ${repliedInfo}

      <div class="admin-contact-actions">
        <button type="button" class="btn btn-primary" data-reply-id="${message._id}">
          View / Reply
        </button>

        ${message.status === "New" ? `
          <button type="button" class="btn btn-outline" data-read-id="${message._id}">
            Mark Read
          </button>
        ` : ""}
      </div>
    </article>
  `;
}

function openReplyModal(messageId) {
  selectedContactMessage = allContactMessages.find((msg) => msg._id === messageId);

  if (!selectedContactMessage) {
    showModalMessage("Message Missing", "Could not find this contact message.");
    return;
  }

  setText("replyMessageId", selectedContactMessage._id, true);
  setText("replyModalSubject", selectedContactMessage.subject);
  setText("replySenderName", selectedContactMessage.fullName);
  setText("replySenderEmail", selectedContactMessage.email);
  setText("replySubmittedDate", formatDate(selectedContactMessage.createdAt));
  setText("replyOriginalMessage", selectedContactMessage.message);
  setText("replyMessageStatus", selectedContactMessage.status);

  const replyText = document.getElementById("adminReplyText");
  if (replyText) {
    replyText.value = selectedContactMessage.adminReply || "";
  }

  const modal = document.getElementById("replyMessageModal");
  if (modal) {
    modal.classList.add("show");
  }
}

function closeReplyModal() {
  const modal = document.getElementById("replyMessageModal");
  if (modal) {
    modal.classList.remove("show");
  }
}

async function handleSendReply(event) {
  event.preventDefault();

  const messageId = document.getElementById("replyMessageId").value;
  const adminReply = document.getElementById("adminReplyText").value.trim();
  const sendReplyBtn = document.getElementById("sendReplyBtn");

  if (!messageId) {
    showModalMessage("Missing Message", "No message selected for reply.");
    return;
  }

  if (!adminReply || adminReply.length < 3) {
    showModalMessage("Reply Required", "Please write a reply before sending.");
    return;
  }

  const originalText = sendReplyBtn ? sendReplyBtn.textContent : "Send Reply";

  try {
    if (sendReplyBtn) {
      sendReplyBtn.disabled = true;
      sendReplyBtn.textContent = "Sending Reply...";
    }

    const data = await apiRequest(`/admin/contact-messages/${messageId}/reply`, {
      method: "PATCH",
      body: { adminReply }
    });

    closeReplyModal();
    showModalMessage("Reply Sent", data.message || "Reply sent successfully.");

    await loadContactMessages();
  } catch (error) {
    showModalMessage("Reply Failed", error.message);
  } finally {
    if (sendReplyBtn) {
      sendReplyBtn.disabled = false;
      sendReplyBtn.textContent = originalText;
    }
  }
}

async function handleMarkClosed() {
  const messageId = document.getElementById("replyMessageId").value;

  if (!messageId) {
    showModalMessage("Missing Message", "No message selected.");
    return;
  }

  await updateMessageStatus(messageId, "Closed");
  closeReplyModal();
}

async function updateMessageStatus(messageId, status) {
  try {
    await apiRequest(`/admin/contact-messages/${messageId}/status`, {
      method: "PATCH",
      body: { status }
    });

    showModalMessage("Status Updated", `Message marked as ${status}.`);
    await loadContactMessages();
  } catch (error) {
    showModalMessage("Status Update Failed", error.message);
  }
}

function setText(id, value, isValue = false) {
  const element = document.getElementById(id);
  if (!element) return;

  if (isValue) {
    element.value = value || "";
  } else {
    element.textContent = value || "-";
  }
}

function getStatusBadgeClass(status) {
  if (status === "New") return "badge-danger";
  if (status === "Read") return "badge-gold";
  if (status === "Replied") return "badge-success";
  if (status === "Closed") return "badge-muted";
  return "badge-success";
}

function formatDate(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
}

function shortenText(text, maxLength) {
  const clean = String(text || "");

  if (clean.length <= maxLength) return clean;

  return `${clean.slice(0, maxLength)}...`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showModalMessage(title, message) {
  if (typeof openModal === "function") {
    openModal(`<h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>`);
  } else {
    alert(`${title}\n${message}`);
  }
}