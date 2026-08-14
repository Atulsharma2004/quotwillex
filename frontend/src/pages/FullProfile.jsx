import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FaArrowLeft,
  FaEdit,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaInstagram,
  FaLock,
  FaMapMarkerAlt,
  FaPhone,
  FaUser,
} from "react-icons/fa";
import Seo from "../components/Seo";
import EditProfileModal from "../components/EditProfileModal";
import ProfileAvatar from "../components/ProfileAvatar";
import { ProfileSkeleton } from "../components/Shimmer";
import PasswordField from "../components/PasswordField";
import { SITE_NAME } from "../constants/site";
import authService from "../redux/auth/authService";
import { updateProfile, syncAuthUser, setAccessToken } from "../redux/auth/authSlice";
import { formatDate, formatDateTime } from "../utils/datetime";

const formatDob = (value) => {
  if (!value) return "Not set";
  return formatDate(value, { month: "long" }) || "Not set";
};

const DetailRow = ({ label, value, icon: Icon, mono = false }) => (
  <div className="rounded-xl border border-indigo-50 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80">
    <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {Icon ? <Icon className="text-[10px]" /> : null}
      {label}
    </p>
    <p
      className={`text-sm font-medium text-slate-900 dark:text-slate-100 ${
        mono ? "font-mono" : ""
      }`}
    >
      {value || "Not set"}
    </p>
  </div>
);

const FullProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [resetLinkSending, setResetLinkSending] = useState(false);

  const loadProfile = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError("");
    try {
      // Lite profile — no posts bundle (account page only needs fields).
      const data = await authService.getProfile({ lite: 1 });
      setProfile(data);
      dispatch(syncAuthUser(data));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to load profile"
      );
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?._id]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      const updated = await dispatch(updateProfile(data)).unwrap();
      setProfile((prev) => (prev ? { ...prev, ...updated } : updated));
      setShowEdit(false);
    } catch (err) {
      await loadProfile();
      const message =
        (typeof err === "object" && err?.message) ||
        (typeof err === "string" ? err : null) ||
        "Could not save profile";
      const error = new Error(message);
      error.status = typeof err === "object" ? err?.status : undefined;
      error.payload = err;
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const canChangePassword =
    profile?.canChangePassword === true ||
    (profile?.canChangePassword !== false &&
      profile?.authProvider !== "google");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordError("");
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    setPasswordSaving(true);
    try {
      const data = await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (data?.token) {
        dispatch(setAccessToken(data.token));
      }
      setPasswordMsg(data.message || "Password updated");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "Could not change password"
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleForgotCurrentPassword = async () => {
    setPasswordMsg("");
    setPasswordError("");
    setResetLinkSending(true);
    try {
      const data = await authService.requestPasswordReset();
      setPasswordMsg(
        data.message ||
          "Password reset link sent to your email. Open it to choose a new password."
      );
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "Could not send password reset email"
      );
    } finally {
      setResetLinkSending(false);
    }
  };

  if (!currentUser) {
    return (
      <p className="p-8 text-center text-slate-600">
        Please login to view your full profile.
      </p>
    );
  }

  if (loading) return <ProfileSkeleton />;

  if (error || !profile) {
    return (
      <div className="p-10 text-center">
        <p className="mb-4 text-red-600">{error || "Profile not found"}</p>
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="font-semibold text-blue-600"
        >
          Back to profile
        </button>
      </div>
    );
  }

  const location = [profile.country, profile.state, profile.city]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="relative min-h-[70vh] overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-100 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Seo
        title={`Full profile | ${SITE_NAME}`}
        description="View your Quotwellix account details. Private fields are visible only to you."
        path="/account"
        noindex
      />

      <div className="relative mx-auto max-w-2xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 transition hover:text-indigo-900 dark:text-indigo-300"
          >
            <FaArrowLeft className="text-xs" /> Back to profile
          </Link>
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:scale-[1.02]"
          >
            <FaEdit className="text-xs" /> Edit
          </button>
        </div>

        <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-white/95 shadow-xl shadow-indigo-100/40 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30">
          <div className="border-b border-indigo-50 bg-gradient-to-r from-indigo-50 to-sky-50 px-5 py-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">
              View mode
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              Full profile
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              All of your details in one place. Private fields stay only for you.
            </p>
          </div>

          <div className="px-5 py-6 sm:px-6">
            <div className="mb-6 flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
              <ProfileAvatar
                src={profile.profilePicture}
                alt=""
                className="h-24 w-24 rounded-full object-cover ring-4 ring-indigo-100 dark:ring-slate-700"
              />
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {profile.name}
                </h2>
                <p className="text-sm text-indigo-600 dark:text-indigo-300">
                  {profile.username ? `@${profile.username}` : "User ID not set"}
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {profile.bio || "No bio yet."}
                </p>
              </div>
            </div>

            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Public details
            </h3>
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              <DetailRow label="Name" value={profile.name} icon={FaUser} />
              <DetailRow
                label="User ID"
                value={profile.username || "Not set"}
                icon={FaUser}
                mono
              />
              <DetailRow
                label="Bio"
                value={profile.bio || "Not set"}
                icon={FaUser}
              />
              <DetailRow
                label="QOTD stars"
                value={String(profile.qotdStars || 0)}
              />
              <DetailRow
                label="Joined"
                value={
                  profile.createdAt
                    ? formatDateTime(profile.createdAt)
                    : "Not set"
                }
              />
            </div>

            <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
              <FaLock className="text-[10px]" />
              Private — only you can see these
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow
                label="Email"
                value={profile.email}
                icon={FaEnvelope}
                mono
              />
              <div className="rounded-xl border border-indigo-50 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <FaPhone className="text-[10px]" />
                    Mobile number
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowMobile((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300"
                  >
                    {showMobile ? <FaEyeSlash /> : <FaEye />}
                    {showMobile ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {profile.mobileNumber
                    ? showMobile
                      ? profile.mobileNumber
                      : "••••••••••"
                    : "Not set"}
                </p>
              </div>
              <DetailRow
                label="Date of birth"
                value={formatDob(profile.dateOfBirth)}
              />
              <DetailRow
                label="Location"
                value={location || "Not set"}
                icon={FaMapMarkerAlt}
              />
              <DetailRow label="Country" value={profile.country} />
              <DetailRow label="State" value={profile.state} />
              <DetailRow label="City" value={profile.city} />
              <DetailRow
                label="Instagram"
                value={
                  profile.instagram ? `@${profile.instagram}` : "Not set"
                }
                icon={FaInstagram}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-600 dark:bg-slate-800/50">
              <h3 className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
                <FaLock className="text-[10px]" />
                Password
              </h3>
              {canChangePassword ? (
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Change your account password. You’ll get an email confirmation.
                  </p>
                  {passwordError && (
                    <p className="text-sm text-red-600">{passwordError}</p>
                  )}
                  {passwordMsg && (
                    <p className="text-sm text-green-700 dark:text-green-400">
                      {passwordMsg}
                    </p>
                  )}
                  <PasswordField
                    name="currentPassword"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        currentPassword: e.target.value,
                      }))
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                    wrapperClassName="relative"
                    placeholder="Current password"
                    autoComplete="current-password"
                  />
                  <PasswordField
                    name="newPassword"
                    required
                    minLength={8}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        newPassword: e.target.value,
                      }))
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                    wrapperClassName="relative"
                    placeholder="New password (min 8)"
                    autoComplete="new-password"
                  />
                  <PasswordField
                    name="confirmPassword"
                    required
                    minLength={8}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                    wrapperClassName="relative"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="submit"
                    disabled={passwordSaving || resetLinkSending}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-slate-200 dark:text-slate-900"
                  >
                    {passwordSaving ? "Updating..." : "Update password"}
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotCurrentPassword}
                    disabled={resetLinkSending || passwordSaving}
                    className="block text-sm font-semibold text-blue-600 hover:underline disabled:opacity-60 dark:text-blue-300"
                  >
                    {resetLinkSending
                      ? "Sending reset link..."
                      : "Forgot current password? Email me a reset link"}
                  </button>
                </form>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  This account uses Google Sign-In, so password change isn’t available.
                  Use “Forgot password” only for email/password accounts.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {showEdit && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSave={handleSave}
          isSaving={saving}
        />
      )}
    </div>
  );
};

export default FullProfile;
