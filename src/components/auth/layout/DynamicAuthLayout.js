import React from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import AdminAuthLayout from "./AdminAuthLayout";

const DynamicAuthLayout = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Check if ut parameter exists
  const ut = searchParams.get("ut");
  
  // Check if it's admin route
  const isAdminRoute = location.pathname.startsWith("/admin");
  
  // Check if it's reset password or activate account page
  const isResetPasswordPage = location.pathname.includes("/reset_password");
  const isActivateAccountPage = location.pathname.includes("/activate");
  
  // Special logic for reset password and activate account:
  // - If ut=org → AuthLayout
  // - If no ut parameter or ut is not "org" → AdminAuthLayout
  if (isResetPasswordPage || isActivateAccountPage) {
    return ut === "org" ? <AuthLayout /> : <AdminAuthLayout />;
  }
  
  // For all other routes:
  // - Admin routes (/admin/*) → AdminAuthLayout
  // - Everything else → AuthLayout (default)
  return isAdminRoute ? <AdminAuthLayout /> : <AuthLayout />;
};

export default DynamicAuthLayout;
