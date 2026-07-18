import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { FileText, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  GetClauseSuggesterRFP,
  CheckExistsSuggester,
  GetCompanyUploadedUrl,
  AddUploadDoc,
  GetOneOrganization,
  GetOnePackage,
} from "../../../../services/techus-services";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import { countAccess } from "../../../../services/techus-services";
import upgradImg from "/src/assets/Images/no_data_images/upgrade_1.webp";
import ContractLoader from "/src/assets/Images/pdf_images/contract_upload.webp";
import usePermissions, { resolvePackageEnabled } from "../../../Common/usePermissions";


// ── Package limit helpers ──────────────────────────────────────────────────
const CUSTOM_INPUT_LIMIT_KEYS = ["txt", "custom_input", "custom", "text_input"];
const PDF_UPLOAD_LIMIT_KEYS = ["pdf", "custom_file_upload", "file_upload", "upload_pdf"];

const getPositiveCount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getNodeCount = (node) => {
  if (!node || typeof node !== "object") return null;
  for (const field of [node.item_count, node.count, node.word_count, node.words_count, node.limit, node.max_count, node.value]) {
    const count = getPositiveCount(field);
    if (count) return count;
  }
  return null;
};

const looksLikeCustomInputNode = (key, node) => {
  const normalizedKey = String(key || "").toLowerCase();
  if (CUSTOM_INPUT_LIMIT_KEYS.includes(normalizedKey)) return true;
  const text = [node?.name, node?.label, node?.title, node?.display_text_2, node?.sub_module_name].filter(Boolean).join(" ").toLowerCase();
  return text.includes("custom input") || text.includes("text input") || text.includes("word");
};

const findCustomInputLimit = (node) => {
  if (!node || typeof node !== "object") return null;
  for (const key of CUSTOM_INPUT_LIMIT_KEYS) {
    const directCount = getNodeCount(node?.children?.[key] || node?.[key]);
    if (directCount) return directCount;
  }
  const entries = node?.children && typeof node.children === "object" ? Object.entries(node.children) : Object.entries(node);
  for (const [key, value] of entries) {
    if (!value || typeof value !== "object") continue;
    if (looksLikeCustomInputNode(key, value)) { const c = getNodeCount(value); if (c) return c; }
    const nested = findCustomInputLimit(value);
    if (nested) return nested;
  }
  return null;
};

const looksLikePdfUploadNode = (key, node) => {
  const normalizedKey = String(key || "").toLowerCase();
  if (PDF_UPLOAD_LIMIT_KEYS.includes(normalizedKey)) return true;
  const text = [node?.name, node?.label, node?.title, node?.display_text_2, node?.sub_module_name].filter(Boolean).join(" ").toLowerCase();
  return text.includes("custom file upload") || text.includes("upload pdf") || text.includes("file count");
};

const findPdfUploadLimit = (node) => {
  if (!node || typeof node !== "object") return null;
  for (const key of PDF_UPLOAD_LIMIT_KEYS) {
    const directCount = getNodeCount(node?.children?.[key] || node?.[key]);
    if (directCount) return directCount;
  }
  const entries = node?.children && typeof node.children === "object" ? Object.entries(node.children) : Object.entries(node);
  for (const [key, value] of entries) {
    if (!value || typeof value !== "object") continue;
    if (looksLikePdfUploadNode(key, value)) { const c = getNodeCount(value); if (c) return c; }
    const nested = findPdfUploadLimit(value);
    if (nested) return nested;
  }
  return null;
};

const getClauseAssistCustomInputLimit = (packageList) => {
  const node = packageList?.contract_command?.children?.clause_assist?.children?.clause_input;
  return getNodeCount(node) ?? findCustomInputLimit(packageList?.contract_command?.children?.clause_assist);
};

const getClauseAssistPdfUploadLimit = (packageList) => {
  const node = packageList?.contract_command?.children?.clause_assist?.children?.clause_file;
  return getNodeCount(node) ?? findPdfUploadLimit(packageList?.contract_command?.children?.clause_assist);
};

const normalizeText = (value = "") => String(value).trim().toLowerCase();
const hasChildren = (node) => {
  if (!node || typeof node !== "object") return false;
  if (Array.isArray(node.children)) return node.children.length > 0;
  if (node.children && typeof node.children === "object") return Object.keys(node.children).length > 0;
  return false;
};

const findFeatureNode = (node, predicate) => {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const item of node) { const m = findFeatureNode(item, predicate); if (m) return m; }
    return null;
  }
  if (typeof node !== "object") return null;
  if (predicate(node)) return node;
  if (Array.isArray(node.children)) {
    for (const child of node.children) { const m = findFeatureNode(child, predicate); if (m) return m; }
  } else if (node.children && typeof node.children === "object") {
    for (const child of Object.values(node.children)) { const m = findFeatureNode(child, predicate); if (m) return m; }
  }
  return null;
};

const getClauseAssistCustomInputLimitFromPackageDetail = (packageDetail) => {
  const root = findFeatureNode(packageDetail?.features, (node) => normalizeText(node?.name) === "clause assist" && hasChildren(node));
  if (!root) return null;
  const node = findFeatureNode(root, (n) => normalizeText(n?.name).includes("custom input") || normalizeText(n?.display_text_2).includes("word"));
  return getNodeCount(node);
};

const getClauseAssistPdfUploadLimitFromPackageDetail = (packageDetail) => {
  const root = findFeatureNode(packageDetail?.features, (node) => normalizeText(node?.name) === "clause assist" && hasChildren(node));
  if (!root) return null;
  const node = findFeatureNode(root, (n) =>
    normalizeText(n?.name).includes("custom file upload") ||
    normalizeText(n?.name).includes("upload pdf") ||
    normalizeText(n?.display_text_2).includes("file count")
  );
  return getNodeCount(node);
};

const getWordCount = (text = "") => { const t = text.trim(); return t ? t.split(/\s+/).length : 0; };
const getPlainText = (html) => { const d = document.createElement("div"); d.innerHTML = html; return d.innerText || ""; };

const isPermissionEnabled = (value) => {
  if (value === true || value === 1) return true;
  if (!value || typeof value !== "object") return false;
  if (value.enabled != null) return value.enabled !== false && value.enabled !== 0;
  if (value.allowed != null) return value.allowed === true || value.allowed === 1;
  if (value.selected != null) return value.selected === true || value.selected === 1;
  if (value.value != null && typeof value.value !== "object") return Boolean(value.value);
  return false;
};

