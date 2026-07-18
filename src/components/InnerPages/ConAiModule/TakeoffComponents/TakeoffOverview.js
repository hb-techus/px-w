import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download, X, Building2, Hammer,
  Wrench, Layers, FileText, Shovel, ShieldAlert
} from "lucide-react";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import { useRfpData } from "../RFPComponents/useRfpData";
import { GetTakeoffDocuments, setLastOpenedDocument, getViewUrl, getImageStream } from "../../../../services/techus-services";
import CONFIG from "../../../../config/config";
import { getDeviceInfo } from "../../../../utils/getDeviceInfo";

// ─── S3 / key helpers ─────────────────────────────────────────────────────────
const S3 = CONFIG.VITE_AWS_ENDPOINT;
const thumbKey = (doc, p = 1) => `${doc.thumbnails_folder_path}/${doc.document_id}_thumbnail_${p}.png`;
const pageKey = (doc, p = 1) => `${doc.images_folder_path}/${doc.document_id}_page_${p}.png`;
const directThumbUrl = (doc, p = 1) => `${S3}/${doc.thumbnails_folder_path}/${doc.document_id}_thumbnail_${p}.png`;
const directPageUrl = (doc, p = 1) => `${S3}/${doc.images_folder_path}/${doc.document_id}_page_${p}.png`;

// ─── Presigned URL helper ─────────────────────────────────────────────────────
async function fetchPresignedUrl(s3_key) {
  try {
    return await getImageStream(s3_key);
  } catch (err) {
    console.warn("getImageStream failed, falling back to presigned URL", err);
  }

  const res = await getViewUrl(s3_key);
  let parsed;
  if (typeof res?.normalData === "string") parsed = JSON.parse(res.normalData);
  else if (typeof res?.data?.normalData === "string") parsed = JSON.parse(res.data.normalData);
  else if (res?.data?.valid !== undefined) parsed = res.data;
  else if (res?.valid !== undefined) parsed = res;
  else throw new Error("Unrecognized API response structure");
  if (!parsed?.valid) throw new Error(parsed?.message || "View URL invalid");
  const url = parsed?.data?.view_url;
  if (!url) throw new Error("view_url missing from response");
  return url;
}

// ─── usePresignedUrl hook ─────────────────────────────────────────────────────
function usePresignedUrl(doc, pageNum, type = "thumb") {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    setLoading(true);
    setUrl(null);
    const s3Key = type === "thumb" ? thumbKey(doc, pageNum) : pageKey(doc, pageNum);
    const direct = type === "thumb" ? directThumbUrl(doc, pageNum) : directPageUrl(doc, pageNum);
    fetchPresignedUrl(s3Key)
      .then(r => { if (!cancelled) { setUrl(r); setLoading(false); } })
      .catch(() => { if (!cancelled) { setUrl(direct); setLoading(false); } });
    return () => { cancelled = true; };
  }, [doc, pageNum, type]);
  return { url, loading };
}

// ─── Scope meta ───────────────────────────────────────────────────────────────
const SCOPE_META = {
  new_buildings: { label: "New Buildings", icon: "icon-New-Buildings", LucideIcon: Building2 },
  demolition: { label: "Demolition", icon: "icon-Demolition", LucideIcon: Hammer },
  site_improvements: { label: "Site Improvements", icon: "icon-Site-Improvements", LucideIcon: Shovel },
  restore_repair: { label: "Restoration & Repair", icon: "icon-Restoration--Repair", LucideIcon: Wrench },
  expansion: { label: "Expansion", icon: "icon-Expansion", LucideIcon: null },
  specialty_construction: {
    label: "Specialty Construction",
    icon: "icon-Specialty-Construction",
    LucideIcon: ShieldAlert,
  },
};
const SCOPE_COLOR = {
  new_buildings: "#2563EB",
  demolition: "#DC2626",
  site_improvements: "#16A34A",
  restore_repair: "#D97706",
  expansion: "#7C3AED",
  specialty_construction: "#0891B2",
};

