import React, { useCallback, useRef, useState, useEffect, useMemo } from "react";
import {
  Upload, Search, FileText, FileType, File as FileIcon,
  CheckCircle2, XCircle, Loader2,
  CloudUpload, X, ChevronDown, Check, AlertCircle,
  Clock3,
} from "lucide-react";
import {
  GetProjectDocuments,
  GetUploadUrl,
  ConfirmUpload,
  DeleteProjectDocument,
  StartAiAnalysis,
} from "../../../../services/techus-services";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import { getDeviceInfo } from "../../../../utils/getDeviceInfo";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import CustomDataTable from "../../../../genriccomponents/ReactTable";
import ActionMenu from "../../../../genriccomponents/ActionMenu";
import NoDataFound from "../../../../genriccomponents/NoDataFound";
import CONFIG from "../../../../config/config";
import RfpHighlightViewer from "../RFPComponents/RfpHighlightViewer";
import DeleteModal from "../../../../genriccomponents/DeleteModal";
import usePermissions from '../../../Common/usePermissions';
import { useSelector } from 'react-redux';
import upgradImg from "../../../../assets/Images/no_data_images/upgrade_1.webp";
import { useEstimation } from "../../../context/EstimationContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_FILES = 15;
// const MAX_FILE_SIZE_MB = 110;
// const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const TYPE_OPTIONS = ["PDF", "DOC", "DOCX", "XLS", "XLSX", "TXT"];
const STATUS_OPTIONS = ["Uploaded", "Processed", "Failed"];
const STATUS_LABEL_TO_CODE = { Uploaded: 1, Processed: 3, Failed: 4 };
const STATUS_LABEL_MAP = { 1: "Uploaded", 2: "Uploaded", 3: "Processed", 4: "Failed" };

// ─── Status Badge (rich pill style) ──────────────────────────────────────────
const STATUS_BADGE_CONFIG = {
  Uploaded: {
    bg: "tw-bg-[#f1f5fd]",
    border: "tw-border-[#c1d4f9]",
    text: "tw-text-[#1740c1]",
    Icon: Clock3,
  },
  Processed: {
    bg: "tw-bg-[#f1fdf4]",
    border: "tw-border-[#c1f9d5]",
    text: "tw-text-[#17803d]",
    Icon: CheckCircle2,
  },
  Failed: {
    bg: "tw-bg-[#fdf1f1]",
    border: "tw-border-[#f9c1c1]",
    text: "tw-text-[#c11717]",
    Icon: AlertCircle,
  },
};

