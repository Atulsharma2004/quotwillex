import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import { SITE_NAME } from "../constants/site";

const NotFound = () => (
  <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 dark:from-slate-950 dark:to-slate-900">
    <Seo
      title={`Page not found | ${SITE_NAME}`}
      description="This Quotwellix page does not exist."
      noindex
    />
    <div className="max-w-md rounded-2xl border border-blue-100 bg-white/95 p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
        404
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        That link may be outdated. Head home or explore popular quotes.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Home
        </Link>
        <Link
          to="/popular-quotes"
          className="rounded-full border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 dark:border-slate-600 dark:text-indigo-300"
        >
          Popular quotes
        </Link>
      </div>
    </div>
  </div>
);

export default NotFound;
