import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import authService from "../redux/auth/authService";
import Seo from "../components/Seo";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get("token") || "";
    if (fromUrl) {
      setToken(fromUrl);
      window.history.replaceState({}, "", "/reset-password");
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Missing reset token.");
      return;
    }

    setLoading(true);
    try {
      const data = await authService.resetPassword({ token, password });
      setMessage(data.message || "Password updated.");
      navigate("/login?reset=1", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
      <Seo
        title="Reset password | Quotwellix"
        description="Choose a new Quotwellix password."
        noindex
      />
      <div className="max-w-md w-full rounded-2xl border border-blue-100 bg-white/95 p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-slate-100">
          Reset password
        </h1>
        {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
        {message && (
          <p className="mt-3 text-center text-sm text-green-700 dark:text-green-400">
            {message}
          </p>
        )}
        {!message && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min 8)"
              className="w-full rounded-md border px-3 py-2 font-medium dark:border-slate-600 dark:bg-slate-800"
            />
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-md border px-3 py-2 font-medium dark:border-slate-600 dark:bg-slate-800"
            />
            <button
              type="submit"
              disabled={loading || !token}
              className="w-full rounded-md bg-blue-600 px-3 py-2 font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
        <p className="mt-4 text-center text-sm">
          <Link to="/login?reset=1" className="font-semibold text-blue-600">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