function StatusBadge({ code }) {
  const label = STATUS_LABEL_MAP[Number(code)] || String(code);
  const cfg = STATUS_BADGE_CONFIG[label] || STATUS_BADGE_CONFIG["Uploaded"];
  const { bg, border, text, Icon } = cfg;
  return (
    <span className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-px-3 tw-py-1 tw-rounded-full tw-text-[13px] tw-font-medium tw-border ${bg} ${border} ${text}`}>
      <Icon className="tw-w-3.5 tw-h-3.5" />
      {label}
    </span>
  );
}

const SCROLLBAR_STYLE = `
  .takeoff-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
  .takeoff-scroll::-webkit-scrollbar-track { background: transparent; }
  .takeoff-scroll::-webkit-scrollbar-thumb { background-color: #dee9projectff; border-radius: 99px; }
  .takeoff-scroll { scrollbar-color: #dee9ff transparent; scrollbar-width: thin; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getFileIcon = (type) => {
  const ext = (type || "").toLowerCase();
  if (ext === "pdf") return <FileText className="tw-w-4 tw-h-4 tw-text-red-500" />;
  if (ext === "doc" || ext === "docx") return <FileType className="tw-w-4 tw-h-4 tw-text-blue-500" />;
  if (ext === "txt") return <FileIcon className="tw-w-4 tw-h-4 tw-text-gray-500" />;
  return <FileIcon className="tw-w-4 tw-h-4" />;
};

const formatFileSize = (bytes) => {
  if (!bytes) return "0 Bytes";
  const k = 1024, sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getDocS3Key = (doc) => {
  const project_uuid = localStorage.getItem("project_uuid");
  return `projects/project_${project_uuid}/plan/${doc.document_id}/plan_${doc.document_id}.pdf`;
};

const buildS3Url = (s3Key) => {
  const base = CONFIG.VITE_AWS_ENDPOINT;
  return s3Key.startsWith("http") ? s3Key : `${base}/${s3Key}`;
};

const downloadDocument = async (doc) => {
  const s3Url = buildS3Url(getDocS3Key(doc));
  const fileName = (doc.document_name || "document").replace(/\.pdf$/i, "") + ".pdf";
  try {
    const res = await fetch(s3Url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = new Blob([await res.arrayBuffer()], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl; a.download = fileName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 15_000);
  } catch {
    window.open(s3Url, "_blank", "noopener,noreferrer");
  }
};

// ─── Shared file validation helper ───────────────────────────────────────────
// const validateAndAddFiles = (incoming, existing, onError) => {
//   const validFiles = [];
//   const oversized = [];

//   for (const file of incoming) {
//     if (file.type !== "application/pdf") continue; // silently skip non-PDF (already filtered)
//     if (file.size > MAX_FILE_SIZE_BYTES) {
//       oversized.push(file.name);
//     } else {
//       validFiles.push(file);
//     }
//   }

//   if (oversized.length) {
//     onError(`${oversized.length} file(s) exceed the ${MAX_FILE_SIZE_MB}MB limit: ${oversized.join(", ")}`);
//   }

//   const rem = MAX_FILES - existing.length;
//   if (rem <= 0) {
//     onError(`Maximum ${MAX_FILES} files allowed`);
//     return existing;
//   }

//   const toAdd = validFiles.slice(0, rem);
//   if (validFiles.length > rem) {
//     onError(`Only ${rem} more file${rem > 1 ? "s" : ""} allowed`);
//   }

//   return [...existing, ...toAdd];
// };

// ─── PDF Viewer Modal ─────────────────────────────────────────────────────────
function PDFViewerModal({ doc, onClose }) {
  const s3Key = getDocS3Key(doc);
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-z-[9995] tw-flex tw-items-center tw-justify-center">
      <div
        className="tw-bg-white tw-rounded-2xl tw-flex tw-flex-col tw-overflow-hidden tw-shadow-2xl"
        style={{ width: "85vw", height: "95vh" }}
      >
        <div className="tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-3 tw-border-b tw-border-gray-200 tw-bg-[#f9fafb] tw-flex-shrink-0">
          <div className="tw-flex tw-items-center tw-gap-2">
            <FileText size={15} className="tw-text-red-500 tw-flex-shrink-0" />
            <span className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-truncate tw-max-w-[400px]">
              {doc.document_name || "Document"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="tw-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-rounded-md tw-bg-white tw-border tw-border-gray-300 hover:tw-bg-gray-50 tw-transition-colors"
          >
            <X size={14} className="tw-text-gray-600" />
          </button>
        </div>
        <div className="tw-flex-1 tw-overflow-hidden">
          <RfpHighlightViewer rfpS3Key={s3Key} onError={onClose} />
        </div>
      </div>
    </div>
  );
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────
function FilterDropdown({ options = [], placeholder, onChange, value, width = "tw-w-44" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={`tw-relative ${width}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="tw-w-full tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2
          tw-bg-white tw-border tw-border-[#e0e0e0] tw-rounded-md tw-text-sm
          hover:tw-border-gray-400 tw-transition-all tw-duration-200"
      >
        <span
          className={`tw-truncate tw-tracking-[0.31px] ${value && value !== "all"
            ? "tw-text-[#1e293b]"
            : "tw-text-gray-400"
            }`}
        >
          {value && value !== "all" ? value : placeholder}
        </span>
        <ChevronDown size={16}
          className={`tw-flex-shrink-0 tw-ml-1 tw-text-gray-400 tw-transition-transform tw-duration-200 ${open ? "tw-rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          className="tw-absolute tw-z-50 tw-mt-1 tw-w-full tw-bg-white tw-border tw-border-gray-200 tw-rounded-md tw-shadow-lg tw-py-1"
          style={{ maxHeight: 220, overflowY: "auto" }}
        >
          <button
            onClick={() => { onChange("all"); setOpen(false); }}
            className={`tw-w-full tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-transition-colors
              ${value === "all"
                ? "tw-bg-blue-50 tw-text-blue-600 tw-font-medium"
                : "tw-text-gray-700 hover:tw-bg-gray-50"
              }`}
          >
            <span className="tw-truncate">{placeholder}</span>
            {value === "all" && (
              <Check size={13} className="tw-flex-shrink-0 tw-ml-2 tw-text-blue-500" />
            )}
          </button>
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`tw-w-full tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-transition-colors
                ${value === opt ? "tw-bg-blue-50 tw-text-blue-600 tw-font-medium" : "tw-text-gray-700 hover:tw-bg-gray-50"}`}
            >
              <span className="tw-truncate">{opt}</span>
              {value === opt && <Check size={13} className="tw-flex-shrink-0 tw-ml-2 tw-text-blue-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TakeoffDocuments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [summary, setSummary] = useState({ total: 0, processed: 0, uploaded: 0, failed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingIds, setDeletingIds] = useState({});
  const [allowUpload, setAllowUpload] = useState(false);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgressMap, setUploadProgressMap] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const packageList = useSelector((s) => s?.auth?.user?.[0]?.package_info);
  const { isMarkAsCompleted } = useEstimation();

const planUploadLimit = useMemo(() => {
  const count = packageList?.projects?.children?.proj_files?.children?.plan_doc?.item_count ?? null;
  return count && count > 0 ? count : null;
}, [packageList]);

const [showUpgradeModal, setShowUpgradeModal] = useState(false);
const [upgradeMessage, setUpgradeMessage] = useState("");
  const { permissions, packagePermissions } = usePermissions('plan_file_manager', 'takeoff_engine');
  void packagePermissions; // suppress unused warning, same as RFP does
  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statusCode =
        !statusFilter || statusFilter === "all"
          ? null
          : STATUS_LABEL_TO_CODE[statusFilter];
      const payload = {
        offset: (currentPage - 1) * rowsPerPage,
        limit: rowsPerPage,
        search: searchQuery || "",
        module_type: "plan",
        status: statusCode || null,
        organization_uuid: localStorage.getItem("organization_uuid") || null,
        project_uuid: localStorage.getItem("project_uuid") || null,
      };
      const res = await GetProjectDocuments(payload);
      console.log('plan res', res);
      if (res?.valid) {
        setDocuments(res.data?.documents || []);
        console.log("Document keys:", res.data?.documents?.[0]);
        setAllowUpload(res.allow_upload === true);
        const s = res.data?.summary || {};
        setSummary({
          total: s.total != null ? Number(s.total) : "-",
          processed: s.processed != null ? Number(s.processed) : "-",
          uploaded: s.uploaded != null ? Number(s.uploaded) : "-",
          failed: s.failed != null ? Number(s.failed) : "-",
        });
      } else {
        setError(res?.message || "Failed to fetch documents");
        setDocuments([]);
      }
    } catch {
      setError("Something went wrong while fetching documents.");
      setDocuments([]);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [currentPage, rowsPerPage, searchQuery, statusFilter]);
  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  // Reset page on filter change
  const prevFiltersRef = useRef({ searchQuery, statusFilter, typeFilter, rowsPerPage });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (
      prev.searchQuery !== searchQuery ||
      prev.statusFilter !== statusFilter ||
      prev.typeFilter !== typeFilter ||
      prev.rowsPerPage !== rowsPerPage
    ) {
      setCurrentPage(1);
      prevFiltersRef.current = { searchQuery, statusFilter, typeFilter, rowsPerPage };
    }
  }, [searchQuery, statusFilter, typeFilter, rowsPerPage]);

  const totalNum = Number(summary.total) || 0;
  const totalPages = Math.max(1, Math.ceil(totalNum / rowsPerPage));
  // const showingFrom = totalNum === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  // const showingTo = Math.min(currentPage * rowsPerPage, totalNum);
  const hasActiveFilters = !!(searchQuery || statusFilter || typeFilter);
  const uploadButtonDisabled = isUploading || !allowUpload || isMarkAsCompleted;

  // Client-side type filter applied on top of server results
  const filteredDocuments = useMemo(() => {
    if (!typeFilter || typeFilter === "all") return documents;
    return documents.filter((doc) => {
      const ext = (doc.document_name || "").split(".").pop().toLowerCase();
      return ext === typeFilter.toLowerCase();
    });
  }, [documents, typeFilter]);

  // ─── Upload handlers ──────────────────────────────────────────────────────
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging false if leaving the drop zone entirely (not a child element)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

const handleDrop = useCallback((e) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(false);
  if (isUploading) return;
  const dropped = Array.from(e.dataTransfer.files || []);
  const pdfFiles = dropped.filter(f => f.type === "application/pdf");
  if (!pdfFiles.length) {
    showToast("error", "Only PDF files are allowed");
    return;
  }
  setSelectedFiles(prev => {
    const effectiveMax = planUploadLimit ?? MAX_FILES;
    const alreadyUploaded = documents.length;
    const rem = effectiveMax - prev.length - alreadyUploaded;
    if (rem <= 0) {
      setUpgradeMessage(`Your current package allows up to ${effectiveMax} Plan file${effectiveMax > 1 ? "s" : ""}. You already have ${alreadyUploaded} uploaded. Upgrade your package to upload more.`);
      setShowUpgradeModal(true);
      return prev;
    }
    if (pdfFiles.length > rem) {
      setUpgradeMessage(`Your current package allows up to ${effectiveMax} Plan file${effectiveMax > 1 ? "s" : ""}. You already have ${alreadyUploaded} uploaded. Upgrade your package to upload more.`);
      setShowUpgradeModal(true);
    }
    return [...prev, ...pdfFiles.slice(0, rem)];
  });
}, [isUploading, planUploadLimit, documents.length]);

const handleFileSelect = (e) => {
  if (!e.target.files) return;
  const incoming = Array.from(e.target.files).filter(f => f.type === "application/pdf");
  e.target.value = "";
  setSelectedFiles(prev => {
    const effectiveMax = planUploadLimit ?? MAX_FILES;
    const alreadyUploaded = documents.length;
    const rem = effectiveMax - prev.length - alreadyUploaded;
    if (rem <= 0) {
      setUpgradeMessage(`Your current package allows up to ${effectiveMax} Plan file${effectiveMax > 1 ? "s" : ""}. You already have ${alreadyUploaded} uploaded. Upgrade your package to upload more.`);
      setShowUpgradeModal(true);
      return prev;
    }
    if (incoming.length > rem) {
      setUpgradeMessage(`Your current package allows up to ${effectiveMax} Plan file${effectiveMax > 1 ? "s" : ""}. You already have ${alreadyUploaded} uploaded. Upgrade your package to upload more.`);
      setShowUpgradeModal(true);
    }
    return [...prev, ...incoming.slice(0, rem)];
  });
};

  const removeFile = (index) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));

  const uploadSingleFile = useCallback(async (file) => {
    const organization_uuid = localStorage.getItem("organization_uuid");
    const project_uuid = localStorage.getItem("project_uuid");
    const key = file.name;
    try {
      setUploadProgressMap(p => ({ ...p, [key]: { progress: 0, error: null, done: false } }));
      const urlRes = await GetUploadUrl({ organization_uuid, project_uuid, file_name: file.name, module_type: "PLAN" });
      let urlData = urlRes?.data || urlRes;
      if (typeof urlData === "string") urlData = JSON.parse(urlData);
      if (!urlData?.valid) throw new Error(urlData?.message || "Failed to get upload URL");
      const { document_uuid, upload_url } = urlData.data;

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", upload_url);
        xhr.setRequestHeader("Content-Type", "application/pdf");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable)
            setUploadProgressMap(p => ({ ...p, [key]: { ...p[key], progress: Math.round((e.loaded / e.total) * 90) } }));
        };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Storage upload failed"));
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      const confirmRes = await ConfirmUpload({
        organization_uuid, project_uuid,
        original_file_name: file.name, document_uuid, module_type: "PLAN",
        file_size: String(file.size), is_initial_upload: "N", device_info: getDeviceInfo(),
      });
      let confirmData = confirmRes?.data || confirmRes;
      if (typeof confirmData === "string") confirmData = JSON.parse(confirmData);
      if (!confirmData?.valid) throw new Error(confirmData?.message || "Failed to confirm upload");
      setUploadProgressMap(p => ({ ...p, [key]: { progress: 100, error: null, done: true } }));
    } catch (err) {
      const msg = err.message || "Upload failed";
      setUploadProgressMap(p => ({ ...p, [key]: { progress: 0, error: msg, done: false } }));
      showToast("error", `${file.name}: ${msg}`);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFiles.length) return;
    setIsUploading(true);
    setUploadProgressMap({});
    await Promise.all(selectedFiles.map(f => uploadSingleFile(f)));
    setIsUploading(false);
    showToast("success", "Upload complete");
    setSelectedFiles([]); setUploadProgressMap({}); setIsUploadModalOpen(false);

    setPageLoading(true);
    try {
      const organization_uuid = localStorage.getItem("organization_uuid");
      const project_uuid = localStorage.getItem("project_uuid");
      const analysisRes = await StartAiAnalysis({ organization_uuid, project_uuid });
      let aData = analysisRes?.data || analysisRes;
      if (typeof aData === "string") aData = JSON.parse(aData);
      if (aData?.valid) showToast("success", aData.message);
      else showToast("error", aData?.message);
    } catch (err) { showToast("error", err.message); }

    await fetchDocuments();
    setPageLoading(false);
  }, [selectedFiles, uploadSingleFile, fetchDocuments]);

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDeleteClick = useCallback((doc) => {
    setDeleteTarget(doc);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const organization_uuid = localStorage.getItem("organization_uuid");
    const project_uuid = localStorage.getItem("project_uuid");
    setDeletingIds(p => ({ ...p, [deleteTarget.document_id]: true }));
    setPageLoading(true);
    setDeleteTarget(null);
    try {
      await DeleteProjectDocument({
        organization_uuid, project_uuid,
        document_uuid: deleteTarget.document_id, device_info: getDeviceInfo(),
      });
      showToast("success", "Document deleted");
      await fetchDocuments();
    } catch (err) { showToast("error", err?.message || "Failed to delete document"); }
    finally {
      setDeletingIds(p => { const n = { ...p }; delete n[deleteTarget?.document_id]; return n; });
      setPageLoading(false);
    }
  }, [deleteTarget, fetchDocuments]);

  const handleResetFilters = useCallback(() => { setSearchQuery(""); setStatusFilter(""); setTypeFilter(""); }, []);

  // ─── Columns ──────────────────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      name: "DOCUMENT NAME",
      cell: (row) => (
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-w-8 tw-h-8 tw-rounded-lg tw-bg-red-50 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
            {getFileIcon((row.document_name || "").split(".").pop().toLowerCase())}
          </div>
          <p className="tw-font-[500] tw-text-[14px] tw-text-[#3e3e3e] tw-truncate tw-max-w-[180px]">
            {row.document_name}
          </p>
        </div>
      ),
      sortable: true,
      width: "280px",
    },
    {
      name: "TYPE",
      cell: (row) => {
        const ext = (row.document_name || "").split(".").pop().toLowerCase();
        const label = ext && ext !== row.document_name ? ext.toUpperCase() : "—";
        return (
          <span className="tw-inline-flex tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-[500] tw-bg-gray-100 tw-text-gray-700 tw-font-mono">
            {label}
          </span>
        );
      },
      sortable: true,
    },
    {
      name: "SIZE",
      cell: (row) => <div className="tw-text-[15px] tw-text-[#1e293b]">{formatFileSize(row.size)}</div>,
      sortable: true,
    },
    {
      name: "UPLOADED DATE",
      cell: (row) => (
        <div className="tw-text-[15px] tw-text-[#1e293b]">
          {row.uploaded_date
            ? new Date(row.uploaded_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
            : "—"}
        </div>
      ),
      sortable: true,
    },
    {
      name: "STATUS",
      cell: (row) => <StatusBadge code={row.status} />,
      sortable: true,
    },
    {
      name: "ACTIONS",
      button: true,
      center: true,
      ignoreRowClick: true,
      cell: (row) => {
        const isProcessing = Number(row.status) === 2;
        const isFailed = Number(row.status) === 4;
        const isDeleting = !!deletingIds[row.document_id];

        if (isDeleting) return (
          <div className="tw-flex tw-justify-center">
            <Loader2 className="tw-w-4 tw-h-4 tw-animate-spin tw-text-gray-400" />
          </div>
        );

        return (
          // <ActionMenu
          //   showView={true}
          //   onView={() => setViewingDoc(row)}
          //   viewDisabled={isProcessing || isFailed}

          //   showDownload={true}
          //   onDownload={() => downloadDocument(row)}
          //   downloadDisabled={isProcessing || isFailed}

          //   showEdit={false}

          //   showDelete={true}
          //   onDelete={() => handleDeleteClick(row)}
          //   deleteDisabled={true}
          // />

          <ActionMenu
  showView={permissions?.view}
  onView={() => setViewingDoc(row)}
  viewDisabled={isProcessing || isFailed}

  showDownload={permissions?.download}
  onDownload={() => downloadDocument(row)}
  downloadDisabled={isProcessing || isFailed}

  showEdit={false}

  showDelete={permissions?.delete}
  onDelete={() => handleDeleteClick(row)}
  deleteDisabled={true}
/>
        );
      },
    },
  ], [deletingIds, handleDeleteClick]);

  // ─── Pagination Bar ───────────────────────────────────────────────────────
  function PaginationBar() {
    const pages = [];

    for (let i = 1; i <= totalPages; i++) {
      const page = i;

      const shouldShow =
        page === 1 ||
        page === totalPages ||
        (page >= currentPage - 1 && page <= currentPage + 1);

      const shouldShowLeftEllipsis =
        page === currentPage - 2 && currentPage > 3;

      const shouldShowRightEllipsis =
        page === currentPage + 2 && currentPage < totalPages - 2;

      if (shouldShow) {
        pages.push(page);
      } else if (shouldShowLeftEllipsis || shouldShowRightEllipsis) {
        pages.push("...");
      }
    }

    return (
      <div className="tw-flex tw-justify-end tw-items-center tw-gap-2 tw-py-4 !tw-mt-0">

        {/* Previous */}
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1 || isLoading}
          className={`tw-flex tw-items-center tw-w-[110px] tw-gap-4 tw-px-2 tw-py-2 tw-rounded-md tw-border tw-transition-colors ${currentPage === 1 || isLoading
            ? 'tw-bg-gray-50 tw-text-gray-400 tw-border-gray-200 tw-cursor-not-allowed'
            : 'tw-bg-white tw-text-gray-700 tw-border-gray-300 hover:tw-bg-gray-50'
            }`}
        >
          <i className="icon-Previous tw-text-[16px]" />
          <span className="tw-text-[13px]">Previous</span>
        </button>

        {/* Page numbers */}
        {pages.map((item, idx) =>
          item === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="tw-px-1 tw-text-gray-500"
            >
              ...
            </span>
          ) : (
            <button
              key={idx}
              onClick={() => setCurrentPage(item)}
              className={`tw-w-9 tw-h-9 tw-rounded-md tw-text-sm tw-font-medium tw-border tw-transition-all ${currentPage === item
                ? 'tw-bg-[#48f] tw-text-white tw-rounded-[3px] tw-border-[#48f]'
                : 'tw-bg-white tw-text-gray-600 tw-border-gray-300 hover:tw-bg-gray-50'
                }`}
            >
              {item}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || isLoading}
          className={`tw-flex tw-items-center tw-justify-center tw-gap-6 tw-text-center tw-px-4 tw-py-2 tw-rounded-md tw-border tw-w-[105px] tw-transition-colors ${currentPage === totalPages || isLoading
            ? 'tw-bg-gray-50 tw-text-gray-400 tw-border-gray-200 tw-cursor-not-allowed'
            : 'tw-bg-white tw-text-gray-700 tw-border-gray-300 hover:tw-bg-gray-50'
            }`}
        >
          <span className="tw-text-[13px] tw-pl-6">Next</span>
          <i className="icon-Next tw-text-[16px]" />
        </button>

      </div>
    );
  }
  void error;

  if (isInitialLoad) return <div className="tw-flex-1 tw-overflow-auto tw-p-6"><FullPageLoader /></div>;

  return (
    <div className="tw-flex-1 tw-p-1 tw-overflow-auto">
      <style>{SCROLLBAR_STYLE}</style>
      {pageLoading && <FullPageLoader />}
      {!!deleteTarget && (
        <DeleteModal
          action="delete"
          entity="document"
          icon="icon-Document"
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* PDF Viewer Modal */}
      {viewingDoc && <PDFViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <UploadModalContent
          {...{
            isUploading, selectedFiles, setSelectedFiles, uploadProgressMap,
            isDragging, handleDragOver, handleDragEnter, handleDragLeave, handleDrop,
            fileInputRef, handleFileSelect, removeFile, handleUpload,
          }}
          onClose={() => { setSelectedFiles([]); setUploadProgressMap({}); setIsUploadModalOpen(false); }}
        />
      )}

      <div className="tw-space-y-6">
        {/* Header */}
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">Takeoff Engine</span>
              <i className="icon-Save-and-Continue" />
              <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">Plan File Manager</span>
            </div>
            <p className="tw-text-[#1e293b] tw-text-[14px]">Upload, manage, and track the processing status of all your Plan documents tied to your project.</p>
          </div>
          {/* <UploadButton disabled={uploadButtonDisabled} onClick={() => setIsUploadModalOpen(true)} /> */}
       {permissions?.upload && (
  <UploadButton
    disabled={uploadButtonDisabled}
    isMarkAsCompleted={isMarkAsCompleted}
    onClick={() => setIsUploadModalOpen(true)}
  />
)}
        </div>

        {/* Stats Cards */}
        <div className="tw-grid tw-grid-cols-4 tw-gap-4">
          {[
            { label: "Total Documents", value: summary.total, Icon: FileText, color: "blue" },
            { label: "Processed", value: summary.processed, Icon: CheckCircle2, color: "green" },
            { label: "Uploaded", value: summary.uploaded, Icon: Clock3, color: "blue" },
            { label: "Failed", value: summary.failed, Icon: XCircle, color: "red" },
          ].map(({ label, value, Icon, color }, idx) => {
            const cls = { blue: "tw-bg-blue-50 tw-text-blue-600", green: "tw-bg-green-50 tw-text-green-600", red: "tw-bg-red-50 tw-text-red-600" };
            const textColor = {
              blue: "tw-text-blue-600",
              green: "tw-text-green-600",
              red: "tw-text-red-600",
            };
            return (
              <div key={idx} className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
                <div className="tw-flex tw-items-center tw-justify-between">
                  <div>
                    <p className="tw-text-sm tw-text-gray-600">{label}</p>
                    <p
                      className={`tw-text-2xl tw-font-semibold tw-mt-2 ${textColor[color]
                        }`}
                    >{value || "-"}</p>
                  </div>
                  <div className={`tw-p-3 tw-rounded-lg ${cls[color]}`}>
                    {typeof Icon === "string" ? (
                      <i className={`${Icon} tw-text-xl`} style={{ lineHeight: 1 }} />
                    ) : (
                      <Icon className="tw-w-5 tw-h-5" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Single card: filters + table + pagination ── */}
        <div className="tw-bg-white tw-border tw-border-[#e0e0e0] tw-rounded-[15px] tw-overflow-hidden">

          {/* Filters row */}
          <div className="tw-py-5 tw-px-6 tw-border-b tw-border-[#e0e0e0]">
            <div className="tw-flex tw-items-center tw-gap-3 tw-justify-between">
              {/* Search */}
              <div className="tw-relative tw-flex-1 tw-max-w-md">
                <Search className="tw-absolute tw-left-3 tw-top-1/2 tw--translate-y-1/2 tw-w-4 tw-h-4 tw-text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="tw-min-w-[87%] tw-pl-9 tw-pr-4 tw-py-2 tw-border tw-border-[#e0e0e0] tw-bg-[#f4f4f4] tw-rounded-[5px] tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
                />
              </div>

              {/* Right side controls */}
              <div className="tw-flex tw-items-center tw-gap-3">
                <FilterDropdown
                  options={TYPE_OPTIONS}
                  value={typeFilter}
                  placeholder="All Types"
                  onChange={v => setTypeFilter(v)}
                  width="tw-w-[150px]"
                />
                <FilterDropdown
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  placeholder="All Status"
                  onChange={v => setStatusFilter(v)}
                  width="tw-w-[180px]"
                />
                <div className="tw-flex tw-items-center tw-gap-2">
                  <span className="tw-text-sm tw-text-gray-500 tw-whitespace-nowrap">Show:</span>
                  <div className="tw-relative tw-w-[80px]">
                    <select
                      value={rowsPerPage}
                      onChange={(e) => setRowsPerPage(Number(e.target.value))}
                      className="tw-w-full tw-appearance-none tw-pl-3 tw-pr-7 tw-py-2 tw-border tw-border-[#e0e0e0] tw-bg-white tw-rounded-md tw-text-sm tw-text-[#1e293b] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
                    >
                      {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <ChevronDown size={14} className="tw-pointer-events-none tw-absolute tw-right-2 tw-top-1/2 tw--translate-y-1/2 tw-text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="project-table">
            <CustomDataTable
              columns={columns}
              data={filteredDocuments}
              enablePagination={false}
              customStyles={{
                headRow: {
                  style: {
                    backgroundColor: "#ffffff",
                    borderBottom: "1px solid #edf2f7",
                    minHeight: "56px",
                  },
                },
                headCells: {
                  style: {
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#6e7178",
                    textTransform: "uppercase",
                    paddingLeft: "20px",
                    paddingRight: "20px",
                  },
                },
                rows: {
                  style: {
                    minHeight: '58px',
                    borderBottom: '1px solid #EAECF0',
                    transition: 'background-color 0.15s ease',
                    '&:last-of-type': { borderBottom: 'none' },
                    '&:hover': {
                      backgroundColor: '#f8faff',
                      cursor: 'pointer',
                    },
                  },
                },
                cells: {
                  style: {
                    fontSize: "14px",
                    color: "#4a5568",
                    paddingLeft: "20px",
                    paddingRight: "20px",
                  },
                },
              }}
              noDataComponent={
                <NoDataFound
                  description={hasActiveFilters ? "No documents match your filters." : "No documents found. Upload your first plan document to get started."}
                  buttonLabel={hasActiveFilters ? "Clear Filters" : undefined}
                  btnColor="#0140c1"
                  onReset={hasActiveFilters ? handleResetFilters : undefined}
                />
              }
            />
          </div>

          {/* Pagination */}

        </div>
        <PaginationBar />
      </div>
      {showUpgradeModal && (
  <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-z-[9999] tw-flex tw-items-center tw-justify-center">
    <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-[750px] tw-h-[569px] tw-px-[74px] tw-pt-[69px] tw-pb-10 tw-relative tw-text-center">
      <button
        onClick={() => setShowUpgradeModal(false)}
        className="tw-absolute tw-top-4 tw-right-4 tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-gray-200 tw-text-gray-400 hover:tw-text-gray-600 hover:tw-bg-gray-50 tw-transition-colors"
      >
        <i className="icon-Close tw-text-[14px]"></i>
      </button>
      <h2 className="tw-text-[30px] tw-font-bold tw-text-[#000000] tw-mb-8 tw-leading-snug">
        Unlock More with an Upgrade!
      </h2>
      <div className="tw-flex tw-justify-center tw-mb-4">
        <div className="tw-relative tw-w-[200px] tw-h-[175px] tw-flex tw-items-center tw-justify-center">
          <div className="tw-flex tw-justify-center tw-mb-6">
            <img src={upgradImg} alt="Upgrade" className="tw-w-36 tw-h-36 tw-object-contain" />
          </div>
        </div>
      </div>
      <p className="tw-text-[18px] tw-text-black tw-mb-8 tw-leading-normal tw-px-2">
        {upgradeMessage}
      </p>
      <button
        onClick={() => setShowUpgradeModal(false)}
        className="tw-w-[318px] tw-h-[48px] tw-py-3 tw-rounded-xl tw-text-white tw-text-[16px] tw-font-medium tw-transition-all tw-duration-200 hover:tw-opacity-90 hover:tw-shadow-lg"
        style={{ background: "#0140c1" }}
      >
        Upgrade Your Package
      </button>
    </div>
  </div>
)}
    </div>
  );
}

// ─── Upload Button ────────────────────────────────────────────────────────────
function UploadButton({ disabled, onClick, isMarkAsCompleted }) {
  return (
    <button
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      title={
        isMarkAsCompleted
          ? "Project is marked as complete"
          : disabled
            ? "Upload disabled while documents are processing"
            : ""
      }
      style={{ backgroundColor: disabled ? "#94a3b8" : "#0140c1" }}
      className="tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-rounded-md tw-transition-opacity tw-flex tw-items-center tw-gap-2 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
    >
      <Upload className="tw-w-4 tw-h-4" /> Upload Document
    </button>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModalContent({
  isUploading, selectedFiles, uploadProgressMap,
  isDragging, handleDragOver, handleDragEnter, handleDragLeave, handleDrop,
  fileInputRef, handleFileSelect, removeFile, handleUpload, onClose,
}) {
  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-z-50 tw-flex tw-items-center tw-justify-center">
      <div className="tw-bg-white tw-rounded-lg tw-max-w-lg tw-w-full tw-mx-4 tw-shadow-lg">
        <div className="tw-border-b tw-px-6 tw-py-4">
          <div className="tw-flex tw-items-center tw-gap-2">
            {isUploading
              ? <Loader2 className="tw-w-5 tw-h-5 tw-text-blue-600 tw-animate-spin" />
              : <Upload className="tw-w-5 tw-h-5 tw-text-blue-600" />}
            <h2 className="tw-text-lg tw-font-semibold">{isUploading ? "Uploading..." : "Upload Documents"}</h2>
          </div>
          <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
            {isUploading ? "Please wait while your files are being uploaded" : "Drag and drop files or browse to upload your plan documents"}
          </p>
        </div>

        <div className="tw-p-6 tw-space-y-4">
          {/* ── Drop zone ── */}
          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`tw-border-2 tw-border-dashed tw-rounded-lg tw-p-8 tw-text-center tw-transition-all tw-cursor-pointer
              ${isDragging ? "tw-border-blue-600 tw-bg-blue-50" : "tw-border-gray-300 hover:tw-border-blue-400 hover:tw-bg-gray-50"}
              ${isUploading ? "tw-pointer-events-none tw-opacity-50" : ""}`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept=".pdf,application/pdf"
              className="tw-hidden"
            />
            <CloudUpload className={`tw-w-12 tw-h-12 tw-mx-auto tw-mb-4 ${isDragging ? "tw-text-blue-600" : "tw-text-gray-400"}`} />
            <p className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              {isDragging ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="tw-text-xs tw-text-gray-500 tw-mb-3">or</p>
            <button
              type="button"
              disabled={isUploading || selectedFiles.length >= MAX_FILES}
              onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-border tw-border-gray-300 tw-rounded-md hover:tw-bg-gray-50 tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
            >
              Browse Files
            </button>
            {/* ── Updated limits text ── */}
            <p className="tw-text-xs tw-text-gray-500 tw-mt-3">
              {/* PDF only · Max {MAX_FILES} files · {MAX_FILE_SIZE_MB}MB each */}
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="tw-space-y-2 tw-max-h-40 tw-overflow-y-auto">
              {/* <p className="tw-text-sm tw-font-medium tw-text-gray-700">
                Selected Files ({selectedFiles.length}/{MAX_FILES})
              </p> */}
              <p className="tw-text-sm tw-font-medium tw-text-gray-700">
                Selected Files 
              </p>
              {selectedFiles.map((file, index) => {
                const prog = uploadProgressMap[file.name];
                return (
                  <div key={index} className="tw-flex tw-items-center tw-justify-between tw-p-2 tw-bg-gray-100 tw-rounded-md">
                    <div className="tw-flex tw-items-center tw-gap-2 tw-min-w-0 tw-flex-1">
                      <FileText className="tw-w-4 tw-h-4 tw-text-blue-600 tw-flex-shrink-0" />
                      <span className="tw-text-sm tw-truncate">{file.name}</span>
                      <span className="tw-text-xs tw-text-gray-600 tw-flex-shrink-0">({formatFileSize(file.size)})</span>
                    </div>
                    <div className="tw-flex tw-items-center tw-gap-2 tw-ml-2 tw-flex-shrink-0">
                      {prog
                        ? prog.error
                          ? <span className="tw-text-xs tw-text-red-500">{prog.error}</span>
                          : prog.done
                            ? <CheckCircle2 className="tw-w-4 tw-h-4 tw-text-green-500" />
                            : <span className="tw-text-xs tw-text-blue-600">{prog.progress}%</span>
                        : (
                          <button
                            disabled={isUploading}
                            onClick={() => removeFile(index)}
                            className="tw-p-1 hover:tw-bg-gray-200 tw-rounded tw-transition-colors disabled:tw-opacity-40"
                          >
                            <X className="tw-w-3 tw-h-3" />
                          </button>
                        )
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="tw-flex tw-justify-end tw-gap-2 tw-p-6 tw-border-t">
          <button
            disabled={isUploading}
            onClick={onClose}
            className="tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-border tw-border-gray-300 tw-bg-gray-200 tw-rounded-md hover:tw-bg-gray-50 tw-transition-colors disabled:tw-opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFiles.length || isUploading}
            className="tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-bg-blue-600 tw-rounded-md hover:tw-bg-blue-700 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-transition-colors tw-flex tw-items-center tw-gap-2"
          >
            {isUploading ? <Loader2 className="tw-w-4 tw-h-4 tw-animate-spin" /> : <Upload className="tw-w-4 tw-h-4" />}
            {isUploading ? "Uploading..." : `Upload${selectedFiles.length ? ` (${selectedFiles.length})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
