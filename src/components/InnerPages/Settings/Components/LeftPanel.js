// import React from 'react'
// import { PANEL_DATA } from '../MetaData'
// import { capitalizeFirstLetter } from '../../../../utils/commonUtils'

// const LeftPanel = () => {
//   return (
//     <div className='tw-self-start tw-pt-8 tw-w-[200px]'>
//         <div className='tw-flex tw-gap-x-4 '>
//         <div className='tw-w-[3px]  tw-bg-gray-300'>
//             <div className='tw-h-[30%] tw-bg-blue-400'></div>
//         </div>
//         <div className='tw-flex tw-flex-col tw-gap-4 tw-py-1'>
//             {PANEL_DATA.map((d)=><span className='tw-text-[15px] tw-text-[#101828] tw-font-semibold'>{d.label?capitalizeFirstLetter(d.label):''}</span>)}
//         </div>
//         </div>
//     </div>
//   )
// }

// export default LeftPanel

import React from 'react'
import { PANEL_DATA } from '../MetaData'
import { capitalizeFirstLetter } from '../../../../utils/commonUtils'

const LeftPanel = ({ activeSection, setActiveSection }) => {
  return (
    <div className='tw-self-start tw-sticky tw-top-0 tw-pt-3 tw-w-[200px]'>
      <div className='tw-flex tw-flex-col'>
        {PANEL_DATA.map((d) => {
          const isActive = d.key === activeSection
          return (
            <div
              key={d.key}
              onClick={() => setActiveSection(d.key)}
              className={`tw-flex tw-items-center tw-cursor-pointer tw-py-3 tw-pl-3 tw-border-l-[3px] tw-transition-all tw-duration-200
                ${isActive
                  ? 'tw-border-[#4488ff] tw-bg-[#f0f4ff]'
                  : 'tw-border-gray-200 hover:tw-border-gray-400 hover:tw-bg-gray-50'
                }`}
            >
              <span
                className={`tw-text-[15px] tw-transition-all tw-duration-200
                  ${isActive
                    ? 'tw-text-[#101828] tw-font-bold'
                    : 'tw-text-[#101828] tw-font-normal'
                  }`}
              >
                {d.label ? capitalizeFirstLetter(d.label) : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default LeftPanel
