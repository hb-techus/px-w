import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import DOMPurify from 'dompurify'
import { quillFormats, getWordCount, getPlainText } from './healthcheckerUtils'

// ── Link insertion modal (portal) ─────────────────────────────────────────────
const LinkModal = ({ isOpen, position, linkUrl, linkText, isEditingExisting, onUrlChange, onTextChange, onSave, onRemove, onClose }) => {
  const modalRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (modalRef.current && !modalRef.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div
      ref={modalRef}
      style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 999999, width: '340px' }}
      className="tw-bg-white tw-rounded-xl tw-shadow-2xl tw-border tw-border-gray-200 tw-p-5"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
        <div className="tw-flex tw-items-center tw-gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#4488ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#4488ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="tw-text-[14px] tw-font-bold tw-text-[#0f172a]">{isEditingExisting ? 'Edit Link' : 'Insert Link'}</h3>
        </div>
        <button onClick={onClose} className="tw-text-gray-400 hover:tw-text-gray-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="tw-mb-3">
        <label className="tw-block tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-wide tw-mb-1.5">Display Text</label>
        <input type="text" value={linkText} onChange={(e) => onTextChange(e.target.value)} placeholder="Link text (optional)"
          className="tw-w-full tw-border tw-border-gray-200 tw-rounded-lg tw-px-3 tw-py-2 tw-text-[13px] tw-text-[#1e293b] focus:tw-outline-none focus:tw-border-[#4488ff]" />
      </div>

      <div className="tw-mb-3">
        <label className="tw-block tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-wide tw-mb-1.5">URL <span className="tw-text-red-400">*</span></label>
        <input ref={inputRef} type="url" value={linkUrl} onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onClose() }}
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
          <button onClick={onRemove} className="tw-px-3 tw-py-2 tw-rounded-lg tw-border tw-border-red-200 tw-text-[12px] tw-font-medium tw-text-red-500 hover:tw-bg-red-50 tw-flex tw-items-center tw-gap-1">
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
          {isEditingExisting ? 'Update Link' : 'Insert Link'}
        </button>
      </div>
    </div>,
    document.body
  )
}

