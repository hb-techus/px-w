
import CustomSelect from "../../../../genriccomponents/FormDropDown";
import FormInput from "../../../../genriccomponents/FormInput";
import React from "react";
import { capitalizeFirstLetter } from "../../../../utils/commonUtils";

const FormLayout = ({
  fieldDatas,
  packageOptions,
  industryOptions,
  companySizeOptions,
  formData,
  onChange,
  setPackageModal,
  onViewPackage,
  isEdit,
  errors,
}) => {
  const {
    basicInformation,
    contactInformation,
    packageInformation,
  } = fieldDatas;

  return (
    <div className="tw-bg-[#fff] tw-rounded-[15px] tw-border tw-border-[#e0e0e0] tw-py-6 tw-px-5 tw-flex tw-flex-col tw-gap-[30.5px]">
      <div className="tw-max-w-[73%] tw-flex tw-flex-col tw-gap-2">
        <p className="tw-text-[16px] tw-font-[600]">Basic Information</p>
        <div className="tw-grid tw-grid-cols-[325px_325px_325px] tw-gap-x-[45px] tw-gap-y-1">
          {(basicInformation || []).map((d, i) =>
            d.type === "text" ? (
              <FormInput
                key={i}
                label={d.label}
                name={d.name}
                value={d.capitalize?capitalizeFirstLetter(formData[d.name]):formData[d.name]}
                required={d.required}
                placeholder={d?.placeholder}
                style={d.style}
                onChange={onChange}
                error={errors[d.name]}
              />
            ) : (
              <CustomSelect
                key={i}
                label={d.label}
                required={d.required}
                style={d.style}
                options={
                  d.name === "industry_id"
                    ? industryOptions.map((o) => o.label)
                    : companySizeOptions.map((o) => o.label)
                }
                value={
                  d.name === "industry_id"
                    ? industryOptions.find(
                        (o) => o.value === formData.industry_id,
                      )?.label || ""
                    : companySizeOptions.find(
                        (o) => o.value === formData.company_size_id,
                      )?.label || ""
                }
                placeholder={d.placeholder}
                error={errors[d.name]}
                onChange={(label) => {
                  if (d.name === "industry_id") {
                    const selected = industryOptions.find(
                      (o) => o.label === label,
                    );
                    if (selected) onChange("industry_id", selected.value);
                  }

                  if (d.name === "company_size_id") {
                    const selected = companySizeOptions.find(
                      (o) => o.label === label,
                    );
                    if (selected) onChange("company_size_id", selected.value);
                  }
                }}
              />
            ),
          )}
          <div className="tw-col-span-2">
            <div className="tw-flex tw-flex-col tw-gap-[9px]">
              <label
                className={`${"tw-text-[#3b3b3b]"} tw-text-[14px]`}
              >
                Description
              </label>
              <textarea
                placeholder="Brief description of the organization"
                name="description"
                value={capitalizeFirstLetter(formData.description)}
                onChange={(e) => onChange("description", e.target.value)}
                className={`tw-px-3  tw-text-[15px] placeholder:tw-text-[14px] placeholder:tw-text-[#717182]
tw-py-2 tw-border tw-w-full tw-resize-none tw-rounded-[8px] focus:tw-outline-none
${
  errors.description
    ? "tw-border-red-600 focus:tw-border-red-600 focus:tw-ring-1 focus:tw-ring-red-600"
    : "tw-border-[#6984b3] focus:tw-border-[#0140c1] focus:tw-ring-1 tw-ring-[#0140c1]"
}`}
                row={12}
              />
            </div>
            <div className="tw-text-[11px] tw-mt-1 tw-h-[16px]">
              <span className="tw-font-[600] tw-text-red-500">
                {errors.description}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-2">
        <p className="tw-text-[16px] tw-font-[600]">Admin Information</p>
        <div className="tw-grid tw-grid-cols-[325px_325px_325px] tw-gap-x-[45px] tw-gap-y-2">
          {(contactInformation || []).map((d, i) => (
            <FormInput
              key={i}
              label={d.label}
              name={d.name}
              value={d.capitalize?capitalizeFirstLetter(formData[d.name]):formData[d.name]}
              required={d.required}
              placeholder={d?.placeholder}
              style={d.style}
              onChange={onChange}
              error={errors[d.name]}
              disabled={isEdit && d.name === "email_id"}
            />
          ))}
        </div>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-2">
        <p className="tw-text-[16px] tw-font-[600]">Package Details</p>
        <div className="tw-grid tw-grid-cols-[350px_180px_325px] tw-gap-x-[20px] tw-items-center  tw-overflow-visible ">
    
          {(packageInformation || []).map((d, i) => (
            <CustomSelect
              key={i}
              label={d.label}
              style={d.style}
              //  disabled={isEdit}
              options={packageOptions.map((p) => p.label)}
              required={d.required}
              placeholder={d?.placeholder}
              error={errors[d.name]}
              value={
                packageOptions.find(
                  (p) => String(p.value) === String(formData.package_id),
                )?.label || ""
              }
              onChange={(label) => {
                const selected = packageOptions.find((p) => p.label === label);
                if (selected) {
                  onChange("package_id", String(selected.value));
                }
              }}
            />
          ))}

         
            { (
              <button
                onClick={() => {
                   setPackageModal(true)
                  onViewPackage();
                }}
                disabled={!formData.package_id}
                //  disabled={isEdit}
                className={`tw-border  tw-border-[#d1d5dc] tw-font-[500] tw-rounded-[8px] tw-py-[8px] tw-px-1 tw-text-[14px] tw-mt-2 tw-rounded-[8px]${
                  !formData.package_id
                    ? "tw-bg-[#f0f0f0] tw-text-[#a0a0a0]  tw-cursor-not-allowed"
                    : " hover:tw-opacity-90 tw-text-[#fff] tw-bg-[#0140c1]"
                }`}
              >
                View Package Details
              </button>
            )}
            <CustomSelect
              label="Applies To"
              options={["Monthly", "Annually"]}
              //  disabled={isEdit}
              value={formData.applies_to === "MONTHLY" ? "Monthly" : "Annually"}
              onChange={(label) => {
                const value = label === "Monthly" ? "MONTHLY" : "ANNUALLY";
                onChange("applies_to", value);
              }}
            />
        </div>
      </div>
      {/* <div className="tw-flex tw-flex-col tw-gap-2">
        <p className="tw-text-[16px] tw-font-[600]">
          Pricing & Discount (Optional)
        </p>
        <div className="tw-grid tw-grid-cols-[325px_325px_325px] tw-gap-x-[45px] tw-gap-y-1 tw-items-center ">
          {(pricingInformation || []).map((d, i) => {
            if (d.type === "select") {
              let options = [];
              let selectedLabel = "";

              if (d.name === "discount_type") {
                options = [
                  { label: "Percentage (%)", value: "PERCENT" },
                  { label: "Fixed ($)", value: "FIXED" },
                ];
              } else if (d.name === "applies_to") {
                options = [
                  { label: "Monthly", value: "MONTHLY" },
                  { label: "Annual", value: "ANNUAL" },
                ];
              }

              selectedLabel =
                options.find((o) => o.value === formData[d.name])?.label || "";

              return (
                <CustomSelect
                  key={i}
                  label={d.label}
                  options={options.map((o) => o.label)}
                  value={selectedLabel}
                  required={d.required}
                  error={errors[d.name]}
                  placeholder={d.placeholder}
                  onChange={(label) => {
                    const selected = options.find((o) => o.label === label);
                    if (selected) {
                      onChange(d.name, selected.value);
                    }
                  }}
                />
              );
            }

            if (d.type === "text") {
              return (
                <FormInput
                  key={i}
                  label={d.label}
                  name={d.name}
                  error={errors[d.name]}
                  value={formData[d.name]}
                  required={d.required}
                  style={d.style}
                  placeholder={
                    d.name === "discount_value"
                      ? discountPlaceholder
                      : d.placeholder
                  }
                  onChange={onChange}
                />
              );
            }

            return (
              <div className={`${d.description ? "tw-mt-6" : ""}`}>
                <FormDatePicker
                  key={i}
                  label={d.label}
                  name={d.name}
                  error={errors[d.name]}
                  value={formData[d.name] ? new Date(formData[d.name]) : null}
                  style={d.style}
                  required={d.required}
                  disabled={true}
                  placeholder={d.placeholder}
                  onChange={onChange}
                  description={d.description}
                />
              </div>
            );
            //
            //
          })}
        </div>
        <div className="tw-flex tw-flex-col tw-gap-[4px] tw-max-w-[697px]">
          <label
            className={` tw-text-[14px] ${errors.discount_notes ? "tw-text-red-600" : "tw-text-[#3b3b3b]"}`}
          >
            Discount Notes
          </label>
          <textarea
            placeholder="Optional notes about this discount"
            name="discount_notes"
            value={formData.discount_notes}
            onChange={(e) => onChange("discount_notes", e.target.value)}
            className={`tw-px-3 placeholder:tw-text-[14px] placeholder:tw-text-[#717182]
tw-py-2 tw-border tw-w-full tw-resize-none tw-rounded-[8px] focus:tw-outline-none
${
  errors.discount_notes
    ? "tw-border-red-600 focus:tw-border-red-600 focus:tw-ring-1 focus:tw-ring-red-600"
    : "tw-border-[#d1d5dc] focus:tw-border-[#0140c1] focus:tw-ring-1 tw-ring-[#0140c1]"
}`}
            row={12}
          />
        </div>
        <div className="tw-text-[11px] tw-h-[16px]">
          <span className="tw-font-[600] tw-text-red-500">
            {errors.discount_notes}
          </span>
        </div>
      </div> */}
    </div>
  );
};

export default FormLayout;
