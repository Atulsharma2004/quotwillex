import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaEnvelope,
  FaLandmark,
  FaSearch,
  FaSignOutAlt,
  FaTimes,
  FaTrophy,
  FaUser,
} from "react-icons/fa";
import { logout } from "../redux/auth/authSlice";
import authService from "../redux/auth/authService";
import ThemeToggle from "./ThemeToggle";
import { profilePath } from "../utils/profileKey";
import ProfileAvatar from "./ProfileAvatar";

const navLinkClass = ({ isActive }) =>
  `relative px-3 py-1.5 rounded-full text-sm font-semibold transition ${
    isActive
      ? "bg-indigo-600 text-white shadow-sm"
      : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
  }`;

const Header = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);
  const profileRef = useRef(null);

  const handleLogout = () => {
    setProfileOpen(false);
    setMenuOpen(false);
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
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return undefined;

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
    setMenuOpen(false);
    navigate(profilePath(person, user?._id));
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-indigo-100/80 bg-white/90 shadow-md shadow-indigo-100/40 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/90 dark:shadow-black/30"
          : "border-indigo-100/60 bg-gradient-to-r from-white via-indigo-50/70 to-white backdrop-blur-md dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-2 font-bold text-slate-900 dark:text-white"
          onClick={() => setMenuOpen(false)}
        >
          <img
            src="/quotwellix-logo.png"
            alt="Quotwellix"
            className="h-9 w-9 rounded-xl object-cover shadow-sm transition group-hover:scale-105 group-hover:shadow-md"
            width={36}
            height={36}
          />
          <span className="text-lg tracking-tight">
            Quot
            <span className="text-[#C45C3A] dark:text-orange-300">wellix</span>
          </span>
        </Link>

        {user ? (
          <>
            <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
              <NavLink to="/quotes" className={navLinkClass}>
                Quotes
              </NavLink>
              <NavLink to="/popular-quotes" className={navLinkClass}>
                Popular
              </NavLink>
              <NavLink to="/awards" className={navLinkClass}>
                Awards
              </NavLink>
              <NavLink to="/guidelines" className={navLinkClass}>
                Guidelines
              </NavLink>
              <NavLink to="/contact" className={navLinkClass}>
                Contact
              </NavLink>
              <NavLink to="/profile" className={navLinkClass}>
                Profile
              </NavLink>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2 min-w-0 md:flex-none">
              <ThemeToggle className="shrink-0" />
              <div ref={searchRef} className="relative w-full max-w-[14rem] sm:max-w-xs">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => {
                    if (query.trim()) setShowResults(true);
                  }}
                  placeholder="Search people..."
                  className="w-full rounded-full border border-indigo-100 bg-white/80 py-2 pl-9 pr-8 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
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
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                )}

                {showResults && query.trim() && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-xl shadow-indigo-100/50 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
                    {isSearching && (
                      <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                        Searching...
                      </p>
                    )}
                    {!isSearching && results.length === 0 && (
                      <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                        No people found
                      </p>
                    )}
                    {!isSearching && results.length > 0 && (
                      <>
                        <div className="border-b border-indigo-50 px-3 py-2 dark:border-slate-700">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {results.length}{" "}
                            {results.length === 1 ? "profile" : "profiles"} matched
                          </p>
                        </div>
                        <div className="max-h-80 overflow-y-auto overscroll-contain">
                          {results.map((person) => (
                            <div
                              key={person._id}
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-indigo-50 dark:hover:bg-slate-800"
                            >
                              <ProfileAvatar
                                src={person.profilePicture}
                                alt=""
                                className="h-9 w-9 shrink-0 rounded-full border border-indigo-100 object-cover dark:border-slate-600"
                              />
                              <button
                                type="button"
                                onClick={() => openProfile(person)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {person.name}
                                </p>
                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                  {person.username
                                    ? `@${person.username}`
                                    : "No User ID"}
                                </p>
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div ref={profileRef} className="relative shrink-0">
                <div className="flex items-center gap-2 rounded-full border border-indigo-100 bg-white py-1 pl-1 pr-2.5 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500">
                  <ProfileAvatar
                    src={user.profilePicture}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setProfileOpen((open) => !open)}
                    className="flex items-center gap-1.5 pr-1"
                    aria-expanded={profileOpen}
                    aria-label="Open profile menu"
                  >
                    <span className="hidden max-w-[7rem] truncate text-xs font-semibold text-slate-700 sm:inline dark:text-slate-200">
                      {user.username ? `@${user.username}` : user.name}
                    </span>
                    <FaUser className="text-[10px] text-slate-500 sm:hidden dark:text-slate-400" />
                  </button>
                </div>

                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 overflow-hidden rounded-2xl border border-indigo-100 bg-white py-1 shadow-xl shadow-indigo-100/50 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
                    <div className="border-b border-indigo-50 px-3 py-2 dark:border-slate-700">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {user.username ? `@${user.username}` : user.email}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <FaUser className="text-xs" /> My Profile
                    </Link>
                    <Link
                      to="/popular-quotes"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <FaLandmark className="text-xs" /> Popular Quotes
                    </Link>
                    <Link
                      to="/awards"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <FaTrophy className="text-xs" /> Awards
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/50"
                    >
                      <FaSignOutAlt className="text-xs" /> Logout
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-indigo-100 bg-white text-slate-700 transition hover:bg-indigo-50 md:hidden dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/popular-quotes"
              className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 sm:inline-flex dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              Popular
            </Link>
            <Link
              to="/awards"
              className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 sm:inline-flex dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              Awards
            </Link>
            <Link
              to="/guidelines"
              className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 sm:inline-flex dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              Guidelines
            </Link>
            <Link
              to="/contact"
              className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 sm:inline-flex dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
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
        )}
      </div>

      {user && menuOpen && (
        <div className="border-t border-indigo-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-950/95 md:hidden">
          <div className="mb-2">
            <ThemeToggle />
          </div>
          <div className="flex flex-col gap-1">
            <NavLink
              to="/quotes"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              Quotes
            </NavLink>
            <NavLink
              to="/popular-quotes"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              Popular
            </NavLink>
            <NavLink
              to="/awards"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              Awards
            </NavLink>
            <NavLink
              to="/guidelines"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              Guidelines
            </NavLink>
            <NavLink
              to="/contact"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </NavLink>
            <NavLink
              to="/profile"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              Profile
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full px-3 py-1.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
