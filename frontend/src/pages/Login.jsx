import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import  { login, reset } from "../redux/auth/authSlice";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isSuccess, isError, message } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user || isSuccess) {
      navigate("/profile"); // Redirect to profile after login
      dispatch(reset());
    }
  }, [user, isSuccess, navigate, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(formData));
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2 className="text-2xl font-bold">Login</h2>
      {isError && <p style={{ color: "red" }}>{message}</p>}
      <div className="bg-gray-200 w-3/4 m-auto p-8 rounded-md mt-8">
      <form onSubmit={handleSubmit}>
        <input type="email" name="email" placeholder="Email" required onChange={handleChange} className="w-3/4 px-2 py-1 font-bold text-md mb-4 rounded-md"/><br />
        <input type="password" name="password" placeholder="Password" required onChange={handleChange} className="w-3/4 px-2 py-1 font-bold text-md mb-4 rounded-md"/><br />
        <button type="submit" className="bg-blue-600 text-white px-2 py-1 w-3/4 rounded-md mb-1 mt-2">Login</button>
      </form>
      <p>Don't have an account? <Link href="/signup" className="font-semibold text-blue-500">Sign up here</Link></p>
      </div>
    </div>
  );
};

export default Login;
