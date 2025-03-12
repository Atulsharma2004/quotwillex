import api from "../../api/api";

const register = async (userData) => {
  const response = await api.post("/users/register", userData);
  return response.data;
};

const login = async (userData) => {
  const response = await api.post("/users/login", userData);
  return response.data;
};

const logout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};

export default { register, login, logout };
