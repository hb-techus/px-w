import React from 'react'
import FormInput from '../../../../genriccomponents/FormInput'
import CustomSelect from '../../../../genriccomponents/FormDropDown'
import { capitalizeFirstLetter } from '../../../../utils/commonUtils';

// ── Helper: "door_window" → "Door Window" ──
const cleanLabel = (str) => {
  if (typeof str !== "string") return str;
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const BidForm = ({ data, handleInputChange, formData, formErrors, bidNameInputRef }) => {
  console.log(formData);

  return (
    <div className='tw-rounded-[10px] tw-flex tw-flex-col tw-gap-3 tw-border tw-border-[#dcdbdb] tw-bg-[#fff] tw-p-4 tw-px-[20px]'>
      <div className='heading tw-flex tw-gap-3 tw-items-center'>
        <div className='tw-rounded-[6px] tw-bg-[#dee9ff] tw-text-[#dee9ff] tw-py-2 tw-px-2 tw-flex tw-items-center'>
          <i className={`tw-font-[500] ${data?.icon} tw-text-[#0140c1] tw-text-[24px]`}></i>
        </div>
        <p className='tw-text-[1rem] tw-font-[600]'>{data?.title || ''}</p>
      </div>

      <div className='form-section tw-flex tw-flex-col tw-gap-1 tw-mt-2'>
        {data?.forms.map((d) =>
          d.type === 'text' ? (
            <FormInput
              key={d.name}
              required={d?.required}
              label={d?.label}
              placeholder={d?.placeholder}
              value={d.name === "contactEmail" ? (formData[d.name] || "") : capitalizeFirstLetter(formData[d.name] || "")}
              description={d?.description}
              name={d.name}
              onChange={(name, value) => handleInputChange(name, value, d.type)}
              style={d?.style}
              error={formErrors[d.name]}
              inputRef={d.name === "bidName" ? bidNameInputRef : undefined}
            />
          ) : (
            <CustomSelect
              key={d.name}
              placeholder={d.placeholder}
              options={
                Array.isArray(d.options)
                  ? d.options.map((opt) =>
                      typeof opt === "object"
                        ? { label: cleanLabel(opt.label), value: opt.value }
                        : { label: cleanLabel(opt), value: opt }  
                    )
                  : []
              }
              description={d?.description}
              value={formData[d.name]}
              error={formErrors[d.name]}
              name={d.name}
              onChange={(value) => handleInputChange(d.name, value, d.type)}
              label={d.label}
              style={d.style}
            />
          )
        )}
      </div>
    </div>
  );
};

export default BidForm;
