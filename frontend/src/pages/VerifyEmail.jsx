import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import authService from "../redux/auth/authService";
import Seo from "../components/Seo";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    // Keep token out of the address bar after the request starts.
    window.history.replaceState({}, "", "/verify-email");

    authService
      .verifyEmail(token)
      .then((data) => {
        setStatus("ok");
        setMessage(data.message || "Email verified successfully.");
        navigate("/login?verified=1", { replace: true });
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.message || "Invalid or expired verification link."
        );
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
      <Seo
        title="Verify email | Quotwellix"
        description="Confirm your Quotwellix account email."
        noindex
      />
      <div className="max-w-md w-full rounded-2xl border border-blue-100 bg-white/95 p-8 shadow-sm text-center dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          Email verification
        </h1>
        <p
          className={`mt-4 text-sm ${
            status === "error" ? "text-red-600" : "text-gray-700 dark:text-slate-300"
          }`}
        >
          {message}
        </p>
        {status !== "loading" && (
          <Link
            to="/login?verified=1"
            className="mt-6 inline-block font-semibold text-blue-600 hover:underline"
          >
            Go to login
          </Link>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
