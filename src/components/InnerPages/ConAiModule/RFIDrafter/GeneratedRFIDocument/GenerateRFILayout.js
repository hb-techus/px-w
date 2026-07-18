



import React, { useState, useRef, useEffect, useMemo } from 'react'
import NavigationHeader from '../../../../../genriccomponents/NavigationHeader'
import GapsInfo from './GapsInfo'
import DocumentContent from './DocumentContent'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TableLayoutType,
  Footer,
  Header,
  HeightRule,
  ShadingType,
  ImageRun,
  VerticalAlign,
} from 'docx'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { Update_generate_data, GenerateRfiPdf, detail_RFI_data, generate_data } from '../../../../../services/techus-services'
import { showToast } from '../../../../../genriccomponents/techus-ToastNotification'
import FullPageLoader from '../../../../../genriccomponents/loaders/FullPageLoader'
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getPdfAssets } from '../../../../../utils/pdfAssets'
import CONFIG from '../../../../../config/config'
import usePermissions from '../../../../Common/usePermissions'
import prexoLogo from '../../../../../assets/fonts/fonts/PrexoAI.svg'
import GeneratingRFI from '../Loaders/GeneratingRFI'
import { useEstimation } from '../../../../context/EstimationContext'

// ─── HTML helpers ──────────────────────────────────────────────────────────────

const contentToHtml = (content = []) =>
  content.map((item) => `
    <div style="width:100%; border:1px solid #e0e0e0; border-radius:8px; margin-bottom:20px; background:#fff; padding:16px; box-sizing:border-box;">
      <p style="margin:0 0 4px 0;"><strong style="color:rgb(1, 64, 193); font-size:14px;">RFI-${String(item.id).padStart(3, '0')}</strong></p>
      <p style="margin:0 0 14px 0;"><strong style="font-size:15px; color:#1a1a1a;">${item.title || ''}</strong></p>
      <p style="margin:0 0 2px 0;"><strong style="font-size:14px; color:#333;">Reference:</strong></p>
      <p style="margin:0 0 14px 0; font-size:14px; color:#555;">${item.reference_section || ''}</p>
      <p style="margin:0 0 2px 0;"><strong style="font-size:14px; color:#333;">Question:</strong></p>
      <p style="margin:0 0 14px 0; font-size:14px; color:#555;">${item.question || ''}</p>
      <div style="background:#fff8f0; border:1px solid #ffd6a5; border-radius:5px; padding:12px;">
        <p style="margin:0 0 4px 0;"><strong style="font-size:14px; color:rgb(224,123,0);">Proposal Impact:</strong></p>
        <p style="margin:0; font-size:14px; color:rgb(224,123,0);">${item.proposal_impact || ''}</p>
      </div>
    </div>
    <p>&nbsp;</p>
  `).join('')

const parseHtmlToItems = (htmlString) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, 'text/html')
  const cards = Array.from(doc.body.querySelectorAll(':scope > div')).filter((div) => {
    const s = div.getAttribute('style') || ''
    return (
      s.includes('border:1px solid #e0e0e0') ||
      s.includes('border: 1px solid #e0e0e0') ||
      s.includes('border:1px solid rgb') ||
      (s.includes('border') && !s.includes('ffd6a5') && !s.includes('fff8f0'))
    )
  })
  return cards.map((card, index) => {
    const rfiEl = card.querySelector(
      'strong[style*="rgb(1, 64, 193)"], strong[style*="color:#0140c1"], strong[style*="rgb(1,64,193)"]'
    )
    const id = parseInt(rfiEl?.textContent?.trim()?.replace('RFI-', '')) || index + 1
    const titleEl = card.querySelector('strong[style*="color:#1a1a1a"], strong[style*="font-size:15px"]')
    const title = titleEl?.textContent?.trim() || ''
    const paras = Array.from(card.querySelectorAll(':scope > p'))
    let reference_section = ''
    let question = ''
    for (let i = 0; i < paras.length; i++) {
      const t = paras[i]?.textContent?.trim()
      if (t === 'Reference:' && paras[i + 1]) reference_section = paras[i + 1].textContent.trim()
      if (t === 'Question:' && paras[i + 1]) question = paras[i + 1].textContent.trim()
    }
    const impDiv = card.querySelector('div[style*="fff8f0"], div[style*="#fff8f0"]')
    let proposal_impact = ''
    if (impDiv) {
      const ips = Array.from(impDiv.querySelectorAll('p'))
      for (let i = 0; i < ips.length; i++) {
        const t = ips[i]?.textContent?.trim()
        if (t === 'Proposal Impact:' && ips[i + 1]) {
          proposal_impact = ips[i + 1].textContent.trim()
          break
        }
        if (t?.startsWith('Proposal Impact:') && t.length > 16) {
          proposal_impact = t.replace('Proposal Impact:', '').trim()
          break
        }
      }
      if (!proposal_impact) {
        proposal_impact = ips
          .map((p) => p.textContent.trim())
          .filter((t) => t && t !== 'Proposal Impact:')
          .join(' ')
      }
    }
    return { id, title, reference_section, question, proposal_impact }
  })
}

// ─── Page constants ────────────────────────────────────────────────────────────
const PAGE_W = 11906
const PAGE_H = 16838
const MARGIN_X = 720
const MARGIN_B = 1100
const CONTENT_W = PAGE_W - MARGIN_X * 2

// DXA → screen pixels: 1 DXA = 635 EMU, 1 px = 9525 EMU → px = DXA*635/9525
const dxaToPx = (dxa) => Math.round((dxa * 635) / 9525)
const pxToEmu = (px) => Math.round(px * 9525)
const PAGE_W_PX = dxaToPx(PAGE_W)   // 793
const PAGE_H_PX = dxaToPx(PAGE_H)   // 1122
const COVER_BLEED_PX = 12
const COVER_BLEED_EMU = pxToEmu(COVER_BLEED_PX)
const COVER_PAGE_BG = '0A1A6B'
const CARD_BORDER = { style: BorderStyle.SINGLE, size: 4, color: 'E0E0E0' }
const IMPACT_BORDER = { style: BorderStyle.SINGLE, size: 6, color: 'FFD6A5' }

const getRfiDocumentTitles = (count = 0) => {
  const safeCount = Math.max(Number(count) || 0, 0)
  return {
    coverTitle: `RFI FOR ${safeCount} ${safeCount === 1 ? 'GAP' : 'GAPS'}`,
    sectionTitle: safeCount === 1 ? 'Identified Gap' : 'Identified Gaps',
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const drawContainedImage = (ctx, img, x, y, width, height) => {
  const imageWidth = img.naturalWidth || img.width || 1
  const imageHeight = img.naturalHeight || img.height || 1
  const scale = Math.min(width / imageWidth, height / imageHeight)
  const drawWidth = imageWidth * scale
  const drawHeight = imageHeight * scale
  const drawX = x + (width - drawWidth) / 2
  const drawY = y + (height - drawHeight) / 2

  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
}

async function buildRoundedLogoCard(logoImage, {
  cardWidth = 157,
  cardHeight = 79,
  tl = 14,
  tr = 14,
  bl = 14,
  br = 14,
} = {}) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = cardWidth
    canvas.height = cardHeight
    const ctx = canvas.getContext('2d')

    const roundedRect = () => {
      ctx.beginPath()
      ctx.moveTo(tl, 0)
      ctx.lineTo(cardWidth - tr, 0)
      ctx.quadraticCurveTo(cardWidth, 0, cardWidth, tr)
      ctx.lineTo(cardWidth, cardHeight - br)
      ctx.quadraticCurveTo(cardWidth, cardHeight, cardWidth - br, cardHeight)
      ctx.lineTo(bl, cardHeight)
      ctx.quadraticCurveTo(0, cardHeight, 0, cardHeight - bl)
      ctx.lineTo(0, tl)
      ctx.quadraticCurveTo(0, 0, tl, 0)
      ctx.closePath()
    }

    const canvasToUint8Array = () => {
      const dataUrl = canvas.toDataURL('image/png')
      const bin = atob(dataUrl.split(',')[1])
      const arr = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
      return arr
    }

    if (!logoImage) {
      resolve(null)
      return
    }

    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, cardWidth, cardHeight)
      roundedRect()
      ctx.clip()
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, cardWidth, cardHeight)
      drawContainedImage(ctx, img, 0, 0, cardWidth, cardHeight)

      resolve(canvasToUint8Array())
    }
    img.onerror = () => {
      console.warn('buildRoundedLogoCard image load failed')
      resolve(null)
    }
    img.src = logoImage
  })
}
const getFormattedItems = (editedHtml, content) => {
  let items = []
  if (typeof editedHtml === 'string' && editedHtml.trim()) items = parseHtmlToItems(editedHtml)
  if (!items.length && Array.isArray(content) && content.length > 0) {
    items = content.map((item, i) => ({
      id: item.id || i + 1,
      title: item.title || '',
      reference_section: item.reference_section || '',
      question: item.question || '',
      proposal_impact: item.proposal_impact || '',
    }))
  }
  return items
}

