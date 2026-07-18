import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

const CustomSelect = ({
  options = [],
  placeholder = "Select options",
  onChange,
  width = "tw-w-full",
  value,
  defaultSelectAll = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(defaultSelectAll ? options : []);
  const dropdownRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (Array.isArray(value)) {
      setSelected(value);
    }
  }, [value]);

  // Initialize only once
  useEffect(() => {
    if (!initializedRef.current && defaultSelectAll && options.length > 0) {
      setSelected(options);
      onChange?.(options);
      initializedRef.current = true;
    }
  }, [options, defaultSelectAll, onChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    let updatedSelection;
    if (selected.includes(option)) {
      updatedSelection = selected.filter((item) => item !== option);
    } else {
      updatedSelection = [...selected, option];
    }
    setSelected(updatedSelection);
    onChange?.(updatedSelection);
  };

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      setSelected([]);
      onChange?.([]);
    } else {
      setSelected(options);
      onChange?.(options);
    }
  };

  const handleRemove = (option, e) => {
    e.stopPropagation();
    const updated = selected.filter((item) => item !== option);
    setSelected(updated);
    onChange?.(updated);
  };

  return (
    <div ref={dropdownRef} className={`tw-relative ${width}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="tw-h-[40px] tw-w-full !tw-m-0 tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-rounded-md tw-shadow-[0_4px_4px_0_rgba(194,194,194,0.25)] tw-text-[14px] tw-border tw-border-white tw-bg-[#f6f6f6] hover:tw-border-[#156082] tw-transition-all tw-duration-200 tw-ease-in-out"
      >
        {/* FIXED PLACEHOLDER (only shown if empty) */}
        {selected.length >= 0 && (
          <span className="tw-text-[#999] tw-shrink-0 tw-mr-2">
            {placeholder}
          </span>
        )}
        <div className="tw-flex tw-items-center tw-gap-1 tw-flex-1 tw-min-w-0 tw-overflow-x-auto tw-scrollbar-thin tw-scrollbar-thumb-[#ccc] tw-scrollbar-track-transparent">
          {selected.length === options.length ? (
            // Show only "All"
            <span className="tw-bg-[#156082]/10 tw-text-[#156082] tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium">
              All
            </span>
          ) : selected.length > 0 ? (
            // Show selected names as chips
            selected.map((option) => (
              <span
                key={option}
                className="tw-flex tw-items-center tw-gap-1 tw-bg-[#156082]/10 tw-text-[#156082] tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium tw-shrink-0"
              >
                {option}
                <X
                  size={12}
                  className="tw-cursor-pointer hover:tw-text-red-500"
                  onClick={(e) => handleRemove(option, e)}
                />
              </span>
            ))
          ) : null}
        </div>

        <i
          className={`icon-dropdown tw-shrink-0 tw-ml-2 tw-transform tw-transition-transform tw-duration-200 tw-ease-in-out ${
            isOpen ? "tw-rotate-180" : "tw-rotate-0"
          }`}
        ></i>
      </button>

      {/* Dropdown List */}
      {isOpen && (
        <ul className="tw-absolute tw-left-0 tw-right-0 tw-mt-2 tw-bg-white tw-border tw-border-[#ededed] tw-rounded-md tw-shadow-[0_4px_4px_0_rgba(143,143,143,0.65)] tw-max-h-56 tw-overflow-y-auto tw-z-10 tw-animate-fadeIn">
          <li
            onClick={handleSelectAll}
            className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2 tw-text-sm tw-cursor-pointer hover:tw-bg-[#176183]/10 tw-transition-colors tw-border-b tw-border-[#eee]"
          >
            <span className="tw-font-medium tw-text-[#156082] tw-flex-1">
              Select All
            </span>
            <input
              type="checkbox"
              checked={selected.length === options.length && options.length > 0}
              onChange={handleSelectAll}
              className="tw-accent-[#156082] tw-cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
          </li>

          {options.map((option, index) => (
            <li
              key={index}
              onClick={() => handleSelect(option)}
              className={`tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2 tw-text-sm tw-cursor-pointer hover:tw-bg-[#176183]/10 tw-transition-colors ${
                selected.includes(option)
                  ? "tw-text-[#156082]"
                  : "tw-text-[#555]"
              }`}
            >
              <span className="tw-flex-1 tw-truncate">{option}</span>
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => handleSelect(option)}
                className="tw-accent-[#156082] tw-cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
