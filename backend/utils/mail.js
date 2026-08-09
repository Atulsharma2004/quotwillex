import crypto from "crypto";
import nodemailer from "nodemailer";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const frontendUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

export const getContactInbox = () =>
  process.env.CONTACT_TO ||
  process.env.SMTP_USER ||
  "quotesupport9@gmail.com";

export const getAlertInbox = () =>
  process.env.ALERT_TO || getContactInbox();

export const isBrevoConfigured = () => Boolean(process.env.BREVO_API_KEY);

/** Contact / human conversation — Gmail SMTP only (quotesupport9). */
export const isContactMailConfigured = () =>
  Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

/** Verification, password, abuse alerts — Brevo API. */
export const isTransactionalMailConfigured = () => isBrevoConfigured();

/** @deprecated use isContactMailConfigured / isTransactionalMailConfigured */
export const isMailConfigured = () =>
  isContactMailConfigured() || isTransactionalMailConfigured();

const brevoSender = () => ({
  name: process.env.BREVO_SENDER_NAME || "Quotwellix",
  email:
    process.env.BREVO_SENDER_EMAIL ||
    process.env.EMAIL_FROM_ADDRESS ||
    "admin@quotwellix.in",
});

const brandShell = (title, bodyHtml) => `
  <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:16px;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#94a3b8;">Quotwellix</p>
    <h1 style="margin:0 0 16px;font-size:22px;color:#f8fafc;">${title}</h1>
    ${bodyHtml}
    <p style="margin:24px 0 0;font-size:12px;color:#64748b;">Words that linger. — Quotwellix</p>
  </div>
`;

const sendViaBrevo = async ({ to, subject, text, html, replyTo }) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  const payload = {
    sender: brevoSender(),
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
  };
  if (replyTo) payload.replyTo = { email: replyTo };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(errBody || "Brevo failed to send email");
  }
};

const sendViaGmailSmtp = async ({ to, subject, text, html, replyTo }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("Gmail SMTP is not configured");
  }

  const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Quotwellix Support" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
    replyTo,
  });
};

/** Create raw + hashed token for email links (store hash only). */
export const createEmailToken = () => {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
};

export const hashEmailToken = (raw) =>
  crypto.createHash("sha256").update(String(raw || "")).digest("hex");

export const sendTransactionalEmail = async ({
  to,
  subject,
  text,
  html,
  replyTo,
}) => {
  if (!isTransactionalMailConfigured()) {
    const error = new Error(
      "Transactional email is not configured. Set BREVO_API_KEY."
    );
    error.status = 503;
    throw error;
  }
  await sendViaBrevo({ to, subject, text, html, replyTo });
  return { provider: "brevo", to };
};