const getRfiContent = (rfiData) => {
  if (
    rfiData?.data &&
    Object.prototype.hasOwnProperty.call(rfiData.data, 'content')
  ) {
    return rfiData.data.content ?? []
  }

  if (typeof rfiData?.content_text === 'string' && rfiData.content_text.trim()) {
    return rfiData.content_text
  }

  if (Array.isArray(rfiData?.content_text) && rfiData.content_text.length > 0) {
    return rfiData.content_text
  }

  try {
    const parsedResponse =
      typeof rfiData?.response_text === 'string'
        ? JSON.parse(rfiData.response_text || '{}')
        : rfiData?.response_text

    return parsedResponse?.content || []
  } catch (error) {
    console.warn('Failed to parse RFI response_text:', error)
    return []
  }
}

const getRfiContentCount = (content) => {
  if (Array.isArray(content)) return content.length
  if (typeof content === 'string' && content.trim()) {
    return getFormattedItems(content, []).length
  }
  return 0
}

const hasGeneratedRfiContent = (rfiData) =>
  getRfiContentCount(getRfiContent(rfiData)) > 0

const getInitialRfiState = (rfiData, hideContent = false) => {
  if (!rfiData) return null
  if (!hideContent) return rfiData

  return {
    ...rfiData,
    data:
      rfiData.data && typeof rfiData.data === 'object'
        ? { ...rfiData.data, content: [] }
        : undefined,
    content_text: '',
    response_text: '',
  }
}

const getLoaderGapCount = (gaps = []) => {
  if (!Array.isArray(gaps) || gaps.length === 0) return 0

  const selectedCount = gaps.filter((gap) => gap?.selected).length
  return selectedCount || gaps.length
}

const normalizeGapId = (rawId) => {
  if (rawId === null || rawId === undefined) return ''

  const value = String(rawId).trim()
  if (!value) return ''

  const match = value.match(/(\d+)/)
  if (match?.[1]) {
    return `GAP-${match[1].padStart(3, '0')}`
  }

  return value.toUpperCase()
}

const getSelectedGapIds = (gapData = []) => {
  if (!Array.isArray(gapData) || gapData.length === 0) return []

  const hasExplicitSelection = gapData.some((gap) =>
    Object.prototype.hasOwnProperty.call(gap || {}, 'selected'),
  )

  return gapData
    .filter((gap) => (hasExplicitSelection ? Boolean(gap?.selected) : true))
    .map((gap) => normalizeGapId(gap?.id ?? gap?.gap_id ?? gap?.gapId))
    .filter(Boolean)
}

const hasExpectedSelectedGaps = (gapData = [], expectedSelectedGapIds = []) => {
  if (expectedSelectedGapIds.length === 0) return true
  if (!Array.isArray(gapData) || gapData.length === 0) return false

  const hasExplicitSelection = gapData.some((gap) =>
    Object.prototype.hasOwnProperty.call(gap || {}, 'selected'),
  )
  const selectedGapIds = getSelectedGapIds(gapData)

  if (hasExplicitSelection && selectedGapIds.length !== expectedSelectedGapIds.length) {
    return false
  }

  return expectedSelectedGapIds.every((gapId) => selectedGapIds.includes(gapId))
}

const isExpectedRfiDetailReady = (rfiData, expectedSelectedGapIds = []) => {
  const expectedGapCount = expectedSelectedGapIds.length

  if (!hasExpectedSelectedGaps(rfiData?.gap_data, expectedSelectedGapIds)) {
    return false
  }

  if (expectedGapCount === 0) {
    return hasGeneratedRfiContent(rfiData)
  }

  return getRfiContentCount(getRfiContent(rfiData)) >= expectedGapCount
}

const resolvePreferredGapData = (detailGapData = [], fallbackGapData = [], expectedSelectedGapIds = []) => {
  if (hasExpectedSelectedGaps(detailGapData, expectedSelectedGapIds)) {
    return detailGapData
  }

  if (hasExpectedSelectedGaps(fallbackGapData, expectedSelectedGapIds)) {
    return fallbackGapData
  }

  if (Array.isArray(detailGapData) && detailGapData.length > 0) {
    return detailGapData
  }

  return fallbackGapData
}

const fetchRfiDetailOnce = async (rfiDrafterUuid, fallbackData) => {
  const detailRes = await detail_RFI_data({ rfi_drafter_uuid: rfiDrafterUuid })

  if (detailRes?.valid && detailRes?.data) {
    return detailRes.data
  }

  return fallbackData
}

const mergeRfiDetailWithFallback = (detailData, fallbackData, expectedSelectedGapIds = []) => {
  if (!detailData) return fallbackData
  if (!fallbackData) return detailData

  const detailContent = getRfiContent(detailData)
  const fallbackContent = getRfiContent(fallbackData)
  const shouldUseDetailContent =
    isExpectedRfiDetailReady(detailData, expectedSelectedGapIds) ||
    getRfiContentCount(detailContent) >= getRfiContentCount(fallbackContent)

  return {
    ...fallbackData,
    ...detailData,
    rfi_drafter_id: detailData?.rfi_drafter_id ?? fallbackData?.rfi_drafter_id,
    gap_data: resolvePreferredGapData(
      detailData?.gap_data,
      fallbackData?.gap_data,
      expectedSelectedGapIds,
    ),
    data:
      fallbackData?.data || detailData?.data
        ? {
            ...(fallbackData?.data && typeof fallbackData.data === 'object' ? fallbackData.data : {}),
            ...(detailData?.data && typeof detailData.data === 'object' ? detailData.data : {}),
            content: shouldUseDetailContent ? detailContent : fallbackContent,
          }
        : undefined,
  }
}

const imageElementToDataUrl = (src) =>
  new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || img.width
        canvas.height = img.naturalHeight || img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch (error) {
        console.warn('imageElementToDataUrl failed:', src, error)
        resolve('')
      }
    }
    img.onerror = () => resolve('')
    img.src = src
  })

const normalizeImageToPngDataUrl = (src) =>
  new Promise((resolve) => {
    if (!src) {
      resolve('')
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || img.width || 1
        canvas.height = img.naturalHeight || img.height || 1
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/png'))
      } catch (error) {
        console.warn('normalizeImageToPngDataUrl failed:', error)
        resolve('')
      }
    }
    img.onerror = () => resolve('')
    img.src = src
  })

