import React, { useState, useEffect, useRef, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import CONFIG from "../../../../config/config";
import { decryptJSONHandler } from "../../../../utils/techus-SecureServiceUtils";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import { useLocation } from "react-router-dom";

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const pdfCache = new Map();

const getAuthToken = (isAdminPortal) =>
  localStorage.getItem(
    isAdminPortal ? "prexo_admin_access_token" : "prexo_organization_access_token"
  );

const fetchPdfArrayBuffer = async (s3Key, isAdminPortal) => {
  if (pdfCache.has(s3Key)) return pdfCache.get(s3Key).buffer.slice(0);
  const token = getAuthToken(isAdminPortal);
  const url = `${CONFIG.VITE_API_URL}/project/get-pdf-stream?s3_key=${encodeURIComponent(s3Key)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!response.ok)
    throw new Error(`PDF fetch failed: ${response.status} ${response.statusText}`);
  const json = await response.json();
  if (!json?.edata) throw new Error("No PDF available for this item.");
  let decrypted;
  try { decrypted = decryptJSONHandler(json); }
  catch { decrypted = decryptJSONHandler(json.edata); }
  let buffer;
  if (decrypted?.type === "Buffer" && Array.isArray(decrypted?.data)) {
    buffer = new Uint8Array(decrypted.data).buffer;
  } else if (Array.isArray(decrypted)) {
    buffer = new Uint8Array(decrypted).buffer;
  } else if (typeof decrypted === "string") {
    const binary = atob(decrypted);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    buffer = bytes.buffer;
  } else {
    throw new Error(`Unrecognised decrypted format: ${typeof decrypted}`);
  }
  const bytes = new Uint8Array(buffer);
  pdfCache.set(s3Key, bytes);
  return bytes.buffer.slice(0);
};

export const preloadPdf = (s3Key, isAdminPortal = false) => {
  if (!s3Key || pdfCache.has(s3Key)) return;
  fetchPdfArrayBuffer(s3Key, isAdminPortal).catch(() => {});
};

// ─── Normalise text for comparison ───────────────────────────────────────────
const norm = (t) =>
  (t || "")
    .toLowerCase()
    // Normalise all quote/apostrophe variants to plain ASCII
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035']/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036"]/g, '"')
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();

// ─── Build a searchable index from text-layer spans ───────────────────────────
const buildSpanIndex = (spans) => {
  let fullText = "";
  const spanRanges = [];
  for (const span of spans) {
    const raw = span.textContent || "";
    if (!raw.trim()) continue;
    const n = norm(raw);
    if (!n) continue;
    if (fullText.length > 0) fullText += " ";
    const start = fullText.length;
    fullText += n;
    spanRanges.push({ span, start, end: fullText.length });
  }
  return { fullText, spanRanges };
};

// ─── Apply highlight to spans overlapping a match range ──────────────────────
const applyHighlight = (spanRanges, matchStart, matchEnd, color, seen) => {
  let applied = false;
  for (const { span, start, end } of spanRanges) {
    if (start < matchEnd && end > matchStart && !seen.has(span)) {
      seen.add(span);
      span.classList.add("pdf-highlight");
      if (color) span.style.backgroundColor = color;
      applied = true;
    }
  }
  return applied;
};

// ─── Score a match: ratio of matched chars vs search length ──────────────────
// Returns 0–1. We require ≥0.25 to accept (i.e. at least 25% of the search
// string was found) — this is the key gate that stops false positives.
const scoreMatch = (matchLen, searchLen) => {
  if (!searchLen) return 0;
  return matchLen / searchLen;
};

const MIN_SCORE = 0.25; // minimum fraction of search text that must match

// ─── Find the best matching substring in fullText ────────────────────────────
const findInText = (fullText, fragment) => {
  const search = norm(fragment);
  if (!search || search.length < 4) return { index: -1, length: 0, score: 0 };

  // S1: exact match — highest confidence
  let idx = fullText.indexOf(search);
  if (idx !== -1) return { index: idx, length: search.length, score: 1 };

  // S2: leading 90 chars
  const lead = search.substring(0, Math.min(90, search.length));
  if (lead.length >= 10) {
    idx = fullText.indexOf(lead);
    if (idx !== -1) {
      const sc = scoreMatch(lead.length, search.length);
      if (sc >= MIN_SCORE) return { index: idx, length: lead.length, score: sc };
    }
  }

  // S3: trailing 90 chars
  const tail = search.substring(Math.max(0, search.length - 90));
  if (tail.length >= 10) {
    idx = fullText.indexOf(tail);
    if (idx !== -1) {
      const sc = scoreMatch(tail.length, search.length);
      if (sc >= MIN_SCORE) return { index: idx, length: tail.length, score: sc };
    }
  }

  // S4-S7: sliding word windows — require score gate
  const words = search.split(" ").filter((w) => w.length >= 2);
  for (const size of [8, 6, 5, 4, 3]) {
    if (words.length < size) continue;
    for (let i = 0; i <= words.length - size; i++) {
      const phrase = words.slice(i, i + size).join(" ");
      idx = fullText.indexOf(phrase);
      if (idx !== -1) {
        const sc = scoreMatch(phrase.length, search.length);
        if (sc >= MIN_SCORE) return { index: idx, length: phrase.length, score: sc };
      }
    }
  }

  // S8: any 2 consecutive long words — only if the search is short overall
  // (if search is long and we only match 2 words, score will be < MIN_SCORE anyway)
  const longWords = search.split(" ").filter((w) => w.length >= 6);
  for (let i = 0; i <= longWords.length - 2; i++) {
    const phrase = longWords.slice(i, i + 2).join(" ");
    idx = fullText.indexOf(phrase);
    if (idx !== -1) {
      const sc = scoreMatch(phrase.length, search.length);
      if (sc >= MIN_SCORE) return { index: idx, length: phrase.length, score: sc };
    }
  }

  return { index: -1, length: 0, score: 0 };
};

// ─── Split snippet at ellipsis / sentence boundaries ─────────────────────────
const splitFragments = (raw) => {
  const cleaned = (raw || "")
    .replace(/^["'"\u201C\u201D\s]+|["'"\u201C\u201D\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const parts = cleaned.split(/\.{2,}|…/);
  const frags = [];
  for (const part of parts) {
    const subs = part
      .split(/\.\s+(?=[A-Z"(])/)
      .map((s) => s.replace(/^[\s.,;"'"]+|[\s.,;"'"]+$/g, "").trim())
      .filter((s) => s.length >= 8);
    frags.push(...subs);
  }
  return [...new Set(frags)];
};

// ─── Run highlight on one page wrapper ───────────────────────────────────────
const runHighlightForPage = (pageWrapper, highlights, pageNum) => {
  const textLayer = pageWrapper.querySelector(".react-pdf__Page__textContent");
  if (!textLayer) return false;

  const spans = Array.from(textLayer.querySelectorAll("span"));
  if (spans.length === 0) return false;

  const pageHighlights = highlights.filter((h) => {
    const p = Number(h.pageIndex);
    return p + 1 === Number(pageNum) || p === Number(pageNum);
  });
  if (pageHighlights.length === 0) return false;

  spans.forEach((s) => {
    s.classList.remove("pdf-highlight");
    s.style.backgroundColor = "";
  });

  const { fullText, spanRanges } = buildSpanIndex(spans);
  let anyApplied = false;

  for (const highlight of pageHighlights) {
    if (!highlight?.text) continue;

    const color = highlight.color || "rgba(255,255,0,0.6)";
    const seen = new Set();
    let count = 0;

    const fragments = splitFragments(highlight.text);

    for (const frag of fragments) {
      const { index: mStart, length: mLen, score } = findInText(fullText, frag);
      if (mStart === -1 || score < MIN_SCORE) continue;
      if (applyHighlight(spanRanges, mStart, mStart + mLen, color, seen)) count++;
    }

    // Fallback: try the whole snippet as-is
    if (count === 0) {
      const { index: mStart, length: mLen, score } = findInText(fullText, highlight.text);
      if (mStart !== -1 && score >= MIN_SCORE) {
        if (applyHighlight(spanRanges, mStart, mStart + mLen, color, seen)) count++;
      }
    }

    if (count > 0) anyApplied = true;
  }

  return anyApplied;
};

// ─── Cross-page search: find which rendered page actually contains the text ──
// Returns pageNum (number) or null if not found.
const findPageWithText = (pageRefs, highlights, candidatePages) => {
  // Build a wider search window: candidate pages ± 5, clamped to rendered range
  const allPageNums = Object.keys(pageRefs).map(Number).filter((n) => n > 0);
  if (allPageNums.length === 0) return null;

  const minPage = Math.min(...allPageNums);
  const maxPage = Math.max(...allPageNums);

  const searchSet = new Set();
  for (const cp of candidatePages) {
    for (let delta = -5; delta <= 5; delta++) {
      const p = cp + delta;
      if (p >= minPage && p <= maxPage) searchSet.add(p);
    }
  }

  // Search through each candidate page's text layer
  for (const pageNum of [...searchSet].sort((a, b) => {
    // Prioritise pages closest to the originally requested page
    const centerPage = candidatePages[0] || pageNum;
    return Math.abs(a - centerPage) - Math.abs(b - centerPage);
  })) {
    const wrapper = pageRefs[pageNum];
    if (!wrapper) continue;

    const textLayer = wrapper.querySelector(".react-pdf__Page__textContent");
    if (!textLayer) continue;
    const spans = Array.from(textLayer.querySelectorAll("span"));
    if (spans.length === 0) continue;

    const { fullText } = buildSpanIndex(spans);

    for (const highlight of highlights) {
      if (!highlight?.text) continue;
      const fragments = splitFragments(highlight.text);
      for (const frag of fragments) {
        const { index, score } = findInText(fullText, frag);
        if (index !== -1 && score >= MIN_SCORE) {
          return pageNum; // found it!
        }
      }
      // Also try full snippet
      const { index, score } = findInText(fullText, highlight.text);
      if (index !== -1 && score >= MIN_SCORE) {
        return pageNum;
      }
    }
  }

  return null;
};

// ─── Wait for text layer to be populated ─────────────────────────────────────
const waitForTextLayer = (pageWrapper, timeout = 7000) =>
  new Promise((resolve) => {
    const ready = () => {
      const tl = pageWrapper.querySelector(".react-pdf__Page__textContent");
      return tl && tl.querySelectorAll("span").length > 0;
    };
    if (ready()) { resolve(true); return; }
    const obs = new MutationObserver(() => {
      if (ready()) { obs.disconnect(); resolve(true); }
    });
    obs.observe(pageWrapper, { childList: true, subtree: true });
    setTimeout(() => { obs.disconnect(); resolve(false); }, timeout);
  });

const scrollToFirst = (wrapper) => {
  setTimeout(() => {
    const first = wrapper.querySelector(".react-pdf__Page__textContent .pdf-highlight");
    if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 150);
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function PdfHighlightViewer({
  rfpS3Key, page = 1, highlights = [], pagesRange = null, onError,
}) {
  const location = useLocation();
  const isAdminPortal = location.pathname.startsWith("/admin");

  const [pdfData, setPdfData]       = useState(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError]     = useState(null);
  const [numPages, setNumPages]     = useState(null);

  // Track extra pages that cross-page search added to the render list
  const [extraPages, setExtraPages] = useState([]);

  const pageRefs  = useRef({});
  const hlState   = useRef({});
  // Ref to track pages currently being searched cross-page (avoid duplicate searches)
  const crossPageSearched = useRef(false);

  const pagesToDisplay = useMemo(() => {
    const pages = [];
    if (pagesRange) {
      pagesRange.split(",").forEach((part) => {
        const t = part.trim();
        if (t.includes("-")) {
          const [s, e] = t.split("-").map((p) => parseInt(p.trim(), 10));
          if (!isNaN(s) && !isNaN(e)) for (let i = s; i <= e; i++) if (!pages.includes(i)) pages.push(i);
        } else {
          const n = parseInt(t, 10);
          if (!isNaN(n) && !pages.includes(n)) pages.push(n);
        }
      });
    }
    if (pages.length === 0 && page) pages.push(page);

    // Merge in any extra pages found by cross-page search
    for (const ep of extraPages) {
      if (!pages.includes(ep)) pages.push(ep);
    }

    return pages.sort((a, b) => a - b);
  }, [pagesRange, page, extraPages]);

  // Reset when key props change
  useEffect(() => {
    if (!rfpS3Key) return;
    let cancelled = false;
    hlState.current = {};
    crossPageSearched.current = false;
    setExtraPages([]);
    (async () => {
      setUrlLoading(true); setUrlError(null); setPdfData(null);
      try {
        const ab = await fetchPdfArrayBuffer(rfpS3Key, isAdminPortal);
        if (!cancelled) setPdfData({ data: ab });
      } catch (err) {
        if (!cancelled) {
          showToast("error", err?.message || "Failed to load PDF.");
          setUrlError(err?.message || "Failed to load PDF.");
          onError?.();
        }
      } finally { if (!cancelled) setUrlLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [rfpS3Key, isAdminPortal]);

  useEffect(() => {
    hlState.current = {};
    crossPageSearched.current = false;
    setExtraPages([]);
  }, [page, highlights, pagesRange, rfpS3Key]);

  // ─── Attempt to highlight one page; if nothing matches, try cross-page search
  const scheduleHighlight = async (pageNum) => {
    if (hlState.current[pageNum] === "done" || hlState.current[pageNum] === "pending") return;

    const relevant = highlights.filter((h) => {
      const p = Number(h.pageIndex);
      return p + 1 === Number(pageNum) || p === Number(pageNum);
    });
    if (relevant.length === 0) return;

    hlState.current[pageNum] = "pending";
    const wrapper = pageRefs.current[pageNum];
    if (!wrapper) { hlState.current[pageNum] = "idle"; return; }

    const ready = await waitForTextLayer(wrapper, 7000);
    if (!ready) { hlState.current[pageNum] = "failed"; return; }

    await new Promise((r) => setTimeout(r, 150));
    const applied = runHighlightForPage(wrapper, highlights, pageNum);

    if (applied) {
      hlState.current[pageNum] = "done";
      scrollToFirst(wrapper);
      return;
    }

    // ── Nothing matched on this page — try a retry first (text layer may still be settling)
    hlState.current[pageNum] = "idle";
    await new Promise((r) => setTimeout(r, 800));
    if (hlState.current[pageNum] === "done") return;

    hlState.current[pageNum] = "pending";
    const retried = runHighlightForPage(wrapper, highlights, pageNum);
    if (retried) {
      hlState.current[pageNum] = "done";
      scrollToFirst(wrapper);
      return;
    }

    hlState.current[pageNum] = "failed";

    // ── Cross-page search: run once per highlight session to avoid loops
    if (crossPageSearched.current) return;
    crossPageSearched.current = true;

    console.log(`[PdfHighlightViewer] Page ${pageNum} had no match — scanning nearby pages for text...`);

    // Wait a little so nearby pages have had time to render their text layers
    await new Promise((r) => setTimeout(r, 500));

    const candidatePages = pagesToDisplay;
    const foundPage = findPageWithText(pageRefs.current, relevant, candidatePages, numPages || 9999);

    if (foundPage && foundPage !== pageNum) {
      console.log(`[PdfHighlightViewer] Found matching text on page ${foundPage} — adding to view and highlighting.`);

      // Add the found page to the render list if it's not already there
      setExtraPages((prev) => {
        if (prev.includes(foundPage)) return prev;
        return [...prev, foundPage];
      });

      // After React re-renders and the new page renders, highlight it
      // We poll for the wrapper to appear (up to 5 s)
      let attempts = 0;
      const tryHighlight = async () => {
        attempts++;
        const newWrapper = pageRefs.current[foundPage];
        if (!newWrapper) {
          if (attempts < 20) setTimeout(tryHighlight, 250);
          return;
        }
        const newReady = await waitForTextLayer(newWrapper, 5000);
        if (!newReady) return;

        await new Promise((r) => setTimeout(r, 200));

        // Remap highlights to the found page so the highlighter picks them up
        const remapped = relevant.map((h) => ({ ...h, pageIndex: foundPage - 1 }));
        const newWrapper2 = pageRefs.current[foundPage];
        if (!newWrapper2) return;

        const textLayer = newWrapper2.querySelector(".react-pdf__Page__textContent");
        if (!textLayer) return;
        const spans = Array.from(textLayer.querySelectorAll("span"));
        spans.forEach((s) => { s.classList.remove("pdf-highlight"); s.style.backgroundColor = ""; });

        const { fullText, spanRanges } = buildSpanIndex(spans);
        let anyApplied = false;

        for (const highlight of remapped) {
          if (!highlight?.text) continue;
          const color = highlight.color || "rgba(255,255,0,0.6)";
          const seen = new Set();
          let count = 0;

          for (const frag of splitFragments(highlight.text)) {
            const { index: mStart, length: mLen, score } = findInText(fullText, frag);
            if (mStart === -1 || score < MIN_SCORE) continue;
            if (applyHighlight(spanRanges, mStart, mStart + mLen, color, seen)) count++;
          }
          if (count === 0) {
            const { index: mStart, length: mLen, score } = findInText(fullText, highlight.text);
            if (mStart !== -1 && score >= MIN_SCORE) {
              applyHighlight(spanRanges, mStart, mStart + mLen, color, seen);
            }
          }
          if (seen.size > 0) anyApplied = true;
        }

        if (anyApplied) {
          hlState.current[foundPage] = "done";
          scrollToFirst(newWrapper2);
        }
      };

      setTimeout(tryHighlight, 300);
    } else {
      console.warn(`[PdfHighlightViewer] Could not find matching text on any nearby page for highlight: "${relevant[0]?.text?.substring(0, 80)}"`);
    }
  };

  const handleTextLayerSuccess = (pageNum) => {
    if (hlState.current[pageNum] !== "done") hlState.current[pageNum] = "idle";
    scheduleHighlight(pageNum);
  };

  if (!rfpS3Key)
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-full tw-bg-gray-100">
        <p className="tw-text-gray-500">No PDF available</p>
      </div>
    );
  if (urlLoading) return <FullPageLoader />;
  if (urlError)   return null;
  if (!pdfData)   return null;
  void numPages;

  return (
    <div className="tw-h-full tw-overflow-auto tw-bg-gray-100">
      <Document
        file={pdfData}
        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        loading={<FullPageLoader />}
        error={
          <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
            <p className="tw-text-red-600">Failed to load PDF</p>
          </div>
        }
      >
        {pagesToDisplay.map((pageNum) => (
          <div
            key={`${rfpS3Key}-${pageNum}`}
            className="tw-mb-4"
            ref={(ref) => { if (ref) pageRefs.current[pageNum] = ref; }}
          >
            <Page
              pageNumber={pageNum}
              renderTextLayer={true}
              renderAnnotationLayer={false}
              onRenderTextLayerSuccess={() => handleTextLayerSuccess(pageNum)}
              width={800}
              className="tw-mx-auto"
            />
            {pagesToDisplay.length > 1 && (
              <div className="tw-text-center tw-py-2 tw-text-sm tw-text-gray-600">
                Page {pageNum}
              </div>
            )}
          </div>
        ))}
      </Document>
    </div>
  );
}