import React, { useEffect, useState } from 'react';

function AlertModal(props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !isLoading) {
      event.preventDefault();
      handleOkayClick();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleOkayClick = async () => {
    setIsLoading(true);
    try {
      await props.handleOkay();   // ← your async API call lives here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {props.showModal && (
        <div
          className="tw-fixed tw-inset-0 tw-z-[9999] tw-flex tw-items-center tw-justify-center tw-bg-black/50 tw-backdrop-blur-sm"
          aria-labelledby="alert-modal"
          role="dialog"
        >
          <div className="tw-bg-white tw-w-full tw-max-w-md tw-rounded-2xl tw-shadow-lg tw-transform tw-transition-all tw-scale-100 tw-animate-in tw-fade-in tw-zoom-in tw-duration-200 tw-relative">

            {/* Header */}
            <div className="tw-flex tw-justify-center tw-items-center tw-border-b tw-border-gray-200 tw-py-4 tw-px-6 tw-relative">
              <span className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-text-center">
                {props.title}
              </span>
              <button
                className="tw-absolute tw-right-4 tw-top-4 tw-text-gray-500 hover:tw-text-gray-700 disabled:tw-opacity-50"
                onClick={() => props.setShowModal(false)}
                disabled={isLoading}
                type="button"
                aria-label="Close"
              >
                <i className="icon icon-close tw-text-[18px]"></i>
              </button>
            </div>

            {/* Body */}
            <div className="tw-p-6 tw-text-center tw-text-gray-700">
              <p className="tw-text-base tw-mb-4">{props.content}</p>

              {/* Page Checkboxes */}
              {props.data && props.data.length > 1 && (
                <div className="tw-flex tw-flex-wrap tw-justify-center tw-gap-3 tw-mt-2">
                  {props.data.map((val, index) =>
                    val.angle_page_number !== null ? (
                      <div
                        key={index}
                        className="tw-flex tw-items-center tw-justify-evenly tw-px-3 tw-py-2 tw-rounded-full tw-border tw-border-gray-300 tw-bg-blue-600 tw-text-white tw-opacity-70"
                      >
                        <input
                          type="checkbox"
                          checked
                          disabled
                          readOnly
                          className="tw-accent-blue-600 tw-cursor-not-allowed"
                        />
                        <span className="tw-ml-2">
                          Page {parseInt(val.angle_page_number) + 1}
                        </span>
                      </div>
                    ) : null
                  )}
                </div>
              )}

              {/* Buttons */}
              {!props.button2 ? (
                <div className="tw-flex tw-justify-center tw-mt-6">
                  <button
                    className="tw-bg-[#0140c1] tw-text-white tw-px-6 tw-py-2 tw-rounded-md tw-font-medium tw-transition-all tw-duration-200 tw-flex tw-items-center tw-gap-2 disabled:tw-opacity-70 disabled:tw-cursor-not-allowed"
                    onClick={handleOkayClick}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="tw-animate-spin tw-h-4 tw-w-4 tw-text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="tw-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="tw-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading...
                      </>
                    ) : (
                      props.button || 'Okay'
                    )}
                  </button>
                </div>
              ) : (
                <div className="tw-flex tw-justify-evenly tw-mt-6">
                  <button
                    className="tw-bg-[#0140c1] tw-text-white tw-px-6 tw-py-2 tw-rounded-md tw-font-medium tw-transition-all tw-duration-200 tw-flex tw-items-center tw-gap-2 disabled:tw-opacity-70 disabled:tw-cursor-not-allowed"
                    onClick={handleOkayClick}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="tw-animate-spin tw-h-4 tw-w-4 tw-text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="tw-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="tw-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading...
                      </>
                    ) : (
                      props.button
                    )}
                  </button>
                  <button
                    className="tw-bg-gray-300 hover:tw-bg-gray-400 tw-text-gray-800 tw-px-6 tw-py-2 tw-rounded-md tw-font-medium tw-transition-all tw-duration-200 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                    onClick={() => props.setShowModal(false)}
                    disabled={isLoading}
                  >
                    {props.button2}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AlertModal;



// import React, { useEffect } from 'react';

// function AlertModal(props) {
//   const handleKeyDown = (event) => {
//     if (event.key === 'Enter') {
//       event.preventDefault();
//       props.handleOkay();
//     }
//   };

//   useEffect(() => {
//     document.addEventListener('keydown', handleKeyDown);
//     return () => document.removeEventListener('keydown', handleKeyDown);
//   }, [handleKeyDown]);

//   return (
//     <>
//       {props.showModal && (
//         <div
//           className="tw-fixed tw-inset-0 tw-z-[9999] tw-flex tw-items-center tw-justify-center tw-bg-black/50 tw-backdrop-blur-sm"
//           aria-labelledby="alert-modal"
//           role="dialog"
//         >
//           <div className="tw-bg-white tw-w-full tw-max-w-md tw-rounded-2xl tw-shadow-lg tw-transform tw-transition-all tw-scale-100 tw-animate-in tw-fade-in tw-zoom-in tw-duration-200 tw-relative">
            
//             {/* Header */}
//             <div className="tw-flex tw-justify-center tw-items-center tw-border-b tw-border-gray-200 tw-py-4 tw-px-6 tw-relative">
//               <span className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-text-center">
//                 {props.title}
//               </span>
//               {props.showModal && (
//                 <button
//                   className="tw-absolute tw-right-4 tw-top-4 tw-text-gray-500 hover:tw-text-gray-700"
//                   onClick={() => props.setShowModal(false)}
//                   type="button"
//                   aria-label="Close"
//                 >
//                   <i className="icon icon-close tw-text-[18px]"></i>
//                 </button>
//               )}
//             </div>

//             {/* Body */}
//             <div className="tw-p-6 tw-text-center tw-text-gray-700">
//               <p className="tw-text-base tw-mb-4">{props.content}</p>

//               {/* Page Checkboxes */}
//               {props.data && props.data.length > 1 && (
//                 <div className="tw-flex tw-flex-wrap tw-justify-center tw-gap-3 tw-mt-2">
//                   {props.data.map((val, index) =>
//                     val.angle_page_number !== null ? (
//                       <div
//                         key={index}
//                         className={`tw-flex tw-items-center tw-justify-evenly tw-px-3 tw-py-2 tw-rounded-full tw-border tw-border-gray-300 ${
//                           true ? 'tw-bg-blue-600 tw-text-white' : 'tw-bg-gray-100'
//                         } tw-opacity-70`}
//                       >
//                         <input
//                           type="checkbox"
//                           checked
//                           disabled
//                           readOnly
//                           className="tw-accent-blue-600 tw-cursor-not-allowed"
//                         />
//                         <span className="tw-ml-2">
//                           Page {parseInt(val.angle_page_number) + 1}
//                         </span>
//                       </div>
//                     ) : null
//                   )}
//                 </div>
//               )}

//               {/* Buttons */}
//               {!props.button2 ? (
//                 <div className="tw-flex tw-justify-center tw-mt-6">
//                   <button
//                     className="tw-bg-[#0140c1] hover:tw-bg-[#0140c1] tw-text-white tw-px-6 tw-py-2 tw-rounded-md tw-font-medium tw-transition-all tw-duration-200"
//                     onClick={props.handleOkay}
//                   >
//                     {props.button || 'Okay'}
//                   </button>
//                 </div>
//               ) : (
//                 <div className="tw-flex tw-justify-evenly tw-mt-6">
//                   <button
//                     className="tw-bg-[#0140c1] hover:tw-bg-[#0140c1] tw-text-white tw-px-6 tw-py-2 tw-rounded-md tw-font-medium tw-transition-all tw-duration-200"
//                     onClick={props.handleOkay}
//                   >
//                     {props.button}
//                   </button>
//                   <button
//                     className="tw-bg-gray-300 hover:tw-bg-gray-400 tw-text-gray-800 tw-px-6 tw-py-2 tw-rounded-md tw-font-medium tw-transition-all tw-duration-200"
//                     onClick={() => props.setShowModal(false)}
//                   >
//                     {props.button2}
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// export default AlertModal;