const getWordCompatibleLogoDataUrl = async (primarySrc, fallbackSrc = prexoLogo) => {
  const primaryRaw = primarySrc ? await toDataUrl(primarySrc) : ''
  const primaryPng = primaryRaw ? await normalizeImageToPngDataUrl(primaryRaw) : ''
  if (primaryPng) return primaryPng

  const fallbackPng = fallbackSrc ? await normalizeImageToPngDataUrl(fallbackSrc) : ''
  return fallbackPng || ''
}

const toDataUrl = async (src) => {
  if (!src) return ''
  if (src.startsWith('data:')) return src

  try {
    const response = await fetch(src)
    if (!response.ok) return ''

    const blob = await response.blob()

    return await new Promise((res, rej) => {
      const reader = new FileReader()
      reader.onloadend = () => res(reader.result || '')
      reader.onerror = rej
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.warn('toDataUrl failed:', src, error)
    return imageElementToDataUrl(src)
  }
}

const toDocxImg = async (src) => {
  if (!src) return null
  const url = src.startsWith('data:') ? src : await toDataUrl(src)
  if (!url) return null
  const parts = url.split(',')
  if (parts.length < 2) return null
  const meta = parts[0]
  const b64 = parts[1]
  const type = meta.includes('png') || meta.includes('webp') ? 'png' : 'jpg'
  return { data: Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)), type }
}

const makeRoundedDataUrl = (src, w, h, r) =>
  new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      ctx.clearRect(0, 0, w, h)
      
      // Keep the corners transparent so the cover background stays visible.
      ctx.beginPath()
      ctx.moveTo(r, 0)
      ctx.lineTo(w - r, 0)
      ctx.quadraticCurveTo(w, 0, w, r)
      ctx.lineTo(w, h - r)
      ctx.quadraticCurveTo(w, h, w - r, h)
      ctx.lineTo(r, h)
      ctx.quadraticCurveTo(0, h, 0, h - r)
      ctx.lineTo(0, r)
      ctx.quadraticCurveTo(0, 0, r, 0)
      ctx.closePath()
      ctx.clip()

      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, w, h)
      drawContainedImage(ctx, img, 0, 0, w, h)
      
      resolve(c.toDataURL('image/png'))
    }
    img.onerror = () => resolve(src)
    img.src = src
  })

// ─── Cover canvas composite ────────────────────────────────────────────────────
// const makeCoverDataUrl = (bgUrl, logoRoundedUrl, companyName) =>
//   new Promise((resolve) => {
//     const S = 2
//     const W = PAGE_W_PX
//     const H = PAGE_H_PX
//     const cv = document.createElement('canvas')
//     cv.width = W * S
//     cv.height = H * S
//     const ctx = cv.getContext('2d')
//     ctx.scale(S, S)

//     const overlay = () => {
//       // no gradient — raw cover image only
//       ctx.font = 'bold 30px Arial'
//       ctx.fillStyle = '#fff'
//       ctx.textBaseline = 'top'
//       ctx.textAlign = 'left'
//       ctx.fillText(companyName || 'PrexoAI', 40, 40)
//       const LY = H - 230
//       const LW = 157
//       const LH = 79
//       const writeText = () => {
//         ctx.font = 'bold 44px Arial'
//         ctx.fillStyle = '#fff'
//         ctx.fillText('RFI Drafter', 40, LY + LH + 12)
//         ctx.font = '17px Arial'
//         ctx.fillStyle = '#DBEAFE'

//         resolve(cv.toDataURL('image/png'))
//       }
//       if (logoRoundedUrl) {
//         const li = new Image()
//         li.crossOrigin = 'anonymous'
//         li.onload = () => { ctx.drawImage(li, 40, LY, LW, LH); writeText() }
//         li.onerror = writeText
//         li.src = logoRoundedUrl
//       } else {
//         writeText()
//       }
//     }

//     if (bgUrl) {
//       const bg = new Image()
//       bg.crossOrigin = 'anonymous'
//       bg.onload = () => { ctx.drawImage(bg, 0, 0, W, H); overlay() }
//       bg.onerror = () => { ctx.fillStyle = '#0A1A6B'; ctx.fillRect(0, 0, W, H); overlay() }
//       bg.src = bgUrl
//     } else {
//       ctx.fillStyle = '#0A1A6B'
//       ctx.fillRect(0, 0, W, H)
//       overlay()
//     }
//   })

