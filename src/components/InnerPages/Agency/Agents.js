// import React, { useState, useEffect } from "react";
// import CustomDataTable from "../../../genriccomponents/ReactTable";
// import { Plus } from "lucide-react";
// import { ShimmerTable } from "react-shimmer-effects";
// import { motion } from "framer-motion";
// import AgentForm from "./Agent/AgentForm";
// import AgentsView from "./Agent/AgentsView";
// import { GetRolesList, GetAgentsList, DeleteAgentData } from "../../../services/techus-services";
// import ReactDrawer from "../../../genriccomponents/ReactDrawer";
// import { useNavigate, useLocation } from "react-router-dom";
// import FullPageLoader from "../../../genriccomponents/loaders/FullPageLoader";
// import no_data from "../../../assets/Images/no_data_images/no_data.webp";
// import { showToast } from "../../../genriccomponents/techus-ToastNotification"

// const Agents = () => {
//   const [search, setSearch] = useState("");
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [selectAll, setSelectAll] = useState(false);

//   const [openRowId, setOpenRowId] = useState(null); // optional menu toggle state
//   const [openRowId1, setOpenRowId1] = useState(null);

//   const [isOpen, setIsOpen] = useState(false); // add/edit drawer
//   const [isOpen1, setIsOpen1] = useState(false); // view drawer

//   const [isPageLoading, setIsPageLoading] = useState(false); // full page loader for heavy ops
//   const [isTableLoading, setIsTableLoading] = useState(false); // shimmer while fetching table

//   const navigate = useNavigate();
//   const location = useLocation();
//   const agencyData = location.state?.agency; // using agencyName per your confirmation

//   const [isEditMode, setIsEditMode] = useState(false);
//   const [editUserData, setEditUserData] = useState(null);
//   const [isViewMode, setIsViewMode] = useState(false);
//   const [viewUserData, setViewUserData] = useState(null);

//   const [showActionId, setShowActionId] = useState(null);

//   const [openCropModal, setOpenCropModal] = useState(false);
//   const [imageSrc, setImageSrc] = useState(null);
//   const [croppedImage, setCroppedImage] = useState(null);

//   const [data, setData] = useState([]);
//   const [roles, setRoles] = useState([]);

//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(8);

//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [deleteAgentId, setDeleteAgentId] = useState(null);

//   // ----- Crop Modal Handler -----
//   const handleCropSave = (base64) => {
//     setCroppedImage(base64);
//     setOpenCropModal(false);
//   };

//   // ----- Fetch Agents -----
//   const getAgentsList = async () => {
//     try {
//       setIsTableLoading(true);
//       const response = await GetAgentsList();

//       if (response?.data && Array.isArray(response.data)) {
//         // Normalize: ensure each item has agent_id and id
//         const normalized = response.data.map((it) => ({
//           ...it,
//           agent_id: it.agent_id ?? it.id ?? null,
//           id: it.id ?? it.agent_id ?? null,
//         }));

//         setData(normalized);
//       } 
//     } catch (error) {
//       console.error("GetAgentsList error:", error);
//     } finally {
//       setIsTableLoading(false);
//     }
//   };

//   // ----- Fetch Roles -----
//   const getRolesList = async () => {
//     try {
//       const response = await GetRolesList();
//       if (response?.data && Array.isArray(response.data)) {
//         const mappedRoles = response.data.map((role) => ({
//           role_id: role.id,
//           role_name: role.role_name,
//         }));
//         setRoles(mappedRoles);
//       }
//     } catch (error) {
//       console.error("GetRolesList error:", error);
//     }
//   };

//   // ----- Init -----
//   useEffect(() => {
//     getRolesList();
//     getAgentsList();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // ----- Filtered data for search -----
//   const filteredData = React.useMemo(() => {
//     if (!search || !search.trim()) return data;
//     const q = search.toLowerCase().trim();
//     return data.filter((row) => {
//       return (
//         String(row.first_name || "").toLowerCase().includes(q) ||
//         String(row.last_name || "").toLowerCase().includes(q) ||
//         String(row.email_id || "").toLowerCase().includes(q) ||
//         String(row.mobile_number || "").toLowerCase().includes(q) ||
//         String(row.agent_code || "").toLowerCase().includes(q) ||
//         String(row.agent_name || "").toLowerCase().includes(q)
//       );
//     });
//   }, [data, search]);

