// import React, { useRef , useEffect } from "react";
// import { MoveRight } from "lucide-react";
// import CONFIG from "../../../config/config";
// import default_agency from "../../../assets/Images/default_images/default_agency.png"
// import RowsPerPageDropdown from "../../../genriccomponents/ReactTablePaginateOptions";

// const GridView = ({
//   agents,
//   showActionId,
//   setShowActionId,
//   onView,
//   onEdit,
//   onDelete,
//   currentPage,
//   rowsPerPage,
//   totalCount,
//   setCurrentPage,
//   setRowsPerPage
// }) => {

//   const paginationOptions = [5, 8, 10, 20, 50];
//   const actionRef = useRef(null);

//  useEffect(() => {
//   function handleClickOutside(event) {
//     if (actionRef.current && !actionRef.current.contains(event.target)) {
//       setShowActionId(false);
//     }
//   }
 
//   document.addEventListener("mousedown", handleClickOutside);
//   return () => document.removeEventListener("mousedown", handleClickOutside);
// }, []);
//   const onChangeRowsPerPage = (value) => {
//     setRowsPerPage(value);
//     setCurrentPage(1);
//   };

//   const onChangePage = (page) => {
//     setCurrentPage(page);
//   };

//   return (
//     <>
//       <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-3">
//         {agents.map((agent) => (
//           <div
//             key={agent.id}
//             className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-xl tw-shadow-sm tw-p-5 hover:tw-shadow-md tw-transition-all tw-duration-200 tw-relative"
//           >

//             <span
//               onClick={(e) => {
//                 e.stopPropagation();
//                 setShowActionId(showActionId === agent.id ? false : agent.id);
//               }}
//               className="tw-absolute tw-top-3 tw-right-3 tw-text-[#baced6] hover:tw-text-[#156082] tw-cursor-pointer tw-text-xl"
//             >
//               ...
//             </span>

//            {showActionId === agent.id && (
//           <div
//           ref={actionRef}
//             className={`tw-shadow-[0px_0px_1px_#000] tw-border tw-bg-white
//             tw-right-[5px] tw-top-[30px] tw-w-[110px] tw-p-[5px_3px]
//             tw-rounded-[5px] tw-transition-all tw-duration-500
//             tw-ease-in-out tw-absolute tw-flex tw-flex-col tw-justify-between
//             tw-z-[50] tw-text-[#0000008a]`}
           
//           >
 
//             <span
//               className="tw-cursor-pointer tw-flex tw-gap-[10px] tw-p-[5px] tw-items-center hover:tw-text-[#156082]"
//               onClick={() => onView(agent.id)}
//             >
//               <i className="icon-view tw-text-[16px]"></i>
//               <span className="tw-text-[12px] tw-font-bold">View</span>
//             </span>
 
 
//             <span
//               className="tw-cursor-pointer tw-flex tw-gap-[10px] tw-p-[5px] tw-items-center hover:tw-text-[#156082]"
//               onClick={() => onEdit(agent.id)}
//             >
//               <i className="icon-edit tw-text-[16px]"></i>
//               <span className="tw-text-[12px] tw-font-bold">Edit</span>
//             </span>
 
//             <span
//               className="tw-cursor-pointer tw-flex tw-gap-[10px] tw-p-[5px] tw-items-center hover:tw-text-[#d32f2f]"
//               onClick={() => onDelete(agent.id)}
//             >
//               <i className="icon-delete tw-text-[16px]"></i>
//               <span className="tw-text-[12px] tw-font-bold">Delete</span>
//             </span>
//           </div>
//         )}

//             <div className="tw-flex tw-items-center tw-gap-4 tw-mb-4">
//               <img
//                 src={agent.logo || default_agency}
//                 alt={agent.agencyName}
//                 className="tw-h-14 tw-w-14 tw-object-cover tw-rounded-full tw-border"
//                 onError={(e) => {
//                   e.target.src = `${CONFIG.VITE_AWS_ENDPOINT}/user_profile_images/user_image_dummy.png`;
//                 }}
//               />
//               <div>
//                 <h2 className="tw-text-[14px] tw-font-semibold tw-text-gray-800">
//                   {agent.agency_name}
//                 </h2>
//                 <p className="tw-text-sm tw-text-gray-500">{agent.agency_code}</p>
//               </div>
//             </div>

//             <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
//               <div className="tw-flex tw-flex-col tw-text-[12px] tw-text-gray-600">
//                 <p className="tw-truncate"> {agent.mobile_number}</p>
//                 <p className="tw-truncate">{agent.email_id}</p>
//               </div>

//               <span
//                 className={`tw-px-3 tw-py-[2px] tw-rounded-full tw-text-xs tw-font-medium ${agent.status === 1
//                     ? "tw-bg-[#E8F8EF] tw-text-[#1BAA56] tw-border tw-border-[#1BAA56]"
//                     : "tw-bg-[#F4F4F4] tw-text-[#9E9E9E] tw-border tw-border-[#9E9E9E]"
//                   }`}
//               >
//                 {agent.status === 1 ? "Active" : "Inactive"}
//               </span>
//             </div>


//             <div className="tw-flex tw-gap-4 tw-mt-6">
//               <div className="tw-relative tw-border tw-border-gray-300 tw-rounded-md tw-w-[120px] tw-h-[60px] tw-shadow-sm tw-px-1 tw-py-2 tw-bg-white">
//                 <div className="tw-absolute tw-left-0 tw-top-0 tw-w-1 tw-h-full tw-bg-[#156082]"></div>
//                 <MoveRight
//                   size={16}
//                   className="tw-absolute tw-top-2 tw-right-2 tw-text-[#939393]"
//                 />