const getPermissionFlag = (permissions, key) => {
  if (!permissions || !key) return false;
  return isPermissionEnabled(permissions?.[key]) || isPermissionEnabled(permissions?.children?.[key]);
};

// ── XHR upload to S3 (same as UploadProgressPage) ─────────────────────────
const uploadFileToS3 = ({ file, presignedUrl, onProgress }) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`S3 upload failed (status ${xhr.status})`));
    });
    xhr.addEventListener("error", () => reject(new Error("Network error during S3 upload")));
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/pdf");
    xhr.send(file);
  });

const formats = [
  "bold", "italic", "underline",
  "list", "bullet",
  "align",
  "link",
];

const INPUT_METHOD_MAP = {
  rfp: "rfp",
  pdf: "pdf",
  custom: "txt",
};
const LinkModal = ({
  isOpen,
  position,
  linkUrl,
  linkText,
  isEditingExisting,
  onUrlChange,
  onTextChange,
  onSave,
  onRemove,
  onClose,
}) => {
  const modalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      ref={modalRef}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 999999,
        width: "340px",
      }}
      className="tw-bg-white tw-rounded-xl tw-shadow-2xl tw-border tw-border-gray-200 tw-p-5"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
        <div className="tw-flex tw-items-center tw-gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#4488ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#4488ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 className="tw-text-[14px] tw-font-bold tw-text-[#0f172a]">
            {isEditingExisting ? "Edit Link" : "Insert Link"}
          </h3>
        </div>
        <button onClick={onClose} className="tw-text-gray-400 hover:tw-text-gray-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="tw-mb-3">
        <label className="tw-block tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-wide tw-mb-1.5">
          Display Text
        </label>
        <input
          type="text"
          value={linkText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Link text (optional)"
          className="tw-w-full tw-border tw-border-gray-200 tw-rounded-lg tw-px-3 tw-py-2 tw-text-[13px] tw-text-[#1e293b] focus:tw-outline-none focus:tw-border-[#4488ff]"
        />
      </div>

      <div className="tw-mb-3">
        <label className="tw-block tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-wide tw-mb-1.5">
          URL <span className="tw-text-red-400">*</span>
        </label>
        <input
          ref={inputRef}
          type="url"
          value={linkUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") onClose();
          }}
          placeholder="https://example.com"
          className="tw-w-full tw-border-2 tw-border-[#4488ff] tw-rounded-lg tw-px-3 tw-py-2 tw-text-[13px] tw-text-[#1e293b] focus:tw-outline-none"
        />
      </div>

      <div className="tw-flex tw-items-center tw-gap-1.5 tw-mb-4 tw-bg-blue-50 tw-rounded-lg tw-px-3 tw-py-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="tw-flex-shrink-0">
          <circle cx="12" cy="12" r="10" stroke="#4488ff" strokeWidth="2"/>
          <path d="M12 8v4M12 16h.01" stroke="#4488ff" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p className="tw-text-[11px] tw-text-[#4488ff]">
          <strong>Click</strong> a link to edit · <strong>Ctrl+Click</strong> to open in new tab
        </p>
      </div>

      <div className="tw-flex tw-items-center tw-gap-2">
        {isEditingExisting && (
          <button
            onClick={onRemove}
            className="tw-px-3 tw-py-2 tw-rounded-lg tw-border tw-border-red-200 tw-text-[12px] tw-font-medium tw-text-red-500 hover:tw-bg-red-50 tw-flex tw-items-center tw-gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Remove
          </button>
        )}
        <button
          onClick={onClose}
          className="tw-flex-1 tw-py-2 tw-rounded-lg tw-border tw-border-gray-200 tw-text-[13px] tw-font-medium tw-text-[#475569] hover:tw-bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!linkUrl.trim()}
          className="tw-flex-1 tw-py-2 tw-rounded-lg tw-bg-[#0140c1] tw-text-white tw-text-[13px] tw-font-semibold tw-inline-flex tw-items-center tw-justify-center tw-gap-1.5 hover:tw-bg-blue-800 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {isEditingExisting ? "Update Link" : "Insert Link"}
        </button>
      </div>
    </div>,
    document.body
  );
};

