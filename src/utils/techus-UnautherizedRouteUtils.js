/***************************************************************************************
 * @module       Unauthorized Route Utils 
 * @name         techus-Unauthorized Route Utils
 * @description  Component for handling unauthorized route access and redirection
 * @version      1.0.0
 * @license      Licensed under the MIT License
 * @createdon    October 2025
 * @since        1.0
 ***************************************************************************************/

import React from "react";
import { Navigate } from "react-router-dom";

const UnAuthRoute = ({ children, portal }) => {
  const token =
    portal === "admin"
      ? localStorage.getItem("prexo_admin_access_token")
      : localStorage.getItem("prexo_organization_access_token");

  if (token) {
    return (
      <Navigate
        to={portal === "admin" ? "/admin/users" : "/projects"}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default UnAuthRoute;