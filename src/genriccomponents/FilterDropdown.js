// import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
// import ReactDOM from "react-dom";
// import { ChevronDown, Check } from "lucide-react";

// export default function FilterDropdown({
//   options = [],
//   placeholder,
//   onChange,
//   width = "tw-w-44",
//   value,
//   disabled = false,
//   disabledOptions = [],
//   label,
//   prefixIcon,
//   hideCheck = false,
// }) {
//   const [open, setOpen] = useState(false);
//   const [dropdownStyle, setDropdownStyle] = useState({});
//   const buttonRef = useRef(null);
//   const dropdownRef = useRef(null);

//   // Close on outside click
//   useEffect(() => {
//     const handler = (e) => {
//       if (
//         buttonRef.current && !buttonRef.current.contains(e.target) &&
//         dropdownRef.current && !dropdownRef.current.contains(e.target)
//       ) {
//         setOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   // Recalculate position when open changes, and close on scroll/resize (except inside the dropdown menu itself)
//   useLayoutEffect(() => {
//     if (!open) return;

//     const calculate = () => {
//       if (!buttonRef.current) return;
//       const rect = buttonRef.current.getBoundingClientRect();
//       const spaceBelow = window.innerHeight - rect.bottom;
//       const spaceAbove = rect.top;
//       const dropdownHeight = 240; // max-height is 240px

//       if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
//         setDropdownStyle({
//           position: "fixed",
//           bottom: window.innerHeight - rect.top + 4,
//           left: rect.left,
//           width: rect.width,
//           zIndex: 2147483647,
//         });
//       } else {
//         setDropdownStyle({
//           position: "fixed",
//           top: rect.bottom + 4,
//           left: rect.left,
//           width: rect.width,
//           zIndex: 2147483647,
//         });
//       }
//     };

//     const handleScroll = (e) => {
//       if (dropdownRef.current && dropdownRef.current.contains(e.target)) {
//         return;
//       }
//       setOpen(false);
//     };

//     calculate();
//     window.addEventListener("scroll", handleScroll, true);
//     window.addEventListener("resize", handleScroll);
//     return () => {
//       window.removeEventListener("scroll", handleScroll, true);
//       window.removeEventListener("resize", handleScroll);
//     };
//   }, [open]);

//   const handleSelect = (option) => {
//     onChange(option);
//     setOpen(false);
//   };

//   const dropdownMenu = open && !disabled
//     ? ReactDOM.createPortal(
//         <div
//           ref={dropdownRef}
//           style={dropdownStyle}
//           className="custom-visible-scroll tw-bg-white tw-border tw-border-gray-200 tw-rounded-md
//                      tw-shadow-lg tw-py-1 tw-max-h-60 tw-overflow-y-auto"
//         >
//           {options.map((opt) => {
//             const isOptDisabled = disabledOptions.includes(opt) && opt !== value;
//             return (
//               <button
//                 key={opt}
//                 onClick={() => !isOptDisabled && handleSelect(opt)}
//                 disabled={isOptDisabled}
//                 className={`tw-w-full tw-flex tw-items-center tw-justify-between
//                             tw-px-3 tw-py-2 tw-text-left tw-text-sm
//                             ${isOptDisabled
//                               ? "tw-text-gray-300 tw-cursor-not-allowed tw-opacity-50"
//                               : value === opt
//                                 ? "tw-bg-blue-50 tw-text-blue-600 tw-font-medium"
//                                 : "tw-text-gray-700 hover:tw-bg-gray-50"
//                             }`}
//               >
//                 {opt}
//                 {!hideCheck && value === opt && <Check size={14} className="tw-ml-2" />}
//               </button>
//             );
//           })}
//         </div>,
//         document.body
//       )
//     : null;

//   const isDefault =
//     !value ||
//     value === "All" ||
//     value === placeholder ||
//     String(value).toLowerCase().startsWith("all ") ||
//     String(value).toLowerCase().startsWith("sort by") ||
//     String(value).toLowerCase() === "filter";

