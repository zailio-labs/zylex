import React from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticate, isAdmin } from "./fetchApi";

const AdminProtectedRoute = ({ children }) => {
  if (isAdmin() && isAuthenticate()) {
    return children;
  }
  
  return <Navigate to="/user/profile" replace />;
};

export default AdminProtectedRoute;
