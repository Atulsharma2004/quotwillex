import { sendContactEmail, isContactMailConfigured } from "../utils/mail.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s()-]{6,20}$/;

export const getContactStatus = (_req, res) => {
  res.json({
    configured: isContactMailConfigured(),
  });
};

export const submitContact = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const message = String(req.body.message || "").trim();

    if (!name || name.length < 2 || name.length > 80) {
      return res
        .status(400)
        .json({ message: "Please enter your name (2–80 characters)." });
    }
    if (!EMAIL_RE.test(email) || email.length > 120) {
      return res.status(400).json({ message: "Please enter a valid email." });
    }
    if (phone && !PHONE_RE.test(phone)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid contact number." });
    }
    if (!message || message.length < 10 || message.length > 4000) {
      return res
        .status(400)
        .json({ message: "Please enter a message (10–4000 characters)." });
    }

    await sendContactEmail({ name, email, phone, message });

    res.json({
      message: "Thanks — your message was sent. We’ll reply soon.",
    });
  } catch (error) {
    console.error("[contact]", error.message);
    res.status(error.status || 500).json({
      message:
        error.status === 503
          ? "Contact email is temporarily unavailable. Please try again later."
          : "Could not send your message right now. Please try again later.",
    });
  }
};
