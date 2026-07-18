// import React from "react";

// export default function DeleteConfirmModal({ show, title, message, onCancel, onConfirm }) {
//   if (!show) return null;

//   return (
//     <div
//       className="tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black/30 tw-z-[99999]"
//       onClick={onCancel} 
//     >
//       <div
//         className="tw-bg-white tw-rounded-lg tw-shadow-xl tw-p-6 tw-w-[350px] tw-text-center"
//         onClick={(e) => e.stopPropagation()} 
//       >
//         <h2 className="tw-text-lg tw-font-semibold tw-mb-2 tw-text-gray-800">{title}</h2>

//         <p className="tw-text-sm tw-text-gray-500 tw-mb-4">{message}</p>

//         <div className="tw-flex tw-justify-center tw-gap-3">
//           <button
//             onClick={onConfirm}
//             className="tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-md tw-text-sm hover:tw-bg-red-700"
//           >
//             Yes
//           </button>

//           <button
//             onClick={onCancel}
//             className="tw-bg-[#0140c1] tw-border tw-border-[#0140c1] tw-text-[#fff] tw-px-4 tw-py-2 tw-rounded-md tw-text-sm hover:tw-bg-white hover:tw-text-[#0140c1]"
//           >
//             No
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }



// work 1
// import React from "react";

// export default function DeleteConfirmModal({
//   show,
//   title,
//   message,
//   onCancel,
//   onConfirm,
// }) {
//   return (
//     <div
//       className={`
//         tw-fixed tw-inset-0 tw-z-[99999]
//         tw-flex tw-items-center tw-justify-center
//         tw-bg-black/30
//         tw-transition-opacity tw-duration-400 tw-ease-[cubic-bezier(0.16,1,0.3,1)]
//  tw-ease-out
//         ${show ? "tw-opacity-100 tw-visible" : "tw-opacity-0 tw-invisible"}
//       `}
//       onClick={onCancel}
//     >
//       <div
//         onClick={(e) => e.stopPropagation()}
//         className={`
//           tw-bg-white tw-rounded-lg tw-shadow-xl
//           tw-p-6 tw-w-[350px] tw-text-center
//           tw-transform tw-transition-all tw-duration-300 tw-ease-out
//           ${
//             show
//               ? "tw-translate-y-0 tw-opacity-100 tw-scale-100"
//               : "tw-translate-y-10 tw-opacity-0 tw-scale-95"
//           }
//         `}
//       >
//         <h2 className="tw-text-lg tw-font-semibold tw-mb-2 tw-text-gray-800">
//           {title}
//         </h2>

//         <p className="tw-text-sm tw-text-gray-500 tw-mb-4">
//           {message}
//         </p>

//         <div className="tw-flex tw-justify-center tw-gap-3">
//           <button
//             onClick={onConfirm}
//             className="tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-md tw-text-sm hover:tw-bg-red-700"
//           >
//             Yes
//           </button>

//           <button
//             onClick={onCancel}
//             className="tw-bg-[#0140c1] tw-border tw-border-[#0140c1] tw-text-white tw-px-4 tw-py-2 tw-rounded-md tw-text-sm
//               hover:tw-bg-white hover:tw-text-[#0140c1]"
//           >
//             No
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


// work 2
// import React from "react";

// export default function DeleteConfirmModal({
//   show,
//   title,
//   message,
//   onCancel,
//   onConfirm,
// }) {
//   return (
//     <div
//       className={`
//         tw-fixed tw-inset-0 tw-z-[99999]
//         tw-flex tw-items-center tw-justify-center
//         tw-bg-black/30
//         tw-transition-opacity tw-duration-400
//         tw-ease-[cubic-bezier(0.16,1,0.3,1)]
//         ${
//           show
//             ? "tw-opacity-100 tw-visible tw-pointer-events-auto"
//             : "tw-opacity-0 tw-invisible tw-pointer-events-none"
//         }
//       `}
//       onClick={onCancel}
//     >
//       <div
//         onClick={(e) => e.stopPropagation()}
//         className={`
//           tw-bg-white tw-rounded-lg tw-shadow-xl
//           tw-p-6 tw-w-[350px] tw-text-center
//           tw-transform tw-transition-all tw-duration-300 tw-ease-out
//           ${
//             show
//               ? "tw-translate-y-0 tw-opacity-100 tw-scale-100"
//               : "tw-translate-y-10 tw-opacity-0 tw-scale-95"
//           }
//         `}
//       >
//         <h2 className="tw-text-lg tw-font-semibold tw-mb-2 tw-text-gray-800">
//           {title}
//         </h2>

//         <p className="tw-text-sm tw-text-gray-500 tw-mb-4">
//           {message}
//         </p>

//         <div className="tw-flex tw-justify-center tw-gap-3">
//           <button
//             onClick={onConfirm}
//             className="tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-md tw-text-sm hover:tw-bg-red-700"
//           >
//             Yes
//           </button>

//           <button
//             onClick={onCancel}
//             className="tw-bg-[#0140c1] tw-border tw-border-[#0140c1]
//               tw-text-white tw-px-4 tw-py-2 tw-rounded-md tw-text-sm
//               hover:tw-bg-white hover:tw-text-[#0140c1]"
//           >
//             No
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


// 

import React, { useState, useEffect } from "react";

export default function DeleteConfirmModal({
  show,
  title,
  message,
  onCancel,
  onConfirm,
}) {
  const [exitDirection, setExitDirection] = useState(null);
  // null | "right"

 
  useEffect(() => {
    if (show) {
      setExitDirection(null);
    }
  }, [show]);

  const handleNo = () => {
    setExitDirection("right");
    onCancel();
  };

  return (
    <div
      className={`
        tw-fixed tw-inset-0 tw-z-[99]
        tw-flex tw-items-center tw-justify-center
        tw-bg-black/30
        tw-transition-opacity tw-duration-400
        tw-ease-[cubic-bezier(0.16,1,0.3,1)]
        ${show ? "tw-opacity-100 tw-visible" : "tw-opacity-0 tw-invisible"}
      `}
      onClick={handleNo}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          tw-bg-white tw-rounded-lg tw-shadow-xl
          tw-p-6 tw-w-[350px] tw-text-center
          tw-transform tw-transition-all tw-duration-300 tw-ease-out
          ${
            show
              // ✅ OPEN: ALWAYS bottom → top
              ? "tw-translate-y-0 tw-opacity-100 tw-scale-100"
              : exitDirection === "right"
              // ✅ NO button: exit → right
              ? "tw-translate-x-12 tw-opacity-0 tw-scale-95"
              // ✅ YES / backdrop: exit → bottom
              : "tw-translate-y-10 tw-opacity-0 tw-scale-95"
          }
        `}
      >
        <h2 className="tw-text-lg tw-font-semibold tw-mb-2 tw-text-gray-800">
          {title}
        </h2>

        <p className="tw-text-sm tw-text-gray-500 tw-mb-4">
          {message}
        </p>

        <div className="tw-flex tw-justify-center tw-gap-3">
          <button
            onClick={onConfirm}
            className="tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-md tw-text-sm hover:tw-bg-red-700"
          >
            Yes
          </button>

          <button
            onClick={handleNo}
            className="tw-bg-[#0140c1] tw-border tw-border-[#0140c1]
              tw-text-white tw-px-4 tw-py-2 tw-rounded-md tw-text-sm
              hover:tw-bg-white hover:tw-text-[#0140c1]"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
