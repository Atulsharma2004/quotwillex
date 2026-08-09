import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { completeOAuthLogin, reset } from "../redux/auth/authSlice";
import { AuthCallbackSkeleton } from "../components/Shimmer";
import Seo from "../components/Seo";
import { postAuthPath } from "../utils/profileCompletion";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    // Legacy ?token= links are rejected — tokens must not live in URLs.
    if (!code) {
      setFailed(true);
      navigate("/login?error=google_auth_failed", { replace: true });
      return;
    }

    dispatch(completeOAuthLogin(code))
      .unwrap()
      .then((data) => {
        dispatch(reset());
        navigate(postAuthPath(data?.user), { replace: true });
      })
      .catch(() => {
        setFailed(true);
        navigate("/login?error=google_auth_failed", { replace: true });
      });
  }, [searchParams, dispatch, navigate]);

  if (failed) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
        <Seo
          title="Sign-in | Quotwellix"
          description="Completing Google sign-in."
          noindex
        />
        <p className="text-gray-700 font-medium dark:text-slate-200">
          Google sign-in failed. Redirecting...
        </p>
      </div>
    );
  }

  return (
    <>
      <Seo
        title="Sign-in | Quotwellix"
        description="Completing Google sign-in."
        noindex
      />
      <AuthCallbackSkeleton />
    </>
  );
};

export default AuthCallback;