const buildContactBodies = ({ name, email, phone, message }) => {
  const text = [
    "New Quotwellix contact message",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "Not provided"}`,
    "",
    "Message:",
    message,
    "",
    "— Sent from the Quotwellix contact form",
  ].join("\n");

  const html = brandShell(
    "New contact message",
    `
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr>
        <td style="padding:10px 0;color:#94a3b8;width:110px;vertical-align:top;">Name</td>
        <td style="padding:10px 0;color:#f8fafc;font-weight:600;">${escapeHtml(name)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#94a3b8;vertical-align:top;">Email</td>
        <td style="padding:10px 0;"><a href="mailto:${escapeHtml(email)}" style="color:#93c5fd;text-decoration:none;">${escapeHtml(email)}</a></td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#94a3b8;vertical-align:top;">Phone</td>
        <td style="padding:10px 0;color:#f8fafc;">${escapeHtml(phone || "Not provided")}</td>
      </tr>
    </table>
    <div style="margin-top:18px;padding:16px;border-radius:12px;background:#1e293b;border:1px solid #334155;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">Message</p>
      <p style="margin:0;white-space:pre-wrap;line-height:1.6;color:#e2e8f0;">${escapeHtml(message)}</p>
    </div>
    <p style="margin:20px 0 0;font-size:12px;color:#64748b;">Reply directly to this email to respond to the sender.</p>
    `
  );

  return { text, html };
};

/**
 * Contact page / human conversation — always Gmail → quotesupport9@gmail.com.
 * Never uses Brevo.
 */
export const sendContactEmail = async (payload) => {
  if (!isContactMailConfigured()) {
    const error = new Error(
      "Contact email is not configured. Set SMTP_USER and SMTP_PASS (Gmail App Password)."
    );
    error.status = 503;
    throw error;
  }

  const to = getContactInbox();
  const subject = `Quotwellix contact — ${payload.name}`;
  const { text, html } = buildContactBodies(payload);

  await sendViaGmailSmtp({
    to,
    subject,
    text,
    html,
    replyTo: payload.email,
  });
  return { provider: "gmail", to };
};

export const sendVerificationEmail = async ({ to, name, token }) => {
  const link = `${frontendUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const subject = "Verify your Quotwellix email";
  const text = `Hi ${name || ""},\n\nVerify your email:\n${link}\n\nThis link expires in 24 hours.`;
  const html = brandShell(
    "Verify your email",
    `
    <p style="margin:0 0 16px;line-height:1.6;color:#cbd5e1;">Hi ${escapeHtml(name || "")}, welcome to Quotwellix. Confirm your email to activate your account.</p>
    <p style="margin:0 0 20px;"><a href="${link}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;">Verify email</a></p>
    <p style="margin:0;font-size:13px;color:#94a3b8;word-break:break-all;">Or open: ${escapeHtml(link)}</p>
    <p style="margin:16px 0 0;font-size:12px;color:#64748b;">Link expires in 24 hours. If you didn’t sign up, ignore this email.</p>
    `
  );
  return sendTransactionalEmail({ to, subject, text, html });
};

export const sendPasswordResetEmail = async ({ to, name, token }) => {
  const link = `${frontendUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = "Reset your Quotwellix password";
  const text = `Hi ${name || ""},\n\nReset your password:\n${link}\n\nThis link expires in 1 hour.`;
  const html = brandShell(
    "Reset your password",
    `
    <p style="margin:0 0 16px;line-height:1.6;color:#cbd5e1;">Hi ${escapeHtml(name || "")}, we received a request to reset your password.</p>
    <p style="margin:0 0 20px;"><a href="${link}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;">Reset password</a></p>
    <p style="margin:0;font-size:13px;color:#94a3b8;word-break:break-all;">Or open: ${escapeHtml(link)}</p>
    <p style="margin:16px 0 0;font-size:12px;color:#64748b;">Link expires in 1 hour. If you didn’t request this, ignore this email.</p>
    `
  );
  return sendTransactionalEmail({ to, subject, text, html });
};

export const sendPasswordChangedEmail = async ({ to, name }) => {
  const subject = "Your Quotwellix password was changed";
  const text = `Hi ${name || ""},\n\nYour Quotwellix password was changed. If this wasn’t you, reset your password immediately or contact support.`;
  const html = brandShell(
    "Password changed",
    `
    <p style="margin:0 0 16px;line-height:1.6;color:#cbd5e1;">Hi ${escapeHtml(name || "")}, your account password was just changed.</p>
    <p style="margin:0;line-height:1.6;color:#cbd5e1;">If this wasn’t you, use “Forgot password” on the login page or contact ${escapeHtml(getContactInbox())}.</p>
    `
  );
  return sendTransactionalEmail({ to, subject, text, html });
};

export const sendAbuseAlertEmails = async ({
  user,
  strikeCount,
  sampleText,
  words = [],
}) => {
  const adminTo = getAlertInbox();
  const userEmail = user?.email;
  const display =
    user?.username || user?.name || userEmail || "Unknown user";
  const snippet = String(sampleText || "").slice(0, 280);
  const wordList = (words || []).slice(0, 8).join(", ");

  const adminSubject = `[Alert] Abuse limit reached — ${display}`;
  const adminText = [
    "Quotwellix abuse alert",
    "",
    `User: ${display}`,
    `Email: ${userEmail || "n/a"}`,
    `User ID: ${user?._id || "n/a"}`,
    `Strike count: ${strikeCount}`,
    `Flagged words: ${wordList || "n/a"}`,
    "",
    "Sample:",
    snippet,
  ].join("\n");

  const adminHtml = brandShell(
    "Abuse limit reached",
    `
    <p style="margin:0 0 12px;color:#fca5a5;font-weight:600;">A user hit ${strikeCount} abusive-content attempts.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#94a3b8;">User</td><td style="padding:6px 0;color:#f8fafc;">${escapeHtml(display)}</td></tr>
      <tr><td style="padding:6px 0;color:#94a3b8;">Email</td><td style="padding:6px 0;color:#f8fafc;">${escapeHtml(userEmail || "")}</td></tr>
      <tr><td style="padding:6px 0;color:#94a3b8;">Strikes</td><td style="padding:6px 0;color:#f8fafc;">${strikeCount}</td></tr>
      <tr><td style="padding:6px 0;color:#94a3b8;">Words</td><td style="padding:6px 0;color:#f8fafc;">${escapeHtml(wordList || "n/a")}</td></tr>
    </table>
    <div style="margin-top:14px;padding:12px;border-radius:10px;background:#1e293b;color:#e2e8f0;white-space:pre-wrap;">${escapeHtml(snippet)}</div>
    `
  );

  await sendTransactionalEmail({
    to: adminTo,
    subject: adminSubject,
    text: adminText,
    html: adminHtml,
  });

  if (userEmail) {
    const userSubject = "Quotwellix community guidelines notice";
    const userText = `Hi ${user?.name || ""},\n\nYour account has reached ${strikeCount} blocked attempts to post abusive content. Further violations may lead to restrictions. Please follow community guidelines.\n\n— Quotwellix`;
    const userHtml = brandShell(
      "Community guidelines notice",
      `
      <p style="margin:0 0 12px;line-height:1.6;color:#cbd5e1;">Hi ${escapeHtml(user?.name || "")}, your account has reached <strong>${strikeCount}</strong> blocked attempts involving abusive language.</p>
      <p style="margin:0;line-height:1.6;color:#cbd5e1;">Please keep Quotwellix respectful. Continued violations may lead to account restrictions.</p>
      `
    );
    await sendTransactionalEmail({
      to: userEmail,
      subject: userSubject,
      text: userText,
      html: userHtml,
    });
  }
};
