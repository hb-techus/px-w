// import React, { useMemo,useEffect,useState } from "react";
// import CustomSelect from "../../../../../genriccomponents/FormDropDown";
// import { capitalizeFirstLetter } from "../../../../../utils/commonUtils";

// const GapSelection = ({
//   gaps,
//   selectedGaps,
//   setSelectedGaps,
//   severity,
//   setSeverity,
//   category,
//   setCategory,
//   searchQuery,
//   setSearchQuery,
//   rfiName,
//   setRfiName,
//   nameError,
//   nameInputRef,
// }) => {
//   const severityOptions = ["All Severities", "High", "Medium", "Low", "Critical"];
//   const categoryOptions = useMemo(() => {
//     const unique = [...new Set(gaps.map((g) => g.category))];
//     return ["All Categories", ...unique];
//   }, [gaps]);
// const [currentPage, setCurrentPage] = useState(1);
// const itemsPerPage = 5;
//   // Filtered gaps based on search + severity + category
//   const filteredGaps = useMemo(() => {
//     return gaps.filter((gap) => {
//       const matchesSearch =
//         !searchQuery ||
//         gap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         gap.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         gap.reference.toLowerCase().includes(searchQuery.toLowerCase());

//       const matchesSeverity =
//         !severity || severity === "All Severities" || gap.severity === severity;

//       const matchesCategory =
//         !category || category === "All Categories" || gap.category === category;

//       return matchesSearch && matchesSeverity && matchesCategory;
//     });
//   }, [gaps, searchQuery, severity, category]);

// const totalPages = Math.ceil(filteredGaps.length / itemsPerPage);

// const paginatedGaps = useMemo(() => {
//   const start = (currentPage - 1) * itemsPerPage;
//   return filteredGaps.slice(start, start + itemsPerPage);
// }, [filteredGaps, currentPage]);

// const allFilteredSelected =
//   paginatedGaps.length > 0 &&
//   paginatedGaps.every((g) => selectedGaps.includes(g.id));
// useEffect(() => {
//   setCurrentPage(1);
// }, [searchQuery, severity, category]);
//   const handleSelectAll = () => {
//     if (allFilteredSelected) {
//       // Deselect all filtered gaps
//       setSelectedGaps((prev) =>
//         prev.filter((id) => !filteredGaps.find((g) => g.id === id))
//       );
//     } else {
//       // Select all filtered gaps (merge with existing)
//       const newIds = paginatedGaps.map((g) => g.id);
//       setSelectedGaps((prev) => [...new Set([...prev, ...newIds])]);
//     }
//   };

//   const handleCheckbox = (id) => {
//     setSelectedGaps((prev) =>
//       prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
//     );
//   };

//   return (
//     <div className="tw-flex tw-flex-col tw-gap-4">
//       {/* Name field */}
//       <div className="tw-border tw-bg-[#fff] tw-px-6 tw-py-4 tw-border-[#e0e0e0] tw-rounded-[10px] tw-mt-3">
//         <label className="tw-block tw-text-[14px] tw-font-medium tw-text-[#333] tw-mb-2 tw-ml-1">
//           Name *
//         </label>
//         <input
//           ref={nameInputRef}
//           type="text"
//           placeholder="New RFI name"
//           value={capitalizeFirstLetter(rfiName)}
//           onChange={(e) => setRfiName(e.target.value)}
//           className={`tw-w-1/2 tw-px-4 tw-py-2 tw-border tw-rounded-[5px] tw-text-sm focus:tw-outline-none focus:tw-ring-1 tw-bg-[#fff]
//             ${nameError
//               ? "tw-border-red-500 focus:tw-ring-red-400"
//               : "tw-border-[#dcdbdb] focus:tw-border-[#0140c1] focus:tw-ring-1 tw-ring-[#0140c1]"
//             }`}
//         />
//         {nameError && (
//           <p className="tw-text-red-500 tw-text-[12px] tw-mt-1 tw-ml-1">
//             {nameError}
//           </p>
//         )}
//       </div>

