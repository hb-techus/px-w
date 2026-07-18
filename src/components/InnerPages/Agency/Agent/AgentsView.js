import React, {  useState ,useEffect } from "react";
import { Users,Pencil } from "lucide-react";
// import { FileText, Shield } from "lucide-react";
import { MoveRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
// import { ConfigurationSetAlreadyExistsException } from "@aws-sdk/client-ses";

const AgenciesView = ({
    isViewMode,
    viewUserData,
    // onCloseDrawer,
}) => {

 const [agent, setAgent] = useState({
  agentCode: "",
  agencyName: "",
  phonenumber: "",
  email: "",
  fax: "",
  address: "",
  city: "",
  state: "",
  licensenumber: "",
  licenseExp: "",
  firstName: "",
  lastName: "",
  role: "",
  note: "",
  status: "",
  quotes: "",
  policies: "",
  agents:""
});
 
  useEffect(() => {
  if (isViewMode && viewUserData) {
    setAgent({
      agentCode: viewUserData.agency_code || "hoijl",
      agencyName: viewUserData.agency_name || "hjn",
      phonenumber: viewUserData.mobile_number || "nkljp",
      email: viewUserData.email_id || "hoijop",
      fax: viewUserData.fax || "1234",
      address: viewUserData.address || "",
      city: viewUserData.city || "",
      state: viewUserData.state || "",
      licensenumber: viewUserData.license_number || "9854",
      licenseExp: viewUserData.license_exp || "giuiu",
      firstName: viewUserData.first_name || "",
      lastName: viewUserData.last_name || "",
      role: viewUserData.role || "",
      note: viewUserData.notes || "APEX Insurance Agency is a licensed insurance provider known for offering a range of insurance products including personal, commercial, and policy management services. The agency operates with valid registration and license details,",
      status: viewUserData.status === 1 ? "active" : "inactive",
      quotes: viewUserData.quotes || "",
      policies: viewUserData.policies || "",
      agents: viewUserData.agents || ""
    });
  }
}, [isViewMode, viewUserData]);

 const navigate = useNavigate();


 
  return (
    <>
   
   <div className="tw-flex tw-flex-col tw-gap-4 tw-ps-[30px] tw-pe-[64px] tw-pt-[30px] tw-pb-[30px]">

<div className="tw-flex tw-items-center tw-justify-between tw-pb-3">
  <div className="tw-flex tw-items-center tw-gap-4">
    <img
      src="/path/to/apex-logo.png"
      alt="APEX"
      className="tw-h-16 tw-w-16 tw-object-contain tw-rounded-full tw-border"
    />

    <div>
      <h2 className="tw-text-xl tw-font-semibold">{agent.agencyName}</h2>

      <div className="tw-flex tw-items-center tw-gap-[30px] tw-mt-1">
        <p className="tw-text-sm tw-text-gray-500">{agent.agentCode}</p>

        <span
          className={`tw-px-[14px] tw-py-[1px] tw-rounded-full tw-text-[14px] tw-font-normal tw-w-[100px] tw-text-center ${
            agent.status === "active"
              ? "tw-bg-[#e9ffee] tw-text-[#20bc47] tw-border tw-border-[#20bc47]"
              : "tw-bg-[#f0f0f0] tw-text-[#a5a5a5] tw-border tw-border-[#a5a5a5]"
          }`}
        >
          {agent.status}
        </span>
      </div>
    </div>
  </div>
</div>

{/* Info List */}
<div className="tw-mt-6 tw-text-sm tw-text-gray-700 tw-space-y-2">
  {[
    ["Phone Number", agent.phonenumber],
    ["Fax", agent.fax],
    ["Email", agent.email],
    ["Address", agent.address],
    ["License No", agent.licensenumber],
    ["License Exp", agent.licenseExp],
  ].map(([label, value], index) => (
    <div key={index} className="tw-flex tw-items-center">
      <p className="tw-w-36 tw-text-gray-800">{label}</p>
      <span className="tw-w-4 tw-text-center">:</span>
      <p className="tw-flex-1 tw-pl-1 tw-font-medium">{value}</p>
    </div>
  ))}
</div>

{/* Primary Contact */}
<div className="tw-mt-5 tw-p-3 tw-bg-gray-100 tw-rounded-md  tw-w-[456px]">
  <p className="tw-font-medium tw-text-blue-700 tw-mb-1">Primary Contact Information</p>
  <p className="tw-text-sm">{agent.firstName} {agent.lastName}</p>
  <p className="tw-text-xs tw-text-gray-500">{agent.role}</p>
  <p className="tw-text-xs tw-text-gray-500">{agent.email}</p>
</div>

{/* Stats Cards */}
<div className="tw-flex tw-gap-4 tw-mt-6">
  <div className="tw-relative tw-border tw-border-gray-300 tw-rounded-md tw-w-[120px] tw-h-[60px] tw-shadow-sm tw-px-1 tw-py-2 tw-bg-white">
  <div className="tw-absolute tw-left-0 tw-top-0 tw-w-1 tw-h-full tw-bg-[#156082]"></div>
  <MoveRight
    size={16}
    className="tw-absolute tw-top-2 tw-right-2 tw-text-[#939393]"
  />

  <div className="tw-flex tw-flex-col tw-pl-2 tw-pt-1">
    <p className="tw-text-[15px] tw-font-bold tw-text-[#25333e] ">
      {agent.agents}
    </p>
    <p className="tw-text-[13px] tw-text-[#25333e] tw-font-normal">Agents</p>
  </div>

</div>


   <div className="tw-relative tw-border tw-border-gray-300 tw-rounded-md tw-w-[120px] tw-h-[60px]  tw-shadow-sm tw-px-1 tw-py-2 tw-bg-white">
  <div className="tw-absolute tw-left-0 tw-top-0 tw-w-1 tw-h-full tw-bg-[#156082]"></div>
  <MoveRight
    size={16}
    className="tw-absolute tw-top-2 tw-right-2 tw-text-[#939393]"
  />

  <div className="tw-flex tw-flex-col tw-pl-2 tw-pt-1">
    <p className="tw-text-[15px] tw-font-bold tw-text-[#25333e] ">
      {agent.quotes}
    </p>
    <p className="tw-text-[13px] tw-text-[#25333e] tw-font-normal">Quotes</p>
  </div>

</div>

  <div className="tw-relative tw-border tw-border-gray-300 tw-rounded-md tw-w-[120px] tw-h-[60px] tw-shadow-sm tw-px-1 tw-py-2 tw-bg-white">
  <div className="tw-absolute tw-left-0 tw-top-0 tw-w-1 tw-h-full tw-bg-[#156082]"></div>
  <MoveRight
    size={16}
    className="tw-absolute tw-top-2 tw-right-2 tw-text-[#939393]"
  />

  <div className="tw-flex tw-flex-col tw-pl-2 tw-pt-1">
    <p className="tw-text-[15px] tw-font-bold tw-text-[#25333e] ">
      {agent.policies}
    </p>
    <p className="tw-text-[13px] tw-text-[#25333e] tw-font-normal">Policies</p>
  </div>

</div>
</div>

{/* Notes */}
<div className="tw-mt-4">
  <p className="tw-text-sm tw-text-gray-600 tw-leading-relaxed">{agent.note}</p>
</div>


{/* Edit Button */}
<div className="tw-flex tw-justify-end tw-mb-3 tw-mt-[90px] tw-gap-3">
  <button
  className="tw-flex tw-items-center tw-gap-1 tw-border tw-px-3 tw-py-1 tw-rounded tw-text-sm tw-text-blue-600 hover:tw-bg-blue-100"
 onClick={() =>
    navigate("/agencies/agents", {
      state: { agency: agent } 
    })
  }
>
  <Users size={16} />
  Agents
</button>
<button
  className="tw-flex tw-items-center tw-gap-1 tw-border tw-px-3 tw-py-1 tw-rounded tw-text-sm tw-text-gray-600 hover:tw-bg-gray-100"
>
  <Pencil size={16} />
  Edit
</button>
</div>

</div>


</>
  );};
  
export default AgenciesView