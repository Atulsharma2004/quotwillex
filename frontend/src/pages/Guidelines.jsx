import { Link } from "react-router-dom";
import {
  FaBookOpen,
  FaCheckCircle,
  FaEnvelope,
  FaEye,
  FaLock,
  FaShieldAlt,
  FaUserPlus,
  FaBan,
  FaQuoteLeft,
} from "react-icons/fa";
import Seo from "../components/Seo";
import { SEO_ROUTES, SUPPORT_EMAIL, SUPPORT_MAILTO } from "../constants/site";

const sections = [
  { id: "how-to-use", label: "How to use" },
  { id: "mandatory", label: "What’s mandatory" },
  { id: "content-rules", label: "Content rules" },
  { id: "abusive", label: "Abusive & offensive words" },
  { id: "privacy", label: "Privacy" },
  { id: "guests", label: "Guests vs members" },
  { id: "reporting", label: "Reporting & contact" },
];

const Guidelines = () => (
  <div className="min-h-[70vh] bg-gradient-to-br from-blue-50 via-indigo-50/40 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
    <Seo {...SEO_ROUTES.guidelines} />

    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <header className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-500">
          Policies & instructions
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
          Guidelines
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          How Quotwellix works, what you must complete to use the site, and the
          rules that keep this community respectful — in English and Hindi.
        </p>
      </header>

      <nav
        aria-label="Guidelines sections"
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
          id="how-to-use"
          className="scroll-mt-24 rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
            <FaBookOpen />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              How to use Quotwellix
            </h2>
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <li>
              Browse <Link className="font-semibold text-indigo-600 hover:underline" to="/popular-quotes">Popular / Explore</Link>{" "}
              and <Link className="font-semibold text-indigo-600 hover:underline" to="/awards">Awards</Link> without an account.
            </li>
            <li>
              <Link className="font-semibold text-indigo-600 hover:underline" to="/signup">Create an account</Link>{" "}
              (email or Google), then verify your email if you signed up with password.
            </li>
            <li>
              Choose a unique <strong>User ID</strong> (username) — required before full use.
            </li>
            <li>
              Share quotes on the community feed, like, dislike, comment, and follow creators.
            </li>
            <li>
              Use English or Hindi for quotes. Pick a category when it helps others find your line.
            </li>
            <li>
              Edit your profile anytime from Profile / Account. Private details stay private.
            </li>
          </ol>
        </section>

        <section
          id="mandatory"
          className="scroll-mt-24 rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
            <FaCheckCircle />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              What’s mandatory
            </h2>
          </div>
          <ul className="space-y-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <li className="flex gap-2">
              <FaLock className="mt-0.5 shrink-0 text-indigo-500" />
              <span>
                <strong>Required:</strong> name, email, password (or Google sign-in), and a unique User ID.
              </span>
            </li>
            <li className="flex gap-2">
              <FaLock className="mt-0.5 shrink-0 text-indigo-500" />
              <span>
                <strong>Email verification</strong> is required for password accounts before login.
              </span>
            </li>
            <li className="flex gap-2">
              <FaEye className="mt-0.5 shrink-0 text-indigo-500" />
              <span>
                <strong>Optional:</strong> mobile, date of birth, country, state, city, bio, profile photo, Instagram.
                These help account safety and recovery; you can skip and add later.
              </span>
            </li>
            <li className="flex gap-2">
              <FaQuoteLeft className="mt-0.5 shrink-0 text-indigo-500" />
              <span>
                <strong>When posting:</strong> quote text is required. Category and language should be set correctly
                (English or Hindi). Popular quotes (admin) also need attribution.
              </span>
            </li>
          </ul>
        </section>

        <section
          id="content-rules"
          className="scroll-mt-24 rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
            <FaShieldAlt />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Content rules — what to post
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                Do
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700 dark:text-slate-300">
                <li>Share original thoughts or clearly attributed wisdom</li>
                <li>Keep lines meaningful, kind, or thoughtfully provocative</li>
                <li>Use categories so others can discover your quotes</li>
                <li>Respect other members in comments and replies</li>
                <li>Credit authors for popular / classic lines (admins)</li>
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-red-600 dark:text-red-400">
                Don’t
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700 dark:text-slate-300">
                <li>Post abuse, harassment, hate, or threats</li>
                <li>Post sexual, pornographic, or exploitative content</li>
                <li>Spam, flood, or advertise unrelated products</li>
                <li>Impersonate others or misuse someone else’s identity</li>
                <li>Share others’ private contact details without consent</li>
              </ul>
            </div>
          </div>
        </section>

        <section
          id="abusive"
          className="scroll-mt-24 rounded-2xl border border-red-100 bg-white/90 p-5 shadow-sm dark:border-red-950 dark:bg-slate-900/80 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
            <FaBan />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Abusive, bad, sexual & offensive words
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            Quotwellix automatically checks quotes and comments against a large
            blocklist of abusive, sexual, harassing, and offensive terms
            (English and Hindi, including common misspellings).
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
            <li>
              Blocked content is <strong>not published</strong>. You’ll see a clear rejection message.
            </li>
            <li>
              Repeated abuse attempts may raise <strong>strikes</strong> on your account and trigger an alert to our team.
            </li>
            <li>
              Softening with symbols or spacing (e.g. leetspeak) still often gets caught — don’t try to bypass filters.
            </li>
            <li>
              Legitimate literary quotes should still avoid slur-filled or pornographic framing. When in doubt, don’t post it.
            </li>
            <li>
              Filters are not perfect. If something harmful slipped through, contact us so we can remove it.
            </li>
          </ul>
        </section>

        <section
          id="privacy"
          className="scroll-mt-24 rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
            <FaLock />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Privacy on profiles
            </h2>
          </div>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
            <li>
              <strong>Public:</strong> name, User ID, bio, profile photo, posts, follower/following counts.
            </li>
            <li>
              <strong>Private (only you / account page):</strong> email, mobile, date of birth, country, state, city, Instagram.
            </li>
            <li>
              We do not sell your private profile fields. Contact form messages go to our support inbox.
            </li>
          </ul>
        </section>

        <section
          id="guests"
          className="scroll-mt-24 rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
            <FaUserPlus />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Guests vs members
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[280px] text-left text-sm text-slate-700 dark:text-slate-300">
              <thead>
                <tr className="border-b border-indigo-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                  <th className="py-2 pr-3 font-semibold">Action</th>
                  <th className="py-2 pr-3 font-semibold">Guest</th>
                  <th className="py-2 font-semibold">Member</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50 dark:divide-slate-800">
                <tr>
                  <td className="py-2 pr-3">Browse preview quotes</td>
                  <td className="py-2 pr-3">Yes (limited mix)</td>
                  <td className="py-2">Full feeds</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Create / post quotes</td>
                  <td className="py-2 pr-3">No</td>
                  <td className="py-2">Yes</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Like, comment, follow</td>
                  <td className="py-2 pr-3">No (sign-in required)</td>
                  <td className="py-2">Yes</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Awards & contact</td>
                  <td className="py-2 pr-3">Yes</td>
                  <td className="py-2">Yes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section
          id="reporting"
          className="scroll-mt-24 rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
            <FaEnvelope />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Reporting & contact
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            If you see harmful content, impersonation, or a bug, tell us. Include
            the page link and a short description.
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
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            By creating an account or posting on Quotwellix, you agree to follow
            these guidelines. We may remove content or restrict accounts that
            break the rules.
          </p>
        </section>
      </div>
    </div>
  </div>
);

export default Guidelines;
