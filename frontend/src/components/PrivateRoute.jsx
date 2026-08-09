import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const PrivateRoute = () => {
  const { user, token } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!user || !token) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
    );
  }

  return <Outlet />;
};

export default PrivateRoute;