const makeCoverDataUrl = (bgUrl, logoRoundedUrl, companyName, coverTitle) =>
  new Promise((resolve) => {
    const S = 2
    const W = PAGE_W_PX
    const H = PAGE_H_PX
    const cv = document.createElement('canvas')
    cv.width = W * S
    cv.height = H * S
    const ctx = cv.getContext('2d')
    ctx.scale(S, S)

    const overlay = () => {
      // ── PrexoAI: padding 98px top, 100px left ──
      ctx.font = '600 45px Arial'
      ctx.fillStyle = '#fff'
      ctx.textBaseline = 'top'
      ctx.textAlign = 'left'
      ctx.fillText('PrexoAI', 100, 98)

      // ── Bottom block: top:750px left:90px ──
      const BLOCK_TOP = 750
      const LEFT_X = 90
      const LOGO_W = 157
      const LOGO_H = 79
      const LOGO_MARGIN_BOTTOM = 35

      const writeText = () => {
        const titleY = BLOCK_TOP + LOGO_H + LOGO_MARGIN_BOTTOM
        ctx.font = 'bold 40px Arial'
        ctx.fillStyle = '#fff'
        ctx.textBaseline = 'top'
        ctx.textAlign = 'left'
        ctx.fillText(coverTitle || 'RFI FOR 0 GAPS', LEFT_X, titleY)
        resolve(cv.toDataURL('image/png'))
      }

      if (logoRoundedUrl) {
        const li = new Image()
        li.crossOrigin = 'anonymous'
      li.onload = () => {
  const r = 14
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(LEFT_X + r, BLOCK_TOP)
  ctx.lineTo(LEFT_X + LOGO_W - r, BLOCK_TOP)
  ctx.quadraticCurveTo(LEFT_X + LOGO_W, BLOCK_TOP, LEFT_X + LOGO_W, BLOCK_TOP + r)
  ctx.lineTo(LEFT_X + LOGO_W, BLOCK_TOP + LOGO_H - r)
  ctx.quadraticCurveTo(LEFT_X + LOGO_W, BLOCK_TOP + LOGO_H, LEFT_X + LOGO_W - r, BLOCK_TOP + LOGO_H)
  ctx.lineTo(LEFT_X + r, BLOCK_TOP + LOGO_H)
  ctx.quadraticCurveTo(LEFT_X, BLOCK_TOP + LOGO_H, LEFT_X, BLOCK_TOP + LOGO_H - r)
  ctx.lineTo(LEFT_X, BLOCK_TOP + r)
  ctx.quadraticCurveTo(LEFT_X, BLOCK_TOP, LEFT_X + r, BLOCK_TOP)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(li, LEFT_X, BLOCK_TOP, LOGO_W, LOGO_H)
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
      bg.onerror = () => { ctx.fillStyle = '#0A1A6B'; ctx.fillRect(0, 0, W, H); overlay() }
      bg.src = bgUrl
    } else {
      ctx.fillStyle = '#0A1A6B'
      ctx.fillRect(0, 0, W, H)
      overlay()
    }
  })

// ─── Header canvas composite ───────────────────────────────────────────────────
// ─── Header canvas composite ───────────────────────────────────────────────────


// ─── Header canvas composite (Updated for Integrated Block Style) ───────────────

// const makeHdrDataUrl = (logoRoundedUrl, companyName) =>
//   new Promise((resolve) => {
//     const S = 2
//     const W = HDR_W_PX
//     const H = HDR_H_PX
//     const cv = document.createElement('canvas')
//     cv.width = W * S
//     cv.height = H * S
//     const ctx = cv.getContext('2d')
//     ctx.scale(S, S)

//     // Blue background
//     ctx.fillStyle = '#0140C1'
//     ctx.fillRect(0, 0, W, H)

//     const done = () => resolve(cv.toDataURL('image/png'))

//     const drawRightLogo = () => {
//       if (!logoRoundedUrl) { done(); return }

//       const LW = 140
//       const LH = H
//       const LX = W - LW
//       const LY = 0
//       const R = 14

//       const img = new Image()
//       img.crossOrigin = 'anonymous'
//       img.onload = () => {
//         const scale = Math.max(LW / img.width, LH / img.height)
//         const drawW = img.width * scale
//         const drawH = img.height * scale
//         const drawX = LX + (LW - drawW) / 2
//         const drawY = LY + (LH - drawH) / 2

//         ctx.save()
//         ctx.beginPath()
//         ctx.moveTo(LX, LY)                    // top-left sharp
//         ctx.lineTo(LX + LW, LY)              // top-right sharp
//         ctx.lineTo(LX + LW, LY + LH)         // bottom-right sharp
//         ctx.lineTo(LX + R, LY + LH)          // bottom edge
//         ctx.quadraticCurveTo(LX, LY + LH, LX, LY + LH - R)  // bottom-left curve
//         ctx.lineTo(LX, LY)
//         ctx.closePath()
//         ctx.clip()
//         ctx.drawImage(img, drawX, drawY, drawW, drawH)
//         ctx.restore()
//         done()
//       }
//       img.onerror = done
//       img.src = logoRoundedUrl
//     }

//     // ✅ LEFT SIDE: Draw logo first, then text on top
//     if (logoRoundedUrl) {
//       const LEFT_LOGO_W = 60   // left logo width
//       const LEFT_LOGO_H = H    // full height
//       const LEFT_LOGO_X = 0    // flush left — NO gap
//       const LEFT_LOGO_Y = 0

//       const leftImg = new Image()
//       leftImg.crossOrigin = 'anonymous'
//       leftImg.onload = () => {
//         // Scale to cover
//         const scale = Math.max(LEFT_LOGO_W / leftImg.width, LEFT_LOGO_H / leftImg.height)
//         const drawW = leftImg.width * scale
//         const drawH = leftImg.height * scale
//         const drawX = LEFT_LOGO_X + (LEFT_LOGO_W - drawW) / 2
//         const drawY = LEFT_LOGO_Y + (LEFT_LOGO_H - drawH) / 2

//         ctx.save()
//         // Clip: only bottom-right corner rounded for left logo
//         ctx.beginPath()
//         ctx.moveTo(LEFT_LOGO_X, LEFT_LOGO_Y)
//         ctx.lineTo(LEFT_LOGO_X + LEFT_LOGO_W, LEFT_LOGO_Y)
//         ctx.lineTo(LEFT_LOGO_X + LEFT_LOGO_W, LEFT_LOGO_Y + LEFT_LOGO_H - 14)
//         ctx.quadraticCurveTo(LEFT_LOGO_X + LEFT_LOGO_W, LEFT_LOGO_Y + LEFT_LOGO_H, LEFT_LOGO_X + LEFT_LOGO_W - 14, LEFT_LOGO_Y + LEFT_LOGO_H)
//         ctx.lineTo(LEFT_LOGO_X, LEFT_LOGO_Y + LEFT_LOGO_H)
//         ctx.closePath()
//         ctx.clip()
//         ctx.drawImage(leftImg, drawX, drawY, drawW, drawH)
//         ctx.restore()

//         // ✅ "RFI Content" text — after left logo
//         ctx.font = 'bold 20px Arial'
//         ctx.fillStyle = '#fff'
//         ctx.textBaseline = 'middle'
//         ctx.textAlign = 'left'
//         ctx.fillText('RFI Content', LEFT_LOGO_W + 14, H / 2)  // text starts after logo

//         drawRightLogo()
//       }
//       leftImg.onerror = () => {
//         // fallback: just text if logo fails
//         ctx.font = 'bold 20px Arial'
//         ctx.fillStyle = '#fff'
//         ctx.textBaseline = 'middle'
//         ctx.textAlign = 'left'
//         ctx.fillText('RFI Content', 20, H / 2)
//         drawRightLogo()
//       }
//       leftImg.src = logoRoundedUrl
//     } else {
//       // No logo — just text
//       ctx.font = 'bold 20px Arial'
//       ctx.fillStyle = '#fff'
//       ctx.textBaseline = 'middle'
//       ctx.textAlign = 'left'
//       ctx.fillText('RFI Content', 20, H / 2)
//       drawRightLogo()
//     }
//   })


const makeRfiHeaderDataUrl = (logoCard, sectionTitle) =>
  new Promise((resolve) => {
    const S = 2
    const W = PAGE_W_PX
    const H = 112
    const LOGO_W = 157
    const LOGO_H = 79
    const LOGO_RIGHT_GAP = 50
    const LOGO_RADIUS = 10
    const cv = document.createElement('canvas')
    cv.width = W * S
    cv.height = H * S
    const ctx = cv.getContext('2d')
    ctx.scale(S, S)

    ctx.fillStyle = '#0140C1'
    ctx.fillRect(0, 0, W, H)

    ctx.font = 'bold 28px Arial'
    ctx.fillStyle = '#FFFFFF'
    ctx.textBaseline = 'middle'
    ctx.fillText(sectionTitle || 'Identified Gaps', 60, H / 2)

    const done = () => resolve(cv.toDataURL('image/png'))
    if (!logoCard) {
      done()
      return
    }

    const img = new Image()
    img.onload = () => {
      const x = W - LOGO_W - LOGO_RIGHT_GAP
      const y = 0

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + LOGO_W, y)
      ctx.lineTo(x + LOGO_W, y + LOGO_H - LOGO_RADIUS)
      ctx.quadraticCurveTo(x + LOGO_W, y + LOGO_H, x + LOGO_W - LOGO_RADIUS, y + LOGO_H)
      ctx.lineTo(x + LOGO_RADIUS, y + LOGO_H)
      ctx.quadraticCurveTo(x, y + LOGO_H, x, y + LOGO_H - LOGO_RADIUS)
      ctx.lineTo(x, y)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(img, x, y, LOGO_W, LOGO_H)
      ctx.restore()
      done()
    }
    img.onerror = done
    const chunkSize = 8192
    let binary = ''
    for (let i = 0; i < logoCard.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, logoCard.subarray(i, i + chunkSize))
    }
    img.src = 'data:image/png;base64,' + btoa(binary)
  })

function makeRfiHeader(headerImage) {
  const HEADER_H_PX = 112

  return new Header({
    children: [
      new Paragraph({
        spacing: { before: 0, after: 0 },
        shading: { type: ShadingType.SOLID, fill: '0140C1', color: '0140C1' },
        children: headerImage
          ? [
            new ImageRun({
              data: headerImage.data,
              transformation: {
                width: PAGE_W_PX + COVER_BLEED_PX * 2,
                height: HEADER_H_PX,
              },
              type: headerImage.type,
              floating: {
                zIndex: 1,
                behindDocument: false,
                allowOverlap: true,
                layoutInCell: false,
                lockAnchor: true,
                horizontalPosition: { relative: 'page', offset: -COVER_BLEED_EMU },
                verticalPosition: { relative: 'page', offset: 0 },
                wrap: { type: 'none', side: 'bothSides' },
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
              },
            }),
          ]
          : [
            new TextRun({
              text: 'Identified Gaps',
              bold: true,
              size: 44,
              color: 'FFFFFF',
              font: 'Arial',
            }),
          ],
      }),
    ],
  })
}

