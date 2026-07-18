/***************************************************************************************
 * @module       Protected Route Utils 
 * @name         techus-Protected Route Utils
 * @description  Component for handling protected route access and authentication
 * @version      1.0.0
 * @license      Licensed under the MIT License
 * @createdon    October 2025
 * @since        1.0
 ***************************************************************************************/

import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, portal }) => {
  const location = useLocation();

  const token =
    portal === "admin"
      ? localStorage.getItem("prexo_admin_access_token")
      : localStorage.getItem("prexo_organization_access_token");

  if (!token) {
    return (
      <Navigate
        to={portal === "admin" ? "/admin/login" : "/login"}
        replace
        state={{ from: location }}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;