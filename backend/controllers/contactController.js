const mongoose = require("mongoose");
const ContactMessage = require("../models/ContactMessage");

const {
  sendContactNotificationEmail,
  sendContactReplyEmail
} = require("../utils/emailService");

function cleanText(value) {
  return String(value || "").trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* Public contact form submission */
exports.submitContactMessage = async (req, res) => {
  try {
    const fullName = cleanText(req.body.fullName);
    const email = cleanText(req.body.email).toLowerCase();
    const subject = cleanText(req.body.subject);
    const message = cleanText(req.body.message);

    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, subject, and message are required"
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address"
      });
    }

    if (message.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Message should be at least 10 characters long"
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message is too long. Please keep it under 2000 characters"
      });
    }

    const savedMessage = await ContactMessage.create({
      fullName,
      email,
      subject,
      message
    });

    let emailNotificationSent = false;

    try {
      await sendContactNotificationEmail(savedMessage);
      emailNotificationSent = true;
    } catch (emailError) {
      console.error("Contact notification email failed:", emailError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Your message has been sent successfully.",
      data: {
        id: savedMessage._id,
        status: savedMessage.status,
        emailNotificationSent
      }
    });
  } catch (error) {
    console.error("Submit contact message error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not send your message. Please try again."
    });
  }
};

/* Admin: get all messages */
exports.getAllContactMessages = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    const messages = await ContactMessage.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    console.error("Get contact messages error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not load contact messages"
    });
  }
};

/* Admin: reply to user */
exports.replyToContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const adminReply = cleanText(req.body.adminReply);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID"
      });
    }

    if (!adminReply || adminReply.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Reply message is required"
      });
    }

    const contactMessage = await ContactMessage.findById(id);

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found"
      });
    }

    contactMessage.adminReply = adminReply;
    contactMessage.status = "Replied";
    contactMessage.repliedAt = new Date();

    await contactMessage.save();

    try {
      await sendContactReplyEmail(contactMessage);

      return res.json({
        success: true,
        message: "Reply sent successfully.",
        data: {
          id: contactMessage._id,
          status: contactMessage.status,
          replyEmailSent: true
        }
      });
    } catch (emailError) {
      console.error("Reply email failed:", emailError.message);

      return res.json({
        success: true,
        message: "Reply saved, but email could not be sent.",
        data: {
          id: contactMessage._id,
          status: contactMessage.status,
          replyEmailSent: false
        }
      });
    }
  } catch (error) {
    console.error("Reply contact message error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not send reply. Please try again."
    });
  }
};

/* Admin: update message status */
exports.updateContactMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = cleanText(req.body.status);

    const allowedStatuses = ["New", "Read", "Replied", "Closed"];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID"
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const contactMessage = await ContactMessage.findById(id);

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found"
      });
    }

    contactMessage.status = status;
    await contactMessage.save();

    return res.json({
      success: true,
      message: "Message status updated successfully.",
      data: {
        id: contactMessage._id,
        status: contactMessage.status
      }
    });
  } catch (error) {
    console.error("Update contact status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not update message status"
    });
  }
};