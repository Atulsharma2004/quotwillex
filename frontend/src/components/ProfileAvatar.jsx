import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";
import { DEFAULT_AVATAR } from "../constants/site";

/**
 * Clickable profile avatar — opens a large square preview with close button.
 * Preview is portaled to document.body so overflow/transform parents
 * (Home cards, Awards podium, etc.) cannot clip it on desktop.
 */
const ProfileAvatar = ({
  src,
  alt = "Profile photo",
  className = "h-10 w-10 rounded-full object-cover",
  buttonClassName = "",
  title = "View profile photo",
}) => {
  const [open, setOpen] = useState(false);
  const url = src || DEFAULT_AVATAR;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const preview =
    open &&
    createPortal(
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        role="presentation"
      >
        <div
          className="relative aspect-square w-[min(92vw,28rem)] overflow-hidden rounded-2xl border border-white/20 bg-slate-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Profile photo preview"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/80"
            aria-label="Close"
          >
            <FaTimes />
          </button>
          <img
            src={url}
            alt={alt}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_AVATAR;
            }}
          />
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        className={`inline-flex shrink-0 cursor-zoom-in rounded-full border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${buttonClassName}`}
        title={title}
        aria-label={title}
      >
        <img
          src={url}
          alt={alt}
          className={className}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_AVATAR;
          }}
        />
      </button>
      {preview}
    </>
  );
};

export default ProfileAvatar;
