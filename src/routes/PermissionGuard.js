import React from "react";
import { useSelector } from "react-redux";
import FullPageLoader from "../genriccomponents/loaders/FullPageLoader";
import { Navigate } from "react-router-dom";

const PermissionGuard = ({ children, module: moduleLabel, permission }) => {
  const user = useSelector ((s) => s?.auth?.user?.[0]);
  const authStatus = useSelector((s) => s?.auth?.status);
  const permissionsList = user?.permission_info;

  if (authStatus === 'idle' || authStatus === 'loading') {
    return <FullPageLoader />;
  }

  if (!user || permissionsList === undefined) {
    return null;
  }

  const modulePermissions = permissionsList?.[moduleLabel] || {};
  const hasAccess = !!modulePermissions?.[permission];

if (!hasAccess) return <Navigate to="/admin/restricted" replace />;

  return <>{children}</>;
};

export default PermissionGuard;