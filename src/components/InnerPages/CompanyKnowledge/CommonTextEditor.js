import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import DOMPurify from 'dompurify'

const plainTextToHtml = text => {
  if (!text) return ''
  if (/^\s*<(p|br|ul|ol|li|strong|em|h[1-6])\b/i.test(text)) return text

  const escapeHtml = value =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  const formatInline = value =>
    escapeHtml(value)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/_(.+?)_/g, '<em>$1</em>')

  const blocks = text.split(/\n\n+/).filter(block => block.trim())

  const rendered = blocks.map(block => {
    const lines = block.trim().split('\n')
    const output = []
    let paragraphLines = []
    let listLines = []

    const flushParagraph = () => {
      if (!paragraphLines.length) return
      output.push(`<p>${paragraphLines.join('<br>')}</p>`)
      paragraphLines = []
    }

    const flushList = () => {
      if (!listLines.length) return
      output.push(`<ul>${listLines.map(line => `<li>${line}</li>`).join('')}</ul>`)
      listLines = []
    }

    lines.forEach(line => {
      const trimmed = line.trim()
      if (!trimmed) return

      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
      if (headingMatch) {
        flushParagraph()
        flushList()
        const level = Math.min(headingMatch[1].length, 6)
        output.push(`<h${level}>${formatInline(headingMatch[2])}</h${level}>`)
        return
      }

      const bulletMatch = trimmed.match(/^[-*]\s+(.*)/)
      if (bulletMatch) {
        flushParagraph()
        listLines.push(formatInline(bulletMatch[1]))
        return
      }

      flushList()
      paragraphLines.push(formatInline(trimmed))
    })

    flushParagraph()
    flushList()
    return output.join('')
  })

  return rendered.join('<p><br></p>')
}

