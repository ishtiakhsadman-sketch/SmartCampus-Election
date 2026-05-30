const nodemailer = require("nodemailer");

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createEmailTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS is missing in .env");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

async function sendContactNotificationEmail(contactMessage) {
  const transporter = createEmailTransporter();

  const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL || process.env.EMAIL_USER;

  await transporter.sendMail({
    from: `"SmartCampus Election" <${process.env.EMAIL_USER}>`,
    to: receiverEmail,
    replyTo: contactMessage.email,
    subject: `New Contact Message: ${contactMessage.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #172033;">
        <h2 style="color: #146b3a;">New SmartCampus Contact Message</h2>

        <p><strong>Sender Name:</strong> ${escapeHtml(contactMessage.fullName)}</p>
        <p><strong>Sender Email:</strong> ${escapeHtml(contactMessage.email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(contactMessage.subject)}</p>
        <p><strong>Submitted At:</strong> ${new Date(contactMessage.createdAt).toLocaleString()}</p>

        <hr />

        <h3>Message</h3>
        <p>${escapeHtml(contactMessage.message)}</p>

        <hr />

        <p style="font-size: 13px; color: #64748b;">
          SmartCampus Election Contact Form
        </p>
      </div>
    `
  });
}

async function sendContactReplyEmail(contactMessage) {
  const transporter = createEmailTransporter();

  await transporter.sendMail({
    from: `"SmartCampus Election Office" <${process.env.EMAIL_USER}>`,
    to: contactMessage.email,
    subject: `Reply from SmartCampus Election Office: ${contactMessage.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #172033;">
        <h2 style="color: #146b3a;">SmartCampus Election Office Reply</h2>

        <p>Hello ${escapeHtml(contactMessage.fullName)},</p>

        <p>The election office has replied to your message.</p>

        <h3>Your Original Subject</h3>
        <p>${escapeHtml(contactMessage.subject)}</p>

        <h3>Your Original Message</h3>
        <p>${escapeHtml(contactMessage.message)}</p>

        <h3>Election Office Reply</h3>
        <p>${escapeHtml(contactMessage.adminReply)}</p>

        <hr />

        <p style="font-size: 13px; color: #64748b;">
          SmartCampus Election Office<br>
          Bangladesh University of Professionals
        </p>
      </div>
    `
  });
}

module.exports = {
  createEmailTransporter,
  sendContactNotificationEmail,
  sendContactReplyEmail
};