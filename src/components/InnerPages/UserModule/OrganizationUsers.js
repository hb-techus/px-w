
import React, { useState, useMemo, useRef, useEffect } from 'react';
import CustomDataTable from "../../../genriccomponents/ReactTable";
import DropDownPortal from "../../../genriccomponents/DropdownPortal";
import {  useLocation, useNavigate, useParams } from "react-router-dom";
import DeleteConfirmModal from "../../../genriccomponents/DeleteConfirmModal";
import TextWithTooltip from "../../Common/ToolTip";
import { ShimmerTable } from "react-shimmer-effects";
import NoDataFound from '../../../genriccomponents/NoDataFound';
import { GetUserList,DeleteUser,DeactivateUser,GetRolesList} from "../../../services/techus-services";
import { showToast } from "../../../genriccomponents/techus-ToastNotification";

import FullPageLoader from "../../../genriccomponents/loaders/FullPageLoader";
import FilterDropdown from '../../../genriccomponents/FilterDropdown';


const StatusBadge = ({ status, lastLogin }) => {
  const hasLoggedIn = !!lastLogin;
  const isActive = status === 1 || status === "1";
  const isPending = (status === 0 || status === "0") && !hasLoggedIn;

  let label = "Inactive";
  let style = "tw-bg-[#fef3f2] tw-border-[#fecaca] tw-text-[#b91c1b]";
  let icon = "icon-Failed";

  if (isActive) {
    label = "Active";
    style = "tw-bg-[#f1fdf4] tw-border-[#c1f9d5] tw-text-[#17803d]";
    icon = "icon-Processed";
  } else if (isPending) {
    label = "Pending Activation";
    style = "tw-bg-[#ffece1] tw-text-[#fd6f17] tw-border-[#ffd2b6]";
    icon = "icon-Timeline";
  }

  return (
    <span className={`tw-rounded-[20px] tw-inline-flex tw-items-center tw-gap-[5px] tw-border tw-px-3 tw-py-1 tw-text-[12px] tw-font-medium tw-justify-center tw-whitespace-nowrap ${style}`}>
      <i className={`${icon} tw-text-[12px]`} />
      {label}
    </span>
  );
};


const UserManagement = () => {
  
  const [searchTerm, setSearchTerm] = useState("");
const [filterStatus, setFilterStatus] = useState("All");
  const [sortConfig, setSortConfig] = useState("");
  const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

  const [apiLoading, setApiLoading] = useState(false);
 
const selectedOrgId = localStorage.getItem("organization_id");
const location = useLocation()
  const isAdminPortal = location.pathname.startsWith('/admin')
  const userType = isAdminPortal?'ADMIN':'ORGANIZATION'
// const userType = localStorage.getItem("user_type");

  //  const selectedOrgId=useSelector((s)=>s.tokens.organization_id)
  
  //  const userType=useSelector((s)=>s.tokens.user_type)

const [, setRolesList] = useState([]);

useEffect(() => {
  const loadRoles = async () => {
    try {
   const res = await GetRolesList(selectedOrgId, { role_type: userType });
      const rawRoles = res?.data || res?.roles || [];
      setRolesList(rawRoles);
    } catch (err) {
      console.error("Error fetching roles", err);
    }
  };

  loadRoles();
}, []);
   const { organization_uuid } = useParams();
   console.log("ORG UUID FROM URL:", organization_uuid);
const fetchUsers = async () => {
  try {
    if (!organization_uuid) return;   

    setLoading(true);
    setIsLoading(true); // ← ADD THIS

    const response = await GetUserList({
      user_type: 'ORGANIZATION',  
      organization_uuid,
      limit: 1000,
      offset: 0,
      is_super_admin_logged: 'Y'
    });
 console.log('user lsit',response)
    if (response?.valid) {
     const formattedUsers = response.user.map((u) => ({
  id: u.id,
  name: `${u.first_name} ${u.last_name}`,
  email: u.email_id,
  role: u.role_name || "-",
  rawStatus: u.status,
  lastLogin: u.last_login_date,

  // ✅ ADD THIS
  createdDate: u.created_date,
}));
      setUsers(formattedUsers);
    }
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
    setIsLoading(false); 
  }
};


useEffect(() => {
  fetchUsers();
  setFilterStatus("All"); 
}, [organization_uuid]);

useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, filterStatus, sortConfig]);
  const [openActionId, setOpenActionId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
const [selectedUserId, setSelectedUserId] = useState(null);
  const [dropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const [, setCurrentPage] = useState(1);
// const rowsPerPage = 10;
  const navigate = useNavigate();
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
const [userToDeactivate, setUserToDeactivate] = useState(null);
const [users, setUsers] = useState([]);

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
  // Handle outside click for dropdown (unchanged)
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
      setApiLoading(true);

   const selectedUser = users.find(u => u.id === selectedUserId);

const payload = {
  userId: selectedUserId,
  organization_id: selectedUser?.organization_id
};

    const response = await DeleteUser(payload);

    if (response?.valid) {
      showToast("success", response.message || "User account has been deleted successfully.");

      // refresh list
      fetchUsers();
    } else {
    showToast("error", response?.message || "Failed to fetch users");
showToast("error", "Something went wrong while fetching users");
    }

  } catch (error) {
    console.error("Delete error:", error);
    showToast("error", "Something went wrong while deleting user");
  } finally {
    setShowDeleteModal(false);
    setSelectedUserId(null);
      setApiLoading(false);
  }
};
const handleDeleteCancel = () => {
  setShowDeleteModal(false);
  setSelectedUserId(null);
};
  


