// import React from "react";
// import { useSelector } from "react-redux";
// import { Navigate } from "react-router-dom";
// import FullPageLoader from "../genriccomponents/loaders/FullPageLoader";

// const OrgPermissionGuard = ({ children, packageKey, module: moduleLabel, permission }) => {
//   const user            = useSelector((s) => s?.auth?.user?.[0]);
//   const authStatus      = useSelector((s) => s?.auth?.status);
//   const permissionsList = user?.permission_info;
//   const packageInfo     = user?.package_info;

//   if (authStatus === "idle" || authStatus === "loading") return <FullPageLoader />;
//   if (!user || permissionsList === undefined)            return null;

//   const pkgEnabled = packageInfo?.[packageKey]?.enabled === true;
//   if (!pkgEnabled) return <Navigate to="/restricted-package" replace />;

//   const hasAccess = !!permissionsList?.[moduleLabel]?.[permission];
//   if (!hasAccess) return <Navigate to="/restricted" replace />;

//   return <>{children}</>;
// };

// export default OrgPermissionGuard;


import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import FullPageLoader from "../genriccomponents/loaders/FullPageLoader";

const OrgPermissionGuard = ({
  children,
  parentPackageKey,   // ← optional, e.g. "contract_command"
  packageKey,         // e.g. "proposal_drafter" (child key inside parent.children)
  module: moduleLabel,
  permission,
}) => {
  const user            = useSelector((s) => s?.auth?.user?.[0]);
  const authStatus      = useSelector((s) => s?.auth?.status);
  const permissionsList = user?.permission_info;
  const packageInfo     = user?.package_info;

  if (authStatus === "idle" || authStatus === "loading") return <FullPageLoader />;
  if (!user || permissionsList === undefined)            return null;

  // ── Check 1: parent package enabled? (e.g. contract_command) ────────────
  if (parentPackageKey) {
    const parentEnabled = packageInfo?.[parentPackageKey]?.enabled === true;
    if (!parentEnabled) return <Navigate to="/restricted-package" replace />;
  }

  // ── Check 2: child package enabled? (e.g. proposal_drafter) ─────────────
  if (packageKey) {
    const childEnabled = parentPackageKey
      ? packageInfo?.[parentPackageKey]?.children?.[packageKey]?.enabled === true
      : packageInfo?.[packageKey]?.enabled === true;
    if (!childEnabled) return <Navigate to="/restricted-package" replace />;
  }

  // ── Check 3: permission ──────────────────────────────────────────────────
 // ── Check 3: permission — only if module is provided ────────────────────
if (moduleLabel) {
  const modulePerms = permissionsList?.[moduleLabel];
  if (modulePerms !== undefined) {
    const hasAccess = !!modulePerms?.[permission];
    if (!hasAccess) return <Navigate to="/restricted" replace />;
  }
}

return <>{children}</>;
};

export default OrgPermissionGuard;