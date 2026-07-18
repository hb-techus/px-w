
import React from "react";
import NavigationHeader from "../../../../../genriccomponents/NavigationHeader";
import InfoBox from "./InfoBox";
import Statscard from "./Statscard";
import GapSelection from "./GapSelection";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useState, useRef, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  add_RFI_data,
  update_RFI_data,
  get_RFP_data,
  detail_RFI_data,
  get_RFI_list,
} from "../../../../../services/techus-services";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FullPageLoader from "../../../../../genriccomponents/loaders/FullPageLoader";
import { showToast } from '../../../../../genriccomponents/techus-ToastNotification';


const formatCategory = (raw = "") => {
  return raw
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const mapSeverity = (raw = "") => {
  const map = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    moderate: "Medium",
    low: "Low",
    minor: "Low",
  };
  return map[raw.toLowerCase()] ?? "Low";
};

const normalizeGapId = (rawId) => {
  if (rawId === null || rawId === undefined) return "";

  const value = String(rawId).trim();
  if (!value) return "";

  const match = value.match(/(\d+)/);
  if (match?.[1]) {
    return `GAP-${match[1].padStart(3, "0")}`;
  }

  return value.toUpperCase();
};

const getSelectedGapIds = (gapData = []) => {
  if (!Array.isArray(gapData) || gapData.length === 0) return [];

  const hasExplicitSelection = gapData.some((gap) =>
    Object.prototype.hasOwnProperty.call(gap || {}, "selected")
  );

  return gapData
    .filter((gap) => (hasExplicitSelection ? Boolean(gap?.selected) : true))
    .map((gap) => normalizeGapId(gap?.id ?? gap?.gap_id ?? gap?.gapId))
    .filter(Boolean);
};

const modules = {
  toolbar: {
    container: [
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: "" }, { align: "center" }, { align: "right" }, { align: "justify" }],
      ["link"],
      ["undo", "redo"],
    ],
    handlers: {
      undo: function () { this.quill.history.undo(); },
      redo: function () { this.quill.history.redo(); },
    },
  },
  history: { delay: 1000, maxStack: 100, userOnly: true },
};

const formats = ["bold", "italic", "underline", "list", "bullet", "align", "link"];
const DUPLICATE_RFI_NAME_MESSAGE = "An RFI drafter with this name already exists for the project.";
const normalizeRfiName = (value = "") => value.trim().replace(/\s+/g, " ").toLowerCase();

const CreateRFILayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const routeMode = location.pathname.includes("/update/") ? "update" : "add";


  const [editorValue, setEditorValue] = useState("");
  const quillRef = useRef(null);
  const [rfiName, setRfiName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrefillLoading, setIsPrefillLoading] = useState(false);

  const [allGaps, setAllGaps] = useState([]);
  const [gapsLoading, setGapsLoading] = useState(false);

  const [selectedGaps, setSelectedGaps] = useState([]);
  const [severity, setSeverity] = useState("");
  const [category, setCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const nameInputRef = useRef(null);
  const [nameError, setNameError] = useState("");
  const [prefillData, setPrefillData] = useState(null);

  const projectId = localStorage.getItem("project_id");
  const organizationId = localStorage.getItem("organization_id");
  const projectUId = localStorage.getItem("project_uuid");
  const organizationUId = localStorage.getItem("organization_uuid");

  useEffect(() => {
    const fetchGaps = async () => {
      setGapsLoading(true);
      try {
        const payload = {
          organization_uuid: organizationUId,
          project_uuid: projectUId,
          section: "gaps",
          device_info: {
            osName: "macOS",
            osVersion: "Catalina",
            browserName: "Chrome",
            browserVersion: "137.0.0.0",
          },
        };

        const res = await get_RFP_data(payload);
        console.log(res)
        if (res?.valid && Array.isArray(res?.data)) {
          const mappedGaps = res.data.map((gap) => ({
            id: normalizeGapId(gap.id),
            title: gap.name,
            description: gap.material_gap,
            reference: gap.original_content_snippet,
            category: formatCategory(gap.category),
            severity: mapSeverity(gap.severity),
            recommended_fix: gap.recommended_fix,
            disclosure_guidance: gap.disclosure_guidance,
            impact: gap.impact_on_timeline_or_cost,
            what_rfp_requires: gap.what_the_rfp_requires,
            pdf_name: gap.pdf_name,
            pdf_pages: gap.pdf_pages,
            selected: false,
          }));

          setAllGaps(mappedGaps);
        } else {
          showToast("error", res?.message);
        }
      } catch (error) {
        console.error("Error fetching gaps:", error);
        showToast("error", "Something went wrong while fetching gaps.");
      } finally {
        setGapsLoading(false);
      }
    };

    fetchGaps();
  }, []);

  const { rfi_drafter_uuid } = useParams();
  const isEdit = Boolean(routeMode === "update" || location.state?.isEdit || rfi_drafter_uuid);
  const fallbackGapData = location.state?.gapData || [];
  const showInitialLoader = isEdit && (gapsLoading || isPrefillLoading);

  useEffect(() => {
    if (!isEdit) return;

    const fallbackSelectedIds = getSelectedGapIds(fallbackGapData);
    if (fallbackSelectedIds.length > 0) {
      setSelectedGaps(fallbackSelectedIds);
    }
  }, [fallbackGapData, isEdit]);

  // Replace the existing prefill useEffect with this:
  useEffect(() => {
    if (!isEdit || !rfi_drafter_uuid) return;
    const fetchRFIDetail = async () => {
      try {
        setIsPrefillLoading(true);
        const res = await detail_RFI_data({ rfi_drafter_uuid });
        if (res?.valid) {
          const d = res.data;
          setRfiName(d.rfi_drafter_name ?? "");
          setEditorValue(d.context ?? "");
          setPrefillData({
            rfi_drafter_id: d.rfi_drafter_id,
            start_date: d.start_date,
            end_date: d.end_date,
          });

          if (Array.isArray(d.gap_data)) {
            const selectedIds = getSelectedGapIds(d.gap_data);
            if (selectedIds.length > 0) {
              setSelectedGaps(selectedIds);
            } else {
              const fallbackSelectedIds = getSelectedGapIds(fallbackGapData);
              if (fallbackSelectedIds.length > 0) {
                setSelectedGaps(fallbackSelectedIds);
              }
            }
          }
        } else {
          showToast("error", res.message);
        }
      } catch (err) {
        console.error("Failed to fetch RFI detail:", err);
        showToast("Something went wrong while loading RFI.");
      } finally {
        setIsPrefillLoading(false);
      }
    };
    fetchRFIDetail();
  }, [fallbackGapData, rfi_drafter_uuid, isEdit]);

  const statsData = [
    {
      title: "Total Gaps",
      value: allGaps.length,
      icon: "icon-Document-analysis",
      iconBg: "#eee",
      iconColor: "#797979",
      valueColor: "#2b2b2c",
    },
    {
      title: "Critical",
      value: allGaps.filter((g) => g.severity === "Critical").length,
      icon: "icon-AI-Risk-Identifier",
      iconBg: "#fce7f3",
      iconColor: "#9d174d",
      valueColor: "#9d174d",
    },
    {
      title: "High Priority",
      value: allGaps.filter((g) => g.severity === "High").length,
      icon: "icon-AI-Risk-Identifier",
      iconBg: "#ffe2e3",
      iconColor: "#b91c1b",
      valueColor: "#b91c1b",
    },
    {
      title: "Medium Priority",
      value: allGaps.filter((g) => g.severity === "Medium").length,
      icon: "icon-Alert",
      iconBg: "#ffebce",
      iconColor: "#ff9500",
      valueColor: "#ff9500",
    },
    {
      title: "Low Priority",
      value: allGaps.filter((g) => g.severity === "Low").length,
      icon: "icon-Info-line",
      iconBg: "#eaf1ff",
      iconColor: "#1e4ed8",
      valueColor: "#1e4ed8",
    },
  ];


  const handleRfiNameChange = (val) => {
    setRfiName(val);
    if (nameError) setNameError("");
  };

  const focusNameField = () => {
    setTimeout(() => {
      nameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      nameInputRef.current?.focus();
    }, 50);
  };

  const setDuplicateNameError = (message = DUPLICATE_RFI_NAME_MESSAGE) => {
    setNameError(message);
    focusNameField();
  };

  const isDuplicateNameMessage = (message = "") => /already exists/i.test(message);

  const checkDuplicateRfiName = async (nameToCheck) => {
    if (!projectId || !nameToCheck) return false;

    try {
      const res = await get_RFI_list({ project_id: projectId });
      if (!res?.valid || !Array.isArray(res?.data)) {
        return false;
      }

      const normalizedTargetName = normalizeRfiName(nameToCheck);

      return res.data.some((item) => {
        const isSameName = normalizeRfiName(item?.rfi_drafter_name) === normalizedTargetName;
        const isCurrentRfi =
          (prefillData?.rfi_drafter_id && item?.rfi_drafter_id === prefillData.rfi_drafter_id) ||
          (rfi_drafter_uuid && item?.rfi_drafter_uuid === rfi_drafter_uuid);

        return isSameName && !isCurrentRfi;
      });
    } catch (error) {
      console.error("Failed to validate duplicate RFI name:", error);
      return false;
    }
  };

  const handleGenerateRFI = async () => {
    const trimmedRfiName = rfiName.trim();

    if (!trimmedRfiName) {
      setNameError("RFI name is required.");
      focusNameField();
      return;
    }
    setNameError("");

    if (selectedGaps.length === 0) {
      showToast("error", "Please select at least one gap to proceed.");
      return;
    }

    try {
      setIsSubmitting(true);

      const duplicateNameExists = await checkDuplicateRfiName(trimmedRfiName);
      if (duplicateNameExists) {
        setDuplicateNameError();
        return;
      }

      const gap_data = allGaps.map((gap) => ({
        ...gap,
        selected: selectedGaps.includes(gap.id),
      }));

      const basePayload = {
        rfi_drafter_name: trimmedRfiName,
        project_id: projectId,
        organization_id: organizationId,
        gaps_count: selectedGaps.length,
        context: editorValue,
        gap_data,
      };

      let res;
      if (isEdit && prefillData?.rfi_drafter_id) {
        res = await update_RFI_data({
          ...basePayload,
          rfi_drafter_id: prefillData.rfi_drafter_id,
          start_date: prefillData.start_date,
          end_date: prefillData.end_date,
        });
      }
      else {
        console.log(basePayload)
        res = await add_RFI_data(basePayload);
      }

      if (res?.valid) {
        console.log(res)

        const targetUuid =
          res?.rfi_drafter_uuid ||
          res?.data?.rfi_drafter_uuid ||
          rfi_drafter_uuid;
        const targetRfiId =
          res?.rfi_drafter_id ||
          res?.data?.rfi_drafter_id ||
          prefillData?.rfi_drafter_id;

        if (!targetUuid) {
          throw new Error("RFI UUID not found.");
        }

        navigate(
          `/project/view/${projectUId}/contract-command/rfi-drafter/${isEdit ? "update" : "add"}/${targetUuid}/generate-rfi`,
          {
            state: {
              loadFromDetail: true,
              successToastMessage: res?.message,
              context: editorValue,
              rfiData: targetRfiId
                ? { rfi_drafter_id: targetRfiId }
                : undefined,
              gaps: gap_data,
            },
          },
        );
      } else {
        if (isDuplicateNameMessage(res?.message)) {
          setDuplicateNameError(res?.message || DUPLICATE_RFI_NAME_MESSAGE);
          return;
        }

        showToast("error", res?.message);
      }
    } catch (error) {
      console.error("Failed to save RFI:", error);
      if (isDuplicateNameMessage(error?.message)) {
        setDuplicateNameError(error?.message || DUPLICATE_RFI_NAME_MESSAGE);
        return;
      }
      showToast("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-6 tw-pb-6">
      {(gapsLoading || showInitialLoader) && <FullPageLoader />}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover />
      <NavigationHeader
        title="Contract Command /"
        subTitle={isEdit ? "Edit RFI" : "Create New RFI"}
        navigation={`/project/view/${projectUId}/contract-command/rfi-drafter`}
      />
      <div className="tw-pl-12 tw-pr-12 tw-flex tw-flex-col tw-gap-4">
        <InfoBox />

        <div className="tw-flex tw-gap-6">
          {statsData.map((item, index) => (
            <Statscard
              key={index}
              title={item.title}
              value={item.value}
              icon={item.icon}
              iconBg={item.iconBg}
              iconColor={item.iconColor}
              valueColor={item.valueColor}
            />
          ))}
        </div>


        <GapSelection
          gaps={allGaps}
          selectedGaps={selectedGaps}
          setSelectedGaps={setSelectedGaps}
          severity={severity}
          setSeverity={setSeverity}
          category={category}
          setCategory={setCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          rfiName={rfiName}
          setRfiName={handleRfiNameChange}
          nameError={nameError}
          nameInputRef={nameInputRef}
        />

      <div className="tw-flex tw-flex-col tw-gap-3 tw-bg-white tw-p-4 tw-border tw-border-[#e2e8f0] tw-rounded-[10px]">


          <div className="tw-flex tw-items-center tw-gap-2">
         <div className="tw-bg-[#eff2ff] tw-p-2 tw-rounded-[6px] tw-flex tw-justify-center tw-items-center">
              <i className="icon-edit tw-text-[#4f6ef7] tw-text-[16px]"></i>
            </div>
            <div className="tw-flex tw-flex-col">
              <span className="tw-font-semibold tw-text-[14px] tw-text-[#1e293b]">
                Use below editor section to provide more context to generate RFI
              </span>
              <span className="tw-text-[12px] tw-text-[#64748b]">
                Add any additional details, clarifications, or specific questions you want included in the RFI document.
              </span>
            </div>
          </div>
          {/* Editor — clean white card, toolbar inside at top */}
          <div className="tw-bg-white tw-border tw-border-[#e2e8f0] tw-rounded-[10px] tw-overflow-hidden">
            <style>{`
      .ql-toolbar.ql-snow {
        border: none !important;
        border-bottom: 1px solid #e2e8f0 !important;
        background: #fff;
        padding: 8px 12px !important;
        display: flex;
        align-items: center;
        gap: 2px;
      }
      .ql-container.ql-snow { border: none !important; font-size: 14px; }
      .ql-editor { min-height: 280px; }
      .ql-editor.ql-blank::before { color: #a0aec0; font-style: normal; }
      .ql-toolbar.ql-snow .ql-formats {
        margin-right: 0 !important;
        padding-right: 10px;
        border-right: 1.5px solid #e2e8f0 !important;
      }
      .ql-toolbar.ql-snow .ql-formats:last-child {
        border-right: none !important;
        padding-right: 0;
      }
      .ql-undo::before { content: "↩"; font-size: 15px; line-height: 1; }
      .ql-redo::before { content: "↪"; font-size: 15px; line-height: 1; }
    `}</style>

            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={editorValue}
              onChange={setEditorValue}
              modules={modules}
              formats={formats}
              placeholder="Enter additional context, specific concerns, or detailed questions you'd like addressed in the RFI..."
            />
          </div>

        </div>

        <div className="tw-bg-[#fff] tw-p-4 tw-border tw-border-[#e0e0e0] tw-rounded-[5px] tw-flex tw-justify-between tw-items-center">
          <div className="tw-flex tw-gap-2 tw-flex-col">
            <span className="tw-font-bold tw-text-[16px] tw-text-[#333]">Ready to generate your RFI?</span>
            <span className="tw-text-[12px] tw-text-[#1e293b]">
              {selectedGaps.length} gap(s) selected for RFI generation
            </span>
          </div>
          <button
            onClick={handleGenerateRFI}
            disabled={isSubmitting || isPrefillLoading}
            aria-busy={isSubmitting}
            className="group tw-px-4 tw-py-2 tw-flex tw-gap-2 tw-items-center tw-bg-[#0140c1] tw-rounded-[5px] tw-text-white tw-font-[500] tw-whitespace-nowrap
  tw-transition-all tw-duration-300 tw-ease-in-out
  hover:tw-bg-[#1b44c4] hover:tw-shadow-lg hover:tw-shadow-blue-200/50
  hover:tw-scale-[1.03] hover:-tw-translate-y-[1px]
  active:tw-scale-[0.98]
  disabled:tw-opacity-60 disabled:tw-cursor-not-allowed disabled:tw-scale-100 disabled:tw-translate-y-0 disabled:tw-shadow-none"
          >
            {isSubmitting ? (
              <>
                <svg className="tw-animate-spin tw-w-4 tw-h-4 tw-flex-shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="tw-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="tw-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>{isEdit ? "Updating..." : "Generating..."}</span>
              </>
            ) : (
              <>
                <i className="icon-AI-fill tw-text-[16px]"></i>
                <span>{isEdit ? "Update RFI" : "Generate RFI"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRFILayout;
