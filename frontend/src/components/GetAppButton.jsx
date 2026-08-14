import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaDownload, FaMobileAlt, FaShareAlt, FaTimes } from "react-icons/fa";

const INSTALLED_KEY = "quotwellix-app-installed";

let sharedPrompt = null;
const promptListeners = new Set();

const setSharedPrompt = (event) => {
  sharedPrompt = event;
  promptListeners.forEach((fn) => fn(event));
};

const isStandalone = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    window.navigator.standalone === true
  );
};

const isIos = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

const alreadyInstalled = () =>
  isStandalone() ||
  (typeof localStorage !== "undefined" && localStorage.getItem(INSTALLED_KEY) === "1");

/**
 * Navbar "Get App" — uses Chrome's native install prompt when available,
 * otherwise shows Add to Home Screen steps (iPhone / other browsers).
 */
const GetAppButton = ({ variant = "nav", onUsed, className = "" }) => {
  const [hidden, setHidden] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [canNativeInstall, setCanNativeInstall] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (alreadyInstalled() && variant !== "cta") {
      setHidden(true);
      return undefined;
    }
    setHidden(false);
    setCanNativeInstall(Boolean(sharedPrompt));

    const onPromptAvailable = (event) => {
      setCanNativeInstall(Boolean(event));
    };
    promptListeners.add(onPromptAvailable);

    const onPrompt = (event) => {
      event.preventDefault();
      setSharedPrompt(event);
    };
    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "1");
      setSharedPrompt(null);
      setGuideOpen(false);
      if (variant !== "cta") setHidden(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      promptListeners.delete(onPromptAvailable);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [variant]);

  useEffect(() => {
    if (!guideOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setGuideOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [guideOpen]);

  const triggerNativeInstall = async () => {
    const event = sharedPrompt;
    if (!event) return false;
    setInstalling(true);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice?.outcome === "accepted") {
        localStorage.setItem(INSTALLED_KEY, "1");
        setHidden(true);
      }
      setSharedPrompt(null);
      setGuideOpen(false);
      return true;
    } catch {
      return false;
    } finally {
      setInstalling(false);
    }
  };

  const handleClick = async () => {
    onUsed?.();
    const usedNative = await triggerNativeInstall();
    if (!usedNative) setGuideOpen(true);
  };

  if (hidden) return null;

  const button =
    variant === "menu" ? (
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <FaMobileAlt className="text-xs text-indigo-500" /> Get App
      </button>
    ) : variant === "cta" ? (
      <button
        type="button"
        onClick={handleClick}
        title="Install Quotwellix"
        aria-label="Install Quotwellix app"
        className={`inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:scale-[1.02] hover:shadow-lg ${className}`}
      >
        <FaDownload /> Get App
      </button>
    ) : variant === "icon" ? (
      <button
        type="button"
        onClick={handleClick}
        title="Install Quotwellix"
        aria-label="Install Quotwellix app"
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-indigo-100 bg-white text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 ${className}`}
      >
        <FaDownload className="text-xs" />
      </button>
    ) : (
      <button
        type="button"
        onClick={handleClick}
        title="Install Quotwellix"
        aria-label="Install Quotwellix app"
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-indigo-100 bg-white text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 sm:h-9 sm:w-auto sm:px-3 ${className}`}
      >
        <FaDownload className="text-[10px] sm:text-[11px]" />
        <span className="hidden sm:inline">Get App</span>
      </button>
    );

  const ios = isIos();

  return (
    <>
      {button}
      {guideOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[300] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center"
            onClick={() => setGuideOpen(false)}
            role="presentation"
          >
            <div
              className="relative w-full max-w-sm rounded-2xl border border-indigo-100 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="get-app-title"
            >
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <FaTimes />
              </button>

              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-300">
                <FaMobileAlt className="text-lg" />
              </div>
              <h2
                id="get-app-title"
                className="pr-8 text-lg font-bold text-slate-900 dark:text-white"
              >
                Get the Quotwellix app
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Install it on your home screen — same as Chrome’s Install app
                suggestion.
              </p>

              {canNativeInstall ? (
                <button
                  type="button"
                  disabled={installing}
                  onClick={triggerNativeInstall}
                  className="mt-4 w-full rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-60"
                >
                  {installing ? "Opening…" : "Install app"}
                </button>
              ) : ios ? (
                <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
                  <li>
                    Tap the{" "}
                    <FaShareAlt className="mx-0.5 inline text-indigo-500" /> Share
                    button in Safari.
                  </li>
                  <li>
                    Choose <strong>Add to Home Screen</strong>.
                  </li>
                  <li>Tap Add.</li>
                </ol>
              ) : (
                <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
                  <li>
                    Open this site in <strong>Chrome</strong> (not WhatsApp or
                    Instagram).
                  </li>
                  <li>
                    Tap the <strong>⋮</strong> menu (top right).
                  </li>
                  <li>
                    Tap <strong>Install app</strong> or{" "}
                    <strong>Add to Home screen</strong>.
                  </li>
                </ol>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default GetAppButton;
