import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
 
const FormDatePicker = ({
  label,
  required = true,
  placeholder = "",
  style = "bidForm",
  error = "",
  name,
  value,
  disabled=false,
  onChange,
 
  description = "",
  dateFormat = "dd/MM/yyyy"
}) => {
 
const styles = {
  bidForm:{
    label:`tw-text-[15px] tw-font-[500] ${error?'tw-text-red-600':''}`,
    description:'tw-text-[12px] tw-text-[#6e7178]',
    input:`
      tw-border tw-rounded-[10px] tw-py-3 tw-px-3 tw-w-full
      ${error
        ? 'tw-border-red-600 focus:tw-border-red-600 focus:tw-ring-1 focus:tw-ring-red-600'
        : 'tw-border-[#dcdbdb] focus:tw-border-[#0140c1] focus:tw-ring-1 tw-ring-[#0140c1]'
      }
    `,
    container:'tw-flex tw-flex-col tw-gap-2'
  },
 
  org:{
    label:`tw-text-[14px] ${error?'tw-text-red-600':'tw-text-[#3b3b3b]'}`,
    description:'tw-text-[12px] tw-text-[#6e7178]',
    input:`
      tw-border tw-rounded-[8px] tw-text-[15px] tw-py-[6px] tw-px-3 tw-w-full
   
    `,
    container:'tw-flex tw-flex-col tw-gap-[6px]'
  }
}
 
return (
<div className="">
 
<div className={styles[style].container}>
<label className={styles[style].label}>
{label}
<span>{required ? " *" : ""}</span>
</label>
 
<DatePicker
  selected={value}
  disabled={disabled}
  onChange={(date) => onChange(name, date)}
  placeholderText={placeholder}
  dateFormat={dateFormat}
    wrapperClassName="tw-w-full"
   className={`${styles[style].input} focus:tw-outline-none tw-w-full ${error? '!tw-border-red-600 focus:tw-border-red-600 focus:tw-ring-1 focus:tw-ring-red-600' : ''}`}
/>
 
 
</div>
 
 
 
{description && (
<span className={styles[style].description}>{description}</span>
)}
 
<div className="tw-text-[11px] tw-h-[16px] tw-mt-[2px]">
<span className="tw-font-[600] tw-text-red-500">{error}</span>
</div>
 
 
</div>
);
};
 
export default FormDatePicker;