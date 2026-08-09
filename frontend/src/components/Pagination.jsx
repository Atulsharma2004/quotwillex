import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const getPageItems = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) return [1, 2, 3, 4, 5, "end-gap", totalPages];
  if (currentPage >= totalPages - 3) {
    return [1, "start-gap", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [
    1,
    "start-gap",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-gap",
    totalPages,
  ];
};

const Pagination = ({ currentPage, totalPages, onPageChange, label }) => {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="mx-auto my-6 flex w-fit items-center gap-1 rounded-full border border-gray-200 bg-white p-1.5 shadow-sm"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-35 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-300"
      >
        <FaChevronLeft className="text-xs" />
      </button>

      {getPageItems(currentPage, totalPages).map((item) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === currentPage ? "page" : undefined}
            className={`h-8 min-w-8 rounded-full px-2 text-xs font-bold transition ${
              item === currentPage
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-300"
            }`}
          >
            {item}
          </button>
        ) : (
          <span
            key={item}
            aria-hidden="true"
            className="flex h-8 w-5 items-center justify-center text-xs text-gray-400"
          >
            …
          </span>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-35 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-300"
      >
        <FaChevronRight className="text-xs" />
      </button>
    </nav>
  );
};

export default Pagination;
