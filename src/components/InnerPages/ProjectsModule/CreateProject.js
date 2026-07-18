import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import DropDown from "../../../genriccomponents/FormDropDown";
import StepIndicator from "./StepIndicator";
import { ArrowRight, Loader2, Sparkles, X, CircleCheck } from "lucide-react";
import { showToast } from "../../../genriccomponents/techus-ToastNotification";
import TextWithTooltip from "../../Common/ToolTip";
import upgradImg from "../../../assets/Images/no_data_images/upgrade_1.webp";
import {
  GetTakeoffCategories,
  GetProjectById,
  SaveProject,
  GetUploadUrl,
  ConfirmUpload,
  StartAiAnalysis,
  UpdateStep,
  GetProjectDocuments,
  UpdateProject,
  DeleteProjectDocument,
} from "../../../services/techus-services";
import FullPageLoader from "../../../genriccomponents/loaders/FullPageLoader";
import ImageCropModal from "../../../genriccomponents/ImageUtils";
import CONFIG from "../../../config/config";
import { getDeviceInfo } from "../../../utils/getDeviceInfo";
import { useSelector } from "react-redux";
import NavigationHeader from "../../../genriccomponents/NavigationHeader";
import { capitalizeFirstLetter } from "../../../utils/commonUtils";
import { normalizeLabel } from "../../../utils/textUtils";

import RFPUploader from "../../../assets/Images/pdf_images/RFP_Uploader.webp";
import PLANUploader from "../../../assets/Images/pdf_images/PLAN_Uploader.webp";

// ── Constants ──────────────────────────────────────────────────────
const MAX_FILES = 15;
const MAX_FILE_SIZE = 110 * 1024 * 1024; // 100MB

