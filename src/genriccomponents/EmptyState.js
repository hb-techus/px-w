import React from "react";

export default function EmptyState({ title, message, onReset }) {
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-16 tw-text-center tw-w-full tw-bg-white tw-border-[#0140c1] tw-border-[1.5px] tw-rounded-md">
      <h3 className="tw-text-xl tw-font-semibold tw-text-gray-800">
        {title || "No Data Found"}
      </h3>

      {message && (
        <p className="tw-text-gray-600 tw-mt-1">{message}</p>
      )}

      {onReset && (
        <button
          onClick={onReset}
          className="tw-bg-[#0140c1] tw-text-white tw-rounded-md tw-px-6 tw-py-2 tw-mt-5 hover:tw-bg-[#0140c1] tw-transition-all tw-w-[200px]"
        >
          Back To List
        </button>
      )}
    </div>
  );
}
// import React from "react";

// export default function EmptyState({ title, message, onReset, showBackButton }) {
//   return (
//     <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-16 tw-text-center tw-w-full tw-bg-white tw-border-[#0140c1] tw-border-[1.5px] tw-rounded-md">
//       <h3 className="tw-text-xl tw-font-semibold tw-text-gray-800">
//         {title || "No Data Found"}
//       </h3>

//       {message && (
//         <p className="tw-text-gray-600 tw-mt-1">{message}</p>
//       )}

//       {onReset && showBackButton && (
//         <button
//           onClick={onReset}
//           className="tw-bg-[#0140c1] tw-text-white tw-rounded-md tw-px-6 tw-py-2 tw-mt-5 hover:tw-bg-[#0140c1] tw-transition-all tw-w-[200px]"
//         >
//           Back To List
//         </button>
//       )}
//     </div>
//   );
// }
