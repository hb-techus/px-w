import React, { useState, useMemo, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import CustomDataTable from "../../../genriccomponents/ReactTable";

import DropDownPortal from "../../../genriccomponents/DropdownPortal";
import { useNavigate } from "react-router-dom";

import FullPageLoader from "../../../genriccomponents/loaders/FullPageLoader";
import TextWithTooltip from "../../Common/ToolTip";
import NoDataFound from "../../../genriccomponents/NoDataFound";
import { ShimmerTable } from "react-shimmer-effects";
import {
  GetPackageList,
  DeletePackage,
} from "../../../services/techus-services";
import { showToast } from "../../../genriccomponents/techus-ToastNotification";

import {
  capitalizeFirstLetter,
  formatDateTime,
  formatDollarCompact,
} from "../../../utils/commonUtils";
import DeleteModal from "../../../genriccomponents/DeleteModal";
import { useSelector } from "react-redux";
import FilterDropdown from "../../../genriccomponents/FilterDropdown";

const PackageList = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const [filterStatus, setFilterStatus] = useState("");
  const [sortConfig, setSortConfig] = useState("");

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [openActionId, setOpenActionId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);


  const navigate = useNavigate();
  // Form State preserved here to pass down as props

  // Mock Data (unchanged)
  const [users, setUsers] = useState([]);

  const permissionsList =
    useSelector((s) => s?.auth?.user?.[0]?.permission_info) || {};
  const permissions = permissionsList?.package_management || {};

  const fetchPackageList = async () => {
    try {
      setIsLoading(true);

      const raw = await GetPackageList();

      // Parse if it's a string, use directly if already object
      const response = typeof raw === "string" ? JSON.parse(raw) : raw;

      console.log("package list", response);

      const packages = response?.data ?? [];

      const formattedPackages = packages.map((pkg) => {
        const dateObj = pkg.updated_date_date
          ? new Date(pkg.updated_date)
          : null;
        return {
          id: pkg.package_uuid,
          packageName: pkg.name,
          status: pkg.status === 1 ? "Active" : "Inactive",
          monthlyPrice: pkg.pricing_monthly ?? "-",
          annualPrice: pkg.pricing_annual ?? "-",
          total_subscription_count: pkg.total_subscription_count ?? "-",
          active_subscription_count: pkg.active_subscription_count ?? "-",
          inactive_subscription_count: pkg.inactive_subscription_count ?? "-",
          lastUpdated: pkg.updated_date
            ? new Date(pkg.updated_date).toLocaleString("en-US", {
              month: "numeric",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })
            : "-",
          lastUpdatedRaw: dateObj ? dateObj.getTime() : 0,
        };
      });

      setUsers(formattedPackages);
    } catch (error) {
      console.error("Error fetching package list:", error);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchPackageList();
  }, []);

  // Handle outside click for dropdown (unchanged)
  const EmptyDataView = () => {
    return (
      <NoDataFound
        title="No Packages Found"
        description="No packages available."
        buttonLabel={null}
        onReset={null}
      />
    );
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenActionId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeleteConfirm = async () => {
    try {
      if (!permissions?.delete) return;
      if (!selectedPackage) return;
      setIsDeleting(true);

      const raw = await DeletePackage({ package_uuid: selectedPackage.id });
      const response = typeof raw === "string" ? JSON.parse(raw) : raw;

      if (response?.valid) {
        showToast("success", "Package deleted successfully.");

        setUsers((prev) => prev.filter((pkg) => pkg.id !== selectedPackage.id));
      } else {
        showToast(response?.message || "Failed to delete package", "error");
      }
    } catch (error) {
      console.error("Delete package error:", error);
      showToast("Something went wrong while deleting package", "error");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setSelectedPackage(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSelectedPackage(null);
  };

  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (searchTerm) {
      result = result.filter((pkg) =>
        pkg.packageName?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // empty string "" = All → skip filter
    if (filterStatus && filterStatus !== "All" && filterStatus !== "Filter") {
      result = result.filter((pkg) => pkg.status === filterStatus);
    }

    // empty string "" = Default → no sort
    if (sortConfig === "Name (A-Z)") {
      result.sort((a, b) => a.packageName.localeCompare(b.packageName));
    } else if (sortConfig === "Name (Z-A)") {
      result.sort((a, b) => b.packageName.localeCompare(a.packageName));
    }

    return result;
  }, [users, searchTerm, filterStatus, sortConfig]);

  const handleActionClick = (event, rowId) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY + 5,
      left: rect.right + window.scrollX - 160,
    });
    setOpenActionId(openActionId === rowId ? null : rowId);
  };
  // Add after the existing handleActionClick function
  useEffect(() => {
    if (!openActionId) return;

    const updatePosition = () => {
      // Re-find the trigger button for the open row and recalculate
      const triggerBtn = document.querySelector(`[data-action-id="${openActionId}"]`);
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
  const handleUpdateConfirm = () => {
    if (!permissions?.edit) return;
    setShowUpdateModal(false);
    navigate(`update/${selectedPackage.id}`, {
      state: { editData: selectedPackage },
    });
    setSelectedPackage(null);
  };

  const handleUpdateCancel = () => {
    setShowUpdateModal(false);
    setSelectedPackage(null);
  };

  const columns = useMemo(
    () => [
      {
        name: <div className="">NAME</div>,
        selector: (row) => row.packageName,
        sortable: true,
        width: "13%",
        // Design matching: Semi-bold text and dark color
        cell: (row) => (
          <span
            className="tw-cursor-pointer tw-truncate hover:tw-text-blue-600a"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`view/${row.id}`);
            }}
          >
            <div className="tw-py-2 ">
              <TextWithTooltip text={row.packageName ? capitalizeFirstLetter(row.packageName) : '-'} />
            </div>
          </span>
        ),
      },

      {
        name: <div className="">MONTHLY</div>,
        selector: (row) =>
          `${formatDollarCompact(row.monthlyPrice, { decimals: 2 })}`,
        sortable: true,
        width: "11%",
      },
      {
        name: <div className="">ANNUALLY</div>,

        selector: (row) =>
          formatDollarCompact(row.annualPrice, {
            decimals: 2,
          }),
        sortable: true,
        width: "10%",
      },
      {
        name: <div className="tw-text-center">SUBSCRIPTIONS</div>,

        selector: (row) => row.total_subscription_count,
        sortable: true,
        width: "14%",
        center: true,
      },
      {
        name: <div className="tw-text-center">ACTIVE</div>,

        width: "10%",
        selector: (row) => row.active_subscription_count,
        sortable: true,
        center: true,
      },
      {
        name: <div className="tw-text-center">INACTIVE</div>,

        width: "10%",
        selector: (row) => row.inactive_subscription_count,
        sortable: true,
        center: true,
      },
      {
        name: <div className="">LAST UPDATED</div>,
        // name: "LAST UPDATED",
        width: "12%",
        selector: (row) =>
          row.lastUpdated ? new Date(row.lastUpdated).getTime() : 0,
        sortable: true,

        cell: (row) =>
          row?.lastUpdated && row?.lastUpdated !== "-" ? (
            <TextWithTooltip text={formatDateTime(row?.lastUpdated)} />
          ) : (
            "-"
          ),
      },
      {
        name: <div className=" ">STATUS</div>,
        selector: (row) => row.status,
        width: "11%",
        sortable: true,
        cell: (row) => {
          const statusConfig = {
            Active: {
              text: "tw-text-[#17803d] tw-text-[10px]",
              bg: "tw-bg-[#f1fdf4]",
              border: "tw-border-[#c1f9d5]",
              icon: "icon-Processed",
            },

            Inactive: {
              text: "tw-text-[#b91c1b] tw-text-[10px]",
              bg: "tw-bg-[#fef3f2]",
              border: "tw-border-[#fecaca]",
              icon: "icon-Failed",
              rounded: false,
            },

            "Pending Activation": {
              text: "tw-text-blue-600 tw-text-[10px]",
              bg: "tw-bg-blue-50",
              border: "tw-border-blue-300",
              icon: "icon-Uploading",
              rounded: false,
              spin: true,
            },
          };

          const config = statusConfig[row.status];

          return (
            <div
              className={`tw-inline-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1 tw-w-[100px] tw-rounded-full tw-text-sm tw-border ${config.text} ${config.bg} ${config.border}`}
            >
              {/* Active → circle icon */}
              {config.rounded ? (
                <span className="tw-flex tw-items-center tw-justify-center tw-w-4 tw-h-4 tw-rounded-full tw-border tw-border-green-600  tw-text-[14px] tw-font-normal tw-text-[#6e7178]">
                  <i
                    className={`${config.icon} tw-text-[9px] ${config.text}`}
                  ></i>
                </span>
              ) : (
                <i
                  className={`${config.icon} tw-text-sm ${config.spin ? "tw-animate-spin" : ""}`}
                ></i>
              )}

              {row.status}
            </div>
          );
        },
      },
      {
        name: <div className="">ACTIONS</div>,
        width: "8%",
        right: true,
        center: true,
        button: true,
        cell: (row) => (
          <button
            data-action-id={row.id}
            onClick={(e) => handleActionClick(e, row.id)}
            className="tw-text-gray-400 hover:tw-text-[#4488ff]"
          >
            <i
              className={`icon-Actions  tw-text-[20px]  hover:tw-text-[#4488ff]  ${openActionId === row?.id ? "tw-text-[#4488ff]" : "tw-text-[#99999]"}`}
            ></i>
          </button>
        ),
      },
    ],
    [openActionId],
  );

  const tableCustomStyles = {
    header: { style: { display: "none" } },
    table: {
      style: {
        backgroundColor: "#ffffff",
      },
    },
    headRow: {
      style: {
        fontSize: "15px",
        backgroundColor: "#f9fafb", // Light gray header background
        borderTop: "none",
        borderBottom: "1px solid #e5e7eb",
        minHeight: "52px",
      },
    },
    headCells: {
      style: {
        fontSize: "15px",

        color: "#6e7178",
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

  if (isDeleting) {
    return <FullPageLoader />;
  }


  return (
    <div className="tw-flex tw-min-h-screen">
      <div className="tw-flex-1">
        <main className="">
          {/* Header */}
          <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
            <div>
              <h1 className="tw-text-[20px] tw-font-semibold">Packages</h1>
              <p class="tw-text-[14px] tw-text-[#1e293b] tw-tracking-[0.31px]">Configure subscription packages with pricing, discounts, and module-level feature access.</p>
            </div>
            {permissions?.create ? (
              <button
                onClick={() => navigate("add")}
                className="tw-flex tw-items-center tw-gap-2 tw-bg-[#0140c1] tw-px-5 tw-h-[40px] tw-text-white tw-rounded-md tw-text-sm tw-font-medium tw-transition-all tw-duration-200 hover:tw--translate-y-0.5 hover:tw-shadow-[0_4px_10px_rgba(1,64,193,0.35)]"
              >
                <Plus size={18} className="tw-mr-2" />
                Create Package
              </button>
            ) : null}
          </div>

          {/* Table */}
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
              onSearchChange={isInitialEmpty ? null : setSearchTerm}
              defaultPerPage={10}
              noDataComponent={<EmptyDataView />}
              // ── Search ──
              searchTerm={searchTerm}
              // onSearchChange={setSearchTerm}
              searchPlaceholder="Search Package Name"
              // ── Filter & Sort ──

              // ── 3. Update filterComponent ─────────────────────────────────────────────────
              filterComponent={
                isInitialEmpty ? null : (
                  <>
                    <FilterDropdown
                      options={["All", "Active", "Inactive"]}
                      placeholder="All Status"
                      value={filterStatus}
                      width="tw-w-44 tw-h-10"
                      onChange={(val) => setFilterStatus(val === "All" ? "" : val)}
                    />
                    <FilterDropdown
                      options={["Default", "Name (A-Z)", "Name (Z-A)"]}
                      placeholder="Sort by Name"
                      value={sortConfig}
                      width="tw-w-40 tw-h-10"
                      onChange={(val) => setSortConfig(val === "Default" ? "" : val)}
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
            className="tw-bg-white tw-border tw-rounded-md tw-shadow-lg tw-z-[9995] tw-p-1.5"
          >
            {permissions?.view ? (
              <button
                onClick={() => {
                  const pkgToView = users.find((u) => u.id === openActionId);
                  if (pkgToView) navigate(`view/${pkgToView.id}`);
                  setOpenActionId(null);
                }}
                className="tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 hover:tw-bg-gray-100 tw-text-[13px] tw-text-[#374151]"
              >
                <i className="icon-Eye tw-text-[16px]"></i>View
              </button>
            ) : null}

            {permissions?.edit ? (
              <button
                // onClick={() => {
                //   const pkg = users.find((u) => u.id === openActionId);
                //   setSelectedPackage(pkg);
                //   setShowUpdateModal(true);
                //   setOpenActionId(null);
                // }}
                onClick={() => {
                  const pkg = users.find((u) => u.id === openActionId);
                  navigate(`update/${pkg.id}`);
                  setOpenActionId(null);
                }}
                className="tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 hover:tw-bg-gray-100 tw-text-[13px] tw-text-[#374151]"
              >
                <i className="icon-Edit tw-text-[16px]"></i>Edit
              </button>
            ) : null}

            {permissions?.delete ? (
              <button
                onClick={() => {
                  const pkg = users.find((u) => u.id === openActionId);
                  setSelectedPackage(pkg);
                  setShowDeleteModal(true);
                  setOpenActionId(null);
                }}
                className="tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 hover:tw-bg-gray-100 tw-text-[13px] tw-text-[#374151]"
              >
                <i className="icon-Delete tw-text-[16px]"></i>Delete
              </button>
            ) : null}
          </div>
        </DropDownPortal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedPackage && (
        <DeleteModal
          action="delete"
          entity="package"
          icon="icon-Packages"
          subscriptionCount={selectedPackage.total_subscription_count ?? 0}
          activeCount={selectedPackage.active_subscription_count ?? 0}
          inactiveCount={selectedPackage.inactive_subscription_count ?? 0}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {showUpdateModal && selectedPackage && (
        <DeleteModal
          action="update"
          entity="package"
          icon="icon-Packages"
          subscriptionCount={selectedPackage.total_subscription_count ?? 0}
          activeCount={selectedPackage.active_subscription_count ?? 0}
          inactiveCount={selectedPackage.inactive_subscription_count ?? 0}
          onClose={handleUpdateCancel}
          onConfirm={handleUpdateConfirm}
        />
      )}
    </div>
  );
};

export default PackageList;
