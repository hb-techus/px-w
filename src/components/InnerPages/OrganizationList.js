import React, { useState, useEffect, useMemo } from "react";
import CustomDataTable from "../../genriccomponents/ReactTable";
import { Plus } from "lucide-react";
import ReactDrawer from "../../genriccomponents/ReactDrawer";
import OrganizationAdd from "./Agency/OrganizationAdd";

import ImageCropModal from "../../genriccomponents/ImageUtils";
import {
  GetOrganizationsList,
  GetRolesList,
  DeleteOrganizationData,
  GetPackageList,
} from "../../services/techus-services";
import { showToast } from "../../genriccomponents/techus-ToastNotification";
import GridView from "./Agency/GridView";
import { ShimmerTable } from "react-shimmer-effects";

import { useNavigate } from "react-router-dom";
import ActionMenu from "../../genriccomponents/ActionMenu";
import NoDataFound from "../../genriccomponents/NoDataFound";


import TextWithTooltip from "../Common/ToolTip";
import { capitalizeFirstLetter, formatDateTime } from "../../utils/commonUtils";
import DeleteModal from "../../genriccomponents/DeleteModal";
import { useSelector } from "react-redux";
import FilterDropdown from "../../genriccomponents/FilterDropdown";


const OrganizationList = () => {
  const navigate = useNavigate();

const permissionsList = useSelector((s) => s?.auth?.user?.[0]?.permission_info) || {};
const permissions = permissionsList?.organization_management || {};
  // ─── Search & Filter State ─────────────────────────────────────────────────
  const [search, setSearch] = useState("");

const [filterStatus,  setFilterStatus]  = useState("");
const [filterPackage, setFilterPackage] = useState("");
const [sortByName,    setSortByName]    = useState("");



  // ─── Drawer States ─────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode] = useState(false);
  const [editUserData] = useState(null);
  const [showActionId, setShowActionId] = useState(null);
  // ─── Image Crop States ─────────────────────────────────────────────────────
  const [openCropModal, setOpenCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);

  // ─── Data States ───────────────────────────────────────────────────────────
  const [data, setData] = useState([]);
  const [isGrid] = useState(false);
  const [roles, setRoles] = useState([]);
  const [, setIsPageLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [states] = useState([]);
  const [packages, setPackages] = useState([]);

  const getPackagesList = async () => {
    const response = await GetPackageList();
    const parsed =
      typeof response === "string" ? JSON.parse(response) : response;
    if (parsed?.data && Array.isArray(parsed.data)) {
      const packageNames = parsed.data.map((p) => p.name);
      setPackages(["All", ...packageNames]);
    }
  };

  // ─── Custom Table Styles ───────────────────────────────────────────────────
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
 
        fontWeight: "400",
        paddingLeft: "16px",
        paddingRight: "16px",
      },
    },
  };

  // ─── API ───────────────────────────────────────────────────────────────────
  const handleCropSave = (base64) => {
    setCroppedImage(base64);
    setOpenCropModal(false);
  };

  const getOrganizationsList = async () => {
    try {
      setIsTableLoading(true);
      const response = await GetOrganizationsList();
      if (response?.valid && response?.data && Array.isArray(response.data)) {
        setData(response.data);
     
      } else {
        setData([]);
        if (response?.message) showToast("error", response.message);
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
      setData([]);
      showToast("error", "An error occurred while fetching organizations");
    } finally {
      setIsTableLoading(false);
    }
  };

  const getRolesList = async () => {
    try {
      const response = await GetRolesList(null,{role_type:"ADMIN"});
      if (response?.data && Array.isArray(response.data)) {
        setRoles(
          response.data.map((r) => ({ role_id: r.id, role_name: r.role_name })),
        );
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsTableLoading(true);

        await Promise.all([
          getOrganizationsList(),
          getRolesList(),
          getPackagesList(),
        ]);
      } catch (error) {
        console.error(error);
      } finally {
        setIsTableLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // ─── Filtered + Sorted Data ────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (row) =>
          String(row.organization_name || "")
            .toLowerCase()
            .includes(q) ||
          String(row.email_id || "")
            .toLowerCase()
            .includes(q) ||
          String(row.mobile_number || "")
            .toLowerCase()
            .includes(q) ||
          String(row.first_name || "")
            .toLowerCase()
            .includes(q) ||
          String(row.last_name || "")
            .toLowerCase()
            .includes(q),
      );
    }

   
if (filterStatus && filterStatus !== "All") {
  const val = filterStatus === "Active" ? 1 : 0;
  result = result.filter(
    (r) => r.status === val || r.status === String(val),
  );
}

    // Filter: Package
if (filterPackage && filterPackage !== "All") {
  result = result.filter(
    (r) =>
      String(r.package_name || "").toLowerCase() ===
      filterPackage.toLowerCase(),
  );
}

    // Sort by Name
if (sortByName === "Name (A-Z)")
  result.sort((a, b) =>
    String(a.organization_name).localeCompare(String(b.organization_name)),
  );
else if (sortByName === "Name (Z-A)")
  result.sort((a, b) =>
    String(b.organization_name).localeCompare(String(a.organization_name)),
  );

    return result;
  }, [data, search, filterStatus, filterPackage, sortByName]);

  // ─── Grid Pagination ───────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const paginatedAgents = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const handleView = (organization_uuid) => {
    navigate(`/admin/organizations/view/${organization_uuid}`);
  };

  const handleEdit = (organization_uuid) => {
  if (!permissions?.edit) return;
  navigate(`/admin/organizations/update/${organization_uuid}`);
};

  const handleDelete = (organization_uuid) => {
      if (!permissions?.delete) return;
    const org = data.find((o) => o.organization_uuid === organization_uuid);
    setSelectedOrg(org);
    setShowDeleteModal(true);
  };
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSelectedOrg(null);
  };
  const confirmDelete = async () => {
    if (!selectedOrg) return;
    try {
      setShowDeleteModal(false);
      setSelectedOrg(null);
      setIsTableLoading(true);

      const response = await DeleteOrganizationData(
        selectedOrg.organization_uuid,
      );
      if (response?.valid) {
        showToast(
          "success",
          response.message || "Organization deleted successfully.",
        );
        await getOrganizationsList();
      } else {
        showToast(
          "error",
          response?.message || "Failed to delete organization.",
        );
      }
    } catch (error) {
      console.error("Delete error:", error);
      showToast("error", "An unexpected error occurred.");
    } finally {
      setIsTableLoading(false);
    }
  };

