import React, { useContext, useState } from "react";
import { DeleteOrganizationData } from "../../../../services/techus-services";
import DeleteModal from "../../../../genriccomponents/DeleteModal";
import { SettingsContext } from "../Context/SettingsContext";
import { useNavigate } from "react-router-dom";

const AdvancedSettings = () => {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  const { orgData } = useContext(SettingsContext);
  const navigate = useNavigate()
  const handleDelete = async () => {
    try {
      await DeleteOrganizationData(orgData?.organization_uuid);
      setOpen(false);
      const orgKeys = [
        'organization_uuid', 'organization_id', 'organization_name',
        'prexo_organization_uuid', 'prexo_organization_isAuthenticated', 'prexo_organization_access_token',
        'org_uuid', 'organizationUuid',
        'project_id', 'project_uuid', 'current_project_name', 'project_status',
         'email', 'user_email', 'prexo_email', 'email_id', 'userEmail',
      ];
      orgKeys.forEach(key => localStorage.removeItem(key));
      setTimeout(() => {
        navigate('/login')
      }, 1000)
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="tw-bg-[#fff] tw-rounded-[8px] tw-shadow-sm tw-pb-2">
      <div className="tw-flex tw-flex-col tw-gap-3">
        <div className="tw-border-b tw-py-3 tw-px-4">
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-bg-blue-100 tw-flex tw-items-center tw-p-1.5 tw-rounded-[8px]">
              <i className="icon-Settings tw-text-[26px] tw-font-[600] tw-text-[#48f]"></i>
            </div>
            <span className="tw-text-[20px] tw-font-[600]">
              Advanced Settings
            </span>
          </div>
        </div>
        <div className="tw-pl-8 tw-pr-4 tw-flex tw-flex-col tw-gap-3">
          <div className="tw-flex tw-justify-between">
            <div className="tw-text-red-500 tw-flex tw-items-center tw-gap-2">
              <i className="icon-AI-Risk-Identifier tw-text-[24px]"></i>
              <p className="tw-font-[500] tw-text-[18px] tw-text-[#ff4444]">Danger Zone</p>
            </div>

            <div
              onClick={() => setShow((prev) => !prev)}
              className="tw-text-[14px] tw-text-[#0140c1] tw-font-medium tw-cursor-pointer" >
              {show ? "Hide Details" : "Show Details"}
            </div>
          </div>

          {/* Animated section */}
          <div
            className={`tw-transition-all tw-duration-300 tw-overflow-hidden ${show ? "tw-max-h-[200px] tw-opacity-100" : "tw-max-h-0 tw-opacity-0"
              }`} >
            <div className="tw-flex tw-flex-col tw-gap-3">
              <span className="tw-text-[14px] tw-text-[#101828]">
                Once you delete your account, there is no going back. All your
                data, projects, and settings will be permanently removed.
              </span>

              <button onClick={() => setOpen(true)} className="tw-w-[220px] tw-bg-[#ff4444] tw-text-white tw-py-1.5 tw-text-center tw-rounded-[6px] tw-text-[14px] tw-mb-4">
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      </div>
      {open && (
        <DeleteModal
          entity="Send Deletion Request"
          action="delete"
          status="Active"
          subscriptionCount={orgData?.project_count}
          icon="icon-AI-Risk-Identifier"
          onClose={() => setOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default AdvancedSettings;