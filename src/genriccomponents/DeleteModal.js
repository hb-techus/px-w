import React, { useState, useMemo } from "react";

const DeleteModal = ({
  action = "delete",
  entity = "package",
  status = "Active",
  subscriptionCount = 0,
  activeCount = 0,
  inactiveCount = 0,
  icon = "",
  onClose,
  onConfirm,
  skipVerification = false,
}) => {
  const [value, setValue] = useState("");

  const isDelete = action === "delete";
  const isUpdate = action === "update";
  const hasSubscriptions = Number(subscriptionCount) > 0;

  // ─── Dynamic Content ─────────────────────────────────────────────
  const { title, message } = useMemo(() => {
    // USER
   // USER
if (entity === "user") {
  if (action === "deactivate") {     
    const isActive = status === "Active";
    return {
      title: `${isActive ? "Deactivate" : "Activate"} User`,
      message: `Are you sure you want to ${isActive ? "deactivate" : "activate"} this user?${
        isActive ? " They will no longer be able to log in." : ""
      }`,
    };
  }

  // default → delete
  return {
    title: "Delete User",
    message:
      "Are you sure you want to delete this user? This action will revoke all access for this user.",
  };
}
  if(entity==='Send Deletion Request'){
    if(action==='delete'){
      return {
        title:'Confirm Account Deletion',
        message:'This action is irreversible. All your data, projects, and settings will be permanently deleted.'

      }
    }
  }
    // PACKAGE
    if (entity === "package") {
      if (isDelete) {
        if (hasSubscriptions) {
          return {
            title: "Delete Package",
            message: `There are ${subscriptionCount} subscription(s) associated with this package (${activeCount} active, ${inactiveCount} inactive). 
Deleting this package will not remove existing subscriptions but will prevent new assignments.`,
          };
        }
        return {
          title: "Delete Package",
          message:
            "Are you sure you want to delete this package? This action can be reversed later.",
        };
      }

      if (isUpdate) {
        if (hasSubscriptions) {
          return {
            title: "Update Package",
            message: `There are ${subscriptionCount} subscription(s) associated with this package. Updating this package will affect existing subscriptions.`,
          };
        }
        return {
          title: "Update Package",
          message: "Updating this package will change its configuration.",
        };
      }
    }

    if (entity === "organization") {
      if (isDelete) {
        if (hasSubscriptions) {
          return {
            title: "Delete Organization",
            message: `This Organization is currently in ${status} stage. There are ${subscriptionCount} project(s) associated with this Organization.\n\nWould you really like to delete it?`,
          };
        }
        return {
          title: "Delete Organization",
          message: "Are you sure you want to delete this organization?",
        };
      }
      if (isUpdate) {
        return {
          title: "Update Organization",
          message:
            "Updating the organization's package will result in billing based on the newly assigned package. Are you sure you want to proceed?",
        };
      }
    }
  if (entity === "role") {
  if (isDelete) {
    if (hasSubscriptions) {
      return {
        title: "Delete Role",
        message: `This role cannot be deleted because one or more users are currently assigned to it. Please unassign all users from this role before deleting it.`,
      };
    }
    return {
      title: "Delete Role",
      message: "Are you sure you want to delete this role?",
    };
  }
}

    if (entity === "role" && action === "deactivate") {
  const isActive = status === "Active";
  return {
    title: `${isActive ? "Deactivate" : "Activate"} Role`,
    message: `Are you sure you want to ${isActive ? "deactivate" : "activate"} this role?`,
  };
  
}
    if (entity === "member") {
  if (isDelete) {
    return {
      title: "Delete Member?",
      message:
        "This member is going to be deleted and if it's linked to a Crew then it will be removed from there as well, and we will share this member's effort percentage with the other crew members.",
    };
  }
  if (isUpdate) {
    return {
      title: "Edit Member",
      message:
        "Updating the member details will apply changes to their linked crew assignments. Are you sure you want to proceed?",
    };
  }
}

    if (entity === "product") {
  if (isDelete) {
    return {
      title: "Delete Product",
      message: "This product will be permanently deleted.",
    };
  }
  if (isUpdate) {
    return {
      title: "Edit Product",
      message:
        "Updating the product details will apply to newly created projects or when estimations are recalculated. Are you sure you want to proceed?",
    };
  }
}

    if (entity === "labor cost") {
  if (isUpdate) {
    return {
      title: "Edit Labor Cost",
      message:
        "Updating the labor cost details will apply to newly created projects or when estimations are recalculated. Are you sure you want to proceed?",
    };
  }
}

    if (entity === "document") {
  if (isDelete) {
    return {
      title: "Delete Document",
      message:
        "Are you sure you want to delete this document? This document will no longer be available for AI reference. Any AI responses that previously referenced this document may be affected.",
    };
  }
}
if (entity === "proposal") {
  if (isDelete) {
    return {
      title: "Delete Proposal",
      message:
        "Are you sure you want to delete this Proposal?\nAll generated content will be archived.",
    };
  }
}
if (entity === "RFI") {
  if (isDelete) {
    return {
      title: "Delete RFI",
      message:
        "Are you sure you want to delete this RFI Drafter? This action cannot be undone.",
    };
  }
}
if (entity === "bid") {
  if (isDelete) {
    return {
      title: "Delete Bid",
      message:
        "Are you sure you want to delete this Bid Invite? All generated content will be archived.",
    };
  }
}
if (entity === "clause") {
  if (isDelete) {
    return {
      title: "Delete Clause Assist",
      message:
        "Are you sure you want to delete this Clause Assist? This action cannot be undone.",
    };
  }
}
if (entity === "healthchecker") {
  if (isDelete) {
    return {
      title: "Delete Contract Audit",
      message:
        "Are you sure you want to delete this Contract Audit? This action cannot be undone.",
    };
  }
}
if (entity === "project") {
  if (isDelete) {
    return {
      title: "Delete Project",
      message:
        "Are you sure you want to delete this project?\nAll associated data including AI analysis, Takeoff, Estimation, and Contract drafts will be archived.\nThis action can be reversed by an administrator only.",
    };
  }
}
if (entity === "document") {
  if (isDelete) {
    return {
      title: "Delete Document",
      message:
        "This is the only RFP document for this project. Deleting it will remove all referenced information, and \"View in PDF\" links across Bid Intelligence modules will no longer work. Please proceed with extreme caution. Are you sure you want to continue?",
    };
  }
}
    if (entity === "estimation") {
      if (isDelete) {
        const n = Number(subscriptionCount);
        return {
          title: `Delete ${n} Item${n !== 1 ? "s" : ""}?`,
          message:
            "This permanently removes the selected line items from your estimate. This action cannot be undone.",
        };
      }
    }

    return { title: "", message: "" };
  }, [entity, action, subscriptionCount, activeCount, inactiveCount]);

 
  const isRoleWithUsers = entity === "role" && isDelete && hasSubscriptions;
const showVerification = isDelete && !isRoleWithUsers && !skipVerification;
const isValid = !showVerification || value === "DELETE";

 const buttonText =
  entity === "Send Deletion Request"
    ? `Yes , ${entity.charAt(0).toUpperCase() + entity.slice(1)}`
    : action === "deactivate"
    ? `Yes, ${status === "Active" ? "Deactivate" : "Activate"} ${entity.charAt(0).toUpperCase() + entity.slice(1)}`
    : isDelete
    ? `Yes, Delete ${entity.charAt(0).toUpperCase() + entity.slice(1)}`
    : `Yes, Update ${entity.charAt(0).toUpperCase() + entity.slice(1)}`

  // ─── UI ─────────────────────────────────────────────────────────
  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-items-center tw-justify-center tw-z-50">
      <div className="tw-relative tw-bg-white tw-w-[420px] tw-rounded-xl tw-shadow-xl tw-p-8 tw-text-center">
        {/* Close */}
        <button
          onClick={onClose}
          className="tw-absolute tw-right-4 tw-top-4 tw-text-gray-400 hover:tw-text-gray-600"
        >
          <i className="icon-Failed tw-text-[27px]"></i>
        </button>

        {/* Icon */}
        <div className="tw-flex tw-justify-center tw-mb-6">
          <div className="tw-relative">
            <div className="tw-w-[80px] tw-h-[80px] tw-bg-[linear-gradient(135deg,#ffdede,#ffe9d2)] tw-rounded-full tw-flex tw-items-center tw-justify-center">
              <div className="tw-w-[60px] tw-h-[60px] tw-bg-[linear-gradient(135deg,#ffc9c9,#ffd6a8)] tw-rounded-full tw-flex tw-items-center tw-justify-center">
                <i className={`${icon} tw-text-[40px] tw-text-[#e7000b]`} />
              </div>
            </div>
            <span className="tw-absolute tw-left-[-12px] tw-bottom-[-7px] tw-w-4 tw-h-4 tw-bg-[linear-gradient(135deg,#ffc9c9,#ffd6a8)] tw-rounded-full"></span>
          </div>
        </div>

        {/* Title */}
        <h2 className="tw-text-lg tw-font-semibold tw-mb-2">{title}</h2>

        {/* Message */}
        <p className="tw-text-[14px] tw-text-[#000] tw-mb-6">{message}</p>

        {/* Verification */}
        {showVerification && (
          <>
            <p className="tw-text-[14px] tw-mb-2">
              Type <span className="tw-font-semibold">DELETE</span> to confirm
            </p>

            <input
              type="text"
              value={value}
              onKeyDown={(e)=>e.key==='Enter'&&isValid?onConfirm():null}
              onChange={(e) => setValue(e.target.value.toUpperCase())}
              className="tw-w-full  tw-border tw-border-[#e0e0e0] tw-rounded-[5px] tw-py-2 tw-text-center tw-mb-4 tw-outline-none focus:tw-border-gray-400"
            />
          </>
        )}

        {/* Button */}
        {/* <button
          disabled={!isValid}
          onClick={onConfirm}
          className={`tw-w-full tw-rounded-md tw-py-3 tw-font-semibold tw-text-white
            ${
              isValid
                ? "tw-bg-red-500 hover:tw-bg-red-600"
                : "tw-bg-red-300 tw-cursor-not-allowed"
            }`}
        >
          {buttonText}
        </button> */}
        {!isRoleWithUsers && (
  <button
    disabled={!isValid}
    onClick={onConfirm}
    className={`tw-w-full tw-rounded-md tw-py-3 tw-font-semibold tw-text-white
      ${isValid ? "tw-bg-red-500 hover:tw-bg-red-600" : "tw-bg-red-300 tw-cursor-not-allowed"}`}
  >
    {buttonText}
  </button>
)}
      </div>
    </div>
  );
};

export default DeleteModal;
