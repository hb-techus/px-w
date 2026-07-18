import React from "react";
import { useLocation, NavLink } from "react-router-dom";
import MyProfile from "./MyProfile";
import ChangePassword from "./ChangePassword";

const ProfileLayout = () => {
  const location = useLocation();

  // Determine portal based on current path
  const isAdminPortal = location.pathname.startsWith("/admin");
  const baseUrl = isAdminPortal ? "/admin" : "";

  // Determine which component to show
  const isChangePassword = location.pathname.endsWith("/change-password");

  return (
    <div className="tw-flex tw-flex-col tw-h-full tw-bg-white tw-rounded-md">
      {/* Tabs Navigation */}
      <div className="tw-flex tw-gap-8 tw-px-8 tw-pt-6 tw-border-b tw-border-gray-200 tw-bg-white">
        <NavLink
          to={`${baseUrl}/profile`}
          className={({ isActive }) =>
            `tw-pb-2 tw-text-sm tw-font-medium tw-transition-all ${
              isActive
                ? "tw-text-[#000] tw-border-b-2 tw-border-[#0140c1]"
                : "tw-text-[#b8b8b8] hover:tw-text-[#0140c1]"
            }`
          }
          end
        >
          My Profile
        </NavLink>

        <NavLink
          to={`${baseUrl}/change-password`}
          className={({ isActive }) =>
            `tw-pb-2 tw-text-sm tw-font-medium tw-transition-all ${
              isActive
                ? "tw-text-[#000] tw-border-b-2 tw-border-[#0140c1]"
                : "tw-text-[#b8b8b8] hover:tw-text-[#0140c1]"
            }`
          }
        >
          Change Password
        </NavLink>
      </div>

      {/* Content Area */}
      <div className="tw-flex-1 tw-p-4 tw-overflow-y-auto">
        {isChangePassword ? <ChangePassword /> : <MyProfile />}
      </div>
    </div>
  );
};

export default ProfileLayout;