//       {/* Search & Filters */}
//       <div className="search-filter">
//         <div className="tw-flex tw-justify-between tw-items-center">
//           <div className="tw-relative tw-flex-1 tw-max-w-[505px]">
//             <i className="icon-Search tw-text-xl tw-absolute tw-left-3 tw-top-1/2 tw--translate-y-1/2 tw-text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search gaps by title, description, or reference..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="tw-min-w-[82%] tw-pl-9 tw-bg-[#fff] tw-pr-4 tw-py-3 tw-border tw-border-gray-300 tw-rounded-[5px] tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
//             />
//           </div>
//           <div className="filters tw-flex tw-items-center tw-gap-3">
//             <CustomSelect
//               width="tw-w-[180px]"
//               placeholder="All Severity"
//               options={severityOptions}
//               value={severity}
//               onChange={(val) => setSeverity(val)}
//             />
//             <CustomSelect
//               width="tw-w-[200px]"
//               placeholder="All Categories"
//               options={categoryOptions}
//               value={category}
//               onChange={(val) => setCategory(val)}
//             />
//           </div>
//         </div>
//       </div>

//       {/* Gap List */}
//       <div className="gap-section-layout tw-border tw-bg-[#fff] tw-border-[#e0e0e0] tw-rounded-[10px]">
//         <div className="tw-border-b">
//           <div className="tw-flex tw-justify-between tw-items-center tw-pt-4 tw-pb-4">
//             <span className="tw-text-[17px] tw-font-bold tw-text-[#333] tw-pl-6 ">
//               Select Gaps to include in RFI
//             </span>
//             <div className="tw-flex tw-gap-4 tw-items-center tw-pr-5">
//               <span className="tw-text-[#4e4e4e] tw-text-[13px]">
//                 {selectedGaps.length} of {gaps.length} selected
//               </span>
//               <button
//                 onClick={handleSelectAll}
//                 className="tw-px-3 tw-py-1 tw-border tw-border-[#d1d5db] tw-text-[14px] tw-rounded-[4px]"
//               >
//                 {allFilteredSelected ? "Deselect All" : "Select All"}
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="tw-flex tw-flex-col tw-gap-4 tw-px-2 tw-pt-2 tw-mt-4">
//           {filteredGaps.length === 0 ? (
//             <div className="tw-text-center tw-text-[#6b7280] tw-py-8 tw-text-sm">
//               No gaps match your search or filters.
//             </div>
//           ) : (
//            paginatedGaps.map((gap) => (
//               <div
//                 key={gap.id}
//                 className="tw-flex tw-gap-4 tw-border-b tw-border-[#e5e7eb] tw-pb-4 tw-px-4"
//               >
//                 <input
//                   type="checkbox"
//                   checked={selectedGaps.includes(gap.id)}
//                   onChange={() => handleCheckbox(gap.id)}
//                   className="tw-w-[18px] tw-h-[18px] tw-mt-1 tw-rounded-[8px] tw-cursor-pointer"
//                 />
//                 <div className="tw-flex-1">
//                   <div className="tw-flex tw-justify-between tw-items-center">
//                     <div className="tw-flex tw-items-center tw-gap-4 tw-mb-2">
//                       <span className="tw-text-[13px] tw-bg-[#fff] tw-font-[600] tw-px-3 tw-py-[4px] tw-rounded-[30px] tw-border tw-border-[#d1d5db]">
//                         {gap.id}
//                       </span>
//                       <span className="tw-text-[13px] tw-bg-[#eee] tw-font-[600] tw-px-4 tw-py-[3px] tw-rounded-[30px]">
//                         {gap.category}
//                       </span>
//                     </div>
//                     <span
//                       className={`tw-text-[13px] tw-px-3 tw-py-[3px] tw-rounded-[3px] tw-border tw-flex tw-items-center tw-gap-1
//                      ${gap.severity === "Critical"
//                           ? "tw-text-[#9d174d] tw-border-[#9d174d] tw-bg-[#fce7f3]"
//                           : gap.severity === "High"
//                             ? "tw-text-[#b91c1b] tw-border-[#b91c1b] tw-bg-[#ffe2e3]"
//                             : gap.severity === "Medium"
//                               ? "tw-text-[#ff9500] tw-border-[#ff9500] tw-bg-[#ffebce]"
//                               : "tw-text-[#1e4ed8] tw-border-[#1e4ed8] tw-bg-[#eaf1ff]"
//                         }`}
//                     >
//                       <i className={`tw-text-[14px]
//                       ${gap.severity === "Critical" || gap.severity === "High"
//                           ? "icon-AI-Risk-Identifier"
//                           : "icon-Alert"
//                         }`}
//                       />
//                       {gap.severity}
//                     </span>
//                   </div>
//                   <div className="tw-font-semibold tw-text-[14px] tw-text-[#222] tw-mb-1 tw-mt-2">
//                     {gap.title}
//                   </div>
//                   <p className="tw-text-[13px] tw-text-[#4b5563] tw-mb-2 tw-mt-2">
//                     {gap.description}
//                   </p>
//                   <p className="tw-text-[11px] tw-text-[#6b7280] tw-italic">
//                     <span className="tw-text-[11px] tw-text-[#6b7280] tw-italic">Reference: </span>
//                     {gap.reference}
//                   </p>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
      
