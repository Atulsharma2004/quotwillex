import { useEffect, useRef, useState } from "react";
import { FaQuoteLeft, FaCog, FaStar, FaIdCard, FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ProfileAvatar from "./ProfileAvatar";

const ProfileHero = ({
  profile,
  postCount,
  isOwnProfile,
  isFollowing,
  followBusy,
  onOpenFollowers,
  onOpenFollowing,
  onFollowToggle,
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

  return (
    <section className="relative overflow-hidden mx-auto w-[92%] max-w-4xl mt-6 rounded-2xl shadow-lg border border-blue-100">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600" />
      <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-indigo-300/20 blur-2xl" />

      {isOwnProfile && (
        <div ref={menuRef} className="absolute top-4 right-4 z-10">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-white backdrop-blur-sm transition"
            title="Settings"
            aria-label="Open settings menu"
            aria-expanded={menuOpen}
          >
            <FaCog className="text-lg" />
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

      <div className="relative px-6 sm:px-10 pt-10 pb-6 text-white">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
          <div className="relative group">
            <div className="absolute inset-0 rounded-full bg-white/30 blur-md scale-110 opacity-70 group-hover:opacity-100 transition" />
            <ProfileAvatar
              src={profile.profilePicture}
              alt={profile.name}
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white/90 shadow-xl"
            />
            <div className="absolute -bottom-1 -right-1 bg-white text-blue-600 rounded-full p-2 shadow pointer-events-none">
              <FaQuoteLeft className="text-sm" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <p className="text-blue-100 text-xs font-semibold tracking-[0.2em] uppercase mb-1">
              {isOwnProfile ? "Your profile" : "Member profile"}
            </p>
            <h1 className="text-3xl font-bold leading-tight">
              {profile.name}
              {profile.role === "admin" && (
                <span className="ml-2 text-sm font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                  admin
                </span>
              )}
            </h1>
            <p className="text-blue-100 mt-1 text-sm font-medium">
              {profile.username ? profile.username : "User ID not set"}
            </p>
            <p className="mt-3 text-blue-50/95 max-w-xl">
              {profile.bio || "No bio available yet."}
            </p>

            {!isOwnProfile && (
              <button
                type="button"
                disabled={followBusy}
                onClick={onFollowToggle}
                className={`mt-4 inline-flex items-center px-5 py-2 rounded-full font-semibold transition disabled:opacity-60 ${
                  isFollowing
                    ? "bg-white/20 text-white border border-white/50 hover:bg-white/30"
                    : "bg-white text-blue-700 hover:bg-blue-50"
                }`}
              >
                {followBusy
                  ? "Please wait..."
                  : isFollowing
                    ? "Unfollow"
                    : "Follow"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-4 text-center hover:bg-white/20 transition">
            <p className="text-2xl font-bold">{postCount || 0}</p>
            <p className="text-xs uppercase tracking-wide text-blue-100 mt-1">
              Posts
            </p>
          </div>

          <div
            className="rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-4 text-center hover:bg-white/20 transition"
            title="Stars earned when a quote becomes Quote of the Day"
          >
            <p className="inline-flex items-center justify-center gap-1 text-2xl font-bold">
              <FaStar className="text-amber-300 text-lg" />
              {profile.qotdStars || 0}
            </p>
            <p className="text-xs uppercase tracking-wide text-blue-100 mt-1">
              QOTD Stars
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenFollowers}
            className="rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-4 text-center hover:bg-white/25 hover:scale-[1.02] transition cursor-pointer"
          >
            <p className="text-2xl font-bold">{followersCount}</p>
            <p className="text-xs uppercase tracking-wide text-blue-100 mt-1">
              Followers
            </p>
          </button>

          <button
            type="button"
            onClick={onOpenFollowing}
            className="rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-4 text-center hover:bg-white/25 hover:scale-[1.02] transition cursor-pointer"
          >
            <p className="text-2xl font-bold">{followingCount}</p>
            <p className="text-xs uppercase tracking-wide text-blue-100 mt-1">
              Following
            </p>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProfileHero;