//   return (
//     <div className={`tw-relative ${width}`}>
//       <button
//         ref={buttonRef}
//         type="button"
//         disabled={disabled}
//         onClick={() => !disabled && setOpen((prev) => !prev)}
//         className={`tw-w-full tw-flex tw-items-center tw-gap-1.5 tw-justify-between
//                    tw-px-3 tw-py-2 tw-border tw-rounded-md tw-text-sm
//                    tw-transition-all tw-duration-200
//                    ${disabled
//                      ? 'tw-bg-gray-50 tw-border-[#cacaca] tw-cursor-not-allowed tw-opacity-70'
//                      : 'tw-bg-white tw-border-gray-300 tw-text-gray-600 hover:tw-border-gray-400 tw-cursor-pointer'
//                    }`}
//       >
//         {prefixIcon && (
//           <span className="tw-text-[#64748B] tw-flex-shrink-0 tw-flex tw-items-center">{prefixIcon}</span>
//         )}
//         {label && (
//           <span className="tw-text-[13px] tw-text-[#64748B] tw-whitespace-nowrap tw-flex-shrink-0">{label}:</span>
//         )}
//         <span
//           className={`tw-truncate ${
//             label
//               ? "tw-font-semibold tw-text-[#0F172A]"
//               : isDefault
//                 ? "tw-text-gray-400"
//                 : "tw-text-gray-900"
//           }`}
//         >
//           {(!value || value === "All") ? placeholder : value}
//         </span>
//         <ChevronDown
//           size={18}
//           className={`tw-text-[#717182] tw-transition-transform tw-duration-200 tw-shrink-0 ${
//             open ? "tw-rotate-180" : ""
//           }`}
//         />
//       </button>

//       {dropdownMenu}
//     </div>
//   );
// }


import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import ReactDOM from "react-dom";
import { ChevronDown, Check, Search } from "lucide-react";

