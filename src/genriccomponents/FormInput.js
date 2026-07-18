import React from 'react'

const FormInput = ({
    label,
    required=true,
    placeholder='',
    style='bidForm',
    error='',
    name,
    value='',
    onChange,
    disabled=false,
    description='',
    inputRef
}) => {

    const styles = {
  bidForm:{
    label:`tw-text-[13px] tw-font-[500] `,
    description:'tw-text-[12px] tw-text-[#6e7178]',
    input:`
      tw-border placeholder:tw-text-[15px] tw-rounded-[10px] tw-py-3 tw-px-3
      ${error
        ? 'tw-border-red-600 focus:tw-border-red-600 focus:tw-ring-1 focus:tw-ring-red-600 focus:tw-outline-none'
        : 'tw-border-[#dcdbdb] focus:tw-border-[#0140c1] focus:tw-ring-1 tw-ring-[#0140c1] focus:tw-outline-none'
      }
    `,
    error:'tw-font-[600] tw-text-red-500',
    container:'tw-flex tw-flex-col tw-gap-2'
  },
  org:{
        label:`tw-text-[14px] tw-text-[#3b3b3b]'`,
    description:'tw-text-[12px] tw-text-[#6e7178]',
    input:`${disabled?'tw-bg-[#f0f0f0] tw-text-[#a0a0a0] tw-cursor-not-allowed':''}
      tw-border placeholder:tw-text-[15px] tw-rounded-[8px] tw-text-[15px] tw-py-[6px] tw-px-3
      ${error
        ? 'tw-border-red-600 focus:tw-border-red-600 focus:tw-ring-1 focus:tw-ring-red-600 focus:tw-outline-none'
        : 'tw-border-[#dcdbdb] focus:tw-border-[#0140c1] focus:tw-ring-1 tw-ring-[#0140c1] focus:tw-outline-none'
      }
    `,
    error:'tw-font-[600] tw-text-red-500',
     container:'tw-flex tw-flex-col tw-gap-[6px]'

  }
}
  return (
        <div>
            <div className={styles[style].container||''}>
                <label className={styles[style].label||''}>
                    {label}
                    {required && <span className={style === 'org' ? 'tw-text-red-500' : ''}>&nbsp;*</span>}
                </label>
                <input ref={inputRef} disabled={disabled} type='text' placeholder={placeholder||''} value={value} className={`${styles[style]?.input}`} onChange={(e)=>onChange(name,e.target.value)}/>
            </div>
            {description&&<span className={`${styles[style].description}`}>{description}</span>}
            <div className=' tw-text-[12px] tw-h-[16px] tw-mt-[4px]'>
                <span className='tw-font-[600] tw-text-red-500'>{error}</span>
            </div>
            </div>
  )
}

export default FormInput