//     </div>
//   );
// };

// export default GapSelection;





import React, { useMemo, useEffect, useState } from "react";
import CustomSelect from "../../../../../genriccomponents/FormDropDown";
import { capitalizeFirstLetter } from "../../../../../utils/commonUtils";

const GapSelection = ({
  gaps,
  selectedGaps,
  setSelectedGaps,
  severity,
  setSeverity,
  category,
  setCategory,
  searchQuery,
  setSearchQuery,
  rfiName,
  setRfiName,
  nameError,
  nameInputRef,
}) => {
  const severityOptions = ["All Severities","Critical", "High", "Medium", "Low", ];

  const categoryOptions = useMemo(() => {
    const unique = [...new Set(gaps.map((g) => g.category))];
    return ["All Categories", ...unique];
  }, [gaps]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ── Filtered gaps ────────────────────────────────────────────────────────
  const filteredGaps = useMemo(() => {
    return gaps.filter((gap) => {
      const matchesSearch =
        !searchQuery ||
        gap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gap.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gap.reference.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity =
        !severity || severity === "All Severities" || gap.severity === severity;

      const matchesCategory =
        !category || category === "All Categories" || gap.category === category;

      return matchesSearch && matchesSeverity && matchesCategory;
    });
  }, [gaps, searchQuery, severity, category]);

  const totalPages = Math.ceil(filteredGaps.length / itemsPerPage);

  const paginatedGaps = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredGaps.slice(start, start + itemsPerPage);
  }, [filteredGaps, currentPage]);

  const allFilteredSelected =
    paginatedGaps.length > 0 &&
    paginatedGaps.every((g) => selectedGaps.includes(g.id));

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, severity, category]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedGaps((prev) =>
        prev.filter((id) => !filteredGaps.find((g) => g.id === id))
      );
    } else {
      const newIds = paginatedGaps.map((g) => g.id);
      setSelectedGaps((prev) => [...new Set([...prev, ...newIds])]);
    }
  };

  const handleCheckbox = (id) => {
    setSelectedGaps((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="tw-flex tw-flex-col tw-gap-4">

      {/* ── Name field ──────────────────────────────────────────────────── */}
      <div className="tw-border tw-bg-[#fff] tw-px-6 tw-py-4 tw-border-[#e0e0e0] tw-rounded-[10px] tw-mt-3">
        <label className="tw-block tw-text-[14px] tw-font-medium tw-text-[#333] tw-mb-2 tw-ml-1">
          Name *
        </label>
        <input
          ref={nameInputRef}
          type="text"
          placeholder="New RFI name"
          value={capitalizeFirstLetter(rfiName)}
          onChange={(e) => setRfiName(e.target.value)}
          className={`tw-w-1/2 tw-px-4 tw-py-2 tw-border tw-rounded-[5px] tw-text-sm focus:tw-outline-none focus:tw-ring-1 tw-bg-[#fff]
            ${nameError
              ? "tw-border-red-500 focus:tw-ring-red-400"
              : "tw-border-[#dcdbdb] focus:tw-border-[#0140c1] focus:tw-ring-1 tw-ring-[#0140c1]"
            }`}
        />
        {nameError && (
          <p className="tw-text-red-500 tw-text-[12px] tw-mt-1 tw-ml-1">
            {nameError}
          </p>
        )}
      </div>

      {/* ── Search & Filters ────────────────────────────────────────────── */}
      <div className="search-filter">
        <div className="tw-flex tw-justify-between tw-items-center">
          <div className="tw-relative tw-flex-1 tw-max-w-[505px]">
            <i className="icon-Search tw-text-xl tw-absolute tw-left-3 tw-top-1/2 tw--translate-y-1/2 tw-text-gray-400" />
            <input
              type="text"
              placeholder="Search gaps by title, description, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tw-min-w-[82%] tw-pl-9 tw-bg-[#fff] tw-pr-4 tw-py-3 tw-border tw-border-gray-300 tw-rounded-[5px] tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
            />
          </div>
          <div className="filters tw-flex tw-items-center tw-gap-3">
            <CustomSelect
              width="tw-w-[180px]"
              placeholder="All Severity"
              options={severityOptions}
              value={severity}
              onChange={(val) => setSeverity(val)}
            />
            <CustomSelect
              width="tw-w-[200px]"
              placeholder="All Categories"
              options={categoryOptions}
              value={category}
              onChange={(val) => setCategory(val)}
            />
          </div>
        </div>
      </div>

      {/* ── Gap List ────────────────────────────────────────────────────── */}
      <div className="gap-section-layout tw-border tw-bg-[#fff] tw-border-[#e0e0e0] tw-rounded-[10px]">

        {/* Header */}
        <div className="tw-border-b">
          <div className="tw-flex tw-justify-between tw-items-center tw-pt-4 tw-pb-4">
            <span className="tw-text-[17px] tw-font-bold tw-text-[#333] tw-pl-6">
              Select Gaps to include in RFI
            </span>
            <div className="tw-flex tw-gap-4 tw-items-center tw-pr-5">
              <span className="tw-text-[#4e4e4e] tw-text-[13px]">
                {selectedGaps.length} of {gaps.length} selected
              </span>
              <button
                onClick={handleSelectAll}
                className="tw-px-3 tw-py-1 tw-border tw-border-[#d1d5db] tw-text-[14px] tw-rounded-[4px]"
              >
                {allFilteredSelected ? "Deselect All" : "Select All"}
              </button>
            </div>
          </div>
        </div>

        {/* Gap items */}
        <div className="tw-flex tw-flex-col tw-gap-4 tw-px-2 tw-pt-2 tw-mt-4">
          {filteredGaps.length === 0 ? (
            <div className="tw-text-center tw-text-[#6b7280] tw-py-8 tw-text-sm">
              No gaps match your search or filters.
            </div>
          ) : (
            paginatedGaps.map((gap) => (
              <div
                key={gap.id}
                onClick={() => handleCheckbox(gap.id)}
                className="tw-flex tw-gap-4 tw-border-b tw-border-[#e5e7eb] tw-pb-4 tw-px-4 tw-cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedGaps.includes(gap.id)}
                  onChange={() => handleCheckbox(gap.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="tw-w-[18px] tw-h-[18px] tw-mt-1 tw-rounded-[8px] tw-cursor-pointer"
                />
                <div className="tw-flex-1">
                  <div className="tw-flex tw-justify-between tw-items-center">
                    <div className="tw-flex tw-items-center tw-gap-4 tw-mb-2">
                      <span className="tw-text-[13px] tw-bg-[#fff] tw-font-[600] tw-px-3 tw-py-[4px] tw-rounded-[30px] tw-border tw-border-[#d1d5db]">
                        {gap.id}
                      </span>
                      <span className="tw-text-[13px] tw-bg-[#eee] tw-font-[600] tw-px-4 tw-py-[3px] tw-rounded-[30px]">
                        {gap.category}
                      </span>
                    </div>
                    <span
                      className={`tw-text-[13px] tw-px-3 tw-py-[3px] tw-rounded-[3px] tw-border tw-flex tw-items-center tw-gap-1
                        ${gap.severity === "Critical"
                          ? "tw-text-[#9d174d] tw-border-[#9d174d] tw-bg-[#fce7f3]"
                          : gap.severity === "High"
                            ? "tw-text-[#b91c1b] tw-border-[#b91c1b] tw-bg-[#ffe2e3]"
                            : gap.severity === "Medium"
                              ? "tw-text-[#ff9500] tw-border-[#ff9500] tw-bg-[#ffebce]"
                              : "tw-text-[#1e4ed8] tw-border-[#1e4ed8] tw-bg-[#eaf1ff]"
                        }`}
                    >
                      <i className={`tw-text-[14px] ${
                        gap.severity === "Critical" || gap.severity === "High"
                          ? "icon-AI-Risk-Identifier"
                          : "icon-Alert"
                      }`} />
                      {gap.severity}
                    </span>
                  </div>
                  <div className="tw-font-semibold tw-text-[14px] tw-text-[#222] tw-mb-1 tw-mt-2">
                    {gap.title}
                  </div>
                  <p className="tw-text-[13px] tw-text-[#4b5563] tw-mb-2 tw-mt-2">
                    {gap.description}
                  </p>
                  <p className="tw-text-[11px] tw-text-[#6b7280] tw-italic">
                    <span className="tw-text-[11px] tw-text-[#6b7280] tw-italic">Reference: </span>
                    {gap.reference}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
      {/* END gap-section-layout */}

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="tw-flex tw-justify-end tw-items-center tw-gap-2 tw-pt-2">

          {/* Previous */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`tw-flex tw-items-center tw-gap-1 tw-px-3 tw-py-2 tw-rounded-md tw-border tw-text-sm tw-font-medium tw-transition-colors ${
              currentPage === 1
                ? "tw-bg-gray-50 tw-text-gray-400 tw-border-gray-200 tw-cursor-not-allowed"
                : "tw-bg-white tw-text-gray-700 tw-border-gray-300 hover:tw-bg-gray-50"
            }`}
          >
            <i className="icon-Previous tw-text-xs" />
            <span>Previous</span>
          </button>

          {/* Page numbers with ellipsis */}
          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1;
            const isActive = currentPage === page;
            const shouldShow =
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1);
            const showLeftEllipsis  = page === currentPage - 2 && currentPage > 3;
            const showRightEllipsis = page === currentPage + 2 && currentPage < totalPages - 2;

            if (shouldShow) {
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`tw-w-9 tw-h-9 tw-rounded-md tw-text-sm tw-font-medium tw-border tw-transition-all ${
                    isActive
                      ? "tw-bg-[#0140c1] tw-text-white tw-border-[#0140c1]"
                      : "tw-bg-white tw-text-gray-600 tw-border-gray-300 hover:tw-bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              );
            }
            if (showLeftEllipsis || showRightEllipsis) {
              return (
                <span key={`ellipsis-${page}`} className="tw-px-1 tw-text-gray-500">
                  ...
                </span>
              );
            }
            return null;
          })}

          {/* Next */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`tw-flex tw-items-center tw-gap-1 tw-px-3 tw-py-2 tw-rounded-md tw-border tw-text-sm tw-font-medium tw-transition-colors ${
              currentPage === totalPages
                ? "tw-bg-gray-50 tw-text-gray-400 tw-border-gray-200 tw-cursor-not-allowed"
                : "tw-bg-white tw-text-gray-700 tw-border-gray-300 hover:tw-bg-gray-50"
            }`}
          >
            <span>Next</span>
            <i className="icon-Next tw-text-xs" />
          </button>

        </div>
      )}

    </div>
  );
};

export default GapSelection;