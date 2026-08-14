import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBookOpen,
  FaEnvelope,
  FaLandmark,
  FaSearch,
  FaSignInAlt,
  FaSignOutAlt,
  FaTimes,
  FaTrophy,
  FaUser,
  FaUserPlus,
} from "react-icons/fa";
import { logout } from "../redux/auth/authSlice";
import authService from "../redux/auth/authService";
import ThemeToggle from "./ThemeToggle";
import GetAppButton from "./GetAppButton";
import NotificationBell from "./NotificationBell";
import { profilePath } from "../utils/profileKey";
import ProfileAvatar from "./ProfileAvatar";
import { DEFAULT_AVATAR } from "../constants/site";

const navLinkClass = ({ isActive }) =>
  `relative px-3 py-1.5 rounded-full text-sm font-semibold transition ${
    isActive
      ? "bg-indigo-600 text-white shadow-sm"
      : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
  }`;

const menuItemClass =
  "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white";

/**
 * Mobile/tablet: logo + theme + search + bell + profile avatar only.
 * All page links open from the profile avatar menu (no hamburger).
 */
const Header = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [guestMenuOpen, setGuestMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const guestMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const headerRef = useRef(null);
  const [searchPanelTop, setSearchPanelTop] = useState(64);

  const closeProfileMenu = () => setProfileOpen(false);
  const closeGuestMenu = () => setGuestMenuOpen(false);

  const handleLogout = () => {
    closeProfileMenu();
    dispatch(logout());
    navigate("/");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
        setSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (guestMenuRef.current && !guestMenuRef.current.contains(event.target)) {
        setGuestMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("touchstart", onClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("touchstart", onClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!guestMenuOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setGuestMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [guestMenuOpen]);

  useEffect(() => {
    if (!searchOpen) return undefined;
    const place = () => {
      const rect = headerRef.current?.getBoundingClientRect();
      setSearchPanelTop(Math.round((rect?.bottom ?? 56) + 8));
    };
    place();
    searchInputRef.current?.focus();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!user) {
      setResults([]);
      setIsSearching(false);
      setSearchOpen(false);
      return undefined;
    }

    const trimmed = query.trim().replace(/^@/, "");
    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      return undefined;
    }

    let cancelled = false;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const users = await authService.searchUsers(trimmed);
        if (!cancelled) {
          setResults(Array.isArray(users) ? users : []);
          setShowResults(true);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, user]);

  const openProfile = (person) => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    setSearchOpen(false);
    closeProfileMenu();
    navigate(profilePath(person, user?._id));
  };

  const searchPanel = user && (
    <div ref={searchRef} className="relative shrink-0">
      <button
        type="button"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-indigo-100 bg-white text-slate-700 transition hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        aria-label="Search people"
        aria-expanded={searchOpen}
        onClick={() => {
          setSearchOpen((v) => !v);
          setProfileOpen(false);
          setGuestMenuOpen(false);
        }}
      >
        <FaSearch className="text-[10px] sm:text-xs" />
      </button>

      {searchOpen && (
        <div
          className="fixed left-2 right-2 z-[60] sm:left-auto sm:right-3 sm:w-80"
          style={{ top: searchPanelTop }}
        >
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" />
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (query.trim()) setShowResults(true);
              }}
              placeholder="Search people..."
              className="w-full rounded-full border border-indigo-100 bg-white py-1.5 pl-8 pr-8 text-sm shadow-md outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 sm:py-2 sm:shadow-lg"
              aria-label="Search people by name or user ID"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setShowResults(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                aria-label="Clear search"
              >
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>

          {showResults && query.trim() && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-64 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
              {isSearching && (
                <p className="px-3 py-2.5 text-sm text-slate-500">Searching...</p>
              )}
              {!isSearching && results.length === 0 && (
                <p className="px-3 py-2.5 text-sm text-slate-500">No people found</p>
              )}
              {!isSearching && results.length > 0 && (
                <div className="max-h-64 overflow-y-auto">
                  {results.map((person) => (
                    <button
                      key={person._id}
                      type="button"
                      onClick={() => openProfile(person)}
                      className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition hover:bg-indigo-50 dark:hover:bg-slate-800"
                    >
                      <ProfileAvatar
                        src={person.profilePicture}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {person.name}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {person.username ? `@${person.username}` : "No User ID"}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <header
      ref={headerRef}
      data-nav="profile-menu-only"
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-indigo-100/80 bg-white/90 shadow-md shadow-indigo-100/40 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/90 dark:shadow-black/30"
          : "border-indigo-100/60 bg-gradient-to-r from-white via-indigo-50/70 to-white backdrop-blur-md dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-4">
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-2 font-bold text-slate-900 dark:text-white"
          onClick={closeProfileMenu}
        >
          <picture>
            <source srcSet="/quotwellix-mark.webp" type="image/webp" />
            <img
              src="/quotwellix-mark.png"
              alt="Quotwellix"
              className="h-9 w-9 rounded-xl object-cover shadow-sm transition group-hover:scale-105"
              width={36}
              height={36}
              decoding="async"
            />
          </picture>
          <span className="hidden text-lg tracking-tight sm:inline">
            Quot
            <span className="text-[#C45C3A] dark:text-orange-300">wellix</span>
          </span>
        </Link>

        {user ? (
          <>
            <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
              <NavLink to="/quotes" className={navLinkClass}>
                Quotes
              </NavLink>
              <NavLink to="/popular-quotes" className={navLinkClass}>
                Popular
              </NavLink>
              <NavLink to="/awards" className={navLinkClass}>
                Awards
              </NavLink>
              <NavLink to="/contact" className={navLinkClass}>
                Contact
              </NavLink>
              <NavLink to="/profile" className={navLinkClass}>
                Profile
              </NavLink>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2 lg:flex-none">
              <ThemeToggle className="shrink-0 !px-2" />
              {searchPanel}
              <div className="hidden lg:contents">
                <GetAppButton />
              </div>
              <NotificationBell currentUser={user} />

              <div ref={profileRef} className="relative flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen((open) => !open);
                    setSearchOpen(false);
                  }}
                  className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-indigo-100 bg-white shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500"
                  aria-expanded={profileOpen}
                  aria-label="Open menu"
                >
                  <img
                    src={user.profilePicture || DEFAULT_AVATAR}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_AVATAR;
                    }}
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-50 max-h-[min(80dvh,28rem)] w-[min(17.5rem,calc(100vw-1.25rem))] overflow-y-auto overscroll-contain rounded-2xl border border-indigo-100 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="border-b border-indigo-50 px-3 py-2.5 dark:border-slate-700">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {user.username ? `@${user.username}` : user.email}
                      </p>
                    </div>

                    <div className="border-b border-indigo-50 py-1 lg:hidden dark:border-slate-700">
                      <Link to="/quotes" onClick={closeProfileMenu} className={menuItemClass}>
                        <FaBookOpen className="text-xs text-indigo-500" /> Quotes
                      </Link>
                      <Link
                        to="/popular-quotes"
                        onClick={closeProfileMenu}
                        className={menuItemClass}
                      >
                        <FaLandmark className="text-xs text-indigo-500" /> Popular
                      </Link>
                      <Link to="/awards" onClick={closeProfileMenu} className={menuItemClass}>
                        <FaTrophy className="text-xs text-indigo-500" /> Awards
                      </Link>
                      <Link to="/contact" onClick={closeProfileMenu} className={menuItemClass}>
                        <FaEnvelope className="text-xs text-indigo-500" /> Contact
                      </Link>
                      <GetAppButton variant="menu" onUsed={closeProfileMenu} />
                    </div>

                    <Link to="/profile" onClick={closeProfileMenu} className={menuItemClass}>
                      <FaUser className="text-xs text-indigo-500" /> My Profile
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/50"
                    >
                      <FaSignOutAlt className="text-xs" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Desktop guest nav */}
            <div className="hidden flex-1 items-center justify-end gap-2 lg:flex">
              <ThemeToggle />
              <GetAppButton />
              <Link
                to="/popular-quotes"
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Popular
              </Link>
              <Link
                to="/awards"
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Awards
              </Link>
              <Link
                to="/contact"
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Contact
              </Link>
              <Link
                to="/login"
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.02] hover:shadow-md"
              >
                Sign Up
              </Link>
            </div>

            {/* Mobile / tablet guest nav — hamburger only */}
            <div
              ref={guestMenuRef}
              className="relative flex flex-1 items-center justify-end gap-1.5 lg:hidden"
            >
              <ThemeToggle className="shrink-0 !px-2" />
              <GetAppButton variant="icon" />
              <Link
                to="/signup"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-sm"
                aria-label="Sign Up"
                title="Sign Up"
              >
                <FaUserPlus className="text-xs" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setGuestMenuOpen((open) => !open);
                  setSearchOpen(false);
                }}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-indigo-100 bg-white text-slate-700 transition hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                aria-label={guestMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={guestMenuOpen}
              >
                {guestMenuOpen ? <FaTimes /> : <FaBars />}
              </button>

              {guestMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(17.5rem,calc(100vw-1.25rem))] overflow-hidden rounded-2xl border border-indigo-100 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <Link
                    to="/popular-quotes"
                    onClick={closeGuestMenu}
                    className={menuItemClass}
                  >
                    <FaLandmark className="text-xs text-indigo-500" /> Popular
                  </Link>
                  <Link to="/awards" onClick={closeGuestMenu} className={menuItemClass}>
                    <FaTrophy className="text-xs text-indigo-500" /> Awards
                  </Link>
                  <Link to="/contact" onClick={closeGuestMenu} className={menuItemClass}>
                    <FaEnvelope className="text-xs text-indigo-500" /> Contact
                  </Link>
                  <div className="my-1 border-t border-indigo-50 dark:border-slate-700" />
                  <GetAppButton variant="menu" onUsed={closeGuestMenu} />
                  <Link to="/login" onClick={closeGuestMenu} className={menuItemClass}>
                    <FaSignInAlt className="text-xs text-indigo-500" /> Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={closeGuestMenu}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-slate-800"
                  >
                    <FaUserPlus className="text-xs" /> Sign Up
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
