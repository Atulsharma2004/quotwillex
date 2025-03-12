import React from "react";
import { useSelector } from "react-redux";
// import { logout } from "../redux/auth/authSlice";
// import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  // const dispatch = useDispatch();
  // const navigate = useNavigate();

  if (!user) return <p>Please login to view your profile.</p>;

  return (
    <div >
      <div className="image-area bg-gray-200 px-12 py-8 flex ">
      <div className="flex flex-col justify-center items-center">
      <img
        src={user.profilePicture || "https://static-00.iconduck.com/assets.00/user-icon-1024x1024-dtzturco.png"}
        alt="Profile"
        style={{ borderRadius: "50%", width: "100px", height: "100px" }}
        className="mb-2 flex items-center justify-center"
      />
      <h2>{user.name}{user.role}</h2>
      <p>Email: {user.email}</p>
      <p>Bio: {user.bio || "No bio available"}</p>
      </div>
      <div className="flex flex-row  gap-12 mt-6 ml-12">
      <h3>Posts: {user.postCount || 0}</h3>
      <h3>Followers ({user.followers.length}):</h3>
      {/* <ul>
        {user.followers.length > 0 ? (
          user.followers.map((follower) => <li key={follower.email}>{follower.name}</li>)
        ) : (
          <p>No followers</p>
        )}
      </ul> */}
      <h3>Following ({user.following.length}):</h3>
      {/* <ul>
        {user.following.length > 0 ? (
          user.following.map((follow) => <li key={follow.email}>{follow.name}</li>)
        ) : (
          <p>Not following anyone</p>
        )}
      </ul> */}
      </div>
      </div>
      <div className="post-area">
      <h3>Quotes by {user.name}</h3>
      <ul>
        {user.quotes?.length > 0 ? (
          user.quotes.map((quote, index) => <li key={index}>{quote}</li>)
        ) : (
          <p>No quotes available.</p>
        )}
      </ul>
      </div>
      {/* <button onClick={() => { dispatch(logout()); navigate("/login"); }}>
        Logout
      </button> */}
    </div>
  );
};

export default Profile;
