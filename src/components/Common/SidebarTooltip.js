// import React from "react";
// import Tippy from "@tippyjs/react";
// import "tippy.js/dist/tippy.css";

// const SidebarTooltip = ({ label, show, children }) => {
//   if (!show) return children;

//   return (
//     <Tippy
//       content={label}
//       placement="right"
//       delay={[150, 0]}
//       theme="sidebar"
//       appendTo={document.body}
//       offset={[0, 30]}
//     >
//       <div className="tw-flex tw-items-center ">{children}</div>
//     </Tippy>
//   );
// };

// export default SidebarTooltip;


import React from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

/* ─── Inject custom "sidebar" Tippy theme once ──────────────────────────── */
const STYLE_ID = "sidebar-tippy-theme";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .tippy-box[data-theme~='sidebar'] {
      background-color: #1e293b;
      color: #f1f5f9;
      font-size: 12px;
      font-weight: 500;
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.08);
      white-space: nowrap;
    }
    .tippy-box[data-theme~='sidebar'] .tippy-content {
      padding: 5px 10px;
    }
    .tippy-box[data-theme~='sidebar'] .tippy-arrow {
      color: #1e293b;
    }
    .tippy-box[data-theme~='sidebar'][data-placement^='right'] > .tippy-arrow::before {
      border-right-color: #1e293b;
    }
  `;
  document.head.appendChild(style);
}

/* ─── SidebarTooltip ────────────────────────────────────────────────────── */
/**
 * Wraps any sidebar icon with a right-side tooltip overlay.
 *
 * Props:
 *   label  – tooltip text to display
 *   show   – when false, renders children as-is (expanded sidebar state)
 *   children – the icon / element to attach the tooltip to
 */
const SidebarTooltip = ({ label, show, children }) => {
  if (!show) return <>{children}</>;

  return (
    <Tippy
      content={label}
      placement="right"
      delay={[120, 0]}       // 120 ms show delay, instant hide
      theme="sidebar"
      appendTo={document.body}
      offset={[0, 12]}       // 12 px gap from the sidebar edge
      zIndex={9999}
      arrow={true}
    >
      {/*
        Tippy requires a single, focusable DOM element as its child.
        We use a <span> so it never interferes with flex/grid layout.
      */}
      <span className="tw-flex tw-items-center tw-w-full">{children}</span>
    </Tippy>
  );
};

export default SidebarTooltip;