//   // ----- Pagination slice (table component may also support its own pagination) -----
//   const startIndex = (currentPage - 1) * rowsPerPage;
//   const endIndex = startIndex + rowsPerPage;
//   const paginatedAgents = filteredData.slice(startIndex, endIndex);

//   // ----- View handler -----
//   const handleView = (id) => {
//     const user = data.find((u) => u.agent_id === id || u.id === id);
//     if (!user) return;
//     setViewUserData(user);
//     setIsViewMode(true);
//     setIsOpen1(true);
//     setOpenRowId1(null);
//   };

//   // ----- Edit handler -----
//   const handleEdit = (id) => {
//     const user = data.find((u) => u.agent_id === id || u.id === id);
//     if (!user) return;
//     setEditUserData(user);
//     setIsEditMode(true);
//     setIsOpen(true);
//     setOpenRowId(null);
//   };

//   // ----- Delete handler (pop confirm modal) -----
//   const handleDelete = (id) => {
//     setDeleteAgentId(id);
//     setShowDeleteModal(true);
//   };

//   // ----- Confirm delete API -----
//   const confirmDelete = async () => {
//     try {
//       setIsPageLoading(true);

//       const payload = { agent_id: deleteAgentId };
//       const response = await DeleteAgentData(payload);

//       if (response?.valid) {
//         setData((prev) => prev.filter((a) => a.agent_id !== deleteAgentId && a.id !== deleteAgentId));
//         showToast("success", response.message)
//       } else {
//         // Optional: showToast("error", response?.message || "Failed to delete agent.")
//         console.warn("DeleteAgentData response invalid", response);
//       }
//     } catch (error) {
//       console.error("DeleteAgentData error:", error);
//     } finally {
//       setIsPageLoading(false);
//       setShowDeleteModal(false);
//       setDeleteAgentId(null);
//     }
//   };

//   // ----- Export CSV -----
//   const handleExport = () => {
//     const csvContent =
//       ["Agent_code,Agent_Name,Email_Address,Phone_Number,Quotes,Policies,Status"]
//         .concat(
//           data.map(
//             (log) =>
//               `${(log.agent_code || "")},${(log.agent_name || "").replace(/,/g, " ")},"${(log.email_id || "").replace(/"/g, '""')}",${log.mobile_number || ""},${(log.quotes || "")},${(log.policies || "")},${log.status == 1 ? "Active" : "Inactive"}`
//           )
//         )
//         .join("\n");

//     const blob = new Blob([decodeURIComponent(encodeURI(csvContent))], {
//       type: "text/csv;charset=utf-8;",
//     });
//     const link = document.createElement("a");
//     link.href = URL.createObjectURL(blob);
//     link.download = "agents_list.csv";
//     link.click();
//   };

//   // ----- Tooltip component -----
//   const Tooltip = ({ label }) => (
//     <div className="tw-pointer-events-none tw-absolute tw-bottom-8 tw-left-1/2 -tw-translate-x-1/2 tw-flex tw-flex-col tw-items-center tw-opacity-0 group-hover:tw-opacity-100 group-hover:-tw-translate-y-1 tw-transition-all tw-duration-300 tw-ease-out">
//       <span className="tw-bg-gray-800 tw-text-white tw-text-xs tw-rounded-md tw-px-2 tw-py-1 tw-whitespace-nowrap tw-shadow-md">
//         {label}
//       </span>
//       <span className="tw-w-0 tw-h-0 tw-border-l-4 tw-border-r-4 tw-border-t-4 tw-border-transparent tw-border-t-gray-800"></span>
//     </div>
//   );

