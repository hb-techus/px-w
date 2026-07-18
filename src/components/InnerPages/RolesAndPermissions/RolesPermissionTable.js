import React, { useEffect, useState, useMemo } from "react";
import { DeleteRole, GetRolesList } from "../../../services/techus-services";
import {
  capitalizeFirstLetter,
  formatDateTime,
} from "../../../utils/commonUtils";

import { useLocation, useNavigate } from "react-router-dom";
import { showToast } from "../../../genriccomponents/techus-ToastNotification";
import { ShimmerTable } from "react-shimmer-effects";
import CustomDataTable from "../../../genriccomponents/ReactTable";
import ActionMenu from "../../../genriccomponents/ActionMenu";
import NoDataFound from "../../../genriccomponents/NoDataFound";
import Dropdown from "../../Common/DropDown";
import TextWithTooltip from "../../Common/ToolTip";
import { UpdateRoleStatus } from "../../../services/techus-services";
import FullPageLoader from "../../../genriccomponents/loaders/FullPageLoader";
import DeleteModal from "../../../genriccomponents/DeleteModal";
import { useSelector } from "react-redux";
import { countAccess } from "../../../services/techus-services";
import upgradImg from "/src/assets/Images/no_data_images/upgrade_1.webp";

const RolesPermissions = () => {
  const [showDeleteModel, setShowDeleteModel] = useState(false);
  const [initialLoader, setInitialLoader] = useState(true);
  const [loader, setLoader] = useState(false);
  const [rolesData, setRolesData] = useState([]);
  const [deleteRole, setDeleteRole] = useState();
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [roleToDeactivate, setRoleToDeactivate] = useState(null);


  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const organizationId = localStorage.getItem('organization_id')
  const [apiLoading, setApiLoading] = useState(false);

  const permissionsList = useSelector((s) => s?.auth?.user?.[0]?.permission_info) || {};
  const permissions = permissionsList?.role_management || {};
  console.log(permissions)

  const navigate = useNavigate();

  // const userType = localStorage.getItem("user_type");
  const location = useLocation()
  const isAdminPortal = location.pathname.startsWith('/admin')
  const userType = isAdminPortal ? 'ADMIN' : 'ORGANIZATION'
  const portalPrefix = userType === "ADMIN" ? "/admin" : "";


  const tableCustomStyles = {
    header: { style: { display: "none" } },

    headRow: {
      style: {
        backgroundColor: "#fafafa",
        borderTop: "1px solid #e5e7eb",
        borderBottom: "1px solid #e5e7eb",
        minHeight: "48px",
      },
    },

    headCells: {
      style: {
        fontSize: "15px",

        color: "#6e7178",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        paddingLeft: "16px",
        paddingRight: "16px",
      },
    },

    rows: {
      style: {
        minHeight: '58px',
        borderBottom: '1px solid #EAECF0',
        transition: 'background-color 0.15s ease',
        '&:last-of-type': { borderBottom: 'none' },
        '&:hover': {
          backgroundColor: '#f8faff',
          cursor: 'pointer',
        },
      },
    },

    cells: {
      style: {
        fontSize: "15px",
        color: "#585858",
        paddingLeft: "16px",
        paddingRight: "16px",
      },
    },
  };

  // ─── Filtered Data ─────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    let result = [...rolesData];

    if (searchTerm) {
      result = result.filter((item) =>
        Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      );
    }

    if (filterStatus !== "" && filterStatus !== "Filter") {
      const statusValue = filterStatus === "Active" ? 1 : 0;
      result = result.filter((item) => item.status === statusValue);
    }

    return result;
  }, [rolesData, searchTerm, filterStatus]);

  // ─── API ───────────────────────────────────────────────────────────────────
  const handleRolesPermissionList = async (offset = 0, limit = 100) => {
    try {
      const type = userType;

      const response = await GetRolesList(organizationId, { offset, limit, role_type: type });
      if (response?.valid) {
        setRolesData(response.data);
        setInitialLoader(false);
      } else {
        setInitialLoader(false);
      }
    } catch (error) {
      console.error("Get roles list error:", error);
      setInitialLoader(false);
    }
  };

  useEffect(() => {
    handleRolesPermissionList();
  }, [userType, organizationId]);

  const handleRolesDelete = async () => {
    try {
      if (!permissions?.delete) return;
      setShowDeleteModel(false);
      setLoader(true);

      const response = await DeleteRole({ role_id: deleteRole.id });
      if (response.valid) {
        showToast("success", response.message);
        await handleRolesPermissionList();
      } else {
        showToast("error", response.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoader(false);
      setDeleteRole(null);
    }
  };

  const handleShowDelete = (row) => {
    setDeleteRole(row);
    setShowDeleteModel(true);
  };

  const handleStatusToggle = async () => {
    try {
      if (!permissions?.edit) return;
      setApiLoading(true);
      const response = await UpdateRoleStatus({
        role_id: roleToDeactivate?.id,
        status: roleToDeactivate?.status === 1 ? 0 : 1,
      });
      if (response?.valid) {
        showToast("success", response.message || "Role status updated");
        handleRolesPermissionList();
      } else {
        showToast("error", response?.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Something went wrong");
    } finally {
      setApiLoading(false);
      setShowDeactivateModal(false);
      setRoleToDeactivate(null);
    }
  };
  // ─── Columns ───────────────────────────────────────────────────────────────
  const rolesColumns = [
    {
      name: "Name",
      selector: (row) => capitalizeFirstLetter(row.role_name),
      sortable: true,
      // minWidth: '180px',
      cell: (row) => (
        <span className="tw-cursor-pointer hover:tw-text-blue-600"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`${portalPrefix}/roles/view/${row.role_uuid}`);
          }}
        >
          <TextWithTooltip
            text={row.role_name ? capitalizeFirstLetter(row.role_name) : '-'}
            className=""


          />
        </span>
      ),
    },
    {
      name: "Description",
      selector: (row) => capitalizeFirstLetter(row.role_description),
      sortable: true,
      // grow: 2,

      cell: (row) => (
        // <TextWithTooltip
        // text={capitalizeFirstLetter(row.role_description)}
        <span className=" tw-truncate tw-text-wrap tw-my-2">
          {row.role_description}
        </span>
        // />
      ),
    },
    {
      name: "Created Date",

      selector: (row) =>
        row.created_date ? new Date(row.created_date).getTime() : 0,

      sortable: true,

      sortFunction: (a, b) =>
        new Date(a.created_date || 0).getTime() -
        new Date(b.created_date || 0).getTime(),

      cell: (row) => (
        <span className="">
          {formatDateTime(row.created_date)}
        </span>
      ),
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      minWidth: "130px",
      cell: (row) => (
        <span
          className={`tw-rounded-[20px] tw-inline-flex tw-items-center tw-justify-center tw-gap-[5px] tw-border tw-px-3 tw-py-1 tw-text-[13px] tw-font-medium tw-w-[93px] ${row.status === 0
            ? "tw-bg-[#fef3f2] tw-border-[#fecaca] tw-text-[#b91c1b]"
            : "tw-bg-[#f0fdf4] tw-border-[#bbf7d0] tw-text-[#16a34a]"
            }`}
        >
          <i
            className={`${row.status === 0 ? "icon-Failed" : "icon-Processed"
              } tw-text-[13px]`}
          />
          {row.status === 0 ? "Inactive" : "Active"}
        </span>
      ),
    },
    {
      name: "Action",
      button: true,
      center: true,
      width: "12%",
      cell: (row) => (
        <ActionMenu
          showView={permissions?.view}


          onView={() => navigate(`${portalPrefix}/roles/view/${row.role_uuid}`)}
          onEdit={() =>
            navigate(`${portalPrefix}/roles/update/${row.role_uuid}`)
          }
          onDelete={() => handleShowDelete(row)}
          onDeactivate={() => {
            setRoleToDeactivate(row);
            setShowDeactivateModal(true);
          }}
          deactivateLabel={row.status === 1 ? "Deactivate" : "Activate"}
          showEdit={row.is_system_role !== 1 && permissions?.edit}
          showDelete={row.is_system_role !== 1 && permissions?.delete}
          showDeactivate={row.is_system_role !== 1 && permissions?.edit}
        />
      ),
    },
  ];
  const isInitialEmpty = rolesData.length === 0;

  // ─── Empty State ───────────────────────────────────────────────────────────

  const EmptyDataView = () => {
    const hasActiveFilters = searchTerm || filterStatus !== "All";

    return (
      <NoDataFound
        title="No Roles Found"
        description={
          hasActiveFilters
            ? "No roles match your current search or filter criteria."
            : "Get started by creating your first role."
        }
        // buttonLabel={hasActiveFilters ? "Clear All Filters" : "Add Role"}
        buttonLabel={null}
        onReset={null}
      // onReset={() => {
      //   if (hasActiveFilters) {
      //     setSearchTerm("");
      //     setFilterStatus("All");
      //     handleRolesPermissionList();
      //   } else {
      //     navigate(`${portalPrefix}/roles/add`);
      //   }
      // }}
      />
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <React.Fragment>
      {/* {initialLoader && <FullPageLoader />} */}
      {apiLoading && <FullPageLoader />}
      {/* Page Header */}
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
        <div>
          <h1 className="tw-text-[20px] tw-font-semibold tw-text-[#111827]">
            Roles
          </h1>
          <p class="tw-text-[14px] tw-text-[#1e293b] tw-tracking-[0.31px]">Define custom roles and assign granular permissions to control what each user can access.</p>
        </div>

        {permissions?.add ? <button
          className="tw-flex tw-items-center tw-gap-2 tw-bg-[#0140c1] tw-px-5 tw-h-[40px] tw-text-white tw-rounded-md tw-text-sm tw-font-medium tw-transition-all tw-duration-200 hover:tw--translate-y-0.5 hover:tw-shadow-[0_4px_10px_rgba(1,64,193,0.35)]"
          onClick={async () => {

            if (isAdminPortal) {
              navigate(`${portalPrefix}/roles/add`);
              return;
            }
            try {
              setApiLoading(true);
              const raw = await countAccess({
                organization_id: organizationId,
                module_name: "roles",
              });

              // Parse if response comes as a string, use as-is if already an object
              const response = typeof raw === "string" ? JSON.parse(raw) : raw;
              console.log(response)
              if (response?.allowed) {
                console.log(response?.allowed);
                navigate(`${portalPrefix}/roles/add`);
              } else {
                console.log(response?.message);
                setUpgradeMessage(response?.message);
                setShowUpgradeModal(true);
              }
            } catch (err) {
              console.error("countAccess error:", err);
              showToast("error", "Something went wrong");
            }
            finally {
              setApiLoading(false);
            }
          }}
        >
          <i className="icon-New tw-text-sm"></i>
          <span className="tw-text-[15px]">Add Role</span>
        </button> : null}
      </div>

      {/* Table Card */}
      {loader || initialLoader ? (
        <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-4">
          <ShimmerTable row={8} col={8} />
        </div>
      ) : (
        <CustomDataTable
          columns={rolesColumns}
          data={filteredData}
          customStyles={tableCustomStyles}
          enablePagination={true}
          defaultPerPage={10}
          noDataComponent={<EmptyDataView />}
          // ── Search ──
          searchTerm={searchTerm}
          // onSearchChange={setSearchTerm}
          onSearchChange={isInitialEmpty ? null : setSearchTerm}
          searchPlaceholder="Search Role Name"
          // ── Filter Dropdown ──
          filterComponent={
            isInitialEmpty ? null : <Dropdown
              options={["All", "Active", "Inactive"]}
              placeholder="Status"
              value={filterStatus}
              width="tw-w-44 tw-h-10"
              onChange={(val) => setFilterStatus(val === "All" ? "" : val)}
            />
          }
        />
      )}

      {/* Delete Confirmation Modal */}

      {showDeactivateModal && roleToDeactivate && (
        <DeleteModal
          action="deactivate"
          entity="role"
          icon="icon-Roles--Permissions"
          status={roleToDeactivate?.status === 1 ? "Active" : "Inactive"}
          onClose={() => {
            setShowDeactivateModal(false);
            setRoleToDeactivate(null);
          }}
          onConfirm={handleStatusToggle}
        />
      )}

      {showDeleteModel && deleteRole && (
        <DeleteModal
          action="delete"
          entity="role"
          icon="icon-Roles--Permissions"
          subscriptionCount={deleteRole?.user_count ?? 0}
          onClose={() => {
            setShowDeleteModel(false);
            setDeleteRole(null);
          }}
          onConfirm={handleRolesDelete}
        />
      )}


      {showUpgradeModal && (
        <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-z-[9999] tw-flex tw-items-center tw-justify-center">
          <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-[750px] tw-h-[569px] tw-px-[74px] tw-pt-[69px] tw-pb-10 tw-relative tw-text-center">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="tw-absolute tw-top-4 tw-right-4 tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-gray-200 tw-text-gray-400 hover:tw-text-gray-600 hover:tw-bg-gray-50 tw-transition-colors"
            >
              <i className="icon-Close tw-text-[14px]"></i>
            </button>
            <h2 className="tw-text-[30px]  tw-font-bold tw-text-[#000000] tw-mb-8 tw-leading-snug">
              Unlock More with an Upgrade!
            </h2>
            <div className="tw-flex tw-justify-center tw-mb-4">
              <div className="tw-relative tw-w-[200px] tw-h-[175px] tw-flex tw-items-center tw-justify-center">
                <div className="tw-flex tw-justify-center tw-mb-6">
                  <img
                    src={upgradImg}
                    alt="Upgrade"
                    className="tw-w-36 tw-h-36 tw-object-contain"
                  />
                </div>
              </div>
            </div>
            <p className="tw-text-[18px] tw-text-[rgba(85, 85, 85, 0.33)] tw-mb-8 tw-leading-normal tw-px-2">
              {upgradeMessage}
            </p>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="tw-w-[318px] tw-h-[48px] tw-py-3 tw-text-white tw-text-[16px] tw-font-medium tw-rounded-[6px] tw-transition-all tw-duration-200 hover:tw-opacity-90 hover:tw-shadow-lg"
              style={{ background: "#0140c1" }}
            >
              Upgrade Your Package
            </button>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default RolesPermissions;
