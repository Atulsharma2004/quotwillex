import { FaTimes } from "react-icons/fa";
import { dedupeUsersById, formatUserId } from "../utils/username";
import { FollowListSkeleton } from "./Shimmer";
import ProfileAvatar from "./ProfileAvatar";

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

  const isFollowing = (personId) =>
    (currentUser?.following || []).some(
      (entry) => (entry?._id || entry)?.toString() === personId?.toString()
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-up dark:bg-slate-900 dark:border dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
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
            className="p-2 rounded-full text-gray-600 transition hover:bg-white hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto bg-white dark:bg-slate-900">
          {loading ? (
            <FollowListSkeleton />
          ) : uniqueUsers.length === 0 ? (
            <p className="text-center text-gray-500 py-10 px-4 dark:text-slate-400">
              No users to show yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-slate-700">
              {uniqueUsers.map((person, index) => {
                const id = person._id;
                const isSelf =
                  currentUser?._id?.toString() === id?.toString();
                const following = isFollowing(id);
                const userIdLabel = formatUserId(person.username) || "no-id";

                return (
                  <li
                    key={`${id}-${index}`}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-blue-50 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 text-left rounded-lg">
                      <ProfileAvatar
                        src={person.profilePicture}
                        alt={userIdLabel}
                        className="w-11 h-11 rounded-full object-cover border border-blue-100 dark:border-slate-600"
                      />
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => onSelectUser(person)}
                      >
                        <p className="font-semibold text-gray-900 truncate dark:text-slate-100">
                          {userIdLabel}
                        </p>
                        <p className="text-xs text-gray-500 truncate dark:text-slate-400">
                          {person.name || "View profile"}
                        </p>
                      </button>
                    </div>

                    {!isSelf && (
                      <button
                        type="button"
                        disabled={busyId === id}
                        onClick={() => onFollowToggle(id, following)}
                        className={`shrink-0 text-sm font-semibold px-3 py-1.5 rounded-full transition disabled:opacity-60 ${
                          following
                            ? "bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 dark:bg-slate-700 dark:text-white dark:border-slate-500 dark:hover:bg-slate-600"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {busyId === id
                          ? "..."
                          : following
                            ? "Unfollow"
                            : "Follow"}
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
