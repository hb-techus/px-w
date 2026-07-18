import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check ,ChevronDown} from "lucide-react";

export default function Dropdown({
  options = [],
  placeholder,
  onChange,
  width = "tw-w-44",
  value,
  error = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  // ── Close on outside click ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Recalculate position on open, and close on scroll/resize (except inside the dropdown menu itself) ──
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: rect.width,
        width: "max-content",
        maxWidth: "300px",
        zIndex: 9999999,
      });
    };

    const handleScroll = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) {
        return;
      }
      setOpen(false);
    };

    update();
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  const handleOpen = () => {
    if (disabled) return;
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: rect.width,
      width: "max-content",
      maxWidth: "300px",
      maxHeight: "200px",
      overflowY: "auto",
      zIndex: 99999,
    });
    setOpen((o) => !o);
  };

  const handleSelect = (option) => {
    if (disabled) return;
    onChange(option);
    setOpen(false);
  };

  // Display label — show placeholder when value is a "reset" sentinel
  const isPlaceholder =
    !value ||
    value === "All" ||
    value === placeholder ||
    String(value).toLowerCase().startsWith("all ") ||
    String(value).toLowerCase().startsWith("sort by") ||
    String(value).toLowerCase() === "filter";

  return (
    <div className={`tw-relative ${width}`}>
      {/* ── Trigger button ─────────────────────────────────────────────── */}
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`tw-w-full tw-flex tw-items-center tw-justify-between
                   tw-px-3 tw-py-2 tw-bg-white tw-border tw-border-gray-300
                   tw-rounded-md tw-text-sm tw-text-gray-600
                   hover:tw-border-gray-400 tw-transition-all tw-duration-200
                  ${error ? "tw-border-red-400" : "tw-border-gray-300"}
                  ${disabled ? "tw-bg-gray-100 tw-text-gray-400 tw-cursor-not-allowed" : ""}`}
      >
  <span
  className={`tw-truncate ${
    isPlaceholder ? "tw-text-gray-400" : "tw-text-gray-900"
  }`}
>
  {isPlaceholder ? placeholder : value}
</span>
          <ChevronDown
          size={18}
          className={`tw-text-[#717182] tw-transition-transform tw-duration-200 tw-shrink-0 ${
            open ? "tw-rotate-180" : ""
          }`}
        />
      </button>

      {/* ── Portal menu — renders on <body>, escapes all overflow:hidden ── */}
    {open &&
  createPortal(
    <div
      ref={menuRef}
      style={{
        ...menuStyle,
        maxHeight: "200px",
        overflowY: "auto",
      }}
      className="tw-bg-white tw-border tw-border-gray-200
                 tw-rounded-md tw-shadow-lg tw-py-1"
    >
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => handleSelect(opt)}
          className={`tw-w-full tw-flex tw-items-center tw-justify-between
                      tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-whitespace-nowrap
                      ${
                        value === opt
                          ? "tw-bg-blue-50 tw-text-blue-600 tw-font-medium"
                          : "tw-text-gray-700 hover:tw-bg-gray-50"
                      }`}
        >
          <span className="tw-flex-1">{opt}</span>
          {value === opt && (
            <Check size={13} className="tw-ml-3 tw-flex-shrink-0 tw-text-blue-500" />
          )}
        </button>
      ))}
    </div>,
    document.body,
  )}
    </div>
  );
}
