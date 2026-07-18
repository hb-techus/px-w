import React from 'react'
import { useNavigate } from 'react-router-dom'

const NavigationHeader = ({title,subTitle,navigation=''}) => {
    const navigate=useNavigate();
  return (
    <div className='section tw-flex tw-items-center tw-gap-4 tw-pr-14'>
        <div className='logo tw-bg-[#b3bcce] tw-text-[1.3rem] tw-px-2 tw-py-1 tw-cursor-pointer tw-text-[#fff] tw-rounded-[5px] 
hover:tw-bg-[#0140c1] tw-transition-colors tw-duration-200' onClick={()=>navigate(navigation)}>
            <i className='icon-Previous'></i>

        </div>
        <div className='content tw-flex tw-flex-col tw-mt-1'>
            <span className='tw-text-[14px] tw-text-[#535353] '>{title}</span>
            <span className='tw-text-[20px] tw-text-[#000] tw-font-[600]'>{subTitle}</span>

        </div>

    </div>
  )
}

export default NavigationHeader