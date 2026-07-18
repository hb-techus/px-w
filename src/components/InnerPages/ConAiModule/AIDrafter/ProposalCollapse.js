import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";

import { ProposalDrafterView, GetProposalDrafterDetail, SaveEditor } from "../../../../services/techus-services";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import { useParams } from "react-router-dom";
import { useEstimation } from "../../../context/EstimationContext";
// ─── CollapsibleSection ───────────────────────────────────────────────────────
function CollapsibleSection({
  title,
  icon,
  badge,
  badges,
  headerRight,
  defaultExpanded = false,
  defaultOpen = false,
  children,
  headerBg = "tw-bg-white",
  forceOpen,
}) {
  const initialOpen = defaultExpanded ?? defaultOpen;
  const [open, setOpen] = React.useState(initialOpen);

  React.useEffect(() => {
    if (forceOpen === true) { setOpen(true); return; }
    if (forceOpen === false) { setOpen(false); return; }
    setOpen(initialOpen);
  }, [defaultExpanded, defaultOpen, forceOpen, initialOpen]);

  return (
    <div className="tw-border tw-border-gray-200 tw-rounded-xl tw-overflow-hidden tw-mb-4 tw-shadow-sm">
      <div
        className={`${headerBg} tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-4 tw-cursor-pointer tw-transition-all hover:tw-bg-gray-50`}
        onClick={() => setOpen((p) => !p)}
      >
        <div className="tw-flex tw-items-center tw-gap-3 tw-flex-1 tw-min-w-0">
          <div className="tw-flex-shrink-0">{icon}</div>
          <span
            className="tw-text-[14px] tw-font-bold tw-text-slate-800 tw-leading-tight tw-line-clamp-2 tw-break-words"
            title={title}
          >
            {title}
          </span>
          <div className="tw-flex-shrink-0">{badge ?? badges}</div>
        </div>

        <div className="tw-flex tw-items-center tw-gap-4 tw-ml-4 tw-flex-shrink-0">
          <div className="tw-flex tw-items-center tw-gap-3">{headerRight}</div>
          <div className="tw-flex tw-items-center tw-justify-center tw-w-[30px] tw-h-[30px] tw-border tw-border-gray-200 tw-rounded-lg tw-bg-white tw-shadow-sm tw-transition-transform">
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              style={{
                transform: open ? "rotate(0deg)" : "rotate(180deg)",
                transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <path d="M18 15l-6-6-6 6" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      <div
        style={{
          maxHeight: open ? "2000px" : "0",
          opacity: open ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 0.4s ease-in-out, opacity 0.3s ease",
        }}
      >
        <div className="tw-border-t tw-border-gray-100 tw-p-0 tw-bg-white">{children}</div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const plainTextToHtml = (text) => {
  if (!text) return "";
  if (/^\s*<(p|br|ul|ol|li|strong|em|h[1-6])\b/i.test(text)) return text;

  const escapeHtml = (val) =>
    val.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const formatInline = (val) =>
    escapeHtml(val)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      .replace(/_(.+?)_/g, "<em>$1</em>");

  const blocks = text.split(/\n\n+/).filter((b) => b.trim());

  const rendered = blocks.map((block) => {
    const lines = block.trim().split("\n");
    const output = [];
    let pLines = [];
    let ulLines = [];

    const flushP = () => { if (!pLines.length) return; output.push(`<p>${pLines.join("<br>")}</p>`); pLines = []; };
    const flushUl = () => { if (!ulLines.length) return; output.push(`<ul>${ulLines.map(l => `<li>${l}</li>`).join("")}</ul>`); ulLines = []; };

    lines.forEach((line) => {
      const t = line.trim();
      if (!t) return;

      const hMatch = t.match(/^(#{1,6})\s+(.+)$/);
      if (hMatch) {
        flushP(); flushUl();
        const lvl = Math.min(hMatch[1].length, 6);
        output.push(`<h${lvl}>${formatInline(hMatch[2])}</h${lvl}>`);
        return;
      }

      const bMatch = t.match(/^[-*]\s+(.*)/);
      if (bMatch) { flushP(); ulLines.push(formatInline(bMatch[1])); return; }

      flushUl();
      pLines.push(formatInline(t));
    });

    flushP(); flushUl();
    return output.join("");
  });

  return rendered.join("<p><br></p>");
};

const AUTO_SAVE_DELAY = 3000;

// ─── Shimmer ──────────────────────────────────────────────────────────────────
const SectionShimmer = () => (
  <div className="tw-p-4 tw-animate-pulse">
    <div className="tw-h-3 tw-bg-gray-200 tw-rounded tw-w-3/4 tw-mb-3" />
    <div className="tw-h-3 tw-bg-gray-200 tw-rounded tw-w-full tw-mb-3" />
    <div className="tw-h-3 tw-bg-gray-200 tw-rounded tw-w-5/6 tw-mb-3" />
    <div className="tw-h-3 tw-bg-gray-200 tw-rounded tw-w-2/3 tw-mb-3" />
    <div className="tw-h-3 tw-bg-gray-200 tw-rounded tw-w-full" />
  </div>
);

// ─── Custom Link Modal (Portal) ───────────────────────────────────────────────
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

  // Focus URL input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
      {/* Header */}
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
        <button
          onClick={onClose}
          className="tw-text-gray-400 hover:tw-text-gray-600 tw-transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Display Text */}
      <div className="tw-mb-3">
        <label className="tw-block tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-wide tw-mb-1.5">
          Display Text
        </label>
        <input
          type="text"
          value={linkText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Link text (optional)"
          className="tw-w-full tw-border tw-border-gray-200 tw-rounded-lg tw-px-3 tw-py-2 tw-text-[13px] tw-text-[#1e293b] focus:tw-outline-none focus:tw-border-[#4488ff] tw-transition-colors"
        />
      </div>

      {/* URL */}
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
          className="tw-w-full tw-border-2 tw-border-[#4488ff] tw-rounded-lg tw-px-3 tw-py-2 tw-text-[13px] tw-text-[#1e293b] focus:tw-outline-none tw-transition-colors"
        />
      </div>

      {/* Hint banner */}
      <div className="tw-flex tw-items-center tw-gap-1.5 tw-mb-4 tw-bg-blue-50 tw-rounded-lg tw-px-3 tw-py-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="tw-flex-shrink-0">
          <circle cx="12" cy="12" r="10" stroke="#4488ff" strokeWidth="2" />
          <path d="M12 8v4M12 16h.01" stroke="#4488ff" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p className="tw-text-[11px] tw-text-[#4488ff]">
          <strong>Click</strong> a link to edit · <strong>Ctrl+Click</strong> to open in new tab
        </p>
      </div>

      {/* Actions */}
      <div className="tw-flex tw-items-center tw-gap-2">
        {isEditingExisting && (
          <button
            onClick={onRemove}
            className="tw-px-3 tw-py-2 tw-rounded-lg tw-border tw-border-red-200 tw-text-[12px] tw-font-medium tw-text-red-500 hover:tw-bg-red-50 tw-transition-colors tw-flex tw-items-center tw-gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Remove
          </button>
        )}
        <button
          onClick={onClose}
          className="tw-flex-1 tw-py-2 tw-rounded-lg tw-border tw-border-gray-200 tw-text-[13px] tw-font-medium tw-text-[#475569] hover:tw-bg-gray-50 tw-transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!linkUrl.trim()}
          className="tw-flex-1 tw-py-2 tw-rounded-lg tw-bg-[#0140c1] tw-text-white tw-text-[13px] tw-font-semibold tw-inline-flex tw-items-center tw-justify-center tw-gap-1.5 hover:tw-bg-blue-800 tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
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

// ─── Main Component ───────────────────────────────────────────────────────────
const ProposalSectionItem = ({
  title,
  content = "",
  loaded = false,
  defaultExpanded = false,
  onContentUpdate,
  allSections = [],
  encryptedDrafterId = "",
}) => {
  const { drafter_uuid } = useParams();

  const [value, setValue] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const [isRedrafting, setIsRedrafting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // ── Link modal state ───────────────────────────────────────────────────────
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkModalPos, setLinkModalPos] = useState({ top: 0, left: 0 });
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const savedRangeRef = useRef(null);
  const { isMarkAsCompleted } = useEstimation();
  const hasInitialized = useRef(false);
  const [saveStatus, setSaveStatus] = useState("idle");

  const btnRef = useRef(null);
  const popupRef = useRef(null);
  const quillRef = useRef(null);

  const autoSaveTimer = useRef(null);
  const isFirstLoad = useRef(true);
  const prevContentRef = useRef("");
  const latestValueRef = useRef("");
  const isUserEdited = useRef(false);
  const isPastingRef = useRef(false);
  const pasteScrollTopRef = useRef(null);
  const pasteResetTimerRef = useRef(null);
  const pendingScrollRestoreRef = useRef(null);
  const pendingSelectionRestoreRef = useRef(null);
  const latestSelectionRef = useRef(null);

  const getScrollContainer = () =>
    quillRef.current?.getEditor()?.root?.closest(".ql-container");

  // ── Load content ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!content) return;
    if (isUserEdited.current) return;
    if (content === prevContentRef.current) return;

    prevContentRef.current = content;
    const looksLikeHtml = /<[a-z][\s\S]*>/i.test(content);
    const html = looksLikeHtml ? content : plainTextToHtml(content);

    const quill = quillRef.current?.getEditor();
    const scrollContainer = getScrollContainer();
    const scrollTop = scrollContainer?.scrollTop ?? 0;
    const selection = quill?.getSelection();

    setValue(html);
    latestValueRef.current = html;

    requestAnimationFrame(() => {
      if (scrollContainer) scrollContainer.scrollTop = scrollTop;
      if (selection) quill?.setSelection(selection.index, selection.length, "silent");
    });
  }, [content]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      if (pasteResetTimerRef.current) clearTimeout(pasteResetTimerRef.current);
    };
  }, []);

  // ── Close AI popup on outside click / scroll ──────────────────────────────
  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setShowPopup(false);
    };
    const onScroll = (e) => {
      if (popupRef.current && popupRef.current.contains(e.target)) return;
      setShowPopup(false);
    };
    if (showPopup) {
      document.addEventListener("mousedown", onClickOutside);
      window.addEventListener("scroll", onScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [showPopup]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      setIsExpanded(defaultExpanded);
    }
  }, []);

  // ── Editor events: selection, text-change, paste, link-click ──────────────
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    // Auto-scroll to cursor
    const handleSelectionChange = (range) => {
      latestSelectionRef.current = range;
      if (!range || isPastingRef.current) return;

      const scrollContainer = quill.root.closest(".ql-container");
      if (!scrollContainer) return;

      const bounds = quill.getBounds(range.index, range.length);
      if (!bounds) return;

      const containerHeight = scrollContainer.clientHeight;
      if (bounds.bottom > containerHeight - 20)
        scrollContainer.scrollTop += bounds.bottom - containerHeight + 30;
      else if (bounds.top < 0)
        scrollContainer.scrollTop += bounds.top - 10;
    };

    // Before
    // const handleTextChange = (_delta, _oldDelta, source) => {
    //   if (source === "silent" || isPastingRef.current) return;
    //   const sel = quill.getSelection();
    //   if (sel) handleSelectionChange(sel);
    // };

    // ✅ AFTER
    const handleTextChange = (_delta, _oldDelta, source) => {
      if (source !== "user") return;
      requestAnimationFrame(() => {
        const sel = quill.getSelection();
        if (sel) handleSelectionChange(sel);
      });
    };

    // Paste scroll-lock
    // const handlePaste = () => {
    //   const scrollContainer     = getScrollContainer();
    //   pasteScrollTopRef.current = scrollContainer?.scrollTop ?? 0;
    //   isPastingRef.current      = true;

    //   if (pasteResetTimerRef.current) clearTimeout(pasteResetTimerRef.current);

    //   requestAnimationFrame(() => {
    //     requestAnimationFrame(() => {
    //       if (scrollContainer && pasteScrollTopRef.current !== null)
    //         scrollContainer.scrollTop = pasteScrollTopRef.current;

    //       const pastedSelection = quill?.getSelection() ?? latestSelectionRef.current;
    //       if (pastedSelection) {
    //         latestSelectionRef.current         = pastedSelection;
    //         pendingSelectionRestoreRef.current = pastedSelection;
    //       }
    //     });
    //   });

    //   pasteResetTimerRef.current = setTimeout(() => {
    //     isPastingRef.current      = false;
    //     pasteScrollTopRef.current = null;
    //   }, 300);
    // };

    // ── Link click handler ─────────────────────────────────────────────────
    // Single click  → open Edit Link modal (pre-filled with existing URL)
    // Ctrl/Cmd+Click → open URL in new tab directly
    const handleLinkClick = (e) => {
      const anchor = e.target.closest("a");
      if (!anchor) return;

      e.preventDefault();
      e.stopPropagation();

      const url = anchor.getAttribute("href");
      if (!url) return;

      // Ctrl+Click or Cmd+Click → navigate to URL in new tab
      if (e.ctrlKey || e.metaKey) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      // Single click → open Edit Link modal
      const quillInstance = quillRef.current?.getEditor();
      if (!quillInstance) return;

      try {
        const blot = Quill.find(anchor);
        if (blot) {
          const index = quillInstance.getIndex(blot);
          const length = typeof blot.length === "function" ? blot.length() : anchor.textContent.length;
          quillInstance.setSelection(index, length, "silent");
          latestSelectionRef.current = { index, length };
          openLinkModal(quillInstance, { index, length });
        } else {
          // Fallback: use last known selection
          const range = quillInstance.getSelection() ?? latestSelectionRef.current ?? { index: 0, length: 0 };
          openLinkModal(quillInstance, range);
        }
      } catch {
        const range = quillInstance.getSelection() ?? latestSelectionRef.current ?? { index: 0, length: 0 };
        openLinkModal(quillInstance, range);
      }
    };

    quill.on("selection-change", handleSelectionChange);
    quill.on("text-change", handleTextChange);
    //quill.root.addEventListener("paste", handlePaste);
    quill.root.addEventListener("click", handleLinkClick);

    return () => {
      quill.off("selection-change", handleSelectionChange);
      quill.off("text-change", handleTextChange);
      //quill.root.removeEventListener("paste", handlePaste);
      quill.root.removeEventListener("click", handleLinkClick);
    };
  }, [loaded]);

  // ── Auto-save ──────────────────────────────────────────────────────────────
  const triggerAutoSave = (currentValue) => {
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    setSaveStatus("pending");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => performSave(currentValue), AUTO_SAVE_DELAY);
  };

  const performSave = async () => {
    setSaveStatus("saving");
    try {
      let idToUse = encryptedDrafterId;
      if (!idToUse) {
        const detailRaw = await GetProposalDrafterDetail({ drafter_uuid });
        const detail = typeof detailRaw === "string" ? JSON.parse(detailRaw) : detailRaw;
        if (!detail?.valid || !detail?.data?.drafter_id) { setSaveStatus("error"); return; }
        idToUse = detail.data.drafter_id;
      }

      const contentMap = {};
      allSections.forEach((sec) => {
        const secTitle = typeof sec === "string" ? sec : sec.title;
        const secContent = typeof sec === "string" ? "" : (sec.content || "");
        if (secTitle === title) {
          contentMap[secTitle] = latestValueRef.current;
        } else {
          const looksLikeHtml = /<[a-z][\s\S]*>/i.test(secContent);
          contentMap[secTitle] = looksLikeHtml ? secContent : plainTextToHtml(secContent);
        }
      });

      const raw = await SaveEditor({ drafter_id: idToUse, content: contentMap });
      const response = typeof raw === "string" ? JSON.parse(raw) : raw;

      if (response?.valid) {
        if (onContentUpdate) onContentUpdate(title, latestValueRef.current);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      console.error("Auto-save error:", err);
      setSaveStatus("error");
    }
  };

  const handleChange = (newValue, _delta, _source, editor) => {
    isUserEdited.current = true;

    const scrollContainer = getScrollContainer();
    const scrollTop = isPastingRef.current
      ? (pasteScrollTopRef.current ?? scrollContainer?.scrollTop ?? 0)
      : (scrollContainer?.scrollTop ?? 0);
    const quill = quillRef.current?.getEditor();
    const selection = quill?.getSelection() ?? editor?.getSelection?.() ?? latestSelectionRef.current;

    pendingScrollRestoreRef.current = scrollTop;
    pendingSelectionRestoreRef.current = selection || null;
    latestSelectionRef.current = selection || latestSelectionRef.current;

    setValue(newValue);
    latestValueRef.current = newValue;
    triggerAutoSave(newValue);
  };

  const handleBlur = () => {
    if (onContentUpdate) onContentUpdate(title, latestValueRef.current);
  };

  // useLayoutEffect(() => {
  //   if (pendingScrollRestoreRef.current === null) return;

  //   const quill           = quillRef.current?.getEditor();
  //   const scrollContainer = getScrollContainer();
  //   const scrollTop       = pendingScrollRestoreRef.current;
  //   const selection       = pendingSelectionRestoreRef.current;

  //   if (scrollContainer) scrollContainer.scrollTop = scrollTop;
  //   if (selection && quill) quill.setSelection(selection.index, selection.length, "silent");

  //   requestAnimationFrame(() => {
  //     const sc = getScrollContainer();
  //     if (sc) sc.scrollTop = scrollTop;
  //   });

  //   pendingScrollRestoreRef.current    = null;
  //   pendingSelectionRestoreRef.current = null;
  // }, [value]);

  // ── Link modal helpers ─────────────────────────────────────────────────────

  const openLinkModal = (quill, range) => {
    savedRangeRef.current = range;

    // Detect existing link at cursor/selection
    const [leaf] = quill.getLeaf(range.index);
    const existingUrl =
      leaf?.parent?.domNode?.tagName === "A"
        ? leaf.parent.domNode.getAttribute("href") || ""
        : quill.getFormat(range)?.link || "";

    // Pre-fill display text from selection
    const selectedText = quill.getText(range.index, range.length);

    // Position modal near toolbar link button
    const toolbarEl = quill.container.closest(".quill-container")?.querySelector(".ql-toolbar");
    const linkBtn = toolbarEl?.querySelector(".ql-link");
    let top = 200, left = 200;

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
    if (!quill) return;

    const range = savedRangeRef.current;
    if (!range) return;

    const url = linkUrl.trim();
    if (!url) return;

    // Auto-prepend https:// if missing
    const finalUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

    quill.focus();

    if (range.length > 0) {
      const currentText = quill.getText(range.index, range.length);
      if (linkText.trim() && linkText !== currentText) {
        // Replace text and apply link
        quill.deleteText(range.index, range.length, "user");
        quill.insertText(range.index, linkText, "link", finalUrl, "user");
      } else {
        // Just format existing selection as link
        quill.formatText(range.index, range.length, "link", finalUrl, "user");
      }
    } else {
      // No selection — insert new link text at cursor
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
    if (!quill) return;

    const range = savedRangeRef.current;
    if (range) {
      quill.focus();
      if (range.length > 0) {
        quill.formatText(range.index, range.length, "link", false, "user");
      } else {
        // Find the full link blot and remove it
        const [leaf, offset] = quill.getLeaf(range.index);
        if (leaf?.parent?.domNode?.tagName === "A") {
          const linkStart = range.index - offset;
          const linkLen = leaf.parent.length();
          quill.formatText(linkStart, linkLen, "link", false, "user");
        }
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
    // Restore editor focus and selection
    const quill = quillRef.current?.getEditor();
    if (quill && savedRangeRef.current) {
      quill.focus();
      quill.setSelection(savedRangeRef.current.index, savedRangeRef.current.length, "silent");
    }
  };

  // ── Modules ────────────────────────────────────────────────────────────────
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
        // Toolbar link button → open custom modal
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

  // ── AI Redraft ─────────────────────────────────────────────────────────────
  const handleEditClick = (e) => {
    e.stopPropagation();
     if (!loaded || isMarkAsCompleted) return; 
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const popupHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < popupHeight + 8;
      setPopupPos({
        top: showAbove ? rect.top - popupHeight - 8 : rect.bottom + 8,
        left: rect.right - 320,
      });
    }
    if (!isRedrafting) setInstruction("");
    setShowPopup((prev) => !prev);
  };

  const handleRedraft = async () => {
    if (!instruction.trim()) return;
    setIsRedrafting(true);
    try {
      const detailRaw = await GetProposalDrafterDetail({ drafter_uuid });
      const detail = typeof detailRaw === "string" ? JSON.parse(detailRaw) : detailRaw;

      if (!detail?.valid || !detail?.data?.drafter_id) {
        showToast("error", "Failed to get drafter details.");
        return;
      }

      const basePayload = { drafter_id: detail.data.drafter_id, sections: [title] };
      const payload = { ...basePayload, context: instruction.trim() };

      let raw;
      try { raw = await ProposalDrafterView(payload); }
      catch { raw = await ProposalDrafterView(basePayload); }

      const response = typeof raw === "string" ? JSON.parse(raw) : raw;

      if (response?.valid) {
        const contentMap = response?.data?.content || {};
        const matchedKey = Object.keys(contentMap).find(
          (key) => key.trim().toLowerCase() === title.trim().toLowerCase()
        );
        const newContent = matchedKey ? contentMap[matchedKey] : "";

        if (!newContent || !newContent.trim()) {
          showToast("success", response.message || "Section added to queue successfully");
          setShowPopup(false);
          setInstruction("");
          return;
        }

        const htmlContent = plainTextToHtml(newContent);
        isUserEdited.current = true;
        setValue(htmlContent);
        latestValueRef.current = htmlContent;
        if (onContentUpdate) onContentUpdate(title, htmlContent);
        showToast("success", response.message || "Section re-drafted successfully");
        setShowPopup(false);
        setInstruction("");
      } else {
        showToast("error", response?.message || "Failed to re-draft section.");
      }
    } catch (err) {
      console.error("Redraft error:", err);
      showToast("error", "Something went wrong. Please try again.");
    } finally {
      setIsRedrafting(false);
    }
  };

  // ── Save status indicator ──────────────────────────────────────────────────
  const SaveIndicator = () => {
    if (saveStatus === "idle") return null;
    if (saveStatus === "pending") return (
      <span className="tw-text-[11px] tw-text-gray-400 tw-flex tw-items-center tw-gap-1">
        <span className="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-gray-300 tw-animate-pulse tw-inline-block" />
        Unsaved changes
      </span>
    );
    if (saveStatus === "saving") return (
      <span className="tw-text-[11px] tw-text-blue-500 tw-flex tw-items-center tw-gap-1">
        <svg className="tw-animate-spin tw-w-3 tw-h-3" viewBox="0 0 24 24" fill="none">
          <circle className="tw-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="tw-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Saving...
      </span>
    );
    if (saveStatus === "saved") return (
      <span className="tw-text-[11px] tw-text-green-500 tw-flex tw-items-center tw-gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Saved
      </span>
    );
    if (saveStatus === "error") return (
      <span className="tw-text-[11px] tw-text-red-400 tw-flex tw-items-center tw-gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="2" />
          <line x1="12" y1="8" x2="12" y2="12" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1" fill="#f87171" />
        </svg>
        Save failed
      </span>
    );
    return null;
  };

  const badgeContent = !loaded ? (
    <span className="tw-text-[10px] tw-font-bold tw-bg-gray-100 tw-text-gray-400 tw-px-2 tw-py-0.5 tw-rounded tw-uppercase tw-inline-flex tw-items-center tw-gap-1">
      <svg className="tw-animate-spin tw-w-3 tw-h-3" viewBox="0 0 24 24" fill="none">
        <circle className="tw-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="tw-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      Generating...
    </span>
  ) : (
    <span className="tw-text-[13px] tw-font-semibold tw-bg-[#eaf2ff] tw-text-[#4488ff] tw-border tw-border-[#4488ff] tw-px-2 tw-py-0.5 tw-rounded tw-uppercase tw-inline-flex tw-items-center tw-gap-1">
      <i className="icon-AI-fill" />
      AI Generated
    </span>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="tw-px-8">

      {/* Custom Link Modal — rendered via portal into document.body */}
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

      <CollapsibleSection
        title={title}
        icon={<i className="icon-Document-analysis tw-text-[#4488ff] tw-text-lg tw-font-semibold" />}
        badge={badgeContent}
        defaultExpanded={defaultExpanded}
        expanded={isExpanded}
        onToggle={() => setIsExpanded((prev) => !prev)}
        headerRight={
          <div className="tw-flex tw-items-center tw-gap-3">
            <SaveIndicator />

            {/* Edit With AI button */}
            <button
              ref={btnRef}
              onClick={handleEditClick}
              disabled={!loaded || isMarkAsCompleted}
              className={`tw-text-xs tw-font-semibold tw-px-3 tw-py-1.5 tw-rounded tw-bg-white tw-inline-flex tw-items-center tw-gap-1 tw-transition-colors
              ${!loaded || isMarkAsCompleted
                  ? "tw-text-gray-400 tw-border tw-border-gray-300 tw-cursor-not-allowed tw-opacity-60"
                  : "tw-text-[#4488ff] tw-border tw-border-[#4488ff] hover:tw-bg-blue-50 tw-cursor-pointer"
                }`}
            >
              <i className="icon-AI-fill" />
              Edit With AI
            </button>

            {/* Edit With AI popup */}
            {showPopup && ReactDOM.createPortal(
              <div
                ref={popupRef}
                onClick={(e) => e.stopPropagation()}
                style={{ position: "fixed", top: popupPos.top, left: popupPos.left, zIndex: 999999, width: "320px" }}
                className="tw-bg-white tw-rounded-xl tw-shadow-2xl tw-border tw-border-gray-100 tw-p-5"
              >
                <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                  <i className="icon-AI-fill tw-text-[#4488ff] tw-text-[16px]" />
                  <h3 className="tw-text-[14px] tw-font-bold tw-text-[#0f172a]">Re-draft Section</h3>
                </div>
                <p className="tw-text-[12px] tw-text-[#64748b] tw-mb-3 tw-leading-relaxed">
                  Add instructions for the AI to regenerate this section.
                </p>
                <textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="e.g., Make it more detailed, add specific project examples..."
                  rows={5}
                  className="tw-w-full tw-border-2 tw-border-[#4488ff] tw-rounded-lg tw-px-3 tw-py-2.5 tw-text-[13px] tw-text-[#1e293b] tw-resize-none focus:tw-outline-none tw-placeholder-gray-300"
                />
                <div className="tw-flex tw-justify-between tw-items-center tw-mt-4 tw-gap-3">
                  <button
                    onClick={() => { setShowPopup(false); if (!isRedrafting) setInstruction(""); }}
                    disabled={isRedrafting}
                    className="tw-flex-1 tw-py-2 tw-rounded-lg tw-border tw-border-gray-200 tw-text-[13px] tw-font-medium tw-text-[#475569] hover:tw-bg-gray-50 tw-transition-colors disabled:tw-opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRedraft}
                    disabled={!instruction.trim() || isRedrafting}
                    className="tw-flex-1 tw-py-2 tw-rounded-lg tw-bg-[#0140c1] tw-text-white tw-text-[13px] tw-font-semibold tw-inline-flex tw-items-center tw-justify-center tw-gap-1.5 hover:tw-bg-blue-800 tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                  >
                    {isRedrafting ? (
                      <>
                        <svg className="tw-animate-spin tw-w-3 tw-h-3" viewBox="0 0 24 24" fill="none">
                          <circle className="tw-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="tw-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <><i className="icon-AI-fill tw-text-[12px]" /> Re-draft Section</>
                    )}
                  </button>
                </div>
              </div>,
              document.body
            )}
          </div>
        }
      >
        {!loaded ? (
          <SectionShimmer />
        ) : (
          <div className="tw-p-4">
  <div
    className={`tw-border tw-rounded-md quill-container ${isMarkAsCompleted ? "ql-readonly" : ""}`}
    style={{ position: "relative" }}
  >
    <ReactQuill
      theme="snow"
      ref={quillRef}
      value={value}
      onChange={isMarkAsCompleted ? undefined : handleChange}
      onBlur={handleBlur}
      modules={modules}
      readOnly={isMarkAsCompleted}
      className="tw-text-slate-700"
    />
  </div>
</div>
        )}

        <style jsx global>{`
          .ql-toolbar.ql-snow {
            border: none !important;
            border-bottom: 1px solid #e2e8f0 !important;
            background: #fcfcfc;
            padding: 8px 16px !important;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .ql-container.ql-snow { border: none !important; font-size: 14px; }
          .quill-container .ql-container.ql-snow {
            min-height: 280px;
            max-height: 280px;
            overflow-y: scroll;
            scrollbar-width: thin;
            scrollbar-color: #94a3b8 #f1f5f9;
          }
          .quill-container .ql-editor { min-height: 280px; color: #334155 !important; }
          .quill-container .ql-editor p { margin: 0; padding: 0; color: #334155 !important; }
          .quill-container .ql-editor * { color: #334155 !important; }
          .ql-editor.ql-blank::before   { color: #cbd5e1; font-style: normal; }
          .ql-undo::before { content: "↩"; font-size: 16px; }
          .ql-redo::before { content: "↪"; font-size: 16px; }
          .ql-toolbar.ql-snow .ql-formats {
            margin-right: 0 !important;
            padding-right: 10px;
            border-right: 1.5px solid #d1d5db !important;
          }
          .ql-toolbar.ql-snow .ql-formats:last-child { border-right: none !important; padding-right: 0; }

          /* Hide Quill's native tooltip — replaced by custom portal modal */
          .quill-container .ql-snow .ql-tooltip { display: none !important; }

          /* Link styling inside editor */
          .quill-container .ql-editor a {
            color: #4488ff !important;
            text-decoration: underline !important;
            cursor: pointer !important;
          }
          .quill-container .ql-editor a:hover {
            color: #2266dd !important;
          }
            .quill-container.ql-readonly .ql-toolbar {
    opacity: 0.4;
    pointer-events: none;
    cursor: not-allowed;
  }
  .quill-container.ql-readonly .ql-editor {
    background-color: #f8fafc !important;
    cursor: not-allowed !important;
  }

          /* Scrollbar Chrome/Safari/Edge */
          .quill-container .ql-container.ql-snow::-webkit-scrollbar       { width: 6px; }
          .quill-container .ql-container.ql-snow::-webkit-scrollbar-track  { background: #f1f5f9; border-radius: 3px; }
          .quill-container .ql-container.ql-snow::-webkit-scrollbar-thumb  { background: #94a3b8; border-radius: 3px; }
          .quill-container .ql-container.ql-snow::-webkit-scrollbar-thumb:hover { background: #64748b; }
          /* ── Read-only mode ── */
/* ── Read-only mode ── */
.ql-readonly .ql-toolbar.ql-snow {
  opacity: 0.4 !important;
  pointer-events: none !important;
  cursor: not-allowed !important;
  position: relative !important;
}
.ql-readonly .ql-toolbar.ql-snow::after {
  content: "";
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='11' width='18' height='11' rx='2' ry='2'/%3E%3Cpath d='M7 11V7a5 5 0 0 1 10 0v4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-size: contain;
  pointer-events: none;
}
.ql-readonly .ql-editor {
  background-color: #f8fafc !important;
  cursor: not-allowed !important;
}
.ql-readonly .ql-toolbar button,
.ql-readonly .ql-toolbar .ql-picker {
  pointer-events: none !important;
  opacity: 0.4 !important;
}
        `}</style>
      </CollapsibleSection>
    </div>
  );
};

export default ProposalSectionItem;