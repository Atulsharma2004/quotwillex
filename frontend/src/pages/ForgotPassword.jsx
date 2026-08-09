import { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../redux/auth/authService";
import Seo from "../components/Seo";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await authService.forgotPassword(email.trim());
      setMessage(data.message || "Check your email for a reset link.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
      <Seo
        title="Forgot password | Quotwellix"
        description="Reset your Quotwellix password."
        noindex
      />
      <div className="max-w-md w-full rounded-2xl border border-blue-100 bg-white/95 p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-slate-100">
          Forgot password
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-slate-400">
          Enter your account email and we’ll send a reset link.
        </p>
        {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
        {message && (
          <p className="mt-3 text-center text-sm text-green-700 dark:text-green-400">
            {message}
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-md border px-3 py-2 font-medium dark:border-slate-600 dark:bg-slate-800"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-3 py-2 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="font-semibold text-blue-600">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
