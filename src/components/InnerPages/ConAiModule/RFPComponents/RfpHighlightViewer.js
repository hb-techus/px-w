// import React, { useState, useEffect, useRef } from "react";
// import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
// import CONFIG from "../../../../config/config";
// import { decryptJSONHandler } from "../../../../utils/techus-SecureServiceUtils";
// import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
// import { useLocation } from "react-router-dom";

// /**
//  * Fetches the encrypted PDF response from the backend, decrypts it,
//  * and converts the Node.js Buffer { type: "Buffer", data: [...] }
//  * directly into an ArrayBuffer.
//  */
// const fetchPdfArrayBuffer = async (s3Key) => {
//   const location = useLocation();
// const isAdminPortal = location.pathname.startsWith('/admin')

//   const token = localStorage.getItem(
//     isAdminPortal
//       ? 'prexo_admin_access_token'
//       : 'prexo_organization_access_token'
//   )
  
//   const url = `${CONFIG.VITE_API_URL}/project/get-pdf-stream?s3_key=${encodeURIComponent(s3Key)}`;

//   const response = await fetch(url, {
//     method: "GET",
//     headers: {
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     },
//   });

//   if (!response.ok) {
//     throw new Error(`PDF fetch failed: ${response.status} ${response.statusText}`);
//   }

//   const json = await response.json();

//   if (!json?.edata) {
//     throw new Error("No PDF available for this item.");
//   }

//   // Decrypt — returns { type: "Buffer", data: [37, 80, 68, 70, ...] }
//   let decrypted;
//   try {
//     decrypted = decryptJSONHandler(json);
//   } catch {
//     decrypted = decryptJSONHandler(json.edata);
//   }

//   // Handle Node.js serialized Buffer: { type: "Buffer", data: [byte, byte, ...] }
//   if (decrypted?.type === "Buffer" && Array.isArray(decrypted?.data)) {
//     return new Uint8Array(decrypted.data).buffer;
//   }

//   // Fallback: plain number array
//   if (Array.isArray(decrypted)) {
//     return new Uint8Array(decrypted).buffer;
//   }

//   // Fallback: base64 string
//   if (typeof decrypted === "string") {
//     const binary = atob(decrypted);
//     const bytes = new Uint8Array(binary.length);
//     for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
//     return bytes.buffer;
//   }

//   throw new Error(`Unrecognised decrypted format: ${typeof decrypted}`);
// };

// // ─── Main Component ───────────────────────────────────────────────────────────
// export default function PdfHighlightViewer({
//   rfpS3Key,
//   onError, // optional callback — parent can close the panel on error
// }) {
//   const [blobUrl,    setBlobUrl]    = useState(null);
//   const [urlLoading, setUrlLoading] = useState(false);
//   const [urlError,   setUrlError]   = useState(null);

//   const prevBlobUrl = useRef(null);

//   // ── Fetch + decrypt → create blob URL ────────────────────────────────────
//   useEffect(() => {
//     if (!rfpS3Key) return;
//     let cancelled = false;

//     const load = async () => {
//       try {
//         setUrlLoading(true);
//         setUrlError(null);
//         setBlobUrl(null);

//         // Revoke previous blob URL to free memory
//         if (prevBlobUrl.current) {
//           URL.revokeObjectURL(prevBlobUrl.current);
//           prevBlobUrl.current = null;
//         }

//         const arrayBuffer = await fetchPdfArrayBuffer(rfpS3Key);
//         if (cancelled) return;

//         const blob = new Blob([arrayBuffer], { type: "application/pdf" });
//         const url  = URL.createObjectURL(blob);
//         prevBlobUrl.current = url;
//         setBlobUrl(url);

//       } catch (err) {
//         if (!cancelled) {
//           console.error("PdfHighlightViewer:", err);
//           showToast("error", err?.message || "Failed to load PDF. Please try again.");
//           setUrlError(err?.message || "Failed to load PDF.");
//           onError?.();
//         }
//       } finally {
//         if (!cancelled) setUrlLoading(false);
//       }
//     };

//     load();

//     return () => {
//       cancelled = true;
//     };
//   }, [rfpS3Key]);

//   // ── Cleanup blob URL on unmount ───────────────────────────────────────────
//   useEffect(() => {
//     return () => {
//       if (prevBlobUrl.current) {
//         URL.revokeObjectURL(prevBlobUrl.current);
//         prevBlobUrl.current = null;
//       }
//     };
//   }, []);

