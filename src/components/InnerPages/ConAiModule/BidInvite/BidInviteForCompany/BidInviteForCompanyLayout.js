

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useSelector } from 'react-redux';
import ReactDOM from 'react-dom'
import NavigationHeader from '../../../../../genriccomponents/NavigationHeader'
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { saveAs } from 'file-saver'
import { get_trade_data, save_bid_data, draft_bid_data, GenerateBidPdf, draft_bid_detail } from '../../../../../services/techus-services';
import { showToast } from '../../../../../genriccomponents/techus-ToastNotification';
import FullPageLoader from '../../../../../genriccomponents/loaders/FullPageLoader';
import { getPdfAssets } from '../../../../../utils/pdfAssets';
import usePermissions from '../../../../Common/usePermissions';
import CONFIG from '../../../../../config/config';
import prexoLogo from '../../../../../assets/fonts/fonts/PrexoAI.svg';
import { useEstimation } from '../../../../context/EstimationContext';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  ImageRun,
  ShadingType,
  SectionType,
  TabStopType,

} from "docx";



const PAGE_WIDTH = 11906;
const MARGIN_H = 720;
const pxToEmu = (px) => Math.round(px * 9525);
const COVER_BLEED_PX = 12;
const COVER_BLEED_EMU = pxToEmu(COVER_BLEED_PX);
const COVER_PAGE_BG = "0A1A6B";


const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result || "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const drawContainedImage = (ctx, img, x, y, width, height) => {
  const imageWidth = img.naturalWidth || img.width || 1;
  const imageHeight = img.naturalHeight || img.height || 1;
  const scale = Math.min(width / imageWidth, height / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
};

const normalizeImageToPngDataUrl = (src) =>
  new Promise((resolve) => {
    if (!src) {
      resolve("");
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 1;
        canvas.height = img.naturalHeight || img.height || 1;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        console.warn("normalizeImageToPngDataUrl failed:", error);
        resolve("");
      }
    };
    img.onerror = () => resolve("");
    img.src = src;
  });

const getWordCompatibleLogoDataUrl = async (primarySrc, fallbackSrc = prexoLogo) => {
  const primaryRaw = primarySrc ? await imageUrlToDataUrl(primarySrc) : "";
  const primaryPng = primaryRaw ? await normalizeImageToPngDataUrl(primaryRaw) : "";
  if (primaryPng) return primaryPng;

  const fallbackPng = fallbackSrc ? await normalizeImageToPngDataUrl(fallbackSrc) : "";
  return fallbackPng || "";
};

async function imageUrlToDataUrl(url) {
  if (!url) return "";
  if (url.startsWith("data:")) return url;

  try {
    const response = await fetch(url, {
      mode: "cors",
      cache: "no-cache"
    });

    if (!response.ok) {
      return "";
    }

    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch (error) {
    console.warn("imageUrlToDataUrl failed:", url, error);
    return "";
  }
}


const formats = ["bold", "italic", "underline", "list", "bullet", "align", "link",];
const SECTION_GAP = '<p><br></p>';


const buildTopHtml = (content = {}, detail = {}, tradeLabel = '', projectName = '') => {
  const scopeList = (content.scope || []).map(i => `<li>${i}</li>`).join('')
  const bidDocsList = (content.bid_documents || []).map(i => `<li>${i}</li>`).join('')
  const recipientName = detail?.contactName?.trim() || '';
  const resolvedProjectName = projectName?.trim() || 'the current project';

  // ── Key dates as Quill-safe rows (no table tags) ──
  const keyDates = content?.key_dates || {};
  const keyDatesRows = Object.entries(keyDates)
    .map(([key, val]) =>
      `<p><strong>${key}:</strong>&nbsp;${val}</p>`
    ).join('')

  return `
   
<p>Dear ${recipientName ? `<strong>${recipientName}</strong>,` : ','}</p>
    <p>On behalf of <strong>ConstructionAI General Contractors</strong>, we are pleased to invite <strong>${detail.companyName || ''}</strong> to submit a competitive bid for the <strong>${tradeLabel || detail.tradeCategory || ''}</strong> as part of the <strong>${resolvedProjectName}</strong> project.</p>
    ${SECTION_GAP}
    <p><strong>Project Overview</strong></p>
    <p>${content.project_overview || ''}</p>
    ${SECTION_GAP}
    <p><strong>Scope of Work</strong></p>
    <p>The ${tradeLabel || detail.tradeCategory || ''} package includes, but is not limited to:</p>
    <ul>${scopeList}</ul>
    ${SECTION_GAP}
    <p><strong>Bid Documents</strong></p>
    <p>The following documents are available for your review:</p>
    <ul>${bidDocsList}</ul>
    ${SECTION_GAP}
    <p><strong>Key Dates</strong></p>
    ${keyDatesRows}
  `
}

const buildBottomHtml = (content = {}, detail = {}) => {
  const bidSubList = (content.bid_submission_requirements || []).map(i => `<li>${i}</li>`).join('')
  return `
    ${SECTION_GAP}
    <p><strong>Bid Submission Requirements</strong></p>
    <p>Your bid submission should include:</p>
    <ul>${bidSubList}</ul>
    ${SECTION_GAP}
    <p><strong>Contact Information</strong></p>
    <p>For questions regarding this invitation or the bid process, please contact:</p>
    <p>Project Manager: [Project Manager Name]</p>
    <p>Email: bids@constructionai.com</p>
    <p>Phone: (555) 123-4567</p>
    ${SECTION_GAP}
    <p>We look forward to receiving your competitive proposal and potentially partnering with <strong>${detail.companyName || ''}</strong> on this exciting project.</p>
    <p>Sincerely,</p>
    <p><strong>ConstructionAI General Contractors</strong><br/>Pre-construction Department</p>
  `
}

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
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#4488ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#4488ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="tw-text-[14px] tw-font-bold tw-text-[#0f172a]">
            {isEditingExisting ? "Edit Link" : "Insert Link"}
          </h3>
        </div>
        <button onClick={onClose} className="tw-text-gray-400 hover:tw-text-gray-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
          <circle cx="12" cy="12" r="10" stroke="#4488ff" strokeWidth="2" />
          <path d="M12 8v4M12 16h.01" stroke="#4488ff" strokeWidth="2" strokeLinecap="round" />
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
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
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
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {isEditingExisting ? "Update Link" : "Insert Link"}
        </button>
      </div>
    </div>,
    document.body
  );
};




