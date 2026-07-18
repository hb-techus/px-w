
import React from 'react'
import DOMPurify from 'dompurify'

const severityConfig = (severity) => {
  const map = {
    Critical: {
      style: 'tw-bg-[#fce7f3] tw-border-[#f9a8d4] tw-text-[#9d174d]',
      icon: 'icon-AI-Risk-Identifier'
    },
    High: {
      style: 'tw-bg-[#ffe2e3] tw-border-[#fca5a5] tw-text-[#b91c1b]',
      icon: 'icon-AI-Risk-Identifier'
    },
    Medium: {
      style: 'tw-bg-[#fff7e6] tw-border-[#fcd34d] tw-text-[#b45309]',
      icon: 'icon-Alert'
    },
    Low: {
      style: 'tw-bg-[#eaf1ff] tw-border-[#93c5fd] tw-text-[#1e4ed8]',
      icon: 'icon-Alert'
    },
  }
  return map[severity] || map['Low']
}

const RequestInfoDetails = ({ content = [] }) => {

  // ── If content is an HTML string, render it directly ──────────
  if (typeof content === 'string') {
    return (
      <div
        className='tw-mt-6'
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content, { USE_PROFILES: { html: true } }) }}
      />
    )
  }

  // ── If content is an array of objects, render structured view ──
  return (
    <div className='tw-flex tw-flex-col tw-gap-6 tw-mt-6'>
      {content.map((item) => (
        <div key={item.id} className='tw-border tw-border-[#e0e0e0] tw-rounded-[5px] tw-p-4 tw-flex tw-flex-col tw-gap-3'>

          {/* Header */}
          <div className='tw-flex tw-justify-between tw-items-start'>
            <div className='tw-flex tw-flex-col tw-gap-1'>
              <span className='tw-text-[#0140c1] tw-font-[600] tw-text-[13px]'>
                RFI-{String(item.id).padStart(3, "0")}
              </span>
              <span className='tw-text-[15px] tw-font-bold tw-text-[#333]'>{item.title}</span>
            </div>

            {/* Severity Badge */}
           {item.severity && (() => {
  const { style, icon } = severityConfig(item.severity)

  const formattedSeverity =
    item.severity.charAt(0).toUpperCase() + item.severity.slice(1)

  return (
    <span className={`tw-inline-flex tw-items-center tw-gap-[6px] tw-border tw-rounded-[20px] tw-px-4 tw-py-[6px] tw-text-[13px] tw-font-[600] tw-whitespace-nowrap ${style}`}>
      <i className={`${icon} tw-text-[13px]`}></i>
      {formattedSeverity}
    </span>
  )
})()}
          </div>

          {/* Reference */}
          <div className='tw-flex tw-flex-col tw-gap-[2px]'>
            <span className='tw-font-[600] tw-text-[13px] tw-text-[#333]'>Reference:</span>
            <span className='tw-text-[13px] tw-text-[#555]'>{item.reference_section}</span>
          </div>

          {/* Question */}
          <div className='tw-flex tw-flex-col tw-gap-[2px]'>
            <span className='tw-font-[600] tw-text-[13px] tw-text-[#333]'>Question:</span>
            <span className='tw-text-[13px] tw-text-[#555]'>{item.question}</span>
          </div>

          {/* Proposal Impact */}
          <div className='tw-bg-[#fff8f0] tw-border tw-border-[#ffd6a5] tw-rounded-[5px] tw-p-3'>
            <p className='tw-text-[#e07b00] tw-font-[600] tw-text-[13px] tw-mb-1'>Proposal Impact:</p>
            <p className='tw-text-[#e07b00] tw-text-[13px]'>{item.proposal_impact}</p>
          </div>

        </div>
      ))}
    </div>
  )
}

export default RequestInfoDetails