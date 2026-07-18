import React, { useState, useMemo, useRef, useEffect } from "react";
import CustomDataTable from "../../../genriccomponents/ReactTable";
import DropDownPortal from "../../../genriccomponents/DropdownPortal";
import { useLocation, useNavigate } from "react-router-dom";
import TextWithTooltip from "../../Common/ToolTip";
import { ShimmerTable } from "react-shimmer-effects";
import NoDataFound from "../../../genriccomponents/NoDataFound";
import {
  GetUserList,
  DeleteUser,
  DeactivateUser,
  GetRolesList,
  ResendActivation,
} from "../../../services/techus-services";
import { showToast } from "../../../genriccomponents/techus-ToastNotification";
import FullPageLoader from "../../../genriccomponents/loaders/FullPageLoader";
import {
  capitalizeFirstLetter,
  formatDateTime,
} from "../../../utils/commonUtils";
import { Link } from "lucide-react";
import DeleteModal from "../../../genriccomponents/DeleteModal";
import { useSelector } from "react-redux";

import FilterDropdown from "../../../genriccomponents/FilterDropdown";
import ResetPasswordModal from "../../auth/pages/ResetPasswordModal";

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [sortConfig, setSortConfig] = useState("Default");
  const [isLoading, setIsLoading] = useState(false);
  const [, setDeleteId] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUser, setResetUser] = useState(null);

  const permissionsList =
    useSelector((s) => s?.auth?.user?.[0]?.permission_info) || {};
  const permissions = permissionsList?.user_management || {};
  const [apiLoading, setApiLoading] = useState(false);
  const location = useLocation();
  const isAdminPortal = location.pathname.startsWith("/admin");
  const userType = isAdminPortal ? "ADMIN" : "ORGANIZATION";
  const currentUserUuid = localStorage.getItem(
    isAdminPortal ? "prexo_admin_uuid" : "prexo_organization_uuid",
  );

  const [rolesList, setRolesList] = useState([]);
  const StatusBadge = ({ status, activationDate }) => {
    // let label = "Inactive";
    // let style = "tw-bg-[#fef3f2] tw-border-[#fecaca] tw-text-[#b91c1b]";
    // let icon = "icon-Failed";
    let label, style, icon;
    if (!activationDate) {
      label = "Pending Activation";
      style = "tw-bg-[#dee9ff] tw-text-[#0140c1] tw-border tw-border-blue-200";
      icon = "icon-Timeline";
    } else if (status === 1 || status === "1") {
      label = "Active";
      style = "tw-bg-[#f1fdf4] tw-border-[#c1f9d5] tw-text-[#17803d]";
      icon = "icon-Processed";
    } else {
      label = "Inactive";
      style = "tw-bg-[#fef3f2] tw-border-[#fecaca] tw-text-[#b91c1b]";
      icon = "icon-Failed";
    }

    return (
      <span
        className={`tw-rounded-[20px] tw-inline-flex tw-items-center tw-gap-[5px] tw-border tw-px-3 tw-py-1 tw-text-[12px] tw-font-medium  tw-justify-center tw-whitespace-nowrap ${style}`}
      >
        <i className={`${icon} tw-text-[12px] `} />
        {label}
      </span>
    );
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await GetUserList({ user_type: userType });
      if (response?.valid) {
        const formattedUsers = response.user
          .filter((u) => u.user_type === "ADMIN")
          .map((u) => {
            const resolvedRoleName =
              u.role_name ||
              rolesList.find((r) => String(r.role_id) === String(u.role_id))
                ?.role_name ||
              "-";
            const lastLoginDate = u.last_login_date
              ? new Date(u.last_login_date)
              : null;
            const createdDate = u.created_date
              ? new Date(u.created_date)
              : null;
            return {
              id: u.id,
              name: `${u.first_name ? capitalizeFirstLetter(u.first_name) : "-"} ${u.last_name ? capitalizeFirstLetter(u.last_name) : "-"}`,
              email: u.email_id,
              role: resolvedRoleName,
              role_id: u.role_id,
              activationDate: u.activation_date,
              rawStatus: u.status,
              lastLogin: u.last_login_date,
              lastLoginRaw: lastLoginDate ? lastLoginDate.getTime() : 0,
              createdRaw: createdDate ? createdDate.getTime() : 0,
              lastLoginDisplay: formatDateTime(u.last_login_date),
              user_uuid: u.user_uuid,
              created: formatDateTime(u.created_date),
            };
          });
        setUsers(formattedUsers);
      } else {
        showToast("error", response?.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("error", "Something went wrong while fetching users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const res = await GetRolesList(null, { type: "ADMIN" });
        const rawRoles = res?.data || res?.roles || [];
        setRolesList(rawRoles);

        const response = await GetUserList({ user_type: userType });
        if (response?.valid) {
          const formattedUsers = response.user
            .filter((u) => u.user_type === "ADMIN")
            .map((u) => {
              const resolvedRoleName =
                u.role_name ||
                rawRoles.find((r) => String(r.role_id) === String(u.role_id))
                  ?.role_name ||
                "-";
              const lastLoginDate = u.last_login_date
                ? new Date(u.last_login_date)
                : null;
              const createdDate = u.created_date
                ? new Date(u.created_date)
                : null;
              return {
                id: u.id,
                name: `${u.first_name} ${u.last_name}`,
                email: u.email_id,
                role: resolvedRoleName,
                role_id: u.role_id,
                activationDate: u.activation_date,
                rawStatus: u.status,
                lastLogin: u.last_login_date,
                lastLoginRaw: lastLoginDate ? lastLoginDate.getTime() : 0,
                createdRaw: createdDate ? createdDate.getTime() : 0,
                lastLoginDisplay: formatDateTime(u.last_login_date),
                user_uuid: u.user_uuid,
                created: formatDateTime(u.created_date),
              };
            });
          setUsers(formattedUsers);
        } else {
          showToast("error", response?.message || "Failed to fetch users");
        }
      } catch (error) {
        console.error("Error:", error);
        showToast("error", "Something went wrong while fetching users");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);
  const [openActionId, setOpenActionId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  const navigate = useNavigate();
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);

  const [users, setUsers] = useState([]);
  const currentUserUuid_str = useMemo(
    () =>
      users.find((u) => String(u.id) === String(currentUserUuid))?.user_uuid,
    [users, currentUserUuid],
  );

  // Handle outside click for dropdown (unchanged)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenActionId(null);
        setDeleteId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const activeUser = useMemo(() => {
    return users.find((u) => u.user_uuid === openActionId);
  }, [openActionId]);
  console.log(activeUser);

  const handleDeleteConfirm = async () => {
    try {
      if (!permissions?.delete) return;
      setShowDeleteModal(false);
      setIsLoading(true);

      const response = await DeleteUser({ userId: selectedUserId?.id });

      if (response?.valid) {
        showToast("success", response.message || "User account has been deleted successfully.");
        await fetchUsers();
      } else {
        showToast("error", response?.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showToast("error", "Something went wrong while deleting user");
    } finally {
      setSelectedUserId(null);
      setIsLoading(false);
    }
  };
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSelectedUserId(null);
  };

  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (searchTerm) {
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // empty string "" = All → skip filter
    if (filterStatus && filterStatus !== "All" && filterStatus !== "Filter") {
      result = result.filter((user) => {
        if (filterStatus === "Active")
          return user.rawStatus === 1 || user.rawStatus === "1";
        if (filterStatus === "Pending Activation") return !user.activationDate;
        if (filterStatus === "Inactive")
          return (
            user.activationDate &&
            (user.rawStatus === 0 || user.rawStatus === "0")
          );
        return true;
      });
    }

    if (sortConfig === "Name (A-Z)")
      result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortConfig === "Name (Z-A)")
      result.sort((a, b) => b.name.localeCompare(a.name));
    else if (
      sortConfig === "Default" ||
      sortConfig === "Sort By" ||
      !sortConfig
    )
      result.sort((a, b) => b.createdRaw - a.createdRaw);
    return result;
  }, [users, searchTerm, filterStatus, sortConfig]);

  const handleActionClick = (event, user_uuid) => {
    setDeleteId(activeUser?.id);
    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY + 5,
      left: rect.right + window.scrollX - 160,
    });
    setOpenActionId(openActionId === user_uuid ? null : user_uuid);
  };
  useEffect(() => {
    if (!openActionId) return;

    const updatePosition = () => {
      const triggerBtn = document.querySelector(
        `[data-action-id="${openActionId}"]`,
      );
      if (triggerBtn) {
        const rect = triggerBtn.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 5,
          left: rect.right + window.scrollX - 160,
        });
      }
    };

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [openActionId]);

  const handleDeactivateConfirm = async () => {
    try {
      if (!permissions?.edit) return;
      setShowDeactivateModal(false);
      setIsLoading(true);

      const payload = {
        userId: userToDeactivate?.id,
        status:
          userToDeactivate?.rawStatus === 1 ||
            userToDeactivate?.rawStatus === "1"
            ? 0
            : 1,
      };

      const response = await DeactivateUser(payload);

      if (response?.valid) {
        showToast(
          "success",
          response.message || "User status updated successfully",
        );
        await fetchUsers();
      } else {
        showToast("error", response?.message || "Failed to update user status");
      }
    } catch (error) {
      console.error("Deactivate error:", error);
      showToast("error", "Something went wrong while updating user status");
    } finally {
      setUserToDeactivate(null);
      setIsLoading(false);
    }
  };
  const columns = useMemo(
    () => [
      {
        name: "NAME",
        selector: (row) => row.name,
        sortable: true,
        ignoreRowClick: true,
        cell: (row) => (
          <span
            className="tw-truncate tw-cursor-pointer hover:tw-text-blue-600"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`view/${row.user_uuid}`, { state: { userData: row } });
            }}
          >
            <TextWithTooltip
              text={capitalizeFirstLetter(row.name)}
              width="180px"
            >
              <span className="tw-block ">
                {capitalizeFirstLetter(row.name)}
              </span>
            </TextWithTooltip>
          </span>
        ),
      },

      {
        name: "EMAIL ADDRESS",
        selector: (row) => row.email,
        // width: "20%",
        grow: 2,
        sortable: true,
        cell: (row) => (
          <TextWithTooltip text={row.email} width="150%">
            <span className="tw-block ">{row.email}</span>
          </TextWithTooltip>
        ),
      },

      {
        name: "CREATED ON",
        selector: (row) => row.createdRaw,
        sortable: true,
        sortFunction: (a, b) => a.createdRaw - b.createdRaw,
        cell: (row) => (
          <TextWithTooltip text={row.created} width="120px">
            <span className="">{row.created}</span>
          </TextWithTooltip>
        ),
      },
      {
        name: "STATUS",
        selector: (row) => row.rawStatus,
        // width: "15%",
        sortable: true,
        cell: (row) => (
          <StatusBadge
            status={row.rawStatus}
            activationDate={row.activationDate}
          />
        ),
      },
      {
        name: "ACTIONS",
        right: true,
        center: true,
        width: "15%",
        cell: (row) => {
          return (
            <button
              data-action-id={row.user_uuid}
              onClick={(e) => handleActionClick(e, row.user_uuid)}
              className="tw-text-gray-400 hover:tw-text-gray-600"
            >
              <i
                className={`icon-Actions tw-text-[#99999] tw-text-[20px] hover:tw-text-[#4488ff]  ${openActionId === row?.user_uuid ? "tw-text-[#4488ff]" : "tw-text-gray-400"}`}
              ></i>
            </button>
          );
        },
      },
    ],
    [openActionId],
  );

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
      },
    },
  };
  const isInitialEmpty = users.length === 0;
  const isFilteredEmpty = filteredUsers.length === 0 && users.length > 0;
  const EmptyDataView = (
    <NoDataFound
      title="No Users Found"
      description={
        isFilteredEmpty
          ? "No users match your search or filter criteria."
          : "No users available."
      }
      buttonLabel={null}
      onReset={null}
    />
  );

  return (
    <>
      {/* {loading && <FullPageLoader />} */}
      {apiLoading && <FullPageLoader />}
      <div className="tw-flex tw-min-h-screen">
        <div className="tw-flex-1">
          <main className="">
            {/* Header */}
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
              <div>
                <h1 className="tw-text-[20px] tw-font-semibold tw-text-[#000]">
                  Users
                </h1>
                <p class="tw-text-[14px] tw-text-[#1e293b] tw-tracking-[0.31px]">
                  Create, manage, and control access for all users.
                </p>
              </div>
              {permissions?.add && (
                <button
                  onClick={() => navigate("add")}
                  className="tw-flex tw-items-center tw-gap-2 tw-bg-[#0140c1] tw-px-5 tw-h-[40px] tw-text-white tw-rounded-md tw-text-sm tw-font-medium tw-transition-all tw-duration-200 hover:tw--translate-y-0.5 hover:tw-shadow-[0_4px_10px_rgba(1,64,193,0.35)]"
                >
                  <i className="icon-New tw-text-[13px] tw-mr-2"></i>
                  <span className="tw-text-[16px]">Create User</span>
                </button>
              )}
            </div>

            {/* Table — search & filter passed as props, pagination outside */}
            {isLoading ? (
              <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-4">
                <ShimmerTable row={8} col={8} />
              </div>
            ) : (
              <CustomDataTable
                columns={columns}
                data={filteredUsers}
                customStyles={tableCustomStyles}
                enablePagination={true}
                defaultPerPage={10}
                noDataComponent={EmptyDataView}
                // ── Search ──
                searchTerm={searchTerm}
                // onSearchChange={setSearchTerm}
                onSearchChange={isInitialEmpty ? null : setSearchTerm}
                searchPlaceholder="Search Name / Email"
                // ── 3. Pass value directly — no conversion needed anymore ───────────────────
                filterComponent={
                  isInitialEmpty ? null : (
                    <>
                      <FilterDropdown
                        options={[
                          "All",
                          "Active",
                          "Inactive",
                          "Pending Activation",
                        ]}
                        placeholder="All Status"
                        value={
                          filterStatus === "All Status" ||
                            filterStatus === "All"
                            ? ""
                            : filterStatus
                        }
                        width="tw-w-44 tw-h-10"
                        onChange={setFilterStatus}
                      />
                      <FilterDropdown
                        options={["Default", "Name (A-Z)", "Name (Z-A)"]}
                        placeholder="Sort By"
                        value={
                          sortConfig === "Default" || sortConfig === "Sort By"
                            ? ""
                            : sortConfig
                        }
                        width="tw-w-40 tw-h-10"
                        onChange={setSortConfig}
                      />
                    </>
                  )
                }
              />
            )}
          </main>
        </div>

        {/* Action Dropdown Portal */}
        {openActionId && (
          <DropDownPortal>
            <div
              ref={dropdownRef}
              style={{
                position: "absolute",
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: "160px",
              }}
              className="tw-bg-white tw-border tw-rounded-md tw-shadow-lg tw-z-[9995] tw-p-[4px]"
            >
              {permissions?.view && (
                <button
                  onClick={() => {
                    const userToView = users.find(
                      (u) => u?.user_uuid === openActionId,
                    );
                    if (userToView)
                      navigate(`view/${userToView.user_uuid}`, {
                        state: { userData: userToView },
                      });
                  }}
                  className="tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 hover:tw-bg-gray-100 tw-text-[13px] tw-text-[#374151]"
                >
                  <i className="icon-Eye tw-text-[16px]"></i>View
                </button>
              )}

              {permissions?.edit && (
                <button
                  onClick={() => {
                    const userToEdit = users.find(
                      (u) => u.user_uuid === openActionId,
                    );
                    if (userToEdit) {
                      const nameParts = userToEdit.name.split(" ");
                      navigate(`update/${userToEdit.user_uuid}`, {
                        state: {
                          editData: {
                            ...userToEdit,
                            firstName: nameParts[0],
                            lastName: nameParts.slice(1).join(" "),
                            role: userToEdit.role_id,
                          },
                        },
                      });
                    }
                  }}
                  className="tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 hover:tw-bg-gray-100 tw-text-[13px] tw-text-[#374151]"
                >
                  <i className="icon-Edit tw-text-[16px]"></i>Edit
                </button>
              )}
              {(() => {
                const currentUser = users.find(
                  (u) => u.user_uuid === openActionId,
                );
                if (currentUser?.activationDate) return null;
                if (!permissions?.edit) return null;
                return (
                  <button
                    onClick={async () => {
                      setOpenActionId(null);
                      setApiLoading(true);
                      try {
                        const response = await ResendActivation({
                          email: currentUser.email,
                        });
                        if (response?.valid) {
                          showToast(
                            "success",
                            response.message ||
                            "Activation link has been sent to the registered email account successfully",
                          );
                        } else {
                          showToast(
                            "error",
                            response?.message || "Failed to resend activation",
                          );
                        }
                      } catch {
                        showToast("error", "Something went wrong");
                      } finally {
                        setApiLoading(false);
                      }
                    }}
                    className="tw-flex  tw-items-center tw-gap-2 tw-w-full tw-px-1 tw-py-2 hover:tw-bg-gray-100 tw-text-[13px] tw-text-[#374151]"
                  >
                    <i className="icon-Resend tw-text-[16px]"></i>
                    <Link size={14} />
                    Resend Activation
                  </button>
                );
              })()}
              {openActionId !== currentUserUuid_str && (() => {
                const currentUser = users.find(
                  (u) => u.user_uuid === openActionId,
                );
                console.log(currentUser);
                if (!currentUser?.rawStatus) return null;
                if (!permissions?.edit) return null;
                return (
                  <button
                    onClick={() => {
                      const user = users.find(
                        (u) => u.user_uuid === openActionId,
                      );
                      console.log(user)
                      setResetUser(user);
                      setShowResetModal(true);
                      setOpenActionId(null);
                    }}
                    className="tw-flex  tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 hover:tw-bg-gray-100 tw-text-[13px] tw-text-[#374151]"
                  >
                    <i className="icon-Passward-reset tw-text-[16px]"></i>
                    {/* <Password size={14} /> */}
                    Reset Password
                  </button>
                );
              })()}

              {/* Deactivate / Activate button */}
              {openActionId !== currentUserUuid_str &&
                (() => {
                  const currentUser = users.find(
                    (u) => u.user_uuid === openActionId,
                  );
                  // const isPending =
                  //   (currentUser?.rawStatus === 0 ||
                  //     currentUser?.rawStatus === "0") &&
                  //   !currentUser?.lastLogin;
                  const isPending = !currentUser?.activationDate;

                  if (isPending) return null;
                  if (!permissions?.edit) return null;

                  const isActive =
                    currentUser?.rawStatus === 1 ||
                    currentUser?.rawStatus === "1";

                  return (
                    <button
                      onClick={() => {
                        setUserToDeactivate(currentUser);
                        setShowDeactivateModal(true);
                        setOpenActionId(null);
                      }}
                      className="tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 hover:tw-bg-gray-100 tw-text-[13px] tw-text-[#374151]"
                    >
                      <i className="icon-Deactivate tw-text-[16px]"></i>
                      {isActive ? "Deactivate" : "Activate"}
                    </button>
                  );
                })()}
              {openActionId !== currentUserUuid_str && permissions?.edit && (
                <button
                  onClick={() => {
                    const userToDelete = users.find(
                      (u) => u.user_uuid === openActionId,
                    );
                    setSelectedUserId(userToDelete);
                    setShowDeleteModal(true);
                    setOpenActionId(null);
                  }}
                  className="tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 hover:tw-bg-gray-100 tw-text-[13px] tw-text-[#374151]"
                >
                  <i className="icon-Delete tw-text-[16px]"></i>Delete
                </button>
              )}
            </div>
          </DropDownPortal>
        )}

        {/* Modals */}
        {showDeactivateModal && userToDeactivate && (
          <DeleteModal
            action="deactivate"
            entity="user"
            icon="icon-Admin-users"
            status={
              userToDeactivate?.rawStatus === 1 ||
                userToDeactivate?.rawStatus === "1"
                ? "Active"
                : "Inactive"
            }
            onClose={() => {
              setShowDeactivateModal(false);
              setUserToDeactivate(null);
            }}
            onConfirm={handleDeactivateConfirm}
          />
        )}
        {showDeleteModal && selectedUserId && (
          <DeleteModal
            action="delete"
            entity="user"
            icon="icon-Admin-users"
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
          />
        )}
        <ResetPasswordModal
          open={showResetModal}
          user={resetUser}
          onClose={() => {
            setShowResetModal(false);
            setResetUser(null);
          }}
        />
      </div>
    </>
  );
};

export default UserManagement;
