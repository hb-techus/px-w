import React from 'react'
import { useContext } from 'react'
import { SettingsContext } from '../Context/SettingsContext'
import { ORGANIZATION_CONTACT_DETAIL, ORGANIZATION_DETAIL } from '../MetaData';

const General = () => {
    const { orgData } = useContext(SettingsContext);
    console.log(orgData)
    return (
       <div className='tw-bg-[#fff] tw-rounded-[8px] tw-shadow-sm tw-overflow-hidden'>

            <div className='tw-border-b tw-py-3 tw-px-4'>
                <div className='tw-flex tw-items-center tw-gap-3 '>
                    <div className='tw-bg-blue-100  tw-flex tw-items-center tw-p-1.5 tw-rounded-[8px]'>
                        <i className='icon-Settings tw-text-[26px] tw-font-[600] tw-text-[#48f]'></i>
                    </div>
                    <span className='tw-text-[20px] tw-font-semibold'>General</span>
                </div>

            </div>
<div className='tw-flex tw-flex-col tw-gap-6 tw-pl-8 tw-pr-4 tw-py-4 tw-overflow-hidden'>
                <div className=' '>

                    <div className='tw-border-b tw-flex tw-flex-col  tw-py-1 '>
                        <div className='tw-flex tw-gap-2 tw-items-center'>

                            <i className='icon-Organization tw-text-[22px] tw-text-[#48f]'></i>


                            <span className='tw-text-[18px] tw-font-semibold tw-text-[#101828]'>Organization Details</span>
                        </div>
                        <div className='tw-pl-8 tw-grid tw-grid-cols-4 tw-gap-y-4 tw-gap-x-1 tw-p-2'>
                            {orgData && ORGANIZATION_DETAIL.map((d) => <div key={d.key} className='tw-flex tw-flex-col tw-gap-1.5 tw-min-w-0'>
                                <span className='tw-text-[14px] tw-text-slate-500 tw-font-medium tw-text-[#6a7282]'>{d.label}</span>
<span className={`tw-break-all ${d.type !== 'link' ? 'tw-text-slate-800' : 'tw-text-blue-400 tw-cursor-pointer'} tw-text-[16px] tw-text-[#101828] tw-font-normal`}>
  {orgData[d.key] ? orgData[d.key] : '-'}
</span>                            </div>)}
                        </div>
                    </div>
                </div>

                <div className='tw-flex tw-flex-col tw-gap-2'>
                    <div className='tw-flex tw-gap-2 tw-items-center'>
                        <i className='icon-Info tw-text-[22px] tw-text-[#48f]'></i>
                        <span className='tw-text-[18px] tw-font-semibold tw-text-[#101828]'>Organization Contact Details</span>
                    </div>
                    <div className='tw-pl-8 tw-grid tw-grid-cols-3 tw-gap-3 tw-py-2'>
                        {/* {orgData&& ORGANIZATION_CONTACT_DETAIL.map((d)=><div key={d.key} className='tw-flex tw-flex-col tw-gap-1.5'>
                        <span className='tw-text-[14px] tw-text-slate-500 tw-font-medium tw-text-[#6a7282]'>{d.label}</span>
                        <span className={`tw-truncate ${d.type!=='link'?'tw-text-slate-800':'tw-text-blue-400 tw-cursor-pointer'}  tw-text-[16px] tw-text-[#101828] tw-font-normal`}>{orgData[d.key]?orgData[d.key]:'-'}</span>
                    </div>)} */}

                        {orgData && ORGANIZATION_CONTACT_DETAIL.map((d, index) => {
                            const value = d.render ? d.render(orgData) : orgData[d.key]

                            return (
                                <div key={d.key || index} className='tw-flex tw-flex-col tw-gap-1.5 tw-min-w-0'>
                                    <span className='tw-text-[14px] tw-text-slate-500 tw-font-medium tw-text-[#6a7282]'>
                                        {d.label}
                                    </span>
                                    <span
className={`tw-break-words tw-break-all ${d.type !== 'link' ? 'tw-text-slate-800' : 'tw-text-blue-400 tw-cursor-pointer'} tw-text-[16px] tw-text-[#101828] tw-font-normal`}
                                    >
                                        {value || '-'}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default General