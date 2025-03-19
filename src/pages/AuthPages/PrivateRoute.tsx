import { Navigate, Outlet } from "react-router";

const PrivateRoute = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/signin" />;
  }

  return <Outlet />;
};

export default PrivateRoute;
