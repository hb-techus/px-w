import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import SelectRFP from "./SelectRfp";
import CompanyKnowledge from "./CompanyKnowledge";
import SelectTemplates from "./SelectTemplate";
import RFPAnalysisUI from "./AnalyzingPdf";
import AnalysisComplete from "./AnalyzeComplete";
import { useSelector } from "react-redux";
import {
  AddProposalDrafter,
  UpdateProposalDrafter,
  GetProposalDrafterDetail,
  get_trade_data,  
  ProposalDrafterView,                   
} from "../../../../services/techus-services";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";

const STEPS = [
  { id: 1, label: "Select RFP" },
  { id: 2, label: "Company Knowledge" },
  { id: 3, label: "Select Templates" },
  { id: 4, label: "Analyzing Your RFP" },
  { id: 5, label: "Analysis Complete" },
];

const DRAFT_MESSAGES = {
  2: "Company Knowledge saved as draft.",
  3: "Template selection saved as draft.",
  4: "RFP analysis saved as draft.",
};

const getCompletionSuccessMessage = () =>
  "Proposal drafter completed successfully.";

export default function ProposalDrafter() {
  const [currentStep, setCurrentStep] = useState(1);

  const { drafter_uuid: routeUuid } = useParams();
  const isEdit = Boolean(routeUuid);

  const location    = useLocation();
  const drafterData = location.state?.drafterData || {};

  const analysisIdRef = useRef(drafterData?.drafter_uuid || null);

  const [,                 setAnalysisId]       = useState(drafterData?.drafter_uuid || null);
  const [,                 setDrafterUuid]      = useState(drafterData?.drafter_uuid || null);
  const [rfpFormData,      setRfpFormData]       = useState({});
  const [analysisSections, setAnalysisSections]  = useState([]);
  const [analysisNPages,   setAnalysisNPages]    = useState(0);
  const [selectedTemplate, setSelectedTemplate]  = useState("modern_blue");
  const [loading,          setLoading]           = useState(false);
  const [isFormValid,      setIsFormValid]       = useState(isEdit);

  const [savedDrafterId,   setSavedDrafterId]   = useState(drafterData?.drafter_id   || null);
  const [savedDrafterUuid, setSavedDrafterUuid] = useState(drafterData?.drafter_uuid || null);
const [selectedCompanyDocs, setSelectedCompanyDocs] = useState([]);
  // ── Trade categories from get_trade_data ──────────────────────────────────
  const [tradeCategories, setTradeCategories] = useState([]);
const [analysisCompleted, setAnalysisCompleted] = useState(false);
const [companyDocsError, setCompanyDocsError] = useState("");
  const isCreatedRef = useRef(isEdit);

  const navigate             = useNavigate();
  const projectUuidFromRedux = useSelector((s) => s.project.project_uuid);
  const projectIdFromRedux   = useSelector((s) => s.project.project_id);
  const projectUuid = projectUuidFromRedux || localStorage.getItem("project_uuid");
  const projectId   = projectIdFromRedux   || localStorage.getItem("project_id");
   
const [companyHasDocs, setCompanyHasDocs] = useState(true);
useEffect(() => {
  if (isEdit && drafterData?.company_doc_ids) {
    console.log("Prefill company docs →", drafterData.company_doc_ids);
    setSelectedCompanyDocs(drafterData.company_doc_ids);
  }
}, [isEdit, drafterData]);
  // ── Fetch trade categories on mount ───────────────────────────────────────
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await get_trade_data();
        console.log("get_trade_data response:", res);
        if (res?.valid) {
          const data = Array.isArray(res.data) ? res.data : [];
          // Pass full objects so SelectRFP can use both id and display_name
          setTradeCategories(data);
        }
      } catch (err) {
        console.error("get_trade_data error:", err);
      }
    };
    fetchCategories();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getCurrentUuid = () =>
    analysisIdRef.current || savedDrafterUuid || drafterData?.drafter_uuid || null;

  const getCurrentId = () =>
    savedDrafterId || drafterData?.drafter_id || null;

  // ── Save as Draft ─────────────────────────────────────────────────────────
  const handleSaveAsDraft = () => {
    const msg = DRAFT_MESSAGES[currentStep];
    if (msg) {
      showToast("success", msg);
    }
    navigate(`/project/view/${projectUuid}/contract-command/proposal-drafter`);
  };

  // ── Next ──────────────────────────────────────────────────────────────────
  const handleNext = async () => {

    // ── STEP 1 ──────────────────────────────────────────────────────────────
    if (currentStep === 1) {
      if (rfpFormData.validate && !rfpFormData.validate()) return;
      setLoading(true);

      try {
        let response;
        const shouldUpdate = isEdit || !!savedDrafterUuid;

        if (shouldUpdate) {
          const uuidToUse = getCurrentUuid();
          const idToUse   = getCurrentId();

          if (!uuidToUse) {
            showToast("error", "Drafter UUID is missing. Please refresh and try again.");
            setLoading(false);
            return;
          }

          const payload = {
            drafter_id:        idToUse   || undefined,
            drafter_uuid:      uuidToUse,
            proposal_name:     rfpFormData.proposalName,
            // trade_category_id: rfpFormData.tradeCategoryId,
            project_id:        projectId,
            organization_id:   localStorage.getItem("organization_id"),
            template_name:     drafterData.template_name || null,
            start_date:        rfpFormData.startDate    || null,
            end_date:          rfpFormData.endDate      || null,
            response_text:     drafterData.response_text || null,
            rfp_ids:           rfpFormData.selectedRfp,
            company_doc_ids: selectedCompanyDocs,
            progress:          Math.max(drafterData.progress ?? 0, 25),
          };
          const raw = await UpdateProposalDrafter(payload);
          response  = typeof raw === "string" ? JSON.parse(raw) : raw;
          console.log("UPDATE Proposal payload with company_doc_ids →", JSON.stringify(payload, null, 2));

        } else {
          const payload = {
            proposal_name:     rfpFormData.proposalName,
            // trade_category_id: rfpFormData.tradeCategoryId,
            project_id:        projectId,
            organization_id:   localStorage.getItem("organization_id"),
            template_name:     null,
            start_date:        rfpFormData.startDate || null,
            end_date:          rfpFormData.endDate   || null,
            response_text:     null,
            rfp_ids:           rfpFormData.selectedRfp,
             company_doc_ids: selectedCompanyDocs,
            progress:          25,
          };
          const raw = await AddProposalDrafter(payload);
          response  = typeof raw === "string" ? JSON.parse(raw) : raw;
          console.log("ADD RESPONSE →", JSON.stringify(response, null, 2));
        }

        if (response?.valid) {
          const newUuid = response?.drafter_uuid || getCurrentUuid();
          if (!newUuid) {
            showToast("error", "Failed to get drafter UUID from response.");
            setLoading(false);
            return;
          }

          let newId = response?.drafter_id || getCurrentId();
          if (!newId && !isCreatedRef.current) {
            try {
              const detailRaw = await GetProposalDrafterDetail({ drafter_uuid: newUuid });
              const detail    = typeof detailRaw === "string" ? JSON.parse(detailRaw) : detailRaw;
              if (detail?.valid) newId = detail.data?.drafter_id || null;
            } catch (e) {
              console.error("Failed to fetch drafter_id:", e);
            }
          }

          analysisIdRef.current = newUuid;
          isCreatedRef.current  = true;

          setSavedDrafterUuid(newUuid);
          if (newId) setSavedDrafterId(newId);
          setDrafterUuid(newUuid);
          setAnalysisId(newUuid);
          setLoading(false);
          setCurrentStep((p) => p + 1);

        } else {
          showToast("error", response?.message || "Failed to save proposal.");
          setLoading(false);
        }

      } catch (err) {
        console.error("Error saving proposal:", err);
        showToast("error", "Something went wrong. Please try again.");
        setLoading(false);
      }

    // ── STEP 3 ──────────────────────────────────────────────────────────────
    } else if (currentStep === 3) {
      const idToUse = getCurrentUuid();
      if (!idToUse) {
        showToast("error", "Drafter UUID is missing. Please go back to Step 1.");
        return;
      }
      setLoading(true);
      try {
        const raw = await UpdateProposalDrafter({
          
          drafter_uuid:      idToUse,
          drafter_id:        getCurrentId(),
          proposal_name:     rfpFormData.proposalName,
          // trade_category_id: rfpFormData.tradeCategoryId,
          project_id:        projectId,
          organization_id:   localStorage.getItem("organization_id"),
          rfp_ids:           rfpFormData.selectedRfp,
          template_name:     selectedTemplate,
          progress:          50,
        });
        const response = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (response?.valid) {
          if (response?.drafter_id) setSavedDrafterId(response.drafter_id);
        } else {
          showToast("error", response?.message || "Failed to save template.");
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Failed to save progress=50", e);
      }
      setLoading(false);
      setAnalysisId(idToUse);
      setCurrentStep((p) => p + 1);

    // ── STEP 5 ──────────────────────────────────────────────────────────────
    } else if (currentStep === 5) {
      navigate(`/project/view/${projectUuid}/contract-command/proposal-drafter`);

} else if (currentStep === 2) {
   if (selectedCompanyDocs.length === 0) {
    setCompanyDocsError("Please select at least one company document.");
    return;
  }
  setCompanyDocsError("");
  const idToUse = getCurrentUuid();
  if (!idToUse) { setCurrentStep((p) => p + 1); return; }
  setLoading(true);
  try {
    await UpdateProposalDrafter({
      drafter_uuid:      idToUse,
      drafter_id:        getCurrentId(),
      proposal_name:     rfpFormData.proposalName,
      // trade_category_id: rfpFormData.tradeCategoryId,
      project_id:        projectId,
      organization_id:   localStorage.getItem("organization_id"),
      rfp_ids:           rfpFormData.selectedRfp,
      company_doc_ids:   selectedCompanyDocs,
      progress:          Math.max(drafterData.progress ?? 0, 35),
    });
    console.log("STEP 2 company_doc_ids saved →", selectedCompanyDocs);
  } catch (e) {
    console.error("Failed to save company docs:", e);
  }
  setLoading(false);
  setCurrentStep((p) => p + 1);
} 
else {
  setCurrentStep((p) => p + 1);
}
  };

  const handleBack = () => {
    if (currentStep === 1) {
      navigate(`/project/view/${projectUuid}/contract-command/proposal-drafter`);
    } else {
      setCurrentStep((p) => p - 1);
    }
  };

 const isNextDisabled =
  (currentStep === 1 && !isFormValid) ||
  (currentStep === 4 && !analysisCompleted);

  return (
    <div >
      {loading && <FullPageLoader />}

      {/* Header */}
      <div className="tw-flex tw-items-center tw-gap-4 tw-mb-6">
       <button
  onClick={() =>
    navigate(`/project/view/${projectUuid}/contract-command/proposal-drafter`)
  }
  className="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-bg-[#b3bcce] tw-rounded-lg hover:tw-bg-[#0140c1] tw-transition-colors tw-duration-200"
>
  <i className="icon-Previous tw-text-white tw-text-lg" />
</button>
        <div>
          <div className="tw-text-[#535353] tw-text-[14px]">Contract Command/</div>
          <h1 className="tw-text-[#000] tw-text-[20px] tw-font-bold">
            {isEdit ? "Edit Proposal" : "Create New Proposal"}
          </h1>
        </div>
      </div>

      {/* Step Bar */}
      <div className="tw-px-12">
        <div
          className="tw-flex tw-items-stretch tw-w-full tw-bg-white tw-border tw-border-gray-200 tw-rounded-full tw-mb-3 tw-overflow-hidden"
          style={{ height: "48px" }}
        >
          {STEPS.map((step, index) => {
            const isActive    = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div
                key={step.id}
                className={`tw-relative tw-flex tw-items-center tw-justify-center tw-gap-2 tw-flex-1 tw-min-w-0 tw-transition-all tw-px-3
                  ${isActive ? "tw-text-blue-600" : "tw-text-gray-400"}`}
              >
                <div
                  className={`tw-w-7 tw-h-7 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-font-bold tw-shrink-0 tw-text-xs
                    ${isActive    ? "tw-border-2 tw-border-blue-500 tw-text-blue-600"
                    : isCompleted ? "tw-bg-[#4466ff] tw-text-white"
                    : "tw-border tw-border-[#e6e6e6] tw-text-[#999]"}`}
                >
                  {isCompleted ? <i className="icon-Tick"/> : step.id}
                </div>
                <span className="tw-text-xs tw-font-semibold tw-whitespace-nowrap tw-overflow-hidden tw-text-ellipsis">
                  {step.label}
                </span>
                {index !== STEPS.length - 1 && (
                  <svg
                    viewBox="0 0 14 48" width="14" height="48"
                    preserveAspectRatio="none"
                    className="tw-absolute tw-right-[-7px] tw-top-0 tw-z-10 tw-pointer-events-none tw-shrink-0"
                    style={{ display: "block" }}
                  >
                    <polyline
                      points="0,0 14,24 0,48"
                      fill="none" stroke="#e5e7eb"
                      strokeWidth="1.5" strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="tw-min-h-[450px]">
        {currentStep === 1 && (
          <SelectRFP
            // ✅ pass trade categories fetched from get_trade_data
            tradeCategories={tradeCategories}
            onDataChange={(data) => {
              setRfpFormData(data);
              setIsFormValid(
                !!data.proposalName?.trim() &&
                // !!data.tradeCategoryId &&
                data.selectedRfp?.length > 0
              );
            }}
            initialData={
              isEdit
                ? drafterData
                : Object.keys(rfpFormData).length > 0
                  ? {
                      proposal_name:              rfpFormData.proposalName,
                      trade_category_name:        rfpFormData.tradeCategory,
                      // trade_category_id:          rfpFormData.tradeCategoryId,
                      start_date:                 rfpFormData.startDate,
                      end_date:                   rfpFormData.endDate,
                      selected_rfp_encrypted_ids: rfpFormData.selectedRfp,
                    }
                  : {}
            }
          />
        )}

     
{currentStep === 2 && (
  <CompanyKnowledge 
    onDocsStatus={setCompanyHasDocs}
    onSelectionChange={(ids) => {
      setSelectedCompanyDocs(ids);
      if (ids.length > 0) {
        setCompanyDocsError("");
      }
    }}
    initialSelectedIds={selectedCompanyDocs}
    selectionError={companyDocsError}
  />
)}


       {currentStep === 3 && (
  <SelectTemplates 
    onTemplateChange={setSelectedTemplate}
    
      initialTemplate={selectedTemplate}  
  />
)}

        {currentStep === 4 && (
          <RFPAnalysisUI
            key={getCurrentUuid()}
            drafterId={getCurrentUuid()}
            templateName={selectedTemplate}
             isCompleted={analysisCompleted}
onAnalysisComplete={async (sections, nPages) => {
  setAnalysisSections(sections);
  setAnalysisNPages(nPages);
  setAnalysisCompleted(true);

  // ✅ Save to localStorage as backup
  const uuid = getCurrentUuid();
  localStorage.setItem(`proposal_sections_${uuid}`, JSON.stringify(sections));
  localStorage.setItem(`proposal_npages_${uuid}`, String(nPages));

  try {
    const saveRes = await UpdateProposalDrafter({
      drafter_uuid:    uuid,
      drafter_id:      getCurrentId(),
      proposal_name:   rfpFormData.proposalName,
      project_id:      projectId,
      organization_id: localStorage.getItem("organization_id"),
      rfp_ids:         rfpFormData.selectedRfp,
      template_name:   selectedTemplate,
      progress:        75,
      n_pages:         nPages,
      content:         { sections: sections }
    });
    const parsed = typeof saveRes === "string" ? JSON.parse(saveRes) : saveRes;
    console.log("STEP 4 SAVE RESPONSE →", JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.error("Failed to save progress=75", e);
  }
  setCurrentStep(5);
}}
          />
        )}

        {currentStep === 5 && (
          <AnalysisComplete
            sections={analysisSections}
            nPages={analysisNPages}
            selectedTemplate={selectedTemplate}
            onBack={handleBack}
            onProceed={async (data) => {
  const uuid = getCurrentUuid();
  const resolvedPages = data?.nPages ?? analysisNPages ?? 0;

  localStorage.setItem(`proposal_npages_${uuid}`, String(resolvedPages));
  localStorage.setItem(
    `proposal_sections_${uuid}`,
    JSON.stringify(data?.sections || analysisSections || [])
  );

  let completionToastMessage = "";

  try {
    const raw = await UpdateProposalDrafter({
      drafter_uuid: uuid,
      drafter_id: getCurrentId(),
      proposal_name: rfpFormData.proposalName,
      project_id: projectId,
      organization_id: localStorage.getItem("organization_id"),
      rfp_ids: rfpFormData.selectedRfp,
      template_name: selectedTemplate,
      progress: 100,
    });
    const response = typeof raw === "string" ? JSON.parse(raw) : raw;
    completionToastMessage = response?.message || completionToastMessage;
  } catch (e) {
    console.error("Failed to save progress=100", e);
  }

  // ✅ Call ProposalDrafterView before navigating to list
  try {
    const encryptedId = getCurrentId();
    const sections = data?.sections || analysisSections || [];
    const allTitles = sections.map(s =>
      typeof s === "string" ? s : s.title
    ).filter(Boolean);

    if (encryptedId && allTitles.length > 0) {
      const raw = await ProposalDrafterView({
        drafter_id: encryptedId,
        sections: allTitles,
      });
      const res = typeof raw === "string" ? JSON.parse(raw) : raw;
      completionToastMessage = res?.message || completionToastMessage;
      console.log("ProposalDrafterView response before list →", res);
    }
  } catch (e) {
    console.error("ProposalDrafterView call failed:", e);
  }

  navigate(`/project/view/${projectUuid}/contract-command/proposal-drafter`, {
    state: {
      toastMessage: getCompletionSuccessMessage(completionToastMessage),
      toastType: "success",
    },
  });
}}
          />
        )}
      </div>

      {/* Footer */}
 {/* Footer */}
{currentStep !== 5 && (
  /* ADD tw-px-12 here to match the content alignment */
  <div className="tw-mt-8 tw-px-12 tw-pb-10 tw-flex tw-justify-between tw-items-center">

    {/* Left: Back + Save as Draft */}
    <div className="tw-flex tw-items-center tw-gap-3">
      {currentStep !== 1 && (
        <button
          onClick={handleBack}
          className=" tw-px-5 tw-py-2.5 tw-text-sm tw-font-normal tw-rounded-[8px] tw-bg-[#dedede] tw-text-[#1e293b] hover:tw-bg-gray-300 tw-transition-all tw-flex tw-items-center tw-gap-4"
        >
          <i className="icon-Back" />Back
        </button>
      )}

      {currentStep !== 1 &&
        currentStep !== 4 &&
        !(currentStep === 2 && !companyHasDocs) && (
          <button
            onClick={handleSaveAsDraft}
            className="tw-bg-white tw-text-[16px]  tw-px-6 tw-py-2.5 tw-rounded-[5px] tw-text-sm tw-font-medium tw-text-[#1e293b] hover:tw-bg-gray-50"
          >
            Save as Draft
          </button>
        )}
    </div>

    {/* Right: Save & Continue */}
    {/* {!(currentStep === 2 && !companyHasDocs) && (
      <button
        onClick={handleNext}
        disabled={isNextDisabled}
        className={`group tw-ml-auto tw-px-5 tw-py-2.5 tw-rounded-[5px] tw-flex tw-items-center tw-justify-center tw-gap-4 tw-text-sm tw-font-normal tw-transition-all tw-duration-300 tw-ease-in-out tw-shadow-lg
          ${isNextDisabled
            ? "tw-bg-[#a0aec0] tw-text-white tw-cursor-not-allowed"
            : "tw-bg-[#0140c1] tw-text-white tw-cursor-pointer hover:tw-bg-[#1b44c4] hover:tw-shadow-blue-200/50 hover:tw-scale-[1.03] hover:-tw-translate-y-[1px] active:tw-scale-[0.98] tw-flex-shrink-0 tw-whitespace-nowrap"
          }`}
      >
        {currentStep === 4
          ? "Processing..."
          : currentStep === 3
            ? "Start AI Analysis"
            : "Save & Continue"}
        <i className={`${currentStep === 3 ? 'icon-AI-fill' : 'icon-Save-and-Continue'} tw-transition-transform tw-duration-300 ${!isNextDisabled ? 'group-hover:tw-translate-x-1' : ''}`} />
      </button>
    )} */}
    {!(currentStep === 2 && !companyHasDocs) && (
  <button
    onClick={handleNext}
    disabled={isNextDisabled}
    className={`group tw-ml-auto tw-px-5 tw-py-2.5 tw-rounded-[5px] tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-sm tw-font-normal tw-transition-all tw-duration-300 tw-ease-in-out tw-shadow-lg
      ${isNextDisabled
        ? "tw-bg-[#a0aec0] tw-text-white tw-cursor-not-allowed"
        : "tw-bg-[#0140c1] tw-text-white tw-cursor-pointer hover:tw-bg-[#1b44c4] hover:tw-shadow-blue-200/50 hover:tw-scale-[1.03] hover:-tw-translate-y-[1px] active:tw-scale-[0.98] tw-flex-shrink-0 tw-whitespace-nowrap"
      }`}
  >
    {/* ✅ ONLY for Step 3 → icon before text */}
    {currentStep === 3 && (
      <i
        className={`icon-AI-fill tw-transition-transform tw-duration-300 ${
          !isNextDisabled ? 'group-hover:tw-translate-x-1' : ''
        }`}
      />
    )}

    {/* TEXT */}
    <span>
     {currentStep === 4 && !analysisCompleted
  ? "Processing..."
  : currentStep === 3
    ? "Start AI Analysis"
    : "Save & Continue"}
    </span>

    {/* ✅ For other steps → icon after text */}
    {currentStep !== 3 && (
      <i
        className={`icon-Save-and-Continue tw-transition-transform tw-duration-300 ${
          !isNextDisabled ? 'group-hover:tw-translate-x-1' : ''
        }`}
      />
    )}
  </button>
)}
  </div>
)}
    </div>
  );
}
