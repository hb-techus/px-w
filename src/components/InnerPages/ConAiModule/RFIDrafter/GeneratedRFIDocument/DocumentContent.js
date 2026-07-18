
import React, { useState, useRef, useEffect, useMemo } from 'react'
import ReactDOM from 'react-dom'
import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import RequestInfoDetails from './RequestInfoDetails'
import { generate_data } from '../../../../../services/techus-services'
import { showToast } from '../../../../../genriccomponents/techus-ToastNotification'
import usePermissions from '../../../../Common/usePermissions'
import { useEstimation } from '../../../../context/EstimationContext'

const formats = [
  "bold", "italic", "underline",
  "list", "bullet",
  "align", "link",
  "color", "background",
  "size",
]

const escapeHtml = str => {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

const contentToHtml = (content = []) => {
  return content.map((item) => `
    <div style="width:100%; border:1px solid #e0e0e0; border-radius:8px; margin-bottom:20px; background:#fff; padding:16px; box-sizing:border-box;">
      <p style="margin:0 0 4px 0;">
        <strong style="color:rgb(1, 64, 193); font-size:14px;">RFI-${String(item.id).padStart(3, "0")}</strong>
      </p>
      <p style="margin:0 0 14px 0;">
        <strong style="font-size:15px; color:#1a1a1a;">${escapeHtml(item.title)}</strong>
      </p>
      <p style="margin:0 0 2px 0;">
        <strong style="font-size:14px; color:#333;">Reference:</strong>
      </p>
      <p style="margin:0 0 14px 0; font-size:14px; color:#555;">${escapeHtml(item.reference_section)}</p>
      <p style="margin:0 0 2px 0;">
        <strong style="font-size:14px; color:#333;">Question:</strong>
      </p>
      <p style="margin:0 0 14px 0; font-size:14px; color:#555;">${escapeHtml(item.question)}</p>
      <div style="background:#fff8f0; border:1px solid #ffd6a5; border-radius:5px; padding:12px;">
        <p style="margin:0 0 4px 0;">
          <strong style="font-size:14px; color:rgb(224,123,0);">Proposal Impact:</strong>
        </p>
        <p style="margin:0; font-size:14px; color:rgb(224,123,0);">${escapeHtml(item.proposal_impact)}</p>
      </div>
    </div>
    <p>&nbsp;</p>
  `).join('')
}
const reconstructHtmlFromQuill = (quillHtml = '') => {
  if (!quillHtml) return quillHtml

  const parser = new DOMParser()
  const doc = parser.parseFromString(quillHtml, 'text/html')
  const allPs = Array.from(doc.body.querySelectorAll('p'))

  const cards = []
  let currentCard = []
  let firstRFIFound = false

  allPs.forEach((p) => {
    const strong = p.querySelector('strong')
    const color = strong?.style?.color || ''
    const isRFIHeader = color.includes('1, 64, 193')

    if (isRFIHeader) {
      if (currentCard.length > 0) cards.push(currentCard)
      currentCard = []
      firstRFIFound = true
      currentCard.push(p)
    } else if (firstRFIFound) {
      // ── Only collect paragraphs AFTER first RFI header ──
      currentCard.push(p)
    }
    // ── Skip title paragraphs (before first RFI) entirely ──
  })

  if (currentCard.length > 0) cards.push(currentCard)

  const rebuilt = cards.map((ps) => {
    let inner = ''
    let proposalOpen = false

    ps.forEach((p) => {
      const strong = p.querySelector('strong')
      const color = strong?.style?.color || ''
      const text = p.textContent.trim()
      // ── Use innerHTML to preserve full text ──
      const html = p.innerHTML.trim()

      if (!text || text === '\u00a0') return

      if (color.includes('1, 64, 193')) {
        // RFI-00x label
        inner += `<p style="margin:0 0 4px 0;"><strong style="color:rgb(1, 64, 193); font-size:14px;">${text}</strong></p>`

      } else if (color.includes('26, 26, 26') || color.includes('1a1a1a')) {
        // Title
        inner += `<p style="margin:0 0 14px 0;"><strong style="font-size:15px; color:#1a1a1a;">${text}</strong></p>`

      } else if (color.includes('51, 51, 51') && (text === 'Reference:' || text === 'Question:')) {
        // Labels
        inner += `<p style="margin:0 0 2px 0;"><strong style="font-size:14px; color:#333;">${text}</strong></p>`

      } else if (color.includes('224, 123, 0')) {
        if (text === 'Proposal Impact:') {
          // Open proposal impact box
          proposalOpen = true
          inner += `<div style="background:#fff8f0; border:1px solid #ffd6a5; border-radius:5px; padding:12px;">
            <p style="margin:0 0 4px 0;"><strong style="font-size:14px; color:rgb(224,123,0);">Proposal Impact:</strong></p>`
        } else {
          // Proposal impact value — close the box
          inner += `<p style="margin:0; font-size:14px; color:rgb(224,123,0);">${html}</p></div>`
          proposalOpen = false
        }

      } else {
        // Reference / Question plain text values — use innerHTML for full text
        inner += `<p style="margin:0 0 14px 0; font-size:14px; color:#555;">${html}</p>`
      }
    })

    // Close proposal box if not closed
    if (proposalOpen) inner += '</div>'

    return `<div style="width:100%; border:1px solid #e0e0e0; border-radius:8px; margin-bottom:10px; background:#fff; padding:16px; box-sizing:border-box;">
      ${inner}
    </div><p>&nbsp;</p>`
  })

  return rebuilt.join('')
}

const getContentItemCount = (content) => {
  if (Array.isArray(content)) return content.length
  if (typeof content !== 'string' || !content.trim()) return 0

  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')

  return Array.from(doc.querySelectorAll('strong')).filter((el) =>
    el.textContent?.trim()?.startsWith('RFI-')
  ).length
}

// ─── Custom Link Modal (Portal) ───────────────────────────────────────────────
const LinkModal = ({ isOpen, position, linkUrl, linkText, isEditingExisting,
  onUrlChange, onTextChange, onSave, onRemove, onClose }) => {
  const modalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

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
    <div ref={modalRef}
      style={{ position: "fixed", top: position.top, left: position.left, zIndex: 999999, width: "340px" }}
      className="tw-bg-white tw-rounded-xl tw-shadow-2xl tw-border tw-border-gray-200 tw-p-5"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
        <div className="tw-flex tw-items-center tw-gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#4488ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#4488ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="tw-text-[14px] tw-font-bold tw-text-[#0f172a]">{isEditingExisting ? "Edit Link" : "Insert Link"}</h3>
        </div>
        <button onClick={onClose} className="tw-text-gray-400 hover:tw-text-gray-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="tw-mb-3">
        <label className="tw-block tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-wide tw-mb-1.5">Display Text</label>
        <input type="text" value={linkText} onChange={(e) => onTextChange(e.target.value)}
          placeholder="Link text (optional)"
          className="tw-w-full tw-border tw-border-gray-200 tw-rounded-lg tw-px-3 tw-py-2 tw-text-[13px] tw-text-[#1e293b] focus:tw-outline-none focus:tw-border-[#4488ff]" />
      </div>

      <div className="tw-mb-3">
        <label className="tw-block tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-wide tw-mb-1.5">URL <span className="tw-text-red-400">*</span></label>
        <input ref={inputRef} type="url" value={linkUrl} onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onClose(); }}
          placeholder="https://example.com"
          className="tw-w-full tw-border-2 tw-border-[#4488ff] tw-rounded-lg tw-px-3 tw-py-2 tw-text-[13px] tw-text-[#1e293b] focus:tw-outline-none" />
      </div>

      <div className="tw-flex tw-items-center tw-gap-1.5 tw-mb-4 tw-bg-blue-50 tw-rounded-lg tw-px-3 tw-py-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="tw-flex-shrink-0">
          <circle cx="12" cy="12" r="10" stroke="#4488ff" strokeWidth="2" />
          <path d="M12 8v4M12 16h.01" stroke="#4488ff" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p className="tw-text-[11px] tw-text-[#4488ff]"><strong>Click</strong> a link to edit · <strong>Ctrl+Click</strong> to open in new tab</p>
      </div>

      <div className="tw-flex tw-items-center tw-gap-2">
        {isEditingExisting && (
          <button onClick={onRemove}
            className="tw-px-3 tw-py-2 tw-rounded-lg tw-border tw-border-red-200 tw-text-[12px] tw-font-medium tw-text-red-500 hover:tw-bg-red-50 tw-flex tw-items-center tw-gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Remove
          </button>
        )}
        <button onClick={onClose} className="tw-flex-1 tw-py-2 tw-rounded-lg tw-border tw-border-gray-200 tw-text-[13px] tw-font-medium tw-text-[#475569] hover:tw-bg-gray-50">Cancel</button>
        <button onClick={onSave} disabled={!linkUrl.trim()}
          className="tw-flex-1 tw-py-2 tw-rounded-lg tw-bg-[#0140c1] tw-text-white tw-text-[13px] tw-font-semibold tw-inline-flex tw-items-center tw-justify-center tw-gap-1.5 hover:tw-bg-blue-800 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed">
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

const DocumentContent = ({ content = [], onContentChange, gaps, rfiDrafterId }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editorValue, setEditorValue] = useState('')

  // ── Regenerate popup state ─────────────────────────
  const [showPopup, setShowPopup] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [isRedrafting, setIsRedrafting] = useState(false)
  const [popupPos, setPopupPos] = useState({ top: 0, left: 4 })
  const btnRef = useRef(null)
  const popupRef = useRef(null)
  const quillRef = useRef(null)


  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkModalPos, setLinkModalPos] = useState({ top: 0, left: 0 })
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const [isEditingExisting, setIsEditingExisting] = useState(false)
  const savedRangeRef = useRef(null)
  const latestSelectionRef = useRef(null)

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


  const [localContent, setLocalContent] = useState(content);
  const contentCount = useMemo(() => getContentItemCount(localContent), [localContent])
  const { permissions } = usePermissions('rfi_drafter', 'contract_command');
  const { isMarkAsCompleted } = useEstimation();

  // Sync if parent content prop changes
  useEffect(() => {
    setLocalContent(content)
  }, [content])

  // ── Auto-scroll editor to cursor position ─────────────────────────────────
  useEffect(() => {
    if (!isEditing) return;
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const handleSelectionChange = (range) => {
      latestSelectionRef.current = range;
      if (!range) return;
      const scrollContainer = quill.root.closest('.ql-container');
      if (!scrollContainer) return;
      const bounds = quill.getBounds(range.index, range.length);
      if (!bounds) return;
      const containerHeight = scrollContainer.clientHeight;
      if (bounds.bottom > containerHeight - 20)
        scrollContainer.scrollTop += bounds.bottom - containerHeight + 30;
      else if (bounds.top < 0)
        scrollContainer.scrollTop += bounds.top - 10;
    };

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

    // Single click → Edit Link modal | Ctrl+Click → open URL in new tab
    const handleLinkClick = (e) => {
      const anchor = e.target.closest("a");
      if (!anchor) return;
      e.preventDefault();
      e.stopPropagation();
      const url = anchor.getAttribute("href");
      if (!url) return;

      if (e.ctrlKey || e.metaKey) {
        if (/^(https?:|mailto:)/i.test(url)) {
          window.open(url, "_blank", "noopener,noreferrer");
        }
        return;
      }

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
          const range = quillInstance.getSelection() ?? latestSelectionRef.current ?? { index: 0, length: 0 };
          openLinkModal(quillInstance, range);
        }
      } catch {
        const range = quillInstance.getSelection() ?? latestSelectionRef.current ?? { index: 0, length: 0 };
        openLinkModal(quillInstance, range);
      }
    };

    quill.on('selection-change', handleSelectionChange);
    quill.on('text-change', handleTextChange);
    quill.root.addEventListener("click", handleLinkClick);

    return () => {
      quill.off('selection-change', handleSelectionChange);
      quill.off('text-change', handleTextChange);
      quill.root.removeEventListener("click", handleLinkClick);
    };
  }, [isEditing]);


  const handleRegenerateClick = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const popupWidth = 320

      const left = rect.right - popupWidth

      setPopupPos({ top: rect.bottom + 8, left })
    }
    if (!isRedrafting) setInstruction('')
    setShowPopup(prev => !prev)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setShowPopup(false);
        if (!isRedrafting) setInstruction('')
      }
    };

    // ── Only close on scroll if it happens OUTSIDE the popup ──
    const handleScroll = (e) => {
      if (popupRef.current && popupRef.current.contains(e.target)) return;
      setShowPopup(false);
      if (!isRedrafting) setInstruction('')
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


  // const handleRedraft = async () => {
  //     setIsRedrafting(true)
  //     try {
  //         const response = await generate_data({
  //             rfi_drafter_id: rfiDrafterId,
  //             context: instruction,
  //             gap_data: gaps,
  //         })
  //         console.log('Regenerate response:', response)
  //         showToast("success", response.message)
  //         setShowPopup(false)
  //         setInstruction('')
  //     } catch (err) {
  //         console.error('Regenerate failed:', err)
  //         showToast("error", response.message)
  //     } finally {
  //         setIsRedrafting(false)
  //     }
  // }

  const handleRedraft = async () => {
    setIsRedrafting(true)
    try {
      const response = await generate_data({
        rfi_drafter_id: rfiDrafterId,
        context: instruction,
        gap_data: gaps,
      })

      const newContent = response?.data?.content || []
      console.log(newContent)
      if (isEditing) {
        // Rebuild editor with new content
        const titleHtml = `
              <p style="text-align:center; margin-bottom:4px;">
                <strong style="font-size:20px; color:#000;">REQUEST FOR INFORMATION (RFI)</strong>
              </p>
              <p style="text-align:center; margin-bottom:20px;">
                <span style="font-size:14px; color:#000;">Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              </p>
            `
        const newHtml = titleHtml + contentToHtml(newContent)
        setEditorValue(newHtml)
        onContentChange?.(reconstructHtmlFromQuill(newHtml) || newHtml)
      } else {
        {
          setLocalContent(newContent)
          // Convert to HTML so parent ref stores correct string, not raw array
          onContentChange?.(contentToHtml(newContent))
        }
      }

      showToast("success", response.message)
      setShowPopup(false)
      setInstruction('')
    } catch (err) {
      console.error('Regenerate failed:', err)
      showToast("error", "Regeneration failed. Please try again.")
    } finally {
      setIsRedrafting(false)
    }
  }

  const originalHtmlRef = useRef('')
  const handleEditClick = () => {
    const titleHtml = `
  <p style="text-align:center; margin-bottom:4px;">
    <strong style="font-size:20px; color:#000;">REQUEST FOR INFORMATION (RFI)</strong>
  </p>
  <p style="text-align:center; margin-bottom:20px;">
    <span style="font-size:14px; color:#000;">Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
  </p>
`
    const initialHtml = typeof localContent === 'string'
      ? localContent
      : titleHtml + contentToHtml(localContent)

    originalHtmlRef.current = initialHtml
    setEditorValue(initialHtml)
    onContentChange?.(reconstructHtmlFromQuill(initialHtml) || initialHtml)
    setIsEditing(true)
  }

  const handleViewClick = () => {
    const updatedHtml =
      reconstructHtmlFromQuill(editorValue) ||
      editorValue ||
      (typeof localContent === 'string' ? localContent : contentToHtml(localContent))
    setLocalContent(updatedHtml)
    onContentChange?.(updatedHtml)
    setIsEditing(false)
  }

  const handleContentToggle = () => {
    if (isEditing) {
      handleViewClick()
      return
    }

    handleEditClick()
  }

  const contentToggleLabel = isEditing ? 'View Content' : 'Edit Content'
  const contentToggleIcon = isEditing ? 'icon-Eye' : 'icon-edit'
  // ── Link modal helpers ─────────────────────────────────────────────────────
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
    let top = 200, left = 200;

    if (linkBtn) {
      const rect = linkBtn.getBoundingClientRect();
      const modalW = 340, modalH = 310;
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
    if (!quill) return;
    const range = savedRangeRef.current;
    if (range) {
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

  return (
    <div className='section tw-bg-[#fff] tw-border tw-border-[#e0e0e0] tw-py-4 tw-px-6 tw-flex tw-flex-col tw-gap-6'>
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

      <div className='header tw-flex tw-justify-between tw-items-center'>
        <h1 className='tw-text-[16px] tw-font-bold tw-text-[#333]'>RFI Document Content</h1>
        <div className='buttons tw-flex tw-gap-[20px] tw-items-center'>

          {/* Edit Content button */}
          {permissions?.edit && (
            <button
              onClick={isMarkAsCompleted ? undefined : handleContentToggle}
              disabled={isMarkAsCompleted}
              className={`tw-w-[140px] tw-border tw-text-[14px] tw-py-2 tw-px-2 tw-rounded-[5px] tw-flex tw-justify-center tw-items-center tw-gap-2 tw-transition-colors
      ${isMarkAsCompleted
                  ? "tw-bg-gray-100 tw-text-gray-400 tw-border-gray-300 tw-cursor-not-allowed tw-opacity-60"
                  : isEditing
                    ? "tw-bg-[#0140c1] tw-text-white tw-border-[#0140c1]"
                    : "tw-bg-white tw-text-[#0140c1] tw-border-[#0140c1] hover:tw-bg-[#f0f5ff]"
                }`}
            >
              <i className={contentToggleIcon}></i><span>{contentToggleLabel}</span>
            </button>
          )}

          {/* Regenerate button + popup */}
          {permissions?.edit && <div className='tw-relative'>
            <button
              ref={btnRef}
              onClick={isMarkAsCompleted ? undefined : handleRegenerateClick}
              disabled={isMarkAsCompleted}
              className={`tw-w-[140px] tw-border tw-text-[14px] tw-py-2 tw-rounded-[5px] tw-flex tw-justify-center tw-items-center tw-gap-1 tw-transition-colors
        ${isMarkAsCompleted
                  ? "tw-bg-gray-100 tw-text-gray-400 tw-border-gray-300 tw-cursor-not-allowed tw-opacity-60"
                  : "tw-text-[#0140c1] tw-border-[#0140c1] hover:tw-bg-[#f0f5ff]"
                }`}
            >
              <i className='icon-AI-fill tw-text-[22px]'></i><span>Regenerate</span>
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
                  <h3 className='tw-text-[14px] tw-font-bold tw-text-[#0f172a]'>Re-draft Section</h3>
                </div>
                <p className='tw-text-[12px] tw-text-[#64748b] tw-mb-3 tw-leading-relaxed'>
                  Edit the content below or add instructions for the AI to regenerate this section.
                </p>
                <textarea
                  value={instruction}
                  onChange={e => setInstruction(e.target.value)}
                  placeholder="e.g., Make it more detailed, add specific project examples..."
                  rows={5}
                  className='tw-w-full tw-border-2 tw-border-[#4488ff] tw-rounded-lg tw-px-3 tw-py-2.5 tw-text-[13px] tw-text-[#1e293b] tw-resize-none focus:tw-outline-none tw-placeholder-gray-300'
                />
                <div className='tw-flex tw-justify-between tw-items-center tw-mt-4 tw-gap-3'>
                  <button
                    onClick={() => { setShowPopup(false); if (!isRedrafting) setInstruction('') }}
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
                        Re-draft Section
                      </>
                    )}
                  </button>
                </div>
              </div>,
              document.body
            )}
          </div>}

        </div>
      </div>

      <div>
        {!isEditing && (
          <div className='tw-flex tw-flex-col tw-gap-1 tw-text-center'>
            <span className='tw-text-[17px] tw-font-bold tw-text-[#000]'>REQUEST FOR INFORMATION (RFI)</span>
            <span className='tw-text-[14px] tw-text-[#000]'>
              Generated on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
        )}

        {isEditing ? (
          <div className='tw-mt-4 quill-container' style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <style jsx global>{`
        .ql-toolbar.ql-snow { border:none!important; border-bottom:1px solid #e2e8f0!important; background:#fcfcfc; padding:8px 16px!important; display:flex; align-items:center; gap:4px; }
  .ql-container.ql-snow { border:none!important; font-size:14px; }
  .quill-container .ql-container.ql-snow { min-height:280px; max-height:280px }
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
        `}</style>

            <ReactQuill
              theme="snow"
              value={editorValue}
              ref={quillRef}
              // onChange={(val) => {
              //   setEditorValue(val);
              //   const reconstructed = reconstructHtmlFromQuill(val);
              //   onContentChange?.(reconstructed);
              // }}
              onChange={(val) => {
                setEditorValue(val);
                const reconstructed = reconstructHtmlFromQuill(val);
                setLocalContent(reconstructed || val);
                onContentChange?.(reconstructed || val);
              }}
              modules={modules}
              formats={formats}
              placeholder="Edit RFI content..."
            />
          </div>
        ) : (
          <RequestInfoDetails content={localContent} />
        )}

        <div className='tw-mt-4 tw-px-3'>
          <div className='tw-h-[3px] tw-bg-[#e8e8e8]'></div>
        </div>
        <div className='tw-text-center tw-pt-4 tw-text-[#a8a9ab] tw-text-[13px] tw-font-[500] tw-flex tw-flex-col tw-gap-1'>
          <span>This RFI document was generated to address {contentCount} identified gap(s) in the RFP documentation.</span>
          <span>Please respond to each question at your earliest convenience to ensure accurate proposal submission.</span>
        </div>
      </div>
    </div>
  )
}

export default DocumentContent
