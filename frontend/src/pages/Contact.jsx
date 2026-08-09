import { useState } from "react";
import {
  FaCheck,
  FaCopy,
  FaEnvelope,
  FaHandshake,
  FaComments,
  FaBullhorn,
  FaPaperPlane,
  FaPhone,
  FaUser,
} from "react-icons/fa";
import Seo from "../components/Seo";
import api from "../api/api";
import {
  SEO_ROUTES,
  SITE_NAME,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
} from "../constants/site";

const TOPICS = [
  {
    icon: FaComments,
    title: "Questions, feedback & complaints",
    body: "Stuck on something, have an idea, or need to report an issue? Write us — we read every message.",
    subject: "Quotwellix support",
    tone: "from-sky-500 to-blue-600",
  },
  {
    icon: FaBullhorn,
    title: "Partnership & press",
    body: "Media features, collaborations, and brand partnerships — tell us what you’re building with us.",
    subject: "Quotwellix partnership / press",
    tone: "from-indigo-500 to-violet-600",
  },
  {
    icon: FaHandshake,
    title: "Personal replies from us",
    body: "This inbox is monitored by a real person. Expect a thoughtful, human reply — not an auto-bot.",
    subject: "Hello Quotwellix",
    tone: "from-amber-500 to-orange-600",
  },
];

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

const Contact = () => {
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const mailtoWithSubject = (subject) =>
    `${SUPPORT_MAILTO}?subject=${encodeURIComponent(subject)}`;

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (status.text) setStatus({ type: "", text: "" });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSending(true);
    setStatus({ type: "", text: "" });

    try {
      const { data } = await api.post("/contact", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
      });
      setForm(emptyForm);
      setStatus({
        type: "success",
        text: data.message || "Message sent. We’ll get back to you soon.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        text:
          error.response?.data?.message ||
          `Could not send right now. Email us at ${SUPPORT_EMAIL}.`,
      });
    } finally {
      setSending(false);
    }
  };

  const fieldClass =
    "w-full rounded-xl border border-indigo-100 bg-white/90 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-950";

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Seo {...SEO_ROUTES.contact} />

      <div
        className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-500/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 top-40 h-72 w-72 rounded-full bg-indigo-300/25 blur-3xl dark:bg-indigo-500/10"
        aria-hidden
      />

      <section className="relative px-4 pb-8 pt-14 text-center sm:pt-16">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700 backdrop-blur dark:border-slate-600 dark:bg-slate-900/70 dark:text-indigo-300">
          <FaEnvelope className="text-[10px]" />
          {SITE_NAME} support
        </p>
        <h1 className="bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl dark:from-blue-300 dark:via-indigo-300 dark:to-sky-300">
          Reach Out
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 dark:text-slate-400 sm:text-lg">
          Questions, feedback, complaints, partnerships, or press — send a
          message below and we’ll reply personally to your inbox.
        </p>

        <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={SUPPORT_MAILTO}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:scale-[1.02] hover:shadow-lg sm:w-auto"
          >
            <FaEnvelope />
            Email {SUPPORT_EMAIL}
          </a>
          <button
            type="button"
            onClick={copyEmail}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-white dark:border-slate-600 dark:bg-slate-900/80 dark:text-indigo-300 dark:hover:bg-slate-800 sm:w-auto"
          >
            {copied ? <FaCheck className="text-emerald-500" /> : <FaCopy />}
            {copied ? "Copied" : "Copy email"}
          </button>
        </div>
      </section>

      <section className="relative mx-auto max-w-4xl px-4 pb-8 pt-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {TOPICS.map((topic, index) => {
            const Icon = topic.icon;
            return (
              <a
                key={topic.title}
                href={mailtoWithSubject(topic.subject)}
                className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
                style={{ animationDelay: `${0.08 + index * 0.06}s` }}
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${topic.tone} text-white shadow-md transition group-hover:scale-105`}
                >
                  <Icon />
                </div>
                <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                  {topic.title}
                </h2>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {topic.body}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition group-hover:gap-2.5 dark:text-indigo-300">
                  Write about this →
                </span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="relative mx-auto max-w-2xl px-4 pb-16">
        <div className="overflow-hidden rounded-3xl border border-indigo-100 bg-white/95 shadow-xl shadow-indigo-100/40 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30">
          <div className="border-b border-indigo-50 bg-gradient-to-r from-indigo-50 to-sky-50 px-5 py-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Send a message
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your details go straight to {SUPPORT_EMAIL} in email format.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 p-5 sm:p-6">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Name *
              </span>
              <span className="relative block">
                <FaUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                <input
                  type="text"
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  value={form.name}
                  onChange={onChange}
                  placeholder="Your full name"
                  className={fieldClass}
                  autoComplete="name"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Email *
              </span>
              <span className="relative block">
                <FaEnvelope className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                <input
                  type="email"
                  name="email"
                  required
                  maxLength={120}
                  value={form.email}
                  onChange={onChange}
                  placeholder="you@example.com"
                  className={fieldClass}
                  autoComplete="email"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Contact number
              </span>
              <span className="relative block">
                <FaPhone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  maxLength={22}
                  value={form.phone}
                  onChange={onChange}
                  placeholder="+91 98765 43210"
                  className={fieldClass}
                  autoComplete="tel"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Your query *
              </span>
              <textarea
                name="message"
                required
                minLength={10}
                maxLength={4000}
                rows={5}
                value={form.message}
                onChange={onChange}
                placeholder="Tell us how we can help…"
                className="w-full resize-y rounded-xl border border-indigo-100 bg-white/90 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-950"
              />
            </label>

            {status.text && (
              <p
                className={`rounded-xl px-3 py-2.5 text-sm ${
                  status.type === "success"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                }`}
                role="status"
              >
                {status.text}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:scale-[1.01] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
              <FaPaperPlane className="text-xs" />
              {sending ? "Sending…" : "Send message"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
          We aim to reply within 1–2 business days · {SUPPORT_EMAIL}
        </p>
      </section>
    </div>
  );
};

export default Contact;
