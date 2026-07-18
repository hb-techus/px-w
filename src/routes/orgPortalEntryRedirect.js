import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const OrgPortalEntryRedirect = () => {
  const permissionsList = useSelector((s) => s?.auth?.user?.[0]?.permission_info);
  const packageInfo     = useSelector((s) => s?.auth?.user?.[0]?.package_info);
  const authStatus      = useSelector((s) => s?.auth?.status);

  if (authStatus === "idle" || authStatus === "loading") return null;

  const canAccess = (packageKey, permKey) =>
    packageInfo?.[packageKey]?.enabled === true &&
    !!permissionsList?.[permKey]?.view;

  if (canAccess("users", "user_management")) return <Navigate to="users"    replace />;
  if (canAccess("roles", "role_management")) return <Navigate to="roles"    replace />;

  // Projects is always the org baseline — no package/permission gate
  return <Navigate to="projects" replace />;
};

export default OrgPortalEntryRedirect;