const BidInviteForCompanyLayout = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { bid_uuid } = useParams();
  console.log(state)
  const Edit = state?.isEdit;
  const bidData = state?.bidData;
  const detail = state?.detail;
  const bid_id = state?.bid_id;
  const organizationImage = useSelector((s) => s?.auth?.user?.[0]?.organization_image);
  const { isMarkAsCompleted } = useEstimation();
  const logoUrl = organizationImage
    ? `${CONFIG.VITE_AWS_ENDPOINT}/organization_images/${organizationImage}`
    : null;
  // ── Parse response_text JSON string ──
  const parsedResponse = (() => {
    try {
      const raw = bidData?.response_text;
      return typeof raw === "string" ? JSON.parse(raw) : (raw || {});
    } catch { return {}; }
  })();


  // ── Structured object for Word/PDF export ──
  const content = bidData?.data?.content || parsedResponse?.content || {};

  // ── HTML string for editor only ──
  const contentHtml = bidData?.content_text || "";

  const bidId = bidData?.bid_id;
  const bidUuid = bid_uuid || bidData?.bid_uuid || bidData?.data?.bid_uuid;
  const companyName = detail?.companyName || bidData?.company_name || bidData?.data?.company_name;
  const contactName = detail?.contactName || bidData?.contact_name || bidData?.data?.contact_name;
  const contactEmail = detail?.contactEmail || bidData?.contact_email || bidData?.data?.contact_email;
  const currentProjectName = bidData?.project_name || bidData?.data?.project_name || detail?.projectName || '';
  const projectUId = localStorage.getItem("project_uuid");

  const [tradeOptions, setTradeOptions] = useState([]);
  const [editorValue, setEditorValue] = useState('');
  const [editorReady, setEditorReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef(null);
  const { permissions } = usePermissions('bid_invites', 'contract_command');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  // Regenerate popup state
  const [showPopup, setShowPopup] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [isRedrafting, setIsRedrafting] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const popupRef = useRef(null);
  const quillRef = useRef(null);
  const latestSelectionRef = useRef(null);
  const savedRangeRef = useRef(null);

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

  const modulesMain = useMemo(() => ({
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

  useEffect(() => {
    if (!editorReady) return;

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

    quill.on('selection-change', handleSelectionChange);

    // BEFORE
    // const handleTextChange = () => {
    //   const sel = quill.getSelection();
    //   if (sel) handleSelectionChange(sel);
    // };

    // ✅ AFTER — defers until after Quill finishes the paste/insert cycle
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

    quill.on('text-change', handleTextChange);
    quill.root.addEventListener("click", handleLinkClick);

    return () => {
      quill.off('selection-change', handleSelectionChange);
      quill.off('text-change', handleTextChange);
      quill.root.removeEventListener("click", handleLinkClick);
    };
  }, [editorReady]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setShowPopup(false);
        if (!isRedrafting) setInstruction('');
      }
    };
    const handleScroll = (e) => {
      if (popupRef.current && popupRef.current.contains(e.target)) return;
      setShowPopup(false);
      if (!isRedrafting) setInstruction('');
    };
    if (showPopup) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showPopup, isRedrafting]);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await get_trade_data();

        if (res?.valid) {
          const options = res.data.map(item => ({
            label: item.display_name,
            value: item.id,
          }));
          setTradeOptions(options);

          if (Edit && contentHtml) {
            setEditorValue(contentHtml);
          } else {
            const tradeLabel = options.find(opt => opt.value === detail?.tradeCategory)?.label
              || detail?.tradeCategory
              || bidData?.trade_category_name;
            setEditorValue(buildTopHtml(content, detail, tradeLabel, currentProjectName) + buildBottomHtml(content, detail));
          }
          setEditorReady(true);
        }
      } catch (err) {
        console.error("Failed to fetch trades", err);
        if (Edit && bidData?.content_text) {
          setEditorValue(bidData.content_text);
        } else {
          setEditorValue(buildTopHtml(content, detail, '', currentProjectName) + buildBottomHtml(content, detail));
        }
        setEditorReady(true);
      }
      finally {
        setIsInitialLoading(false);
      }
    };
    fetchTrades();
  }, []);








  //  const makeBidCoverDataUrl = (bgUrl, logoRoundedUrl, companyName, tradeLabel) =>
  //     new Promise((resolve) => {
  //       const S = 2
  //       const W = 794
  //       const H = 1123
  //       const cv = document.createElement('canvas')
  //       cv.width = W * S
  //       cv.height = H * S
  //       const ctx = cv.getContext('2d')
  //       ctx.scale(S, S)

  //       const overlay = () => {
  //         // Company name top left
  //         ctx.font = 'bold 30px Arial'
  //         ctx.fillStyle = '#fff'
  //         ctx.textBaseline = 'top'
  //         ctx.textAlign = 'left'
  //         ctx.fillText('PrexoAI', 40, 40)

  //         // ── Logo and title start at same Y position ──
  //         const BOTTOM_Y = H - 260   // ← Y where both logo and title start
  //         const LW = 180             // ← increased logo width
  //         const LH = 90              // ← increased logo height
  //         const LEFT_X = 40          // ← left margin for both logo and title

  //         const writeText = () => {
  //   // ── "Bid Invite for" — line 1 ──
  //   ctx.font = 'bold 36px Arial'   // ← change from 44px to 36px
  //   ctx.fillStyle = '#fff'
  //   ctx.textBaseline = 'top'
  //   ctx.textAlign = 'left'
  //   ctx.fillText('Bid Invite for', LEFT_X, BOTTOM_Y + LH + 16)

  //   // ── trade label — line 2 ──
  //   ctx.font = 'bold 36px Arial'   // ← change from 44px to 36px
  //   ctx.fillText(tradeLabel || 'Content', LEFT_X, BOTTOM_Y + LH + 60)

  //   resolve(cv.toDataURL('image/png'))
  // }

  //         if (logoRoundedUrl) {
  //           const li = new Image()
  //           li.crossOrigin = 'anonymous'
  //           li.onload = () => {
  //             ctx.drawImage(li, LEFT_X, BOTTOM_Y, LW, LH)  // ← logo at LEFT_X, BOTTOM_Y
  //             writeText()
  //           }
  //           li.onerror = writeText
  //           li.src = logoRoundedUrl
  //         } else {
  //           writeText()
  //         }
  //       }

  //       if (bgUrl) {
  //         const bg = new Image()
  //         bg.crossOrigin = 'anonymous'
  //         bg.onload = () => { ctx.drawImage(bg, 0, 0, W, H); overlay() }
  //         bg.onerror = () => { ctx.fillStyle = '#0A1A6B'; ctx.fillRect(0, 0, W, H); overlay() }
  //         bg.src = bgUrl
  //       } else {
  //         ctx.fillStyle = '#0A1A6B'
  //         ctx.fillRect(0, 0, W, H)
  //         overlay()
  //       }
  //     })

  // ── Add this helper alongside makeBidHeaderDataUrl ──

  const makeBidCoverDataUrl = (bgUrl, logoRoundedUrl, companyName, tradeLabel) =>
    new Promise((resolve) => {
      const S = 2
      const W = 794
      const H = 1123
      const cv = document.createElement('canvas')
      cv.width = W * S
      cv.height = H * S
      const ctx = cv.getContext('2d')
      ctx.scale(S, S)

      const overlay = () => {
        // ── PrexoAI: padding 98px top, 100px left ──
        ctx.font = 'bold 45px Arial'
        ctx.fillStyle = '#fff'
        ctx.textBaseline = 'top'
        ctx.textAlign = 'left'
        ctx.fillText('PrexoAI', 100, 98)

        // ── Bottom block: top:750px left:90px ──
        const BLOCK_TOP = 750
        const LEFT_X = 90
        const LOGO_W = 157
        const LOGO_H = 79
        const LOGO_MARGIN_BOTTOM = 24    // margin-bottom:35px

        const writeText = () => {
          // ── Title: font-size:40px, margin-top = BLOCK_TOP + LOGO_H + LOGO_MARGIN_BOTTOM ──
          const titleY = BLOCK_TOP + LOGO_H + LOGO_MARGIN_BOTTOM
          ctx.font = 'bold 40px Arial'
          ctx.fillStyle = '#fff'
          ctx.textBaseline = 'top'
          ctx.textAlign = 'left'
          ctx.fillText('Bid Invite for', LEFT_X, titleY)

          // ── Trade label: line 2, ~50px below title (40px font + 10px gap) ──
          // ── Trade label: line 2 ──
          ctx.fillText(tradeLabel || 'Content', LEFT_X, titleY + 44)  // ← change from titleY + 50 to titleY + 44

          resolve(cv.toDataURL('image/png'))
        }

        if (logoRoundedUrl) {
          const li = new Image()
          li.crossOrigin = 'anonymous'
          li.onload = () => {
            const R = 14
            ctx.save()
            ctx.beginPath()
            ctx.moveTo(LEFT_X + R, BLOCK_TOP)
            ctx.lineTo(LEFT_X + LOGO_W - R, BLOCK_TOP)
            ctx.quadraticCurveTo(LEFT_X + LOGO_W, BLOCK_TOP, LEFT_X + LOGO_W, BLOCK_TOP + R)
            ctx.lineTo(LEFT_X + LOGO_W, BLOCK_TOP + LOGO_H - R)
            ctx.quadraticCurveTo(LEFT_X + LOGO_W, BLOCK_TOP + LOGO_H, LEFT_X + LOGO_W - R, BLOCK_TOP + LOGO_H)
            ctx.lineTo(LEFT_X + R, BLOCK_TOP + LOGO_H)
            ctx.quadraticCurveTo(LEFT_X, BLOCK_TOP + LOGO_H, LEFT_X, BLOCK_TOP + LOGO_H - R)
            ctx.lineTo(LEFT_X, BLOCK_TOP + R)
            ctx.quadraticCurveTo(LEFT_X, BLOCK_TOP, LEFT_X + R, BLOCK_TOP)
            ctx.closePath()
            ctx.clip()
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(LEFT_X, BLOCK_TOP, LOGO_W, LOGO_H)
            drawContainedImage(ctx, li, LEFT_X, BLOCK_TOP, LOGO_W, LOGO_H)
            ctx.restore()
            writeText()
          }
          li.onerror = writeText
          li.src = logoRoundedUrl
        } else {
          writeText()
        }
      }

      if (bgUrl) {
        const bg = new Image()
        bg.crossOrigin = 'anonymous'
        bg.onload = () => { ctx.drawImage(bg, 0, 0, W, H); overlay() }
        bg.onerror = () => { ctx.fillStyle = '#0140C1'; ctx.fillRect(0, 0, W, H); overlay() }
        bg.src = bgUrl
      } else {
        ctx.fillStyle = '#0140C1'
        ctx.fillRect(0, 0, W, H)
        overlay()
      }
    })

  //   const makeBidFooterDataUrl = (note) =>
  // new Promise((resolve) => {
  //   const S = 2
  //   const W = 794
  //   const H = 40
  //   const cv = document.createElement('canvas')
  //   cv.width = W * S
  //   cv.height = H * S
  //   const ctx = cv.getContext('2d')
  //   ctx.scale(S, S)

  //   ctx.fillStyle = '#DFDFDF'
  //   ctx.fillRect(0, 0, W, H)

  //   // ── Left: note text only — page number handled by Word paragraph ──
  //   ctx.font = '11px Arial'
  //   ctx.fillStyle = '#585858'
  //   ctx.textBaseline = 'middle'
  //   ctx.textAlign = 'left'
  //   ctx.fillText(note, 20, H / 2)

  //   // ── Right side left blank — page number paragraph renders on top ──

  //   resolve(cv.toDataURL('image/png'))
  // })


  // ── Add this helper function at the same level as makeBidCoverDataUrl ──
  // const makeBidHeaderDataUrl = (logoRoundedUrl, companyName, title) =>
  //   new Promise((resolve) => {
  //     const S = 2
  //     const W = 794
  //     const H = 82
  //     const cv = document.createElement('canvas')
  //     cv.width = W * S
  //     cv.height = H * S
  //     const ctx = cv.getContext('2d')
  //     ctx.scale(S, S)

  //     // Blue background
  //     ctx.fillStyle = '#0052CC'
  //     ctx.fillRect(0, 0, W, H)

  //     const drawTitle = () => {
  //       ctx.font = 'bold 26px Arial'
  //       ctx.fillStyle = '#FFFFFF'
  //       ctx.textBaseline = 'middle'
  //       ctx.textAlign = 'left'
  //       ctx.fillText(title || 'Bid Invite Content', 40, H / 2)
  //       resolve(cv.toDataURL('image/png'))
  //     }

  //     if (logoRoundedUrl) {
  //       const LOGO_W = 140
  // const LOGO_H = 72        // ← fixed height, smaller than band (82px)
  // const LOGO_X = W - LOGO_W - 16
  // const LOGO_Y = 0        

  //       const li = new Image()
  //       li.crossOrigin = 'anonymous'
  //       li.onload = () => {
  //         ctx.drawImage(li, LOGO_X, LOGO_Y, LOGO_W, LOGO_H)
  //         drawTitle()
  //       }
  //       li.onerror = drawTitle
  //       li.src = logoRoundedUrl
  //     } else {
  //       drawTitle()
  //     }
  //   })

  const makeBidFooterDataUrl = (note) =>
    new Promise((resolve) => {
      const S = 2
      const W = 794
      const H = 45           // ← match PDF height (padding 14px top+bottom + text)
      const cv = document.createElement('canvas')
      cv.width = W * S
      cv.height = H * S
      const ctx = cv.getContext('2d')
      ctx.scale(S, S)

      ctx.fillStyle = '#DFDFDF'
      ctx.fillRect(0, 0, W, H)

      ctx.font = '12px Arial'          // ← match PDF font-size:12px (was 11px)
      ctx.fillStyle = '#6b7280'        // ← match PDF color:#6b7280 (was #585858)
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'left'
      ctx.fillText(note, 24, H / 2)   // ← padding-left:24px (was 20px)

      resolve(cv.toDataURL('image/png'))
    })

  const makeBidHeaderDataUrl = (logoRoundedUrl, companyName, title) =>
    new Promise((resolve) => {
      const S = 2
      const W = 794
      const H = 110        // ← match PDF height:90px (was 82)
      const cv = document.createElement('canvas')
      cv.width = W * S
      cv.height = H * S
      const ctx = cv.getContext('2d')
      ctx.scale(S, S)

      ctx.fillStyle = '#0052CC'
      ctx.fillRect(0, 0, W, H)

      const drawTitle = () => {
        ctx.font = 'bold 20px Arial'    // ← match PDF font-size:20px (was 26px)
        ctx.fillStyle = '#FFFFFF'
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'left'
        ctx.fillText(title || 'Bid Invite Content', 28, H / 2)   // ← padding-left:28px
        resolve(cv.toDataURL('image/png'))
      }

      if (logoRoundedUrl) {
        const LOGO_W = 157
        const LOGO_H = 79              // ← exact PDF height:79px
        const LOGO_X = W - LOGO_W - 50  // ← exact PDF margin-right:20px  
        const LOGO_Y = 0               // ← flush top like PDF
        const li = new Image()
        li.crossOrigin = 'anonymous'
        li.onload = () => {
          const R = 12
          ctx.save()
          ctx.beginPath()
          ctx.moveTo(LOGO_X, LOGO_Y)
          ctx.lineTo(LOGO_X + LOGO_W, LOGO_Y)
          ctx.lineTo(LOGO_X + LOGO_W, LOGO_Y + LOGO_H - R)
          ctx.quadraticCurveTo(LOGO_X + LOGO_W, LOGO_Y + LOGO_H, LOGO_X + LOGO_W - R, LOGO_Y + LOGO_H)
          ctx.lineTo(LOGO_X + R, LOGO_Y + LOGO_H)
          ctx.quadraticCurveTo(LOGO_X, LOGO_Y + LOGO_H, LOGO_X, LOGO_Y + LOGO_H - R)
          ctx.lineTo(LOGO_X, LOGO_Y)
          ctx.closePath()
          ctx.fillStyle = '#fff'
          ctx.fill()
          ctx.clip()
          // ── CHANGE: contain scaling instead of stretching ──
          drawContainedImage(ctx, li, LOGO_X, LOGO_Y, LOGO_W, LOGO_H)
          ctx.restore()
          drawTitle()
        }
        li.onerror = drawTitle
        li.src = logoRoundedUrl
      } else {
        drawTitle()
      }
    })

  function makeBlueBandHeader({ title, logoImage, companyName, headerDataUrl }) {
    const PAGE_WIDTH_EMU = PAGE_WIDTH * 914400 / 1440;
    const LOGO_WIDTH_EMU = 157 * 9525;
    const RIGHT_GAP_EMU = 0;  // flush right
    const LOGO_LEFT_EMU = PAGE_WIDTH_EMU - LOGO_WIDTH_EMU - RIGHT_GAP_EMU;

    // ── If canvas header image provided (Mac-safe) ──
    if (headerDataUrl) {
      const headerBase64 = headerDataUrl.split(',')[1]
      const headerUint8 = Uint8Array.from(atob(headerBase64), c => c.charCodeAt(0))
      return new Header({
        children: [
          new Paragraph({
            spacing: { before: 0, after: 0 },
            shading: { type: ShadingType.SOLID, fill: "0140C1", color: "0140C1" },
            children: [
              new ImageRun({
                data: headerUint8,
                type: 'png',
                transformation: { width: 794 + COVER_BLEED_PX * 2, height: 110 },  // ← header band stays 90px
                floating: {
                  zIndex: 10,
                  behindDocument: false,
                  allowOverlap: true,
                  lockAnchor: true,
                  horizontalPosition: { relative: 'page', offset: -COVER_BLEED_EMU },
                  verticalPosition: { relative: 'page', offset: 0 },
                  wrap: { type: 'none' },
                  margins: { top: 0, bottom: 0, left: 0, right: 0 },
                },
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 0, after: 0, line: 1240, lineRule: 'exact' },
            children: [new TextRun({ text: '\u00A0', size: 2 })],
          }),
        ],
      })
    }

    // ── Fallback: paragraph-based (Windows) ──
    return new Header({
      children: [
        new Paragraph({
          shading: { type: ShadingType.SOLID, fill: "0140C1", color: "0140C1" },
          indent: { left: -720, right: -720, firstLine: 0 },
          spacing: { before: 0, after: 0 },
          children: [
            new TextRun({
              text: '\u00A0',
              size: 90,
              color: '0052CC',
              font: DOCX_FONT,
            }),
            new TextRun({
              text: "      " + (title || "Bid Invite Content"),
              bold: true,
              size: 44,
              color: "FFFFFF",
              font: DOCX_FONT,
            }),
            ...(logoImage
              ? [new ImageRun({
                data: logoImage,
                transformation: { width: 157, height: 79 },  // ← exact PDF logo size
                type: "png",
                floating: {
                  zIndex: 10,
                  behindDocument: false,
                  allowOverlap: true,
                  lockAnchor: true,
                  horizontalPosition: { relative: "page", offset: Math.round(LOGO_LEFT_EMU) },
                  verticalPosition: { relative: "page", offset: 0 },
                  wrap: { type: "none" },
                  margins: { top: 0, bottom: 0, left: 0, right: 0 },
                },
              })]
              : [new TextRun({ text: "    " + (companyName || "PrexoAI"), bold: true, size: 28, color: "FFFFFF", font: DOCX_FONT })]),
          ],
        }),
        new Paragraph({
          shading: { type: ShadingType.SOLID, fill: "0052CC", color: "0052CC" },
          indent: { left: -720, right: -720, firstLine: 0 },
          spacing: { before: 0, after: 0, line: 600, lineRule: "exact" },
          children: [new TextRun({ text: "\u00A0", size: 2, color: "0052CC" })],
        }),
      ],
    })
  }

  // function makeGrayFooter(note) {
  //   const grayBg = { type: ShadingType.SOLID, fill: 'DFDFDF', color: 'DFDFDF' }
  //   const bleed = { left: -720, right: -720, firstLine: 0 }

  //   return new Footer({
  //     children: [
  //       // ── Top padding strip ──
  //       new Paragraph({
  //         shading: grayBg,
  //         indent: bleed,
  //         spacing: { before: 0, after: 0, line: 280, lineRule: 'exact' },
  //         children: [new TextRun({ text: '\u00A0', size: 2, color: 'DFDFDF' })],
  //       }),
  //       // ── Main row: note left + page number right ──
  //       new Paragraph({
  //         shading: grayBg,
  //         indent: bleed,
  //         spacing: { before: 0, after: 0 },
  //         tabStops: [{ type: TabStopType.RIGHT, position: PAGE_WIDTH - 500 }],
  //         children: [
  //           new TextRun({ text: '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0' + note, size: 20, color: '585858', font: DOCX_FONT }),
  //           new TextRun({ text: '\tPage ', size: 20, color: '585858', font: DOCX_FONT }),
  //           new TextRun({ children: [PageNumber.CURRENT], size: 20, color: '585858', font: DOCX_FONT }),
  //           new TextRun({ text: '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0', size: 20, color: '585858', font: DOCX_FONT }),
  //         ],
  //       }),
  //       // ── Bottom padding strip ──
  //       new Paragraph({
  //         shading: grayBg,
  //         indent: bleed,
  //         spacing: { before: 0, after: 0, line: 280, lineRule: 'exact' },
  //         children: [new TextRun({ text: '\u00A0', size: 2, color: 'DFDFDF' })],
  //       }),
  //     ],
  //   })
  // }


  function makeGrayFooter(note, footerDataUrl) {
    const grayBg = { type: ShadingType.SOLID, fill: 'DFDFDF', color: 'DFDFDF' }
    const bleed = { left: -720, right: -720, firstLine: 0 }

    if (footerDataUrl) {
      const footerBase64 = footerDataUrl.split(',')[1]
      const footerUint8 = Uint8Array.from(atob(footerBase64), c => c.charCodeAt(0))

      return new Footer({
        children: [
          // ── Canvas image: note text perfectly aligned (Mac-safe) ──
          new Paragraph({
            shading: grayBg,
            indent: bleed,
            spacing: { before: 0, after: 0 },
            children: [
              new ImageRun({
                data: footerUint8,
                type: 'png',
                transformation: { width: 794, height: 40 },
                // NO floating — inline only, stays in footer zone
              }),
            ],
          }),
          // ── Page number: right-aligned, same gray bg, minimal height ──
        ],
      })
    }

    // ── Fallback: paragraph-based (Windows) ──
    return new Footer({
      children: [
        new Paragraph({
          shading: grayBg,
          indent: bleed,
          spacing: { before: 0, after: 0, line: 280, lineRule: 'exact' },
          children: [new TextRun({ text: '\u00A0', size: 2, color: 'DFDFDF' })],
        }),
        new Paragraph({
          shading: grayBg,
          indent: bleed,
          spacing: { before: 0, after: 0 },
          tabStops: [{ type: TabStopType.RIGHT, position: PAGE_WIDTH - 500 }],
          children: [
            new TextRun({ text: '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0' + note, size: 20, color: '585858', font: DOCX_FONT }),
            new TextRun({ text: '\tPage ', size: 20, color: '585858', font: DOCX_FONT }),
            new TextRun({ children: [PageNumber.CURRENT], size: 20, color: '585858', font: DOCX_FONT }),
            new TextRun({ text: '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0', size: 20, color: '585858', font: DOCX_FONT }),
          ],
        }),
        new Paragraph({
          shading: grayBg,
          indent: bleed,
          spacing: { before: 0, after: 0, line: 280, lineRule: 'exact' },
          children: [new TextRun({ text: '\u00A0', size: 2, color: 'DFDFDF' })],
        }),
      ],
    })
  }

  const tradeLabel = tradeOptions.find(
    opt => opt.value === detail?.tradeCategory || opt.value === bidData?.trade_category_id
  )?.label || detail?.tradeCategory || bidData?.trade_category_name || '-';

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const content_text = editorValue;
      console.log(bidId)
      const res = await save_bid_data({ bid_id: bidId || bid_id, content_text });
      if (res?.valid) {
        showToast("success", res?.message);
        setTimeout(() => {
          navigate(`/project/view/${projectUId}/contract-command/bid-invites`);
        }, 1500);
      } else {
        showToast("error", res?.message);
      }
    } catch (err) {
      console.error("Save failed:", err);
      showToast("error", "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };



  const handleExportPDF = async () => {
    setShowExportMenu(false);
    setIsExporting(true);

    try {
      const { coverBg } = await getPdfAssets();

      const resolvedContent =
        bidData?.data?.content ||
        parsedResponse?.content ||
        parsedResponse ||
        {};

      const blob = await GenerateBidPdf({
        companyName: companyName || 'PrexoAI',
        coverBg,
        tradeLabel,
        generatedOn: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        organization_id: localStorage.getItem('organization_id') || '',
        recipientCompany: companyName || '',
        recipientContact: contactName || '',
        recipientEmail: contactEmail || '',
        projectOverview: resolvedContent.project_overview || '',
        scope: resolvedContent.scope || [],
        bidDocuments: resolvedContent.bid_documents || [],
        keyDates: resolvedContent.key_dates || {},
        bidSubmissionRequirements: resolvedContent.bid_submission_requirements || [],
        contactPersonName: contactName || '[Project Manager Name]',
        contactEmail: contactEmail || 'bids@constructionai.com',
        contactPhone: bidData?.contact_phone || bidData?.data?.contact_phone || '(555) 123-4567',
        content_text: editorValue,
      });

      const fileBlob = blob instanceof Blob ? blob : new Blob([blob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bid-Invite-${companyName || 'export'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Export PDF failed:', err);
      showToast('error', 'Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };


  // ── Helper: strip HTML tags and get plain text ────────────────────────────
  const DOCX_FONT = 'Arial';
  const DOCX_SIZE = 20; // 11pt in half-points



  function htmlToDocxChildren(html) {
    const children = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    const run = (text, extra = {}) =>
      new TextRun({ text, font: DOCX_FONT, size: DOCX_SIZE, ...extra });

    const bodyPara = (opts) => new Paragraph({
      ...opts,
      indent: {
        left: 0,
        right: 0,
        ...(opts.indent || {}),
      },
    });

    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return;
      const tag = node.tagName?.toLowerCase();

      if (tag === 'p' || tag === 'h1' || tag === 'h2' || tag === 'h3') {
        const runs = [];
        node.childNodes.forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            if (child.textContent) runs.push(run(child.textContent));
          } else {
            const ct = child.tagName?.toLowerCase();
            if (ct === 'strong' || ct === 'b') runs.push(run(child.textContent, { bold: true }));
            else if (ct === 'em' || ct === 'i') runs.push(run(child.textContent, { italics: true }));
            else if (ct === 'u') runs.push(run(child.textContent, { underline: {} }));
            else if (child.textContent) runs.push(run(child.textContent));
          }
        });

        const cls = node.className || '';
        const style = (node.getAttribute('style') || '').replace(/\s+/g, '').toLowerCase();
        let alignment = AlignmentType.LEFT;
        if (cls.includes('ql-align-center') || style.includes('text-align:center')) alignment = AlignmentType.CENTER;
        else if (cls.includes('ql-align-right') || style.includes('text-align:right')) alignment = AlignmentType.RIGHT;
        else if (cls.includes('ql-align-justify') || style.includes('text-align:justify')) alignment = AlignmentType.BOTH;

        const isHeadingTag = ['h1', 'h2', 'h3'].includes(tag);
        const allChildBold = node.textContent.trim().length > 0 &&
          [...node.childNodes].every(c =>
            c.nodeType === Node.TEXT_NODE
              ? c.textContent.trim() === ''
              : ['strong', 'b'].includes(c.tagName?.toLowerCase())
          );

        if (runs.length === 0 && !node.textContent.trim()) {
          children.push(bodyPara({ children: [new TextRun('')] }));
        } else {
          children.push(bodyPara({
            alignment,
            keepNext: isHeadingTag || allChildBold,
            keepLines: true,
            children: runs.length ? runs : [run(node.textContent)],
          }));
        }
      }

      else if (tag === 'ul') {
        node.querySelectorAll('li').forEach(li => {
          children.push(bodyPara({
            keepLines: true,
            indent: { left: 360, hanging: 180 }, // ← smaller hanging
            children: [
              new TextRun({ text: "\u2022 ", font: DOCX_FONT, size: DOCX_SIZE }),
              run(li.textContent),
            ],
          }));
        });
      }

      else if (tag === 'ol') {
        let olIndex = 1
        node.querySelectorAll('li').forEach(li => {
          children.push(bodyPara({
            keepLines: true,
            indent: { left: 360, hanging: 180 },
            children: [
              new TextRun({ text: `${olIndex++}. `, font: DOCX_FONT, size: DOCX_SIZE }),
              run(li.textContent),
            ],
          }));
        });
      }

      else if (tag === 'div' || tag === 'section') {
        node.childNodes.forEach(child => processNode(child));
      }
    };

    body.childNodes.forEach(node => processNode(node));
    return children;
  }



  async function handleExportWord() {
    setShowExportMenu(false);
    setIsExporting(true);

    try {
      const { coverBg, defaultLogo } = await getPdfAssets();
      const logoDataUrl = await getWordCompatibleLogoDataUrl(logoUrl || defaultLogo);

      let logoDocx = null;
      let coverDataUrl = '';
      let coverUint8 = null;
      let headerLogoCard = null;
      let headerDataUrl = '';

      try {
        // AFTER — contain scaling, full logo visible
        logoDocx = logoDataUrl ? await (async () => {
          const canvas = document.createElement('canvas')
          canvas.width = 264; canvas.height = 104
          const ctx = canvas.getContext('2d')
          const img = new Image()
          await new Promise((res, rej) => {
            img.onload = res; img.onerror = rej
            img.src = logoDataUrl
          })
          const r = 20
          // Keep the cover-logo corners transparent so we avoid a white halo on export.
          ctx.beginPath()
          ctx.moveTo(r, 0); ctx.lineTo(264 - r, 0)
          ctx.quadraticCurveTo(264, 0, 264, r)
          ctx.lineTo(264, 104 - r)
          ctx.quadraticCurveTo(264, 104, 264 - r, 104)
          ctx.lineTo(r, 104)
          ctx.quadraticCurveTo(0, 104, 0, 104 - r)
          ctx.lineTo(0, r)
          ctx.quadraticCurveTo(0, 0, r, 0)
          ctx.closePath(); ctx.clip()
          // ── contain scaling ──
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, 264, 104)
          drawContainedImage(ctx, img, 0, 0, 264, 104)
          return new Promise(res => canvas.toBlob(blob => {
            const reader = new FileReader()
            reader.onloadend = () => res(reader.result)
            reader.readAsDataURL(blob)
          }, 'image/png'))
        })() : null
      } catch (error) {
        console.warn("Bid cover logo generation failed:", error);
        logoDocx = null;
      }

      try {
        coverDataUrl = await makeBidCoverDataUrl(coverBg, logoDocx, companyName, tradeLabel)
        const coverBase64 = coverDataUrl.split(',')[1]
        coverUint8 = coverBase64
          ? Uint8Array.from(atob(coverBase64), c => c.charCodeAt(0))
          : null
      } catch (error) {
        console.warn("Bid cover generation failed:", error);
        coverUint8 = null;
      }

      // Convert logoDataUrl to Uint8Array for Windows fallback path in makeBlueBandHeader
      if (logoDataUrl) {
        try {
          const base64 = logoDataUrl.split(',')[1];
          if (base64) headerLogoCard = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        } catch (e) {
          console.warn("Bid header logo Uint8Array conversion failed:", e);
          headerLogoCard = null;
        }
      }

      try {
        // Pass logoDataUrl directly — makeBidHeaderDataUrl already clips to rounded corners
        headerDataUrl = await makeBidHeaderDataUrl(
          logoDataUrl || null,
          companyName,
          `Bid Invite for ${tradeLabel || 'Content'}`
        )
      } catch (error) {
        console.warn("Bid header generation failed:", error);
        headerDataUrl = '';
      }

      // ── ADDED: Build footer canvas for Mac ──
      const footerDataUrl = await makeBidFooterDataUrl(
        'This report is powered by PrexoAI.'
      )

      // ── Cover paragraph ──
      const coverPara = new Paragraph({
        spacing: { before: 0, after: 0 },
        shading: { type: ShadingType.SOLID, fill: COVER_PAGE_BG, color: COVER_PAGE_BG },
        children: coverUint8 ? [
          new ImageRun({
            data: coverUint8,
            type: 'png',
            transformation: { width: 794 + COVER_BLEED_PX * 2, height: 1123 + COVER_BLEED_PX * 2 },
            floating: {
              zIndex: 1,
              behindDocument: true,
              allowOverlap: true,
              layoutInCell: false,
              lockAnchor: true,
              horizontalPosition: { relative: 'page', offset: -COVER_BLEED_EMU },
              verticalPosition: { relative: 'page', offset: -COVER_BLEED_EMU },
              wrap: { type: 'none', side: 'bothSides' },
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
            },
          }),
        ] : [
          new TextRun({ text: companyName || 'PrexoAI', bold: true, size: 52, color: 'FFFFFF', font: DOCX_FONT })
        ],
      })

      const bodyChildren = htmlToDocxChildren(editorValue)
      const cardWrappedChildren = [...bodyChildren]
      const HEADER_H = Math.round(110 * 1440 / 96)   // 
      const FOOTER_H = Math.round(45 * 1440 / 96)   // = 675 twips

      const doc = new Document({
        background: { color: "F8FAFC" },
        numbering: {
          config: [{
            reference: "default-numbering",
            levels: [{
              level: 0, format: "decimal", text: "%1.",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            }],
          }],
        },
        styles: {
          default: { document: { run: { font: DOCX_FONT, size: DOCX_SIZE } } },
        },
        sections: [
          // ── Cover page ──
          {
            properties: {
              type: SectionType.NEXT_PAGE,
              page: {
                size: { width: PAGE_WIDTH, height: 16838 },
                margin: { top: 0, right: 0, bottom: 0, left: 0 },
                pageNumbers: { start: 0, formatType: "decimal" },
              },
            },
            children: [coverPara],
          },

          // ── Content page ──
          {
            properties: {
              type: SectionType.NEXT_PAGE,
              page: {
                size: { width: PAGE_WIDTH, height: 16838 },

                margin: {
                  top: HEADER_H,      // ← 1350
                  right: MARGIN_H,
                  bottom: FOOTER_H,   // ← 675
                  left: MARGIN_H,
                  header: 0,
                  footer: 0,
                },
                pageNumbers: { start: 1, formatType: "decimal" },
              },
            },
            headers: {
              default: makeBlueBandHeader({
                title: `Bid Invite for ${tradeLabel || 'Content'}`,
                logoImage: headerLogoCard,
                headerDataUrl,
                companyName,
              }),
            },
            // ── CHANGED: pass footerDataUrl for Mac ──
            //          footers: {
            //   default: makeGrayFooter(
            //     "This report is powered by PrexoAI. All figures are estimates based on configured parameters."
            //   ),
            // },
            footers: {
              default: makeGrayFooter(
                "This report is powered by PrexoAI. All figures are estimates based on configured parameters.",
                footerDataUrl
              ),
            },
            children: cardWrappedChildren,
          },
        ],
      })

      const blob = await Packer.toBlob(doc)
      saveAs(blob, `Bid-Invite-${companyName || "export"}.docx`)

    } catch (err) {
      console.error("Bid export Word failed:", err)
      showToast("error", "Failed to export Word. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleRegenerateClick = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const popupWidth = 320;
      const popupHeight = 280; // approximate popup height

      setPopupPos({
        top: rect.top - popupHeight - 8,  // ← above the button
        left: rect.right - popupWidth,
      });
    }
    if (!isRedrafting) setInstruction('');
    setShowPopup(prev => !prev);
  };

  const handleEditDetails = async () => {
    try {
      const resolvedUuid = bid_uuid || bidData?.bid_uuid || bidData?.data?.bid_uuid;
      if (!resolvedUuid) {
        showToast("error", "Bid UUID is missing. Please go back and try again.");
        return;
      }
      const res = await draft_bid_detail({ bid_uuid: resolvedUuid });
      console.log(res)
      if (res?.valid) {
        navigate(
          `/project/view/${projectUId}/contract-command/bid-invites/update/${bidUuid}`,
          { state: { isEdit: true } }
        );
      } else {
        showToast("error", res?.message);
      }
    } catch (err) {
      console.error("Failed to fetch bid detail:", err);
      showToast("error", "Something went wrong. Please try again.");
    }
  };

  const handleRedraft = async () => {
    setIsRedrafting(true);
    try {
      const res = await draft_bid_data({
        bid_id: bidId || bid_id,
        context: instruction,
      });
      if (res?.valid) {
        const newContent = res?.data?.content || {};
        const tradeLabel = tradeOptions.find(opt => opt.value === detail?.tradeCategory)?.label || detail?.tradeCategory || '';
        setEditorValue(buildTopHtml(newContent, detail, tradeLabel, currentProjectName) + buildBottomHtml(newContent, detail));
        showToast("success", res?.message);
      } else {
        showToast("error", res?.message);
      }
      setShowPopup(false);
      setInstruction('');
    } catch (err) {
      console.error('Regenerate failed:', err);
      showToast("error", "Regeneration failed. Please try again.");
    } finally {
      setIsRedrafting(false);
    }
  };

  return (
    <div>
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

      {(isSaving || isInitialLoading) && <FullPageLoader />}

      <div className='tw-flex tw-justify-between tw-items-center tw-pr-8'>
        <NavigationHeader
          title='Bid Invites/'
          subTitle={`Bid Invite for ${companyName} • ${tradeLabel}`}
          navigation={`/project/view/${projectUId}/contract-command/bid-invites`}
        />

        {/* Export Dropdown */}
        {permissions?.export && <div className='tw-relative' ref={exportRef}>
          <button
            onClick={() => !isExporting && setShowExportMenu(prev => !prev)}
            disabled={isExporting}

            className='group tw-w-[160px] tw-border tw-bg-[#0140c1] tw-font-[600] tw-border-[#0140c1] tw-rounded-[5px] tw-flex tw-gap-2 tw-justify-center tw-items-center tw-py-2 tw-text-white
            tw-transition-all tw-duration-300 tw-ease-in-out
            hover:tw-bg-[#1b44c4] hover:tw-shadow-lg hover:tw-shadow-blue-200/50
            hover:tw-scale-[1.03] hover:-tw-translate-y-[1px]
            active:tw-scale-[0.98]
            disabled:tw-opacity-60 disabled:tw-cursor-not-allowed disabled:tw-scale-100 disabled:tw-translate-y-0 disabled:tw-shadow-none'
          >
            {isExporting ? (
              <>
                <svg className='tw-animate-spin tw-w-4 tw-h-4' viewBox='0 0 24 24' fill='none'>
                  <circle className='tw-opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path className='tw-opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8z'></path>
                </svg>
                <span>Exporting…</span>
              </>
            ) : (
              <>
                <i className='icon-Export-PDF !tw-font-[400]'></i>
                <span className="tw-text-[13px]">Export Bid Invite</span>
                <i className={`icon-Down tw-text-[11px] tw-transition-transform tw-duration-200 ${showExportMenu ? 'tw-rotate-180' : ''}`}></i>
              </>
            )}
          </button>

          {showExportMenu && !isExporting && (
            <div className='tw-absolute tw-right-0 tw-top-[calc(100%+6px)] tw-w-[190px] tw-bg-white tw-border tw-border-[#e0e0e0] tw-rounded-[8px] tw-shadow-lg tw-z-[999] tw-overflow-hidden'>
              <button
                onClick={handleExportPDF}
                className='tw-flex tw-items-center tw-gap-3 tw-w-full tw-px-4 tw-py-3 hover:tw-bg-[#f5f5f5] tw-transition-colors'
              >
                <i className='icon-pdf tw-text-[#dc2626] tw-text-[23px]'></i>
                <div className='tw-flex tw-flex-col tw-items-start'>
                  <span className='tw-text-[13px] tw-font-[500] tw-text-[#333]'>Export as PDF</span>
                  <span className='tw-text-[11px] tw-text-[#333]'>Ready for submission</span>
                </div>
              </button>

              <div className='tw-h-[1px] tw-bg-[#f0f0f0]'></div>

              <button
                onClick={handleExportWord}
                className='tw-flex tw-items-center tw-gap-3 tw-w-full tw-px-4 tw-py-3 hover:tw-bg-[#f5f5f5] tw-transition-colors'
              >
                <i className='icon-Document tw-text-[#1d4ed8] tw-text-[23px]'></i>
                <div className='tw-flex tw-flex-col tw-items-start'>
                  <span className='tw-text-[13px] tw-font-[500] tw-text-[#333]'>Export as Word</span>
                  <span className='tw-text-[11px] tw-text-[#333]'>Editable .docx format</span>
                </div>
              </button>
            </div>
          )}
        </div>}
      </div>

      <div className='tw-pl-12 tw-pr-8 tw-flex tw-flex-col tw-gap-6 tw-pb-6'>

        {/* Success Banner */}
        <div className='tw-bg-[#f3fff9] tw-rounded-[10px] tw-mt-4 tw-border tw-border-[#2a9d52]'>
          <div className='tw-flex tw-gap-2 tw-items-center tw-px-4 tw-py-2'>
            <div className='tw-px-2 tw-py-1 tw-bg-[#dfe] tw-rounded-[10px]'>
              <i className='icon-Processed tw-text-[#2a9d52] tw-font-[400] tw-text-[30px]'></i>
            </div>
            <span className='tw-text-[#1e293b] tw-text-[14px]'>
              Your bid invite has been generated successfully. Review and edit the content below, then save or export when ready.
            </span>
          </div>
        </div>

        {/* Recipient Details */}
        <div className='tw-p-4 tw-bg-[#fff] tw-rounded-[15px] tw-border tw-border-[#e0e0e0] tw-flex tw-flex-col tw-gap-4'>
          <div className='tw-flex tw-gap-6 tw-items-center'>
            <div className='tw-bg-[#dee9ff] tw-rounded-[6px] tw-p-2'>
              <i className='icon-Concrete tw-text-[#0140c1] tw-text-[26px] tw-font-[500]'></i>
            </div>
            <span className='tw-text-[16px] tw-font-bold tw-text-[#333]'>Recipient Details</span>
          </div>
          <div>
            <div className='tw-grid tw-grid-cols-4 tw-text-start tw-text-[#8f8e8e] tw-text-[13px]'>
              <span>Company</span>
              <span>Contact</span>
              <span>Email</span>
              <span>Trade</span>
            </div>
            <div className='tw-grid tw-grid-cols-4 tw-text-start tw-text-[#333] tw-text-[13px] tw-font-[600] tw-mt-1'>
              <span>{companyName || '-'}</span>
              <span>{contactName || '-'}</span>
              <span>{contactEmail || '-'}</span>
              <span className='tw-border tw-rounded-[30px] tw-w-fit tw-text-center tw-p-1 tw-px-2 tw-text-[14px]'>
                {tradeLabel || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Editor Section */}
        <div className='quill-container' style={{ border: '1px solid #e0e0e0', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>

          {/* Header */}
          <div style={{ borderBottom: '1px solid #e0e0e0' }}>
            <div className="tw-p-4 tw-flex tw-gap-4 tw-items-center">
              <div className="tw-bg-[#dee9ff] tw-rounded-[10px] tw-p-2">
                <i className="icon-Document-analysis tw-text-[26px] tw-text-[#1e4ed8]"></i>
              </div>
              <div className="tw-flex tw-flex-col">
                <span className="tw-text-[15px] tw-font-bold">Bid Invite Content</span>
                <span className="tw-text-[13px] tw-text-[#555]">
                  Edit the bid invite content below before saving or exporting
                </span>
              </div>
            </div>
          </div>

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
  /* Hide Quill's native tooltip; custom portal modal handles links */
.quill-container { position: relative; }
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
  .quill-container .ql-editor[contenteditable="false"] {
  background-color: #f8fafc !important;
  cursor: not-allowed !important;
}
.quill-container .ql-toolbar.ql-snow:has(+ * [contenteditable="false"]) {
  opacity: 0.4;
  pointer-events: none;
}
        `}</style>


          {/* Single editor */}
          <div className="bid-editor" style={{ margin: '16px 24px', border: '1px solid #e0e0e0', borderRadius: '6px', paddingBottom: '16px' }}>
            {editorReady && (
              <ReactQuill
                theme="snow"
                ref={quillRef}
                value={editorValue}
               onChange={isMarkAsCompleted ? undefined : setEditorValue}
               readOnly={isMarkAsCompleted}    
                modules={modulesMain}
                formats={formats}
                className={isMarkAsCompleted ? "tw-opacity-70 tw-cursor-not-allowed" : ""}
              />
            )}
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className='tw-flex tw-justify-between tw-pb-6'>
          {permissions?.edit && <button
            onClick={isMarkAsCompleted ? undefined : handleEditDetails}
            disabled={isMarkAsCompleted}
            className={`group tw-rounded-[8px] tw-text-[15px] tw-px-4 tw-py-2 tw-flex tw-gap-3 tw-items-center tw-font-[500] tw-whitespace-nowrap
      tw-transition-all tw-duration-300 tw-ease-in-out
      ${isMarkAsCompleted
                ? "tw-bg-[#e5e7eb] tw-text-gray-400 tw-cursor-not-allowed tw-opacity-60"
                : "tw-bg-[#dedede] tw-text-[#1e293b] hover:tw-bg-[#d0d0d0] hover:tw-shadow-lg hover:tw-shadow-gray-300/50 hover:tw-scale-[1.03] hover:-tw-translate-y-[1px] active:tw-scale-[0.98]"
              }`}
          >
            <i className='icon-Back'></i>
            Edit Details & Regenerate
          </button>}

          <div className='tw-flex tw-items-center tw-gap-4'>
            {/* Regenerate with AI button + popup */}
            {permissions?.edit && <div className='tw-relative'>
              <button
                ref={btnRef}
                onClick={isMarkAsCompleted ? undefined : handleRegenerateClick}
                disabled={isMarkAsCompleted}
                className={`group tw-px-6 tw-py-2 tw-text-[15px] tw-flex tw-gap-2 tw-items-center tw-border tw-rounded-[5px] tw-font-[500] tw-whitespace-nowrap
        tw-transition-all tw-duration-300 tw-ease-in-out
        ${isMarkAsCompleted
                    ? "tw-bg-gray-100 tw-text-gray-400 tw-border-gray-300 tw-cursor-not-allowed tw-opacity-60"
                    : "tw-bg-[#fff] tw-text-[#0140c1] tw-border-[#0140c1] hover:tw-bg-[#eff6ff] hover:tw-shadow-lg hover:tw-shadow-blue-200/50 hover:tw-scale-[1.03] hover:-tw-translate-y-[1px] active:tw-scale-[0.98]"
                  }`}
              >
                <i className='icon-AI-fill tw-text-[25px]'></i>
                Regenerate with AI
              </button>

              {showPopup && !isMarkAsCompleted && ReactDOM.createPortal(
                <div
                  ref={popupRef}
                  onClick={e => e.stopPropagation()}
                  style={{ position: 'fixed', top: popupPos.top, left: popupPos.left, zIndex: 999999, width: '320px' }}
                  className='tw-bg-white tw-rounded-xl tw-shadow-2xl tw-border tw-border-gray-100 tw-p-5'
                >
                  <div className='tw-flex tw-items-center tw-gap-2 tw-mb-2'>
                    <i className='icon-AI-fill tw-text-[#4488ff] tw-text-[16px]'></i>
                    <h3 className='tw-text-[14px] tw-font-bold tw-text-[#7794d8]'>Re-draft Bid Invite</h3>
                  </div>
                  <p className='tw-text-[12px] tw-text-[#64748b] tw-mb-3 tw-leading-relaxed'>
                    Add instructions for the AI to regenerate this bid invite.
                  </p>
                  <textarea
                    value={instruction}
                    onChange={e => setInstruction(e.target.value)}
                    placeholder="e.g., Make it more formal, add specific project requirements..."
                    rows={5}
                    className='tw-w-full tw-border-2 tw-border-[#4488ff] tw-rounded-lg tw-px-3 tw-py-2.5 tw-text-[13px] tw-text-[#1e293b] tw-resize-none focus:tw-outline-none tw-placeholder-gray-300'
                  />
                  <div className='tw-flex tw-justify-between tw-items-center tw-mt-4 tw-gap-3'>
                    <button
                      onClick={() => { setShowPopup(false); if (!isRedrafting) setInstruction(''); }}
                      disabled={isRedrafting}
                      className='tw-flex-1 tw-py-2 tw-rounded-lg tw-border tw-border-gray-200 tw-text-[13px] tw-font-medium tw-text-[#475569] hover:tw-bg-gray-50 tw-transition-colors disabled:tw-opacity-50'
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRedraft}
                      disabled={!instruction.trim() || isRedrafting}
                      className='tw-flex-1 tw-py-2 tw-rounded-lg tw-bg-[#0140c1] tw-text-white tw-text-[13px] tw-font-semibold tw-inline-flex tw-items-center tw-justify-center tw-gap-1.5 hover:tw-bg-blue-800 tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed'
                    >
                      {isRedrafting ? (
                        <>
                          <svg className='tw-animate-spin tw-w-3 tw-h-3' viewBox='0 0 24 24' fill='none'>
                            <circle className='tw-opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                            <path className='tw-opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8z'></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <i className='icon-AI-fill tw-text-[12px]'></i>
                          Re-draft Bid
                        </>
                      )}
                    </button>
                  </div>
                </div>,
                document.body
              )}
            </div>}

            {permissions?.edit && <button
              onClick={handleSave}
              disabled={isSaving || isMarkAsCompleted}   // ← add isMarkAsCompleted
              className={`group tw-px-6 tw-py-2 tw-rounded-[5px] tw-text-[15px] tw-text-white tw-font-[500] tw-whitespace-nowrap
      tw-transition-all tw-duration-300 tw-ease-in-out
      ${isSaving || isMarkAsCompleted
                  ? "tw-bg-[#94a3b8] tw-cursor-not-allowed tw-opacity-60"
                  : "tw-bg-[#0140c1] hover:tw-bg-[#1b44c4] hover:tw-shadow-lg hover:tw-shadow-blue-200/50 hover:tw-scale-[1.03] hover:-tw-translate-y-[1px] active:tw-scale-[0.98]"
                }`}
            >
              {isSaving ? 'Saving...' : 'Save Bid Invite'}
            </button>}
          </div>
        </div>
      </div>
    </div>
  );
};



export default BidInviteForCompanyLayout;
