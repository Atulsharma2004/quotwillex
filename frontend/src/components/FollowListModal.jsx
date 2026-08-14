import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { dedupeUsersById, formatUserId } from "../utils/username";
import { FollowListSkeleton } from "./Shimmer";
import ProfileAvatar from "./ProfileAvatar";

const idInList = (list, personId) =>
  (list || []).some(
    (entry) => (entry?._id || entry)?.toString() === personId?.toString()
  );

const FollowListModal = ({
  title,
  users = [],
  loading = false,
  currentUser,
  onClose,
  onSelectUser,
  onFollowToggle,
  busyId,
}) => {
  const uniqueUsers = dedupeUsersById(users);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const resolveRelation = (person) => {
    const id = person._id;
    const fromReduxFollowing = idInList(currentUser?.following, id);
    const fromReduxRequested = idInList(
      currentUser?.pendingFollowRequests,
      id
    );

    const followedByMe = Boolean(person.followedByMe) || fromReduxFollowing;
    const followRequested =
      !followedByMe &&
      (Boolean(person.followRequested) || fromReduxRequested);
    const canFollowBack =
      !followedByMe &&
      !followRequested &&
      (Boolean(person.canFollowBack) || Boolean(person.followsYou));

    return { followedByMe, followRequested, canFollowBack };
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[min(92dvh,920px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl animate-fade-up dark:border dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Mobile drag hint */}
        <div className="flex justify-center pt-2 sm:hidden" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 sm:px-5 sm:py-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
          <h3 className="min-w-0 truncate text-base font-bold text-gray-900 sm:text-lg dark:text-slate-100">
            {title}{" "}
            {!loading && (
              <span className="text-blue-600 font-semibold dark:text-blue-300">
                ({uniqueUsers.length})
              </span>
            )}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 transition hover:bg-white hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white dark:bg-slate-900">
          {loading ? (
            <FollowListSkeleton />
          ) : uniqueUsers.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-gray-500 dark:text-slate-400">
              No users to show yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-slate-700">
              {uniqueUsers.map((person, index) => {
                const id = person._id;
                const isSelf =
                  currentUser?._id?.toString() === id?.toString();
                const { followedByMe, followRequested, canFollowBack } =
                  resolveRelation(person);
                const userIdLabel = formatUserId(person.username) || "no-id";
                const secondary = followedByMe || followRequested;

                let label = "Follow";
                if (busyId === id) label = "...";
                else if (followedByMe) label = "Unfollow";
                else if (followRequested) label = "Requested";
                else if (canFollowBack) label = "Follow back";

                return (
                  <li
                    key={`${id}-${index}`}
                    className="flex items-center gap-2 px-3 py-3 transition hover:bg-blue-50 sm:gap-3 sm:px-4 dark:hover:bg-slate-800"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5 text-left sm:gap-3">
                      <ProfileAvatar
                        src={person.profilePicture}
                        alt={userIdLabel}
                        className="h-10 w-10 shrink-0 rounded-full border border-blue-100 object-cover sm:h-11 sm:w-11 dark:border-slate-600"
                      />
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => onSelectUser(person)}
                      >
                        <p className="truncate text-sm font-semibold text-gray-900 sm:text-base dark:text-slate-100">
                          {userIdLabel}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-slate-400">
                          {person.name || "View profile"}
                        </p>
                      </button>
                    </div>

                    {!isSelf && (
                      <button
                        type="button"
                        disabled={busyId === id}
                        onClick={() =>
                          onFollowToggle(person, {
                            followedByMe,
                            followRequested,
                            canFollowBack,
                          })
                        }
                        className={`min-h-9 shrink-0 rounded-full px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-60 sm:px-3 sm:text-sm ${
                          secondary
                            ? "border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200 dark:border-slate-500 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {label}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowListModal;
