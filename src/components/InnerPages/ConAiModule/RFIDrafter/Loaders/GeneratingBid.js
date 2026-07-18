// import React, { useState, useEffect } from "react";

// const steps = [
//   "Analyzing RFP requirements and scope...",
//   "Identifying key bid criteria...",
//   "Drafting bid invite content...",
//   "Finalizing your Bid Invite document...",
// ];

// const GeneratingBid = () => {
//   const [progress, setProgress] = useState(0);
//   const [stepIndex, setStepIndex] = useState(0);

//  useEffect(() => {
//   const interval = setInterval(() => {
//     setProgress((prev) => {
//       if (prev >= 100) {
//         clearInterval(interval);
//         return 100;
//       }
//       const next = prev + 5;
//       const newStep = Math.floor((next / 100) * steps.length);
//       setStepIndex(Math.min(newStep, steps.length - 1));
//       return next;
//     });
//   }, 600);
//   return () => clearInterval(interval);
// }, []);

//   return (
//     <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-[#f5f7fa] !tw-overflow-hidden">

//       <div className="tw-w-[620px] tw-p-[50px_40px] tw-bg-white tw-border tw-border-[#e0e0e0] tw-rounded-md tw-flex tw-flex-col tw-gap-5 tw-items-center tw-text-center">

//         {/* Icon + Spinner */}
//         <div className="tw-relative tw-w-[90px] tw-h-[90px] tw-flex tw-items-center tw-justify-center">
//           <div className="tw-w-[90px] tw-h-[90px] tw-bg-[#eaf2ff] tw-rounded-full tw-flex tw-items-center tw-justify-center">
//             <i className="icon-AI-fill tw-text-[46px] tw-text-[#2f5bea]" />
//           </div>
//           {/* Spinner overlaid at bottom-right */}
//           <div className="tw-absolute tw-bottom-0 tw-right-0 tw-w-6 tw-h-6 tw-border-[3px] tw-border-[#2f5bea] tw-border-t-transparent tw-rounded-full tw-animate-spin tw-bg-white"></div>
//         </div>

//         {/* Title */}
//         <div className="tw-text-[22px] tw-font-bold tw-tracking-[0.31px] tw-text-black">
//           Generating Bid Invite
//         </div>

//         {/* Step Text */}
//         <div className="tw-text-[15px] tw-leading-[1.4] tw-tracking-[0.24px] tw-text-[#555] tw-min-h-[40px]">
//           {steps[stepIndex]}
//         </div>

//         {/* Progress Bar */}
//         <div className="tw-w-full tw-flex tw-flex-col tw-gap-2">
//           <div className="tw-w-full tw-h-[10px] tw-bg-[#e5e7eb] tw-rounded-full tw-overflow-hidden">
//             <div
//               className="tw-h-full tw-bg-[#0140c1] tw-rounded-full tw-transition-all tw-duration-500"
//               style={{ width: `${progress}%` }}
//             />
//           </div>
//           <span className="tw-text-[14px] tw-text-[#555] tw-font-medium">
//             {progress}% Complete
//           </span>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default GeneratingBid;



import React, { useEffect, useRef, useState } from "react";

const steps = [
  "Analyzing RFP requirements and scope...",
  "Identifying key bid criteria...",
  "Drafting bid invite content...",
  "Finalizing your Bid Invite document...",
];

const GeneratingBid = ({ progress: externalProgress, onComplete }) => {
  const [progress, setProgress] = useState(
    Number.isFinite(externalProgress) ? externalProgress : 0
  );
  const [stepIndex, setStepIndex] = useState(0);
  const hasCompletedRef = useRef(false);
  const displayProgress = progress >= 100 ? 100 : Math.floor(progress);

  useEffect(() => {
    if (Number.isFinite(externalProgress)) {
      setProgress(Math.min(externalProgress, 100));
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }

        const increment = prev < 90 ? 5 : 10;
        const next = Math.min(prev + increment, 100);

        setStepIndex(
          Math.min(Math.floor((next / 100) * steps.length), steps.length - 1)
        );

        if (next >= 100) {
          clearInterval(interval);
        }

        return next;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [externalProgress]);

  useEffect(() => {
    setStepIndex(
      Math.min(Math.floor((progress / 100) * steps.length), steps.length - 1)
    );
  }, [progress]);

  useEffect(() => {
    if (progress !== 100 || hasCompletedRef.current) return;

    hasCompletedRef.current = true;
    onComplete?.();
  }, [progress, onComplete]);

 return (
    <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-[#f0f2f5] !tw-overflow-hidden">
      <div className="tw-w-[540px] tw-p-[40px_60px] tw-bg-white tw-border tw-border-[#e0e0e0] tw-rounded-md tw-flex tw-flex-col tw-gap-4 tw-items-center tw-text-center">
        <div className="tw-relative tw-w-[110px] tw-h-[110px] tw-mb-2">
          <div className="tw-w-full tw-h-full tw-bg-[#dde8f8] tw-rounded-full tw-flex tw-items-center tw-justify-center">
            <i className="icon-AI-fill tw-text-[52px] tw-leading-none tw-text-[#4a72c4]" />
          </div>
          {progress < 100 && (
            <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
              <div className="tw-w-[72px] tw-h-[72px] tw-border-[4px] tw-border-[#4a72c4] tw-border-t-transparent tw-rounded-full tw-animate-spin tw-opacity-95" />
            </div>
          )}
        </div>

        <div className="tw-text-[22px] tw-font-bold tw-tracking-tight tw-text-black">
          Generating Bid Invite
        </div>

        <div className="tw-text-[15px] tw-text-[#666] tw-min-h-[24px]">
          {steps[stepIndex]}
        </div>

        <div className="tw-w-full tw-mt-4 tw-flex tw-flex-col tw-gap-4">
          <div className="tw-w-full tw-h-[7px] tw-bg-[#e5e7eb] tw-rounded-full tw-overflow-hidden">
            <div
              className="tw-h-full tw-bg-[#0047cc] tw-rounded-full tw-transition-all tw-duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>

          <span className="tw-text-[15px] tw-text-[#666] tw-font-normal">
            {displayProgress}% Completed
          </span>
        </div>

      </div>
    </div>
  );
};

export default GeneratingBid;