const makeRfiFooterDataUrl = (note) =>
  new Promise((resolve) => {
    const S = 2
    const W = PAGE_W_PX
    const H = 42 // Same height as BidInviteForCompanyLayout
    const cv = document.createElement('canvas')
    cv.width = W * S
    cv.height = H * S
    const ctx = cv.getContext('2d')
    ctx.scale(S, S)

    ctx.fillStyle = '#E5E7EB'
    ctx.fillRect(0, 0, W, H)

    ctx.font = '13px Arial'
    ctx.fillStyle = '#6B7280'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.fillText(note, 60, H / 2)

    resolve(cv.toDataURL('image/png'))
  })

const makeRfiFooter = (footerDataUrl) => {
  if (!footerDataUrl) return new Footer({ children: [] });
  const footerBase64 = footerDataUrl.split(',')[1];
  const footerUint8 = Uint8Array.from(atob(footerBase64), c => c.charCodeAt(0));

  const grayBg = { type: ShadingType.SOLID, fill: 'E5E7EB', color: 'E5E7EB' };
  const bleed = { left: -MARGIN_X, right: -MARGIN_X, firstLine: 0 };

  return new Footer({
    children: [
      new Paragraph({
        shading: grayBg,
        indent: bleed,
        spacing: { before: 0, after: 0 },
        children: [
          new ImageRun({
            data: footerUint8,
            type: 'png',
            transformation: { width: PAGE_W_PX, height: 40 },
            // NO floating — inline only, stays in footer zone
          }),
        ],
      }),
    ],
  });
}

