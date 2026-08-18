import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import { bootstrapSession } from "./redux/auth/authSlice";

const Profile = lazy(() => import("./pages/Profile.jsx"));
const Signup = lazy(() => import("./pages/Signup.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Quotes = lazy(() => import("./pages/Quotes.jsx"));
const PopularQuotes = lazy(() => import("./pages/PopularQuotes.jsx"));
const Awards = lazy(() => import("./pages/Awards.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const Guidelines = lazy(() => import("./pages/Guidelines.jsx"));
const Privacy = lazy(() => import("./pages/Privacy.jsx"));
const FullProfile = lazy(() => import("./pages/FullProfile.jsx"));
const AuthCallback = lazy(() => import("./pages/AuthCallback.jsx"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

const RouteFallback = () => (
  <div
    className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500 dark:text-slate-400"
    role="status"
    aria-live="polite"
  >
    Loading…
  </div>
);

const MOBILE_FULLSCREEN_AUTH = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

function AppShell() {
  const location = useLocation();
  const hideChromeOnMobile = MOBILE_FULLSCREEN_AUTH.has(location.pathname);

  return (
    <div className="flex min-h-screen flex-col app-shell bg-[var(--page-bg)] text-[var(--text)]">
      <div className={hideChromeOnMobile ? "hidden md:block" : undefined}>
        <Header />
      </div>
      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/popular-quotes" element={<PopularQuotes />} />
          <Route
            path="/motivational-quotes"
            element={<PopularQuotes landingKey="motivation" />}
          />
          <Route
            path="/inspirational-quotes"
            element={<PopularQuotes landingKey="inspiration" />}
          />
          <Route
            path="/hindi-quotes"
            element={<PopularQuotes landingKey="hindi" />}
          />
          <Route path="/awards" element={<Awards />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/guidelines" element={<Guidelines />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route element={<PrivateRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/account" element={<FullProfile />} />
            <Route path="/profile/:profileKey" element={<Profile />} />
            <Route path="/quotes" element={<Quotes />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      <div className={hideChromeOnMobile ? "hidden md:block" : undefined}>
        <Footer />
      </div>
    </div>
  );
}

function App() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      dispatch(bootstrapSession());
    }
  }, [dispatch, token]);

  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
