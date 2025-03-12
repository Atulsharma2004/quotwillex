import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Profile from "./pages/Profile.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import Header from "./components/Header.jsx";
import Home from "./pages/Home.jsx";
import Quotes from "./pages/Quotes.jsx";

function App() {
  return (
    <Router>
      <Header/>
      <Routes>
      <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/quotes" element={<Quotes />} />

      </Routes>
    </Router>
  );
}

export default App;
