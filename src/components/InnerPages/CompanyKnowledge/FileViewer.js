// FileViewer.jsx
// npm install mammoth xlsx
import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import DOMPurify from 'dompurify'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import './FileViewer.css'
import ShimmerThumbnail from '../../../genriccomponents/ShimmerBox'

// ─── helpers ────────────────────────────────────────────────────────────────

const getExt = (url = '') => url.split('?')[0].split('.').pop().toLowerCase()

const OFFICE_VIEWER = url =>
  `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    url
  )}`

// ─── sub-renderers ───────────────────────────────────────────────────────────

function PdfViewer ({ url }) {
  return <iframe src={url} title='PDF Viewer' className='fv-frame' />
}

function TxtViewer ({ text }) {
  return <pre className='fv-txt'>{text}</pre>
}

function HtmlViewer ({ html }) {
  return <div className='fv-docx' dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }) }} />
}

function TableViewer ({ workbook }) {
  const [activeSheet, setActiveSheet] = useState(workbook.SheetNames[0])

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[activeSheet], {
    header: 1,
    defval: ''
  })

  return (
    <div className='fv-table-wrap'>
      {workbook.SheetNames.length > 1 && (
        <div className='fv-tabs'>
          {workbook.SheetNames.map(s => (
            <button
              key={s}
              className={`fv-tab ${s === activeSheet ? 'active' : ''}`}
              onClick={() => setActiveSheet(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div className='fv-table-scroll'>
        <table className='fv-table'>
          <thead className=''>
            <tr>
              {(rows[0] || []).map((h, i) => (
                <th key={i}>{h ?? ''}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row, ri) => (
              <tr key={ri}>
                {(rows[0] || []).map((_, ci) => (
                  <td key={ci}>{row[ci] ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OfficeViewer ({ url }) {
  return (
    <iframe
      src={OFFICE_VIEWER(url)}
      title='Office Viewer'
      className='fv-frame'
      frameBorder='0'
    />
  )
}

// ─── main component ──────────────────────────────────────────────────────────

export default function FileViewer ({ url, onRetry }) {
  const [state, setState] = useState({
    status: 'idle',
    content: null,
    error: null
  })

  const load = useCallback(async () => {
    if (!url) return
    setState({ status: 'loading', content: null, error: null })
    const ext = getExt(url)

    try {
      // ── plain text ──
      if (ext === 'txt') {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        setState({
          status: 'done',
          content: { type: 'txt', text },
          error: null
        })
        return
      }

      // ── docx ──
      if (ext === 'docx') {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const buf = await res.arrayBuffer()
        const { value: html } = await mammoth.convertToHtml({
          arrayBuffer: buf
        })
        setState({
          status: 'done',
          content: { type: 'html', html },
          error: null
        })
        return
      }

      // ── spreadsheets & csv ──
      if (['xlsx', 'xls', 'csv'].includes(ext)) {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const contentLength = Number(res.headers.get('content-length') || 0)
        if (contentLength > 10 * 1024 * 1024) throw new Error('File too large to preview (max 10 MB)')
        const buf = await res.arrayBuffer()
        if (buf.byteLength > 10 * 1024 * 1024) throw new Error('File too large to preview (max 10 MB)')
        const workbook = XLSX.read(buf, { type: 'array' })
        setState({
          status: 'done',
          content: { type: 'table', workbook },
          error: null
        })
        return
      }

      // ── pdf ──
      if (ext === 'pdf') {
        setState({ status: 'done', content: { type: 'pdf', url }, error: null })
        return
      }

      // ── pptx (Microsoft Office Online) ──
      if (ext === 'pptx') {
        setState({
          status: 'done',
          content: { type: 'office', url },
          error: null
        })
        return
      }

      throw new Error(`Unsupported file type: .${ext}`)
    } catch (err) {
      setState({ status: 'error', content: null, error: err.message })
    }
  }, [url])

  useEffect(() => {
    load()
  }, [load])

  // ── render states ──

  if (state.status === 'loading' || !url)
  // if(true)
    return (
      // <div className='fv-loading tw-h-full'>
      //   <div className='fv-spinner' />
      //   <span>Loading file…</span>
      // </div>
    //   <div className="tw-inset-0 tw-flex tw-items-center tw-bg-[#e0e0e0] tw-justify-center tw-h-full tw-transition-all tw-duration-300">
    //    <div className="tw-flex tw-flex-col tw-items-center tw-w-[80px] tw-h-[80px]">
    //      <img 
    //        src={LoaderImage}
    //        alt="Loading..."
    //        className="tw-w-full tw-h-full tw-object-contain tw-animate-fade-in"
    //      />
    //    </div>
    //  </div>
    <ShimmerThumbnail height={550} rounded />
    )
  if (!url) return <div className='fv-empty'>No file URL provided.</div>
  if (state.status === 'error')
    return (
      <div className='fv-error'>
        <span>⚠ {state.error}</span>
        <button onClick={onRetry || load}>Retry</button>
      </div>
    )

  if (!state.content) return null

  const { content } = state

  return (
    <div className='fv-root'>
      <div className='fv-toolbar'>
        {/* <span className='fv-filename'>
          {url.split('?')[0].split('/').pop()}
        </span> */}
        <span>Preview</span>
        {/* <a
          className='fv-download'
          href={url}
          // target='_blank'
          rel='noreferrer'
          download
        >
          ⬇ Download
        </a> */}
      </div>
      <div className='fv-body'>
        {content.type === 'pdf' && <PdfViewer url={content.url} />}
        {content.type === 'txt' && <TxtViewer text={content.text} />}
        {content.type === 'html' && <HtmlViewer html={content.html} />}
        {content.type === 'table' && (
          <TableViewer workbook={content.workbook} />
        )}
        {content.type === 'office' && <OfficeViewer url={content.url} />}
      </div>
    </div>
  )
}
