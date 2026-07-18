
import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const AdminPortalEntryRedirect = () => {
  const permissionsList = useSelector((s) => s?.auth?.user?.[0]?.permission_info);
  const authStatus = useSelector((s) => s?.auth?.status);

  if (authStatus === 'idle' || authStatus === 'loading') return null;

  const perms = permissionsList || {};

  if (perms?.organization_management?.view) return <Navigate to="organizations" replace />;
  if (perms?.package_management?.view) return <Navigate to="packages" replace />;
  if (perms?.role_management?.view) return <Navigate to="roles" replace />;
  if (perms?.product_management?.view) return <Navigate to="products" replace />;
  if (perms?.user_management?.view) return <Navigate to="users" replace />;

  return <Navigate to="restricted" replace />;
}

export default AdminPortalEntryRedirect