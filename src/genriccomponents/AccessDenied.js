import React from "react";
import { ShieldX } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AccessDenied = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.includes('admin');

  const permissionsList = useSelector((s) => s?.auth?.user?.[0]?.permission_info) || {};
  const packageInfo = useSelector((s) => s?.auth?.user?.[0]?.package_info) || {};
const getDashboardPath = () => {
  if (isAdmin) {
    if (permissionsList?.user_management?.view) return '/admin/users';
    if (permissionsList?.package_management?.view) return '/admin/packages';
    if (permissionsList?.organization_management?.view) return '/admin/organizations';
    if (permissionsList?.role_management?.view) return '/admin/roles';
    return '/admin/settings';
  }

  // Org portal — match sidebar order exactly
  // Projects
  if (packageInfo?.projects?.enabled === true) return '/projects';

  // Products
  if (Object.values(permissionsList?.products || {}).some(Boolean)) return '/products';

  // Labor Cost
  if (Object.values(permissionsList?.labor_cost || {}).some(Boolean)) return '/labor-cost';

  // Knowledge Base
  if (packageInfo?.org_kb?.enabled === true) {
    const hasKbPerm = Object.values(permissionsList?.company_knowledge_management || {}).some(Boolean);
    if (hasKbPerm) return '/knowledge-base';
  }

  // Users
  if (packageInfo?.users?.enabled === true) {
    const hasUserPerm = Object.values(permissionsList?.user_management || {}).some(Boolean);
    if (hasUserPerm) return '/users';
  }

  // Roles
  if (packageInfo?.roles?.enabled === true) {
    const hasRolePerm = Object.values(permissionsList?.role_management || {}).some(Boolean);
    if (hasRolePerm) return '/roles';
  }

  return '/settings';
};

  return (
    <div className="tw-w-full tw-min-h-screen tw-flex tw-items-center tw-justify-center tw-bg-[#f5f7fa] tw-overflow-hidden">
      <div className="tw-w-[720px] tw-bg-white tw-border tw-border-[#e6e8ec] tw-rounded-lg tw-p-[20px_40px] tw-text-center tw-shadow-sm">

        <div className="tw-flex tw-justify-center tw-mb-6">
          <div className="tw-relative">
            <div className="tw-w-[90px] tw-h-[90px] tw-bg-[linear-gradient(135deg,#ffe5d9,#fff1e6)] tw-rounded-full tw-flex tw-items-center tw-justify-center">
              <div className="tw-w-[65px] tw-h-[65px] tw-bg-[linear-gradient(135deg,#ffc9c9,#ffd6a8)] tw-rounded-full tw-flex tw-items-center tw-justify-center">
                <ShieldX className="tw-w-8 tw-h-8 tw-text-[#e03131]" />
              </div>
            </div>
            <span className="tw-absolute tw-left-[-10px] tw-bottom-[-6px] tw-w-3 tw-h-3 tw-bg-[linear-gradient(135deg,#ffc9c9,#ffd6a8)] tw-rounded-full"></span>
          </div>
        </div>

        <h2 className="tw-text-[22px] tw-font-semibold tw-text-[#1f2937] tw-mb-3">
          Access Denied
        </h2>

        <p className="tw-text-[14px] tw-text-[#6b7280] tw-leading-6 tw-mb-6">
          You don't have permissions to access this page. <br />
          Contact an administrator to get permissions or go to <br />
          the home page and browse other pages.
        </p>

        <div className="tw-flex tw-items-center tw-justify-center tw-gap-4 tw-mb-6">
          <button
            className="tw-bg-[#2563eb] hover:tw-bg-[#1d4ed8] tw-text-white tw-text-[14px] tw-font-medium tw-px-5 tw-py-2.5 tw-rounded-md tw-flex tw-items-center tw-gap-2"
            onClick={() => navigate(getDashboardPath())}
          >
            <i className="icon-home tw-text-[20px]" />
            Go to Dashboard
          </button>
        </div>

        <div className="tw-border-t tw-border-[#e5e7eb] tw-my-4"></div>

        <p className="tw-text-[12px] tw-text-[#9ca3af]">
          Error Code: 403 • Forbidden
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;