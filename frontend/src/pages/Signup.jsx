import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import  { register, reset } from "../redux/auth/authSlice";
import { Link, useNavigate } from "react-router-dom";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "user",
    password: "",
    profilePicture: "",
    bio: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(null); // For previewing the uploaded image
  const { isSuccess, isError, message } = useSelector((state) => state.auth);
  const fileInputRef = useRef(null); // Ref to handle file input click

  useEffect(() => {
    if (isSuccess) {
      navigate("/login"); // Redirect to login page after successful registration
      dispatch(reset());
    }
  }, [isSuccess, navigate, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Convert image to Base64 and update state
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setFormData({ ...formData, profilePicture: reader.result });
        setImagePreview(reader.result);
      };
    }
  };

  // Trigger file input when user clicks the profile icon
  const handleIconClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(register({ ...formData, profilePic: formData.profilePicture }));
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }} className="">
      <h2 className="text-2xl font-bold">Sign Up</h2>
      {isError && <p style={{ color: "red" }}>{message}</p>}
      <div className="bg-gray-200 w-3/4 m-auto p-8 rounded-md mt-4">
      <form onSubmit={handleSubmit} className="">
      {/* <input type="file" accept="image/*" onChange={handleImageChange} /><br /> */}
      {/* User Icon / Profile Picture Upload */}
      <div 
          style={{
            // display: "inline-block",
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            overflow: "hidden",
            cursor: "pointer",
            border: "2px solid #ccc",
            marginBottom: "16px"
          }}
          onClick={handleIconClick}
         className="mx-auto"
        >
          <img 
            src={imagePreview || "https://static-00.iconduck.com/assets.00/user-icon-1024x1024-dtzturco.png"} 
            alt="Profile Preview" 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          />
        </div>
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleImageChange} 
          style={{ display: "none" }} 
        />
      {/* {imagePreview && <img src={imagePreview} alt="Profile Preview" style={{ width: "100px", height: "100px", marginTop: "10px", borderRadius: "50%" }} />}<br /> */}
        <input type="text" name="name" placeholder="Name" required onChange={handleChange}  className="w-3/4 px-2 py-1 font-bold text-md mb-4 rounded-md"/><br />
        <input type="email" name="email" placeholder="Email" required onChange={handleChange}  className="w-3/4 px-2 py-1 font-bold text-md mb-4 rounded-md"/><br />
        <select name="role" onChange={handleChange} className="w-3/4 px-2 py-1 font-bold text-md mb-4 rounded-md">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select><br />
        <input type="password" name="password" placeholder="Password" required onChange={handleChange}  className="w-3/4 px-2 py-1 font-bold text-md mb-4 rounded-md"/><br />
        {/* <input type="url" name="profilePicture" placeholder="Profile Picture URL" onChange={handleChange} /><br /> */}
        <input type="text" name="bio" placeholder="Bio" onChange={handleChange}  className="w-3/4 px-2 py-1 font-bold text-md mb-4 rounded-md"/><br />
        <button type="submit" className="bg-blue-600 text-white px-2 py-1 w-3/4 rounded-md mb-1 mt-2">Register</button>
      </form>
      <p>Already have an account? <Link to="/login" className="font-semibold text-blue-500">Login here</Link></p>
      </div>
    </div>
  );
};

export default Signup;
