

import React, { useState, useEffect } from "react";
import { GetProposalDrafterRFP, get_trade_data  } from '../../../../services/techus-services';
import FullPageLoader from '../../../../genriccomponents/loaders/FullPageLoader';

export default function SelectRFP({ onDataChange, initialData = {} }) {

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proposalName, setProposalName] = useState(initialData.proposal_name || "");
  const [tradeCategory, setTradeCategory] = useState(initialData.trade_category_name || "");
  const [tradeCategoryId, setTradeCategoryId] = useState(initialData.trade_category_id || "");
  const [, setCategoryOptions] = useState([]);
  const [, setCategoryRawData] = useState([]);
  const [startDate] = useState(
    initialData.start_date ? initialData.start_date.split("T")[0] : ""
  );
  const [endDate] = useState(
    initialData.end_date ? initialData.end_date.split("T")[0] : ""
  );
  const [selectedRfpEncryptedId, setSelectedRfpEncryptedId] = useState(
    initialData.selected_rfp_encrypted_ids || []
  );
  const [selectedRfp, setSelectedRfp] = useState(
    initialData.selected_rfp_ids || []
  );
  const [errors, setErrors] = useState({
    proposalName: "",
   
    selectedRfp: "",
  });


  const formatFileSize = (sizeInBytes) => {
    const size = Number(sizeInBytes) || 0;

    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }

    return `${Math.max(1, Math.round(size / 1024))} KB`;
  };

  // ── 1. Fetch RFP Documents ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchRFPs = async () => {
      setLoading(true);
      const payload = {
        organization_uuid: localStorage.getItem("organization_uuid"),
        project_uuid: localStorage.getItem("project_uuid"),
        module_type: "RFP",
        status: '3',
        device_info: {
          osName: "macOS", osVersion: "Catalina",
          browserName: "Chrome", browserVersion: "137.0.0.0",
        },
      };
      try {
        const raw = await GetProposalDrafterRFP(payload);
        const response = typeof raw === "string" ? JSON.parse(raw) : raw;

        if (response?.valid) {
          // ✅ Keep ALL docs returned — API already filters by module_type=RFP & status=3
          const allDocs = response.data.documents ?? response.data ?? [];

          console.log("🔍 allDocs →", allDocs.map(d => ({
            name: d.filename ?? d.document_name,
            file_id: d.file_id,
            document_encrypted_id: d.document_encrypted_id,
            document_id: d.document_id,
          })));
          console.log("🔍 initialData.rfp_ids →", initialData?.rfp_ids);

          setDocuments(allDocs);

          // ── Edit mode: match rfp_ids against all possible ID fields ────
          if (initialData?.rfp_ids?.length) {
            const preSelectedEncryptedIds = initialData.rfp_ids;

            const matched = allDocs.filter((doc) =>
              preSelectedEncryptedIds.includes(doc.file_id) ||
              preSelectedEncryptedIds.includes(doc.document_encrypted_id) ||
              preSelectedEncryptedIds.includes(doc.document_id)
            );

            console.log("🔍 matched docs →", matched);

            const preSelectedIds = matched.map((doc) => doc.document_id ?? doc.file_id);
            setSelectedRfpEncryptedId(preSelectedEncryptedIds);
            setSelectedRfp(preSelectedIds);

          // ── Create → Back mode ─────────────────────────────────────────
          } else if (initialData?.selected_rfp_encrypted_ids?.length) {
            const preSelectedEncryptedIds = initialData.selected_rfp_encrypted_ids;
            const matched = allDocs.filter((doc) =>
              preSelectedEncryptedIds.includes(doc.file_id) ||
              preSelectedEncryptedIds.includes(doc.document_encrypted_id)
            );
            const preSelectedIds = matched.map((doc) => doc.document_id ?? doc.file_id);
            setSelectedRfpEncryptedId(preSelectedEncryptedIds);
            setSelectedRfp(preSelectedIds);
          }
        }
      } catch (err) {
        console.error("Error fetching RFPs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRFPs();
  }, []);

  // ── 2. Fetch Categories ────────────────────────────────────────────────────
 useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await get_trade_data();
      if (res?.valid && Array.isArray(res.data)) {
        setCategoryRawData(res.data);
        const options = res.data
          .filter((c) => c.display_name)
          .map((c) => c.display_name);
        setCategoryOptions(options);

        if (initialData.trade_category_name) {
          const found = res.data.find(
            (c) => c.display_name?.toLowerCase() === initialData.trade_category_name?.toLowerCase()
          );
          if (found) {
            setTradeCategory(found.display_name);
            setTradeCategoryId(found.id);
          }
        } else if (initialData.trade_category_id) {
          const found = res.data.find((c) => c.id === initialData.trade_category_id);
          if (found) {
            setTradeCategory(found.display_name);
            setTradeCategoryId(found.id);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };
  fetchCategories();
}, []);

  // ── 3. Notify parent + expose validate fn ─────────────────────────────────
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        proposalName,
        tradeCategory,
        tradeCategoryId,
        selectedRfp: selectedRfpEncryptedId,
        startDate: startDate || null,
        endDate: endDate || null,
        validate: () => {
          const newErrors = {
            proposalName: !proposalName?.trim() ? "Proposal name is required." : "",
           
            selectedRfp: !selectedRfpEncryptedId?.length ? "Please select at least one RFP." : "",
          };
          setErrors(newErrors);
          return !Object.values(newErrors).some(Boolean);
        },
      });
    }
  }, [proposalName, tradeCategory, tradeCategoryId, selectedRfp, selectedRfpEncryptedId, startDate, endDate]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="tw-animate-in tw-slide-in-from-bottom-2 tw-duration-500 tw-px-12 tw-pt-2">

      {/* AI Banner */}
      <div className="tw-bg-[#eaf2ff] tw-border tw-border-[#48f] tw-rounded-xl tw-p-5 tw-mb-6 tw-flex tw-items-center tw-gap-5">
        <div className="tw-bg-[#d9e7ff] tw-p-3 tw-rounded-xl tw-flex tw-items-center tw-justify-center">
          <i className="icon-AI-fill tw-text-[#48f] tw-text-[26px]" />
        </div>
        <p className="tw-text-[#1e293b] tw-text-[16px] tw-font-normal tw-leading-relaxed">
          Select from existing RFP documents, upload a PDF contract, or paste content directly.
          Our AI will analyze the document and identify clauses that may require attention.
        </p>
      </div>

      {/* Proposal Details */}
      <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-p-6 tw-mb-6 tw-shadow-sm tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-8">

        {/* Proposal Name */}
        <div className="tw-flex tw-flex-col tw-gap-1">
          <label className="tw-text-[13px] tw-font-semibold tw-text-gray-500">Proposal Name*</label>
          <input
            type="text"
            placeholder="Enter proposal name"
            value={proposalName}
           
