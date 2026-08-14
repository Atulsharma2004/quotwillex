import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { register, reset } from "../redux/auth/authSlice";
import { Link, useNavigate } from "react-router-dom";
import GoogleSignInButton from "../components/GoogleSignInButton";
import Seo from "../components/Seo";
import { DEFAULT_AVATAR, SEO_ROUTES } from "../constants/site";
import {
  COMPLETE_PROFILE_FLAG,
  hasMissingSignupExtras,
  postAuthPath,
} from "../utils/profileCompletion";
import {
  prepareProfileImageFile,
  PROFILE_IMAGE_HINT,
} from "../utils/profileImage";
import LocationFields from "../components/LocationFields";
import PasswordField from "../components/PasswordField";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    profilePicture: DEFAULT_AVATAR,
    bio: "",
    mobileNumber: "",
    dateOfBirth: "",
    city: "",
    state: "",
    country: "",
  });
  const [showExtrasPrompt, setShowExtrasPrompt] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(DEFAULT_AVATAR);
  const [hasCustomImage, setHasCustomImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const { isSuccess, isError, isLoading, message } = useSelector(
    (state) => state.auth
  );
  const fileInputRef = useRef(null);
  const extrasRef = useRef(null);

  useEffect(() => {
    if (!isSuccess) return;

    const token = localStorage.getItem("token");
    if (token) {
      let storedUser = null;
      try {
        storedUser = JSON.parse(localStorage.getItem("user") || "null");
      } catch {
        storedUser = null;
      }
      dispatch(reset());
      navigate(postAuthPath(storedUser), { replace: true });
      return;
    }

    localStorage.setItem(COMPLETE_PROFILE_FLAG, "1");
    dispatch(reset());
    navigate("/login?registered=1", { replace: true });
  }, [isSuccess, navigate, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError("");
    setImageBusy(true);
    try {
      const result = await prepareProfileImageFile(file);
      if (!result.ok) {
        setImageError(result.error);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setFormData((prev) => ({ ...prev, profilePicture: result.dataUrl }));
      setImagePreview(result.dataUrl);
      setHasCustomImage(true);
    } catch (err) {
      setImageError(err.message || "Could not process this image.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setImageBusy(false);
    }
  };

  const clearCustomImage = (e) => {
    e.stopPropagation();
    setImageError("");
    setFormData((prev) => ({ ...prev, profilePicture: DEFAULT_AVATAR }));
    setImagePreview(DEFAULT_AVATAR);
    setHasCustomImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  const submitRegister = () => {
    dispatch(
      register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        bio: formData.bio,
        profilePic: formData.profilePicture || DEFAULT_AVATAR,
        mobileNumber: formData.mobileNumber,
        dateOfBirth: formData.dateOfBirth || undefined,
        city: formData.city,
        state: formData.state,
        country: formData.country,
      })
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasMissingSignupExtras(formData)) {
      setShowExtrasPrompt(true);
      return;
    }
    submitRegister();
  };

  const handleFillDetails = () => {
    setShowExtrasPrompt(false);
    setTimeout(() => {
      extrasRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleSkipForNow = () => {
    setShowExtrasPrompt(false);
    localStorage.setItem(COMPLETE_PROFILE_FLAG, "1");
    submitRegister();
  };

  const fieldClass =
    "w-full rounded-xl border border-slate-200 px-3 py-3 text-base font-semibold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 mb-3";

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-br from-blue-50 to-indigo-100 md:min-h-0 dark:from-slate-950 dark:to-slate-900">
      <Seo {...SEO_ROUTES.signup} />

      <div className="flex items-center justify-between border-b border-indigo-100/80 bg-white/90 px-4 py-3 backdrop-blur md:hidden dark:border-slate-700 dark:bg-slate-900/90">
        <Link to="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <picture>
            <source srcSet="/quotwellix-mark.webp" type="image/webp" />
            <img
              src="/quotwellix-mark.png"
              alt=""
              className="h-8 w-8 rounded-lg object-cover"
              width={32}
              height={32}
            />
          </picture>
          <span>
            Quot<span className="text-[#C45C3A] dark:text-orange-300">wellix</span>
          </span>
        </Link>
        <Link
          to="/login"
          className="text-sm font-semibold text-indigo-600 dark:text-indigo-300"
        >
          Sign In
        </Link>
      </div>

      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-6 text-center sm:px-6 md:p-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 md:text-3xl">
          Sign Up
        </h1>
        {isError && <p className="mt-2 text-red-600">{message}</p>}
        <div className="mt-4 w-full rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-900/90 md:bg-gray-200 md:dark:bg-slate-800">
          <div className="mb-6">
            <GoogleSignInButton />
          </div>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-400/60" />
            <span className="text-xs text-gray-600 sm:text-sm dark:text-slate-300">
              or create with email
            </span>
            <div className="h-px flex-1 bg-gray-400/60" />
          </div>
          <form onSubmit={handleSubmit} className="text-left">
            <div className="mx-auto mb-4 flex flex-col items-center">
              <p className="mb-2 max-w-xs text-center text-xs text-gray-600 dark:text-slate-400">
                {PROFILE_IMAGE_HINT}
              </p>
              <div
                className={`relative h-[100px] w-[100px] cursor-pointer overflow-hidden rounded-full border-2 border-indigo-200 bg-indigo-50 shadow-sm transition hover:border-indigo-400 dark:border-slate-600 dark:bg-slate-900 ${
                  imageBusy ? "pointer-events-none opacity-70" : ""
                }`}
                onClick={handleIconClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleIconClick()}
                aria-label="Upload profile photo"
                title="Upload profile photo"
              >
                <img
                  src={imagePreview || DEFAULT_AVATAR}
                  alt="Default user icon"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_AVATAR;
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-600 dark:text-slate-400">
                {imageBusy
                  ? "Resizing image for upload…"
                  : hasCustomImage
                    ? "Custom photo selected"
                    : "Default user icon — click to upload"}
              </p>
              {imageError && (
                <p className="mt-2 max-w-xs text-center text-sm text-red-600">
                  {imageError}
                </p>
              )}
              {hasCustomImage && (
                <button
                  type="button"
                  onClick={clearCustomImage}
                  className="mt-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                >
                  Use default icon
                </button>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <input
              type="text"
              name="name"
              placeholder="Name"
              required
              value={formData.name}
              onChange={handleChange}
              className={fieldClass}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              value={formData.email}
              onChange={handleChange}
              className={fieldClass}
            />
            <PasswordField
              name="password"
              placeholder="Password (min 8 characters)"
              required
              minLength={8}
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              wrapperClassName="relative mb-3 w-full"
              className="rounded-xl border border-slate-200 px-3 py-3 text-base font-semibold dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              type="text"
              name="bio"
              placeholder="Bio (optional)"
              value={formData.bio}
              onChange={handleChange}
              className={fieldClass}
            />

            <div
              ref={extrasRef}
              className="mb-3 w-full rounded-xl border border-dashed border-indigo-300 bg-white/50 px-3 py-3 text-left dark:border-slate-600 dark:bg-slate-900/40"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                Optional details (private)
              </p>
              <input
                type="tel"
                name="mobileNumber"
                placeholder="Mobile number (optional)"
                value={formData.mobileNumber}
                onChange={handleChange}
                className="mb-2 w-full rounded-md px-2 py-2 font-bold"
              />
              <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-slate-300">
                Date of birth (optional)
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                max={new Date().toISOString().slice(0, 10)}
                className="mb-2 w-full rounded-md px-2 py-2 font-bold"
              />
              <LocationFields
                idPrefix="signup"
                country={formData.country}
                state={formData.state}
                city={formData.city}
                onChange={({ country, state, city }) =>
                  setFormData((prev) => ({ ...prev, country, state, city }))
                }
                layout="stack"
                showLabels
                labelClassName="mb-1 block text-xs font-semibold text-gray-600 dark:text-slate-300"
                selectClassName="mb-2 w-full rounded-md px-2 py-2 font-bold bg-white dark:bg-slate-800 dark:text-slate-100"
                inputClassName="mb-2 w-full rounded-md px-2 py-2 font-bold"
              />
            </div>
            <p className="mb-3 w-full text-left text-[11px] text-gray-600 dark:text-slate-400">
              These details stay private. You can skip and finish them later in
              Account settings.
            </p>
            <button
              type="submit"
              disabled={isLoading}
              className="mb-1 mt-2 w-full rounded-xl bg-blue-600 px-3 py-3 text-base font-semibold text-white disabled:opacity-60"
            >
              {isLoading ? "Registering..." : "Register"}
            </button>
          </form>
          <p className="mt-3 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-blue-500">
              Login here
            </Link>
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
            By signing up you agree to our{" "}
            <Link
              to="/privacy"
              className="font-semibold text-indigo-600 hover:underline"
            >
              Privacy &amp; Policy
            </Link>
            .
          </p>
        </div>
      </div>

      {showExtrasPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-indigo-100 bg-white p-6 text-left shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            role="dialog"
            aria-modal="true"
            aria-label="Complete optional details"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Fill other details?
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Mobile, date of birth, city, state, and country are optional but
              help us keep your account complete. You can fill them now or skip
              and finish after login.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleFillDetails}
                className="flex-1 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Fill other details
              </button>
              <button
                type="button"
                onClick={handleSkipForNow}
                disabled={isLoading}
                className="flex-1 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
