import React from 'react'

const TipBox = () => {
  return (
    <div className='tw-rounded-[5px] tw-border tw-border-[#fed8aa] tw-bg-[#fff7ed] tw-py-5 tw-px-4 tw-flex tw-items-center tw-gap-3'>
        <div className='tw-rounded-[15px] tw-bg-[#ffd4c3] tw-text-[#c3420d] tw-w-[56px] tw-h-[56px] tw-flex tw-items-center tw-justify-center tw-flex-shrink-0'>
            <i className='icon-Info-line tw-text-[26px] tw-font-medium'></i>
        </div>
        <div className='tw-text-[#c3420d] tw-max-w-[91.6%] tw-tracking-wide tw-text-[15px] ' >
            <span className='tw-font-[500] tw-text-[15px] '>Tips for creating effective bid invites:</span> Provide accurate company and contact information to ensure the AI generates a personalized and professional invitation. Select the appropriate trade category to include relevant scope details.
        </div>

    </div>
  )
}

export default TipBox