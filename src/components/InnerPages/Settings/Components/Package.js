import React, { useContext ,useState} from "react";
import { SettingsContext } from "../Context/SettingsContext";
import { formatDollarCompact } from "../../../../utils/commonUtils";
import PackageDetailsModal from "../../Packages/PackageDetailsModal";
import { GetOnePackage } from "../../../../services/techus-services";

const Package = () => {
  const { orgData } = useContext(SettingsContext);
  const [open, setOpen] = useState(false);
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const handleViewPackage = async () => {
  try {
    setOpen(true);
    setLoading(true);

    const res = await GetOnePackage ({
      package_uuid: orgData?.package_uuid, 
    });

    const parsed =
      typeof res === "string" ? JSON.parse(res) : res;

    if (parsed?.valid) {
      setPackageData(parsed.data);
    }
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="tw-bg-[#fff] tw-rounded-[8px] tw-shadow-sm tw-pb-4">
      <div className="tw-flex tw-flex-col tw-gap-3">
        <div className="tw-border-b tw-py-3 tw-px-4">
          <div className="tw-flex tw-items-center tw-gap-3 ">
            <div className="tw-bg-blue-100  tw-flex tw-items-center tw-p-1.5 tw-rounded-[8px]">
              <i className="icon-Packages tw-text-[26px] tw-font-[600] tw-text-[#48f]"></i>
            </div>
            <span className="tw-text-[20px] tw-font-semibold">Package</span>
          </div>
        </div>
        <div className="tw-pl-8 tw-pr-4  ">
          <div className="tw-flex tw-justify-between">
            <div className="tw-flex tw-gap-2 tw-items-center">
              <i className="icon-Fee tw-text-[22px] tw-text-[#48f] tw-font-[600]"></i>
              <span className="tw-text-[18px] tw-font-semibold tw-text-[#101828]">Current Package</span>
            </div>
            <button  onClick={handleViewPackage} className="tw-bg-[#0140c1] tw-w-[200px] tw-text-[14px] tw-w-[180px] tw-h-[30px] tw-rounded-[6px] tw-text-center tw-text-white">
              View Package Details
            </button>
          </div>
        </div>
        <div className="tw-pl-16 tw-grid tw-grid-cols-3 ">
          <div className="tw-flex tw-flex-col tw-gap-1.5">
            <span className="tw-text-[14px] tw-text-slate-500 tw-font-medium tw-text-[#6a7282]">
              Package Name
            </span>
            <span className={`${"tw-text-slate-800"}   tw-text-[16px] tw-text-[#101828] tw-font-normal`}>
              {orgData?.package_name ? orgData?.package_name : "-"}
            </span>
          </div>
          <div className="tw-flex tw-flex-col tw-gap-1.5">
            <span className="tw-text-[14px] tw-text-slate-500 tw-font-medium tw-text-[#6a7282]">
             Plan Type
            </span>
            <div className="tw-flex tw-gap-2">
              {["Monthly", "Annually"].map((d) => (
                <span
                  className={`tw-flex tw-gap-2 tw-px-2 tw-rounded-[6px]  tw-text-[12px] tw-text-[#101828] tw-font-normal ${d?.toLowerCase() === orgData?.subscription_applies_to?.toLowerCase() ? "tw-bg-[#d9e7ff] tw-text-[#4488ff]" : "tw-bg-[#dfdfdf] tw-text-[#797979]"} `}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          <div className="tw-flex tw-flex-col tw-gap-1.5">
            <span className="tw-text-[14px] tw-text-slate-500 tw-font-medium tw-text-[#6a7282]">Price</span>
            <p
              className={`${"tw-text-slate-800"} tw-font-bold tw-text-[14px] tw-flex tw-items-center tw-gap-1`}
            >
              {formatDollarCompact(
                orgData?.discounted_amount
                  ? orgData?.discounted_amount
                  : orgData?.subscription_actual_amount,
              )}{" "}
              <span className=" tw-text-[16px] tw-text-[#101828] tw-font-normal">
                /
                {orgData?.subscription_applies_to === "MONTHLY"
                  ? "Month"
                  : "Annually"}
              </span>
            </p>
          </div>
        </div>
      </div>
      {open && (
  <PackageDetailsModal
    packageData={packageData}
    isLoading={loading}
    onClose={() => setOpen(false)}
  />
)}
</div>
 );
};

export default Package;