// ─── RFI card (no nested tables — Mac Pages safe) ─────────────────────────────
const buildCard = (item) => {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [CONTENT_W],
    rows: [
      new TableRow({
        cantSplit: false,
        height: { value: 1, rule: HeightRule.AUTO },
        children: [
          new TableCell({
            verticalAlign: VerticalAlign.TOP,
            width: { size: CONTENT_W, type: WidthType.DXA },
            margins: { top: 220, bottom: 220, left: 240, right: 240 },
            borders: { top: CARD_BORDER, bottom: CARD_BORDER, left: CARD_BORDER, right: CARD_BORDER },
            children: [
              new Paragraph({
                spacing: { after: 80 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E0E0E0' } },
                children: [
                  new TextRun({ text: 'RFI-' + String(item.id).padStart(3, '0'), bold: true, size: 20, color: '0140C1', font: 'Arial' }),
                  new TextRun({ text: '   ' }),
                  new TextRun({ text: item.title || '', bold: true, size: 24, color: '1A1A1A', font: 'Arial' }),
                ],
              }),
              new Paragraph({
                spacing: { before: 80, after: 30 },
                children: [new TextRun({ text: 'Reference:', bold: true, size: 20, color: '333333', font: 'Arial' })],
              }),
              new Paragraph({
                spacing: { after: 80 },
                children: [new TextRun({ text: item.reference_section || '', size: 20, color: '555555', font: 'Arial' })],
              }),
              new Paragraph({
                spacing: { after: 30 },
                children: [new TextRun({ text: 'Question:', bold: true, size: 20, color: '333333', font: 'Arial' })],
              }),
              new Paragraph({
                spacing: { after: 100 },
                children: [new TextRun({ text: item.question || '', size: 20, color: '555555', font: 'Arial' })],
              }),
              new Paragraph({
                spacing: { before: 120, after: 40 },
                shading: { fill: 'FFF8F0', type: ShadingType.CLEAR },
                border: { top: IMPACT_BORDER, left: IMPACT_BORDER, right: IMPACT_BORDER },
                indent: { left: 180, right: 180 },
                children: [new TextRun({ text: 'Proposal Impact:', bold: true, size: 20, color: 'E07B00', font: 'Arial' })],
              }),
              new Paragraph({
                spacing: { before: 0, after: 120 },
                shading: { fill: 'FFF8F0', type: ShadingType.CLEAR },
                border: { bottom: IMPACT_BORDER, left: IMPACT_BORDER, right: IMPACT_BORDER },
                indent: { left: 180, right: 180 },
                children: [new TextRun({ text: item.proposal_impact || '', size: 20, color: 'E07B00', font: 'Arial' })],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

// ─── Patch docx blob to remove blank page ─────────────────────────────────────
// docx.js emits a section-break paragraph: <w:p><w:pPr><w:sectPr>...</w:sectPr></w:pPr></w:p>
// Word gives it default 12pt line height → blank page between sections.
// Fix: inject spacing(line=1) + font(sz=2) so it renders at ~0 height.
// const patchDocxBlob = async (blob) => {
//   try {
//     const zip    = new JSZip()
//     const loaded = await zip.loadAsync(blob)
//     const docXml = await loaded.file('word/document.xml').async('string')
//  const sectionMatch = docXml.match(/<w:p[^>]*>[\s\S]{0,200}<w:sectPr/)
// console.log('SECTION BREAK XML:', sectionMatch?.[0])
//     // Fix 1: section-break paragraph — collapse to zero height
//     let patched = docXml.replace(
//       /(<w:p[ >])([\s\S]*?)(<w:pPr>)([\s\S]*?)(<w:sectPr[\s\S]*?<\/w:sectPr>)([\s\S]*?)(<\/w:pPr>)([\s\S]*?)(<\/w:p>)/g,
//       (match) => {
//         if (!match.includes('<w:sectPr')) return match
//         return match
//           .replace(
//             /(<w:pPr>)/,
//             '$1<w:spacing w:before="0" w:after="0" w:line="1" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr>'
//           )
//       }
//     )

//     // Fix 2: also target the simpler single-line pattern (docx.js v8+)
//     patched = patched.replace(
//       /<w:p><w:pPr><w:sectPr/g,
//       '<w:p><w:pPr>' +
//       '<w:spacing w:before="0" w:after="0" w:line="1" w:lineRule="exact"/>' +
//       '<w:rPr><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr>' +
//       '<w:sectPr'
//     )

//     loaded.file('word/document.xml', patched)

//     const patchedBlob = await loaded.generateAsync({
//       type:               'blob',
//       mimeType:           'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       compression:        'DEFLATE',
//       compressionOptions: { level: 6 },
//     })
//     return patchedBlob
//   } catch (err) {
//     console.warn('patchDocxBlob failed, returning original:', err)
//     return blob
//   }
// }

const patchDocxBlob = async (blob) => {
  try {
    const zip = new JSZip()
    const loaded = await zip.loadAsync(blob)
    const docXml = await loaded.file('word/document.xml').async('string')

    // Strategy: find every <w:p> that contains a <w:sectPr> and collapse it
    const patched = docXml.replace(
      /<w:p[ >][\s\S]*?<\/w:p>/g,
      (match) => {
        if (!match.includes('<w:sectPr')) return match

        // Already has w:pPr — inject spacing + rPr before </w:pPr>
        if (match.includes('<w:pPr>') || match.includes('<w:pPr ')) {
          return match
            .replace(
              /<\/w:pPr>/,
              '<w:spacing w:before="0" w:after="0" w:line="1" w:lineRule="exact"/>' +
              '<w:rPr><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr>' +
              '</w:pPr>'
            )
        }

        // No w:pPr — inject one before the sectPr
        return match.replace(
          /<w:sectPr/,
          '<w:pPr>' +
          '<w:spacing w:before="0" w:after="0" w:line="1" w:lineRule="exact"/>' +
          '<w:rPr><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr>' +
          '</w:pPr><w:sectPr'
        )
      }
    )

    loaded.file('word/document.xml', patched)

    return await loaded.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })
  } catch (err) {
    console.warn('patchDocxBlob failed:', err)
    return blob
  }
}


// ─── Build Word blob ───────────────────────────────────────────────────────────
const buildRfiWordBlob = async (opts) => {
  const items = opts.items
  const companyLogo = opts.companyLogo
  const companyName = opts.companyName
  const coverBg = opts.coverBg
  const { coverTitle, sectionTitle } = getRfiDocumentTitles(items.length)

  let logoDataUrl = ''
  let logoRndCoverUrl = null
  let headerLogoCard = null
  let headerImageUrl = ''
  let headerImage = null
  let coverUrl = ''
  let coverImg = null

  try {
    logoDataUrl = await getWordCompatibleLogoDataUrl(companyLogo)
  } catch (error) {
    console.warn('logoDataUrl failed:', error)
  }

  try {
    logoRndCoverUrl = logoDataUrl
      ? await makeRoundedDataUrl(logoDataUrl, 157, 79, 14)
      : null
  } catch (error) {
    console.warn('logoRndCoverUrl failed:', error)
  }

  try {
    headerLogoCard = logoDataUrl
      ? await buildRoundedLogoCard(logoDataUrl, {
        cardWidth: 157,
        cardHeight: 79,
        tl: 0,
        tr: 0,
        bl: 14,
        br: 0,
      })
      : null
  } catch (error) {
    console.warn('headerLogoCard failed:', error)
    headerLogoCard = null
  }

  try {
    headerImageUrl = await makeRfiHeaderDataUrl(headerLogoCard, sectionTitle)
    headerImage = await toDocxImg(headerImageUrl)
  } catch (error) {
    console.warn('header image generation failed:', error)
    headerImage = null
  }

  try {
    coverUrl = await makeCoverDataUrl(coverBg, logoRndCoverUrl, companyName, coverTitle)
    coverImg = await toDocxImg(coverUrl)
  } catch (error) {
    console.warn('cover image generation failed:', error)
    coverImg = null
  }

  // ── Step 5: Cover paragraph ──
  const coverPara = new Paragraph({
    spacing: { before: 0, after: 0 },
    shading: { type: ShadingType.SOLID, fill: COVER_PAGE_BG, color: COVER_PAGE_BG },
    children: coverImg
      ? [
        new ImageRun({
          data: coverImg.data,
          type: coverImg.type,
          transformation: {
            width: PAGE_W_PX + COVER_BLEED_PX * 2,
            height: PAGE_H_PX + COVER_BLEED_PX * 2,
          },
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
      ]
      : [new TextRun({ text: companyName || 'PrexoAI', bold: true, size: 52, color: 'FFFFFF', font: 'Arial' })],
  })

  // ── Step 6: Footer ──
  const footerDataUrl = await makeRfiFooterDataUrl(
   'This report was generated by PrexoAI'
  )

  // ── Step 7: Content children ──This report was generated by PrexoAI
  const contentKids = items.length
    ? [
      new Paragraph({ spacing: { after: 420 } }),
      ...items.flatMap((item) => [buildCard(item), new Paragraph({ spacing: { after: 200 } })]),
    ]
    : [
      new Paragraph({ spacing: { after: 420 } }),
      new Paragraph({ children: [new TextRun({ text: 'No RFI items available.', size: 22, font: 'Arial' })] }),
    ]

  // ── Step 8: Build document ──
  const doc = new Document({
    sections: [
      // Cover page
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: PAGE_H },
            margin: { top: 0, bottom: 0, left: 0, right: 0, header: 0, footer: 0 },
          },
        },
        children: [coverPara],
      },
      // Content pages
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: PAGE_H },
            margin: { top: 1320, bottom: MARGIN_B, left: MARGIN_X, right: MARGIN_X, header: 0, footer: 0 },
          },
        },
        headers: { default: makeRfiHeader(headerImage) },
        footers: { default: makeRfiFooter(footerDataUrl) },
        children: contentKids,
      },
    ],
  })

  const rawBlob = await Packer.toBlob(doc)
  return patchDocxBlob(rawBlob)
}

// ─── React component ───────────────────────────────────────────────────────────
const GenerateRFILayout = () => {
  const location = useLocation()
  const state = location?.state
  const outletContext = useOutletContext()
  const isExpanded = outletContext?.isExpanded ?? true
  const { rfi_drafter_uuid } = useParams()
  const isViewMode = Boolean(state?.isViewMode)
  const hasRouteStateRfiContent = hasGeneratedRfiContent(state?.rfiData)
  const fallbackGapData = useMemo(
    () => state?.gaps ?? state?.rfiData?.gap_data ?? [],
    [state?.gaps, state?.rfiData?.gap_data],
  )
  const expectedSelectedGapIds = useMemo(
    () => getSelectedGapIds(fallbackGapData),
    [fallbackGapData],
  )
  const isGenerateOnLoadFlow = Boolean(
    state?.loadFromDetail &&
    !isViewMode &&
    state?.rfiData?.rfi_drafter_id &&
    fallbackGapData.length > 0,
  )
  const isViewLikeLoad = Boolean(
    rfi_drafter_uuid &&
    !isViewMode &&
    !state?.context &&
    !state?.loadFromDetail &&
    !hasRouteStateRfiContent,
  )
  const shouldUseFullPageLoader = Boolean(
    isViewMode ||
    isViewLikeLoad ||
    (state?.loadFromDetail && !isGenerateOnLoadFlow)
  )
  const shouldLoadViewDetail = Boolean(
    rfi_drafter_uuid &&
    (
      isViewMode ||
      isViewLikeLoad ||
      (state?.loadFromDetail && !isGenerateOnLoadFlow)
    ),
  )
  const initialRfiData = useMemo(
    () => getInitialRfiState(state?.rfiData, shouldUseFullPageLoader),
    [shouldUseFullPageLoader, state?.rfiData],
  )
  const [rfiData, setRfiData] = useState(initialRfiData)
  const [gaps, setGaps] = useState(fallbackGapData)
  const [isDetailLoading, setIsDetailLoading] = useState(
    Boolean(
      state?.loadFromDetail ||
      (!initialRfiData && rfi_drafter_uuid) ||
      shouldLoadViewDetail,
    ),
  )
  const content = getRfiContent(rfiData)
  const hasViewResponseContent = hasGeneratedRfiContent(rfiData)
  const rfiDrafterId = rfiData?.rfi_drafter_id
  const contentCount = getRfiContentCount(content)
  const { coverTitle, sectionTitle } = getRfiDocumentTitles(contentCount)

  const { permissions } = usePermissions('rfi_drafter', 'contract_command')
  const { isMarkAsCompleted} = useEstimation();
  const organizationImage = useSelector((s) => s?.auth?.user?.[0]?.organization_image)

  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingWord, setIsExportingWord] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const exportRef = useRef(null)
  const editorContentRef = useRef('')
  const hasTriggeredInitialDraftRef = useRef(false)
  const hasTriggeredDetailLoadRef = useRef(false)
  const hasShownDeferredToastRef = useRef(false)
  const navigate = useNavigate()
  const projectUId = localStorage.getItem('project_uuid')
  const successToastMessage = state?.successToastMessage

  const shouldGenerateOnLoad = Boolean(
    isGenerateOnLoadFlow &&
    (state?.rfiData?.rfi_drafter_id || rfiData?.rfi_drafter_id) &&
    fallbackGapData.length > 0 &&
    !isExpectedRfiDetailReady(state?.rfiData, expectedSelectedGapIds),
  )

  useEffect(() => {
    hasTriggeredInitialDraftRef.current = false
    hasTriggeredDetailLoadRef.current = false
  }, [rfi_drafter_uuid])

  useEffect(() => {
    hasShownDeferredToastRef.current = false
  }, [rfi_drafter_uuid, successToastMessage])

  useEffect(() => {
    setRfiData(initialRfiData)
  }, [initialRfiData])

  useEffect(() => {
    let isMounted = true

    if (!shouldGenerateOnLoad || hasTriggeredInitialDraftRef.current) {
      return () => {
        isMounted = false
      }
    }

    hasTriggeredInitialDraftRef.current = true
    hasTriggeredDetailLoadRef.current = true

    const generateInitialRfi = async () => {
      try {
        setIsDetailLoading(true)

        const rfiDrafterId = state?.rfiData?.rfi_drafter_id || rfiData?.rfi_drafter_id
        const draftFallbackData = {
          ...(state?.rfiData || {}),
          rfi_drafter_id: rfiDrafterId,
          gap_data: fallbackGapData,
        }

        const response = await generate_data({
          rfi_drafter_id: rfiDrafterId,
          context: state?.context || '',
          gap_data: fallbackGapData,
        })

        if (!isMounted) return

        if (response?.valid) {
          const generatedContent = response?.data?.content || []
          const generatedFallbackData = {
            ...draftFallbackData,
            rfi_drafter_id: rfiDrafterId,
            gap_data: resolvePreferredGapData(
              response?.data?.gap_data,
              fallbackGapData,
              expectedSelectedGapIds,
            ),
            data: {
              ...(response?.data || {}),
              content: generatedContent,
            },
          }
          setRfiData(generatedFallbackData)
          setGaps(
            resolvePreferredGapData(
              generatedFallbackData?.gap_data,
              fallbackGapData,
              expectedSelectedGapIds,
            ),
          )

          const detailData = await fetchRfiDetailOnce(
            rfi_drafter_uuid,
            generatedFallbackData,
          )

          if (!isMounted) return

          const resolvedRfiData = mergeRfiDetailWithFallback(
            detailData,
            generatedFallbackData,
            expectedSelectedGapIds,
          )

          setRfiData(resolvedRfiData)
          setGaps(
            resolvePreferredGapData(
              resolvedRfiData?.gap_data,
              fallbackGapData,
              expectedSelectedGapIds,
            ),
          )
        } else {
          showToast('error', response?.message || 'Failed to generate RFI.')
        }
      } catch (error) {
        console.error('Failed to generate RFI:', error)
        if (isMounted) {
          showToast('error', 'Something went wrong while generating RFI.')
        }
      } finally {
        if (isMounted) {
          setIsDetailLoading(false)
        }
      }
    }

    generateInitialRfi()

    return () => {
      isMounted = false
    }
  }, [
    expectedSelectedGapIds,
    fallbackGapData,
    isViewMode,
    rfiData?.rfi_drafter_id,
    shouldGenerateOnLoad,
    state?.context,
    state?.rfiData,
  ])

  useEffect(() => {
    let isMounted = true

    const shouldLoadFromDetail =
      !shouldGenerateOnLoad &&
      Boolean(rfi_drafter_uuid)
    const shouldShowDetailLoader =
      Boolean(state?.loadFromDetail) ||
      !state?.rfiData ||
      !hasRouteStateRfiContent ||
      shouldLoadViewDetail

    if (!rfi_drafter_uuid) {
      setIsDetailLoading(false)
      return () => {
        isMounted = false
      }
    }

    if (!shouldLoadFromDetail) {
      // Keep the generating loader active while the draft request is still in progress.
      if (!shouldGenerateOnLoad) {
        setIsDetailLoading(false)
      }
      return () => {
        isMounted = false
      }
    }

    if (hasTriggeredDetailLoadRef.current) {
      return () => {
        isMounted = false
      }
    }
    hasTriggeredDetailLoadRef.current = true

    const loadRfiDetail = async () => {
      try {
        if (shouldShowDetailLoader) {
          setIsDetailLoading(true)
        }
        const detailData = await fetchRfiDetailOnce(rfi_drafter_uuid, state?.rfiData)

        if (!isMounted) return

        setRfiData(detailData || state?.rfiData || null)
        setGaps(
          resolvePreferredGapData(
            detailData?.gap_data,
            fallbackGapData,
            expectedSelectedGapIds,
          ),
        )
      } catch (error) {
        console.error('Failed to load RFI detail:', error)
        if (isMounted) {
          showToast('error', 'Something went wrong while loading RFI.')
        }
      } finally {
        if (isMounted) {
          setIsDetailLoading(false)
        }
      }
    }

    loadRfiDetail()

    return () => {
      isMounted = false
    }
  }, [
    expectedSelectedGapIds,
    fallbackGapData,
    hasRouteStateRfiContent,
    rfi_drafter_uuid,
    shouldGenerateOnLoad,
    shouldLoadViewDetail,
    state?.loadFromDetail,
    state?.rfiData,
  ])

  useEffect(() => {
    const onOut = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setShowExportMenu(false)
    }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [])

  useEffect(() => {
    if (isDetailLoading || !hasViewResponseContent) {
      return
    }

    if (successToastMessage && !hasShownDeferredToastRef.current) {
      hasShownDeferredToastRef.current = true
      showToast('success', successToastMessage)
    }

    if (isViewMode) return

    const shouldPersistResolvedState =
      !state?.rfiData ||
      !hasGeneratedRfiContent(state?.rfiData) ||
      Boolean(state?.loadFromDetail) ||
      Boolean(state?.context) ||
      Boolean(successToastMessage)

    if (!shouldPersistResolvedState) {
      return
    }

    navigate(location.pathname, {
      replace: true,
      state: {
        ...(isViewMode ? { isViewMode: true } : {}),
        rfiData,
        gaps,
      },
    })
  }, [
    gaps,
    hasViewResponseContent,
    isDetailLoading,
    isViewMode,
    location.pathname,
    navigate,
    rfiData,
    successToastMessage,
    state,
  ])

  useEffect(() => {
    if (typeof content === 'string' && content.trim()) {
      editorContentRef.current = content
    } else if (Array.isArray(content) && content.length > 0) {
      editorContentRef.current = contentToHtml(content)
    } else {
      editorContentRef.current = ''
    }
  }, [content])

  const handleContentChange = (html) => { editorContentRef.current = html }

  const handleExportPDF = async () => {
    setShowExportMenu(false)
    setIsExportingPdf(true)
    try {
      const fi = getFormattedItems(editorContentRef.current, content)
      if (!fi.length) { showToast('error', 'No data available to export'); return }
      const { coverBg, defaultLogo } = await getPdfAssets()
      const logoUrl = organizationImage
        ? CONFIG.VITE_AWS_ENDPOINT + '/organization_images/' + organizationImage
        : defaultLogo
    const blob = await GenerateRfiPdf({
  items: fi,
  editorHtml: editorContentRef.current || '',   // ← ADD THIS LINE
  generatedOn: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  companyName: 'PrexoAI',
  coverBg: coverBg,
  companyLogo: logoUrl,
  organization_id: localStorage.getItem('organization_id') || '',
})
      const fb = blob instanceof Blob ? blob : new Blob([blob], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(fb)
      const a = document.createElement('a')
      a.href = url
      a.setAttribute('download', 'RFI-Document.pdf')
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      showToast('error', 'Failed to export PDF.')
    } finally {
      setIsExportingPdf(false)
    }
  }

  const handleExportWord = async () => {
    setShowExportMenu(false)
    setIsExportingWord(true)
    try {
      const fi = getFormattedItems(editorContentRef.current, content)
      if (!fi.length) { showToast('error', 'No data available to export'); return }
      const { coverBg, defaultLogo } = await getPdfAssets()
      const logoUrl = organizationImage
        ? CONFIG.VITE_AWS_ENDPOINT + '/organization_images/' + organizationImage
        : defaultLogo
      const blob = await buildRfiWordBlob({
        items: fi,
        generatedOn: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        companyLogo: logoUrl,
        companyName: 'PrexoAI',
        coverBg: coverBg,
      })
      saveAs(blob, 'RFI-Document.docx')
    } catch (e) {
      console.error('Word export failed:', e)
      showToast('error', 'Failed to export Word.')
    } finally {
      setIsExportingWord(false)
    }
  }

  const handleSaveAndReturn = async () => {
    setIsSaving(true)
    try {
      const r = await Update_generate_data({
        rfi_drafter_id: rfiDrafterId,
        content_text: editorContentRef.current,
      })
      showToast('success', r.message)
      navigate('/project/view/' + projectUId + '/contract-command/rfi-drafter')
    } catch (e) {
      console.error(e)
      showToast('error', e.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (shouldUseFullPageLoader && (isDetailLoading || !hasViewResponseContent)) {
    return <FullPageLoader />
  }

  if (isDetailLoading) {
    return isViewMode
      ? <FullPageLoader />
      : (
        <div
          className='tw-fixed tw-z-[9997]'
          style={{
            top: '60px',
            left: isExpanded ? '225px' : '60px',
            right: 0,
            bottom: 0,
          }}
        >
          <GeneratingRFI gapsCount={getLoaderGapCount(gaps)} />
        </div>
      )
  }

  return (
    <div className='tw-flex tw-flex-col tw-gap-4'>
      {isSaving && <FullPageLoader />}

      <div className='tw-flex tw-justify-between tw-items-center'>
        <NavigationHeader
          title=' RFI Drafter /'
          subTitle={coverTitle}
          navigation={'/project/view/' + projectUId + '/contract-command/rfi-drafter'}
        />

        <div className='buttons tw-flex tw-gap-4 tw-items-center tw-pr-14'>
          {permissions?.edit && (
  <button
    onClick={handleSaveAndReturn}
    disabled={isSaving || isMarkAsCompleted}   // ← add isMarkAsCompleted
    className={`tw-min-w-[165px] tw-text-[15px] tw-border tw-py-2 tw-rounded-[5px] tw-transition-colors
      ${isSaving || isMarkAsCompleted
        ? "tw-text-gray-400 tw-bg-gray-100 tw-border-gray-300 tw-cursor-not-allowed tw-opacity-60"
        : "tw-text-[#0140c1] tw-bg-white tw-border-[#0140c1] hover:tw-bg-[#f0f5ff]"
      }`}
  >
    {isSaving ? 'Saving...' : 'Save & Return'}
  </button>
)}

          {permissions?.export && (
            <div className='tw-relative' ref={exportRef}>
              <button
                onClick={() => { if (!(isExportingPdf || isExportingWord)) setShowExportMenu((p) => !p) }}
                disabled={isExportingPdf || isExportingWord}
                className='group tw-min-w-[165px] tw-border tw-bg-[#0140c1] tw-font-[600] tw-border-[#0140c1] tw-rounded-[5px] tw-flex tw-gap-2 tw-justify-center tw-items-center tw-py-2 tw-text-white tw-transition-all tw-duration-300 tw-ease-in-out hover:tw-bg-[#1b44c4] hover:tw-shadow-lg hover:tw-shadow-blue-200/50 hover:tw-scale-[1.03] hover:-tw-translate-y-[1px] active:tw-scale-[0.98] disabled:tw-opacity-60 disabled:tw-cursor-not-allowed disabled:tw-scale-100 disabled:tw-translate-y-0 disabled:tw-shadow-none'
              >
                {isExportingPdf || isExportingWord ? (
                  <span className='tw-flex tw-items-center tw-justify-center tw-gap-2 tw-w-full'>
                    <svg className='tw-animate-spin tw-w-4 tw-h-4 tw-flex-shrink-0' viewBox='0 0 24 24' fill='none'>
                      <circle className='tw-opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                      <path className='tw-opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8z' />
                    </svg>
                    <span className='tw-text-[14px] tw-font-[600] tw-whitespace-nowrap'>
                      {isExportingPdf ? 'Generating PDF\u2026' : 'Generating Word\u2026'}
                    </span>
                  </span>
                ) : (
                  <React.Fragment>
                    <i className='icon-Export-PDF !tw-font-[400]'></i>
                    <span className='tw-text-[15px]'>Export RFI</span>
                    <i className={'icon-Down tw-text-[11px] tw-transition-transform tw-duration-200 ' + (showExportMenu ? 'tw-rotate-180' : '')}></i>
                  </React.Fragment>
                )}
              </button>

              {showExportMenu && !(isExportingPdf || isExportingWord) && (
                <div className='tw-absolute tw-right-0 tw-top-[calc(100%+6px)] tw-w-[190px] tw-bg-white tw-border tw-border-[#e0e0e0] tw-rounded-[8px] tw-shadow-lg tw-z-[999] tw-overflow-hidden'>
                  <button
                    onClick={handleExportPDF}
                    className='tw-flex tw-items-center tw-gap-3 tw-w-full tw-px-4 tw-py-3 tw-transition-all tw-duration-200 tw-ease-in-out hover:tw-bg-[#f5f5f5] hover:tw-pl-5'
                  >
                    <div className='tw-flex tw-items-center tw-justify-center tw-w-6 tw-h-6 tw-rounded-[6px] tw-flex-shrink-0'>
                      <i className='icon-pdf tw-text-[#dc2626] tw-text-[23px]'></i>
                    </div>
                    <div className='tw-flex tw-flex-col tw-items-start'>
                      <span className='tw-text-[13px] tw-font-[500] tw-text-[#333]'>Export as PDF</span>
                      <span className='tw-text-[11px] tw-text-[#333]'>Ready for submission</span>
                    </div>
                  </button>

                  <div className='tw-h-[1px] tw-bg-[#f0f0f0]'></div>

                  <button
                    onClick={handleExportWord}
                    className='tw-flex tw-items-center tw-gap-3 tw-w-full tw-px-4 tw-py-3 tw-transition-all tw-duration-200 tw-ease-in-out hover:tw-bg-[#f5f5f5] hover:tw-pl-5'
                  >
                    <div className='tw-flex tw-items-center tw-justify-center tw-w-6 tw-h-6 tw-rounded-[6px] tw-flex-shrink-0'>
                      <i className='icon-Document tw-text-[#1d4ed8] tw-text-[23px]'></i>
                    </div>
                    <div className='tw-flex tw-flex-col tw-items-start'>
                      <span className='tw-text-[13px] tw-font-[500] tw-text-[#333]'>Export as Word</span>
                      <span className='tw-text-[11px] tw-text-[#333]'>Editable .docx format</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className='tw-pl-14 tw-flex tw-flex-col tw-gap-4 tw-pr-14'>
        <GapsInfo content={content} gaps={gaps} />
        <DocumentContent
          content={content}
          onContentChange={handleContentChange}
          gaps={gaps}
          rfiDrafterId={rfiDrafterId}
          sectionTitle={sectionTitle}
        />
      </div>
    </div>
  )
}

export default GenerateRFILayout
