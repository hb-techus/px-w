

import React from 'react'

// ── Parse HTML string to extract RFI items ──────────────────────
const parseHtmlToItems = (html = '') => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const items = []

  doc.querySelectorAll('strong').forEach((el) => {
    const text = el.textContent.trim()
    if (text.startsWith('RFI-')) {
      const idMatch = text.match(/RFI-(\d+)/)
      if (idMatch) {
        // RFI strong is inside a <p>, title strong is in the NEXT <p>
        const currentP = el.closest('p')
        const nextP = currentP?.nextElementSibling
        const title = nextP?.querySelector('strong')?.textContent?.trim() || ''
        items.push({ id: parseInt(idMatch[1]), title })
      }
    }
  })

  return items
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

const getGapItems = (gaps = []) => {
  if (!Array.isArray(gaps) || gaps.length === 0) return []

  const hasExplicitSelection = gaps.some((gap) =>
    Object.prototype.hasOwnProperty.call(gap || {}, 'selected'),
  )

  return gaps
    .filter((gap) => (hasExplicitSelection ? Boolean(gap?.selected) : true))
    .map((gap, index) => {
      const gapId = normalizeGapId(gap?.id ?? gap?.gap_id ?? gap?.gapId) || `GAP-${String(index + 1).padStart(3, '0')}`

      return {
        key: gapId,
        label: gapId,
        title: gap?.title || gap?.name || gap?.material_gap || gap?.description || '',
      }
    })
}

const GapsInfo = ({ content = [], gaps = [] }) => {
  const gapItems = getGapItems(gaps)
  const contentItems = typeof content === 'string' ? parseHtmlToItems(content) : content
  const items = gapItems.length > 0
    ? gapItems
    : contentItems.map((item, index) => ({
        key: item?.id ?? index,
        label: `RFI-${String(item?.id ?? index + 1).padStart(3, '0')}`,
        title: item?.title || '',
      }))

  return (
    <div className='tw-bg-[#fff] tw-rounded-[5px] tw-border tw-border-[#e0e0e0] tw-px-6 tw-pt-4 tw-pb-5 tw-flex tw-flex-col tw-gap-[10px]'>
      <p className='tw-text-[17px] tw-flex tw-items-center tw-gap-[5px] tw-font-bold'>
        <i className='icon-Processed tw-text-[#2a9d52] tw-text-[17px]'></i>
        <span>Gaps Addressed in this RFI</span>
      </p>
      <div className='tw-pl-7 tw-flex tw-flex-wrap tw-gap-3'>
        {items.map((item) => (
          <span
            key={item.key}
            className='tw-text-[12px] tw-border tw-border-[#ffa4a4] tw-text-[#f44] tw-font-[600] tw-bg-[#fee] tw-rounded-[3px] tw-px-3 tw-py-[.2rem]'
          >
            {item.label}: {item.title}
          </span>

        ))}
      </div>
    </div>
  )
}

export default GapsInfo