export default function CreateClauseSuggester() {
  const navigate = useNavigate();
  const { uuid: routeProjectUuid } = useParams();
  const { permissions: clauseAssistPerms, packagePermissions: clauseAssistPackageEnabled } = usePermissions('clause_assist', 'clause_assist');
  // ── Redux / localStorage ────────────────────────────────────────────────
  const projectIdFromRedux = useSelector((s) => s.project?.project_id);
  const orgIdFromRedux = useSelector((s) => s.project?.organization_id);
  const orgUuidFromRedux = useSelector((s) => s.project?.organization_uuid);
  const packageList = useSelector((s) => s?.auth?.user?.[0]?.package_info);

  const projectId = projectIdFromRedux || localStorage.getItem("project_id");
  const projectUuid = routeProjectUuid || null;
  const organizationId = orgIdFromRedux || localStorage.getItem("organization_id");
  const organizationUuid = orgUuidFromRedux || localStorage.getItem("organization_uuid");

  // ── State ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("");
  const [selectedRFPs, setSelectedRFPs] = useState([]);
  const [customText, setCustomText] = useState("");
  const [clauseName, setClauseName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rfpDocuments, setRfpDocuments] = useState([]);
  const [rfpLoading, setRfpLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameChecking, setNameChecking] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [packageDetailWordLimit, setPackageDetailWordLimit] = useState(null);
  const [packageDetailPdfLimit, setPackageDetailPdfLimit] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const fileRef = useRef(null);
  const nameCheckTimer = useRef(null);
  const quillRef = useRef(null);
  const latestSelectionRef = useRef(null);
  const savedRangeRef = useRef(null);
  const lastAllowedCustomTextRef = useRef("");
  const lastAllowedPdfStateRef = useRef([]);

  // ── Computed package limits ─────────────────────────────────────────────
  const packageListWordLimit = useMemo(() => getClauseAssistCustomInputLimit(packageList), [packageList]);
  const packageListPdfLimit = useMemo(() => getClauseAssistPdfUploadLimit(packageList), [packageList]);
  const customInputWordLimit = packageDetailWordLimit ?? packageListWordLimit;
  const pdfUploadFileLimit = packageDetailPdfLimit ?? packageListPdfLimit;
  const canUsePdfInput =
  clauseAssistPackageEnabled &&
  resolvePackageEnabled(packageList, "clause_file", { strict: true }) &&
  getPermissionFlag(clauseAssistPerms, "upload");

const canUseCustomInput =
  clauseAssistPackageEnabled &&
  resolvePackageEnabled(packageList, "clause_input", { strict: true }) &&
  getPermissionFlag(clauseAssistPerms, "custom_input");

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkModalPos, setLinkModalPos] = useState({ top: 0, left: 0 });
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  const openLinkModal = (quill, range) => {
    savedRangeRef.current = range;

    const [leaf] = quill.getLeaf(range.index);
    const existingUrl =
      leaf?.parent?.domNode?.tagName === "A"
        ? leaf.parent.domNode.getAttribute("href") || ""
        : quill.getFormat(range)?.link || "";

    const selectedText = quill.getText(range.index, range.length);
    const toolbarEl = quill.container.closest(".quill-container")?.querySelector(".ql-toolbar");
    const linkBtn = toolbarEl?.querySelector(".ql-link");
    let top = 200;
    let left = 200;

    if (linkBtn) {
      const rect = linkBtn.getBoundingClientRect();
      const modalW = 340;
      const modalH = 310;
      top = rect.bottom + 8;
      left = rect.left - modalW / 2 + rect.width / 2;
      if (left < 8) left = 8;
      if (left + modalW > window.innerWidth - 8) left = window.innerWidth - modalW - 8;
      if (top + modalH > window.innerHeight - 8) top = rect.top - modalH - 8;
    }

    setLinkUrl(existingUrl);
    setLinkText(selectedText);
    setIsEditingExisting(!!existingUrl);
    setLinkModalPos({ top, left });
    setLinkModalOpen(true);
  };

  const handleLinkSave = () => {
    const quill = quillRef.current?.getEditor();
    const range = savedRangeRef.current;
    if (!quill || !range) return;

    const url = linkUrl.trim();
    if (!url) return;

    const finalUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    quill.focus();

    if (range.length > 0) {
      const currentText = quill.getText(range.index, range.length);
      if (linkText.trim() && linkText !== currentText) {
        quill.deleteText(range.index, range.length, "user");
        quill.insertText(range.index, linkText, "link", finalUrl, "user");
      } else {
        quill.formatText(range.index, range.length, "link", finalUrl, "user");
      }
    } else {
      const text = linkText.trim() || finalUrl;
      quill.insertText(range.index, text, "link", finalUrl, "user");
      quill.setSelection(range.index + text.length, 0, "silent");
    }

    setLinkModalOpen(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handleLinkRemove = () => {
    const quill = quillRef.current?.getEditor();
    const range = savedRangeRef.current;
    if (!quill || !range) return;

    quill.focus();
    if (range.length > 0) {
      quill.formatText(range.index, range.length, "link", false, "user");
    } else {
      const [leaf, offset] = quill.getLeaf(range.index);
      if (leaf?.parent?.domNode?.tagName === "A") {
        const linkStart = range.index - offset;
        const linkLen = leaf.parent.length();
        quill.formatText(linkStart, linkLen, "link", false, "user");
      }
    }

    setLinkModalOpen(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handleLinkClose = () => {
    setLinkModalOpen(false);
    setLinkUrl("");
    setLinkText("");

    const quill = quillRef.current?.getEditor();
    if (quill && savedRangeRef.current) {
      quill.focus();
      quill.setSelection(savedRangeRef.current.index, savedRangeRef.current.length, "silent");
    }
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: "" }, { align: "center" }, { align: "right" }, { align: "justify" }],
        ["link"],
        ["undo", "redo"],
      ],
      handlers: {
        undo: function () {
          const quill = this.quill;
          if (quill?.history) quill.history.undo();
        },
        redo: function () {
          const quill = this.quill;
          if (quill?.history) quill.history.redo();
        },
        link: function () {
          const quill = this.quill;
          if (!quill) return;
          const range = quill.getSelection() ?? latestSelectionRef.current ?? { index: 0, length: 0 };
          openLinkModal(quill, range);
        },
      },
    },
    history: { delay: 1000, maxStack: 100, userOnly: true },
  }), []);

  // ── Fetch RFP list ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectUuid) return;
    const fetchRFPs = async () => {
      setRfpLoading(true);
      try {
        const raw = await GetClauseSuggesterRFP({
          project_uuid: projectUuid,
          organization_uuid: organizationUuid,
          module_type: "RFP",
          device_info: {
            osName: "macOS", osVersion: "Catalina",
            browserName: "Chrome", browserVersion: "137.0.0.0",
          },
        });
        const response = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (response?.valid) {
          const allDocs = response.data?.documents ?? response.data ?? [];
          setRfpDocuments(
  allDocs.filter((d) => d.module_type === "RFP" && d.status === 3),
);

        } else {
          setRfpDocuments([]);
        }
      } catch (err) {
        console.error("GetClauseSuggesterRFP error:", err);
        setRfpDocuments([]);
      } finally {
        setRfpLoading(false);
      }
    };
    fetchRFPs();
  }, [projectUuid, organizationUuid]);