const filteredUsers = useMemo(() => {
  let result = [...users];

  if (searchTerm) {
    result = result.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (filterStatus && filterStatus !== "All" && filterStatus !== "Filter" && filterStatus !== "All Status") {
    result = result.filter(user => {
      const status = user.rawStatus;
      const hasLoggedIn = !!user.lastLogin;

      if (filterStatus === "Active") {
        // Active: status is 1
        return status === 1 || status === "1";
      }

      if (filterStatus === "Pending Activation") {
        // Pending: status is 0 AND never logged in
        return (status === 0 || status === "0") && !hasLoggedIn;
      }

      if (filterStatus === "Inactive") {
        // Inactive: status is 0 AND has logged in before
        return (status === 0 || status === "0") && hasLoggedIn;
      }

      return true;
    });
  }

  if (sortConfig === "Name (A-Z)") result.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortConfig === "Name (Z-A)") result.sort((a, b) => b.name.localeCompare(a.name));

  return result;
}, [users, searchTerm, filterStatus, sortConfig]);

const handleDeactivateConfirm = async () => {
  try {
     setApiLoading(true);


    const selectedUser = users.find(u => u.id === userToDeactivate);

const payload = {
  userId: userToDeactivate,
  organization_id: selectedUser?.organization_id
};

    const response = await DeactivateUser(payload);

    if (response?.valid) {
      showToast("success", response.message || "User deactivated successfully");

      fetchUsers(); // refresh list
    } else {
      showToast("error", response?.message || "Failed to deactivate user");
    }

  } catch (error) {
    console.error("Deactivate error:", error);
    showToast("error", "Something went wrong while deactivating user");
  } finally {
    setShowDeactivateModal(false);
    setUserToDeactivate(null);
   setApiLoading(false);

  }
};
const columns = useMemo(() => [

  {
    name: 'NAME',
    selector: row => row.name,
    sortable: true,
  cell: row => (
  <TextWithTooltip text={row.name} width="120px">
    <span className="tw-block ">
      {row.name}
    </span>
  </TextWithTooltip>
)
  },

  {
    name: 'EMAIL',
    selector: row => row.email,
    width:'15%',
    sortable: true,
  cell: row => (
  <TextWithTooltip text={row.email} width="150%">
    <span className="tw-block ">
      {row.email}
    </span>
  </TextWithTooltip>
)
  },


  {
    name: 'ROLE',
    selector: row => row.role,
    sortable: true,
    cell: row => (
      <TextWithTooltip text={row.role} width="150px">
        <span className="tw-font-normal tw-text-[15px] tw-text-[#6e7178] tw-block ">
          {row.role}
        </span>
      </TextWithTooltip>
    )
  },

{
  name: 'LAST LOGIN',
  selector: row => row.lastLogin,
  width: "17%",
  sortable: true,
  cell: row => (
    <span className="tw-text-[#585858]">
      {formatDate(row.lastLogin)}
    </span>
  )
},

 {
  name: 'CREATED',
  selector: row => row.createdDate,
  sortable: true,
  cell: row => (
    <TextWithTooltip text={formatDate(row.createdDate)} width="120px">
      <span className="tw-text-[#585858] tw-block tw-truncate tw-max-w-[120px]">
        {formatDate(row.createdDate)}
      </span>
    </TextWithTooltip>
  )
},
{
  name: "STATUS",
  selector: row => row.rawStatus,
  width: "18%",
  sortable: true,
  cell: row => (
    <StatusBadge
      status={row.rawStatus}
      lastLogin={row.lastLogin}
    />
  )
},
//   {
//     name: 'ACTIONS',
//     right: true,
//     center: true,
//     cell: (row) => (
//       <button
//         onClick={(e) => handleActionClick(e, row.id)}
//         className="tw-text-gray-400 hover:tw-text-gray-600"
//       >
//         <i className="icon-Actions tw-text-lg"></i>
//       </button>
//     ),
//   },

], [openActionId]);
const tableCustomStyles = {
  header: { style: { display: 'none' } },

  headRow: {
    style: {
      backgroundColor: '#fafafa',
      borderTop: '1px solid #e5e7eb',
     
      borderBottom: '1px solid #e5e7eb',
      minHeight: '48px'
    }
  },

  headCells: {
    style: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#6b7280',
      textTransform: 'uppercase'
    }
  },

  rows: {
    style: {
      minHeight: '56px',
      borderBottom: '1px solid #f1f5f9'
    }
  },

  cells: {
    style: {
      fontSize: '14px',   // ✅ controls Michael Johnson font size
      color: '#6e7178'
    }
  }
};


