import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AddClauseSuggester,
  AddUploadDoc,
  CheckExistsSuggester,
  GetClauseSuggesterDetail,
  GetCompanyUploadedUrl,
} from "../../../../services/techus-services";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";

const INPUT_METHOD_MAP = {
  rfp: "rfp",
  pdf: "pdf",
  custom: "txt",
};
const uploadFileToS3 = ({ file, presignedUrl, onProgress }) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`S3 upload failed (status ${xhr.status})`));
    });
    xhr.addEventListener("error", () => reject(new Error("Network error during S3 upload")));
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/pdf");
    xhr.send(file);
  });

const AnalyzingClauses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { uuid: routeProjectUuid, analysisUuid } = useParams();
  const creationStartedRef = useRef(false);
  const [statusText, setStatusText] = useState("Processing document content...");

  const analysisState = location.state || {};
  const currentProjectUuid = routeProjectUuid || null;

  const uploadSingleFile = async (file, organizationUuid, projectId) => {
    const urlRaw = await GetCompanyUploadedUrl({
      organization_uuid: organizationUuid,
      file_name: file.name,
      document_category: "suggest_clause",
    });
    const urlResponse = typeof urlRaw === "string" ? JSON.parse(urlRaw) : urlRaw;

    if (!urlResponse?.valid) {
      throw new Error(`Failed to get upload URL for "${file.name}": ${urlResponse?.message || "Unknown error"}`);
    }

    const presignedUrl = urlResponse.data?.upload_url;
    if (!presignedUrl) throw new Error(`No presigned URL returned for "${file.name}"`);

    const serverFileUuid = urlResponse.data?.file_uuid;
    if (!serverFileUuid) throw new Error(`No file_uuid in server response for "${file.name}"`);

    await uploadFileToS3({
      file,
      presignedUrl,
      onProgress: (pct) => console.log(`Uploading ${file.name}: ${pct}%`),
    });

    const docRaw = await AddUploadDoc({
      organization_uuid: organizationUuid,
      file_uuid: serverFileUuid,
      project_id: projectId,
      original_file_name: file.name,
      file_size: file.size,
      document_category: "suggest_clause",
    });
    const docResponse = typeof docRaw === "string" ? JSON.parse(docRaw) : docRaw;

    if (!docResponse?.valid) {
      throw new Error(`Document registration failed for "${file.name}": ${docResponse?.message || "Unknown error"}`);
    }

    return (
      docResponse.document_id ??
      docResponse.data?.document_id ??
      docResponse.data?.document_encrypted_id ??
      serverFileUuid
    );
  };

  useEffect(() => {
    if (!analysisUuid) {
      navigate(`/project/view/${currentProjectUuid}/contract-command/clause-assist`, {
        replace: true,
      });
      return;
    }

    if (analysisUuid === "new") return;

    let cancelled = false;

    const pollUntilReady = async () => {
      while (!cancelled) {
        try {
          const raw = await GetClauseSuggesterDetail({ suggester_uuid: analysisUuid });
          const response = typeof raw === "string" ? JSON.parse(raw) : raw;

          if (response?.valid && response?.data?.response_text) {
            if (!cancelled) {
              navigate(`/project/view/${currentProjectUuid}/contract-command/clause-assist/view/${analysisUuid}`, {
                replace: true,
              });
            }
            return;
          }
        } catch (err) {
          console.error("Polling error:", err);
        }

        await new Promise((res) => setTimeout(res, 2000));
      }
    };

    pollUntilReady();

    return () => {
      cancelled = true;
    };
  }, [analysisUuid, navigate, currentProjectUuid]);

  useEffect(() => {
    if (analysisUuid !== "new" || creationStartedRef.current) return;

    const {
      clauseName,
      activeTab,
      selectedRFPs,
      uploadedFiles,
      customText,
      projectId,
      organizationId,
      organizationUuid,
    } = analysisState;

    if (!clauseName || !activeTab || !projectId || !organizationId || !organizationUuid) {
      showToast("error", "Unable to start analysis. Please submit again.");
      navigate(`/project/view/${currentProjectUuid}/contract-command/clause-assist`, { replace: true });
      return;
    }

    creationStartedRef.current = true;

    const createAndStartAnalysis = async () => {
      try {
        setStatusText("Preparing your clause analysis...");

        const checkRaw = await CheckExistsSuggester({
          suggester_name: clauseName,
          project_id: projectId,
        });
        const checkResponse = typeof checkRaw === "string" ? JSON.parse(checkRaw) : checkRaw;

        if (checkResponse?.exists === true || checkResponse?.data?.exists === true) {
          showToast("error", "A suggester with this name already exists.");
          navigate(`/project/view/${currentProjectUuid}/contract-command/clause-assist`, { replace: true });
          return;
        }

        const payload = {
          suggester_name: clauseName,
          project_id: projectId,
          organization_id: organizationId,
          input_method: INPUT_METHOD_MAP[activeTab],
        };

        if (activeTab === "rfp") {
          payload.rfp_ids = selectedRFPs;
          setStatusText("Starting analysis for selected RFP documents...");
        } else if (activeTab === "pdf") {
          setStatusText("Uploading PDF documents...");
          const uploadedIds = await Promise.all(
            (uploadedFiles || []).map((file) => uploadSingleFile(file, organizationUuid, projectId))
          );
          payload.document_ids = uploadedIds;
          setStatusText("Analyzing uploaded documents...");
        } else if (activeTab === "custom") {
          payload.custom_input = customText;
          setStatusText("Analyzing pasted contract content...");
        }

        const raw = await AddClauseSuggester(payload);
        const response = typeof raw === "string" ? JSON.parse(raw) : raw;

        if (!response?.valid) {
          throw new Error(response?.message || "Failed to create clause suggester.");
        }

        const createdUuid =
          response.data?.suggester_uuid ??
          response.suggester_uuid ??
          response.data?.data?.suggester_uuid;

        if (!createdUuid) {
          throw new Error("Suggester UUID not returned.");
        }

        showToast("success", "Clause Assist analysis created successfully.");
        navigate(`/project/view/${currentProjectUuid}/contract-command/clause-assist/analyzing/${createdUuid}`, {
          replace: true,
        });
      } catch (err) {
        console.error("createAndStartAnalysis error:", err);
        showToast("error", err?.message || "Something went wrong. Please try again.");
        navigate(`/project/view/${currentProjectUuid}/contract-command/clause-assist`, { replace: true });
      }
    };

    createAndStartAnalysis();
  }, [analysisUuid, analysisState, navigate, currentProjectUuid]);

  return (
    <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-[#f5f7fa] !tw-overflow-hidden">
      <div className="tw-w-[620px] tw-p-[50px_40px] tw-bg-white tw-border tw-border-[#e0e0e0] tw-rounded-md tw-flex tw-flex-col tw-gap-4 tw-items-center tw-text-center">
        <div className="tw-bg-[#dee9ff] tw-border tw-border-[#dbeafe] tw-p-2 tw-flex tw-justify-center tw-items-center tw-rounded-full">
                  <i className="icon-Law tw-text-[#4488ff] tw-text-[55px]" />
                </div>
        <h2 className="tw-text-[18px] tw-font-bold tw-text-slate-800 tw-mb-3">
          Analyzing Contract Clauses
        </h2>
        <p className="tw-text-[13px] tw-text-slate-500 tw-leading-relaxed tw-mb-6">
          Our AI is scanning your documents for clauses that require
          attention, identifying risks, and preparing recommendations...
        </p>
        <div className="tw-flex tw-items-center tw-gap-2 tw-text-[13px] tw-text-slate-400">
          <i className="icon-Uploading tw-text-gray-400 tw-text-[18px] tw-animate-spin tw-flex-shrink-0" />
          {statusText}
        </div>
      </div>
    </div>
  );
};

export default AnalyzingClauses;
