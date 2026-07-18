import React, { useRef, useState, useEffect } from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

const TextWithTooltip = ({ text, width = "150px", className = "", style = {} }) => {
  const ref = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el) setIsTruncated(el.scrollWidth > el.clientWidth);
  }, [text]);

  if (!text) return null;

  // Single span with the ref — always rendered, always measured
  const inner = (
    <span
      ref={ref}
      className={`tw-block tw-truncate ${className}`}
      style={{
        maxWidth: width,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        ...style,
      }}
    >
      {text}
    </span>
  );

  // Only wrap with Tippy when text is actually truncated
  return isTruncated ? (
    <Tippy content={text} placement="top" theme="custom" appendTo={document.body}>
      {inner}
    </Tippy>
  ) : (
    inner
  );
};

export default TextWithTooltip;



// import React, { useRef, useState, useEffect } from "react";
// import Tippy from "@tippyjs/react";
// import "tippy.js/dist/tippy.css";

// const TextWithTooltip = ({ text, width = "150px", className = "", style = {} }) => {
//   const ref = useRef(null);
//   const [isTruncated, setIsTruncated] = useState(false);

//   useEffect(() => {
//     const el = ref.current;
//     if (el) setIsTruncated(el.scrollWidth > el.clientWidth);
//   }, [text]);

//   if (!text) return null;

//   const span = (
//     <span
//       ref={ref}
//       className={`tw-block tw-truncate ${className}`} // merge passed className
//       style={{
//         maxWidth: width,
//         overflow: "hidden",
//         whiteSpace: "nowrap",
//         textOverflow: "ellipsis",
    
//         ...style // merge passed styles
//       }}
//     >
//       {text}
//     </span>
//   );

//   if (!isTruncated) return span;

//   return (
//     <Tippy
//       content={text}
//       placement="top"
//       theme="custom"
//       appendTo={document.body}
//     >
//      <span
//   className={`tw-block tw-truncate ${className}`}
// >
//   {text}
// </span>
//     </Tippy>
//   );
// };

// export default TextWithTooltip;