//   // ----- Table columns -----
//   const columns = [
//     {
//       name: (
//         <input
//           type="checkbox"
//           checked={selectAll}
//           onChange={() => {
//             if (selectAll) {
//               setSelectedUsers([]);
//             } else {
//               setSelectedUsers((data || []).map((row) => row.agent_id ?? row.id));
//             }
//             setSelectAll(!selectAll);
//           }}
//           className="tw-w-5 tw-h-5 tw-cursor-pointer tw-rounded-full tw-border tw-border-gray-400 tw-accent-[#156082]"
//         />
//       ),
//       cell: (row) => (
//         <input
//           type="checkbox"
//           checked={selectedUsers.includes(row.agent_id ?? row.id)}
//           onChange={() => {
//             const id = row.agent_id ?? row.id;
//             if (selectedUsers.includes(id)) {
//               const updated = selectedUsers.filter((sid) => sid !== id);
//               setSelectedUsers(updated);
//               setSelectAll(false);
//             } else {
//               const updated = [...selectedUsers, id];
//               setSelectedUsers(updated);
//               if (updated.length === (data || []).length) setSelectAll(true);
//             }
//           }}
//           className="tw-w-5 tw-h-5 tw-cursor-pointer tw-rounded-full tw-border tw-border-gray-400 tw-accent-[#156082]"
//         />
//       ),
//       width: "60px",
//       ignoreRowClick: true,
//     },
//     {
//       name: "Agent Code",
//       selector: (row) => row.agent_code,
//       sortable: true,
//       width: "140px",
//     },
//     {
//       name: "Agent Name",
//       selector: (row) => row.agent_name,
//       sortable: true,
//       width: "160px",
//     },
//     {
//       name: "Email Address",
//       selector: (row) => row.email_id,
//       sortKey: "email",
//       sortable: true,
//       width: "180px",
//     },
//     {
//       name: "Phone Number",
//       selector: (row) => row.mobile_number,
//       sortKey: "phonenumber",
//       sortable: true,
//       width: "160px",
//     },
//     {
//       name: "Quotes",
//       selector: (row) => row.quotes,
//       cell: (row) => (
//         <div className="tw-flex tw-items-center tw-justify-between tw-gap-1 tw-w-[50px]">
//           <span>{row.quotes}</span>
//           <i className="icon icon-view tw-text-lg"></i>
//         </div>
//       ),
//       sortable: true,
//       width: "110px",
//     },
//     {
//       name: "Policies",
//       selector: (row) => row.policies,
//       cell: (row) => (
//         <div className="tw-flex tw-items-center tw-justify-between tw-gap-1 tw-w-[50px]">
//           <span className="tw-text-start">{row.policies}</span>
//           <i className="icon icon-view tw-text-lg"></i>
//         </div>
//       ),
//       sortable: true,
//       width: "110px",
//     },
//     {
//       name: "Status",
//       cell: (row) => {
//         const isActive = row.status === 1 || row.status === "1";
//         return (
//           <span
//             className={`tw-px-[12px] tw-py-[2px] tw-rounded-2xl tw-text-[12px] tw-font-normal tw-block tw-text-center tw-w-[80px] ${isActive
//               ? "tw-bg-[#e9ffee] tw-text-[#20bc47] tw-border tw-border-[#20bc47]"
//               : "tw-bg-[#f0f0f0] tw-text-[#a5a5a5] tw-border tw-border-[#a5a5a5]"
//               }`}
//           >
//             {isActive ? "Active" : "Inactive"}
//           </span>
//         );
//       },
//       sortable: true,
//       width: "120px",
//     },
//     {
//       name: "Actions",
//       cell: (row) => (
//         <div className="tw-flex tw-gap-3 tw-items-center">
//           <div className="tw-relative tw-group tw-flex tw-items-center tw-justify-center">
//             <i
//               className="icon-view tw-text-[18px] hover:tw-bg-[#156082] tw-rounded-lg tw-p-1 hover:tw-text-white tw-cursor-pointer tw-z-10"
//               onClick={() => handleView(row.agent_id ?? row.id)}
//             ></i>
//             <Tooltip label="View" />
//           </div>

//           <div className="tw-relative tw-group tw-flex tw-items-center tw-justify-center">
//             <i
//               className="icon-edit tw-text-[18px] hover:tw-bg-[#156082] tw-rounded-lg tw-p-1 hover:tw-text-white tw-cursor-pointer tw-z-10"
//               onClick={() => handleEdit(row.agent_id ?? row.id)}
//             ></i>
//             <Tooltip label="Edit" />
//           </div>

//           <div className="tw-relative tw-group tw-flex tw-items-center tw-justify-center">
//             <i
//               className="icon-delete tw-text-[18px] hover:tw-bg-[#156082] tw-rounded-lg tw-p-1 hover:tw-text-white tw-cursor-pointer tw-z-10"
//               onClick={() => handleDelete(row.agent_id ?? row.id)}
//             ></i>
//             <Tooltip label="Delete" />
//           </div>
//         </div>
//       ),
//       width: "150px",
//       ignoreRowClick: true,
//     },
//   ];