//   // ── Guards ────────────────────────────────────────────────────────────────
//   if (!rfpS3Key) {
//     return (
//       <div className="tw-flex tw-items-center tw-justify-center tw-h-full tw-bg-gray-100">
//         <p className="tw-text-gray-500">No PDF available</p>
//       </div>
//     );
//   }

//   if (urlLoading) return <FullPageLoader />;

//   if (urlError) return null;

//   if (!blobUrl) return null;

//   // ── Render — iframe with blob URL ────────────────────────────────────────
//   return (
//     <div className="tw-h-full tw-w-full tw-overflow-hidden tw-bg-gray-100">
//       <iframe
//         src={blobUrl}
//         title="PDF Viewer"
//         className="tw-w-full tw-h-full tw-border-0"
//       />
//     </div>
//   );
// }

import React, { useState, useEffect, useRef } from "react";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import CONFIG from "../../../../config/config";
import { decryptJSONHandler } from "../../../../utils/techus-SecureServiceUtils";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import { useLocation } from "react-router-dom";

/**
 * Fetches the encrypted PDF response from the backend, decrypts it,
 * and converts the Node.js Buffer { type: "Buffer", data: [...] }
 * directly into an ArrayBuffer.
 */
const fetchPdfArrayBuffer = async (s3Key, isAdminPortal) => {
  const token = localStorage.getItem(
    isAdminPortal
      ? "prexo_admin_access_token"
      : "prexo_organization_access_token"
  );

  const url = `${CONFIG.VITE_API_URL}/project/get-pdf-stream?s3_key=${encodeURIComponent(
    s3Key
  )}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`PDF fetch failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (!json?.edata) {
    throw new Error("No PDF available for this item.");
  }

  let decrypted;
  try {
    decrypted = decryptJSONHandler(json);
  } catch {
    decrypted = decryptJSONHandler(json.edata);
  }

  if (decrypted?.type === "Buffer" && Array.isArray(decrypted?.data)) {
    return new Uint8Array(decrypted.data).buffer;
  }

  if (Array.isArray(decrypted)) {
    return new Uint8Array(decrypted).buffer;
  }

  if (typeof decrypted === "string") {
    const binary = atob(decrypted);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  throw new Error(`Unrecognised decrypted format: ${typeof decrypted}`);
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PdfHighlightViewer({
  rfpS3Key,
  onError,
}) {
  const location = useLocation();
  const isAdminPortal = location.pathname.startsWith("/admin");

  const [blobUrl, setBlobUrl] = useState(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState(null);

  const prevBlobUrl = useRef(null);

  useEffect(() => {
    if (!rfpS3Key) return;
    let cancelled = false;

    const load = async () => {
      try {
        setUrlLoading(true);
        setUrlError(null);
        setBlobUrl(null);

        if (prevBlobUrl.current) {
          URL.revokeObjectURL(prevBlobUrl.current);
          prevBlobUrl.current = null;
        }

        const arrayBuffer = await fetchPdfArrayBuffer(rfpS3Key, isAdminPortal);
        if (cancelled) return;

        const blob = new Blob([arrayBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        prevBlobUrl.current = url;
        setBlobUrl(url);
      } catch (err) {
        if (!cancelled) {
          console.error("PdfHighlightViewer:", err);
          showToast(
            "error",
            err?.message || "Failed to load PDF. Please try again."
          );
          setUrlError(err?.message || "Failed to load PDF.");
          onError?.();
        }
      } finally {
        if (!cancelled) setUrlLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [rfpS3Key, isAdminPortal, onError]);

  useEffect(() => {
    return () => {
      if (prevBlobUrl.current) {
        URL.revokeObjectURL(prevBlobUrl.current);
        prevBlobUrl.current = null;
      }
    };
  }, []);

  if (!rfpS3Key) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-full tw-bg-gray-100">
        <p className="tw-text-gray-500">No PDF available</p>
      </div>
    );
  }

  if (urlLoading) return <FullPageLoader />;
  if (urlError) return null;
  if (!blobUrl) return null;

  return (
    <div className="tw-h-full tw-w-full tw-overflow-hidden tw-bg-gray-100">
      <iframe
        src={blobUrl}
        title="PDF Viewer"
        className="tw-w-full tw-h-full tw-border-0"
      />
    </div>
  );
}