// ✅ FIX (matches route path exactly)
const handleViewProjects = (id) =>
  navigate(`/admin/organizations/projects-list/${id}`);

const handleViewUsers = (uuid, id) => {
  navigate(`/admin/organizations/users-list/${uuid}`, {
    state: { organization_id: id }
  });
};
  
  const handleOrganizationSave = async () => {
    await getOrganizationsList();
  };

  // ─── Badge Helpers ─────────────────────────────────────────────────────────
  const StatusBadge = ({ status }) => {
    let label = "Inactive";
    let style = "tw-bg-[#fef3f2] tw-border-[#fecaca] tw-text-[#b91c1b]";
    let icon = "icon-Failed";

    if (status === 1 || status === "1") {
      label = "Active";
      style = "tw-bg-[#f1fdf4] tw-border-[#c1f9d5] tw-text-[#17803d]";
      icon = "icon-Processed";
    }

    return (
      <span
        className={`tw-rounded-[20px] tw-inline-flex tw-items-center tw-gap-[5px] tw-border tw-px-3 tw-py-1 tw-text-[12px] tw-font-medium tw-w-[90px] tw-justify-center ${style}`}
      >
        <i className={`${icon} tw-text-[12px]`} />
        {label}
      </span>
    );
  };

  // ─── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    {
      name: (
     
          <p className="tw-uppercase">Name</p>
 
      ),
      selector: (row) => row.organization_name,
      sortable: true,
      width: "17%",

      cell: (row) => (
         <span
    className="tw-cursor-pointer tw-truncate hover:tw-text-blue-600 tw-w-full"
    onClick={() => handleView(row.organization_uuid)}
  >
        <TextWithTooltip
          text={row.organization_name?capitalizeFirstLetter(row.organization_name): "—"}
          className="tw-cursor-pointer tw-truncate"
         
        />
        </span>
      ),
    },
 
    {
      name: (
        <div className="tw-uppercase">
          Package
        </div>
      ),
      width: "18%",
      sortable:true,
      selector: (row) => row.package_name,
      cell: (row) =>
        row.package_name ? (
          <TextWithTooltip
            text={row.package_name?capitalizeFirstLetter(row.package_name):'-'}
            className=" tw-truncate "
          />
        ) : (
          <span className="">
            -
          </span>
        ),
    },
    {
      name: (
        <div className="tw-uppercase tw-w-full tw-text-center ">
          Projects
        </div>
      ),
      selector: (row) => row.project_count || "-",
      sortable: true,
      minWidth: "10%",
   cell: (row) => (
  <span
    className={`tw-text-center tw-w-full tw-block ${
      row.project_count > 0
        ? "tw-cursor-pointer   hover:tw-text-blue-600 hover:tw-underline"
        : " tw-cursor-default"
    }`}
    onClick={() => row.project_count > 0 && handleViewProjects(row.organization_uuid)}
  >
    {row.project_count ?? "—"}
  </span>
),
    },
  {
  name: (
    <div className="tw-uppercase tw-w-full tw-text-center">
      Users
    </div>
  ),
  selector: (row) => row.org_user_count,
  cell: (row) => (
    <span
      className={`tw-text-center tw-w-full tw-block ${
        row.org_user_count > 0
          ? "tw-cursor-pointer hover:tw-text-blue-600 hover:tw-underline"
          : "tw-cursor-default"
      }`}
      onClick={() =>
        row.org_user_count > 0 &&
  handleViewUsers(row.organization_uuid, row.organization_id)
      }
    >
      {row.org_user_count ?? "—"}
    </span>
  ),
},

    {
      name: (
        <div className="tw-uppercase">
          Last Updated
        </div>
      ),
      button:false,

      selector: (row) =>
        row.organization_updated_date
          ? new Date(row.organization_updated_date).getTime()
          : 0,
      sortable: true,
      width: "17%",
      cell: (row) => (
        <TextWithTooltip
          text={formatDateTime(row.organization_updated_date) || "-"}
          className=""
        />
      ),
    },
       {
      name: (
        <div className="tw-uppercase ">
          Status
        </div>
      ),
      selector: (row) => row.status,
      sortable: true,
      minWidth: "12%",
      cell: (row) => (
        <StatusBadge status={row.status} lastLogin={row.last_login_date} />
      ),
    },
    {
      name: (
        <div className="tw-uppercase">
          Actions
        </div>
      ),
      center: true,
      ignoreRowClick: true,
      button:true,
      width: "11%",
      cell: (row) => (
        <ActionMenu
          onView={() => handleView(row.organization_uuid)}
          onEdit={() => handleEdit(row.organization_uuid)}
          showView={permissions?.view}
          showEdit={permissions?.edit}
          showDelete={permissions?.delete}
          onDelete={() => handleDelete(row.organization_uuid)}
        />
      ),
    },
  ];

  // ─────────────────────────────────────────────