useEffect(() => {
  if (activeTab !== 'custom') return;

  const quill = quillRef.current?.getEditor();
  if (!quill) return;

  const handleSelectionChange = (range) => {
    latestSelectionRef.current = range;
    if (!range) return;
    const container = quill.root.closest('.ql-container');
    if (!container) return;
    const bounds = quill.getBounds(range.index, range.length);
    if (!bounds) return;
    const containerHeight = container.clientHeight;
    if (bounds.bottom > containerHeight - 20) {
      container.scrollTop += bounds.bottom - containerHeight + 30;
    } else if (bounds.top < 0) {
      container.scrollTop += bounds.top - 10;
    }
  };

    const handleTextChange = () => {
      // Use rAF so the cursor position is settled before we scroll
      requestAnimationFrame(() => {
        const sel = quill.getSelection();
        if (sel) handleSelectionChange(sel);
      });
    };

  const handleLinkClick = (e) => {
    const anchor = e.target.closest("a");
    if (!anchor) return;

    e.preventDefault();
    e.stopPropagation();

    const url = anchor.getAttribute("href");
    if (!url) return;

    if (e.ctrlKey || e.metaKey) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      const blot = Quill.find(anchor);
      if (blot) {
        const index = quill.getIndex(blot);
        const length = typeof blot.length === "function" ? blot.length() : anchor.textContent.length;
        quill.setSelection(index, length, "silent");
        latestSelectionRef.current = { index, length };
        openLinkModal(quill, { index, length });
        return;
      }
    } catch (err) {
      console.warn("Failed to resolve clicked link blot", err);
    }

    const range = quill.getSelection() ?? latestSelectionRef.current ?? { index: 0, length: 0 };
    openLinkModal(quill, range);
  };

  quill.on('selection-change', handleSelectionChange);
  quill.on('text-change', handleTextChange);
  quill.root.addEventListener("click", handleLinkClick);

  return () => {
    quill.off('selection-change', handleSelectionChange);
    quill.off('text-change', handleTextChange);
    quill.root.removeEventListener("click", handleLinkClick);
  };
}, [activeTab]); // re-runs when custom tab becomes active
  // ── Debounced name-exists check ─────────────────────────────────────────
  const handleClauseNameChange = (e) => {
    const val = e.target.value;
    const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
    setClauseName(capitalized);
    setNameError("");

    if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current);
    if (!val.trim()) return;

    nameCheckTimer.current = setTimeout(async () => {
      setNameChecking(true);
      try {
        const raw = await CheckExistsSuggester({
          suggester_name: capitalized.trim(),
          project_id: projectId,
        });
        const response = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (response?.exists === true || response?.data?.exists === true) {
          setNameError("A suggester with this name already exists.");
        }
      } catch (err) {
        console.error("CheckExistsSuggester error:", err);
      } finally {
        setNameChecking(false);
      }
    }, 600);
  };

  useEffect(() => () => {
    if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current);
  }, []);

  // ── Fetch package detail limits ─────────────────────────────────────────
  useEffect(() => {
    if (!organizationUuid) return;
    let cancelled = false;
    const fetchLimits = async () => {
      try {
        const orgRaw = await GetOneOrganization({ organization_uuid: organizationUuid });
        const orgResponse = typeof orgRaw === "string" ? JSON.parse(orgRaw) : orgRaw;
        const packageUuid = orgResponse?.data?.package_uuid;
        if (!packageUuid) return;
        const pkgRaw = await GetOnePackage({ package_uuid: packageUuid });
        const pkgResponse = typeof pkgRaw === "string" ? JSON.parse(pkgRaw) : pkgRaw;
        if (!pkgResponse?.valid || cancelled) return;
        setPackageDetailWordLimit(getClauseAssistCustomInputLimitFromPackageDetail(pkgResponse?.data));
        setPackageDetailPdfLimit(getClauseAssistPdfUploadLimitFromPackageDetail(pkgResponse?.data));
      } catch (err) {
        console.error("Failed to fetch clause assist package limits:", err);
      }
    };
    fetchLimits();
    return () => { cancelled = true; };
  }, [organizationUuid]);

  // ── Enforce word limit when customText changes externally ───────────────
  useEffect(() => {
    if (activeTab !== "custom" || !customInputWordLimit || !customText) return;
    const plainText = getPlainText(customText).trim();
    const currentWordCount = getWordCount(plainText);
    if (currentWordCount <= customInputWordLimit) return;
    const safeHtml = lastAllowedCustomTextRef.current;
    const safePlainText = getPlainText(safeHtml).trim();
    const safeWordCount = getWordCount(safePlainText);
    if (safeWordCount > customInputWordLimit) {
      lastAllowedCustomTextRef.current = "";
      setCustomText("");
      setCharCount(0);
      setWordCount(0);
    } else {
      setCustomText(safeHtml);
      setCharCount(safePlainText.length);
      setWordCount(safeWordCount);
    }
    setUpgradeMessage(`Your current package allows up to ${customInputWordLimit} word${customInputWordLimit > 1 ? "s" : ""} in Custom Input. Upgrade your package to continue.`);
    setShowUpgradeModal(true);
  }, [customInputWordLimit, customText, activeTab]);

  // ── Track last allowed PDF state ────────────────────────────────────────
  useEffect(() => {
    if (!pdfUploadFileLimit || uploadedFiles.length <= pdfUploadFileLimit) {
      lastAllowedPdfStateRef.current = uploadedFiles;
    }
  }, [pdfUploadFileLimit, uploadedFiles]);

  // ── Enforce PDF file limit ──────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "pdf" || !pdfUploadFileLimit || uploadedFiles.length <= pdfUploadFileLimit) return;
    setUploadedFiles(lastAllowedPdfStateRef.current);
    setUpgradeMessage(`Your current package allows up to ${pdfUploadFileLimit} PDF file${pdfUploadFileLimit > 1 ? "s" : ""} in Clause Assist upload. Upgrade your package to continue.`);
    setShowUpgradeModal(true);
  }, [activeTab, pdfUploadFileLimit, uploadedFiles]);

  // ── isFormReady ─────────────────────────────────────────────────────────
  const isFormReady =
  clauseName.trim() &&
  !nameError &&
  !nameChecking &&
  !!activeTab &&                                          
  (
    (activeTab === "rfp" && selectedRFPs.length > 0) ||
    (activeTab === "pdf" && uploadedFiles.length > 0) ||
    (activeTab === "custom" && customText.trim())
  );

  // ── RFP toggle ──────────────────────────────────────────────────────────
  const toggleRFP = (id) => {
    setSelectedRFPs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ── Add files ───────────────────────────────────────────────────────────
  const addFiles = (newFiles) => {
    const pdfs = Array.from(newFiles).filter((f) => f.type === "application/pdf");
    if (pdfs.length === 0) { showToast("error", "Only PDF files are allowed."); return; }
    setUploadedFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const fresh = pdfs.filter((f) => !existing.has(`${f.name}-${f.size}`));
      if (!fresh.length) return prev;
      if (pdfUploadFileLimit && prev.length + fresh.length > pdfUploadFileLimit) {
        setUpgradeMessage(`Your current package allows up to ${pdfUploadFileLimit} PDF file${pdfUploadFileLimit > 1 ? "s" : ""} in Clause Assist upload. Upgrade your package to continue.`);
        setShowUpgradeModal(true);
        return prev;
      }
      return [...prev, ...fresh];
    });
  };

  const removeFile = (idx) => setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); };
  const handleFileInput = (e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; };

  // ── Custom text change with word-limit enforcement ──────────────────────
  const handleQuillChange = (value) => {
    const plainText = getPlainText(value).trim();
    const nextWordCount = getWordCount(plainText);
    if (activeTab === "custom" && customInputWordLimit && nextWordCount > customInputWordLimit) {
      const safeContent = lastAllowedCustomTextRef.current;
      const safePlainText = getPlainText(safeContent).trim();

      // Force-revert Quill's DOM immediately (React state alone is too slow)
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const delta = quill.clipboard.convert(safeContent || "");
        quill.setContents(delta, "silent");
        const len = quill.getLength();
        quill.setSelection(len > 0 ? len - 1 : 0, 0, "silent");
      }

      setCustomText(safeContent);
      setCharCount(safePlainText.length);
      setWordCount(getWordCount(safePlainText));
      setUpgradeMessage(`Your current package allows up to ${customInputWordLimit} word${customInputWordLimit > 1 ? "s" : ""} in Custom Input. Upgrade your package to continue.`);
      setShowUpgradeModal(true);
      return;
    }
    lastAllowedCustomTextRef.current = value;
    setCustomText(value);
    setCharCount(plainText.length);
    setWordCount(nextWordCount);
  };

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = () => {
    if (!clauseName.trim()) { setNameError("Suggester name is required."); return false; }
    if (nameError) return false;
    if (activeTab === "rfp" && selectedRFPs.length === 0) { showToast("error", "Please select at least one RFP document."); return false; }
    if (activeTab === "pdf" && uploadedFiles.length === 0) { showToast("error", "Please upload at least one PDF file."); return false; }
    if (activeTab === "custom" && !customText.trim()) { showToast("error", "Please enter contract content."); return false; }
    return true;
  };

  // eslint-disable-next-line no-unused-vars
  const uploadSingleFile = async (file) => {

    // Step 1: Get presigned URL — NO file_uuid in request, backend generates it
    const urlRaw = await GetCompanyUploadedUrl({
      organization_uuid: organizationUuid,
      file_name: file.name,       
      document_category: "suggest_clause",
    });
    const urlResponse = typeof urlRaw === "string" ? JSON.parse(urlRaw) : urlRaw;

    if (!urlResponse?.valid) {
      throw new Error(`Failed to get upload URL for "${file.name}": ${urlResponse?.message || "Unknown error"}`);
    }

    const presignedUrl = urlResponse.data?.upload_url;
    if (!presignedUrl) throw new Error(`No presigned URL returned for "${file.name}"`);

    // Use server's file_uuid from response
    const serverFileUuid = urlResponse.data?.file_uuid;
    if (!serverFileUuid) throw new Error(`No file_uuid in server response for "${file.name}"`);

    // Step 2: Upload file to S3
    await uploadFileToS3({
      file,
      presignedUrl,
      onProgress: (pct) => console.log(`Uploading ${file.name}: ${pct}%`),
    });

    // Step 3: Register with backend using server's file_uuid 
    const docRaw = await AddUploadDoc({
      organization_uuid: organizationUuid,
      file_uuid: serverFileUuid,  
      project_id: projectId,
      original_file_name: file.name,
      file_size: file.size,
      document_category: "suggest_clause",
    });
    const docResponse = typeof docRaw === "string" ? JSON.parse(docRaw) : docRaw;

    if (!docResponse?.valid) {
      throw new Error(`Document registration failed for "${file.name}": ${docResponse?.message || "Unknown error"}`);
    }

    return (
      docResponse.document_id ??
      docResponse.data?.document_id ??
      docResponse.data?.document_encrypted_id ??
      serverFileUuid
    );
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!validate() || isSubmitting || nameChecking) return;

    // Enforce package word / file limits before proceeding
    if (activeTab === "custom" && customInputWordLimit) {
      const plainText = getPlainText(customText).trim();
      if (getWordCount(plainText) > customInputWordLimit) {
        setUpgradeMessage(`Your current package allows up to ${customInputWordLimit} word${customInputWordLimit > 1 ? "s" : ""} in Custom Input. Upgrade your package to continue.`);
        setShowUpgradeModal(true);
        return;
      }
    }
    if (activeTab === "pdf" && pdfUploadFileLimit && uploadedFiles.length > pdfUploadFileLimit) {
      setUpgradeMessage(`Your current package allows up to ${pdfUploadFileLimit} PDF file${pdfUploadFileLimit > 1 ? "s" : ""} in Clause Assist upload. Upgrade your package to continue.`);
      setShowUpgradeModal(true);
      return;
    }

    // Check access quota before navigating
    try {
      setIsSubmitting(true);
      const raw = await countAccess({
        organization_id: organizationId,
        module_name: "clause_assist",
        sub_module_name: INPUT_METHOD_MAP[activeTab],
      });
      const res = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!res?.allowed) {
        setUpgradeMessage(res?.message || "You have reached your limit. Upgrade your package.");
        setShowUpgradeModal(true);
        return;
      }
    } catch (err) {
      console.error("countAccess error:", err);
      showToast("error", "Something went wrong");
      return;
    } finally {
      setIsSubmitting(false);
    }

    navigate(`/project/view/${projectUuid}/contract-command/clause-assist/analyzing/new`, {
      replace: false,
      state: {
        clauseName: clauseName.trim(),
        activeTab,
        selectedRFPs,
        uploadedFiles,
        customText,
        projectId,
        projectUuid,
        organizationId,
        organizationUuid,
      },
    });
  };

  // ── Tabs config ─────────────────────────────────────────────────────────
