import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const CustomSelect = ({
  options = [],
  placeholder = "Select an option",
  onChange,
  value = "",
  width = "tw-w-full",
  label = "",
  error = "",
  disabled,
  isViewMode = false,
  required = false,
  style = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || "");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const searchBuffer = useRef("");
  const searchTimeout = useRef(null);

  // ✅ Normalize options to always { label, value }
  const normalizedOptions = options.map((opt) =>
    typeof opt === "object" ? opt : { label: opt, value: opt }
  );

  // ✅ Get display label from value
  const getLabel = (val) => {
    const match = normalizedOptions.find((opt) => opt.value === val);
    return match ? match.label : val;
  };

  useEffect(() => setSelectedValue(value || ""), [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0) {
      const ul = dropdownRef.current.querySelector("ul");
      const li = ul?.children[highlightedIndex];
      li?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (option) => {
    if (isViewMode) return;
    setSelectedValue(option.value); // ✅ store value
    setIsOpen(false);
    setHighlightedIndex(-1);
    onChange?.(option.value); // ✅ pass value to parent
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, normalizedOptions.length - 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(normalizedOptions[highlightedIndex]);
      return;
    }

    if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    // 🔍 Type-to-search using label
    if (e.key.length === 1 && /^[a-zA-Z0-9 ]$/.test(e.key)) {
      searchBuffer.current += e.key.toLowerCase();
      const matchIndex = normalizedOptions.findIndex((opt) =>
        opt.label.toLowerCase().startsWith(searchBuffer.current) // ✅ search by label
      );
      if (matchIndex !== -1) setHighlightedIndex(matchIndex);
      clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        searchBuffer.current = "";
      }, 500);
    }
  };

  return (
    <div className={`tw-relative ${width}`} ref={dropdownRef}>
      <div>
        <div className="tw-flex tw-flex-col tw-gap-1">
          <label className="tw-text-[#3b3b3b] !tw-text-[14px]">
            {label}
            {required && <span className={style === 'org' ? 'tw-text-red-500' : ''}>&nbsp;*</span>}
          </label>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            onClick={() => !isViewMode && setIsOpen((prev) => !prev)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={`tw-border tw-rounded-[8px] tw-px-3 tw-text-[14px] tw-py-[7px] tw-mt-[2px] tw-flex tw-items-center tw-justify-between tw-gap-[6px] tw-bg-white tw-text-black tw-w-full
              ${disabled ? "tw-cursor-not-allowed !tw-bg-[#f0f0f0] !tw-text-[#a0a0a0]" : "tw-cursor-pointer"}
              ${error ? "tw-border-red-500" : "tw-border-[#cacaca] focus:tw-border-[#0140c1]"}
            `}
          >
            <span className={`tw-truncate ${selectedValue ? "tw-text-black" : "tw-text-[#6b7280]"}`}>
              {selectedValue ? getLabel(selectedValue) : placeholder} {/* ✅ display label */}
            </span>
            <ChevronDown
              className={`tw-w-4 tw-h-4 tw-text-[#717182] tw-transition-transform tw-shrink-0 ${isOpen ? "tw-rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {isOpen && !isViewMode && (
        <ul
          role="listbox"
          className="tw-absolute tw-left-0 tw-right-0 tw-mt-2 tw-bg-white tw-border tw-border-gray-200 tw-rounded-md tw-shadow-lg tw-max-h-48 tw-overflow-y-scroll tw-z-50 custom-select-dropdown"
        >
          {normalizedOptions.length > 0 ? (
            normalizedOptions.map((option, index) => (
              <li
                role="option"
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`tw-px-3 tw-py-2 tw-text-sm tw-cursor-pointer
                  hover:tw-bg-[#0140c1]/10
                  ${selectedValue === option.value ? "tw-text-[#0140c1] tw-font-medium" : ""}
                  ${highlightedIndex === index ? "tw-bg-[#e0f0ff]" : ""}
                `}
              >
                {option.label} {/* ✅ render label not object */}
              </li>
            ))
          ) : (
            <li className="tw-px-3 tw-py-2 tw-text-sm tw-text-gray-400">
              No options available
            </li>
          )}
        </ul>
      )}
      <div className="tw-text-[12px] tw-h-[16px] tw-mt-[4px]">
        <span className="tw-font-[600] tw-text-red-500">{error}</span>
      </div>
    </div>
  );
};

export default CustomSelect;