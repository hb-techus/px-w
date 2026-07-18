import React, { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import DropDownPortal from "./DropdownPortal";

const ActionMenu = ({
  onView,
  onEdit,
  onDownload,
  onDelete,
  onDeactivate,
  onMarkAsSent,
  onMarkAsActive,
  onMarkAsComplete,
  showView = true,
  showEdit = true,
  showDownload = false,
  showDelete = true,
  showDeactivate = false,
  showMarkAsSent = false,
  viewDisabled = false,
  editDisabled = false,
  downloadDisabled = false,
  deleteDisabled = false,
  deactivateDisabled = false,
  showMarkAsComplete = false,
  deactivateLabel = "Deactivate",
  markAsSentDisabled = false,
  markAsSentLoading = false,
  markAsCompleteDisabled = false,
  triggerDisabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  console.log(showEdit)

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);
  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.right + window.scrollX - 180,
      });
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // Recalculate position on any scroll (window or parent containers)
    window.addEventListener("scroll", updatePosition, true); // true = capture phase catches all scroll events
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  const handleTriggerClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY + 5,
      left: rect.right + window.scrollX - 180,
    });
    setIsOpen((prev) => !prev);
  };

  const handleAction = (callback) => {
    setIsOpen(false);
    if (callback) callback();
  };
  useEffect(() => {
    if (!isOpen && triggerRef.current) {
      const icon = triggerRef.current.querySelector('i')
      if (icon) icon.style.color = '#999999'
    }
  }, [isOpen])

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleTriggerClick}
        disabled={triggerDisabled}
        onMouseEnter={(e) =>
          !triggerDisabled && (e.currentTarget.querySelector("i").style.color = "#4488ff")
        }
        onMouseLeave={(e) =>
          !triggerDisabled &&
          (e.currentTarget.querySelector("i").style.color = isOpen ? "#4488ff" : "#999999")
        }
        className={`tw-group tw-text-[20px] ${triggerDisabled
            ? "tw-text-[#999999] tw-cursor-not-allowed"
            : isOpen
              ? "tw-text-[#4488ff] hover:tw-text-[#4488ff]"
              : "tw-text-[#999999] hover:tw-text-[#4488ff]"
          }`}
      >
        <i
          className={`tw-text-[20px] ${triggerDisabled
              ? "icon-Uploading tw-animate-spin tw-text-[#4488ff]"
              : `icon-Actions ${isOpen ? "tw-text-[#4488ff]" : "tw-text-[#999999]"}`
            }`}
        ></i>
      </button>

      {isOpen && !triggerDisabled && (
        <DropDownPortal>
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: position.top,
              left: position.left,
              width: "200px",
            }}
            className="tw-bg-white tw-border tw-rounded-md tw-shadow-lg tw-z-10 tw-p-1.5"
          >
            {/* View */}
            {showView && (
              <button
                onClick={() => !viewDisabled && handleAction(onView)}
                disabled={viewDisabled}
                className={`tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 tw-text-[13px] tw-transition-colors
                  ${viewDisabled
                    ? "tw-text-gray-300 tw-cursor-not-allowed"
                    : "hover:tw-bg-gray-100 tw-text-[#374151]"
                  }`}
              >
                <i className="icon-Eye tw-text-[16px]"></i>View
              </button>
            )}

            {/* Download — lucide Download icon */}
            {showDownload && (
              <button
                onClick={() => !downloadDisabled && handleAction(onDownload)}
                disabled={downloadDisabled}
                className={`tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 tw-text-[13px] tw-transition-colors
                  ${downloadDisabled
                    ? "tw-text-gray-300 tw-cursor-not-allowed"
                    : "hover:tw-bg-gray-100 tw-text-[#374151]"
                  }`}
              >
                <Download className="tw-w-4 tw-h-4" />
                Download
              </button>
            )}

            {/* Edit */}
            {showEdit && (
              <button
                onClick={() => !editDisabled && handleAction(onEdit)}
                disabled={editDisabled}
                className={`tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 tw-text-[13px] tw-transition-colors
                  ${editDisabled
                    ? "tw-text-gray-300 tw-cursor-not-allowed"
                    : "hover:tw-bg-gray-100 tw-text-[#374151]"
                  }`}
              >
                <i className="icon-Edit tw-text-[16px]"></i>Edit
              </button>
            )}

            {/* Mark as Complete */}
            {(showMarkAsComplete || Boolean(onMarkAsComplete)) && (
              <button
                onClick={() => !markAsCompleteDisabled && handleAction(onMarkAsComplete)}
                disabled={markAsCompleteDisabled}
                className={`tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 tw-text-[13px] tw-transition-colors
                  ${markAsCompleteDisabled
                    ? "tw-text-gray-300 tw-cursor-not-allowed"
                    : "hover:tw-bg-gray-100 tw-text-[#374151]"
                  }`}
              >
                <i className="icon-Got-it tw-text-[16px]"></i>
                Mark as Completed
              </button>
            )}

            {/* Mark as Active */}
            {Boolean(onMarkAsActive) && (
              <button
                onClick={() => handleAction(onMarkAsActive)}
                className="tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 tw-text-[12px] tw-transition-colors hover:tw-bg-gray-100 tw-text-[#374151]"
              >
                <i className="icon-Got-it tw-text-[16px]"></i>
                Mark as Active
              </button>
            )}

            {(showMarkAsSent || Boolean(onMarkAsSent)) && (
              <button
                onClick={() => !markAsSentDisabled && handleAction(onMarkAsSent)}
                disabled={markAsSentDisabled}
                className={`tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 tw-text-[13px] tw-transition-colors
                  ${markAsSentDisabled
                    ? "tw-text-gray-300 tw-cursor-not-allowed"
                    : "hover:tw-bg-gray-100 tw-text-[#374151]"
                  }`}
              >
                {markAsSentLoading ? (
                  <>
                    <i className="icon-Uploading tw-text-[16px] tw-animate-spin"></i>
                    Marking...
                  </>
                ) : (
                  <>
                    <i className="icon-sent tw-text-[16px]"></i>
                    Mark as Sent
                  </>
                )}
              </button>
            )}

            {/* Deactivate / Activate */}
            {showDeactivate && (
              <button
                onClick={() =>
                  !deactivateDisabled && handleAction(onDeactivate)
                }
                disabled={deactivateDisabled}
                className={`tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 tw-text-[13px] tw-transition-colors
                  ${deactivateDisabled
                    ? "tw-text-gray-300 tw-cursor-not-allowed"
                    : "hover:tw-bg-gray-100 tw-text-[#374151]"
                  }`}
              >
                <i className="icon-Deactivate tw-text-[16px]"></i>
                {deactivateLabel}
              </button>
            )}

            {/* Delete */}
            {showDelete && (
              <button
                onClick={() => !deleteDisabled && handleAction(onDelete)}
                disabled={deleteDisabled}
                className={`tw-flex tw-items-center tw-gap-2 tw-w-full tw-px-3 tw-py-2 tw-text-[13px] tw-transition-colors
                  ${deleteDisabled
                    ? "tw-text-gray-300 tw-cursor-not-allowed"
                    : "hover:tw-bg-gray-100 tw-text-[#374151]"
                  }`}
              >
                <i className="icon-Delete tw-text-[16px]"></i>Delete
              </button>
            )}
          </div>
        </DropDownPortal>
      )}
    </>
  );
};

export default ActionMenu;
