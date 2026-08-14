import { Link } from "react-router-dom";
import {
  FaBan,
  FaDatabase,
  FaEnvelope,
  FaEye,
  FaLock,
  FaShieldAlt,
  FaUserShield,
} from "react-icons/fa";
import Seo from "../components/Seo";
import { SEO_ROUTES, SUPPORT_EMAIL, SUPPORT_MAILTO } from "../constants/site";

const sections = [
  { id: "collect", label: "What we collect" },
  { id: "profiles", label: "Public vs private" },
  { id: "use", label: "How we use data" },
  { id: "content-policy", label: "Content policy" },
  { id: "abusive", label: "Abusive words" },
  { id: "accounts", label: "Accounts" },
  { id: "contact", label: "Contact" },
];

const Privacy = () => (
  <div className="min-h-[70vh] bg-gradient-to-br from-blue-50 via-indigo-50/40 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
    <Seo {...SEO_ROUTES.privacy} />

    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <header className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-500">
          Legal
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
          Privacy &amp; Policy
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          How Quotwellix handles your information, what stays private, and the
          rules that apply when you sign in or post. For how to use the site, see{" "}
          <Link
            to="/guidelines"
            className="font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
          >
            Guidelines
          </Link>
          .
        </p>
      </header>

      <nav
        aria-label="Privacy sections"
        className="mb-8 flex flex-wrap justify-center gap-2"
      >
        {sections.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="rounded-full border border-indigo-100 bg-white/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-slate-800"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="space-y-6">
        <section
          id="collect"
          className="scroll-mt-24 rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
            <FaDatabase />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              What we collect
            </h2>
          </div>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <li>
              <strong>Account:</strong> name, email, password (stored hashed),
              unique User ID, and optional profile photo and bio.
            </li>
            <li>
              <strong>Optional private details:</strong> mobile number, date of
              birth, country, state, city, and Instagram — only if you add them.
            </li>
            <li>
              <strong>Activity:</strong> quotes, comments, likes, dislikes,
              follows, follow requests, and in-app notifications.
            </li>
            <li>
              <strong>Sign-in:</strong> if you use Google, we receive the name,
              email, and photo Google shares for that account.
            </li>
            <li>
              <strong>Support:</strong> messages you send through Contact go to
              our support inbox.
            </li>
          </ul>
        </section>

        <section
          id="profiles"
          className="scroll-mt-24 rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
            <FaEye />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Public vs private on profiles
            </h2>
          </div>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
            <li>
              <strong>Public:</strong> name, User ID, bio, profile photo, posts,
              follower/following counts.
            </li>
            <li>
              <strong>Private (only you / account page):</strong> email, mobile,
              date of birth, country, state, city, Instagram.
            </li>
            <li>
              We do not sell your private profile fields.
            </li>
          </ul>
        </section>

        <section
          id="use"
          className="scroll-mt-24 rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
            <FaLock />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              How we use data
            </h2>
          </div>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <li>To run your account, show your public profile, and power the feed.</li>
            <li>To send email verification, password reset, and important account notices.</li>
            <li>
              To keep the community safe — including automated checks for abusive
              language.
            </li>
            <li>
              In-app notifications are stored in our database and removed after{" "}
              <strong>5 days</strong>.
            </li>
            <li>
              Installing Get App stores a shortcut on your device. It opens the
              live website; we do not use it to sell your data.
            </li>
          </ul>
        </section>

        <section
          id="content-policy"
          className="scroll-mt-24 rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
            <FaShieldAlt />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Content policy
            </h2>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            Do not post:
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700 dark:text-slate-300">
            <li>Abuse, harassment, hate, or threats</li>
            <li>Sexual, pornographic, or exploitative content</li>
            <li>Spam, floods, or unrelated advertising</li>
            <li>Impersonation or misuse of someone else’s identity</li>
            <li>Other people’s private contact details without consent</li>
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            We may remove content or restrict accounts that break these rules.
            How to post kindly is covered in{" "}
            <Link
              to="/guidelines#what-to-post"
              className="font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
            >
              Guidelines
            </Link>
            .
          </p>
        </section>

        <section
          id="abusive"
          className="scroll-mt-24 rounded-2xl border border-red-100 bg-white/90 p-5 shadow-sm dark:border-red-950 dark:bg-slate-900/80 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
            <FaBan />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Abusive, bad, sexual &amp; offensive words
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            Quotwellix automatically checks quotes and comments against a
            blocklist of abusive, sexual, harassing, and offensive terms
            (English and Hindi, including common misspellings).
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
            <li>
              Blocked content is <strong>not published</strong>. You’ll see a
              clear rejection message.
            </li>
            <li>
              Repeated abuse attempts may raise <strong>strikes</strong> on your
              account and alert our team.
            </li>
            <li>
              Softening with symbols or spacing still often gets caught — don’t
              try to bypass filters.
            </li>
            <li>
              Legitimate literary quotes should still avoid slur-filled or
              pornographic framing. When in doubt, don’t post it.
            </li>
            <li>
              Filters are not perfect. If something harmful slipped through,
              contact us so we can remove it.
            </li>
          </ul>
        </section>

        <section
          id="accounts"
          className="scroll-mt-24 rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
            <FaUserShield />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Accounts &amp; agreement
            </h2>
          </div>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <li>
              By creating an account or signing in, you agree to this Privacy
              &amp; Policy and to follow our{" "}
              <Link
                to="/guidelines"
                className="font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
              >
                Guidelines
              </Link>
              .
            </li>
            <li>
              You can update most profile fields anytime from Profile / Account.
            </li>
            <li>
              If you want your account or personal data removed, contact support
              and we will help as reasonably possible.
            </li>
          </ul>
        </section>

        <section
          id="contact"
          className="scroll-mt-24 rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
            <FaEnvelope />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Questions &amp; reporting
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            For privacy questions, harmful content, impersonation, or a bug,
            include the page link and a short description.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Contact form
            </Link>
            <a
              href={SUPPORT_MAILTO}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-slate-600 dark:text-indigo-300 dark:hover:bg-slate-800"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
        </section>
      </div>
    </div>
  </div>
);

export default Privacy;