export const htmlToPlainText = html => {
  if (!html) return ''

  const preserveBlock = source =>
    source
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n')
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n')
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n')
      .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n\n#### $1\n\n')
      .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n\n##### $1\n\n')
      .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n\n###### $1\n\n')
      .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
      .replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, '$1')
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<\/ol>/gi, '\n')

  return preserveBlock(
    html
      .replace(/\r/g, '')
      .replace(/<p><br><\/p>/gi, '\n\n')
      .replace(/<p><br\/><\/p>/gi, '\n\n')
      .replace(/<div><br><\/div>/gi, '\n')
      .replace(/<div><br\/><\/div>/gi, '\n')
      .replace(/<(ul|ol)[^>]*>/gi, '\n')
  )
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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
  onClose
}) => {
  const modalRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    const handleOutsideClick = event => {
      if (modalRef.current && !modalRef.current.contains(event.target)) onClose()
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div
      ref={modalRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 999999,
        width: '340px'
      }}
      className='tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-p-5 tw-shadow-2xl'
      onMouseDown={event => event.stopPropagation()}
    >
      <div className='tw-mb-4 tw-flex tw-items-center tw-justify-between'>
        <div className='tw-flex tw-items-center tw-gap-2'>
          <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
            <path
              d='M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71'
              stroke='#4488ff'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
            <path
              d='M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71'
              stroke='#4488ff'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
          <h3 className='tw-text-[14px] tw-font-bold tw-text-[#0f172a]'>
            {isEditingExisting ? 'Edit Link' : 'Insert Link'}
          </h3>
        </div>
        <button
          type='button'
          onClick={onClose}
          className='tw-text-gray-400 hover:tw-text-gray-600 tw-transition-colors'
        >
          <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
            <path
              d='M18 6L6 18M6 6l12 12'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
            />
          </svg>
        </button>
      </div>

      <div className='tw-mb-3'>
        <label className='tw-mb-1.5 tw-block tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-gray-500'>
          Display Text
        </label>
        <input
          type='text'
          value={linkText}
          onChange={event => onTextChange(event.target.value)}
          placeholder='Link text (optional)'
          className='tw-w-full tw-rounded-lg tw-border tw-border-gray-200 tw-px-3 tw-py-2 tw-text-[13px] tw-text-[#1e293b] focus:tw-border-[#4488ff] focus:tw-outline-none tw-transition-colors'
        />
      </div>

      <div className='tw-mb-3'>
        <label className='tw-mb-1.5 tw-block tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-gray-500'>
          URL <span className='tw-text-red-400'>*</span>
        </label>
        <input
          ref={inputRef}
          type='url'
          value={linkUrl}
          onChange={event => onUrlChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') onSave()
            if (event.key === 'Escape') onClose()
          }}
          placeholder='https://example.com'
          className='tw-w-full tw-rounded-lg tw-border-2 tw-border-[#4488ff] tw-px-3 tw-py-2 tw-text-[13px] tw-text-[#1e293b] focus:tw-outline-none tw-transition-colors'
        />
      </div>

      <div className='tw-mb-4 tw-flex tw-items-center tw-gap-1.5 tw-rounded-lg tw-bg-blue-50 tw-px-3 tw-py-2'>
        <svg width='12' height='12' viewBox='0 0 24 24' fill='none' className='tw-flex-shrink-0'>
          <circle cx='12' cy='12' r='10' stroke='#4488ff' strokeWidth='2' />
          <path
            d='M12 8v4M12 16h.01'
            stroke='#4488ff'
            strokeWidth='2'
            strokeLinecap='round'
          />
        </svg>
        <p className='tw-text-[11px] tw-text-[#4488ff]'>
          <strong>Click</strong> a link to edit | <strong>Ctrl+Click</strong> to open in new tab
        </p>
      </div>

      <div className='tw-flex tw-items-center tw-gap-2'>
        {isEditingExisting && (
          <button
            type='button'
            onClick={onRemove}
            className='tw-flex tw-items-center tw-gap-1 tw-rounded-lg tw-border tw-border-red-200 tw-px-3 tw-py-2 tw-text-[12px] tw-font-medium tw-text-red-500 hover:tw-bg-red-50 tw-transition-colors'
          >
            <svg width='12' height='12' viewBox='0 0 24 24' fill='none'>
              <path
                d='M18 6L6 18M6 6l12 12'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
              />
            </svg>
            Remove
          </button>
        )}
        <button
          type='button'
          onClick={onClose}
          className='tw-flex-1 tw-rounded-lg tw-border tw-border-gray-200 tw-py-2 tw-text-[13px] tw-font-medium tw-text-[#475569] hover:tw-bg-gray-50 tw-transition-colors'
        >
          Cancel
        </button>
        <button
          type='button'
          onClick={onSave}
          disabled={!linkUrl.trim()}
          className='tw-inline-flex tw-flex-1 tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-lg tw-bg-[#0140c1] tw-py-2 tw-text-[13px] tw-font-semibold tw-text-white hover:tw-bg-blue-800 tw-transition-colors disabled:tw-cursor-not-allowed disabled:tw-opacity-50'
        >
          <svg width='13' height='13' viewBox='0 0 24 24' fill='none'>
            <path
              d='M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
            <path
              d='M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
          {isEditingExisting ? 'Update Link' : 'Insert Link'}
        </button>
      </div>
    </div>,
    document.body
  )
}

const formats = ['bold', 'italic', 'underline', 'list', 'bullet', 'align', 'link']

