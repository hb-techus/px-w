import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, FileText, ChevronDown, X, Loader2 } from "lucide-react";
import { CreateChat, GetChatList } from "../../../../services/techus-services";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import PdfHighlightViewer from "./PdfHighlightViewer";
import usePermissions from "../../../Common/usePermissions";
import UpgradeCard from "../../../../genriccomponents/UpgradeCard";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const getRfpS3Key = (ref) => {
  const project_uuid = localStorage.getItem("project_uuid");
  return `projects/project_${project_uuid}/rfp/${ref.pdf_name}`;
};
const suggestedQuestions = [
  "What are the key submission deadlines?",
  "What are the insurance requirements?",
  "Summarize the evaluation criteria",
  "What are the DBE participation requirements?",
];

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// ── Minimal Markdown renderer ─────────────────────────────────────────────────
function MarkdownText({ content }) {
  if (!content) return null;
  const lines = content.split("\n");
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }
    if (/^[-*]\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^[-*]\s/, "")); i++; }
      elements.push(<ul key={i} className="tw-list-disc tw-pl-5 tw-space-y-1 tw-my-2">{items.map((item, idx) => <li key={idx} className="tw-text-sm tw-leading-relaxed"><InlineMarkdown text={item} /></li>)}</ul>);
      continue;
    }
    if (/^\d+\.\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s/, "")); i++; }
      elements.push(<ol key={i} className="tw-list-decimal tw-pl-5 tw-space-y-1 tw-my-2">{items.map((item, idx) => <li key={idx} className="tw-text-sm tw-leading-relaxed"><InlineMarkdown text={item} /></li>)}</ol>);
      continue;
    }
    elements.push(<p key={i} className="tw-text-sm tw-leading-relaxed tw-my-1"><InlineMarkdown text={line} /></p>);
    i++;
  }
  return <div className="tw-space-y-0.5">{elements}</div>;
}

function InlineMarkdown({ text }) {
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: "text", value: text.slice(last, match.index) });
    const raw = match[0];
    if (raw.startsWith("**")) parts.push({ type: "bold", value: raw.slice(2, -2) });
    else if (raw.startsWith("*")) parts.push({ type: "italic", value: raw.slice(1, -1) });
    else if (raw.startsWith("`")) parts.push({ type: "code", value: raw.slice(1, -1) });
    last = match.index + raw.length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return (
    <>
      {parts.map((p, i) => {
        if (p.type === "bold") return <strong key={i} className="tw-font-semibold">{p.value}</strong>;
        if (p.type === "italic") return <em key={i}>{p.value}</em>;
        if (p.type === "code") return <code key={i} className="tw-bg-gray-100 tw-px-1 tw-rounded tw-text-xs tw-font-mono">{p.value}</code>;
        return <span key={i}>{p.value}</span>;
      })}
    </>
  );
}

// 
const buildHighlightsFromRef = (ref) => {
  if (!ref?.text) return [];
  return [{
    pageIndex: ref.page,   // PdfHighlightViewer accepts both 0-based and 1-based
    text: ref.text,
    color: 'rgba(68,136,255,0.35)',   // same blue used for "medium" in RiskIdentifier
  }];
};

function LockedMessages({ lockedCount, onUpgrade }) {
  const description = lockedCount > 0
    ? `You've reached your conversation limit. ${lockedCount} older message${lockedCount !== 1 ? "s are" : " is"} locked. Upgrade your package to view full conversation history.`
    : `You've reached your conversation turn limit. Upgrade your package to continue chatting.`

  return (
    <div className="tw-relative tw-overflow-hidden tw-rounded-[20px] tw-border tw-border-[#d9dee8] tw-bg-white tw-mb-4">
  <div style={{ position: "relative", userSelect: "none", pointerEvents: "none", minHeight: "400px", filter: "blur(3px)" }}>
    {[1, 2, 3, 4].map((_, i) => (
          <div key={i} className={`tw-flex tw-gap-4 tw-w-full tw-p-4 ${i % 2 === 0 ? "tw-justify-end" : "tw-justify-start"}`}>
            {i % 2 !== 0 && (
              <div className="tw-w-9 tw-h-9 tw-rounded-full tw-bg-blue-100 tw-flex-shrink-0" />
            )}
            <div className={`tw-rounded-[10px] tw-p-4 tw-w-[60%] tw-h-16 ${i % 2 === 0 ? "tw-bg-[#48f]" : "tw-bg-white tw-border tw-border-gray-200"}`} />
            {i % 2 === 0 && (
              <div className="tw-w-9 tw-h-9 tw-rounded-full tw-bg-gray-200 tw-flex-shrink-0" />
            )}
          </div>
        ))}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255,255,255,0.42)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 10 }} />
      </div>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", zIndex: 20 }}>
        <UpgradeCard
          title="Unlock Full Conversation History!"
          description={description}
          buttonLabel="Upgrade Your Package"
          onUpgrade={onUpgrade}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QACopilot() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(1);
  const [selectedPdfS3Key, setSelectedPdfS3Key] = useState(null); // ← dynamic
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedRefs, setExpandedRefs] = useState(new Set());
  const messagesEndRef = useRef(null);
  const { permissions, packagePermissions } = usePermissions('bid_advisor', 'bid_intelligence');
  const organization_uuid = localStorage.getItem("organization_uuid");
  const project_uuid = localStorage.getItem("project_uuid");
  const [selectedRef, setSelectedRef] = useState(null);   // ← add this