const ZOOM_STEPS = [25, 50, 75, 100, 125, 150, 200];
const SCROLLBAR_STYLE = `
  .custom-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
  .custom-scroll::-webkit-scrollbar-track { background: transparent; }
  .custom-scroll::-webkit-scrollbar-thumb { background-color: #dee9ff; border-radius: 99px; }
  .custom-scroll { scrollbar-color: #dee9ff transparent; scrollbar-width: thin; }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
`;

// ─── Tooltip ─────────────────────────────────────────────────────────────────
const Tip = ({ label }) => (
  <div style={{
    position: "absolute", top: "calc(100% + 7px)", left: "50%", transform: "translateX(-50%)",
    background: "#fff", color: "#1e293b", fontSize: 12, fontWeight: 400,
    padding: "4px 10px", borderRadius: 5, border: "1px solid #e5e7eb",
    boxShadow: "0 4px 14px rgba(0,0,0,0.1)", whiteSpace: "nowrap",
    zIndex: 9999, pointerEvents: "none",
  }}>{label}</div>
);
const TBtn = ({ onClick, disabled, tip, children }) => {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <button onClick={onClick} disabled={disabled}
        className="tw-flex tw-items-center tw-justify-center tw-h-8 tw-min-w-[32px] tw-px-2 tw-rounded-md tw-bg-white tw-border tw-border-gray-300 hover:tw-bg-gray-50 disabled:tw-opacity-40 tw-transition-colors tw-flex-shrink-0"
        style={{ color: hov && !disabled ? "#2563EB" : "#6b7280", transition: "color 0.15s" }}>
        {children}
      </button>
      {hov && !disabled && tip && <Tip label={tip} />}
    </div>
  );
};
const NavBtn = ({ onClick, disabled, tip, children }) => {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <button onClick={onClick} disabled={disabled}
        style={{
          background: "none", border: "none", cursor: disabled ? "default" : "pointer",
          padding: 2, display: "flex", alignItems: "center",
          color: hov && !disabled ? "#2563EB" : "#374151",
          opacity: disabled ? 0.3 : 1, transition: "color 0.15s",
        }}>{children}</button>
      {hov && !disabled && tip && <Tip label={tip} />}
    </div>
  );
};

// ─── Modal thumbnail strip item ───────────────────────────────────────────────
function ModalThumbItem({ doc, pageNum, isActive, thumbRef, onClick }) {
  const { url } = usePresignedUrl(doc, pageNum, "thumb");
  return (
    <div ref={thumbRef} onClick={onClick} className="tw-cursor-pointer tw-flex tw-flex-col tw-items-center tw-gap-1">
      <div className={`tw-w-full tw-rounded-lg tw-overflow-hidden tw-border-2 tw-transition-all ${isActive ? "tw-border-blue-600 tw-shadow-md" : "tw-border-gray-200 hover:tw-border-gray-400"
        }`} style={{ minHeight: 80, background: "#EEF3FC" }}>
        {url && <img src={url} alt={`Page ${pageNum}`} className="tw-w-full tw-block" />}
      </div>
      <span className={`tw-text-[11px] tw-font-semibold ${isActive ? "tw-text-blue-600" : "tw-text-gray-400"}`}>
        {pageNum}
      </span>
    </div>
  );
}

