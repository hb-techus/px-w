// import React, { useState, useRef, useEffect } from "react";

// const RowsPerPageDropdown = ({ rowsPerPage, paginationOptions, onChangeRowsPerPage }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const dropdownRef = useRef(null);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setIsOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <div ref={dropdownRef} className="tw-relative tw-inline-block tw-text-sm">
//       {/* Trigger Button */}
//       <button
//         onClick={() => setIsOpen((prev) => !prev)}
//         className={`
//           tw-flex tw-items-center tw-justify-between tw-gap-2 
//           tw-border tw-border-gray-300 tw-rounded-md tw-px-3 tw-py-[6px]
//           tw-bg-white tw-text-gray-700 tw-min-w-[50px] 
//           tw-transition-all tw-duration-200 tw-cursor-pointer
//           hover:tw-border-[#0140c1] hover:tw-text-[#0140c1]
//           focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-[#0140c1]
//         `}
//       >
//         {rowsPerPage}
//         <i
//           className={`icon-dropdown tw-transition-transform tw-duration-300 ${
//             isOpen ? "tw-rotate-180" : "tw-rotate-0"
//           }`}
//         ></i>
//       </button>

//       {/* Dropdown List */}
//       {isOpen && (
//         <div
//           className="
//             tw-absolute tw-left-0 tw-mt-2 tw-z-40 tw-bg-white 
//             tw-border tw-border-gray-200 tw-rounded-md tw-shadow-lg 
//             tw-min-w-[55px] tw-overflow-hidden tw-animate-fadeIn
//           "
//         >
//           {paginationOptions.map((opt) => (
//             <div
//               key={opt}
//               onClick={() => {
//                 setIsOpen(false);
//                 setTimeout(() => onChangeRowsPerPage(opt), 100);
//               }}
//               className="
//                 tw-px-4 tw-py-2 tw-text-gray-700 tw-cursor-pointer 
//                 hover:tw-bg-[#0140c1]/10 hover:tw-text-[#0140c1]
//                 active:tw-bg-[#0140c1]/20 tw-transition-all tw-duration-150
//               "
//             >
//               {opt}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default RowsPerPageDropdown;




import React, { useState, useRef, useEffect } from "react";

const RowsPerPageDropdown = ({ rowsPerPage, paginationOptions, onChangeRowsPerPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState("bottom"); // 'bottom' or 'top'
  const containerRef = useRef(null);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);

    if (!isOpen) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 200) {
        setPosition("top"); // show above
      } else {
        setPosition("bottom"); // show below
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="tw-relative tw-inline-block tw-text-sm">
      {/* Trigger Button */}
      <button
        onClick={toggleDropdown}
        className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-border tw-border-gray-300 tw-rounded-md tw-px-3 tw-py-[6px] tw-bg-white tw-text-gray-700 tw-min-w-[50px] tw-transition-all tw-duration-200 tw-cursor-pointer hover:tw-border-[#156082] hover:tw-text-[#156082] focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-[#156082]"
      >
        {rowsPerPage}
        <i className={`icon-dropdown tw-transition-transform tw-duration-300 ${isOpen ? "tw-rotate-180" : "tw-rotate-0"}`}></i>
      </button>

      {/* Dropdown List */}
      {isOpen && (
        <div
          className={`tw-absolute tw-right-0 tw-z-1000 tw-bg-white tw-border tw-border-gray-200 tw-rounded-md tw-shadow-lg tw-min-w-[55px] tw-overflow-visible tw-animate-fadeIn ${
            position === "bottom" ? "tw-top-full tw-mt-2" : "tw-bottom-full tw-mb-2"
          }`}
        >
          {paginationOptions.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                setIsOpen(false);
                setTimeout(() => onChangeRowsPerPage(opt), 100);
              }}
              className="tw-px-4 tw-py-2 tw-text-gray-700 tw-cursor-pointer hover:tw-bg-[#156082]/10 hover:tw-text-[#156082] active:tw-bg-[#156082]/20 tw-transition-all tw-duration-150"
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RowsPerPageDropdown;
