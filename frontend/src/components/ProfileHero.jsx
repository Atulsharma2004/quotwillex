import { useEffect, useRef, useState } from "react";
import { FaQuoteLeft, FaCog, FaStar, FaIdCard, FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ProfileAvatar from "./ProfileAvatar";

const followBtnClass =
  "inline-flex min-h-8 items-center rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 sm:min-h-10 sm:px-5 sm:py-2 sm:text-sm";

const ProfileHero = ({
  profile,
  postCount,
  isOwnProfile,
  isFollowing,
  followRequested,
  incomingFollowRequest,
  canFollowBack,
  followBusy,
  onOpenFollowers,
  onOpenFollowing,
  onFollowToggle,
  onCancelRequest,
  onAcceptRequest,
  onRejectRequest,
  onFollowBack,
  onOpenSettings,
}) => {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  if (!profile) return null;

  const followersCount = profile.followerCount ?? (profile.followers || []).length;
  const followingCount = profile.followingCount ?? (profile.following || []).length;

  const renderFollowActions = () => {
    if (isOwnProfile) return null;

    if (isFollowing) {
      return (
        <button
          type="button"
          disabled={followBusy}
          onClick={onFollowToggle}
          className={`mt-2 sm:mt-3 ${followBtnClass} border border-white/50 bg-white/20 text-white hover:bg-white/30`}
        >
          {followBusy ? "Please wait..." : "Unfollow"}
        </button>
      );
    }

    if (incomingFollowRequest) {
      return (
        <div className="mt-2 flex flex-wrap items-center justify-start gap-1.5 sm:mt-3 sm:gap-2">
          <button
            type="button"
            disabled={followBusy}
            onClick={onAcceptRequest}
            className={`${followBtnClass} bg-white text-blue-700 hover:bg-blue-50`}
          >
            {followBusy ? "Please wait..." : "Accept"}
          </button>
          <button
            type="button"
            disabled={followBusy}
            onClick={onRejectRequest}
            className={`${followBtnClass} border border-white/50 bg-white/20 text-white hover:bg-white/30`}
          >
            Cancel
          </button>
        </div>
      );
    }

    if (canFollowBack) {
      return (
        <button
          type="button"
          disabled={followBusy}
          onClick={onFollowBack}
          className={`mt-2 sm:mt-3 ${followBtnClass} bg-white text-blue-700 hover:bg-blue-50`}
        >
          {followBusy ? "Please wait..." : "Follow back"}
        </button>
      );
    }

    if (followRequested) {
      return (
        <button
          type="button"
          disabled={followBusy}
          onClick={onCancelRequest}
          className={`mt-2 sm:mt-3 ${followBtnClass} border border-white/50 bg-white/20 text-white hover:bg-white/30`}
        >
          {followBusy ? "Please wait..." : "Requested"}
        </button>
      );
    }

    return (
      <button
        type="button"
        disabled={followBusy}
        onClick={onFollowToggle}
        className={`mt-2 sm:mt-3 ${followBtnClass} bg-white text-blue-700 hover:bg-blue-50`}
      >
        {followBusy ? "Please wait..." : "Follow"}
      </button>
    );
  };

  const statClass =
    "rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 px-1.5 py-2 text-center transition sm:rounded-xl sm:px-3 sm:py-4";

  return (
    <section className="relative mx-auto mt-3 w-[95%] max-w-4xl overflow-hidden rounded-xl border border-blue-100 shadow-lg sm:mt-6 sm:w-[92%] sm:rounded-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600" />
      <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-indigo-300/20 blur-2xl" />

      {isOwnProfile && (
        <div ref={menuRef} className="absolute right-2 top-2 z-10 sm:right-4 sm:top-4">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-full border border-white/30 bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/30 sm:p-2.5"
            title="Settings"
            aria-label="Open settings menu"
            aria-expanded={menuOpen}
          >
            <FaCog className="text-sm sm:text-lg" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-white/20 bg-white py-1 shadow-xl dark:border-slate-600 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/account");
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <FaIdCard className="text-indigo-500" />
                View full profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenSettings?.();
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <FaEdit className="text-indigo-500" />
                Edit account
              </button>
            </div>
          )}
        </div>
      )}

      <div className="relative px-3 pb-3 pt-4 text-white sm:px-10 sm:pb-6 sm:pt-10">
        {/* Compact row on mobile so hero + a quote fit above the fold */}
        <div className="flex flex-row items-start gap-3 sm:items-end sm:gap-6">
          <div className="relative shrink-0">
            <div className="absolute inset-0 scale-110 rounded-full bg-white/30 opacity-70 blur-md" />
            <ProfileAvatar
              src={profile.profilePicture}
              alt={profile.name}
              className="relative h-16 w-16 rounded-full border-[3px] border-white/90 object-cover shadow-lg sm:h-32 sm:w-32 sm:border-4 sm:shadow-xl"
            />
            <div className="pointer-events-none absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-1 text-blue-600 shadow sm:p-2">
              <FaQuoteLeft className="text-[10px] sm:text-sm" />
            </div>
          </div>

          <div className="min-w-0 flex-1 text-left">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-100 sm:mb-1 sm:text-xs sm:tracking-[0.2em]">
              {isOwnProfile ? "Your profile" : "Member profile"}
            </p>
            <h1 className="truncate text-lg font-bold leading-tight sm:text-3xl">
              {profile.name}
              {profile.role === "admin" && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold sm:ml-2 sm:px-2 sm:text-sm">
                  admin
                </span>
              )}
            </h1>
            <p className="mt-0.5 truncate text-xs font-medium text-blue-100 sm:mt-1 sm:text-sm">
              {profile.username ? `@${profile.username}` : "User ID not set"}
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-blue-50/95 sm:mt-3 sm:line-clamp-none sm:text-base sm:leading-normal">
              {profile.bio || "No bio available yet."}
            </p>

            {renderFollowActions()}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5 sm:mt-8 sm:gap-3">
          <div className={`${statClass} hover:bg-white/20`}>
            <p className="text-base font-bold sm:text-2xl">{postCount || 0}</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-wide text-blue-100 sm:mt-1 sm:text-xs">
              Posts
            </p>
          </div>

          <div
            className={`${statClass} hover:bg-white/20`}
            title="Stars earned when a quote becomes Quote of the Day"
          >
            <p className="inline-flex items-center justify-center gap-0.5 text-base font-bold sm:gap-1 sm:text-2xl">
              <FaStar className="text-xs text-amber-300 sm:text-lg" />
              {profile.qotdStars || 0}
            </p>
            <p className="mt-0.5 text-[9px] uppercase tracking-wide text-blue-100 sm:mt-1 sm:text-xs">
              Stars
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenFollowers}
            className={`${statClass} cursor-pointer hover:scale-[1.02] hover:bg-white/25`}
          >
            <p className="text-base font-bold sm:text-2xl">{followersCount}</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-wide text-blue-100 sm:mt-1 sm:text-xs">
              Followers
            </p>
          </button>

          <button
            type="button"
            onClick={onOpenFollowing}
            className={`${statClass} cursor-pointer hover:scale-[1.02] hover:bg-white/25`}
          >
            <p className="text-base font-bold sm:text-2xl">{followingCount}</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-wide text-blue-100 sm:mt-1 sm:text-xs">
              Following
            </p>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProfileHero;