const navigate = useNavigate();
const packageList = useSelector((s) => s?.auth?.user?.[0]?.package_info);
const conversationTurnCount = messages.filter(m => m.role === 'user').length
const [showLimitCard, setShowLimitCard] = useState(false)
// Bid advisor message limit
const bidAdvisorNode = packageList?.bid_intelligence?.children?.bid_advisor;
const msgItemCount = bidAdvisorNode?.item_count ?? null;
// item_count means max visible messages (each Q&A pair = 2 messages)
const VISIBLE_MSG_COUNT = (msgItemCount && msgItemCount > 0) ? msgItemCount * 2 : null;
const limitCardRef = useRef(null)
const handleUpgradeClick = () => {
  const isAdminPortal = window.location.pathname.startsWith("/admin");
  navigate(isAdminPortal ? "/admin/packages" : "/packages");
};
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Load chat history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const res = await GetChatList({ organization_uuid, project_uuid });
        let d = res?.data || res;
        if (typeof d === "string") d = JSON.parse(d);
        if (d?.valid && Array.isArray(d.data) && d.data.length > 0) {
          const history = d.data.flatMap(item => [
            { role: "user", content: item.question, timestamp: formatTime(item.created_date), references: [] },
            {
              role: "assistant", content: item.answer, timestamp: formatTime(item.created_date),
              references: Array.isArray(item.references)
                ? item.references.map(r => ({ ...r, text: r.text ?? r.content }))
                : [],
              chat_uuid: item.chat_uuid,
            },
          ]);
          setMessages(history);
         
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, [organization_uuid, project_uuid]);

  // Send message
  const handleSend = useCallback(async () => {
      const question = inputValue.trim()
  if (!question || isSending) return

  // Check conversation limit
if (msgItemCount && msgItemCount > 0 && conversationTurnCount >= msgItemCount) {
  setShowLimitCard(true)
  setTimeout(() => limitCardRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  return
}
    
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { role: "user", content: question, timestamp: now, references: [] }]);
    setInputValue("");
    setShowLimitCard(false)
    setIsSending(true);
    try {
      const res = await CreateChat({ organization_uuid, project_uuid, question });
      let d = res?.data || res;
      if (typeof d === "string") d = JSON.parse(d);
      if (d?.valid) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: d.data.answer,
          timestamp: now,
          references: Array.isArray(d.data.references)
            ? d.data.references.map(r => ({ ...r, text: r.text ?? r.content }))
            : [],
          chat_uuid: d.data.chat_uuid,
        }]);
      } else {
        showToast("error", d?.message || "Failed to get response");
        setMessages(prev => prev.slice(0, -1));
        setInputValue(question);
      }
    } catch (err) {
      console.error("Create chat error:", err);
      showToast("error", "Failed to send message");
      setMessages(prev => prev.slice(0, -1));
      setInputValue(question);
    } finally {
      setIsSending(false);
    }
  }, [inputValue, isSending, organization_uuid, project_uuid]);

  // ─── Open PDF viewer with dynamic S3 key ────────────────────────────────────
  const handleViewPdf = (ref) => {
    setSelectedPage(ref.page);
    setSelectedPdfS3Key(getRfpS3Key(ref));
    setSelectedRef(ref);
    setIsPdfOpen(true);
  };
  const toggleRef = (index) => {
    setExpandedRefs(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  if (isLoading) return <FullPageLoader />;

  void setIsExpanded
  void packagePermissions
  // Add just before the return statement
const visibleMessages = (VISIBLE_MSG_COUNT && messages.length > VISIBLE_MSG_COUNT)
  ? messages.slice(messages.length - VISIBLE_MSG_COUNT)
  : messages;
  return (
    <>
      <div className="tw-flex tw-flex-col tw-p-1 tw-overflow-hidden" style={{ height: "calc(100vh - 80px)" }}>
        <div className="tw-my-4">
          <div className="tw-flex tw-items-center tw-gap-2 ">
            <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">Bid Intelligence</span>
            <i className="icon-Save-and-Continue" />
            <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">Bid Advisor</span>
          </div>
          <p className="tw-text-[#1e293b] tw-text-[14px]">Ask plain-English questions about your RFP and get instant, cited answers with exact page references.</p>
        </div>
        {/* Messages */}
        <div className="tw-flex-1 tw-overflow-y-auto tw-min-h-0 tw-p-6">
          <div className="tw-space-y-6">

            {messages.length === 0 && (
              <div className="tw-text-center tw-py-12">
                <div className="tw-w-16 tw-h-16 tw-rounded-full tw-bg-blue-100 tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-4">
                  <i className="icon-AI-fill tw-text-[24px] tw-text-[#4488ff]" />
                </div>
                <h2 className="tw-text-xl tw-font-semibold tw-text-gray-900 tw-mb-2">RFP Q&A Copilot</h2>
                <p className="tw-text-sm tw-text-gray-600 tw-max-w-md tw-mx-auto">
                  Ask any question about the RFP documents and I'll find the answer for you with references to the source.
                </p>
              </div>
            )}

           

           {visibleMessages.map((msg, i) => (
              <div key={i} className={`tw-flex tw-gap-4 tw-w-full ${msg.role === "user" ? "tw-justify-end" : "tw-justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="tw-w-9 tw-h-9 tw-rounded-full tw-bg-blue-100 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-mt-1">
                    <i className="icon-AI-fill tw-text-[24px] tw-text-[#4488ff]" />
                  </div>
                )}
                <div className={`tw-rounded-[10px] tw-p-4 tw-max-w-[85%] ${msg.role === "user" ? "tw-bg-[#48f] tw-text-white" : "tw-bg-white tw-border tw-border-gray-200 tw-shadow-sm"}`}>
                  {msg.role === "assistant"
                    ? <MarkdownText content={msg.content} />
                    : <p className="tw-text-[16px] tw-whitespace-pre-wrap tw-leading-relaxed">{msg.content}</p>}

                  {/* References */}
                  {msg.references?.length > 0 && (
                    <div className="tw-mt-4 tw-pt-3 tw-border-t tw-border-gray-200">
                      <button onClick={() => toggleRef(i)} className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-blue-600 tw-font-medium hover:tw-underline">
                        <FileText className="tw-w-3.5 tw-h-3.5" />
                        <span>{msg.references.length} Reference{msg.references.length > 1 ? "s" : ""}</span>
                        <ChevronDown className={`tw-w-3.5 tw-h-3.5 tw-transition-transform ${expandedRefs.has(i) ? "tw-rotate-180" : ""}`} />
                      </button>
                      {expandedRefs.has(i) && (
                        <div className="tw-mt-3 tw-space-y-2">
                          {msg.references.map((ref, ri) => (
                            <div key={ri} className="tw-bg-gray-50 tw-rounded-lg tw-p-3 tw-border-l-2 tw-border-blue-600">
                              <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
                                <div className="tw-space-y-1 tw-flex-1">
                                  {ref.page && (
                                    <div className="tw-flex tw-items-center tw-gap-2">
                                      <span className="tw-text-xs tw-font-semibold tw-text-blue-600">Page {ref.page}</span>
                                      {/* {ref.pdf_name && (
                                      <span className="tw-text-xs tw-text-gray-400 tw-truncate tw-max-w-[140px]" title={ref.pdf_name}>
                                        {ref.pdf_name}
                                      </span>
                                    )} */}
                                    </div>
                                  )}
                                  {ref.text && <p className="tw-text-xs tw-text-gray-700 tw-italic tw-leading-relaxed">"{ref.text}"</p>}
                                </div>
                                {ref.page && ref.pdf_name && (
                                  <button
                                    // onClick={() => handleViewPdf(ref.page, ref.pdf_name)}
                                    onClick={() => handleViewPdf(ref)}
                                    className="tw-flex-shrink-0 tw-h-7 tw-px-2 tw-bg-[#0140c1] tw-text-white tw-rounded-md tw-text-xs tw-font-medium tw-flex tw-items-center tw-gap-1 hover:tw-bg-blue-800 tw-transition-colors"
                                  >
                                    <FileText className="tw-w-3 tw-h-3" /> View in PDF
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <span className={`tw-text-[14px] tw-mt-2 tw-block ${msg.role === "user" ? "tw-text-white tw-opacity-70" : "tw-text-gray-500"}`}>
                    {msg.timestamp}
                  </span>
                </div>
                {msg.role === "user" && (
                  <div className="tw-w-9 tw-h-9 tw-rounded-full tw-bg-gray-200 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-mt-1">
                    <span className="tw-flex tw-items-center tw-justify-center">
                      <i className="icon-Profile tw-text-[#8d8d8d] tw-text-[24px] tw-leading-none" />
                    </span>
                  </div>
                )}
              </div>
            ))}
{showLimitCard && (
  <div ref={limitCardRef}>
    <LockedMessages lockedCount={0} onUpgrade={handleUpgradeClick} />
  </div>
)}
            {isSending && (
              <div className="tw-flex tw-gap-4 tw-justify-start">
                <div className="tw-w-9 tw-h-9 tw-rounded-full tw-bg-blue-100 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <i className="icon-AI-fill tw-text-[24px] tw-text-[#4488ff]" />
                </div>
                <div className="tw-bg-white tw-border tw-border-gray-200 tw-shadow-sm tw-rounded-xl tw-px-5 tw-py-4 tw-flex tw-items-center tw-gap-1.5">
                  <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-gray-400 tw-animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-gray-400 tw-animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-gray-400 tw-animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="tw-border-t tw-border-gray-200 tw-bg-white tw-flex-shrink-0 tw-relative tw-rounded-md">

          {/* full-width background layer */}
          <div className="tw-absolute tw-inset-0 tw-bg-white" />

          {/* actual content aligned with parent padding */}
          <div className="tw-relative tw-px-8 tw-py-4">

            <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3 tw-flex-wrap">
              <i className="icon-AI-fill tw-text-[20px] tw-text-[#4488ff]" />
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInputValue(q)}
                  disabled={isSending}
                  className="tw-text-xs tw-px-3 tw-py-1.5 tw-rounded-full tw-bg-gray-100 hover:tw-bg-gray-200 tw-text-gray-700 tw-transition-colors tw-border tw-border-gray-300 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="tw-flex tw-gap-3">
              <input
                type="text"
                placeholder={permissions?.conversation ? "Ask a question about the RFP..." : "You don't have permission to send messages"}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === "Enter" && permissions?.conversation && handleSend()}
                disabled={isSending || !permissions?.conversation}
                className="tw-flex-1 tw-h-11 tw-bg-gray-50 tw-border tw-border-gray-300 tw-rounded-md tw-px-4 tw-py-2 tw-text-sm tw-text-gray-900 placeholder:tw-text-gray-500 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500 disabled:tw-opacity-60 disabled:tw-cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isSending || !permissions?.conversation}
                className="tw-h-11 tw-w-11 tw-bg-blue-600 tw-text-white tw-rounded-md hover:tw-bg-blue-700 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-flex tw-items-center tw-justify-center tw-transition-colors tw-flex-shrink-0"
              >
                {isSending
                  ? <Loader2 className="tw-w-5 tw-h-5 tw-animate-spin" />
                  : <Send className="tw-w-5 tw-h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ─── PDF Viewer Overlay ──────────────────────────────────────────────── */}
        {isPdfOpen && selectedPdfS3Key && (
          <>
            <div className={`tw-fixed tw-inset-y-0 tw-right-0 tw-bg-white tw-shadow-2xl tw-z-50 tw-flex tw-flex-col tw-transition-all tw-duration-300 ${isExpanded ? "tw-w-full" : "tw-w-1/2"}`}>
              <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-2 tw-border-b tw-bg-white">
                <div className="tw-flex tw-items-center tw-gap-2">
                  <FileText className="tw-w-4 tw-h-4 tw-text-blue-400" />
                  <span className="tw-text-sm tw-font-medium tw-text-gray-700">PDF Reference</span>
                </div>
                <span className="tw-text-sm tw-font-medium tw-text-gray-700">Page {selectedPage}</span>
                <div className="tw-flex tw-items-center tw-gap-2">
                  <button onClick={() => setIsPdfOpen(false)} className="tw-p-1.5 tw-rounded hover:tw-bg-gray-200">
                    <X className="tw-w-4 tw-h-4" />
                  </button>
                </div>
              </div>
              <div className="tw-flex-1 tw-overflow-hidden tw-bg-gray-100">
                <PdfHighlightViewer
                  rfpS3Key={selectedPdfS3Key}
                  page={selectedPage}
                  pagesRange={String(selectedPage)}
                  highlights={selectedRef ? buildHighlightsFromRef(selectedRef) : []}
                />
              </div>
            </div>
            <div className="tw-fixed tw-inset-0 tw-bg-black/20 tw-z-40" onClick={() => setIsPdfOpen(false)} />
          </>
        )}
      </div>
    </>
  );
}