

import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import HeaderSection from "./PreviewHeader";
import ProposalSectionItem from "./ProposalCollapse";
import { ProposalDrafterView, GetProposalDrafterDetail } from '../../../../services/techus-services';
import { showToast } from '../../../../genriccomponents/techus-ToastNotification';
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";


export default function ProposalPreview() {
  const location          = useLocation();
  const templateFromState = location.state?.templateName || "modern_blue";
  const { drafter_uuid }  = useParams();

  const sectionsFromState = location.state?.sections || [];
  const getProposalName = (...sources) => {
    for (const source of sources) {
      if (!source || typeof source !== "object") continue;

      const candidates = [
        source.proposal_name,
        source.proposalName,
        source.proposal_title,
        source.proposalTitle,
        source.title,
        source.name,
      ];

      const resolved = candidates.find(
        (value) => typeof value === "string" && value.trim()
      );

      if (resolved) return resolved.trim();
    }

    return "Proposal";
  };

  const parsePositiveNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  const getPageCount = (...sources) => {
    const PAGE_KEYS = new Set([
      "n_pages",
      "page_count",
      "total_pages",
      "pages",
      "nPages",
      "pageCount",
      "totalPages",
    ]);

    const seen = new WeakSet();

    const findPageCount = (value) => {
      if (value == null) return 0;

      if (Array.isArray(value)) {
        for (const item of value) {
          const found = findPageCount(item);
          if (found > 0) return found;
        }
        return 0;
      }

      if (typeof value !== "object") return 0;
      if (seen.has(value)) return 0;
      seen.add(value);

      for (const key of PAGE_KEYS) {
        const found = parsePositiveNumber(value?.[key]);
        if (found > 0) return found;
      }

      for (const nestedValue of Object.values(value)) {
        if (!nestedValue || typeof nestedValue !== "object") continue;
        const found = findPageCount(nestedValue);
        if (found > 0) return found;
      }

      return 0;
    };

    for (const source of sources) {
      const found = findPageCount(source);
      if (found > 0) return found;
    }

    return 0;
  };

  const nPagesFromLocalBackup = Number(localStorage.getItem(`proposal_npages_${drafter_uuid}`)) || 0;
  const nPagesFromRouteState = parsePositiveNumber(location.state?.nPages);

const nPagesFromState = getPageCount(
  nPagesFromRouteState,
  location.state?.rowData,
  location.state,
  nPagesFromLocalBackup
);

  const [nPages, setNPages]                     = useState(nPagesFromState);
  const [errorMsg, setErrorMsg]                 = useState("");
  const [encryptedId, setEncryptedId]           = useState(null);
  const [editedSections, setEditedSections]     = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(
  location.state?.templateName || "modern_blue"
);
  const [proposalName, setProposalName]         = useState(() =>
    getProposalName(location.state?.rowData, location.state?.drafterData, location.state)
  );
  const [isInitialLoading, setIsInitialLoading] = useState(false);

const [sections, setSections] = useState(
  sectionsFromState.map(item =>
    typeof item === "string"
      ? { title: item, content: "", loaded: false, generating: false }
      : {
          title: item.title || "",
          content: item.content || "",
          loaded: item.loaded ?? false,
          generating: item.generating ?? false,
        }
  )
);

  useEffect(() => {
    if (drafter_uuid) initFetch(drafter_uuid);
  }, [drafter_uuid]);

  useEffect(() => {
    if (templateFromState) setSelectedTemplate(templateFromState);
  }, [templateFromState]);

 const parseSavedContent = (rawContent) => {
  if (!rawContent) return {};

  if (typeof rawContent === "string") {
    try {
      const parsed = JSON.parse(rawContent);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (e) {
      console.error("Failed to parse saved content:", e);
      return {};
    }
  }

  return typeof rawContent === "object" && !Array.isArray(rawContent) ? rawContent : {};
 };

 const initFetch = async (uuid) => {
  setIsInitialLoading(true);
  try {
    const detailRaw = await GetProposalDrafterDetail({ drafter_uuid: uuid });
    const detail = typeof detailRaw === "string" ? JSON.parse(detailRaw) : detailRaw;
console.log('detail',detail)
    if (!detail?.valid || !detail?.data?.drafter_id) {
      setErrorMsg("Failed to load drafter details.");
      showToast("error", detail?.message || "Failed to load drafter details.");
      setIsInitialLoading(false);
      return;
    }

    const data = detail.data;
    const id = data.drafter_id;
    setEncryptedId(id);
    setProposalName(getProposalName(data, detail?.data, location.state?.rowData, location.state));
    if (data.template_name) {
  setSelectedTemplate(data.template_name);
}
console.log("FULL detail.data →", JSON.stringify(data, null, 2));
   let parsedResponse = null;
try {
  if (data.response_text) {
    parsedResponse = typeof data.response_text === "string"
      ? JSON.parse(data.response_text)
      : data.response_text;  // ← already parsed object
  }
} catch (e) {
  console.error("Failed to parse response_text:", e);
}

   const savedContent = parseSavedContent(data.content);
const savedKeys = Object.keys(savedContent);
const sectionList = parsedResponse?.content || [];

let builtSections;

if (sectionList.length > 0) {
  // Case 1: DB has response_text with section titles
  builtSections = sectionList.map(title => ({
    title,
    content: savedContent[title] || "",
    loaded: !!savedContent[title],
    generating: false,
  }));
} else if (sectionsFromState.length > 0) {
  // Case 2: Coming from AnalysisComplete flow (has state sections)
  builtSections = sectionsFromState.map(item =>
    typeof item === "string"
      ? { title: item, content: "", loaded: false, generating: false }
      : { title: item.title || "", content: item.content || "", loaded: false, generating: false }
  );
} else if (savedKeys.length > 0) {
  // Case 3: Direct view click — sections already saved in content object
  builtSections = savedKeys.map(title => ({
    title,
    content: savedContent[title] || "",
    loaded: true,
    generating: false,
  }));
} else {
  builtSections = [];
}

setSections(builtSections);

    // ✅ FIX 2: nPages — prefer state, fallback to detail
    const pagesFromDetail = getPageCount(data, parsedResponse, detail);

console.log("parsedResponse →", parsedResponse);
console.log("pagesFromDetail →", pagesFromDetail);

    const resolvedPages = nPagesFromRouteState || nPagesFromLocalBackup || pagesFromDetail;

    if (resolvedPages > 0) {
      setNPages(resolvedPages);
      localStorage.setItem(`proposal_npages_${uuid}`, String(resolvedPages));
    }

  const hasSavedContent =
  savedKeys.length > 0 && Object.values(savedContent).some(val => String(val || "").trim() !== "");

setIsInitialLoading(false);

// ── Always fetch n_pages eagerly if still 0 — runs regardless of content state
if (nPagesFromState === 0 && pagesFromDetail === 0 && builtSections.length > 0) {
  try {
    const raw = await ProposalDrafterView({
      drafter_id: id,
      sections: [builtSections[0].title],
    });
    const res = typeof raw === "string" ? JSON.parse(raw) : raw;
    const pg = getPageCount(res?.data, res);
    if (pg > 0) {
      setNPages(pg);
      localStorage.setItem(`proposal_npages_${uuid}`, String(pg));
    }
  } catch (e) {
    console.error("Failed to fetch n_pages:", e);
  }
}

// ── Then decide content generation ──────────────────────────────────────────
if (!hasSavedContent && builtSections.length > 0) {
  fetchAllAtOnce(id, builtSections);
} else if (builtSections.length === 0) {
  console.warn("No sections found from any source.");
}
  } catch (err) {
    setIsInitialLoading(false);
    console.error("initFetch error:", err);
    setErrorMsg("Something went wrong loading the proposal.");
    showToast("error", "Something went wrong loading the proposal.");
  }
};

  // ── Sequential batch fetch — sections update one batch at a time ──────────
const fetchAllAtOnce = async (id, sectionList) => {
  setErrorMsg("");

  const allTitles = sectionList.map(s => s.title);

  // Mark all sections as generating
  setSections(prev =>
    prev.map(sec =>
      allTitles.includes(sec.title)
        ? { ...sec, generating: !sec.loaded }
        : sec
    )
  );

  try {
    const raw = await ProposalDrafterView({ drafter_id: id, sections: allTitles });
    const response = typeof raw === "string" ? JSON.parse(raw) : raw;

    if (response?.valid) {
      const data = response.data;
      const contentMap = data?.content || {};
      const message = response.message || data?.message || "Proposal sections generated successfully";

      const pages = getPageCount(data, response);
      if (pages > 0) {
        setNPages(pages);
        localStorage.setItem(`proposal_npages_${drafter_uuid}`, String(pages));
      }

      setSections(prev =>
        prev.map(sec =>
          allTitles.includes(sec.title)
            ? {
                ...sec,
                content: editedSections[sec.title]
                  ? htmlToPlainText(editedSections[sec.title])
                  : (contentMap[sec.title] || sec.content),
                loaded: true,
                generating: false,
              }
            : sec
        )
      );

      showToast("success", message);
    } else {
      showToast("error", response?.message || "Failed to generate sections");
      setSections(prev =>
        prev.map(sec =>
          allTitles.includes(sec.title)
            ? { ...sec, loaded: true, generating: false }
            : sec
        )
      );
    }
  } catch (err) {
    console.error("fetchAllAtOnce error:", err);
    showToast("error", "Failed to generate proposal sections");
    setSections(prev =>
      prev.map(sec =>
        allTitles.includes(sec.title)
          ? { ...sec, loaded: true, generating: false }
          : sec
      )
    );
  }
};
// const sectionsForPreview = sections.map((sec) => ({
//   ...sec,
//   content: editedSections[sec.title] ?? sec.content,
// }));

const htmlToPlainText = (html) => {
  if (!html) return "";

  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const plainTextToHtml = (text) => {
  if (!text) return "";
  // Already HTML — return as-is
  if (/^\s*<(p|br|ul|ol|li|strong|em|h[1-6])\b/i.test(text)) return text;

  const escapeHtml = (val) =>
    val.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const formatInline = (val) =>
    escapeHtml(val)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g,     "<em>$1</em>")
      .replace(/__(.+?)__/g,     "<strong>$1</strong>")
      .replace(/_(.+?)_/g,       "<em>$1</em>");

  // Split on \n\n = paragraph gap, \n = line break within paragraph
  return text
    .split(/\n\n+/)                         // \n\n → new paragraph
    .filter((block) => block.trim())
    .map((block) => {
      const trimmed = block.trim();

      // Heading: ## Title
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const level = Math.min(headingMatch[1].length, 6);
        return `<h${level} style="margin:0.8em 0 0.3em">${formatInline(headingMatch[2])}</h${level}>`;
      }

      // Bullet list block (all lines start with - or *)
      const lines = trimmed.split("\n");
      const allBullets = lines.every((l) => /^[-*]\s+/.test(l.trim()));
      if (allBullets) {
        const items = lines
          .map((l) => `<li>${formatInline(l.trim().replace(/^[-*]\s+/, ""))}</li>`)
          .join("");
        return `<ul style="margin:0.4em 0;padding-left:1.4em">${items}</ul>`;
      }

      // Mixed lines — bullets inline within paragraph
      const content = lines
        .map((l) => {
          const bullet = l.trim().match(/^[-*]\s+(.*)/);
          return bullet
            ? `<li>${formatInline(bullet[1])}</li>`
            : formatInline(l);
        })
        .join("<br/>");

      // Wrap in <p> with margin for \n\n gap
      return `<p style="margin:0 0 0.9em 0">${content}</p>`;
    })
    .join("");
};

const sectionsForPreview = sections.map((sec) => {
  const rawContent = editedSections[sec.title] ?? sec.content;
  return {
    ...sec,
    content: plainTextToHtml(rawContent),
  };
});

if (isInitialLoading) {
  return <FullPageLoader />;
}
  return (
    <div className="tw-min-h-screen">
      <div className="tw-mx-auto tw-space-y-6">

        <HeaderSection
          nPages={nPages}
          totalSections={sections.length}
          sections={sectionsForPreview}
          selectedTemplate={selectedTemplate}
          proposalName={proposalName}
        />

        {errorMsg && (
          <div className="tw-mx-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-xl tw-px-5 tw-py-4 tw-flex tw-items-center tw-justify-between">
            <p className="tw-text-sm tw-font-semibold tw-text-red-600">{errorMsg}</p>
            <button
              onClick={() => drafter_uuid && initFetch(drafter_uuid)}
              className="tw-text-xs tw-font-semibold tw-text-white tw-bg-red-500 tw-px-3 tw-py-1.5 tw-rounded hover:tw-bg-red-600 tw-transition-colors"
            >
              Retry
            </button>
          </div>
        )}

       
<div className="tw-space-y-3 tw-pb-8">
 

{sections.map((section, index) => (
  <ProposalSectionItem
    key={section.title}
    title={section.title}
    content={section.content}
    loaded={section.loaded}
    defaultExpanded={index === 0}   // ← first section open, rest closed
    allSections={sections}
    encryptedDrafterId={encryptedId}
   onContentUpdate={(sectionTitle, newContent) => {
  if (!newContent || !newContent.trim()) return; // ← ignore empty updates

  setEditedSections(prev => ({
    ...prev,
    [sectionTitle]: newContent,
  }));

  setSections(prev => prev.map((sec) =>
    sec.title === sectionTitle
      ? { ...sec, loaded: true, generating: false } // ← remove content update
      : sec
  ));
}}
  />
))}
</div>

      </div>
    </div>
  );
}