onChange={(e) => {
  const val = e.target.value;
  const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
  setProposalName(capitalized);
  if (capitalized.trim()) setErrors(prev => ({ ...prev, proposalName: "" }));
}}
            className={`tw-w-full tw-px-4 tw-py-2.5 tw-rounded-lg tw-border tw-text-[14px] tw-text-gray-700 tw-transition-colors placeholder:tw-text-gray-400
              ${errors.proposalName
                ? "tw-border-red-400 focus:tw-border-red-400 focus:tw-outline-none"
                : "tw-border-[#dcdbdb] focus:tw-border-[#0140c1] focus:tw-ring-1 tw-ring-[#0140c1] focus:tw-outline-none"
              }`}
          />
          {errors.proposalName && (
            <span className="tw-text-[12px] tw-text-red-500 tw-mt-0.5">{errors.proposalName}</span>
          )}
        </div>
      </div>

      {/* RFP Documents */}
      <div className="tw-bg-white tw-rounded-xl  tw-border tw-border-gray-200 tw-shadow-sm tw-overflow-hidden">
        <div className="tw-p-5 tw-flex tw-items-center tw-gap-3">
          <div className="tw-bg-[#dee9ff] tw-border tw-border-[#dbeafe] tw-p-2 tw-rounded-[6px] tw-flex tw-items-center tw-justify-center">
            <i className="icon-book tw-text-[#0140c1] tw-text-[29px]" />
          </div>
          <h2 className="tw-text-[18px] tw-font-bold tw-text-[#333]">Select RFP Documents</h2>
        </div>

        {errors.selectedRfp && (
          <div className="tw-px-6 tw-pb-2">
            <span className="tw-text-[12px] tw-text-red-500">{errors.selectedRfp}</span>
          </div>
        )}

        <div className="tw-px-6 tw-pb-6 tw-space-y-4">
          {loading ? (
            <FullPageLoader />
          ) : documents.length === 0 ? (
            <p className="tw-text-sm tw-text-gray-400">No RFP documents found.</p>
          ) : (
            documents.map((doc) => {
              // ✅ Support both document_id and file_id
              const docId = doc.document_id ?? doc.file_id;
              const encId = doc.document_encrypted_id ?? doc.file_id;
              const docName = doc.document_name ?? doc.filename;
              const isSelected = selectedRfp.includes(docId);

              return (
                <div
                  key={docId}
                  onClick={() => {
                    const isAlreadySelected = selectedRfp.includes(docId);
                    const newSelectedRfp = isAlreadySelected
                      ? selectedRfp.filter((id) => id !== docId)
                      : [...selectedRfp, docId];
                    const newEncryptedIds = isAlreadySelected
                      ? selectedRfpEncryptedId.filter((id) => id !== encId)
                      : [...selectedRfpEncryptedId, encId];
                    setSelectedRfp(newSelectedRfp);
                    setSelectedRfpEncryptedId(newEncryptedIds);
                    if (newEncryptedIds.length > 0) setErrors(prev => ({ ...prev, selectedRfp: "" }));
                  }}
                  className={`tw-flex tw-items-center tw-p-4 tw-rounded-xl tw-border tw-transition-all tw-cursor-pointer ${
                    isSelected
                      ? "tw-border-blue-500 tw-bg-[#f8faff]"
                      : "tw-border-gray-100 hover:tw-border-gray-200"
                  }`}
                >
                  <div className={`tw-w-5 tw-h-5 tw-rounded tw-border tw-flex tw-items-center tw-justify-center tw-transition-colors tw-mr-5 ${
                    isSelected ? "tw-bg-blue-600 tw-border-blue-600" : "tw-border-gray-300 tw-bg-white"
                  }`}>
                    {isSelected && <i className="icon-Tick tw-text-white" />}
                  </div>
                  <div className="tw-bg-[#ffe0e0] tw-p-2 tw-rounded-[6px] tw-mr-4  tw-flex tw-justify-center tw-items-center">
                    <i className="icon-On-hold tw-text-[#ff4444] tw-text-[36px]" />
                  </div>
                  <div className="tw-flex-1">
                    <h3 className="tw-text-[15px] tw-font-semibold tw-text-gray-800">{docName}</h3>
                    <div className="tw-text-[13px] tw-text-[#1e293b] tw-mt-0.5">
                      {formatFileSize(doc.size)} • Uploaded {new Date(doc.uploaded_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
