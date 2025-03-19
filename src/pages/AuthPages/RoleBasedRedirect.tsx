import { Navigate } from "react-router";

const RoleBasedRedirect = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/signin" />;
  }

  // Decode the JWT token to get the user's role
  const payload = JSON.parse(atob(token.split(".")[1]));
  const userRole = payload.role;

  if (userRole === "admin") return <Navigate to="/home" />;
  if (userRole === "supervisor") return <Navigate to="/supervisor-dashboard" />;
  if (userRole === "foreman") return <Navigate to="/foreman-dashboard" />;
  return <Navigate to="/user-dashboard" />;
};

export default RoleBasedRedirect;
