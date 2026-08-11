import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { isAccessTokenValid } from "../utils/accessToken";

const PrivateRoute = () => {
  const { user, token, sessionChecked } = useSelector((state) => state.auth);
  const location = useLocation();

  const hasValidSession = Boolean(user && token && isAccessTokenValid(token));

  if (token && !sessionChecked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Checking session…
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
};

export default PrivateRoute;