//   // ----- Empty Data Component -----
//   const EmptyDataView = (
//     <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-16 tw-text-center tw-w-full">
//       <img src={no_data} alt="No data" className="tw-w-60 tw-h-40 tw-mb-4" />
//       <h3 className="tw-text-xl tw-font-semibold tw-text-gray-800">No Agents Found</h3>
//       <p className="tw-text-gray-600 tw-mt-1">The agent you are searching for is not available.</p>
//       <button
//         onClick={() => {
//           setSearch("");
//           getAgentsList();
//         }}
//         className="tw-bg-[#156082] tw-text-white tw-rounded-md tw-px-6 tw-py-2 tw-mt-5 hover:tw-bg-[#104d66] tw-transition-all tw-w-[200px]"
//       >
//         Back To List
//       </button>
//     </div>
//   );

//   return (
//     <div className="tw-max-w-8xl tw-mx-auto ">
//       {isPageLoading && <FullPageLoader />}

//       {/* Header: same look & feel as Agencies using location.state.agency */}
//       <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
//         <div className="tw-flex tw-gap-[14px] tw-mb-[20px] tw-items-center">
//           <button
//             onClick={() => navigate("/agencies")}
//             className="tw-bg-[#fff] tw-flex tw-justify-center tw-items-center tw-p-3 tw-rounded-full hover:tw-bg-[#156082] tw-text-black hover:tw-text-white"
//           >
//             <i className="icon icon-back tw-text-[10px]"></i>
//           </button>
//           <div>
//             <p className="tw-text-[13px] tw-text-black">Agency/View Agents</p>
//             <p className="tw-text-[18px] tw-text-black tw-font-[600] tw-mt-1">
//               {agencyData?.agencyName || "—"}
//             </p>
//           </div>
//         </div>

//         <div className="tw-bg-white tw-rounded-md tw-border tw-border-gray-200 tw-flex tw-items-center tw-w-[800px] tw-mb-6">
//           <button
//             onClick={() => {}}
//             className={`tw-flex-1 tw-text-center tw-py-3 tw-text-[15px] tw-font-[600] tw-border-b-[3px] tw-border-[#156082] tw-text-[#156082]`}
//           >
//             Agents ({data.length})
//           </button>

//           <button
//             className="tw-flex-1 tw-text-center tw-py-3 tw-text-[15px] tw-font-[600] tw-text-gray-500"
//           >
//             Quotes (—)
//           </button>

//           <button
//             className="tw-flex-1 tw-text-center tw-py-3 tw-text-[15px] tw-font-[600] tw-text-gray-500"
//           >
//             Policies (—)
//           </button>
//         </div>
//       </div>

//       {/* Controls */}
//       <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
//         <div className="tw-flex tw-items-center tw-gap-3">
//           <h2 className="tw-text-xl tw-font-semibold">Agents</h2>
//         </div>

//         <div className="tw-flex tw-items-center tw-gap-3">
//           <div className="tw-relative tw-ml-auto tw-mr-2">
//             <input
//               type="text"
//               placeholder="Search ID, Name..."
//               className="tw-border tw-border-[#939393] tw-bg-white tw-rounded-md tw-pl-7 tw-pr-3 tw-py-2 tw-text-sm tw-w-[220px] focus:tw-outline-none focus:tw-border-[#156082]"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//             <i className="icon icon-search tw-absolute tw-top-2.5 tw-left-2 tw-text-[#25333e]"></i>
//           </div>

//           <button
//             onClick={() => {
//               setIsOpen(true);
//               setIsEditMode(false);
//               setEditUserData(null);
//               setCroppedImage(null);
//             }}
//             className="tw-flex tw-justify-center tw-gap-5 tw-items-center tw-bg-[#156082] tw-px-4 tw-h-[40px] tw-text-white tw-rounded-md tw-transition-all tw-duration-300 tw-ease-in-out tw-transform hover:-tw-translate-y-0.5 hover:tw-shadow-[0_4px_10px_rgba(21,96,130,0.4)] hover:tw-bg-[#18769c] tw-text-sm tw-text-nowrap tw-w-[150px]"
//           >
//             <Plus size={16} /> New Agent
//           </button>