const CommonTextEditor = ({
  value,
  onChange,
  placeholder = 'Add context...',
  minHeight = '180px'
}) => {
  const quillRef = useRef(null)
  const savedRangeRef = useRef(null)
  const latestSelectionRef = useRef(null)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkModalPos, setLinkModalPos] = useState({ top: 0, left: 0 })
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [isEditingExisting, setIsEditingExisting] = useState(false)
  const normalizedValue = useMemo(() => plainTextToHtml(value || ''), [value])
  const [editorValue, setEditorValue] = useState(() => plainTextToHtml(value || ''))

  useEffect(() => {
    setEditorValue(currentValue =>
      currentValue === normalizedValue ? currentValue : normalizedValue
    )
  }, [normalizedValue])

  const openLinkModal = (quill, range) => {
    if (!quill || !range) return

    savedRangeRef.current = range
    latestSelectionRef.current = range

    const [leaf] = quill.getLeaf(range.index)
    const existingUrl =
      leaf?.parent?.domNode?.tagName === 'A'
        ? leaf.parent.domNode.getAttribute('href') || ''
        : quill.getFormat(range)?.link || ''

    const selectedText = quill.getText(range.index, range.length)

    const toolbarElement = quill.container
      .closest('.company-kb-rich-text-editor')
      ?.querySelector('.ql-toolbar')

    const linkButton = toolbarElement?.querySelector('.ql-link')
    let top = 200
    let left = 200

    if (linkButton) {
      const rect = linkButton.getBoundingClientRect()
      const modalWidth = 340
      const modalHeight = 310

      top = rect.bottom + 8
      left = rect.left - modalWidth / 2 + rect.width / 2

      if (left < 8) left = 8
      if (left + modalWidth > window.innerWidth - 8) {
        left = window.innerWidth - modalWidth - 8
      }
      if (top + modalHeight > window.innerHeight - 8) {
        top = rect.top - modalHeight - 8
      }
    }

    setLinkUrl(existingUrl)
    setLinkText(selectedText)
    setIsEditingExisting(Boolean(existingUrl))
    setLinkModalPos({ top, left })
    setLinkModalOpen(true)
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

  const handleLinkSave = () => {
    const quill = quillRef.current?.getEditor()
    const range = savedRangeRef.current

    if (!quill || !range) return

    const trimmedUrl = linkUrl.trim()
    if (!trimmedUrl) return

    const finalUrl = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`
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
        const linkStart = range.index - offset
        const linkLength = leaf.parent.length()
        quill.formatText(linkStart, linkLength, 'link', false, 'user')
      }
    }

    setLinkModalOpen(false)
    setLinkUrl('')
    setLinkText('')
  }

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],
          ['link'],
          ['undo', 'redo']
        ],
        handlers: {
          undo() {
            this.quill?.history?.undo()
          },
          redo() {
            this.quill?.history?.redo()
          },
          link() {
            const quill = this.quill
            const range = quill?.getSelection() ?? latestSelectionRef.current ?? { index: 0, length: 0 }
            openLinkModal(quill, range)
          }
        }
      },
      history: {
        delay: 1000,
        maxStack: 100,
        userOnly: true
      }
    }),
    []
  )

  useEffect(() => {
    const quill = quillRef.current?.getEditor()
    if (!quill) return undefined

    const handleSelectionChange = range => {
      latestSelectionRef.current = range
      if (!range) return

      const scrollContainer = quill.root.closest('.ql-container')
      if (!scrollContainer) return

      const bounds = quill.getBounds(range.index, range.length)
      if (!bounds) return

      const containerHeight = scrollContainer.clientHeight

      if (bounds.bottom > containerHeight - 20) {
        scrollContainer.scrollTop += bounds.bottom - containerHeight + 30
      } else if (bounds.top < 0) {
        scrollContainer.scrollTop += bounds.top - 10
      }
    }

    const handleTextChange = () => {
      requestAnimationFrame(() => {
        const selection = quill.getSelection()
        if (selection) handleSelectionChange(selection)
      })
    }

    const handleLinkClick = event => {
      const anchor = event.target.closest('a')
      if (!anchor) return

      event.preventDefault()
      event.stopPropagation()

      const url = anchor.getAttribute('href')
      if (!url) return

      if (event.ctrlKey || event.metaKey) {
        if (/^(https?:|mailto:)/i.test(url)) {
          window.open(url, '_blank', 'noopener,noreferrer')
        }
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
      } catch (error) {
        console.error('Unable to resolve link blot:', error)
      }

      const fallbackRange = quill.getSelection() ?? latestSelectionRef.current ?? { index: 0, length: 0 }
      openLinkModal(quill, fallbackRange)
    }

    const handlePaste = event => {
      const clipboardData = event.clipboardData
      if (!clipboardData) return

      const html = clipboardData.getData('text/html')
      if (html) {
        event.preventDefault()
        const sanitizedHtml = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
        const range = quill.getSelection() || { index: quill.getLength() - 1, length: 0 }
        quill.clipboard.dangerouslyPasteHTML(range.index, sanitizedHtml, 'user')
        return
      }

      const text = clipboardData.getData('text/plain')
      if (!text) return

      event.preventDefault()
      const converted = plainTextToHtml(text)
      const range = quill.getSelection() || { index: quill.getLength() - 1, length: 0 }
      quill.clipboard.dangerouslyPasteHTML(range.index, converted, 'user')
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
  }, [modules])

  const handleChange = (newValue, _delta, source, editor) => {
    if (source !== 'user') return

    const selection = editor?.getSelection?.() ?? quillRef.current?.getEditor()?.getSelection() ?? null
    latestSelectionRef.current = selection || latestSelectionRef.current

    setEditorValue(newValue)
    if (typeof onChange === 'function') {
      onChange(newValue, htmlToPlainText(newValue))
    }
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

      <div
        className='company-kb-rich-text-editor quill-container tw-overflow-hidden tw-rounded-[8px] tw-border tw-border-[#e2e8f0] tw-bg-white'
        style={{ '--company-kb-editor-min-height': minHeight }}
      >
        <ReactQuill
          ref={quillRef}
          theme='snow'
          value={editorValue}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className='tw-text-slate-700'
        />

        <style>{`
          .company-kb-rich-text-editor .ql-toolbar.ql-snow {
            border: none !important;
            border-bottom: 1px solid #e2e8f0 !important;
            background: #ffffff;
            padding: 10px 12px !important;
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .company-kb-rich-text-editor .ql-container.ql-snow {
            border: none !important;
            font-size: 15px;
            min-height: var(--company-kb-editor-min-height);
            max-height: var(--company-kb-editor-min-height);
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #94a3b8 #f1f5f9;
          }

          .company-kb-rich-text-editor .ql-editor {
            min-height: var(--company-kb-editor-min-height);
            color: #1f2937 !important;
            caret-color: #1f2937 !important;
            padding: 18px 12px 12px;
            font-size: 14px;
            line-height: 1.55;
          }

          .company-kb-rich-text-editor .ql-editor p {
            margin: 0;
            padding: 0;
            color: #1f2937 !important;
          }

          .company-kb-rich-text-editor .ql-editor * {
            color: #000 !important;
          }

          .company-kb-rich-text-editor .ql-editor.ql-blank::before {
            color: #374151;
            font-style: normal;
            left: 12px;
            right: 14px;
            opacity: 0.95;
          }

          .company-kb-rich-text-editor .ql-undo::before {
            content: '\\21A9';
            font-size: 16px;
          }

          .company-kb-rich-text-editor .ql-redo::before {
            content: '\\21AA';
            font-size: 16px;
          }

          .company-kb-rich-text-editor .ql-toolbar.ql-snow .ql-formats {
            margin-right: 0 !important;
            padding-right: 10px;
            border-right: 1.5px solid #d1d5db !important;
          }

          .company-kb-rich-text-editor .ql-toolbar.ql-snow .ql-formats:last-child {
            border-right: none !important;
            padding-right: 0;
          }

          .company-kb-rich-text-editor .ql-snow .ql-stroke {
            stroke: #4b5563;
          }

          .company-kb-rich-text-editor .ql-snow .ql-fill {
            fill: #4b5563;
          }

          .company-kb-rich-text-editor .ql-toolbar button:hover,
          .company-kb-rich-text-editor .ql-toolbar button.ql-active {
            background: #f8fafc;
            border-radius: 4px;
          }

          .company-kb-rich-text-editor .ql-snow .ql-tooltip {
            display: none !important;
          }

          .company-kb-rich-text-editor .ql-editor a {
            color: #4488ff !important;
            text-decoration: underline !important;
            cursor: pointer !important;
          }

          .company-kb-rich-text-editor .ql-editor a:hover {
            color: #2266dd !important;
          }

          .company-kb-rich-text-editor .ql-container.ql-snow::-webkit-scrollbar {
            width: 6px;
          }

          .company-kb-rich-text-editor .ql-container.ql-snow::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
          }

          .company-kb-rich-text-editor .ql-container.ql-snow::-webkit-scrollbar-thumb {
            background: #94a3b8;
            border-radius: 3px;
          }

          .company-kb-rich-text-editor .ql-container.ql-snow::-webkit-scrollbar-thumb:hover {
            background: #64748b;
          }
        `}</style>
      </div>
    </>
  )
}

export default CommonTextEditor

