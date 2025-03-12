import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/auth/authSlice";
import { Link } from "react-router-dom";

const Header = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  return (
    <header className="bg-blue-600 text-white p-4 flex justify-between">
      <h1 className="text-xl font-bold"><Link to="/">QuoteApp</Link></h1>
      {user ? (
        <div className="flex justify-between gap-8 items-center">
          <Link to="/profile" className="text-white">Profile</Link>
          <Link to="/quotes" className="text-white">Quotes</Link>
          <Link onClick={() => dispatch(logout())} className="text-white">
            Logout
          </Link>
          <Link><img src={user.profilePicture || "https://static-00.iconduck.com/assets.00/user-icon-1024x1024-dtzturco.png"} alt="user_img" style={{ borderRadius: "50%", width: "50px", height: "50px" }}/></Link>
          
        </div>
      ) : (
        <div className="flex justify-between gap-8 items-center">
          <Link to="/login" className="text-white">Login</Link>
          <Link to="/signup" className="text-white">SignUp</Link>
          </div>
      )}
    </header>
  );
};

export default Header;
