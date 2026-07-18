import React from 'react';
import { useState, useEffect } from "react";
import { Check, FileText, Image, Users, Briefcase, Award, Shield, FolderOpen } from "lucide-react";
import { GetProposalDrafterCompanyDoc } from '../../../../services/techus-services';
import FullPageLoader from '../../../../genriccomponents/loaders/FullPageLoader';
import { useNavigate, useLocation } from "react-router-dom";
import usePermissions from '../../../Common/usePermissions';

const TYPE_ICON_MAP = {
  proposal_drafting: FileText,
  logo: Image,
  employees_list: Users,
  employees_resumes: Briefcase,
  certifications: Award,
  insurance: Shield,
  past_projects: FolderOpen,
};

function formatSize(bytes) {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

export const getCompanyDocs = async (payload = {}) => {
  try {
    const organization_uuid = localStorage.getItem("organization_uuid");
    if (!organization_uuid) {
      console.error("Organization UUID is missing in localStorage");
      return null;
    }
    const raw = await GetProposalDrafterCompanyDoc({ ...payload, organization_uuid });
    const response = typeof raw === "string" ? JSON.parse(raw) : raw;
    console.log("🔍 Raw API response →", JSON.stringify(response, null, 2));
    return response?.valid ? response : null;
  } catch (error) {
    console.error("Error fetching Company Docs:", error);
    return null;
  }
};

export default function CompanyKnowledge({
  onDocsStatus,
  onSelectionChange,
  initialSelectedIds = [],
  selectionError = "",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [docs, setDocs] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

   const {permissions,packagePermissions}=usePermissions('company_knowledge_management','org_kb');
   console.log(permissions)
   console.log(packagePermissions)


  const FORCE_EMPTY_FOR_TEST = false;

  const updateSelection = (nextSelectedIds) => {
    setSelectedIds(nextSelectedIds);
    onSelectionChange?.(nextSelectedIds);
  };

  const handleToggle = (docId) => {
    const nextSelectedIds = selectedIds.includes(docId)
      ? selectedIds.filter((id) => id !== docId)
      : [...selectedIds, docId];

    updateSelection(nextSelectedIds);
  };


useEffect(() => {
  console.log("Selected company_doc_ids payload →", selectedIds);
}, [selectedIds]);


  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getCompanyDocs({})
      .then((res) => {
        if (cancelled) return;
        if (res?.valid) {
          if (FORCE_EMPTY_FOR_TEST) {
            setDocs([]);
            updateSelection([]);
            onDocsStatus?.(false);           // ← report no docs
          } else {
const filteredDocs = res.data.filter((doc) => doc.type === "proposal_drafting" && doc.status === 3);
setDocs(filteredDocs);
const toSelect = initialSelectedIds.length > 0
  ? initialSelectedIds
  : filteredDocs.map((doc) => doc.file_id);
updateSelection(toSelect);
onDocsStatus?.(filteredDocs.length > 0);
          }
        } else {
          setError(res?.message || "Failed to fetch documents.");
          onDocsStatus?.(false);               // ← report no docs on error
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "An error occurred.");
          onDocsStatus?.(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const isEmpty = !loading && !error && docs.length === 0;
  const hasDocs = !loading && !error && docs.length > 0;

  return (
    <div className="tw-px-12 tw-pt-2">
      <div className="tw-mx-auto tw-bg-white tw-rounded-xl tw-shadow-sm tw-p-10">

        {/* Header */}
        <div className="tw-text-center tw-mb-8">
          <div className="tw-flex tw-justify-center tw-mb-4">
            <div className="tw-p-3 tw-rounded-xl tw-border-2 tw-border-blue-600">
              <i className="icon-Concrete tw-text-blue-600 tw-text-[30px]" />
            </div>
          </div>
          <h2 className="tw-text-xl tw-font-bold tw-text-gray-900">Company Knowledge</h2>
          <p className="tw-text-gray-500 tw-text-sm tw-mt-1">
            {hasDocs
              ? "Select company documents to personalize your proposal."
              : "Please upload documents to personalize your proposal."}
          </p>
        </div>

        {loading && <FullPageLoader />}

        {/* Error */}
        {error && (
          <div className="tw-border tw-border-red-200 tw-bg-red-50 tw-rounded-xl tw-p-6 tw-text-center tw-text-red-600 tw-text-sm">
            {error}
          </div>
        )}

        {/* Empty State */}
        {isEmpty && (
          <div className="tw-border-2 tw-border-dashed tw-border-gray-300 tw-rounded-2xl tw-p-16 tw-text-center">
            <div className="tw-flex tw-justify-center tw-mb-4">
              <FolderOpen className="tw-text-gray-300" size={40} />
            </div>
            <h3 className="tw-text-lg tw-font-bold tw-text-gray-900">No Documents Found</h3>
            <p className="tw-text-gray-500 tw-text-sm tw-mt-2">
              Please{" "}
              <button
                onClick={() => {
                  const isAdmin = location.pathname.startsWith('/admin');
                  const destinationPath = isAdmin ? '/admin/knowledge-base' : '/knowledge-base';
                  navigate(destinationPath, { state: { activeTab: 'Proposal Drafter' } });
                }}
                className="tw-text-blue-600 tw-underline tw-font-medium hover:tw-text-blue-700"
              >
                Click Here
              </button>{" "}
              to go to the Company Knowledge Management section to upload the documents.
            </p>
          </div>
        )}

        {/* Document List */}
        {hasDocs && (
          <div>
            <div className="tw-flex tw-items-center tw-justify-between">
              <h4 className="tw-text-sm tw-font-bold tw-text-gray-900 tw-mb-2">Select Document(s)</h4>
              {/* <span className="tw-text-xs tw-text-gray-400">
                {selectedIds.length} of {docs.length} selected
              </span> */}
            </div>
            {selectionError && (
              <div className="tw-mb-3">
                <span className="tw-text-[12px] tw-text-red-500">{selectionError}</span>
              </div>
            )}
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
              {docs.map((doc, idx) => {
                const Icon = TYPE_ICON_MAP[doc.type] || FileText;
                return (
                 <div
  key={idx}
 onClick={() => handleToggle(doc.file_id)}
  className="tw-flex tw-items-center tw-gap-4 tw-p-4 tw-rounded-lg tw-border tw-cursor-pointer tw-transition-all
    tw-bg-blue-50 tw-border-blue-300 hover:tw-bg-blue-100"
>
                  <div
  className={`tw-w-5 tw-h-5 tw-rounded tw-border tw-flex tw-items-center tw-justify-center
    ${selectedIds.includes(doc.file_id)
  ? "tw-bg-blue-600 tw-border-blue-600"
  : "tw-bg-white tw-border-gray-400"
}`}
>
{selectedIds.includes(doc.file_id) && (
    <Check size={12} className="tw-text-white" strokeWidth={4} />
  )}
</div>
                    <Icon className="tw-text-blue-500 tw-flex-shrink-0" size={22} />
                    <div className="tw-flex-1 tw-min-w-0">
                      <p className="tw-text-sm tw-font-medium tw-text-gray-700 tw-truncate">{doc.filename}</p>
                      <p className="tw-text-xs tw-text-gray-400 tw-mt-0.5">
                        {formatSize(doc.size)} · Uploaded by {doc.uploaded_by} · {new Date(doc.uploaded_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
