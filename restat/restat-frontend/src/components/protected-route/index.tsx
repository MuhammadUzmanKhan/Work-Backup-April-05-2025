import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AUTH_TOKEN, routes } from "../../services";
import axios from "axios";
import { ProtectedRouteProps } from "../../services/types/common";

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem(AUTH_TOKEN);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }

    return () => {
      delete axios.defaults.headers.common['Authorization'];
    };
  }, [token]);

  return token ? children : <Navigate to={routes.signIn} replace />;
};

export default ProtectedRoute;