//                 <div className="tw-flex tw-flex-col tw-pl-2 tw-pt-1">
//                   <p className="tw-text-[15px] tw-font-bold tw-text-[#25333e] ">
//                     {agent.agents}
//                   </p>
//                   <p className="tw-text-[13px] tw-text-[#25333e] tw-font-normal">Agents</p>
//                 </div>

//               </div>


//               <div className="tw-relative tw-border tw-border-gray-300 tw-rounded-md tw-w-[120px] tw-h-[60px]  tw-shadow-sm tw-px-1 tw-py-2 tw-bg-white">
//                 <div className="tw-absolute tw-left-0 tw-top-0 tw-w-1 tw-h-full tw-bg-[#156082]"></div>
//                 <MoveRight
//                   size={16}
//                   className="tw-absolute tw-top-2 tw-right-2 tw-text-[#939393]"
//                 />

//                 <div className="tw-flex tw-flex-col tw-pl-2 tw-pt-1">
//                   <p className="tw-text-[15px] tw-font-bold tw-text-[#25333e] ">
//                     {agent.quotes}
//                   </p>
//                   <p className="tw-text-[13px] tw-text-[#25333e] tw-font-normal">Quotes</p>
//                 </div>

//               </div>

//               <div className="tw-relative tw-border tw-border-gray-300 tw-rounded-md tw-w-[120px] tw-h-[60px] tw-shadow-sm tw-px-1 tw-py-2 tw-bg-white">
//                 <div className="tw-absolute tw-left-0 tw-top-0 tw-w-1 tw-h-full tw-bg-[#156082]"></div>
//                 <MoveRight
//                   size={16}
//                   className="tw-absolute tw-top-2 tw-right-2 tw-text-[#939393]"
//                 />

//                 <div className="tw-flex tw-flex-col tw-pl-2 tw-pt-1">
//                   <p className="tw-text-[15px] tw-font-bold tw-text-[#25333e] ">
//                     {agent.policies}
//                   </p>
//                   <p className="tw-text-[13px] tw-text-[#25333e] tw-font-normal">Policies</p>
//                 </div>

//               </div>
//             </div>


//             <div className="tw-mt-5 tw-p-3 tw-bg-gray-200 tw-rounded-md">
//               <p className="tw-text-sm">{agent.first_name} {agent.last_name}</p>
//               <p className="tw-text-xs tw-text-gray-500">Branch Manager {agent.role}</p>
//               <p className="tw-text-xs tw-text-gray-500">{agent.email_id}</p>
//             </div>

//           </div>
//         ))}
//       </div>


//       <div
//         className="tw-pointer-events-auto"
//         onMouseDown={(e) => e.stopPropagation()}
//       >
//         <div className="tw-flex tw-justify-between tw-items-center tw-p-4 tw-border-t tw-border-gray-200 tw-text-sm tw-text-gray-700">


//           <div className="tw-flex tw-items-center tw-gap-4">
//             <span>
//               Results: {(currentPage - 1) * rowsPerPage + 1} –
//               {Math.min(currentPage * rowsPerPage, totalCount)} of {totalCount}
//             </span>

//             <div className="tw-flex tw-items-center tw-gap-2">
//               <span>Rows per page:</span>
//               <RowsPerPageDropdown
//                 rowsPerPage={rowsPerPage}
//                 paginationOptions={paginationOptions}
//                 onChangeRowsPerPage={onChangeRowsPerPage}
//               />
//             </div>
//           </div>

//           {Math.ceil(totalCount / rowsPerPage) > 1 && (
//             <div className="tw-flex tw-items-center tw-gap-1">

//               <button
//                 onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
//                 disabled={currentPage === 1}
//                 className="tw-px-2 tw-py-1 tw-rounded hover:tw-bg-gray-100 disabled:tw-text-gray-400"
//               >
//                 {"<"}
//               </button>


//               {[...Array(Math.ceil(totalCount / rowsPerPage))].map((_, i) => {
//                 const page = i + 1;

//                 if (
//                   page <= 3 ||
//                   page === Math.ceil(totalCount / rowsPerPage) ||
//                   (page >= currentPage - 1 && page <= currentPage + 1)
//                 ) {
//                   return (
//                     <button
//                       key={page}
//                       onClick={() => setCurrentPage(page)}
//                       className={`tw-h-7 tw-w-7 tw-text-sm tw-rounded ${currentPage === page
//                           ? "tw-bg-white tw-shadow"
//                           : "hover:tw-bg-[#1f5e7b] hover:tw-text-white"
//                         }`}
//                     >
//                       {page}
//                     </button>
//                   );
//                 }

//                 if (page === 4 && currentPage < totalCount - 2) {
//                   return (
//                     <span key="dots" className="tw-px-1 tw-text-gray-500">...</span>
//                   );
//                 }

//                 return null;
//               })}

//               <button
//                 onClick={() =>
//                   setCurrentPage(
//                     Math.min(currentPage + 1, Math.ceil(totalCount / rowsPerPage))
//                   )
//                 }
//                 disabled={currentPage === Math.ceil(totalCount / rowsPerPage)}
//                 className="tw-px-2 tw-py-1 tw-rounded hover:tw-bg-gray-100 disabled:tw-text-gray-400"
//               >
//                 {">"}
//               </button>
//             </div>
//           )}
//         </div>
//       </div>


//     </>
//   );
// };

// export default GridView;

import React from 'react'

function GridView() {
  return (
    <div>GridView</div>
  )
}

export default GridView