//           <motion.button
//             onClick={handleExport}
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.97 }}
//             className="tw-flex tw-justify-center tw-items-center tw-bg-[#156082] tw-px-4 tw-h-[40px] tw-text-white tw-rounded-md tw-transition-all tw-duration-300 tw-ease-in-out hover:-tw-translate-y-0.5 tw-text-sm"
//             title="Export current results"
//           >
//             <i className="icon icon-export tw-mr-1"></i> Export
//           </motion.button>
//         </div>
//       </div>

//       {/* Table */}
//       <div className="overflow-visible">
//         {isTableLoading ? (
//           <ShimmerTable row={8} col={7} />
//         ) : (
//           <CustomDataTable
//             columns={columns}
//             data={filteredData}
//             enablePagination={true}
//             noDataComponent={
//               <div style={{ paddingTop: 20 }}>
//                 {EmptyDataView}
//               </div>
//             }
//           />
//         )}

//         {/* Drawer for Add/Edit */}
//         {isOpen && (
//           <ReactDrawer
//             open={isOpen}
//             onClose={() => setIsOpen(false)}
//             setOpenCropModal={setOpenCropModal}
//             title={isEditMode ? "Edit Agent" : "Add New Agent"}
//           >
//             <AgentForm
//               openCropModal={openCropModal}
//               setOpenCropModal={setOpenCropModal}
//               setImageSrc={setImageSrc}
//               imageSrc={imageSrc}
//               handleCropSave={handleCropSave}
//               croppedImage={croppedImage}
//               setCroppedImage={setCroppedImage}
//               isEditMode={isEditMode}
//               editUserData={editUserData}
//               onCloseDrawer={() => setIsOpen(false)}
//               roles={roles}
//               setIsPageLoading={setIsPageLoading}
//               onAgentSave={getAgentsList}
//               agencyId= {agencyData.agencyId}
//             />
//           </ReactDrawer>
//         )}

//         {/* Drawer for View */}
//         {isOpen1 && (
//           <ReactDrawer
//             open={isOpen1}
//             onClose={() => setIsOpen1(false)}
//             setOpenCropModal={setOpenCropModal}
//             title={"Agent Details"}
//           >
//             <AgentsView
//               openCropModal={openCropModal}
//               setOpenCropModal={setOpenCropModal}
//               setImageSrc={setImageSrc}
//               imageSrc={imageSrc}
//               handleCropSave={handleCropSave}
//               croppedImage={croppedImage}
//               setCroppedImage={setCroppedImage}
//               isViewMode={isViewMode}
//               viewUserData={viewUserData}
//               onCloseDrawer={() => setIsOpen1(false)}
//             />
//           </ReactDrawer>
//         )}

//         {/* Crop Modal */}
//         {openCropModal && (
//           <div>
//             {/* ImageCropModal component expected in your project */}
//             {/* If your crop modal is named differently, update this */}
//             <img src={croppedImage} alt="cropped preview" style={{ display: "none" }} />
//           </div>
//         )}
//       </div>

//       {/* Delete Modal */}
//       {showDeleteModal && (
//         <div className="tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black/30 tw-z-50">
//           <div className="tw-bg-white tw-rounded-lg tw-shadow-xl tw-p-6 tw-w-[350px] tw-text-center">
//             <h2 className="tw-text-lg tw-font-semibold tw-mb-2 tw-text-gray-800">Confirm Delete</h2>
//             <p className="tw-text-sm tw-text-gray-500 tw-mb-4">Are you sure you want to delete this agent?</p>
//             <div className="tw-flex tw-justify-center tw-gap-3">
//               <button
//                 onClick={confirmDelete}
//                 className="tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-md tw-text-sm hover:tw-bg-red-700"
//               >
//                 Yes
//               </button>
//               <button
//                 onClick={() => setShowDeleteModal(false)}
//                 className="tw-bg-[#156082] tw-text-white tw-px-4 tw-py-2 tw-rounded-md tw-text-sm hover:tw-bg-[#104d66]"
//               >
//                 No
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Agents;

import React from 'react'

function Agents() {
  return (
    <div>Agents</div>
  )
}

export default Agents