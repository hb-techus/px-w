// Route: /project/view/:projectUId/contract-command/contract-audit/add/:checkerUuid/generate
// Route: /project/view/:projectUId/contract-command/contract-audit/update/:checkerUuid/generate
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  create_health_checker,
  health_checker_detail,
} from "../../../../services/techus-services";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";

const AnalysisPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkerUuid } = useParams();
  const projectUuidFromRedux = useSelector((state) => state.project?.project_uuid);
  const storedProjectUId =
    projectUuidFromRedux || localStorage.getItem("project_uuid");
  const createStartedRef = useRef(false);
  const [statusText, setStatusText] = useState("Processing document content...");

  const analysisState = location.state || {};
  const projectUId = analysisState.projectUId || storedProjectUId;

  useEffect(() => {
    if (!checkerUuid || checkerUuid === "undefined") {
      console.error("AnalysisPage: invalid checkerUuid", checkerUuid);
      navigate(
        `/project/view/${projectUId}/contract-command/contract-audit`,
        { replace: true },
      );
      return;
    }

    if (checkerUuid === "new") return;

    let cancelled = false;

    const pollUntilReady = async () => {
      setStatusText("Finalizing contract health report...");

      while (!cancelled) {
        try {
          const response = await health_checker_detail({
            checker_uuid: checkerUuid,
          });

          if (response?.valid && response?.data?.response_text) {
            if (!cancelled) {
              navigate(
                `/project/view/${projectUId}/contract-command/contract-audit/view/${checkerUuid}`,
                { replace: true },
              );
            }
            return;
          }
        } catch (err) {
          console.error("Contract audit polling error:", err);
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    };

    pollUntilReady();

    return () => {
      cancelled = true;
    };
  }, [checkerUuid, navigate, projectUId]);

  useEffect(() => {
    if (checkerUuid !== "new" || createStartedRef.current) return;

    const {
      checkerName,
      inputMethod,
      projectId,
      organizationId,
      plainText,
      document_ids,
    } = analysisState;

    if (!checkerName || !inputMethod || !projectId || !organizationId) {
      showToast("error", "Unable to start analysis. Please submit again.");
      navigate(`/project/view/${projectUId}/contract-command/contract-audit`, {
        replace: true,
      });
      return;
    }

    createStartedRef.current = true;

    const createAndStartAnalysis = async () => {
      try {
        setStatusText("Preparing contract health analysis...");

        const payload = {
          project_id: projectId,
          organization_id: organizationId,
          checker_name: checkerName,
          input_method: inputMethod,
        };

        if (inputMethod === "pdf") {
          payload.document_ids = document_ids || [];
          setStatusText("Analyzing uploaded contract documents...");
        } else {
          payload.custom_input = plainText;
          setStatusText("Analyzing pasted contract content...");
        }

        const res = await create_health_checker(payload);

        if (!res?.valid) {
          throw new Error(res?.message || "Failed to create health checker.");
        }

        const createdCheckerUuid =
          res?.data?.checker_uuid ??
          res?.data?.data?.checker_uuid ??
          res?.checker_uuid;

        if (!createdCheckerUuid) {
          throw new Error("UUID not found.");
        }

        showToast("success", "Contract Audit created successfully.");
        navigate(
          `/project/view/${projectUId}/contract-command/contract-audit/add/${createdCheckerUuid}/generate`,
          { replace: true },
        );
      } catch (err) {
        console.error("create_health_checker error:", err);
        showToast("error", err?.message || "Something went wrong.");
        navigate(`/project/view/${projectUId}/contract-command/contract-audit`, {
          replace: true,
        });
      }
    };

    createAndStartAnalysis();
  }, [checkerUuid, analysisState, navigate, projectUId]);

  return (
    <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-[#f5f7fa] !tw-overflow-hidden">
      <div className="tw-w-[620px] tw-p-[50px_40px] tw-bg-white tw-border tw-border-[#e0e0e0] tw-rounded-md tw-flex tw-flex-col tw-gap-4 tw-items-center tw-text-center">
        <div className="tw-relative tw-flex tw-items-center tw-justify-center tw-mb-2">
          <span
            className="tw-absolute tw-rounded-full tw-bg-[#dce6ff]"
            style={{
              width: 80,
              height: 80,
              animation: "checkerPulse 2s ease-in-out infinite",
              opacity: 0.5,
            }}
          />
          <div className="tw-relative tw-w-[64px] tw-h-[64px] tw-rounded-full tw-bg-[#eef2ff] tw-flex tw-items-center tw-justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
                stroke="#0140c1"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="#dce6ff"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke="#0140c1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <h2 className="tw-text-[18px] tw-font-bold tw-text-slate-800 tw-mb-3">
          Analyzing Contract Health
        </h2>

        <p className="tw-text-[13px] tw-text-slate-500 tw-leading-relaxed tw-mb-6">
          Our AI is reviewing your contract for compliance gaps, structural
          issues, and areas requiring improvement...
        </p>

        <div className="tw-flex tw-items-center tw-gap-2 tw-text-[13px] tw-text-slate-400">
          <i className="icon-Uploading tw-text-gray-400 tw-text-[18px] tw-animate-spin tw-flex-shrink-0" />
          {statusText}
        </div>
      </div>

      <style>{`
        @keyframes checkerPulse {
          0%, 100% { transform: scale(1); opacity: 0.45; }
          50% { transform: scale(1.35); opacity: 0.15; }
        }
      `}</style>
    </div>
  );
};

export default AnalysisPage;
