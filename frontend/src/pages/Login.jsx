import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, reset } from "../redux/auth/authSlice";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import GoogleSignInButton from "../components/GoogleSignInButton";
import PasswordField from "../components/PasswordField";
import Seo from "../components/Seo";
import { SEO_ROUTES } from "../constants/site";
import authService from "../redux/auth/authService";
import { postAuthPath } from "../utils/profileCompletion";

const ERROR_MESSAGES = {
  google_denied: "Google sign-in was cancelled.",
  google_no_token: "Google did not return a token. Check Client Secret.",
  google_invalid: "Invalid Google account data.",
  google_auth_failed: "Google authentication failed. Check redirect URI and secret.",
  account_exists_use_password:
    "An account already exists with this email. Please log in with your password. Google linking is disabled for security.",
};

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [oauthError, setOauthError] = useState("");
  const [info, setInfo] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resending, setResending] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isSuccess, isError, isLoading, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) {
      setOauthError(ERROR_MESSAGES[err] || "Google sign-in failed.");
    }
    if (searchParams.get("verified") === "1") {
      setInfo("Email verified. You can log in now.");
    }
    if (searchParams.get("registered") === "1") {
      setInfo(
        "Account created. Check your email for a verification link before logging in."
      );
    }
    if (searchParams.get("reset") === "1") {
      setInfo("Password updated. You can log in with your new password.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (user || isSuccess) {
      const returnTo =
        typeof location.state?.from === "string" &&
        location.state.from.startsWith("/") &&
        !location.state.from.startsWith("/login")
          ? location.state.from
          : "/";
      navigate(postAuthPath(user, returnTo), { replace: true });
      dispatch(reset());
    }
  }, [user, isSuccess, navigate, dispatch, location.state]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUnverifiedEmail("");
    setResendMsg("");
    setOauthError("");
    const result = await dispatch(
      login({ email: formData.email, password: formData.password })
    );
    if (login.rejected.match(result)) {
      const payload = result.payload;
      if (payload?.code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(payload.email || formData.email);
      }
    }
  };

  const handleResend = async () => {
    const email = unverifiedEmail || formData.email;
    if (!email) return;
    setResending(true);
    setResendMsg("");
    try {
      const data = await authService.resendVerification(email);
      setResendMsg(data.message || "Verification email sent.");
    } catch (err) {
      setResendMsg(
        err.response?.data?.message || "Could not resend verification email."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-br from-blue-50 to-indigo-100 md:min-h-[70vh] dark:from-slate-950 dark:to-slate-900">
      <Seo {...SEO_ROUTES.login} />

      {/* Mobile-only top brand bar (header hidden on small screens) */}
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
          to="/signup"
          className="text-sm font-semibold text-indigo-600 dark:text-indigo-300"
        >
          Sign Up
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-6 text-center sm:px-6 md:p-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 md:text-3xl">
          Sign In
        </h1>
        {info && <p className="mt-2 text-sm text-green-700 dark:text-green-400">{info}</p>}
        {(isError || oauthError) && (
          <p className="mt-2 text-red-600">{oauthError || message}</p>
        )}
        {unverifiedEmail && (
          <div className="mt-3 text-sm">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-semibold text-blue-700 underline disabled:opacity-60"
            >
              {resending ? "Sending..." : "Resend verification email"}
            </button>
            {resendMsg && <p className="mt-1 text-gray-700 dark:text-slate-300">{resendMsg}</p>}
          </div>
        )}

        <div className="mt-5 w-full flex-1 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-8 md:mt-8 md:flex-none dark:border-slate-700 dark:bg-slate-900/90">
          <div className="mb-6 flex justify-center">
            <GoogleSignInButton />
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-300 dark:bg-slate-600" />
            <span className="text-xs text-gray-600 sm:text-sm dark:text-slate-400">
              or continue with email / User ID
            </span>
            <div className="h-px flex-1 bg-gray-300 dark:bg-slate-600" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-left">
            <input
              type="text"
              name="email"
              placeholder="Email or User ID"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-base font-semibold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <PasswordField
              name="password"
              placeholder="Password"
              required
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              wrapperClassName="relative w-full text-left"
              className="rounded-xl border border-slate-200 px-3 py-3 text-base font-semibold dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-blue-600 dark:text-blue-400"
              >
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-blue-600 px-3 py-3 text-base font-semibold text-white disabled:opacity-60"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-semibold text-blue-600 dark:text-blue-400">
              Sign up here
            </Link>
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
            By signing in you agree to our{" "}
            <Link
              to="/privacy"
              className="font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
            >
              Privacy &amp; Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