// STEP 4: Empty state handling
// ─────────────────────────────────────────────
const EmptyDataView = () => {

  // Initial empty → no actions
  if (isInitialEmpty) {
    return (
      <NoDataFound
        title="No Organizations Found"
        description="No organizations available."
        buttonLabel={null}
      />
    );
  }

  // Filtered empty → allow reset
  return (
    <NoDataFound
      title="No Organizations Found"
      description="No organizations match your current search or filter criteria."
           buttonLabel={null}   
      onReset={null}  
    />
  );
};
const isInitialEmpty = data.length === 0;
  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* {isLoading && <FullPageLoader />} */}

      <div className="tw-max-w-8xl tw-mx-auto">
        {/* Page Header */}
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
          <div>
          <h1 className="tw-text-[20px] tw-font-semibold tw-text-[#111827]">
            Organizations
          </h1>
          <p class="tw-text-[14px] tw-text-[#1e293b] tw-tracking-[0.31px]">Create and manage organizations, assign packages, and oversee subscription and billing status.</p>
         </div>
         {permissions?.create&& <button
            onClick={() => navigate("/admin/organizations/add")}
            className="tw-flex tw-items-center tw-gap-2 tw-bg-[#0140c1] tw-px-5 tw-h-[40px] tw-text-white tw-rounded-md tw-text-sm tw-font-medium tw-transition-all tw-duration-200 hover:tw--translate-y-0.5 hover:tw-shadow-[0_4px_10px_rgba(1,64,193,0.35)]"
          >
            <Plus size={16} className="tw-shrink-0" />
            <span className="tw-text-[15px]">Create Organization</span>
          </button>}
        </div>

        {/* Drawers */}
        {isOpen && (
          <ReactDrawer
            open={isOpen}
            onClose={() => setIsOpen(false)}
            setOpenCropModal={setOpenCropModal}
            title={isEditMode ? "Edit Organization" : "Add New Organization"}
          >
            <OrganizationAdd
              openCropModal={openCropModal}
              setOpenCropModal={setOpenCropModal}
              setImageSrc={setImageSrc}
              imageSrc={imageSrc}
              handleCropSave={handleCropSave}
              croppedImage={croppedImage}
              setCroppedImage={setCroppedImage}
              isEditMode={isEditMode}
              editUserData={editUserData}
              onCloseDrawer={() => setIsOpen(false)}
              roles={roles}
              setIsPageLoading={setIsPageLoading}
              onOrganizationSave={handleOrganizationSave}
              states={states}
            />
          </ReactDrawer>
        )}

        {openCropModal && (
          <ImageCropModal
            imageSrc={imageSrc}
            onClose={() => setOpenCropModal(false)}
            onSave={handleCropSave}
          />
        )}

        {/* Table / Grid */}
        {isGrid ? (
          <GridView
            agents={paginatedAgents}
            showActionId={showActionId}
            setShowActionId={setShowActionId}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            totalCount={filteredData.length}
            setCurrentPage={setCurrentPage}
            setRowsPerPage={setRowsPerPage}
          />
        ) : isTableLoading ? (
          <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-4">
            <ShimmerTable row={8} col={8} />
          </div>
        ) : (
          <CustomDataTable
            columns={columns}
            data={filteredData}
            customStyles={tableCustomStyles}
            enablePagination={true}
            defaultPerPage={10}
            noDataComponent={<EmptyDataView />}
            // ── Search ──
            searchTerm={search}
            // onSearchChange={setSearch}
            onSearchChange={isInitialEmpty ? null : setSearch}
            searchPlaceholder="Search Organization Name"
           
     
filterComponent={
  isInitialEmpty ? null : (
    <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
      
<FilterDropdown
  options={["All", "Active", "Inactive"]}
  placeholder="All Status"
  value={filterStatus}
  width="tw-w-36 tw-h-10"
  onChange={(val) => setFilterStatus(val === "All" ? "" : val)}
/>

  
<FilterDropdown
  options={packages}   // packages already starts with "All"
  placeholder="All Package"
  value={filterPackage}
  width="tw-w-36 tw-h-10"
  onChange={(val) => setFilterPackage(val === "All" ? "" : val)}
/>
     
<FilterDropdown
  options={["Default", "Name (A-Z)", "Name (Z-A)"]}
  placeholder="Sort by Name"
  value={sortByName}
  width="tw-w-40 tw-h-10"
  onChange={(val) => setSortByName(val === "Default" ? "" : val)}
/>
    </div>
  )
}
          />
        )}

        {/* Delete Confirm Modal */}
        {showDeleteModal && selectedOrg && (
          <DeleteModal
            action="delete"
            entity="organization"
            icon="icon-Organization"
            status={selectedOrg.status === 1 ? "Active" : "Inactive"}
            subscriptionCount={selectedOrg.project_count ?? 0}
            activeCount={selectedOrg.active_subscription_count ?? 0}
            inactiveCount={selectedOrg.inactive_subscription_count ?? 0}
            onClose={handleDeleteCancel}
            onConfirm={confirmDelete}
          />
        )}
      </div>
    </>
  );
};

export default OrganizationList;
