
import React from 'react';
import { toast, ToastContainer, Zoom } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
 
const TOAST_CONTAINER_ID = 'my-toast-container';
const TOAST_SUPPRESSION_KEY = 'prexo_toast_suppressed';
 
const CustomToast = ({ type, message, toastId }) => {
  const config = {
    success: {
      icon: "icon-Project-Details",
      iconBg: "#17803d",
      border: "#17803d",
      closeColor: "#9d9898",
    },
    error: {
      icon: "icon-Error",
      iconBg: "#ff4444",
      border: "#ff4444",
      closeColor: "#9d9898",
    },
    warning: {
      icon: "icon-Alert",
      iconBg: " #ff9500",
      border: " #ff9500",
      closeColor: "#9d9898",
    },
    info: {
      icon: "icon-Info",
      iconBg: "#4488ff",
      border: "#4488ff",
      closeColor: "#9d9898",
    },
  };
 
  const { icon, iconBg, border, closeColor } = config[type] || config.info;
 
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "nowrap",
        gap: "12px",
        background: "#fff",
        border: `1.5px solid ${border}`,
        borderRadius: "10px",
        padding: "9px 12px",
        width: "fit-content",
        maxWidth: "100%",
        minWidth: 0,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          width: "25px",
          height: "25px",
          borderRadius: "50%",
          //background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "#fff",
          fontWeight: "bold",
          fontSize: "14px",
        }}
      >
        <i className={icon} style={{ fontSize: "22px", color: iconBg }} />
      </div>
 
      <span style={{ fontSize: "14px", color: "#585858", fontWeight: "500", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {message}
      </span>
 
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <div style={{ width: "1px", height: "33px", background: "#e5e7eb" }} />
        <button
          onClick={() => toast.dismiss(toastId)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "1px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: closeColor,
            fontSize: "15px",
            fontWeight: "bold",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};
 
const ToastNotification = () => {
  return (
    <>
      <style>{`
        .Toastify__toast-container {
          width: fit-content !important;
          max-width: 700px !important;
          z-index: 999999 !important;
        }
        .Toastify__toast {
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          min-height: unset !important;
          overflow: hidden !important;
          white-space: nowrap !important;
          width: fit-content !important;
          max-width: 100% !important;
        }
        .Toastify__toast-body {
          padding: 0 !important;
          margin: 0 !important;
          width: fit-content !important;
          max-width: 100% !important;
          min-width: 0 !important;
          overflow: hidden !important;
          display: flex !important;
          flex-wrap: nowrap !important;
        }
        .Toastify__close-button {
          display: none !important;
        }
        .Toastify__progress-bar {
          display: none !important;
        }
      `}</style>
 
      <ToastContainer
        containerId={TOAST_CONTAINER_ID}
        position="top-right"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        draggable
        pauseOnHover={false}  
        pauseOnFocusLoss={false} 
        theme="light"
        transition={Zoom}
        limit={1}
        style={{ width: "fit-content", maxWidth: "700px", height: "auto", zIndex: 999999 }}
      />
    </>
  );
};
 
const defaultToastOptions = {
  autoClose: 3000, // ✅ number not string
  closeOnClick: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
  draggable: true,
  theme: "light",
  transition: Zoom,
  containerId: TOAST_CONTAINER_ID,
  style: { padding: 0, background: "transparent", boxShadow: "none" },
  icon: false,
  closeButton: false,
};
 
let currentToastId = null;

export const isToastSuppressed = () => {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(TOAST_SUPPRESSION_KEY) === 'true';
};

export const setToastSuppressed = (suppressed) => {
  if (typeof window === 'undefined') return;

  if (suppressed) {
    sessionStorage.setItem(TOAST_SUPPRESSION_KEY, 'true');
    toast.dismiss();
    currentToastId = null;
    return;
  }

  sessionStorage.removeItem(TOAST_SUPPRESSION_KEY);
};
 
export const showToast = (type, message, position = "top-right") => {
  if (isToastSuppressed()) return;

  if (currentToastId && toast.isActive(currentToastId)) {
    toast.dismiss(currentToastId);
  }
 
  const id = Date.now();
  const content = <CustomToast type={type} message={message} toastId={id} />;
  const toastOptions = {
    ...defaultToastOptions,
    position,
    toastId: id,
    autoClose: false, // ✅ disable built-in timer (unreliable with React elements)
  };
 
  switch (type) {
    case 'success':
      currentToastId = toast.success(content, toastOptions);
      break;
    case 'error':
      currentToastId = toast.error(content, toastOptions);
      break;
    case 'warning':
      currentToastId = toast.warning(content, toastOptions);
      break;
    case 'info':
      currentToastId = toast.info(content, toastOptions);
      break;
    default:
      currentToastId = toast(content, toastOptions);
  }
 
  // ✅ Manually dismiss after 3 seconds — guaranteed to work
  setTimeout(() => {
    toast.dismiss(id);
  }, 3000);
};
 
export default ToastNotification;