export default function FilterDropdown({
  options = [],
  groupedOptions,        // [{ groupLabel: 'MAIN', items: [...] }, ...]
  placeholder,
  onChange,
  width = "tw-w-44",
  value,
  disabled = false,
  disabledOptions = [],
  label,
  prefixIcon,
  hideCheck = false,
  searchable = false,          // enables search capability
  searchThreshold = 6,         // search bar only appears when option count exceeds this
  noResultsText = "No results found",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState({});
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Show search only when options exceed threshold (scrollbar visible) ── */
  const totalOptionCount = groupedOptions
    ? groupedOptions.reduce((acc, g) => acc + g.items.length, 0)
    : options.length;
  const showSearch = searchable && totalOptionCount > searchThreshold;

  /* ── Reset search when dropdown closes ── */
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const calculate = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 280;
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownStyle({
          position: "fixed",
          bottom: window.innerHeight - rect.top + 4,
          left: rect.left,
          width: rect.width,
          zIndex: 2147483647,
        });
      } else {
        setDropdownStyle({
          position: "fixed",
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          zIndex: 2147483647,
        });
      }
    };
    const handleScroll = (e) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      setOpen(false);
    };
    calculate();
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 0);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open, showSearch]);

  const handleSelect = (option) => {
    onChange(option);
    setOpen(false);
  };

  /* ── Filter options by search text ── */
  const filterBySearch = (list) => {
    if (!showSearch || !search) return list;
    const q = search.toLowerCase();
    return list.filter((opt) => String(opt).toLowerCase().includes(q));
  };

  /* ── Render a single selectable option row ── */
  const renderOption = (opt) => {
    const isOptDisabled = disabledOptions.includes(opt) && opt !== value;
    return (
      <button
        key={opt}
        onClick={() => !isOptDisabled && handleSelect(opt)}
        disabled={isOptDisabled}
        className={`tw-w-full tw-flex tw-items-center tw-justify-between
                    tw-px-3 tw-py-2 tw-text-left tw-text-sm
                    ${isOptDisabled
                      ? "tw-text-gray-300 tw-cursor-not-allowed tw-opacity-50"
                      : value === opt
                        ? "tw-bg-blue-50 tw-text-blue-600 tw-font-medium"
                        : "tw-text-gray-700 hover:tw-bg-gray-50"
                    }`}
      >
        {opt}
        {!hideCheck && value === opt && <Check size={14} className="tw-ml-2 tw-flex-shrink-0" />}
      </button>
    );
  };

  /* ── Render grouped list OR flat list ── */
  const renderOptions = () => {
    if (groupedOptions) {
      const filteredGroups = groupedOptions
        .map((group) => ({ ...group, items: filterBySearch(group.items) }))
        .filter((group) => group.items.length > 0);

      if (filteredGroups.length === 0) {
        return <p className="tw-px-3 tw-py-3 tw-text-sm tw-text-gray-400 tw-text-center">{noResultsText}</p>;
      }
      return filteredGroups.map((group, gi) => (
        <div key={gi}>
          {group.groupLabel && (
            <div className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-sticky tw-top-0 tw-bg-white tw-z-10">
              <div className="tw-flex-1 tw-h-px tw-bg-slate-200" />
              <span className="tw-text-[10px] tw-font-semibold tw-tracking-widest tw-text-slate-400 tw-uppercase tw-whitespace-nowrap">
                {group.groupLabel}
              </span>
              <div className="tw-flex-1 tw-h-px tw-bg-slate-200" />
            </div>
          )}
          {group.items.map(renderOption)}
        </div>
      ));
    }

    const filteredOpts = filterBySearch(options);
    if (filteredOpts.length === 0) {
      return <p className="tw-px-3 tw-py-3 tw-text-sm tw-text-gray-400 tw-text-center">{noResultsText}</p>;
    }
    return filteredOpts.map(renderOption);
  };

  const dropdownMenu = open && !disabled
    ? ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-md tw-shadow-lg tw-flex tw-flex-col"
        >
          {/* Search input — only when list is long enough for scrollbar */}
          {showSearch && (
            <div className="tw-px-2 tw-pt-2 tw-pb-1.5 tw-border-b tw-border-gray-100 tw-flex-shrink-0">
              <div className="tw-flex tw-items-center tw-border tw-border-gray-200 tw-rounded-md tw-px-2 tw-bg-white">
                <Search size={13} className="tw-text-gray-400 tw-flex-shrink-0 tw-mr-1.5" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="tw-flex-1 tw-py-1.5 tw-text-sm tw-outline-none tw-bg-transparent tw-text-gray-800 placeholder:tw-text-gray-400"
                />
              </div>
            </div>
          )}
          {/* Options list */}
          <div className="custom-visible-scroll tw-overflow-y-auto tw-max-h-60 tw-py-1">
            {renderOptions()}
          </div>
        </div>,
        document.body
      )
    : null;

  const isDefault =
    !value ||
    value === "All" ||
    value === placeholder ||
    String(value).toLowerCase().startsWith("all ") ||
    String(value).toLowerCase().startsWith("sort by") ||
    String(value).toLowerCase() === "filter";

  return (
    <div className={`tw-relative ${width}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`tw-w-full tw-flex tw-items-center tw-gap-1.5 tw-justify-between
                   tw-px-3 tw-py-2 tw-border tw-rounded-md tw-text-sm
                   tw-transition-all tw-duration-200
                   ${disabled
                     ? 'tw-bg-gray-50 tw-border-[#cacaca] tw-cursor-not-allowed tw-opacity-70'
                     : 'tw-bg-white tw-border-gray-300 tw-text-gray-600 hover:tw-border-gray-400 tw-cursor-pointer'
                   }`}
      >
        {prefixIcon && (
          <span className="tw-text-[#64748B] tw-flex-shrink-0 tw-flex tw-items-center">{prefixIcon}</span>
        )}
        {label && (
          <span className="tw-text-[13px] tw-text-[#64748B] tw-whitespace-nowrap tw-flex-shrink-0">{label}:</span>
        )}
        <span
          className={`tw-truncate ${
            label
              ? "tw-font-semibold tw-text-[#0F172A]"
              : isDefault
                ? "tw-text-gray-400"
                : "tw-text-gray-900"
          }`}
        >
          {(!value || value === "All") ? placeholder : value}
        </span>
        <ChevronDown
          size={18}
          className={`tw-text-[#717182] tw-transition-transform tw-duration-200 tw-shrink-0 ${
            open ? "tw-rotate-180" : ""
          }`}
        />
      </button>
      {dropdownMenu}
    </div>
  );
}