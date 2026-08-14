import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Profile from "./pages/Profile.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Quotes from "./pages/Quotes.jsx";
import PopularQuotes from "./pages/PopularQuotes.jsx";
import Awards from "./pages/Awards.jsx";
import Contact from "./pages/Contact.jsx";
import Guidelines from "./pages/Guidelines.jsx";
import Privacy from "./pages/Privacy.jsx";
import FullProfile from "./pages/FullProfile.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import NotFound from "./pages/NotFound.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import { bootstrapSession } from "./redux/auth/authSlice";

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
