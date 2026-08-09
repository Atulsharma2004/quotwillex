import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { FaTimes, FaLock, FaInstagram } from "react-icons/fa";
import authService from "../redux/auth/authService";
import { setAccessToken } from "../redux/auth/authSlice";
import { validateUsernameFormat } from "../utils/username";
import {
  prepareProfileImageFile,
  profileImageSaveError,
  PROFILE_IMAGE_HINT,
} from "../utils/profileImage";
import { DEFAULT_AVATAR } from "../constants/site";
import ProfileAvatar from "./ProfileAvatar";
import LocationFields from "./LocationFields";

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const EditProfileModal = ({
  profile,
  onClose,
  onSave,
  isSaving,
  requireUsername = false,
}) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const checkTimer = useRef(null);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    profilePicture: "",
    username: "",
    email: "",
    mobileNumber: "",
    dateOfBirth: "",
    city: "",
    state: "",
    country: "",
    instagram: "",
  });
  const [initialPicture, setInitialPicture] = useState("");
  const [pictureChanged, setPictureChanged] = useState(false);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [showMobile, setShowMobile] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    message: "",
    ok: false,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [resetLinkSending, setResetLinkSending] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  // Prefer server flag; fall back so email/local accounts always see the form.
  const canChangePassword =
    profile?.canChangePassword === true ||
    (profile?.canChangePassword !== false &&
      profile?.authProvider !== "google");

  useEffect(() => {
    setForm({
      name: profile?.name || "",
      bio: profile?.bio || "",
      profilePicture: profile?.profilePicture || "",
      username: profile?.username || "",
      email: profile?.email || "",
      mobileNumber: profile?.mobileNumber || "",
      dateOfBirth: toDateInput(profile?.dateOfBirth),
      city: profile?.city || "",
      state: profile?.state || "",
      country: profile?.country || "",
      instagram: profile?.instagram || "",
    });
    setInitialPicture(profile?.profilePicture || "");
    setPictureChanged(false);
    setPreview(profile?.profilePicture || "");
    setShowMobile(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordMsg("");
    setPasswordError("");
  }, [profile]);

  useEffect(() => {
    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
    };
  }, []);

  const runUsernameCheck = (value) => {
    const format = validateUsernameFormat(value);
    if (!format.valid) {
      setUsernameStatus({
        checking: false,
        message: format.message,
        ok: false,
      });
      return;
    }

    if (
      profile?.username &&
      value.trim().toLowerCase() === profile.username.toLowerCase()
    ) {
      setUsernameStatus({
        checking: false,
        message: "This is your current User ID",
        ok: true,
      });
      return;
    }

    setUsernameStatus({
      checking: true,
      message: "Checking availability...",
      ok: false,
    });

    if (checkTimer.current) clearTimeout(checkTimer.current);
    checkTimer.current = setTimeout(async () => {
      try {
        const result = await authService.checkUsername(value.trim());
        setUsernameStatus({
          checking: false,
          message: result.message,
          ok: result.valid && result.available,
        });
      } catch {
        setUsernameStatus({
          checking: false,
          message: "Could not check User ID",
          ok: false,
        });
      }
    }, 400);
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, username: value }));
    runUsernameCheck(value);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setImageBusy(true);
    try {
      const result = await prepareProfileImageFile(file);
      if (!result.ok) {
        setError(result.error);
        // Keep the previous preview — do not swap to a broken remote default.
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setForm((prev) => ({ ...prev, profilePicture: result.dataUrl }));
      setPreview(result.dataUrl);
      setPictureChanged(result.dataUrl !== initialPicture);
    } catch (err) {
      setError(err.message || "Could not process this image.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setImageBusy(false);
    }
  };

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }

    const format = validateUsernameFormat(form.username);
    if (!format.valid) {
      setError(format.message);
      setUsernameStatus({
        checking: false,
        message: format.message,
        ok: false,
      });
      return;
    }

    if (
      !usernameStatus.ok &&
      form.username.trim().toLowerCase() !== profile?.username?.toLowerCase()
    ) {
      setError(usernameStatus.message || "Please choose a valid User ID");
      return;
    }

    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        bio: form.bio.trim(),
        username: form.username.trim().toLowerCase(),
        mobileNumber: form.mobileNumber.trim(),
        dateOfBirth: form.dateOfBirth || null,
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        instagram: form.instagram.trim(),
      };
      // Only send avatar when it actually changed — avoids huge slow PUTs.
      if (pictureChanged && form.profilePicture !== initialPicture) {
        payload.profilePicture = form.profilePicture;
      }
      await onSave(payload);
    } catch (err) {
      setError(profileImageSaveError(err));
    }
  };

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

  const handleBackdropClick = () => {
    if (!requireUsername) onClose();
  };

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto dark:bg-slate-900 dark:border dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Account settings"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0 z-10 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
              {requireUsername
                ? "Set your User ID"
                : "Account settings"}
            </h3>
            <p className="text-xs text-blue-700 mt-0.5 dark:text-blue-300">
              {requireUsername
                ? "Choose a unique User ID to continue"
                : "Private details stay visible only to you — you can fill them now or leave optional fields blank"}
            </p>
          </div>
          {!requireUsername && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/80 text-gray-600 dark:text-slate-300 dark:hover:bg-slate-700"
              aria-label="Close"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex flex-col items-center">
            <p className="mb-2 max-w-xs text-center text-xs text-gray-600 dark:text-slate-400">
              {PROFILE_IMAGE_HINT}
            </p>
            <ProfileAvatar
              src={preview || DEFAULT_AVATAR}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 bg-white"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageBusy}
              className="mt-2 text-sm font-semibold text-blue-600 hover:underline disabled:opacity-60 dark:text-blue-300"
            >
              {imageBusy ? "Processing…" : "Change photo"}
            </button>
            {imageBusy && (
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-300">
                Resizing image for upload…
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
              User ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.username}
              onChange={handleUsernameChange}
              className={inputClass}
              placeholder="e.g. cool_user@01"
              required
              autoFocus={requireUsername}
            />
            <p
              className={`text-xs mt-1 ${
                usernameStatus.ok
                  ? "text-green-600"
                  : usernameStatus.message
                    ? "text-red-600"
                    : "text-gray-500"
              }`}
            >
              {usernameStatus.checking
                ? "Checking..."
                : usernameStatus.message ||
                  "Letters, numbers, and only @ - _ allowed"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={setField("name")}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={setField("bio")}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Tell people about yourself"
            />
          </div>

          {!requireUsername && (
            <>
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                  <FaLock className="text-[10px]" />
                  Private — only you can see these
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  disabled
                  readOnly
                  className={`${inputClass} cursor-not-allowed bg-gray-100 text-gray-600 dark:bg-slate-800/80 dark:text-slate-400`}
                  aria-readonly="true"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                  Email can’t be changed — it’s your account login and security ID.
                </p>
              </div>

              {canChangePassword ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-3 dark:border-slate-600 dark:bg-slate-800/40">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                    <FaLock className="text-[10px]" />
                    Change password
                  </p>
                  {passwordError && (
                    <p className="text-sm text-red-600">{passwordError}</p>
                  )}
                  {passwordMsg && (
                    <p className="text-sm text-green-700 dark:text-green-400">
                      {passwordMsg}
                    </p>
                  )}
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        currentPassword: e.target.value,
                      }))
                    }
                    className={inputClass}
                    placeholder="Current password"
                    autoComplete="current-password"
                  />
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        newPassword: e.target.value,
                      }))
                    }
                    className={inputClass}
                    placeholder="New password (min 8)"
                    autoComplete="new-password"
                  />
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className={inputClass}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={passwordSaving || resetLinkSending}
                    className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60 dark:bg-slate-200 dark:text-slate-900"
                  >
                    {passwordSaving ? "Updating..." : "Update password"}
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotCurrentPassword}
                    disabled={resetLinkSending || passwordSaving}
                    className="w-full text-sm font-semibold text-blue-600 hover:underline disabled:opacity-60 dark:text-blue-300"
                  >
                    {resetLinkSending
                      ? "Sending reset link..."
                      : "Forgot current password? Email me a reset link"}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  This account uses Google Sign-In, so password change isn’t available here.
                </p>
              )}

              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Mobile number
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMobile((v) => !v)}
                    className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300"
                  >
                    {showMobile ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showMobile ? "tel" : "password"}
                  value={form.mobileNumber}
                  onChange={setField("mobileNumber")}
                  className={inputClass}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                  Date of birth
                </label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={setField("dateOfBirth")}
                  className={inputClass}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>

              <LocationFields
                idPrefix="edit-profile"
                country={form.country}
                state={form.state}
                city={form.city}
                onChange={({ country, state, city }) =>
                  setForm((prev) => ({ ...prev, country, state, city }))
                }
                layout="grid"
                selectClassName={inputClass}
                inputClassName={inputClass}
              />

              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <FaInstagram className="text-pink-500" />
                  Instagram
                </label>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={setField("instagram")}
                  className={inputClass}
                  placeholder="username (without @)"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                  Private handle for your records — not shown on your public profile
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            {!requireUsername && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving || usernameStatus.checking}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : requireUsername
                  ? "Save & continue"
                  : "Save settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
