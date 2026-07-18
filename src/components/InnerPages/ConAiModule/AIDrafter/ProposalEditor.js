


import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';


const modules = {
    toolbar: {
        container: [
            ["bold", "italic", "underline"],
            [{ size: ["small", false, "large", "huge"] }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ align: "" }, { align: "center" }, { align: "right" }, { align: "justify" }],
            ["link"],
            [{ color: [] }, { background: [] }],
            ["undo", "redo"],
        ],
        handlers: {
            undo: function () { this.quill.history.undo(); },
            redo: function () { this.quill.history.redo(); },
        },
    },
    history: { delay: 1000, maxStack: 100, userOnly: true },
}

const formats = [
    "header",
    "bold", "italic", "underline",
    "list", "bullet",
    "align", "link",
    "color", "background",
    "size",
]

// ── Convert plain text (with \n) → Quill-friendly HTML ───────────────────────
const plainTextToHtml = (text) => {
  if (!text) return "";
  if (/^\s*<(p|br|ul|ol|li|strong|em|h[1-6])\b/i.test(text)) return text;

  const escapeHtml = (val) =>
    val.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const formatInline = (val) =>
    escapeHtml(val)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g,     "<em>$1</em>")
      .replace(/__(.+?)__/g,     "<strong>$1</strong>")
      .replace(/_(.+?)_/g,       "<em>$1</em>");

  const blocks = text.split(/\n\n+/);        // \n\n → separate blocks

  const rendered = blocks
    .filter((b) => b.trim())
    .map((block) => {
      const trimmed = block.trim();

      // Heading: ## Title
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const level = Math.min(headingMatch[1].length, 6);
        return `<h${level}>${formatInline(headingMatch[2])}</h${level}>`;
      }

      const lines = trimmed.split("\n");     // \n → <br/> within block

      // All-bullet block
      const allBullets = lines.every((l) => /^[-*]\s+/.test(l.trim()));
      if (allBullets) {
        const items = lines
          .map((l) => `<li>${formatInline(l.trim().replace(/^[-*]\s+/, ""))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }

      // Mixed / plain paragraph — \n becomes <br/>
      const content = lines
        .map((l) => {
          const bullet = l.trim().match(/^[-*]\s+(.*)/);
          return bullet
            ? `<li>${formatInline(bullet[1])}</li>`
            : formatInline(l);
        })
        .join("<br/>");

      return `<p>${content}</p>`;
    });

  // ✅ KEY FIX: join blocks with empty <p><br/></p>
  // Quill renders this as a real blank line — \n\n = 2-line gap, \n = 1-line gap
  return rendered.join("<p><br/></p>");
};
// ── Convert Quill HTML → plain text (preserving newlines) ────────────────────
export const htmlToPlainText = (html) => {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')                        // collapse 3+ newlines to 2
    .trim();
};

const RichTextEditor = ({ content = '', onChange,isMarkAsCompleted = false  }) => {
  const [value, setValue] = useState('');
  const initializedRef    = useRef(false);
  const quillRef          = useRef(null);

  // ── On content prop change, convert \n → HTML before setting into Quill ───
  useEffect(() => {
    const htmlContent = plainTextToHtml(content);

    if (!initializedRef.current) {
      setValue(htmlContent);
      initializedRef.current = true;
    } else if (content && htmlContent !== value) {
      setValue(htmlContent);
    }
  }, [content]);

  const handleChange = (newVal) => {
     if (isMarkAsCompleted) return;
    setValue(newVal);
    if (typeof onChange === 'function') {
      // Pass back both HTML (for editor) and plain text (for API / download)
      onChange(newVal, htmlToPlainText(newVal));
    }
  };

  return (
    <div className="tw-px-8">
      <div className="tw-bg-white tw-border tw-rounded-lg tw-overflow-hidden tw-shadow-sm">
        <div className="tw-p-6">
          <div className={`tw-border tw-rounded-md quill-container ${isMarkAsCompleted ? "ql-readonly" : ""}`}>
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={value}
              onChange={handleChange}
              modules={modules}
              formats={formats}
               readOnly={isMarkAsCompleted}
              className="tw-text-slate-700"
            />
          </div>
        </div>

         <style>{`
              .ql-undo::before { content: "↩"; font-size: 16px; font-weight: bold; }
              .ql-redo::before { content: "↪"; font-size: 16px; font-weight: bold; }
              .quill-container .ql-container { min-height: 500px; max-height: 500px; overflow-y: auto; }
              .quill-container .ql-editor { min-height: 500px; font-size: 14px; line-height: 1.6; font-family: inherit !important; color: #333; padding: 12px; }
              .ql-editor strong { font-weight: 700 !important; }
              .ql-editor div[style] { display: block; }
              .ql-editor div[style*="border"] { border-radius: 8px !important; }
              .ql-editor div[style*="background:#fff8f0"] { background: #fff8f0 !important; border: 1px solid #ffd6a5 !important; border-radius: 5px !important; padding: 12px !important; }
              .ql-editor p { margin: 0 0 12px 0; }
              .ql-editor [style*="font-size: 15px"] { font-size: 15px !important; }
              .ql-editor [style*="font-size: 14px"] { font-size: 14px !important; }
              .ql-editor [style*="color: rgb(1, 64, 193)"] { color: rgb(1, 64, 193) !important; }
              .ql-editor [style*="color: rgb(224, 123, 0)"], .ql-editor [style*="color:rgb(224,123,0)"] { color: rgb(224, 123, 0) !important; }
             /* ── Read-only mode ── */
/* ── Read-only mode ── */
.ql-readonly .ql-toolbar.ql-snow {
  opacity: 0.4;
  pointer-events: none;
  cursor: not-allowed;
  position: relative;
}
.ql-readonly .ql-toolbar.ql-snow::after {
  content: "🔒 Read Only";
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  pointer-events: none;
  opacity: 1;
}
.ql-readonly .ql-editor {
  background-color: #f8fafc !important;
  cursor: not-allowed !important;
}
            `}</style>
      </div>
    </div>
  );
};

export default RichTextEditor;