// ── Helpers ────────────────────────────────────────────────────────
const getFileSize = (file) => {
  const bytes = file?.size ?? 0;
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

/** Parses a service response that may be raw JSON string or object */
const parseResponse = (res) => {
  let d = res?.data ?? res;
  if (typeof d === "string") d = JSON.parse(d);
  return d;
};

/** Builds the image payload for save/update calls */
const buildImagePayload = (imageChanged, croppedImage) => {
  if (!imageChanged) return {};
  if (croppedImage)
    return { image_name: `project_${Date.now()}.png`, imgsrc: croppedImage };
  return { image_delete: true, image_name: "", imgsrc: "" };
};

// ── AI Analysis Modal ──────────────────────────────────────────────
const AI_ITEMS = [
  "AI extracts key information from your RFP",
  "Risks and gaps are identified automatically",
  "You'll be notified when ready to review",
];

const AIAnalysisModal = React.memo(({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/40 tw-flex tw-items-center tw-justify-center tw-z-50">
      <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-md tw-mx-4 tw-overflow-hidden">
        <div className="tw-bg-[linear-gradient(119deg,_#2b7fff,_#0140c1)] tw-px-6 tw-pt-8 tw-pb-10 tw-text-center tw-relative">
          <button
            onClick={onClose}
            className="tw-absolute tw-top-4 tw-right-4 tw-text-white/70 hover:tw-text-white tw-transition"
          >
            <X className="tw-w-5 tw-h-5" />
          </button>
          <div className="tw-w-16 tw-h-16 tw-bg-white tw-rounded-2xl tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-4 tw-shadow-lg">
            <Sparkles className="tw-w-8 tw-h-8 tw-text-[#2b7fff]" />
          </div>
          <h2 className="tw-text-2xl tw-font-bold tw-text-white tw-mb-2">AI Analysis Started</h2>
          <p className="tw-text-sm tw-text-[#eff6ff] tw-font-normal">
            Your project documents are being analyzed by our AI.
            <br />
            This process typically takes 2–5 minutes depending
            <br />
            on the document size.
          </p>
        </div>
        <div className="tw-px-6 tw-py-6">
          <div className="tw-bg-[#f5f8ff] tw-border tw-border-[#4488ff] tw-rounded-md tw-p-4 tw-mb-6">
            <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
              <div className="tw-w-5 tw-h-5 tw-rounded-full tw-border-2 tw-border-[#4488ff] tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                <span className="tw-text-blue-500 tw-text-xs tw-font-bold">!</span>
              </div>
              <p className="tw-font-semibold tw-text-md">What happens next?</p>
            </div>
            <ul className="tw-list-disc tw-pl-12 tw-space-y-2">
              {AI_ITEMS.map((item) => (
                <li key={item} className="tw-text-sm">{item}</li>
              ))}
            </ul>
          </div>
          <button
            onClick={onConfirm}
            className="tw-w-full tw-bg-[#0140c1] tw-text-white tw-py-3 tw-rounded-md tw-flex tw-items-center tw-justify-center tw-gap-2 hover:tw-bg-blue-700 tw-transition"
          >
            <CircleCheck className="tw-w-5 tw-h-5" />
            Got it, Take Me to Projects
          </button>
        </div>
      </div>
    </div>
  );
});

// ── Upload Field ───────────────────────────────────────────────────
const isRfpTitle = (title) => title === "RFP Documents";

const UploadField = React.memo(({
  title,
  onUpload,
  onDrop,
  isDragOver,
  onDragOver,
  onDragLeave,
  error,
  disabled,
  uploadInfo,
  uploadLimit,
}) => {
  const isRfp = isRfpTitle(title);
  return (
    <div>
      <label className="tw-font-semibold tw-text-sm tw-text-gray-900 tw-block tw-mb-4">
        {title} <span className="tw-text-red-500">*</span>
      </label>

      <label
        className={`tw-h-[240px] tw-border-2 tw-border-dashed tw-rounded-lg tw-flex tw-flex-col tw-justify-center tw-items-center tw-cursor-pointer tw-transition-all tw-duration-200
          ${isDragOver ? "tw-bg-blue-50 tw-border-[#b6d3ff]" : "tw-border-[#b6d3ff] tw-bg-[#fafcff] hover:tw-bg-gray-50"}
          ${disabled || uploadInfo?.uploading ? "tw-pointer-events-none" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="tw-flex tw-w-full tw-flex-col tw-items-center tw-px-4">
          {uploadInfo?.uploading ? (
            <>
              <i className="icon-Budget-Estimate tw-text-[#2f69ff] tw-text-[60px] tw-mb-2" />
              {uploadInfo?.fileName && (
                <p className="tw-text-[13px] tw-font-normal tw-text-center tw-truncate tw-max-w-[280px]">
                  {uploadInfo.fileName}
                  {uploadInfo?.fileSize && (
                    <span className="tw-text-[#919191] tw-font-normal tw-ml-2 tw-text-[12px]">
                      ({uploadInfo.fileSize})
                    </span>
                  )}
                </p>
              )}
              <div className="tw-w-full tw-mt-4 tw-px-[40px]">
                <div className="tw-w-full tw-h-3 tw-bg-gray-200 tw-rounded-full tw-overflow-hidden">
                  <div
                    className="tw-h-full tw-rounded-full tw-bg-blue-500 tw-transition-all tw-duration-300"
                    style={{ width: `${uploadInfo.progress}%` }}
                  />
                </div>
                <p className="tw-text-xs tw-my-2 tw-text-gray-500">
                  Uploading... {uploadInfo.progress}%
                </p>
              </div>
            </>
          ) : (
            <>
              <img
                src={isRfp ? RFPUploader : PLANUploader}
                alt={isRfp ? "RFP Upload" : "Plan Upload"}
                className="tw-w-[54px] tw-h-[54px] tw-object-contain tw-mb-3"
              />
              <span className="tw-text-[18px] tw-font-bold tw-text-[#003577] tw-text-center">
                {isRfp ? "Upload your RFP PDF" : "Upload your Plan PDF"}
              </span>
             <span className="tw-text-xs tw-text-[#919191] tw-mt-1">
  {uploadLimit ? `Max ${uploadLimit} file${uploadLimit > 1 ? "s" : ""} • ` : ""}or Drag & Drop pdf file here
</span>
            </>
          )}
        </div>
        <input
          type="file"
           accept=".pdf,application/pdf"  
          multiple
          className="tw-hidden"
          onChange={onUpload}
          disabled={disabled && !uploadInfo?.uploading}
        />
      </label>

      {error && <p className="tw-text-red-500 tw-text-xs tw-mt-2">{error}</p>}
      <div className="tw-mt-3 tw-space-y-1">
        {[
          "PDF file type only allowed",
          isRfp ? "PDF file must contain RFP related details" : "Construction Specifications & Drawings PDF",
          "Max 100MB each",
        ].map((note) => (
          <p key={note} className="tw-text-xs tw-text-[#919191] tw-flex tw-items-center tw-gap-2">
            <span>•</span> {note}
          </p>
        ))}
      </div>
    </div>
  );
});

// ── Document Display ───────────────────────────────────────────────
const DocumentDisplay = React.memo(({ title, files = [], onDelete, deletingKeys = {} }) => {
  const confirmedFiles = files.filter((f) => f.confirmed);
  if (confirmedFiles.length === 0) return null;
  return (
    <div>
      <p className="tw-font-semibold tw-text-sm tw-text-gray-900 tw-mb-3">{title} Uploaded</p>
      <div className="tw-space-y-1">
        {confirmedFiles.map((entry) => {
          const isDeleting = !!deletingKeys[entry.tempKey];
          return (
            <div key={entry.tempKey} className="tw-border-b tw-rounded-lg tw-p-2">
              <div className="tw-flex tw-items-center tw-justify-between tw-gap-5">
                <div className="tw-flex tw-items-center tw-gap-2 tw-flex-1 tw-min-w-0">
                  <i className="icon-file tw-text-gray-400 tw-flex-shrink-0" />
                  <TextWithTooltip
                    text={entry.name}
                    width="250px"
                    className="tw-text-sm tw-text-[#000]"
                  />
                </div>
                <div className="tw-flex tw-items-center tw-gap-8">
                  <span className="tw-text-xs tw-text-[#919191] tw-whitespace-nowrap">
                    {entry.size || "—"}
                  </span>
                  <button
                    onClick={() => !isDeleting && onDelete(entry)}
                    disabled={isDeleting}
                    className="tw-text-gray-[#919191] hover:tw-text-red-500 tw-transition tw-flex tw-items-center tw-justify-center tw-w-5 tw-h-5"
                  >
                    {isDeleting ? (
                      <Loader2 className="tw-w-4 tw-h-4 tw-animate-spin tw-text-gray-400" />
                    ) : (
                      <i className="icon-Delete tw-text-[16px]" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── Main Component ─────────────────────────────────────────────────
export default function CreateProject() {
  const navigate = useNavigate();
  const { id: projectIdFromUrl = null } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const projectUuidFromQuery = searchParams.get("project_uuid");
  const incomingStatus = location.state?.projectStatus ?? null;

  // ── State ──────────────────────────────────────────────────────
  const [openCropModal, setOpenCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const imageInputRef = useRef(null);
  const imageChangedRef = useRef(false);

  const [formState, setFormState] = useState({
    projectName: "",
    category: "",
    description: "",
  });
  const [fileState, setFileState] = useState({ rfp_files: [], plan_files: [] });
  const [uiState, setUiState] = useState({
    step: 1,
    categories: [],
    isRfpDragOver: false,
    isPlanDragOver: false,
    showModal: false,
    analysisStarted: false,
  });
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [uploadState, setUploadState] = useState({ rfp: {}, plan: {} });
  const [savedProjectUuid, setSavedProjectUuid] = useState(null);
  const [errors, setErrors] = useState({});
  const [deletingKeys, setDeletingKeys] = useState({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
const [upgradeMessage, setUpgradeMessage] = useState("");

  // Add after const [deletingKeys, setDeletingKeys] = useState({});
const packageList = useSelector((s) => s?.auth?.user?.[0]?.package_info);

const rfpFileLimit = useMemo(() => {
  const count = packageList?.projects?.children?.proj_files?.children?.rfp_doc?.item_count ?? null;
  return count && count > 0 ? count : null;
}, [packageList]);

const planFileLimit = useMemo(() => {
  const count = packageList?.projects?.children?.proj_files?.children?.plan_doc?.item_count ?? null;
  return count && count > 0 ? count : null;
}, [packageList]);
  const [projectStatus, setProjectStatus] = useState(
    incomingStatus !== null ? Number(incomingStatus) : null,
  );

  const isPdfFile = (file) => {
  const validMime = file.type === "application/pdf";
  const validExt = file.name.toLowerCase().endsWith(".pdf");
  return validMime || validExt; // accept if either matches
};

  // ── Edit-mode flags ────────────────────────────────────────────
  const isEditMode = Boolean(projectIdFromUrl);
  const isUpdateOnlyMode = isEditMode && [1, 2, 3, 4].includes(projectStatus);

  const activeProjectUuid = savedProjectUuid || projectUuidFromQuery || projectIdFromUrl;

  // ── State updaters ─────────────────────────────────────────────
  const updateFormState = useCallback((u) => setFormState((p) => ({ ...p, ...u })), []);
  const updateUIState = useCallback((u) => setUiState((p) => ({ ...p, ...u })), []);
  const updateFileUploadState = useCallback(
    (type, key, u) =>
      setUploadState((p) => ({
        ...p,
        [type]: { ...p[type], [key]: { ...p[type][key], ...u } },
      })),
    [],
  );

  // ── Derived upload states ──────────────────────────────────────
  const rfpConfirmed = fileState.rfp_files.some((f) => f.confirmed);
  const planConfirmed = fileState.plan_files.some((f) => f.confirmed);
  const bothConfirmed = rfpConfirmed && planConfirmed;
  const anyConfirmed = rfpConfirmed || planConfirmed;
  const anyUploading = useMemo(
    () =>
      Object.values(uploadState.rfp).some((u) => u?.uploading) ||
      Object.values(uploadState.plan).some((u) => u?.uploading),
    [uploadState],
  );

  const getLastUploadInfo = useCallback(
    (type) => {
      const vals = Object.values(uploadState[type]);
      const uploading = vals.find((u) => u?.uploading);
      if (uploading) return uploading;
      return vals.at(-1) ?? { progress: 0, uploading: false, confirmed: false, error: null };
    },
    [uploadState],
  );

  const rfpUploadInfo = useMemo(() => getLastUploadInfo("rfp"), [getLastUploadInfo]);
  const planUploadInfo = useMemo(() => getLastUploadInfo("plan"), [getLastUploadInfo]);

  const showDocumentSection = rfpConfirmed || planConfirmed;

  const isStep1Valid = useMemo(
    () =>
      Boolean(
        formState.projectName.trim() &&
        formState.category.trim() &&
        formState.description.trim(),
      ),
    [formState],
  );

  // ── Effects ────────────────────────────────────────────────────
  useEffect(() => { loadDropdownData(); }, []);  

  useEffect(() => {
    if (projectIdFromUrl) loadProjectForEdit(projectIdFromUrl);
  }, [projectIdFromUrl]);  

  useEffect(() => {
    if (projectUuidFromQuery && !projectIdFromUrl) loadProjectForEdit(projectUuidFromQuery);
  }, [projectUuidFromQuery]);  

  // ── Load helpers ───────────────────────────────────────────────
  const loadDropdownData = useCallback(async () => {
    try {
      const d = parseResponse(await GetTakeoffCategories());
      if (!d?.valid) {
        showToast("error", d?.message);
        updateUIState({ categories: [] });
        return;
      }
      const normalized = (Array.isArray(d.data) ? d.data : []).map((c) =>
        normalizeLabel(c.takeoff_name),
      );
      const gcIdx = normalized.indexOf("General Contractor");
      if (gcIdx > 0) normalized.unshift(normalized.splice(gcIdx, 1)[0]);
      updateUIState({ categories: normalized });
    } catch (err) {
      console.error("ERROR LOADING CATEGORIES:", err);
      showToast("error", err.message);
      updateUIState({ categories: [] });
    }
  }, [updateUIState]);

  const loadProjectForEdit = useCallback(
    async (projectId) => {
      try {
        setIsEditLoading(true);
        const organization_uuid = localStorage.getItem("organization_uuid");

        const [projResponse, catResponse, docsResponse] = await Promise.all([
          GetProjectById({ organization_uuid, project_uuid: projectId }),
          GetTakeoffCategories(),
          GetProjectDocuments({
            organization_uuid,
            project_uuid: projectId,
            offset: 0,
            limit: 100,
            search: "",
            status: "",
          }),
        ]);

        const d = parseResponse(projResponse);
        if (!d?.valid) { showToast("error", d?.message); return; }

        const project = d.project || d.data;
        if (!project) { showToast("error", "Project data not found"); return; }

        const catData = parseResponse(catResponse);
        let resolvedCategory = "";
        if (catData?.valid && Array.isArray(catData.data)) {
          const found = catData.data.find((c) => c.takeoff_id === project.category_id);
          resolvedCategory = found ? normalizeLabel(found.takeoff_name) : "";
          updateUIState({ categories: catData.data.map((c) => normalizeLabel(c.takeoff_name)) });
        }

        const imageUrl = project?.project_image
          ? `${CONFIG.VITE_AWS_ENDPOINT}/project_images/${project.project_image}?v=${Date.now()}`
          : "";

        updateFormState({
          projectName: project.project_name || "",
          description: project.description || "",
          category: resolvedCategory,
        });
        setCroppedImage(imageUrl);

        const rawStatus = Number(project.status ?? project.project_status ?? 0);
        setProjectStatus(rawStatus);

        const docsList = docsResponse?.data?.documents || docsResponse?.documents || [];
        if (Array.isArray(docsList) && docsList.length > 0) {
          const buildEntries = (docs) =>
            docs.map((doc) => ({
              tempKey: doc.document_id,
              file_obj: null,
              name: doc.document_name || null,
              size: doc.size ? getFileSize({ size: doc.size }) : null,
              document_uuid: doc.document_id,
              confirmed: true,
            }));

          const rfpEntries = buildEntries(docsList.filter((d) => d.module_type === "RFP"));
          const planEntries = buildEntries(docsList.filter((d) => d.module_type === "PLAN"));

          if (rfpEntries.length > 0) {
            setFileState((p) => ({ ...p, rfp_files: rfpEntries }));
            rfpEntries.forEach((e) => updateFileUploadState("rfp", e.tempKey, { confirmed: true, progress: 100 }));
          }
          if (planEntries.length > 0) {
            setFileState((p) => ({ ...p, plan_files: planEntries }));
            planEntries.forEach((e) => updateFileUploadState("plan", e.tempKey, { confirmed: true, progress: 100 }));
          }
        }

        updateUIState({ step: rawStatus === 5 ? 2 : 1 });
      } catch (err) {
        console.error("ERROR LOADING PROJECT:", err);
        showToast("error", err.message);
      } finally {
        setIsEditLoading(false);
      }
    },
    [updateFormState, updateUIState, updateFileUploadState],
  );

  // ── Image handlers ─────────────────────────────────────────────
  const handleImageSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target.result);
      setOpenCropModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handleChangeImage = useCallback(() => imageInputRef.current?.click(), []);
  const handleImageDelete = useCallback(() => {
    setCroppedImage(null);
    imageChangedRef.current = true;
  }, []);
  const handleCropSave = useCallback((base64) => {
    setCroppedImage(base64);
    imageChangedRef.current = true;
    setOpenCropModal(false);
  }, []);

  // ── getCategoryId (fetches fresh from API) ─────────────────────
  const getCategoryId = useCallback(async () => {
    const d = parseResponse(await GetTakeoffCategories());
    if (d?.valid && Array.isArray(d.data)) {
      const found = d.data.find((c) => normalizeLabel(c.takeoff_name) === formState.category);
      return found?.takeoff_id || null;
    }
    return null;
  }, [formState.category]);

  // ── Single file upload ─────────────────────────────────────────
  const uploadSingleFile = useCallback(
    async (file, type, tempKey) => {
      const organization_uuid = localStorage.getItem("organization_uuid");
      const project_uuid = activeProjectUuid;
      const module_type = type === "rfp" ? "RFP" : "PLAN";

      if (!project_uuid) {
        showToast("error", "Project not saved yet. Please complete Step 1 first.");
        return;
      }

      try {
        updateFileUploadState(type, tempKey, {
          uploading: true,
          progress: 0,
          confirmed: false,
          error: null,
          fileName: file.name,
          fileSize: getFileSize(file),
        });

        const urlData = parseResponse(
          await GetUploadUrl({ organization_uuid, project_uuid, file_name: file.name, module_type }),
        );
        if (!urlData?.valid) throw new Error(urlData?.message || "Failed to get upload URL");

        const { document_uuid, upload_url } = urlData.data;

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", upload_url);
          xhr.setRequestHeader("Content-Type", "application/pdf");
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable)
              updateFileUploadState(type, tempKey, { progress: Math.round((e.loaded / e.total) * 90) });
          };
          xhr.onload = () =>
            xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Storage upload failed"));
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.send(file);
        });

        const confirmData = parseResponse(
          await ConfirmUpload({
            organization_uuid,
            project_uuid,
            document_uuid,
            original_file_name: file.name,
            file_size: file.size,
            module_type,
          }),
        );
        if (!confirmData?.valid) throw new Error(confirmData?.message || "Failed to confirm upload");

        const filesKey = type === "rfp" ? "rfp_files" : "plan_files";
        setFileState((p) => ({
          ...p,
          [filesKey]: p[filesKey].map((f) =>
            f.tempKey === tempKey ? { ...f, document_uuid, confirmed: true } : f,
          ),
        }));
        updateFileUploadState(type, tempKey, { uploading: false, confirmed: true, progress: 100 });
        showToast("success", confirmData.message);
      } catch (err) {
        console.error(`Upload error (${type}):`, err);
        showToast("error", err.message);
        updateFileUploadState(type, tempKey, { uploading: false, error: err.message, progress: 0 });
      }
    },
    [activeProjectUuid, updateFileUploadState],
  );

  // ── Shared multi-file handler factory ─────────────────────────
  // const makeFileHandler = useCallback(
  //   (type, errorKey) =>
  //     (incoming) => {
  //       const filesKey = type === "rfp" ? "rfp_files" : "plan_files";
  //       const label = type === "rfp" ? "RFP" : "Plan";
  //       const currentCount = fileState[filesKey].length;

  //       if (currentCount >= MAX_FILES) {
  //         showToast("error", `Maximum ${MAX_FILES} ${label} files allowed`);
  //         return;
  //       }
  //       const allowed = MAX_FILES - currentCount;
  //       if (incoming.length > allowed) {
  //         showToast("error", `You can only add ${allowed} more ${label} file${allowed > 1 ? "s" : ""}`);
  //         return;
  //       }

  //       incoming.forEach((file) => {
  //         if (file.size > MAX_FILE_SIZE) {
  //           showToast("error", `${file.name} exceeds 100MB limit`);
  //           return;
  //         }
  //         const tempKey = crypto.randomUUID();
  //         setFileState((p) => ({
  //           ...p,
  //           [filesKey]: [
  //             ...p[filesKey],
  //             { tempKey, file_obj: file, name: file.name, size: getFileSize(file), document_uuid: null, confirmed: false },
  //           ],
  //         }));
  //         setErrors((prev) => ({ ...prev, [errorKey]: "" }));
  //         uploadSingleFile(file, type, tempKey);
  //       });
  //     },
  //   [fileState, uploadSingleFile],
  // );

const makeFileHandler = useCallback(
  (type, errorKey) =>
    (incoming) => {
      const filesKey = type === "rfp" ? "rfp_files" : "plan_files";
      const label = type === "rfp" ? "RFP" : "Plan";
      const fileLimit = type === "rfp" ? rfpFileLimit : planFileLimit;
      const effectiveMax = fileLimit ?? MAX_FILES;

      const validFiles = incoming.filter(isPdfFile);
      if (validFiles.length < incoming.length) {
        showToast("error", "Only PDF files are allowed");
      }
      if (!validFiles.length) return;
      const currentCount = fileState[filesKey].length; 

    if (currentCount >= effectiveMax) {
  setUpgradeMessage(`Your current package allows up to ${effectiveMax} ${label} file${effectiveMax > 1 ? "s" : ""}. Upgrade your package to upload more.`);
  setShowUpgradeModal(true);
  return;
}
const allowed = effectiveMax - currentCount;
if (validFiles.length > allowed) {
  setUpgradeMessage(`Your current package allows up to ${effectiveMax} ${label} file${effectiveMax > 1 ? "s" : ""}. You can only add ${allowed} more. Upgrade your package to upload more.`);
  setShowUpgradeModal(true);
  return;
}

      validFiles.forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
          showToast("error", `${file.name} exceeds 100MB limit`);
          return;
        }
        const tempKey = crypto.randomUUID();
        setFileState((p) => ({
          ...p,
          [filesKey]: [
            ...p[filesKey],
            { tempKey, file_obj: file, name: file.name, size: getFileSize(file), document_uuid: null, confirmed: false },
          ],
        }));
        setErrors((prev) => ({ ...prev, [errorKey]: "" }));
        uploadSingleFile(file, type, tempKey);
      });
    },
 [fileState, uploadSingleFile, rfpFileLimit, planFileLimit, setShowUpgradeModal, setUpgradeMessage],
);

 const handleRfpUpload = useCallback(
  (e) => {
    const allFiles = Array.from(e.target.files || []);
    e.target.value = "";
    const files = allFiles.filter(isPdfFile);
    if (files.length < allFiles.length) {
      showToast("error", "Only PDF files are allowed");
    }
    if (!files.length) return;
    makeFileHandler("rfp", "rfp_file")(files);
  },
  [makeFileHandler],
);

const handlePlanUpload = useCallback(
  (e) => {
    const allFiles = Array.from(e.target.files || []);
    e.target.value = "";
    const files = allFiles.filter(isPdfFile);
    if (files.length < allFiles.length) {
      showToast("error", "Only PDF files are allowed");
    }
    if (!files.length) return;
    makeFileHandler("plan", "plan_file")(files);
  },
  [makeFileHandler],
);

  const makeDragDropHandler = useCallback(
  (type, dragKey, errorKey) => (e) => {
    e.preventDefault();
    updateUIState({ [dragKey]: false });

    const allFiles = Array.from(e.dataTransfer.files || []);
    const dropped = allFiles.filter(isPdfFile);  // ← use isPdfFile instead of checking type only

    if (allFiles.length > 0 && dropped.length === 0) {
      showToast("error", "Only PDF files are allowed");
      setErrors((prev) => ({ ...prev, [errorKey]: "Only PDF files are allowed" }));
      return;
    }
    if (dropped.length < allFiles.length) {
      showToast("error", "Some files were skipped — only PDF files are allowed");
    }

    const filesKey = type === "rfp" ? "rfp_files" : "plan_files";
    const label = type === "rfp" ? "RFP" : "Plan";
   const fileLimit = type === "rfp" ? rfpFileLimit : planFileLimit;
const effectiveMax = fileLimit ?? MAX_FILES;
const allowed = effectiveMax - fileState[filesKey].length;
if (fileState[filesKey].length >= effectiveMax) {
  setUpgradeMessage(`Your current package allows up to ${effectiveMax} ${label} file${effectiveMax > 1 ? "s" : ""}. Upgrade your package to upload more.`);
  setShowUpgradeModal(true);
  return;
}
const toUpload = dropped.slice(0, allowed);
    if (dropped.length > allowed) {
  setUpgradeMessage(`Your current package allows up to ${effectiveMax} ${label} file${effectiveMax > 1 ? "s" : ""}. Upgrade your package to upload more.`);
  setShowUpgradeModal(true);
}
    makeFileHandler(type, errorKey)(toUpload);
  },
[updateUIState, fileState, makeFileHandler, setShowUpgradeModal, setUpgradeMessage],
);
  const handleRfpDrop = useCallback(
    (e) => makeDragDropHandler("rfp", "isRfpDragOver", "rfp_file")(e),
    [makeDragDropHandler],
  );
  const handlePlanDrop = useCallback(
    (e) => makeDragDropHandler("plan", "isPlanDragOver", "plan_file")(e),
    [makeDragDropHandler],
  );

  // ── Delete file ────────────────────────────────────────────────
  const deleteFile = useCallback(
    async (entry, type) => {
      const organization_uuid = localStorage.getItem("organization_uuid");
      const filesKey = type === "rfp" ? "rfp_files" : "plan_files";
      const label = type === "rfp" ? "RFP" : "Plan";

      setDeletingKeys((p) => ({ ...p, [entry.tempKey]: true }));
      if (activeProjectUuid && entry.document_uuid) {
        try {
          await DeleteProjectDocument({
            organization_uuid,
            project_uuid: activeProjectUuid,
            document_uuid: entry.document_uuid,
            device_info: getDeviceInfo(),
          });
          showToast("success", `${label} document deleted`);
        } catch (err) {
          console.error(`Delete ${label} error:`, err);
          showToast("error", err.message);
          setDeletingKeys((p) => { const n = { ...p }; delete n[entry.tempKey]; return n; });
          return;
        }
      }
      setDeletingKeys((p) => { const n = { ...p }; delete n[entry.tempKey]; return n; });
      setFileState((p) => ({ ...p, [filesKey]: p[filesKey].filter((f) => f.tempKey !== entry.tempKey) }));
      setUploadState((p) => {
        const updated = { ...p[type] };
        delete updated[entry.tempKey];
        return { ...p, [type]: updated };
      });
    },
    [activeProjectUuid],
  );

  const deleteRfpFile = useCallback((entry) => deleteFile(entry, "rfp"), [deleteFile]);
  const deletePlanFile = useCallback((entry) => deleteFile(entry, "plan"), [deleteFile]);

  // ── Validation ─────────────────────────────────────────────────
 const validateField = useCallback((name, value) => {
  const trimmed = value?.trim?.() || "";
  
  // ── Convert camelCase to readable label e.g. projectName → Project Name ──
  const label = name
    .replace(/([A-Z])/g, ' $1')           // insert space before capitals
    .replace(/^./, (c) => c.toUpperCase()) // capitalize first letter
    .trim();

  if (!trimmed) return `${label} is required`;
  return "";
}, []);

  const validateStep1 = useCallback(() => {
    const newErr = {};
    if (!formState.projectName) newErr.projectName = "Project Name is required.";
    if (!formState.category) newErr.category = "Category is required.";
    if (!formState.description) newErr.description = "Description is required.";
    setErrors((prev) => ({ ...prev, ...newErr }));
    return Object.keys(newErr).length === 0;
  }, [formState]);

  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      const trimmed = value.trimStart();
      updateFormState({ [name]: trimmed });
      setErrors((prev) => ({ ...prev, [name]: validateField(name, trimmed) }));
    },
    [updateFormState, validateField],
  );

  const handleBlur = useCallback(
    (e) => {
      const { name, value } = e.target;
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    },
    [validateField],
  );

  const handleCategoryChange = useCallback(
    (val) => {
      updateFormState({ category: val || "" });
      setErrors((prev) => ({ ...prev, category: validateField("category", val) }));
    },
    [updateFormState, validateField],
  );

  // ── Shared save/update payload builder ────────────────────────
  const buildProjectPayload = useCallback(
    (categoryId, organization_uuid) => ({
      organization_uuid,
      project_name: formState.projectName,
      category_id: categoryId,
      description: formState.description,
      ...buildImagePayload(imageChangedRef.current, croppedImage),
    }),
    [formState, croppedImage],
  );

  // ── Save & Continue (step 1 → step 2) ─────────────────────────
  const handleContinue = useCallback(async () => {
    if (uiState.step !== 1 || !validateStep1()) return;
    try {
      setIsPageLoading(true);
      const categoryId = await getCategoryId();
      if (!categoryId) { showToast("error", "Selected category not found"); return; }
      const organization_uuid = localStorage.getItem("organization_uuid");
      if (!organization_uuid) { showToast("error", "Organization UUID not found. Please login again."); return; }

      const payload = buildProjectPayload(categoryId, organization_uuid);
      let response;
      if (activeProjectUuid) {
        response = await UpdateProject({ ...payload, project_uuid: activeProjectUuid });
      } else {
        response = await SaveProject({
          ...payload,
          image_name: croppedImage ? `project_${Date.now()}.png` : "",
          imgsrc: croppedImage || "",
        });
      }

      const d = parseResponse(response);
      if (d?.valid) {
        const newProjectUuid = d.data?.project_uuid || d.project_uuid;
        if (newProjectUuid) {
          setSavedProjectUuid(newProjectUuid);
          setSearchParams({ project_uuid: newProjectUuid });
        }
        updateUIState({ step: 2 });
      } else {
        showToast("error", d?.message);
      }
    } catch (err) {
      console.error("ERROR SAVING PROJECT:", err);
      showToast("error", err.message);
    } finally {
      setIsPageLoading(false);
    }
  }, [uiState.step, validateStep1, getCategoryId, buildProjectPayload, activeProjectUuid, croppedImage, updateUIState, setSearchParams]);

  // ── Update (in-progress edit) ──────────────────────────────────
  const handleUpdate = useCallback(async () => {
    if (!validateStep1()) return;
    try {
      setIsPageLoading(true);
      const categoryId = await getCategoryId();
      if (!categoryId) { showToast("error", "Selected category not found"); return; }
      const organization_uuid = localStorage.getItem("organization_uuid");
      const d = parseResponse(
        await UpdateProject({
          ...buildProjectPayload(categoryId, organization_uuid),
          project_uuid: activeProjectUuid,
        }),
      );
      if (d?.valid) {
        showToast("success", d.message);
        setTimeout(() => navigate("/projects"), 1000);
      } else {
        showToast("error", d?.message);
      }
    } catch (err) {
      console.error("ERROR UPDATING PROJECT:", err);
      showToast("error", err.message);
    } finally {
      setIsPageLoading(false);
    }
  }, [validateStep1, getCategoryId, buildProjectPayload, activeProjectUuid, navigate]);

  // ── Save as Draft (step 1) ─────────────────────────────────────
  const handleSaveAsDraftStep1 = useCallback(async () => {
    if (!validateStep1()) return;
    try {
      setIsPageLoading(true);
      const categoryId = await getCategoryId();
      if (!categoryId) { showToast("error", "Selected category not found"); return; }
      const organization_uuid = localStorage.getItem("organization_uuid");
      const payload = buildProjectPayload(categoryId, organization_uuid);
      const response = activeProjectUuid
        ? await UpdateProject({ ...payload, project_uuid: activeProjectUuid })
        : await SaveProject({
            ...payload,
            image_name: croppedImage ? `project_${Date.now()}.png` : "",
            imgsrc: croppedImage || "",
          });
      const d = parseResponse(response);
      if (d?.valid) {
        showToast("success", d.message);
        setTimeout(() => navigate("/projects"), 1000);
      } else {
        showToast("error", d.message);
      }
    } catch (err) {
      console.error("ERROR SAVING DRAFT:", err);
      showToast("error", err.message);
    } finally {
      setIsPageLoading(false);
    }
  }, [validateStep1, getCategoryId, buildProjectPayload, activeProjectUuid, croppedImage, navigate]);

  // ── Save as Draft (step 2) ─────────────────────────────────────
  const handleSaveAsDraft = useCallback(async () => {
    if (!activeProjectUuid) { showToast("error", "Project UUID not found"); return; }
    try {
      setIsPageLoading(true);
      const organization_uuid = localStorage.getItem("organization_uuid");
      const d = parseResponse(await UpdateStep({ organization_uuid, project_uuid: activeProjectUuid }));
      if (d?.valid) {
        showToast("success", d.message);
        setTimeout(() => navigate("/projects"), 1500);
      } else {
        showToast("error", d.message);
      }
    } catch (err) {
      console.error("ERROR SAVING DRAFT:", err);
      showToast("error", err.message);
    } finally {
      setIsPageLoading(false);
    }
  }, [activeProjectUuid, navigate]);

  // ── Start AI Analysis ──────────────────────────────────────────
  const handleStartAnalysis = useCallback(async () => {
    if (!activeProjectUuid) { showToast("error", "Project UUID not found"); return; }
    try {
      setIsPageLoading(true);
      const organization_uuid = localStorage.getItem("organization_uuid");
      const d = parseResponse(
        await StartAiAnalysis({ organization_uuid, project_uuid: activeProjectUuid }),
      );
      if (d?.valid) updateUIState({ showModal: true });
      else showToast("error", d?.message);
    } catch (err) {
      console.error("ERROR STARTING AI ANALYSIS:", err);
      showToast("error", err.message);
    } finally {
      setIsPageLoading(false);
    }
  }, [activeProjectUuid, updateUIState]);

  const handleModalClose = useCallback(
    () => updateUIState({ showModal: false, analysisStarted: true }),
    [updateUIState],
  );
  const handleModalConfirm = useCallback(() => {
    updateUIState({ showModal: false, analysisStarted: true });
    navigate("/projects");
  }, [updateUIState, navigate]);

  // ── Drag event helpers (stable refs) ──────────────────────────
  const onRfpDragOver = useCallback((e) => { e.preventDefault(); updateUIState({ isRfpDragOver: true }); }, [updateUIState]);
  const onRfpDragLeave = useCallback(() => updateUIState({ isRfpDragOver: false }), [updateUIState]);
  const onPlanDragOver = useCallback((e) => { e.preventDefault(); updateUIState({ isPlanDragOver: true }); }, [updateUIState]);
  const onPlanDragLeave = useCallback(() => updateUIState({ isPlanDragOver: false }), [updateUIState]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      <div className="tw-max-w-full tw-mx-auto tw-py-2 tw-space-y-3">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="tw-hidden"
          onChange={handleImageSelect}
        />

        {(isPageLoading || isEditLoading) && <FullPageLoader />}

        <div className="tw-mb-2">
          <NavigationHeader
            title="Projects /"
            subTitle={projectIdFromUrl ? "Edit Project" : "Create New Project"}
            navigation="/projects"
          />
        </div>

        <div className="tw-w-full tw-flex tw-justify-center tw-mt-8 tw-mb-6">
          <StepIndicator step={uiState.step} />
        </div>

        <div className="tw-flex tw-flex-col tw-gap-6 tw-pl-14">
          {/* ── STEP 1 ── */}
          {uiState.step === 1 && (
            <div className="tw-bg-white tw-rounded-[10px] tw-shadow-sm tw-p-6 tw-space-y-4">
              <div className="tw-mb-6">
                <p className="tw-text-[18px] tw-font-[600] tw-tracking-[0.31px] tw-text-[#121212E0] tw-mb-1">
                  Project Details
                </p>
                <p className="tw-text-[14px] tw-text-[#999]">
                  Enter the basic information about your project. Fields marked with * are required.
                </p>
              </div>

              <div className="tw-grid tw-grid-cols-[260px_minmax(0,1fr)] tw-gap-8 tw-items-start">
                {/* Image Upload */}
                <div className="tw-flex tw-flex-col tw-items-center">
                  <label className="tw-w-full tw-text-[#3b3b3b] tw-text-[14px] tw-mb-2 tw-ml-7 tw-text-left">
                    Project Image
                  </label>
                  <div className="tw-w-[220px] tw-h-[220px] tw-border tw-border-gray-300 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-bg-white tw-overflow-hidden tw-relative tw-group tw-shrink-0">
                    {croppedImage ? (
                      <>
                        <img
                          src={croppedImage}
                          alt="Project"
                          onClick={handleChangeImage}
                          className="tw-w-full tw-h-full tw-object-cover tw-cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={handleImageDelete}
                          className="tw-absolute tw-top-2 tw-right-2 tw-bg-gray-700/80 tw-text-white tw-rounded-full tw-p-1 tw-opacity-0 group-hover:tw-opacity-100 tw-transition-all tw-duration-200"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <label
                        className="tw-w-full tw-h-full tw-cursor-pointer tw-flex tw-flex-col tw-items-center tw-justify-center hover:tw-bg-gray-50 tw-transition-all tw-duration-200"
                        onClick={handleChangeImage}
                      >
                        <i className="icon-upload tw-text-gray-400 tw-text-3xl tw-mb-2" />
                        <span className="tw-text-gray-500 tw-text-sm">Upload Image</span>
                      </label>
                    )}
                  </div>
                  <div className="tw-w-[220px] tw-flex tw-justify-center">
                    <label
                      onClick={handleChangeImage}
                      className="tw-cursor-pointer tw-bg-white tw-border tw-border-[#003577] tw-text-[#003577] hover:tw-bg-[#0140c1] hover:tw-text-white hover:tw-border-[#0140c1] tw-px-3 tw-py-2 tw-rounded-md tw-transition-all tw-duration-300 tw-text-sm tw-w-full tw-text-center tw-mt-3 tw-block"
                    >
                      {croppedImage ? "Change Image" : "Upload Image"}
                    </label>
                  </div>
                  <p className="tw-text-[10px] tw-text-[#999] tw-mt-3 tw-text-center tw-w-[220px]">
                    Recommended: square image, 400×400px or larger
                  </p>
                </div>

                {/* Form Fields */}
                <div className="tw-space-y-4 tw-min-w-0">
                  <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                    <div className="tw-flex tw-flex-col tw-gap-2">
                      <label className="tw-text-sm tw-text-[#3b3b3b] tw-block">
                        Project Name <span className="tw-text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="projectName"
                        value={capitalizeFirstLetter(formState.projectName)}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="Enter Project Name"
                        className={`tw-w-full tw-border tw-text-[15px] tw-rounded-[5px] tw-py-[7px] tw-px-3 tw-text-sm tw-outline-none tw-transition-all tw-duration-200
                          ${errors.projectName
                            ? "tw-border-red-500 focus:tw-ring-1 focus:tw-ring-red-500"
                            : "tw-border-[#e0e0e0] focus:tw-border-[#0140c1] focus:tw-ring-1 focus:tw-ring-[#0140c1]"
                          }`}
                      />
                      {errors.projectName && (
                        <p className="tw-text-red-500 tw-text-xs tw-mt-1">{errors.projectName}</p>
                      )}
                    </div>

                    <div className="tw-flex tw-flex-col tw-mt-0.5">
                      <label className="tw-text-[#3b3b3b] tw-text-sm">
                        Category <span className="tw-text-red-500">*</span>
                      </label>
                      <div className="tw-h-10">
                        <DropDown
                          options={uiState.categories}
                          placeholder="Select Category"
                          value={formState.category}
                          onChange={handleCategoryChange}
                        />
                      </div>
                      {errors.category && (
                        <p className="tw-text-red-500 tw-text-xs tw-mt-1">{errors.category}</p>
                      )}
                    </div>
                  </div>

                  <div className="tw-flex tw-flex-col tw-gap-2">
                    <label className="tw-text-sm tw-text-[#3b3b3b]">
                      Project Description <span className="tw-text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      rows={4}
                      value={capitalizeFirstLetter(formState.description)}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="This is about the project description"
                      className={`tw-w-full tw-h-[220px] tw-border tw-rounded-md tw-px-3 tw-py-2 tw-text-sm tw-outline-none tw-transition-all tw-duration-200 tw-resize-none
                        ${errors.description
                          ? "tw-border-red-500 focus:tw-ring-1 focus:tw-ring-red-500"
                          : "tw-border-[#e0e0e0] focus:tw-border-[#0140c1] focus:tw-ring-1 focus:tw-ring-[#0140c1]"
                        }`}
                    />
                    {errors.description && (
                      <p className="tw-text-red-500 tw-text-xs tw-mt-1">{errors.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {uiState.step === 2 && (
            <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-space-y-6">
              <div className="tw-mb-4">
                <p className="tw-text-[18px] tw-font-[600] tw-tracking-[0.31px] tw-text-gray-900 tw-mb-1">
                  Upload Documents
                </p>
                <p className="tw-text-[14px] tw-text-[#999]">
                  Upload your RFP and Plan documents for AI analysis. Both document types are required to start analysis.
                </p>
              </div>

              <div className="tw-grid tw-grid-cols-2 tw-gap-8">
                <UploadField
                  title="RFP Documents"
                  uploadLimit={rfpFileLimit}
                  fileObj={fileState.rfp_files.find((f) => f.file_obj)?.file_obj || null}
                  existingName={fileState.rfp_files.find((f) => f.confirmed && !f.file_obj)?.name || null}
                  onUpload={handleRfpUpload}
                  onDrop={handleRfpDrop}
                  isDragOver={uiState.isRfpDragOver}
                  onDragOver={onRfpDragOver}
                  onDragLeave={onRfpDragLeave}
                  error={errors.rfp_file}
                  disabled={uiState.analysisStarted}
                  uploadInfo={rfpUploadInfo}
                />
                <UploadField
                  title="Plan Documents"
                   uploadLimit={planFileLimit}
                  fileObj={fileState.plan_files.find((f) => f.file_obj)?.file_obj || null}
                  existingName={fileState.plan_files.find((f) => f.confirmed && !f.file_obj)?.name || null}
                  onUpload={handlePlanUpload}
                  onDrop={handlePlanDrop}
                  isDragOver={uiState.isPlanDragOver}
                  onDragOver={onPlanDragOver}
                  onDragLeave={onPlanDragLeave}
                  error={errors.plan_file}
                  disabled={uiState.analysisStarted}
                  uploadInfo={planUploadInfo}
                />
              </div>

              {showDocumentSection && (
                <div className="tw-grid tw-grid-cols-2 tw-gap-8 tw-pt-6 tw-border-t tw-border-gray-200">
                  <div className="tw-min-w-[50%]">
                    <DocumentDisplay
                      title="RFP Documents"
                      files={fileState.rfp_files}
                      onDelete={deleteRfpFile}
                      deletingKeys={deletingKeys}
                    />
                  </div>
                  <div className="tw-min-w-[50%]">
                    <DocumentDisplay
                      title="Plan Documents"
                      files={fileState.plan_files}
                      onDelete={deletePlanFile}
                      deletingKeys={deletingKeys}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── FOOTER ── */}
          <div className="tw-flex tw-justify-between tw-items-center">
            {/* LEFT: Back + Save as Draft */}
            <div className="tw-flex tw-gap-3">
              {uiState.step === 2 && !isUpdateOnlyMode && (
                <button
                  onClick={() => updateUIState({ step: 1 })}
                  className="tw-w-[160px] tw-text-gray-700 tw-bg-[#dedede] tw-text-center tw-px-4 tw-py-2 tw-rounded-[8px] tw-font-medium tw-flex tw-gap-4 tw-items-center hover:tw-bg-gray-400 tw-transition-all"
                >
                  <i className="icon-Back" />
                  <span className="tw-self-center tw-pl-4">Back</span>
                </button>
              )}

              {!isUpdateOnlyMode && (
                uiState.step === 1 ? (
                  <button
                    onClick={handleSaveAsDraftStep1}
                    disabled={!isStep1Valid}
                    className={`tw-px-6 tw-py-2 tw-rounded-[8px] tw-font-medium tw-transition-all
                      ${isStep1Valid
                        ? "tw-bg-white tw-text-[#1e293b] hover:tw-bg-gray-50"
                        : "tw-bg-white tw-text-gray-400 tw-cursor-not-allowed tw-opacity-50"
                      }`}
                  >
                    Save as Draft
                  </button>
                ) : (
                  <button
                    onClick={handleSaveAsDraft}
                    disabled={!anyConfirmed || anyUploading || uiState.analysisStarted}
                    className={`tw-px-6 tw-py-2 tw-rounded-md tw-font-medium tw-transition-all
                      ${anyConfirmed && !anyUploading && !uiState.analysisStarted
                        ? "tw-bg-white tw-text-gray-700 hover:tw-bg-gray-50"
                        : "tw-bg-white tw-text-gray-400 tw-cursor-not-allowed tw-opacity-50"
                      }`}
                  >
                    Save as Draft
                  </button>
                )
              )}
            </div>

            {/* RIGHT: context-aware primary action */}
            <div>
              {uiState.step === 1 ? (
                isUpdateOnlyMode ? (
                  <button
                    onClick={handleUpdate}
                    disabled={!isStep1Valid}
                    className={`tw-px-6 tw-py-2 tw-rounded-md tw-font-medium tw-flex tw-items-center tw-gap-2 tw-transition-all
                      ${isStep1Valid
                        ? "tw-bg-[#0140c1] tw-text-white hover:tw-bg-blue-700"
                        : "tw-bg-blue-600 tw-opacity-50 tw-text-white tw-cursor-not-allowed"
                      }`}
                  >
                    Update
                  </button>
                ) : (
                  <button
                    onClick={handleContinue}
                    disabled={!isStep1Valid}
                    className={`tw-px-6 tw-py-2 tw-rounded-md tw-font-medium tw-flex tw-items-center tw-gap-2 tw-transition-all
                      ${isStep1Valid
                        ? "tw-bg-[#0140c1] tw-text-white hover:tw-bg-[#506adf] tw-cursor-pointer"
                        : "tw-bg-[#f0f0f0] !tw-text-[#a0a0a0] tw-border tw-cursor-not-allowed"
                      }`}
                  >
                    {projectIdFromUrl ? "Update & Continue" : "Save & Continue"}
                    <ArrowRight size={18} />
                  </button>
                )
              ) : (
                <button
                  onClick={handleStartAnalysis}
                  disabled={!bothConfirmed || uiState.analysisStarted}
                  className={`tw-pl-4 tw-pr-6 tw-py-[9px] tw-rounded-[5px] tw-font-medium tw-flex tw-items-center tw-gap-3 tw-transition-all
                    ${bothConfirmed && !uiState.analysisStarted
                      ? "tw-bg-[#0140c1] tw-text-white hover:tw-bg-blue-700"
                      : "tw-bg-blue-600 tw-opacity-50 tw-text-white tw-cursor-not-allowed"
                    }`}
                >
                  <i className="icon-AI-fill tw-text-[23px]" />
                  {uiState.analysisStarted ? "Analysis Started" : "Start AI Analysis"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <AIAnalysisModal
        isOpen={uiState.showModal}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
      />

      {openCropModal && (
        <ImageCropModal
          imageSrc={imageSrc}
          onClose={() => setOpenCropModal(false)}
          onSave={handleCropSave}
        />

      )}

      {showUpgradeModal && (
  <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-z-[9999] tw-flex tw-items-center tw-justify-center">
    <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-[750px] tw-h-[569px] tw-px-[74px] tw-pt-[69px] tw-pb-10 tw-relative tw-text-center">
      <button
        onClick={() => setShowUpgradeModal(false)}
        className="tw-absolute tw-top-4 tw-right-4 tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-gray-200 tw-text-gray-400 hover:tw-text-gray-600 hover:tw-bg-gray-50 tw-transition-colors"
      >
        <i className="icon-Close tw-text-[14px]"></i>
      </button>
      <h2 className="tw-text-[30px] tw-font-bold tw-text-[#000000] tw-mb-8 tw-leading-snug">
        Unlock More with an Upgrade!
      </h2>
      <div className="tw-flex tw-justify-center tw-mb-4">
        <div className="tw-relative tw-w-[200px] tw-h-[175px] tw-flex tw-items-center tw-justify-center">
          <div className="tw-flex tw-justify-center tw-mb-6">
            <img
              src={upgradImg}
              alt="Upgrade"
              className="tw-w-36 tw-h-36 tw-object-contain"
            />
          </div>
        </div>
      </div>
      <p className="tw-text-[18px] tw-text-black tw-mb-8 tw-leading-normal tw-px-2">
        {upgradeMessage}
      </p>
      <button
        onClick={() => setShowUpgradeModal(false)}
        className="tw-w-[318px] tw-h-[48px] tw-py-3 tw-rounded-xl tw-text-white tw-text-[16px] tw-font-medium tw-transition-all tw-duration-200 hover:tw-opacity-90 hover:tw-shadow-lg"
        style={{ background: "#0140c1" }}
      >
        Upgrade Your Package
      </button>
    </div>
  </div>
)}
    </>
  );
}