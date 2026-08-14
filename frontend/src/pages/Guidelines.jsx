import { Link } from "react-router-dom";
import {
  FaBookOpen,
  FaCheckCircle,
  FaEye,
  FaLock,
  FaMobileAlt,
  FaQuoteLeft,
  FaUserPlus,
} from "react-icons/fa";
import Seo from "../components/Seo";
import GetAppButton from "../components/GetAppButton";
import { SEO_ROUTES } from "../constants/site";

const sections = [
  { id: "how-to-use", label: "How to use" },
  { id: "mandatory", label: "What’s mandatory" },
  { id: "what-to-post", label: "What to post" },
  { id: "guests", label: "Guests vs members" },
  { id: "get-app", label: "Get the app" },
];

const Guidelines = () => (
  <div className="min-h-[70vh] bg-gradient-to-br from-blue-50 via-indigo-50/40 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
    <Seo {...SEO_ROUTES.guidelines} />

    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <header className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-500">
          How to use
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
          Guidelines
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          How Quotwellix works and what you need to use the site. Privacy, data,
          and content policy live on{" "}
          <Link
            to="/privacy"
            className="font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
          >
            Privacy &amp; Policy
          </Link>
          .
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
              Browse{" "}
              <Link
                className="font-semibold text-indigo-600 hover:underline"
                to="/popular-quotes"
              >
                Popular / Explore
              </Link>{" "}
              and{" "}
              <Link
                className="font-semibold text-indigo-600 hover:underline"
                to="/awards"
              >
                Awards
              </Link>{" "}
              without an account.
            </li>
            <li>
              <Link
                className="font-semibold text-indigo-600 hover:underline"
                to="/signup"
              >
                Create an account
              </Link>{" "}
              (email or Google), then verify your email if you signed up with
              password.
            </li>
            <li>
              Choose a unique <strong>User ID</strong> (username) — required
              before full use.
            </li>
            <li>
              Share quotes on the community feed, like, dislike, comment, and
              follow creators.
            </li>
            <li>
              Use English or Hindi for quotes. Pick a category when it helps
              others find your line.
            </li>
            <li>
              Install Quotwellix on your phone from the <strong>Get App</strong>{" "}
              icon in the header — same as Chrome’s Install app suggestion. See{" "}
              <a
                className="font-semibold text-indigo-600 hover:underline"
                href="#get-app"
              >
                Get the app
              </a>
              .
            </li>
            <li>
              Edit your profile anytime from Profile / Account. Private details
              stay private — see{" "}
              <Link
                className="font-semibold text-indigo-600 hover:underline"
                to="/privacy#profiles"
              >
                Privacy &amp; Policy
              </Link>
              .
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
                <strong>Required:</strong> name, email, password (or Google
                sign-in), and a unique User ID.
              </span>
            </li>
            <li className="flex gap-2">
              <FaLock className="mt-0.5 shrink-0 text-indigo-500" />
              <span>
                <strong>Email verification</strong> is required for password
                accounts before login.
              </span>
            </li>
            <li className="flex gap-2">
              <FaEye className="mt-0.5 shrink-0 text-indigo-500" />
              <span>
                <strong>Optional:</strong> mobile, date of birth, country, state,
                city, bio, profile photo, Instagram. These help account safety
                and recovery; you can skip and add later.
              </span>
            </li>
            <li className="flex gap-2">
              <FaQuoteLeft className="mt-0.5 shrink-0 text-indigo-500" />
              <span>
                <strong>When posting:</strong> quote text is required. Category
                and language should be set correctly (English or Hindi). Popular
                quotes (admin) also need attribution.
              </span>
            </li>
          </ul>
        </section>

        <section
          id="what-to-post"
          className="scroll-mt-24 rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
            <FaQuoteLeft />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              What to post
            </h2>
          </div>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700 dark:text-slate-300">
            <li>Share original thoughts or clearly attributed wisdom</li>
            <li>Keep lines meaningful, kind, or thoughtfully provocative</li>
            <li>Use categories so others can discover your quotes</li>
            <li>Respect other members in comments and replies</li>
            <li>Credit authors for popular / classic lines (admins)</li>
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            What not to post, abusive-word checks, and enforcement are in{" "}
            <Link
              to="/privacy#content-policy"
              className="font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
            >
              Privacy &amp; Policy
            </Link>
            .
          </p>
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
                  <td className="py-2 pr-3">Awards &amp; contact</td>
                  <td className="py-2 pr-3">Yes</td>
                  <td className="py-2">Yes</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Install the app (home screen)</td>
                  <td className="py-2 pr-3">Yes</td>
                  <td className="py-2">Yes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section
          id="get-app"
          className="scroll-mt-24 rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
            <FaMobileAlt />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Get the app
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            Quotwellix can be installed on your phone or computer from the
            website. This is not a Play Store / App Store download — it opens
            the live site in its own window (a Progressive Web App). Website
            updates appear the next time you open it while online. You do not
            need to reinstall after a new release.
          </p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <li>
              Tap <strong>Get App</strong> in the header (or the button below).
              On Chrome this opens the same <strong>Install app</strong> dialog
              as the browser suggestion.
            </li>
            <li>
              <strong>Android / Chrome:</strong> if the dialog does not appear,
              open this site in Chrome (not WhatsApp or Instagram) → tap{" "}
              <strong>⋮</strong> → <strong>Install app</strong> or{" "}
              <strong>Add to Home screen</strong>.
            </li>
            <li>
              <strong>iPhone / iPad:</strong> open the site in Safari → tap Share
              → <strong>Add to Home Screen</strong>.
            </li>
            <li>
              Chrome may not show the automatic install suggestion on every
              phone. Use <strong>Get App</strong> whenever you want to install
              it.
            </li>
          </ol>
          <div className="mt-5">
            <GetAppButton variant="cta" />
          </div>
        </section>
      </div>
    </div>
  </div>
);

export default Guidelines;
