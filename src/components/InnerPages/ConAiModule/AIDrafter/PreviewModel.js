import React, { useLayoutEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { useSelector } from "react-redux";
import CONFIG from "../../../../config/config";
import ReactDOM from "react-dom";

const TEMPLATE_STYLES = {
  modern_blue: { headerBg: "#0052cc", sectionBg: "#bfdbfe", sectionText: "#0047cc" },
  corporate_navy: { headerBg: "#1e3a5f", sectionBg: "#cbd5e1", sectionText: "#1e3a5f" },
  classic_teal: { headerBg: "#0d9488", sectionBg: "#99f6e4", sectionText: "#0d9488" },
  minimal_slate: { headerBg: "#475569", sectionBg: "#cbd5e1", sectionText: "#475569" },
};

const PDF_HEADER_BG = "#0140c1";
const PREVIEW_COVER_LOGO_W = 157;
const PREVIEW_COVER_LOGO_H = 79;
const PREVIEW_HEADER_LOGO_W = 110;
const PREVIEW_HEADER_LOGO_H = 55;
const PREVIEW_PAGE_HEIGHT = 842;
const PREVIEW_PAGE_HEADER_H = 72;
const PREVIEW_PAGE_FOOTER_H = 36;
const PREVIEW_PAGE_CONTENT_PADDING_TOP = 16;
const PREVIEW_PAGE_CONTENT_PADDING_BOTTOM = 18;
const PREVIEW_CONTENT_MAX_HEIGHT =
  PREVIEW_PAGE_HEIGHT
  - PREVIEW_PAGE_HEADER_H
  - PREVIEW_PAGE_FOOTER_H
  - PREVIEW_PAGE_CONTENT_PADDING_TOP
  - PREVIEW_PAGE_CONTENT_PADDING_BOTTOM;

const KEYFRAMES = `
  @keyframes ppmPulse{0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes ppmSpin{to{transform:rotate(360deg)}}
  .ppm-ql p{font-size:11px!important;line-height:1.7!important;color:#334155!important;margin:0 0 6px!important}
  .ppm-ql ul,.ppm-ql ol{margin:4px 0 8px!important;padding-left:20px!important}
  .ppm-ql ul{list-style-type:disc!important}
  .ppm-ql ol{list-style-type:decimal!important}
  .ppm-ql li{font-size:11px!important;line-height:1.7!important;color:#334155!important;margin-bottom:3px!important}
  .ppm-ql strong,.ppm-ql b{font-weight:700!important;color:#1e293b!important}
  .ppm-ql em,.ppm-ql i{font-style:italic!important}
  .ppm-ql h1{font-size:16px!important;font-weight:700!important;color:#1e293b!important;margin:10px 0 5px!important}
  .ppm-ql h2{font-size:13px!important;font-weight:700!important;color:#1e293b!important;margin:8px 0 4px!important}
  .ppm-ql h3{font-size:12px!important;font-weight:700!important;color:#1e293b!important;margin:6px 0 3px!important}
  .ppm-ql .ql-align-center{text-align:center!important}
  .ppm-ql .ql-align-right{text-align:right!important}
  .ppm-ql .ql-align-justify{text-align:justify!important}
  .ppm-ql p.ql-align-center,.ppm-ql h1.ql-align-center,.ppm-ql h2.ql-align-center,.ppm-ql h3.ql-align-center,.ppm-ql li.ql-align-center{text-align:center!important}
  .ppm-ql p.ql-align-right,.ppm-ql h1.ql-align-right,.ppm-ql h2.ql-align-right,.ppm-ql h3.ql-align-right,.ppm-ql li.ql-align-right{text-align:right!important}
  .ppm-ql p.ql-align-justify,.ppm-ql h1.ql-align-justify,.ppm-ql h2.ql-align-justify,.ppm-ql h3.ql-align-justify,.ppm-ql li.ql-align-justify{text-align:justify!important}
  .ppm-ql li.ql-align-center,.ppm-ql li.ql-align-right{list-style-position:inside!important}
  .ppm-ql ul:has(li.ql-align-center),.ppm-ql ol:has(li.ql-align-center),
  .ppm-ql ul:has(li.ql-align-right),.ppm-ql ol:has(li.ql-align-right){padding-left:0!important}
`;

const SaveIndicator = ({ saveStatus }) => {
  if (!saveStatus || saveStatus === "idle") return null;

  const baseStyle = { display: "flex", alignItems: "center", gap: 5, fontSize: 11 };

  if (saveStatus === "pending") {
    return (
      <span style={{ ...baseStyle, color: "#9ca3af" }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#d1d5db",
            display: "inline-block",
            animation: "ppmPulse 1s infinite",
          }}
        />
        Unsaved changes
      </span>
    );
  }

  if (saveStatus === "saving") {
    return (
      <span style={{ ...baseStyle, color: "#3b82f6" }}>
        <svg style={{ width: 11, height: 11, animation: "ppmSpin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
          <circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Saving...
      </span>
    );
  }

  if (saveStatus === "saved") {
    return (
      <span style={{ ...baseStyle, color: "#22c55e" }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All changes saved
      </span>
    );
  }

  if (saveStatus === "error") {
    return (
      <span style={{ ...baseStyle, color: "#f87171" }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="2" />
          <line x1="12" y1="8" x2="12" y2="12" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1" fill="#f87171" />
        </svg>
        Save failed
      </span>
    );
  }

  return null;
};

const Logo = ({ src, name }) =>
  src ? (
    <img
      src={src}
      alt={name || "logo"}
      style={{
        width: "100%",
       
        objectFit: "fill",
        display: "block",
      }}
    />
  ) : (
    <span
      style={{
        fontSize: 18,
        fontWeight: 900,
        color: "#0047cc",
        fontFamily: "'Inter',Arial,sans-serif",
        padding: "0 6px",
        textAlign: "center",
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
    >
      {name || "ACME INC."}
    </span>
  );

const CoverPage = ({ logoSrc, companyName, proposalTitle, coverBg }) => {
  const parts = (proposalTitle || "").split(/ for /i);

  return (
    <div style={{ position: "relative", width: "100%", height: 620, overflow: "hidden", backgroundColor: "#0a1a6b" }}>
      {coverBg ? (
        <img src={coverBg} alt="Proposal cover" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,#0a1a6b 0%,#1a3fd4 40%,#0d2fa0 70%,#0a1a6b 100%)" }} />
      )}

      <div style={{ position: "absolute", inset: 0, background: "rgba(5,15,60,0.18)", zIndex: 1 }} />

      <div style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box" }}>
        <div style={{ padding: "36px 52px 0", fontSize: 28, fontWeight: 600, color: "#fff", fontFamily: "Arial,sans-serif", letterSpacing: 0.5 }}>
          PrexoAI
        </div>

        <div style={{ padding: "0 52px 52px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 22 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: PREVIEW_COVER_LOGO_W, height: PREVIEW_COVER_LOGO_H, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 10px 24px rgba(0,0,0,0.30)", flexShrink: 0, boxSizing: "border-box" }}>
            <Logo src={logoSrc} name={companyName} />
          </div>

          <h1 style={{ margin: 0, color: "#fff", fontSize: 26, fontWeight: 700, lineHeight: 1.2, maxWidth: 420, fontFamily: "Arial,sans-serif" }}>
            {parts[0]}
            {parts[1] ? (
              <>
                {" "}for
                <br />
                {parts[1]}
              </>
            ) : (
              ""
            )}
          </h1>
        </div>
      </div>
    </div>
  );
};

const PageHeader = ({ logoSrc, companyName, proposalTitle }) => (
  <div
    style={{
      width: "100%",
      height: PREVIEW_PAGE_HEADER_H,
      background: PDF_HEADER_BG,
      display: "flex",
      alignItems: "stretch",
      justifyContent: "space-between",
      position: "relative",
      flexShrink: 0,
      boxSizing: "border-box",
      padding: "0 20px 10px",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        paddingLeft: 20,
        paddingTop: 16,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          color: "#fff",
          letterSpacing: 0.35,
          fontFamily: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
          textAlign: "left",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          maxWidth: "100%",
        }}
      >
        {proposalTitle}
      </div>
    </div>

    <div
      style={{
        background: "#fff",
        width: PREVIEW_HEADER_LOGO_W,
        height: PREVIEW_HEADER_LOGO_H,
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        overflow: "hidden",
        flexShrink: 0,
        boxSizing: "border-box",
      }}
    >
      <Logo src={logoSrc} name={companyName} />
    </div>
  </div>
);

const PageFooter = ({ pageNum }) => (
  <div style={{ width: "100%", background: "#dfdfdf", display: "flex", alignItems: "center", justifyContent: "space-between", height: 36, padding: "0 20px 0 22px", boxSizing: "border-box", flexShrink: 0 }}>
    <span style={{ fontSize: 9, color: "#585858", fontFamily: "Arial,sans-serif" }}>This report was generated by PrexoAI.</span>
    <span style={{ fontSize: 9, color: "#585858", fontFamily: "Arial,sans-serif" }}>Page {pageNum}</span>
  </div>
);

const parseSectionsToUnits = (sections) => {
  const units = [];
  const isHtml = (value) => /<(p|strong|em|u|s|ol|ul|li|h[1-6]|br|div|span|b|i|a|table)\b/i.test(String(value || ""));

  sections.forEach((sec, secIndex) => {
    units.push({ type: 'title', content: sec.title, secIndex, isFirstSection: secIndex === 0 });
    
    if (sec.generating || !sec.loaded) {
      units.push({ type: 'generating', content: null, secIndex });
      return;
    }
    
    if (!sec.content || !sec.content.trim()) {
      units.push({ type: 'empty', content: null, secIndex });
      return;
    }
    
    if (isHtml(sec.content)) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(sec.content, 'text/html');
      Array.from(doc.body.childNodes).forEach(node => {
        if (node.nodeType === 1) { // ELEMENT_NODE
          units.push({ type: 'block', content: node.outerHTML, secIndex, isHtml: true });
        } else if (node.nodeType === 3 && node.textContent.trim()) { // TEXT_NODE
          units.push({ type: 'block', content: node.textContent.trim(), secIndex, isHtml: false });
        }
      });
    } else {
      const blocks = sec.content.split(/\n\s*\n/);
      blocks.forEach(b => {
        if (b.trim()) units.push({ type: 'block', content: b.trim(), secIndex, isHtml: false });
      });
    }
  });
  return units;
};

const UnitBlock = ({ unit, tpl }) => {
  if (unit.type === 'title') {
    return (
      <div style={{ background: tpl.sectionBg, color: tpl.sectionText, fontSize: 12, fontWeight: 900, padding: "8px 14px", borderRadius: 6, marginTop: unit.isFirstSection ? 0 : 16, marginBottom: 8, fontFamily: "Arial,sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {unit.content}
      </div>
    );
  }
  if (unit.type === 'generating') {
    return (
      <div style={{ padding: "0 5px", display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#94a3b8", display: "inline-block", animation: "ppmPulse 1s infinite" }} />
        <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Generating content...</span>
      </div>
    );
  }
  if (unit.type === 'empty') {
    return <p style={{ padding: "0 5px", fontSize: 11, color: "#94a3b8", fontStyle: "italic", margin: "0 0 16px" }}>No content available for this section yet.</p>;
  }
  if (unit.isHtml) {
    return <div className="ppm-ql" style={{ padding: "0 5px", fontSize: 11, lineHeight: 1.7, color: "#334155" }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(unit.content, { USE_PROFILES: { html: true } }) }} />;
  }
  return (
    <div style={{ padding: "0 5px", fontSize: 11, lineHeight: 1.7, color: "#334155" }}>
      {unit.content.split("\n").map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        if (/^[-*]\s+/.test(trimmed)) {
          return (
            <div key={index} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
              <span>•</span>
              <span>{trimmed.replace(/^[-*]\s+/, "")}</span>
            </div>
          );
        }
        return <p key={index} style={{ margin: "0 0 6px" }}>{trimmed}</p>;
      })}
    </div>
  );
};

const PagedSections = ({ sections, tpl, resolvedLogo, companyName, proposalTitle }) => {
  const [pages, setPages] = React.useState([]);
  const measureRef = React.useRef(null);
  
  const units = React.useMemo(() => parseSectionsToUnits(sections), [sections]);

  React.useLayoutEffect(() => {
    if (!measureRef.current || units.length === 0) return;
    const elements = Array.from(measureRef.current.children);
    const newPages = [];
    let currentPage = [];
    let currentHeight = 0;
    const MAX_HEIGHT = PREVIEW_CONTENT_MAX_HEIGHT;

    elements.forEach((el, i) => {
      const style = window.getComputedStyle(el);
      const marginBottom = parseFloat(style.marginBottom) || 0;
      const h = el.getBoundingClientRect().height + marginBottom;
      
      if (currentPage.length === 0) {
        currentPage.push(units[i]);
        currentHeight += h;
      } else if (currentHeight + h > MAX_HEIGHT) {
        newPages.push(currentPage);
        currentPage = [units[i]];
        currentHeight = h;
      } else {
        currentPage.push(units[i]);
        currentHeight += h;
      }
    });
    if (currentPage.length > 0) newPages.push(currentPage);
    
    setPages(newPages);
  }, [units, tpl]);

  if (sections.length === 0) {
    return (
      <div style={{ width: "100%", maxWidth: 600, minHeight: 842, background: "#fff", borderRadius: 4, overflow: "hidden", boxShadow: "0 2px 14px rgba(0,0,0,0.11)", display: "flex", flexDirection: "column" }}>
        <PageHeader logoSrc={resolvedLogo} companyName={companyName} proposalTitle={proposalTitle} />
        <div style={{ flex: 1, padding: "48px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", margin: 0 }}>No sections available.</p>
        </div>
        <PageFooter pageNum={2} />
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ visibility: "hidden", position: "absolute", top: 0, width: "100%", maxWidth: 600, padding: "16px 26px 18px", zIndex: -1000, pointerEvents: "none" }} ref={measureRef}>
        {units.map((unit, i) => (
          <UnitBlock key={i} unit={unit} tpl={tpl} />
        ))}
      </div>
      
      {pages.length > 0 ? pages.map((pageUnits, index) => (
        <div key={index} style={{ width: "100%", maxWidth: 600, minHeight: PREVIEW_PAGE_HEIGHT, background: "#fff", boxShadow: "0 2px 14px rgba(0,0,0,0.11)", borderRadius: 4, overflow: "hidden", display: "flex", flexDirection: "column", marginBottom: 20 }}>
          <PageHeader logoSrc={resolvedLogo} companyName={companyName} proposalTitle={proposalTitle} />
          <div style={{ flex: 1, padding: `${PREVIEW_PAGE_CONTENT_PADDING_TOP}px 26px ${PREVIEW_PAGE_CONTENT_PADDING_BOTTOM}px`, background: "#fff" }}>
            {pageUnits.map((unit, uIndex) => (
              <UnitBlock key={uIndex} unit={unit} tpl={tpl} />
            ))}
          </div>
          <PageFooter pageNum={index + 2} />
        </div>
      )) : (
        <div style={{ width: "100%", maxWidth: 600, minHeight: PREVIEW_PAGE_HEIGHT, background: "#fff", boxShadow: "0 2px 14px rgba(0,0,0,0.11)", borderRadius: 4, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <PageHeader logoSrc={resolvedLogo} companyName={companyName} proposalTitle={proposalTitle} />
          <div style={{ flex: 1, padding: `${PREVIEW_PAGE_CONTENT_PADDING_TOP}px 26px ${PREVIEW_PAGE_CONTENT_PADDING_BOTTOM}px`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>Calculating page layouts...</span>
          </div>
          <PageFooter pageNum={2} />
        </div>
      )}
    </div>
  );
};

const ProposalPreviewModal = ({
  onClose,
  sections = [],
  templateName = "modern_blue",
  saveStatus,
  companyLogo,
  coverBg,
  companyName = "ACME INC.",
  proposalTitle = "Proposal for Construction Services",
}) => {
  const tpl = TEMPLATE_STYLES[templateName] || TEMPLATE_STYLES.modern_blue;
  // const pages = useMemo(() => chunkSections(sections), [sections]);
  const scrollRef = useRef(null);
const organizationImage = useSelector((s) => s?.auth?.user?.[0]?.organization_image);
  const dynamicLogoUrl = organizationImage
    ? `${CONFIG.VITE_AWS_ENDPOINT}/organization_images/${organizationImage}`
    : null;
  const resolvedLogo = dynamicLogoUrl || companyLogo;
  // Reset scroll to top on mount and whenever key props change
  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [coverBg, companyLogo, proposalTitle, sections.length]);

  return ReactDOM.createPortal(
    <>
      <style>{KEYFRAMES}</style>
      <div style={{ position: "fixed", inset: 0, zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.58)", backdropFilter: "blur(2px)" }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <div style={{ background: "#fff", width: "92%", maxWidth: 700, height: "92vh", borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 56px rgba(0,0,0,0.30)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid rgba(0,0,0,0.08)", flexShrink: 0, background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#0140c1" strokeWidth="2" />
                <circle cx="12" cy="12" r="3" stroke="#0140c1" strokeWidth="2" />
              </svg>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#002149" }}>Proposal Preview</span>
              <div style={{ paddingLeft: 10, borderLeft: "1px solid rgba(0,0,0,0.10)" }}>
                <SaveIndicator saveStatus={saveStatus} />
              </div>
            </div>
            <button onClick={onClose} aria-label="Close preview" style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", lineHeight: 1, padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              background: "#e8ecf2",
              padding: "24px 24px 40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              overflowAnchor: "none",
            }}
          >
            {/* Cover page — always rendered first, never unmounted */}
            <div style={{ width: "100%", maxWidth: 600, borderRadius: 4, overflow: "hidden", boxShadow: "0 3px 16px rgba(0,0,0,0.15)", flexShrink: 0 }}>
             <CoverPage logoSrc={resolvedLogo} companyName={companyName} proposalTitle={proposalTitle} coverBg={coverBg} />
            </div>

            {/* Content pages — always rendered, no show/hide toggle */}
            {/* Content pages — paginated by height */}
            <PagedSections
              sections={sections}
              tpl={tpl}
              resolvedLogo={resolvedLogo}
              companyName={companyName}
              proposalTitle={proposalTitle}
            />
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default ProposalPreviewModal;