// ── Quill custom-input editor ─────────────────────────────────────────────────
// Props:
//   value             — controlled HTML string
//   charCount         — current character count (for display)
//   wordCount         — current word count (for display)
//   wordLimit         — max words allowed (null = unlimited)
//   showUpgradeModal  — makes editor read-only while modal is open
//   onChange(html, charCount, wordCount) — fires on valid change
//   onLimitExceeded(message)             — fires when word limit hit
const HealthCheckerCustomInput = ({ value, charCount, wordCount, wordLimit, showUpgradeModal, onChange, onLimitExceeded }) => {
  const quillRef = useRef(null)
  const latestSelectionRef = useRef(null)
  const savedRangeRef = useRef(null)
  const lastAllowedRef = useRef(value)

  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkModalPos, setLinkModalPos] = useState({ top: 0, left: 0 })
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [isEditingExisting, setIsEditingExisting] = useState(false)

  // Safety net: if wordLimit loads after content is already entered, enforce it
  useEffect(() => {
    if (!wordLimit || !value) return
    const plainText = getPlainText(value).trim()
    if (getWordCount(plainText) <= wordLimit) return

    const safe = lastAllowedRef.current
    const safePlain = getPlainText(safe).trim()
    if (getWordCount(safePlain) > wordLimit) {
      lastAllowedRef.current = ''
      onChange('', 0, 0)
    } else {
      onChange(safe, safePlain.length, getWordCount(safePlain))
    }
    onLimitExceeded(`Your current package allows up to ${wordLimit} word${wordLimit > 1 ? 's' : ''} in Custom Input. Upgrade your package to continue.`)
  }, [wordLimit])

  const openLinkModal = (quill, range) => {
    savedRangeRef.current = range
    const [leaf] = quill.getLeaf(range.index)
    const existingUrl = leaf?.parent?.domNode?.tagName === 'A'
      ? leaf.parent.domNode.getAttribute('href') || ''
      : quill.getFormat(range)?.link || ''
    const selectedText = quill.getText(range.index, range.length)
    const toolbarEl = quill.container.closest('.quill-container')?.querySelector('.ql-toolbar')
    const linkBtn = toolbarEl?.querySelector('.ql-link')
    let top = 200, left = 200
    if (linkBtn) {
      const rect = linkBtn.getBoundingClientRect()
      const mw = 340, mh = 310
      top = rect.bottom + 8
      left = rect.left - mw / 2 + rect.width / 2
      if (left < 8) left = 8
      if (left + mw > window.innerWidth - 8) left = window.innerWidth - mw - 8
      if (top + mh > window.innerHeight - 8) top = rect.top - mh - 8
    }
    setLinkUrl(existingUrl)
    setLinkText(selectedText)
    setIsEditingExisting(!!existingUrl)
    setLinkModalPos({ top, left })
    setLinkModalOpen(true)
  }

  const handleLinkSave = () => {
    const quill = quillRef.current?.getEditor()
    const range = savedRangeRef.current
    if (!quill || !range) return
    const url = linkUrl.trim()
    if (!url) return
    const finalUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`
    quill.focus()
    if (range.length > 0) {
      const currentText = quill.getText(range.index, range.length)
      if (linkText.trim() && linkText !== currentText) {
        quill.deleteText(range.index, range.length, 'user')
        quill.insertText(range.index, linkText, 'link', finalUrl, 'user')
      } else {
        quill.formatText(range.index, range.length, 'link', finalUrl, 'user')
      }
    } else {
      const text = linkText.trim() || finalUrl
      quill.insertText(range.index, text, 'link', finalUrl, 'user')
      quill.setSelection(range.index + text.length, 0, 'silent')
    }
    setLinkModalOpen(false)
    setLinkUrl('')
    setLinkText('')
  }

  const handleLinkRemove = () => {
    const quill = quillRef.current?.getEditor()
    const range = savedRangeRef.current
    if (!quill || !range) return
    quill.focus()
    if (range.length > 0) {
      quill.formatText(range.index, range.length, 'link', false, 'user')
    } else {
      const [leaf, offset] = quill.getLeaf(range.index)
      if (leaf?.parent?.domNode?.tagName === 'A') {
        quill.formatText(range.index - offset, leaf.parent.length(), 'link', false, 'user')
      }
    }
    setLinkModalOpen(false)
    setLinkUrl('')
    setLinkText('')
  }

  const handleLinkClose = () => {
    setLinkModalOpen(false)
    setLinkUrl('')
    setLinkText('')
    const quill = quillRef.current?.getEditor()
    if (quill && savedRangeRef.current) {
      quill.focus()
      quill.setSelection(savedRangeRef.current.index, savedRangeRef.current.length, 'silent')
    }
  }

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],
        ['link'],
        ['undo', 'redo'],
      ],
      handlers: {
        undo() { this.quill?.history?.undo() },
        redo() { this.quill?.history?.redo() },
        link() {
          const quill = this.quill
          if (!quill) return
          const range = quill.getSelection() ?? latestSelectionRef.current ?? { index: 0, length: 0 }
          openLinkModal(quill, range)
        },
      },
    },
    history: { delay: 200, maxStack: 100, userOnly: true },
  }), [])

  useEffect(() => {
    const quill = quillRef.current?.getEditor()
    if (!quill) return

    const handleSelectionChange = (range) => {
      latestSelectionRef.current = range
      if (!range) return
      const container = quill.root.closest('.ql-container')
      if (!container) return
      const bounds = quill.getBounds(range.index, range.length)
      if (!bounds) return
      const h = container.clientHeight
      if (bounds.bottom > h - 20) container.scrollTop += bounds.bottom - h + 30
      else if (bounds.top < 0) container.scrollTop += bounds.top - 10
    }

    const handleTextChange = () => {
      requestAnimationFrame(() => {
        const sel = quill.getSelection()
        if (sel) handleSelectionChange(sel)
      })
    }

    const handlePaste = (e) => {
      const clipboardData = e.clipboardData
      if (!clipboardData) return
      const html = clipboardData.getData('text/html')
      if (html) {
        e.preventDefault()
        const sanitized = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
        const range = quill.getSelection() || { index: quill.getLength() - 1, length: 0 }
        quill.clipboard.dangerouslyPasteHTML(range.index, sanitized, 'user')
      }
    }

    const handleLinkClick = (e) => {
      const anchor = e.target.closest('a')
      if (!anchor) return
      e.preventDefault()
      e.stopPropagation()
      const url = anchor.getAttribute('href')
      if (!url) return
      if (e.ctrlKey || e.metaKey) {
        if (/^(https?:|mailto:)/i.test(url)) window.open(url, '_blank', 'noopener,noreferrer')
        return
      }
      try {
        const blot = Quill.find(anchor)
        if (blot) {
          const index = quill.getIndex(blot)
          const length = typeof blot.length === 'function' ? blot.length() : anchor.textContent.length
          quill.setSelection(index, length, 'silent')
          latestSelectionRef.current = { index, length }
          openLinkModal(quill, { index, length })
          return
        }
      } catch (err) {
        console.warn('Failed to resolve clicked link blot', err)
      }
      const range = quill.getSelection() ?? latestSelectionRef.current ?? { index: 0, length: 0 }
      openLinkModal(quill, range)
    }

    quill.on('selection-change', handleSelectionChange)
    quill.on('text-change', handleTextChange)
    quill.root.addEventListener('click', handleLinkClick)
    quill.root.addEventListener('paste', handlePaste)

    return () => {
      quill.off('selection-change', handleSelectionChange)
      quill.off('text-change', handleTextChange)
      quill.root.removeEventListener('click', handleLinkClick)
      quill.root.removeEventListener('paste', handlePaste)
    }
  }, [])

  const handleQuillChange = (newHtml) => {
    const plainText = getPlainText(newHtml).trim()
    const nextCharCount = plainText.length
    const nextWordCount = getWordCount(plainText)

    if (wordLimit && nextWordCount > wordLimit) {
      const safe = lastAllowedRef.current
      const safePlain = getPlainText(safe).trim()
      const quill = quillRef.current?.getEditor()
      if (quill) {
        const delta = quill.clipboard.convert(safe || '')
        quill.setContents(delta, 'silent')
        const len = quill.getLength()
        quill.setSelection(len > 0 ? len - 1 : 0, 0, 'silent')
      }
      onChange(safe, safePlain.length, getWordCount(safePlain))
      onLimitExceeded(`Your current package allows up to ${wordLimit} word${wordLimit > 1 ? 's' : ''} in Custom Input. Upgrade your package to continue.`)
      return
    }

    lastAllowedRef.current = newHtml
    onChange(newHtml, nextCharCount, nextWordCount)
  }

  return (
    <>
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
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
        <p className="tw-text-[13px] tw-font-medium tw-text-[#4a5568]">Paste your contract content below</p>
        <span className="tw-text-[12px] tw-text-[#a0aec0]">
          {wordLimit
            ? `${wordCount}/${wordLimit} Words • ${charCount} Characters`
            : `${charCount} Characters`}
        </span>
      </div>
      <div className="tw-border tw-border-[#e2e8f0] tw-rounded-[10px] tw-overflow-hidden quill-container">
        <ReactQuill
          theme="snow"
          ref={quillRef}
          value={value}
          onChange={handleQuillChange}
          readOnly={showUpgradeModal}
          modules={quillModules}
          formats={quillFormats}
          placeholder="Paste or type your contract content here for health analysis..."
          className="tw-text-[#1a202c]"
        />
      </div>
    </>
  )
}

export default HealthCheckerCustomInput