// ─── PDF Viewer Modal ─────────────────────────────────────────────────────────
function PDFViewerModal({ doc, onClose }) {
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [zoom, setZoom] = useState(100);
  const [imgLoading, setImgLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState(null);
  const containerRef = useRef(null);
  const thumbRefs = useRef([]);
  const urlCacheRef = useRef({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPageUrl, setCurrentPageUrl] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const total = doc.n_pages;

  useEffect(() => {
    setDownloading(false);
    setDownloadProgress(0);
    setDownloadError(null);
    setDownloadSuccess(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setImgLoading(true);
    setCurrentPageUrl(null);
    if (urlCacheRef.current[page]) { setCurrentPageUrl(urlCacheRef.current[page]); return; }

    const loadPage = async () => {
      try {
        const s3Key = pageKey(doc, page);
        const url = await fetchPresignedUrl(s3Key);
        if (!cancelled) {
          urlCacheRef.current[page] = url;
          setCurrentPageUrl(url);
        }
      } catch (err) {
        console.error('Failed to load page:', err);
        if (!cancelled) {
          const fallback = directPageUrl(doc, page);
          urlCacheRef.current[page] = fallback;
          setCurrentPageUrl(fallback);
        }
      }
    };
    loadPage();
    return () => { cancelled = true; };
  }, [page, doc]);

  useEffect(() => {
    const preload = async (p) => {
      if (p < 1 || p > total || urlCacheRef.current[p]) return;
      try {
        urlCacheRef.current[p] = await fetchPresignedUrl(pageKey(doc, p));
      } catch {
        urlCacheRef.current[p] = directPageUrl(doc, p);
      }
    };
    preload(page + 1);
    preload(page - 1);
  }, [page, doc, total]);

  useEffect(() => {
    setPageInput(String(page));
    thumbRefs.current[page - 1]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [page]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    if (isFullscreen && containerRef.current) {
      const nodes = document.querySelectorAll('link[rel="stylesheet"], style');
      nodes.forEach(node => {
        const clone = node.cloneNode(true);
        clone.setAttribute("data-fullscreen-clone", "true");
        containerRef.current.appendChild(clone);
      });
    } else {
      containerRef.current
        ?.querySelectorAll('[data-fullscreen-clone]')
        .forEach(el => el.remove());
    }
  }, [isFullscreen]);

  const goToPage = (raw) => setPage(Math.min(Math.max(1, parseInt(raw, 10) || 1), total));
  const zoomIn = () => { const i = ZOOM_STEPS.indexOf(zoom); if (i < ZOOM_STEPS.length - 1) setZoom(ZOOM_STEPS[i + 1]); };
  const zoomOut = () => { const i = ZOOM_STEPS.indexOf(zoom); if (i > 0) setZoom(ZOOM_STEPS[i - 1]); };
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloadError(null);
    setDownloadSuccess(false);
    setDownloadProgress(0);

    const safetyTimer = setTimeout(() => {
      setDownloading(false);
      setDownloadProgress(0);
    }, 180000);

    try {
      setDownloading(true);
      const { jsPDF } = await import("jspdf");

      const urlResults = [];
      const keysToFetch = [];

      for (let p = 1; p <= total; p++) {
        if (urlCacheRef.current[p]) {
          urlResults.push({ p, url: urlCacheRef.current[p] });
        } else {
          const key = pageKey(doc, p);
          keysToFetch.push({ p, key });
        }
      }

      const MAX_PARALLEL = 8;
      for (let i = 0; i < keysToFetch.length; i += MAX_PARALLEL) {
        const batch = keysToFetch.slice(i, i + MAX_PARALLEL);
        const filled = await Promise.all(batch.map(async ({ p, key }) => {
          try {
            const url = await fetchPresignedUrl(key);
            urlCacheRef.current[p] = url;
            return { p, url };
          } catch {
            const fallbackUrl = directPageUrl(doc, p);
            urlCacheRef.current[p] = fallbackUrl;
            return { p, url: fallbackUrl };
          }
        }));
        urlResults.push(...filled);
        setDownloadProgress(15 + Math.round((i + MAX_PARALLEL) / total * 15));
      }

      urlResults.sort((a, b) => a.p - b.p);
      setDownloadProgress(30);

      const BATCH_SIZE = 25;

      const loadImageData = ({ p, url }) =>
        new Promise((resolve) => {
          if (url?.startsWith("blob:")) {
            const img = new Image();
            img.onload = () => resolve({ p, img, w: img.naturalWidth, h: img.naturalHeight });
            img.onerror = () => resolve({ p, img: null, w: 800, h: 1100, url });
            img.src = url;
            return;
          }

          fetch(url, { mode: "cors" })
            .then(r => {
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              return r.blob();
            })
            .then(blob => {
              const img = new Image();
              const objectUrl = URL.createObjectURL(blob);
              img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                resolve({ p, img, w: img.naturalWidth, h: img.naturalHeight });
              };
              img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                resolve({ p, img: null, w: 800, h: 1100, url });
              };
              img.src = objectUrl;
            })
            .catch(() => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => resolve({ p, img, w: img.naturalWidth, h: img.naturalHeight });
              img.onerror = () => resolve({ p, img: null, w: 800, h: 1100, url });
              img.src = url;
            });
        });

      const dataUrls = new Array(total);

      for (let b = 0; b < urlResults.length; b += BATCH_SIZE) {
        const batch = urlResults.slice(b, b + BATCH_SIZE);
        const results = await Promise.allSettled(batch.map(loadImageData));
        results.forEach(r => {
          if (r.status === "fulfilled" && r.value) {
            dataUrls[r.value.p - 1] = r.value;
          }
        });
        setDownloadProgress(15 + Math.min(65, Math.round(((b + BATCH_SIZE) / total) * 65)));
      }

      setDownloadProgress(82);

      const MAX_PDF_DIMENSION = 1600;
      const first = dataUrls.find(Boolean);
      if (!first) throw new Error("No image pages available for PDF export");

      const pdf = new jsPDF({
        orientation: first.w > first.h ? "landscape" : "portrait",
        unit: "px",
        format: [first.w, first.h],
        compress: true,
      });

      for (let i = 0; i < dataUrls.length; i++) {
        const item = dataUrls[i];
        if (!item) continue;
        const { img, url: fallbackUrl, w, h } = item;

        const scale = Math.min(1, MAX_PDF_DIMENSION / w, MAX_PDF_DIMENSION / h);
        const pdfW = Math.round(w * scale);
        const pdfH = Math.round(h * scale);

        if (i > 0) pdf.addPage([pdfW, pdfH], pdfW > pdfH ? "landscape" : "portrait");
        else {
          pdf.internal.pageSize.width = pdfW;
          pdf.internal.pageSize.height = pdfH;
        }

        if (img) {
          pdf.addImage(img, "JPEG", 0, 0, pdfW, pdfH, undefined, "FAST");
        } else {
          pdf.addImage(fallbackUrl, "JPEG", 0, 0, pdfW, pdfH, undefined, "FAST");
        }
        setDownloadProgress(82 + Math.round(((i + 1) / dataUrls.length) * 18));
      }

      pdf.save(`${doc.label || doc.document_id}.pdf`);
      setDownloadSuccess(true);

    } catch (err) {
      console.error("Download failed:", err);
      setDownloadError(`Download failed: ${err.message}`);
    } finally {
      clearTimeout(safetyTimer);
      setDownloading(false);
      setDownloadProgress(0);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };
  void downloadSuccess
  return (
    <>
      <style>{SCROLLBAR_STYLE}</style>
      <div className="tw-fixed tw-inset-0 tw-bg-black/40 tw-z-50 tw-flex tw-items-center tw-justify-center">
        <div ref={containerRef} className="tw-bg-white tw-rounded-2xl tw-flex tw-flex-col tw-overflow-hidden tw-shadow-2xl" style={{ width: "85vw", height: "95vh" }}>

          {/* ── Toolbar ── */}
          <div className="tw-flex tw-items-center tw-px-5 tw-py-2.5 tw-border-b tw-border-gray-200 tw-bg-[#f9fafb] tw-flex-shrink-0 tw-gap-4" style={{ position: "relative" }}>
            <div className="tw-flex tw-items-center tw-gap-1.5">
              <TBtn onClick={zoomOut} disabled={zoom === ZOOM_STEPS[0]} tip="Zoom Out"><ZoomOut size={14} /></TBtn>
              <span className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-border tw-border-gray-300 tw-rounded-md tw-px-3 tw-py-1 tw-bg-white tw-min-w-[64px] tw-text-center tw-select-none">{zoom}%</span>
              <TBtn onClick={zoomIn} disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]} tip="Zoom In"><ZoomIn size={14} /></TBtn>
            </div>
            <div className="tw-flex-1 tw-flex tw-items-center tw-justify-center tw-gap-2">
              <NavBtn onClick={() => goToPage(page - 1)} disabled={page === 1} tip="Previous Page"><ChevronLeft size={22} /></NavBtn>
              <input type="number" min={1} max={total} value={pageInput}
                onChange={e => setPageInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { goToPage(pageInput); e.target.blur(); } }}
                onBlur={() => goToPage(pageInput)}
                className="tw-h-8 tw-w-10 tw-text-center tw-text-sm tw-font-bold tw-text-gray-800 tw-border tw-border-gray-300 tw-rounded-md tw-bg-white tw-outline-none focus:tw-border-blue-500" />
              <span className="tw-text-sm tw-text-gray-500 tw-font-medium">/ {total}</span>
              <NavBtn onClick={() => goToPage(page + 1)} disabled={page === total} tip="Next Page"><ChevronRight size={22} /></NavBtn>
            </div>
            <div className="tw-flex tw-items-center tw-gap-1.5">
              <TBtn onClick={toggleFullscreen} tip={isFullscreen ? "Exit Full Screen" : "Full Screen"}>
                {isFullscreen
                  ? <i className="icon-Specialty-Construction-2" style={{ fontSize: 14 }} />
                  : <i className="icon-Expansion" style={{ fontSize: 14 }} />
                }
              </TBtn>
              <TBtn onClick={handleDownload} disabled={downloading} tip={downloading ? `Downloading… ${downloadProgress}%` : "Download PDF"}>
                {downloading
                  ? <div className="tw-w-3.5 tw-h-3.5 tw-border-2 tw-border-gray-300 tw-border-t-blue-600 tw-rounded-full tw-animate-spin" />
                  : <Download size={14} />
                }
              </TBtn>
              <TBtn onClick={onClose} tip="Close"><X size={14} /></TBtn>
            </div>

            {downloading && (
              <div style={{
                position: "absolute", bottom: -2, left: 0, right: 0,
                height: 3, background: "#e0e7ff", zIndex: 10,
              }}>
                <div style={{
                  height: "100%", background: "#2563eb",
                  width: `${downloadProgress}%`,
                  transition: "width 0.3s ease",
                  borderRadius: 2,
                }} />
              </div>
            )}

            {downloadError && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 12,
                background: "#fef2f2", border: "1px solid #fca5a5",
                color: "#dc2626", fontSize: 12, padding: "6px 14px",
                borderRadius: 6, zIndex: 100, whiteSpace: "nowrap", display: "flex", gap: 8,
              }}>
                {downloadError}
                <button onClick={() => setDownloadError(null)} style={{ fontWeight: 700 }}>✕</button>
              </div>
            )}
          </div>

          {/* ── Body ── */}
          <div className="tw-flex tw-flex-1 tw-overflow-hidden">
            <div className="tw-w-[145px] tw-flex-shrink-0 tw-bg-[#f9fafb] tw-border-r tw-border-gray-200 tw-overflow-y-auto tw-p-3 tw-space-y-3 custom-scroll">
              {Array.from({ length: total }, (_, i) => i + 1).map(p => (
                <ModalThumbItem key={p} doc={doc} pageNum={p} isActive={p === page}
                  thumbRef={el => thumbRefs.current[p - 1] = el} onClick={() => goToPage(p)} />
              ))}
            </div>
            <div className="tw-flex-1 tw-bg-gray-100 tw-overflow-auto tw-flex tw-items-start tw-justify-center tw-relative custom-scroll">
              {imgLoading && (
                <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-gray-100 tw-z-10">
                  <div className="tw-w-10 tw-h-10 tw-border-4 tw-border-blue-200 tw-border-t-blue-600 tw-rounded-full tw-animate-spin" />
                </div>
              )}
              {currentPageUrl && (
                <img key={`${doc.document_id}-${page}`} src={currentPageUrl} alt={`Page ${page}`}
                  onLoad={() => setImgLoading(false)} onError={() => setImgLoading(false)}
                  style={{ width: `${zoom}%`, maxWidth: zoom > 100 ? "none" : "100%", border: "1px solid #d1d5db" }}
                  className="tw-shadow-xl tw-bg-white tw-block" />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
// canProceed: derived from takeoff_dashboard.proceed_to_takeoff permission.
// When false → "Proceed to Takeoff" button is hidden entirely.
// PDF expand button is always visible (controlled by takeoff_dashboard.view).
function PlanCard({ doc, onProceed, isLastOpened, canProceed }) {
  const [expanded, setExpanded] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { url: thumbUrl } = usePresignedUrl(doc, 1, "thumb");

  return (
    <>
      <div
        className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-flex-shrink-0 tw-overflow-hidden hover:tw-shadow-md tw-transition-shadow"
        style={{ width: 280 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="tw-relative tw-h-[160px] tw-flex tw-items-center tw-justify-center tw-transition-colors"
          style={{ background: hovered ? "#dbeafe" : "#EEF3FC" }}
        >
          {thumbUrl && !imgErr ? (
            <img
              src={thumbUrl}
              alt={doc.label}
              onError={() => setImgErr(true)}
              style={{
                width: "calc(93% - 24px)",
                height: "calc(100% - 24px)",
                objectFit: "fill",
              }}
              className="tw-rounded"
            />
          ) : imgErr ? (
            <FileText size={44} className="tw-text-blue-200" />
          ) : (
            <div style={{ width: "calc(93% - 24px)", height: "calc(100% - 24px)" }} />
          )}
          {hovered && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(37,99,235,0.08)", pointerEvents: "none" }} />
          )}
          {/* Last opened badge */}
          {isLastOpened && (
            <div style={{
              position: "absolute", top: 8, left: 8,
              background: "#2563eb", color: "#fff",
              fontSize: 10, fontWeight: 700,
              padding: "2px 8px", borderRadius: 4,
              letterSpacing: "0.04em",
              pointerEvents: "none",
            }}>
              Last Opened
            </div>
          )}
          {/* Expand / view PDF — always visible (view permission) */}
          <button
            onClick={e => { e.stopPropagation(); setExpanded(true); }}
            className="tw-absolute tw-top-2 tw-right-2 tw-bg-white tw-border tw-border-gray-200 tw-rounded-sm tw-p-1 tw-shadow-sm hover:tw-bg-gray-50 tw-transition-colors"
            title="View PDF"
          >
            <i className="tw-w-5 tw-h-4 tw-block tw-text-gray-900 icon-Expansion" />
          </button>
        </div>

        <div className="tw-p-4">
          <p className="tw-font-bold tw-text-[14px] tw-text-gray-900 tw-mb-1.5 tw-truncate">{doc.label}</p>
          <div className="tw-flex tw-items-center tw-gap-1.5 tw-mb-3">
            <i className="icon-Pages tw-text-[#2563eb] tw-text-[13px]" />
            <span className="tw-text-[12px] tw-text-gray-500 tw-font-medium">{doc.n_pages} Pages</span>
          </div>

          {/* ── Proceed to Takeoff button ──────────────────────────────────────
              Hidden when proceed_to_takeoff permission is false.
              The card still shows with the PDF viewer so view-only users can
              still see documents — they just can't start a takeoff.
          ─────────────────────────────────────────────────────────────────── */}
          {canProceed && (
            <button
              onClick={() => onProceed(doc)}
              className="tw-w-full tw-bg-[#2563eb] hover:tw-bg-blue-700 tw-tracking-wide tw-text-white tw-rounded-[6px] tw-px-6 tw-py-2 tw-text-[14px] tw-font-medium tw-flex tw-items-center tw-transition-colors"
            >
              <span>Proceed to Takeoff</span>
              <i className="icon-Save-and-Continue tw-text-[18px] tw-ml-auto" />
            </button>
          )}
        </div>
      </div>

      {expanded && <PDFViewerModal doc={doc} onClose={() => setExpanded(false)} />}
    </>
  );
}

// ─── ScopeIcon ────────────────────────────────────────────────────────────────
function ScopeIcon({ scopeKey }) {
  const meta = SCOPE_META[scopeKey];
  if (!meta) return <Layers size={18} />;
  if (meta.icon) {
    return <i className={`tw-flex-shrink-0 ${meta.icon}`} style={{ fontSize: 26 }} />;
  }
  if (meta.LucideIcon) {
    const L = meta.LucideIcon;
    return <L size={18} className="tw-flex-shrink-0" />;
  }
  return <Layers size={18} />;
}

// ─── Scope Card ───────────────────────────────────────────────────────────────
function ScopeCard({ scopeKey, data }) {
  const label = SCOPE_META[scopeKey]?.label ?? scopeKey;
  const color = SCOPE_COLOR[scopeKey] ?? "#6B7280";

  if (!data?.content?.length) return null;

  const hasTags = Array.isArray(data.recommended_takeoff) && data.recommended_takeoff.length > 0;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
      paddingBottom: "20px"
    }}>
      <div style={{ backgroundColor: color, height: 8, flexShrink: 0, borderRadius: "12px 12px 0 0" }} />

      <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <ScopeIcon scopeKey={scopeKey} />
        <div>
          <p style={{ fontWeight: 700, fontSize: 15, color: "#111827", lineHeight: 1.3, margin: 0 }}>{label}</p>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{data.content.length} items</p>
        </div>
      </div>

      <div style={{ padding: "0 20px 16px", flex: 1 }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {data.content.map((item, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: color, flexShrink: 0, marginTop: 7,
              }} />
              <span style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.45 }}>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={{
        padding: "14px 20px 20px",
        background: "#f9fafb",
        borderTop: "1px solid #edeeef",
        borderBottom: "1px solid #edeeef",
        flexShrink: 0,
      }}>
        <p style={{
          fontSize: 11, fontWeight: 600, color: "#9fa6b1",
          letterSpacing: "0.06em", textTransform: "uppercase",
          margin: "0 0 10px",
        }}>
          Suggested Takeoffs
        </p>
        <div
          className="tags-scroll"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            height: 100,
            overflowY: "auto",
            alignContent: "flex-start",
            scrollbarWidth: "thin",
            scrollbarColor: "#3b82f6 #eff6ff",
          }}
        >
          {hasTags
            ? data.recommended_takeoff.map((tag, i) => (
              <span key={i} style={{
                fontSize: 12, color: "#374151",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                padding: "2px 10px",
                lineHeight: 1.6,
                alignSelf: "flex-start",
              }}>
                {tag}
              </span>
            ))
            : <span style={{ fontSize: 12, opacity: 0, lineHeight: 1.6 }}>—</span>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function TakeoffDashboard() {
  const navigate = useNavigate();
  const { data, isInitialLoad } = useRfpData("overview");
  const [docs, setDocs] = useState(null);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docsError, setDocsError] = useState(null);
  const [lastOpenedDocId, setLastOpenedDocId] = useState(null);
  const [planStudioEnabled, setPlanStudioEnabled] = useState(false);

  // ── Permission: read takeoff_dashboard.proceed_to_takeoff from Redux ─────────
  // Package gate (takeoff_dash) is already enforced by the sidebar visibility check.
  // Here we only need the fine-grained permission flag for the button.
  //   proceed_to_takeoff: true  → show "Proceed to Takeoff" button
  //   proceed_to_takeoff: false → hide button (user can still view PDFs)
  const permissionsList = useSelector((s) => s?.auth?.user?.[0]?.permission_info);
  const canProceed = permissionsList?.takeoff_dashboard?.proceed_to_takeoff !== false;

  // ── item_count: how many plan documents the user is allowed to see ────────────
  // takeoff_dash.item_count controls the PDF card list:
  //   item_count: null  → package disabled (sidebar already hides this page, but guard anyway)
  //   item_count: 0     → unlimited / no quota — show all documents
  //   item_count: 1+    → quota — show only the N most-recently-opened documents.
  //                       The last-opened document comes first; remaining slots filled
  //                       from the rest of the list in API order.
  // const docItemCount =
  //   packageInfo?.takeoff_engine?.children?.takeoff_dash?.item_count ?? 0;

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setDocsLoading(true);
        const res = await GetTakeoffDocuments({
          organization_uuid: localStorage.getItem("organization_uuid"),
          project_uuid: localStorage.getItem("project_uuid"),
        });
        const parsed = typeof res === "string" ? JSON.parse(res) : res;
        if (!parsed?.valid) throw new Error(parsed?.message || "Invalid response");

        const apiData = parsed.data ?? {};
        const documentsList = Array.isArray(apiData.documents) ? apiData.documents : (Array.isArray(apiData) ? apiData : []);
        const lastOpenedId = apiData.last_opened_document_id ?? null;
        const studioEnabled = apiData.plan_studio_enabled === true;

        setLastOpenedDocId(lastOpenedId);
        setPlanStudioEnabled(studioEnabled);

        const normalised = documentsList.map(d => ({
          document_id: d.document_id,
          label: d.document_name,
          n_pages: d.pages,
          images_folder_path: d.images_folder_path,
          thumbnails_folder_path: d.thumbnails_folder_path,
          scales: d.scales ?? {},
        }));
        setDocs(normalised);
      } catch (err) {
        setDocsError(err.message || "Failed to load plan documents.");
      } finally {
        setDocsLoading(false);
      }
    };
    fetchDocs();
  }, []);

  if (isInitialLoad || docsLoading) return <FullPageLoader />;

  const scope = data?.scope_of_work ?? {};

  const visibleScope = Object.entries(scope).filter(
    ([, sd]) => Array.isArray(sd?.content) && sd.content.length > 0
  );

  // ── Apply item_count quota to the document list ───────────────────────────
  // item_count: 0 or null → show all (unlimited).
  // item_count: N (1+)    → show only the first N docs in original API order.
  // Order is NEVER changed — always matches the API response order.
  // const visibleDocs = (() => {
  //   if (!docs?.length) return docs ?? [];
  //   const limit = docItemCount > 0 ? docItemCount : null;
  //   // return limit ? docs.slice(0, limit) : docs;
  //   return limit ? docs.slice(-limit) : docs;

  // })();

  const visibleDocs = docs ?? [];

  const handleProceed = async (doc) => {
    const projectUuid = localStorage.getItem("project_uuid");
    const organizationUuid = localStorage.getItem("organization_uuid");

    try {
      await setLastOpenedDocument({
        organization_uuid: organizationUuid,
        project_uuid: projectUuid,
        document_id: doc.document_id,
        device_info: getDeviceInfo(),
      });
    } catch {
      // Silently ignore — navigation should still proceed
    }

    navigate(`/project/view/${projectUuid}/takeoff-engine/plan-studio/${doc.document_id}`);
  };

  void planStudioEnabled
  return (
    <>
      <style>{SCROLLBAR_STYLE}</style>
      <div className="tw-min-h-screen tw-p-1 custom-scroll">

        {/* ── Plan PDFs ── */}
        <div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">Takeoff Engine</span>
            <i className="icon-Save-and-Continue" />
            <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">Takeoff Dashboard</span>
          </div>
          <p className="tw-text-[#1e293b] tw-text-[14px] tw-mb-3">View all uploaded plan PDFs alongside AI-suggested takeoff categories and proceed directly to quantity takeoff.</p>
        </div>
        <div style={{
          background: "#dbe0e7", borderRadius: 10, padding: 20,
          marginBottom: 32, border: "1px solid #dde6f5",
        }}>
          {docsError ? (
            <p style={{ fontSize: 14, color: "#ef4444", padding: 12 }}>{docsError}</p>
          ) : !visibleDocs?.length ? (
            <p style={{ fontSize: 14, color: "#9ca3af", padding: 12 }}>No plan documents found for this project.</p>
          ) : (
            <div className="custom-scroll" style={{ display: "flex", gap: 20, overflowX: "auto", paddingBottom: 4 }}>
              {visibleDocs.map(doc => (
                <PlanCard
                  key={doc.document_id}
                  doc={doc}
                  onProceed={handleProceed}
                  isLastOpened={docs.length > 1 && doc.document_id === lastOpenedDocId}
                  canProceed={canProceed}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Scope of Work ── */}
        <div style={{
          background: "#fff", borderRadius: 10,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          padding: "20px 24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0, whiteSpace: "nowrap" }}>
              Scope of Work
            </h2>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", whiteSpace: "nowrap" }}>
              AI-identified work categories
            </span>
          </div>
          <div style={{ height: 1, background: "#e5e7eb", margin: "0 -24px 20px" }} />

          {visibleScope.length === 0 ? (
            <p style={{ fontSize: 14, color: "#9ca3af" }}>No scope of work detected in this RFP document.</p>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
              alignItems: "stretch",
            }}>
              {visibleScope.map(([key, sd]) => (
                <ScopeCard key={key} scopeKey={key} data={sd} />
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}