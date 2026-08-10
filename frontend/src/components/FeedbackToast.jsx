import { useEffect } from "react";

/**
 * Lightweight auto-dismiss feedback banner (success / error).
 */
const FeedbackToast = ({ message = "", type = "success", onClose }) => {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => {
      onClose?.();
    }, 3200);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-[80] w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ring-1 ${
        isSuccess
          ? "bg-emerald-600 text-white ring-emerald-500/40"
          : "bg-red-600 text-white ring-red-500/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p>{message}</p>
        <button
          type="button"
          onClick={() => onClose?.()}
          className="shrink-0 rounded-md px-1.5 text-white/80 hover:bg-white/15 hover:text-white"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default FeedbackToast;