const tabs = [
  {
    id: "rfp",
    icon: <i className="icon-RFP-Doc tw-text-[22px]" />,
    label: "Select RFP",
    desc: "Choose from previously uploaded RFP documents for quick clause analysis",
    badge: `${rfpDocuments.length} available`,
  },
  canUsePdfInput && {
    id: "pdf",
    icon: <i className="icon-upload-files tw-text-[22px]" />,
    label: "Upload PDF",
    desc: "Upload one or more contract or legal documents directly from your computer",
    badge: "PDF format supported",
  },
  canUseCustomInput && {
    id: "custom",
    icon: <i className="icon-custom-input tw-text-[22px]" />,
    label: "Custom Input",
    desc: "Paste or type contract content directly using the rich text editor",
    badge: "Rich text editor",
  },
].filter(Boolean);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="tw-min-h-screen tw-text-slate-800">
      <LinkModal
        isOpen={linkModalOpen}
        position={linkModalPos}
        linkUrl={linkUrl}
        linkText={linkText}
        isEditingExisting={isEditingExisting}
        onUrlChange={setLinkUrl}
        onTextChange={setLinkText}
        onSave={handleLinkSave}
        onRemove={handleLinkRemove}
        onClose={handleLinkClose}
      />
 
      {/* Header */}
      <div className="tw-flex tw-items-center tw-gap-4 tw-mb-2">
        <button
          onClick={() => navigate(`/project/view/${projectUuid}/contract-command/clause-assist`)}
          className="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-bg-[#b3bcce] tw-rounded-lg hover:tw-bg-[#0140c1] tw-transition-colors tw-duration-200"
        >
          <i className="icon-Previous tw-text-white tw-text-lg" />
        </button>
        <div>
          <div className="tw-text-[#535353] tw-text-sm">Contract Command /</div>
          <h1 className="tw-text-[#000] tw-text-[20px] tw-font-bold">Clause Assist</h1>
        </div>
      </div>

      <div className="tw-px-12 tw-pt-2">

        {/* Hero Banner */}
        <div className="tw-mb-6 tw-bg-[#eef5ff] tw-border tw-border-[#d6e4ff] tw-rounded-xl tw-p-5 tw-flex tw-gap-4 tw-items-start">
          <div className="tw-bg-[#d9e7ff] tw-p-2.5 tw-rounded-lg tw-flex tw-justify-center tw-items-center">
            <i className="tw-text-[#4488ff] icon-AI-fill tw-text-[24px]" />
          </div>
          <p className="tw-text-[#475569] tw-text-[13px] tw-leading-relaxed">
            Select from existing RFP documents, upload a PDF contract, or paste content directly.
            Our AI will analyze the document and identify clauses that may require attention,
            providing suggestions and reasoning for each finding.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="tw-mb-6">
          <h2 className="tw-font-bold tw-text-slate-800 tw-text-[15px]">Select Input Source</h2>
          <p className="tw-text-[13px] tw-text-slate-400 tw-mt-0.5 tw-mb-4">
            Choose how you'd like to provide the contract content for analysis
          </p>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                 onClick={() => {
  if (tab.id === activeTab) return;
  setActiveTab(tab.id);
}}
                  className={`tw-relative tw-p-5 tw-rounded-2xl tw-border tw-text-left tw-transition-all tw-w-full
                    ${isActive
                      ? "tw-bg-[#eff6ff] tw-border-blue-300"
                      : "tw-bg-white tw-border-slate-200 hover:tw-border-slate-300"
                    }`}
                >
                  {isActive && (
                    <div className="tw-absolute tw-top-4 tw-right-4 tw-w-6 tw-h-6 tw-rounded-full tw-bg-blue-500 tw-flex tw-items-center tw-justify-center">
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  <div className={`tw-w-11 tw-h-11 tw-rounded-xl tw-flex tw-items-center tw-justify-center tw-mb-3
                    ${isActive ? "tw-bg-blue-500 tw-text-white" : "tw-bg-[#efefef] tw-text-[#747474]"}`}>
                    {tab.icon}
                  </div>
                  <h3 className="tw-font-bold tw-text-[14px] tw-text-slate-800 tw-mb-1">{tab.label}</h3>
                  <p className="tw-text-[12px] tw-text-slate-400 tw-leading-relaxed tw-mb-3">{tab.desc}</p>
                  <span className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-text-[11px] tw-font-normal tw-px-2.5 tw-py-1 tw-rounded-md
                    ${isActive && (tab.id === "rfp" || tab.id === "pdf")
                      ? "tw-bg-blue-100 tw-text-blue-600 tw-font-semibold"
                      : "tw-bg-[#efefef] tw-text-[#000000] tw-font-semibold"
                    }`}>
                    {tab.id === "rfp" && isActive
                      ? `${selectedRFPs.length} document${selectedRFPs.length !== 1 ? "s" : ""} selected`
                      : tab.id === "pdf" && isActive
                        ? `${uploadedFiles.length} file${uploadedFiles.length !== 1 ? "s" : ""} selected`
                        : tab.badge
                    }
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Suggester Name */}
        <div className="tw-mb-4 tw-bg-white tw-p-3 tw-rounded-md tw-border tw-border-slate-200">
          <label className="tw-text-[13px] tw-font-semibold tw-text-slate-500 tw-mb-1 tw-block">
            Name*
          </label>
          <div className="tw-relative tw-w-full md:tw-w-1/2">
            <input
              type="text"
              placeholder="e.g. Payment Terms Clarification"
              value={clauseName}
              onChange={handleClauseNameChange}
              className={`tw-w-full tw-px-4 tw-py-2.5 tw-pr-10 tw-rounded-lg tw-border tw-text-[14px] tw-text-slate-700 focus:tw-outline-none focus:tw-ring-1
                ${nameError
                  ? "tw-border-red-400 focus:tw-border-red-400 tw-ring-red-400"
                  : nameChecking
                    ? "tw-border-slate-300 tw-ring-slate-300"
                    : "tw-border-[#dcdbdb] focus:tw-border-[#0140c1] focus:tw-ring-1 tw-ring-[#0140c1]"
                }`}
            />
            {nameChecking && (
              <div className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2">
                <svg className="tw-animate-spin tw-w-4 tw-h-4 tw-text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="tw-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="tw-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              </div>
            )}
          </div>
          {nameError && <p className="tw-text-[12px] tw-text-red-500 tw-mt-1">{nameError}</p>}
        </div>

        {/* Content Panel */}
        <div className="tw-bg-white tw-border tw-border-slate-200 tw-rounded-xl tw-overflow-hidden tw-shadow-sm tw-mb-6">

          {/* ── RFP Tab ── */}
          {activeTab === "rfp" && (
            <div className="tw-p-6">
              <div className="tw-flex tw-items-center tw-gap-3 tw-mb-6">
                <div className="tw-bg-[#dee9ff] tw-border tw-border-[#dbeafe] tw-p-2 tw-flex tw-justify-center tw-items-center tw-rounded-[6px]">
                  <i className="icon-book tw-text-[#0052cc] tw-text-[24px]" />
                </div>
                <h3 className="tw-text-[16px] tw-font-extrabold tw-text-[#1e293b] tw-tracking-tight">Select RFP Document</h3>
              </div>

              {rfpLoading ? (
                <FullPageLoader />
              ) : rfpDocuments.length === 0 ? (
                <p className="tw-text-sm tw-text-slate-400 tw-text-center tw-py-8">No RFP documents found.</p>
              ) : (
                <div className="tw-space-y-3">
                  {rfpDocuments.map((doc) => {
                    const docId = doc.document_id ?? doc.file_id;
                    const encId = doc.document_encrypted_id ?? doc.file_id;
                    const title = doc.document_name ?? doc.filename ?? "Untitled";
           const sizeKB = doc.size
  ? doc.size >= 1024 * 1024
    ? `${(doc.size / (1024 * 1024)).toFixed(2)} MB`
    : `${(doc.size / 1024).toFixed(0)} KB`
  : null;
                    const dateStr = doc.uploaded_date
                      ? new Date(doc.uploaded_date).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })
                      : "—";
                    const isChecked = selectedRFPs.includes(encId);
                    return (
                      <div
                        key={docId}
                        onClick={() => toggleRFP(encId)}
                        className={`tw-flex tw-items-center tw-p-4 tw-border tw-rounded-xl tw-cursor-pointer tw-transition-all
                          ${isChecked ? "tw-border-blue-300 tw-bg-blue-50/40" : "tw-border-slate-100 hover:tw-border-slate-200"}`}
                      >
                        <div className={`tw-w-5 tw-h-5 tw-rounded tw-border tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-mr-4 tw-transition-colors
                          ${isChecked ? "tw-bg-blue-600 tw-border-blue-600" : "tw-border-slate-300 tw-bg-white"}`}>
                          {isChecked && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <div className="tw-bg-[#ffeeee] tw-border tw-border-[#ffeded] tw-w-10 tw-h-10 tw-rounded-xl tw-flex tw-items-center tw-justify-center tw-mr-4 tw-flex-shrink-0 tw-shadow-sm">
                          <i className="icon-On-hold tw-text-[#ff4d4d] tw-text-[22px]" />
                        </div>
                        <div className="tw-flex-1 tw-min-w-0">
                          <h4 className="tw-text-[14px] tw-font-semibold tw-text-slate-800 tw-truncate">{title}</h4>
                          <p className="tw-text-[12px] tw-text-slate-400 tw-mt-0.5">
                            {sizeKB ? `${sizeKB} • ` : ""}Uploaded {dateStr}
                          </p>
                        </div>
                        <span className="tw-text-[11px] tw-font-medium tw-text-slate-400 tw-bg-slate-100 tw-px-2 tw-py-0.5 tw-rounded tw-ml-3 tw-flex-shrink-0">PDF</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedRFPs.length > 0 && (
                <p className="tw-text-[12px] tw-text-slate-400 tw-mt-4">
                  {selectedRFPs.length} document(s) selected for analysis
                </p>
              )}
            </div>
          )}

          {/* ── PDF Upload Tab ── */}
          {activeTab === "pdf" && (
            <div className="tw-p-6">
              <div className="tw-flex tw-items-center tw-gap-2 tw-mb-5">
                <div className="tw-bg-[#dee9ff] tw-border tw-border-[#dbeafe] tw-p-2 tw-flex tw-justify-center tw-items-center tw-rounded-[6px]">
                  <i className="icon-Upload-Document tw-text-[#0052cc] tw-text-[20px]" />
                </div>
                <h3 className="tw-text-[15px] tw-font-bold tw-text-slate-800">Upload PDF Documents</h3>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`tw-border-2 tw-border-dashed tw-rounded-2xl tw-p-10 tw-flex tw-flex-col tw-items-center tw-justify-center tw-cursor-pointer tw-transition-all
                  ${dragOver ? "tw-border-blue-400 tw-bg-blue-50" : "tw-border-slate-200 tw-bg-slate-50/50 hover:tw-border-blue-300 hover:tw-bg-blue-50/30"}`}
              >
                <input ref={fileRef} type="file" accept=".pdf" multiple className="tw-hidden" onChange={handleFileInput} />
                 <div className="tw-bg-blue-100 tw-p-3 tw-rounded-xl tw-mb-4 tw-flex tw-items-center tw-justify-center tw-w-14 tw-h-14">
  <img src={ContractLoader} alt="Upload" className="tw-w-full tw-h-full tw-object-contain" />
</div>
                <h3 className="tw-text-[16px] tw-font-bold tw-text-slate-700">Drop your PDFs here or click to browse</h3>
                <p className="tw-text-[12px] tw-text-slate-400 tw-mt-1">
                  {pdfUploadFileLimit
                    ? `Upload up to ${pdfUploadFileLimit} PDF file${pdfUploadFileLimit > 1 ? "s" : ""}`
                    : "You can upload multiple PDF files at once"}
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="tw-mt-5 tw-space-y-2">
                  <p className="tw-text-[13px] tw-font-semibold tw-text-slate-600 tw-mb-3">
                    {pdfUploadFileLimit
                      ? `${uploadedFiles.length}/${pdfUploadFileLimit} file${pdfUploadFileLimit > 1 ? "s" : ""} ready for upload`
                      : `${uploadedFiles.length} file${uploadedFiles.length !== 1 ? "s" : ""} ready for upload`}
                  </p>
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${file.size}-${idx}`}
                      className="tw-flex tw-items-center tw-p-3 tw-border tw-border-slate-100 tw-rounded-xl tw-bg-slate-50/60 hover:tw-bg-slate-50 tw-transition-colors"
                    >
                      <div className="tw-bg-green-100 tw-w-9 tw-h-9 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-mr-3">
                        <FileText size={18} className="tw-text-green-500" />
                      </div>
                      <div className="tw-flex-1 tw-min-w-0">
                        <p className="tw-text-[13px] tw-font-semibold tw-text-slate-800 tw-truncate">{file.name}</p>
                        <p className="tw-text-[11px] tw-text-slate-400 tw-mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <span className="tw-text-[11px] tw-font-medium tw-text-slate-400 tw-bg-slate-100 tw-px-2 tw-py-0.5 tw-rounded tw-mr-3 tw-flex-shrink-0">PDF</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        className="tw-w-7 tw-h-7 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-text-slate-400 hover:tw-bg-red-50 hover:tw-text-red-500 tw-transition-colors tw-flex-shrink-0"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                  {/* <button
                    onClick={() => fileRef.current?.click()}
                    className="tw-mt-2 tw-flex tw-items-center tw-gap-2 tw-text-[12px] tw-font-semibold tw-text-blue-500 hover:tw-text-blue-700 tw-transition-colors"
                  >
                    <span className="tw-text-[18px] tw-leading-none">+</span> Add more files
                  </button> */}
                </div>
              )}
            </div>
          )}

          {/* ── Custom Input Tab ── */}
          {activeTab === "custom" && (
            <div className="tw-p-6">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-5">
                <div className="tw-flex tw-items-center tw-gap-2">
                  <div className="tw-bg-[#dee9ff] tw-border tw-border-[#dbeafe] tw-p-2 tw-flex tw-justify-center tw-items-center tw-rounded-[6px]">
                    <i className="tw-text-[#0052cc] icon-paste-content tw-text-[20px]" />
                  </div>
                  <h3 className="tw-text-[15px] tw-font-bold tw-text-slate-800">Paste Contract Content</h3>
                </div>
                <span className="tw-text-[12px] tw-text-slate-400">
                  {customInputWordLimit
                    ? `${wordCount}/${customInputWordLimit} Words • ${charCount} Characters`
                    : `${charCount} Characters`}
                </span>
              </div>
              <div className="tw-border tw-border-slate-200 tw-rounded-xl tw-overflow-hidden quill-container">
                <ReactQuill
                  theme="snow"
                  ref={quillRef}
                  value={customText}
                  onChange={handleQuillChange}
                  readOnly={showUpgradeModal}
                  formats={formats}
                  modules={modules}
                  placeholder="Paste your contract or legal document content here for clause analysis..."
                  className="tw-text-slate-700"
                />
              </div>
              <p className="tw-text-[11px] tw-text-slate-400 tw-mt-3 tw-italic">
                Tip: You can paste content from Word documents, PDFs, or any text source
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="tw-flex tw-justify-end tw-pb-8">
          <button
            onClick={handleAnalyze}
            disabled={isSubmitting || !isFormReady}
            className={`group tw-text-white tw-px-7 tw-py-2.5 tw-rounded-lg tw-font-bold tw-text-[14px] tw-flex tw-items-center tw-gap-2 tw-whitespace-nowrap
              tw-transition-all tw-duration-300 tw-ease-in-out
              ${isSubmitting || !isFormReady
                ? "tw-bg-blue-400 tw-cursor-not-allowed tw-opacity-70"
                : "tw-bg-[#0047cc] hover:tw-bg-[#1b44c4] hover:tw-shadow-lg hover:tw-shadow-blue-200/50 hover:tw-scale-[1.03] hover:-tw-translate-y-[1px] active:tw-scale-[0.98]"
              }`}
          >
            {isSubmitting ? (
              <>
                <svg className="tw-animate-spin tw-w-4 tw-h-4 tw-text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="tw-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="tw-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <i className="icon-AI-fill tw-text-[20px]" />
                Analyze Clauses
              </>
            )}
          </button>
        </div>

        {/* Quill overrides */}
        <style jsx global>{`
        .ql-toolbar.ql-snow { border:none!important; border-bottom:1px solid #e2e8f0!important; background:#fcfcfc; padding:8px 16px!important; display:flex; align-items:center; gap:4px; }
  .ql-container.ql-snow { border:none!important; font-size:14px; }
  .quill-container .ql-container.ql-snow { min-height:280px; max-height:280px; overflow-y:auto; }
  .quill-container .ql-editor { min-height:280px; }
  .ql-editor.ql-blank::before { color:#cbd5e1; font-style:normal; }
  .ql-undo::before { content: "↩"; font-size:16px; }
  .ql-redo::before { content: "↪"; font-size:16px; }

  /* Divider after each group */
  .ql-toolbar.ql-snow .ql-formats { 
    margin-right: 0 !important; 
    padding-right: 10px;
    border-right: 1.5px solid #d1d5db !important;
  }
.ql-editor p { margin: 0; padding: 0; }
  /* Remove divider from last group */
  .ql-toolbar.ql-snow .ql-formats:last-child { 
    border-right: none !important; 
    padding-right: 0;
  }
    .quill-container .ql-container.ql-snow { 
  min-height:280px; 
  max-height:280px; 
  overflow-y:scroll;  /* change from 'auto' to 'scroll' */
  scrollbar-width: thin;  /* Firefox */
  scrollbar-color: #94a3b8 #f1f5f9;  /* Firefox */
}

/* Chrome/Safari/Edge */
.quill-container .ql-container.ql-snow::-webkit-scrollbar {
  width: 6px;
}
.quill-container .ql-container.ql-snow::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}
.quill-container .ql-container.ql-snow::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 3px;
}
.quill-container .ql-container.ql-snow::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
  
.quill-container .ql-snow .ql-tooltip {
  display: none !important;
}
.quill-container .ql-editor a {
  color: #4488ff !important;
  text-decoration: underline !important;
  cursor: pointer !important;
}
.quill-container .ql-editor a:hover {
  color: #2266dd !important;
}
        `}</style>
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
               <h2 className="tw-text-[30px]  tw-font-bold tw-text-[#000000] tw-mb-8 tw-leading-snug">
                 Unlock More with an Upgrade!
               </h2>
               <div className="tw-flex tw-justify-center tw-mb-4">
                 <div className="tw-relative tw-w-[200px] tw-h-[175px] tw-flex tw-items-center tw-justify-center">
                   <div className="tw-flex tw-justify-center tw-mb-6">
                     <img
                       src={upgradImg}
                       alt="Upgrade"
                       className="tw-w-36 tw-h-36 tw-object-contain"
                     />
                   </div>
                 </div>
               </div>
               <p className="tw-text-[18px] tw-text-[rgba(85, 85, 85, 0.33)] tw-mb-8 tw-leading-normal tw-px-2">
                 {upgradeMessage}
               </p>
               <button
                 onClick={() => setShowUpgradeModal(false)}
                 className="tw-w-[318px] tw-h-[48px] tw-py-3 tw-text-white tw-text-[16px] tw-font-medium tw-rounded-[6px] tw-transition-all tw-duration-200 hover:tw-opacity-90 hover:tw-shadow-lg"
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
