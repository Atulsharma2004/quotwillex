import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { FaBell, FaCheck, FaTimes, FaUserPlus } from "react-icons/fa";
import authService from "../redux/auth/authService";
import {
  acceptFollowRequest,
  rejectFollowRequest,
  followBack,
  patchFollowingLocal,
} from "../redux/auth/authSlice";
import ProfileAvatar from "./ProfileAvatar";
import { profilePath } from "../utils/profileKey";
import { formatRelativeTime, formatDate, formatDateTime } from "../utils/datetime";

const formatWhen = (iso) => {
  if (!iso) return "";
  const relative = formatRelativeTime(iso);
  if (!relative) return "";
  if (relative === "just now") return "Just now";
  // Compact relative for the bell (drop " ago")
  if (relative.endsWith(" ago")) return relative.slice(0, -4);
  return formatDate(iso);
};

/**
 * Notification bell — dropdown opens below the header (never covers the navbar).
 */
const NotificationBell = ({ currentUser }) => {
  const dispatch = useDispatch();
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [panelTop, setPanelTop] = useState(64);

  const refreshCount = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await authService.getUnreadNotificationCount();
      setUnread(data?.unreadCount || 0);
    } catch {
      /* ignore */
    }
  }, [currentUser]);

  const loadNotifications = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await authService.listNotifications({ limit: 40 });
      setItems(data?.notifications || []);
      setUnread(data?.unreadCount || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const placePanel = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    // Sit just under the bell / header — keep navbar fully visible
    setPanelTop(Math.round(rect.bottom + 8));
  }, []);

  useEffect(() => {
    if (!currentUser) return undefined;
    refreshCount();
    const timer = setInterval(refreshCount, 45000);
    return () => clearInterval(timer);
  }, [currentUser, refreshCount]);

  useEffect(() => {
    if (!open) return undefined;
    placePanel();
    loadNotifications();
    authService.markNotificationsRead().then(() => setUnread(0)).catch(() => {});

    const onPointerOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onReposition = () => placePanel();

    document.addEventListener("mousedown", onPointerOutside);
    document.addEventListener("touchstart", onPointerOutside, { passive: true });
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerOutside);
      document.removeEventListener("touchstart", onPointerOutside);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, loadNotifications, placePanel]);

  const updateItem = (id, patch) => {
    setItems((prev) =>
      prev.map((n) => (n._id === id ? { ...n, ...patch } : n))
    );
  };

  const handleAccept = async (n) => {
    if (!n.followRequestId) return;
    setBusyId(n._id);
    const result = await dispatch(acceptFollowRequest(n.followRequestId));
    setBusyId(null);
    if (acceptFollowRequest.rejected.match(result)) return;
    const canFollowBack = result.payload?.canFollowBack !== false;
    updateItem(n._id, {
      actionState: canFollowBack ? "accepted" : "followed_back",
      read: true,
    });
  };

  const handleReject = async (n) => {
    if (!n.followRequestId) return;
    setBusyId(n._id);
    const result = await dispatch(rejectFollowRequest(n.followRequestId));
    setBusyId(null);
    if (rejectFollowRequest.rejected.match(result)) return;
    updateItem(n._id, { actionState: "rejected", read: true });
  };

  const handleFollowBack = async (n) => {
    const actorId = n.actor?._id;
    if (!actorId) return;
    setBusyId(n._id);
    const result = await dispatch(followBack(actorId));
    setBusyId(null);
    if (followBack.rejected.match(result)) return;
    dispatch(
      patchFollowingLocal({
        targetId: actorId,
        following: true,
        targetSnapshot: n.actor,
      })
    );
    updateItem(n._id, { actionState: "followed_back", read: true });
  };

  if (!currentUser) return null;

  const maxPanelHeight = `min(70dvh, calc(100dvh - ${panelTop + 12}px))`;

  return (
    <div ref={rootRef} className="relative flex shrink-0 items-center">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-indigo-100 bg-white text-slate-700 transition hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <FaBell className="text-sm" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Dim only below the navbar so the header stays usable */}
          <div
            className="fixed inset-x-0 bottom-0 z-[60] bg-black/25 sm:bg-transparent"
            style={{ top: panelTop }}
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <div
            className="fixed right-2 z-[70] flex w-[min(22rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:right-3"
            style={{ top: panelTop, maxHeight: maxPanelHeight }}
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-indigo-50 px-3 py-2.5 dark:border-slate-700">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Notifications
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Follow requests and updates
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                aria-label="Close notifications"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {loading && items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  Loading…
                </p>
              ) : items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No notifications yet.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((n) => {
                    const name = n.actor?.name || n.actor?.username || "Someone";
                    const pending =
                      n.type === "follow_request" && n.actionState === "pending";
                    const accepted =
                      n.type === "follow_request" &&
                      n.actionState === "accepted";
                    const followedBack =
                      n.actionState === "followed_back" ||
                      n.type === "follow_back";
                    const busy = busyId === n._id;

                    let body = n.message || "";
                    if (n.type === "follow_request" && pending) {
                      body = "requested to follow you";
                    } else if (accepted) {
                      body = "is now following you";
                    } else if (n.actionState === "rejected") {
                      body = "follow request declined";
                    } else if (n.actionState === "cancelled") {
                      body = "cancelled their follow request";
                    }

                    return (
                      <li
                        key={n._id}
                        className={`flex gap-3 px-3 py-3 ${
                          !n.read ? "bg-indigo-50/60 dark:bg-slate-800/60" : ""
                        }`}
                      >
                        <Link
                          to={profilePath(n.actor, currentUser._id)}
                          onClick={() => setOpen(false)}
                          className="shrink-0"
                        >
                          <ProfileAvatar
                            src={n.actor?.profilePicture}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover ring-1 ring-indigo-100 dark:ring-slate-600"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-snug text-slate-800 dark:text-slate-200">
                            <Link
                              to={profilePath(n.actor, currentUser._id)}
                              onClick={() => setOpen(false)}
                              className="font-semibold hover:text-indigo-600 dark:hover:text-indigo-300"
                            >
                              {name}
                            </Link>{" "}
                            <span className="text-slate-600 dark:text-slate-400">
                              {body}
                            </span>
                          </p>
                          <p
                            className="mt-0.5 text-[11px] text-slate-400"
                            title={formatDateTime(n.createdAt)}
                          >
                            {formatWhen(n.createdAt)}
                          </p>

                          {pending && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleAccept(n)}
                                className="inline-flex min-h-9 items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                              >
                                <FaCheck className="text-[10px]" /> Accept
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleReject(n)}
                                className="inline-flex min-h-9 items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                <FaTimes className="text-[10px]" /> Cancel
                              </button>
                            </div>
                          )}

                          {accepted && (
                            <div className="mt-2">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleFollowBack(n)}
                                className="inline-flex min-h-9 items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                              >
                                <FaUserPlus className="text-[10px]" /> Follow back
                              </button>
                            </div>
                          )}

                          {followedBack && n.type === "follow_request" && (
                            <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              You follow each other
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
