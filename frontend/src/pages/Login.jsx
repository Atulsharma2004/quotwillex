import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, reset } from "../redux/auth/authSlice";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import GoogleSignInButton from "../components/GoogleSignInButton";
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
    <div className="text-center p-5 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-[70vh]">
      <Seo {...SEO_ROUTES.login} />
      <h1 className="text-2xl font-bold text-gray-900">Login</h1>
      {info && <p className="text-green-700 mt-2 text-sm">{info}</p>}
      {(isError || oauthError) && (
        <p className="text-red-600 mt-2">{oauthError || message}</p>
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
          {resendMsg && <p className="mt-1 text-gray-700">{resendMsg}</p>}
        </div>
      )}
      <div className="bg-white/90 w-3/4 max-w-xl m-auto p-8 rounded-xl shadow-sm mt-8 border border-blue-100">
        <div className="mb-6 flex justify-center">
          <GoogleSignInButton />
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-sm text-gray-600">or continue with email / User ID</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="email"
            placeholder="Email or User ID"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-3/4 px-2 py-1 font-bold text-md mb-4 rounded-md border"
          />
          <br />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-3/4 px-2 py-1 font-bold text-md mb-4 rounded-md border"
          />
          <br />
          <div className="w-3/4 mx-auto text-right mb-2">
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-blue-600"
            >
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-2 py-1 w-3/4 rounded-md mb-1 mt-2 disabled:opacity-60"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="mt-2">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-semibold text-blue-600">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