const EmptyDataView = (
  <NoDataFound
    description={
      searchTerm
        ? "The user you are searching for is not available."
        : "No users found for this organization."
    }
    buttonLabel={searchTerm ? "Back To List" : null}
    onReset={searchTerm ? () => {
      setSearchTerm("");
      setFilterStatus("All");
      setSortConfig("");
    } : undefined}
  />
);
  return (
//     <div className="tw-flex tw-min-h-screen ">
//       <div className="tw-flex-1">
//         <main className="tw-p-6">
//           <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
//             <h1 className="tw-text-[20px] tw-font-semibold tw-text-[ #000]">Users</h1>
//          <button 
//   onClick={() => navigate("add")}
//   className="tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-px-4 tw-py-2 tw-rounded-md tw-flex tw-items-center tw-text-sm"
// >
//   <i className="icon-New tw-text-[13px] tw-mr-2"></i>
//   <span className='tw-text-[16px]'>Create User</span>
// </button>
//           </div>

//           <div className="user-management-card">
          
//           {/* SEARCH & FILTER SECTION */}
//           <section className="search-section">
//             <div className="tw-flex tw-items-center tw-justify-between tw-w-full">
//               <div className="tw-relative tw-w-full tw-max-w-md">
//                 <i className="icon-Search tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400"></i>
//                 <input
//                   type="text"
//                   placeholder="Search Name / Email"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="tw-w-full tw-h-10 tw-pl-10 tw-pr-3 tw-bg-[#f4f4f4] tw-border tw-border-gray-200 tw-rounded-lg tw-outline-none focus:tw-border-blue-500"
//                 />
//               </div>

//               <div className="tw-flex tw-items-center tw-gap-3">
//                 <Dropdown 
//                   options={["All","Active","Inactive","Pending Activation"]} 
//                   placeholder="Filter"
//                   value={filterStatus}
//                   width="tw-w-44 tw-h-10"
//                   onChange={setFilterStatus}
//                 />
//                 <Dropdown 
//                   options={["Default","Name (A-Z)","Name (Z-A)"]} 
//                   placeholder="Sort"
//                   value={sortConfig}
//                   width="tw-w-40 tw-h-10"
//                   onChange={setSortConfig}
//                 />
//               </div>
//             </div>
//           </section>

//  <div className="tw-relative">
//     {isLoading ? (
//       <div className="tw-p-4"><ShimmerTable row={6} col={8} /></div>
//     ) : filteredUsers.length === 0 ? (
//       <NoDataFound message="No users found" />
//     ) : (
//       <CustomDataTable
//         columns={columns}
//       data={filteredUsers}
//         customStyles={tableCustomStyles}
//         enablePagination={true}
//       />
//     )}
//   </div>
//         </div> 
       

 
//         </main>
//       </div>

//       {openActionId && (
//         <DropDownPortal>
//           <div
//             ref={dropdownRef}
//             style={{ position: "absolute", top: dropdownPosition.top, left: dropdownPosition.left, width: "160px" }}
//             className="tw-bg-white tw-border tw-rounded-md tw-shadow-lg tw-z-[9999]"
//           >
//           <button 
//   onClick={() => {
//     const userToView = users.find(u => u.id === openActionId);
//     if (userToView) {
//       // Navigate to the view page with the user ID and data
//       navigate(`view/${userToView.id}`, { 
//   state: { 
//     userData: userToView,
//     organizationId: userToView.organization_id
//   } 
// });
//     }
//   }}
//   className="tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 hover:tw-bg-gray-100 tw-text-[12px]"
// >
//   <i className="icon-Overview"></i>View
// </button>

             
// <button 
//   onClick={() => {
//     const userToEdit = users.find(u => u.id === openActionId);

//     if (userToEdit) {
//       const nameParts = userToEdit.name.split(" ");
//       const firstName = nameParts[0];
//       const lastName = nameParts.slice(1).join(" ");

//    navigate(`update/${userToEdit.id}`, { 
//   state: { 
//     editData: {
//       ...userToEdit,
//       firstName: firstName,
//       lastName: lastName,
//       role: userToEdit.role_id,
//       organizationId: userToEdit.organization_id   // ✅ ADD
//     } 
//   } 
// });
//     }
//   }}
//   className="tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 hover:tw-bg-gray-100 tw-text-[12px]"
// >
//   <i className="icon-edit"></i>Edit
// </button>
// <button 
//   onClick={() => {
//     setUserToDeactivate(openActionId);
//     setShowDeactivateModal(true);
//     setOpenActionId(null);
//   }}
//   className="tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 hover:tw-bg-gray-100 tw-text-[12px]"
// >
//   <i className="icon-Deactivate"></i>Deactivate
// </button>
//              <button
//   onClick={() => {
//     setSelectedUserId(openActionId);
//     setShowDeleteModal(true);
//     setOpenActionId(null);
//   }}
//   className="tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 hover:tw-bg-gray-100 tw-text-black tw-text-[12px]"
// >
//   <i className="icon-Delete"></i>Delete
// </button>
//           </div>
//         </DropDownPortal>
//       )}
// {/* DEACTIVATE MODAL */}
// <DeleteConfirmModal
//   show={showDeactivateModal}
//   title="Deactivate User"
//   message="Are you sure you want to deactivate this user? They will no longer be able to log in."
//   onCancel={() => setShowDeactivateModal(false)}
//   onConfirm={handleDeactivateConfirm}
// />

// {/* DELETE MODAL */}
// <DeleteConfirmModal
//   show={showDeleteModal}
//   title="Delete User"
//   message="Are you sure you want to delete this user? This action cannot be undone."
//   onCancel={handleDeleteCancel} // This function sets showDeleteModal to false
//   onConfirm={handleDeleteConfirm}
// />
//     </div>
  <>
    {loading && <FullPageLoader />} 
     {apiLoading && <FullPageLoader />}
 <div className="tw-flex tw-min-h-screen">
      <div className="tw-flex-1">
        <main className="">

          {/* Header */}
          {/* <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
            <h1 className="tw-text-[20px] tw-font-semibold tw-text-[#000]">Users</h1>
            <button
              onClick={() => navigate("add")}
 className='tw-flex tw-items-center tw-gap-2 tw-bg-[#0140c1] tw-px-5 tw-h-[40px] tw-text-white tw-rounded-md tw-text-sm tw-font-medium tw-transition-all tw-duration-200 hover:tw--translate-y-0.5 hover:tw-shadow-[0_4px_10px_rgba(1,64,193,0.35)]'
            >
              <i className="icon-New tw-text-[13px] tw-mr-2"></i>
              <span className="tw-text-[16px]">Create User</span>
            </button>
          </div> */}

           <div className="tw-flex tw-items-center tw-gap-4 tw-mb-5">
        <button
       onClick={() => { navigate('/admin/organizations') }}
          className="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-bg-[#cbd5e1] tw-rounded-lg hover:tw-bg-[#0140c1] tw-transition-colors tw-duration-200'"
        >
          <i class="icon-Previous tw-text-white tw-text-lg"></i>
        </button>
        <div>
          <div className="">
        <h1 className="tw-text-[20px] tw-font-semibold tw-text-[#000]">Users</h1>
          </div>

         
        </div>
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
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search Name / Email"

              // ── Filter & Sort dropdowns ──
              filterComponent={
                <>
                  <FilterDropdown
                    options={["All", "Active", "Inactive", "Pending Activation"]}
                    placeholder="All Status"
                    value={filterStatus}
                    width="tw-w-44 tw-h-10"
                    onChange={setFilterStatus}
                  />
                  <FilterDropdown
                    options={["Default", "Name (A-Z)", "Name (Z-A)"]}
                    placeholder="Sort By"
                    value={sortConfig}
                    width="tw-w-40 tw-h-10"
                     onChange={(val) => setSortConfig(val === "Default" ? "" : val)}
                  />
                </>
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
            style={{ position: "absolute", top: dropdownPosition.top, left: dropdownPosition.left, width: "160px" }}
            className="tw-bg-white tw-border tw-rounded-md tw-shadow-lg tw-z-[9995]"
          >
            <button
              onClick={() => {
                const userToView = users.find(u => u.id === openActionId);
                if (userToView) navigate(`view/${userToView.id}`, { state: { userData: userToView } });
              }}
              className="tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 hover:tw-bg-gray-100 tw-text-[12px]"
            >
              <i className="icon-Eye"></i>View
            </button>

            <button
              onClick={() => {
                const userToEdit = users.find(u => u.id === openActionId);
                if (userToEdit) {
                  const nameParts = userToEdit.name.split(" ");
                  navigate(`update/${userToEdit.id}`, {
                    state: {
                      editData: {
                        ...userToEdit,
                        firstName: nameParts[0],
                        lastName: nameParts.slice(1).join(" "),
                        role: userToEdit.role_id
                      }
                    }
                  });
                }
              }}
              className="tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 hover:tw-bg-gray-100 tw-text-[12px]"
            >
              <i className="icon-Edit"></i>Edit
            </button>

            <button
              onClick={() => { setUserToDeactivate(openActionId); setShowDeactivateModal(true); setOpenActionId(null); }}
              className="tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 hover:tw-bg-gray-100 tw-text-[12px]"
            >
              <i className="icon-Deactivate"></i>Deactivate
            </button>

            <button
              onClick={() => { setSelectedUserId(openActionId); setShowDeleteModal(true); setOpenActionId(null); }}
              className="tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 hover:tw-bg-gray-100 tw-text-black tw-text-[12px]"
            >
              <i className="icon-Delete"></i>Delete
            </button>
          </div>
        </DropDownPortal>
      )}

      {/* Modals */}
      <DeleteConfirmModal
        show={showDeactivateModal}
        title="Deactivate User"
        message="Are you sure you want to deactivate this user? They will no longer be able to log in."
        onCancel={() => setShowDeactivateModal(false)}
        onConfirm={handleDeactivateConfirm}
      />
      <DeleteConfirmModal
        show={showDeleteModal}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </div>
    </>
  );
};

export default UserManagement;