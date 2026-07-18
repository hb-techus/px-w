


// import React, { useEffect, useState } from 'react';
// import {
//   Brain, CheckCircle2, Loader2,
//   FileText, ListChecks, Sparkles,
// } from 'lucide-react';
// import { ExtractProposalSections, GetProposalDrafterDetail } from '../../../../services/techus-services';
// import { showToast } from '../../../../genriccomponents/techus-ToastNotification';


// const STEPS_CONFIG = [
//   { id: 1, title: "Analyzing the Document",                description: "Analyzing pages of content..."         },
//   { id: 2, title: "Identifying the Proposal Section(s)",   description: "Scanning for RFP requirements..."      },
//   { id: 3, title: "Extracting the Proposal Section(s)",    description: "Extracting relevant content..."        },
//   { id: 4, title: "Analyzing the Section(s) Requirements", description: "Understanding section requirements..." },
// ];

// const FINAL_PROGRESS = 99;
// const LOADING_TICK_MS = 600;

// // ✅ FIX: Safe parse — handles both string and already-parsed object
// //    In local, axios may return string; in dev, it may return object already
// const safeParse = (raw) => {
//   if (!raw) return null;
//   if (typeof raw === 'object') return raw;
//   try {
//     return JSON.parse(raw);
//   } catch (e) {
//     console.error('safeParse failed:', e, raw);
//     return null;
//   }
// };

// const getPageCount = (...sources) => {
//   const PAGE_KEYS = new Set([
//     "n_pages",
//     "page_count",
//     "total_pages",
//     "pages",
//     "nPages",
//     "pageCount",
//     "totalPages",
//   ]);

//   const seen = new WeakSet();
//   const parsePageNumber = (value) => {
//     const parsed = Number(value);
//     return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
//   };

//   const findPageCount = (value) => {
//     if (value == null) return 0;

//     if (Array.isArray(value)) {
//       for (const item of value) {
//         const found = findPageCount(item);
//         if (found > 0) return found;
//       }
//       return 0;
//     }

//     if (typeof value !== "object") return 0;
//     if (seen.has(value)) return 0;
//     seen.add(value);

//     for (const key of PAGE_KEYS) {
//       const found = parsePageNumber(value?.[key]);
//       if (found > 0) return found;
//     }

//     for (const nestedValue of Object.values(value)) {
//       if (!nestedValue || typeof nestedValue !== "object") continue;
//       const found = findPageCount(nestedValue);
//       if (found > 0) return found;
//     }

//     return 0;
//   };

//   for (const source of sources) {
//     const found = findPageCount(source);
//     if (found > 0) return found;
//   }

//   return 0;
// };

// const RFPAnalysisUI = ({ drafterId, templateName, onAnalysisComplete, isCompleted }) => {
//   const [steps, setSteps]         = useState(STEPS_CONFIG.map((s) => ({ ...s, status: "pending" })));
//   const [progress, setProgress]   = useState(0);
//   const [isRunning, setIsRunning] = useState(false);
//   const [errorMsg, setErrorMsg]   = useState("");
// const [isWaiting, setIsWaiting] = useState(false);
// // const runStepAnimation = () => {
// //   const interval = setInterval(() => {
// //     setProgress((prevProgress) => {
// //       if (prevProgress >= ANIMATION_MAX_PROGRESS) {
// //         return prevProgress;
// //       }

// //       const remaining = ANIMATION_MAX_PROGRESS - prevProgress;
// //       const increment = Math.max(0.5, remaining * 0.08);
// //       const nextProgress = Math.min(
// //         ANIMATION_MAX_PROGRESS,
// //         Number((prevProgress + increment).toFixed(1))
// //       );
// //       const activeStepIndex = Math.min(
// //         Math.floor((nextProgress / ANIMATION_MAX_PROGRESS) * STEPS_CONFIG.length),
// //         STEPS_CONFIG.length - 1
// //       );

// //       setSteps((prevSteps) =>
// //         prevSteps.map((step, index) => {
// //           if (index < activeStepIndex) return { ...step, status: "complete" };
// //           if (index === activeStepIndex) return { ...step, status: "loading" };
// //           return { ...step, status: "pending" };
// //         })
// //       );

// //       return nextProgress;
// //     });
// //   }, ANIMATION_TICK_MS);

// //   return { clear: () => clearInterval(interval) };
// // };
// // REMOVE the old runStepAnimation, REPLACE WITH:


// const runStepAnimation = () => {
//   setProgress(1);

//   const interval = setInterval(() => {
//     setProgress((prev) => {
//       if (prev >= FINAL_PROGRESS) return prev; // hold at 99, don't stop

//       const next = prev + 1;

//       const activeStepIndex = Math.min(
//         Math.floor((next / FINAL_PROGRESS) * STEPS_CONFIG.length),
//         STEPS_CONFIG.length - 1
//       );

//       setSteps((prevSteps) =>
//         prevSteps.map((step, index) => {
//           if (index < activeStepIndex) return { ...step, status: "complete" };
//           if (index === activeStepIndex) return { ...step, status: "loading" };
//           return { ...step, status: "pending" };
//         })
//       );

//       return next;
//     });
//   }, LOADING_TICK_MS);

//   return { clear: () => clearInterval(interval) };
// };


//   useEffect(() => {
//     if (!drafterId) return;

//     // Already completed — just show complete state, no API call
//     if (isCompleted) {
//       setSteps(STEPS_CONFIG.map((s) => ({ ...s, status: "complete" })));
//       setProgress(100);
//       return;
//     }

//     if (isRunning) return;

//     let animationInterval;

//     const callApi = async () => {
//       setIsRunning(true);
//       setErrorMsg("");
//       animationInterval = runStepAnimation();

//       try {
//         // STEP 1 — Get encrypted drafter_id using UUID
//         console.log("Calling GetProposalDrafterDetail with drafter_uuid →", drafterId);
//         const detailRaw = await GetProposalDrafterDetail({ drafter_uuid: drafterId });

//         // ✅ FIX: safeParse handles both string and object responses
//         const detail = safeParse(detailRaw);
//         console.log("Drafter Detail RESPONSE →", detail);

//         if (!detail?.valid) {
//           animationInterval.clear();
//           setSteps(STEPS_CONFIG.map((s) => ({ ...s, status: "pending" })));
//           setProgress(0);
//           setErrorMsg(detail?.message || "Failed to fetch drafter details.");
//           setIsRunning(false);
//           return;
//         }

//         // STEP 2 — Use encrypted drafter_id from detail response
//         const encryptedDrafterId = detail?.data?.drafter_id;
//         console.log("encryptedDrafterId →", encryptedDrafterId);

//         if (!encryptedDrafterId) {
//           animationInterval.clear();
//           setErrorMsg("Could not retrieve drafter ID.");
//           setIsRunning(false);
//           return;
//         }

//         // STEP 3 — Call extract with encrypted drafter_id
//         const payload = {
//           drafter_id:    encryptedDrafterId,
//           template_name: templateName || "modern_blue",
//         };
//         console.log("ExtractProposalSections REQUEST →", payload);

//         const raw      = await ExtractProposalSections(payload);
//         // ✅ FIX: safeParse handles both string and object responses
//         const response = safeParse(raw);
//         console.log("ExtractProposalSections RESPONSE →", JSON.stringify(response, null, 2));

//         animationInterval.clear();

//         if (response?.valid) {
//           setSteps(STEPS_CONFIG.map((s) => ({ ...s, status: "complete" })));
//           setProgress(100);
//           showToast("success", "Analysis completed successfully");

          
//           // Handle all possible response structures
// const rawSections =
//   response?.data?.sections ||
//   response?.data?.content?.sections ||
//   response?.data?.content ||
//   [];

// // ADD THIS LOG RIGHT AFTER
// console.log("🔍 RAW response.data FULL →", JSON.stringify(response?.data, null, 2));
// console.log("🔍 rawSections →", JSON.stringify(rawSections, null, 2));

// // Normalize to always be [{title, content}] objects
// const sections = Array.isArray(rawSections)
//   ? rawSections.map(sec =>
//       typeof sec === "string"
//         ? { title: sec, content: "" }
//         : { title: sec.title || "", content: sec.content || "" }
//     )
//   : [];

// const nPages = getPageCount(response?.data, response);

// console.log("✅ Final sections →", JSON.stringify(sections, null, 2)); // ← verify here
// console.log("✅ Final nPages →", nPages);

//           setTimeout(() => {
//             if (onAnalysisComplete) onAnalysisComplete(sections, nPages);
//           }, 3000);

//         } else {
//           setSteps(STEPS_CONFIG.map((s) => ({ ...s, status: "pending" })));
//           setProgress(0);
//           setErrorMsg(response?.message || "Analysis failed. Please try again.");
//         }

//       } catch (err) {
//         animationInterval.clear();
//         console.error("RFPAnalysisUI Error:", err);
//         setSteps(STEPS_CONFIG.map((s) => ({ ...s, status: "pending" })));
//         setProgress(0);
//         // ✅ FIX: show the actual error message from the server, not generic
//         setErrorMsg(err?.response?.data?.message || err?.message || "Something went wrong. Please try again.");
//       } finally {
//         setIsRunning(false);
//       }
//     };

//     callApi();
//     return () => {
//       if (animationInterval) {
//         animationInterval.clear();
//       }
//     };
//   }, [drafterId, isCompleted]);

//   return (
//     <div className="tw-min-h-screen tw-px-12 tw-pt-2">
//       <div className="tw-mx-auto">
//         <div className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-gray-200 tw-overflow-hidden tw-mb-6">
//           <div className="tw-p-12 tw-flex tw-flex-col tw-items-center">

//             <div className="tw-w-16 tw-h-16 tw-bg-blue-50 tw-rounded-xl tw-flex tw-items-center tw-justify-center tw-mb-6 tw-border tw-border-blue-100">
//               <Brain className="tw-w-10 tw-h-10 tw-text-blue-600" />
//             </div>

//             <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-mb-2">Analyzing Your RFP</h1>
//             <p className="tw-text-gray-500 tw-text-sm tw-mb-8">
//               Our AI is carefully analyzing every section of your document...
//             </p>

//             {/* Inline error message */}
//             {errorMsg && (
//               <div className="tw-w-full tw-max-w-2xl tw-mb-6 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-xl tw-px-5 tw-py-4 tw-flex tw-items-center tw-gap-3">
//                 <i className="icon-Alert tw-text-red-500 tw-text-xl"></i>
//                 <div>
//                   <p className="tw-text-sm tw-font-semibold tw-text-red-600">{errorMsg}</p>
//                   <p className="tw-text-xs tw-text-red-400 tw-mt-0.5">
//                     drafter_id: {drafterId}
//                   </p>
//                 </div>
//               </div>
//             )}

//             {/* Progress Bar */}
//             <div className="tw-w-full tw-max-w-2xl tw-mb-10">
//               <div className="tw-flex tw-justify-between tw-items-end tw-mb-2">
//                 <span className="tw-text-sm tw-font-semibold tw-text-gray-500">Overall Progress</span>
//                 <span className="tw-text-sm tw-font-bold tw-text-gray-900">{Math.round(progress)}%</span>
//               </div>
//               <div className="tw-w-full tw-bg-gray-100 tw-rounded-full tw-h-2.5">
//                 <div
//                   className="tw-bg-blue-600 tw-h-2.5 tw-rounded-full tw-transition-all tw-duration-700"
//                   style={{ width: `${progress}%` }}
//                 />
//               </div>
//             </div>

//             {/* Steps */}
//             <div className="tw-w-full tw-max-w-2xl tw-border tw-border-blue-400 tw-rounded-xl tw-p-6 tw-space-y-4">
//               {steps.map((step) => (
//                 <div
//                   key={step.id}
//                   className={`tw-flex tw-items-start tw-p-4 tw-rounded-xl tw-transition-all ${
//                     step.status === "complete" ? "tw-bg-green-50/50" :
//                     step.status === "loading"  ? "tw-bg-blue-50 tw-border tw-border-blue-200" :
//                     "tw-opacity-40"
//                   }`}
//                 >
//                   <div className="tw-mr-4 tw-mt-1">
//                     {step.status === "complete" && (
//                       <div className="tw-bg-green-500 tw-rounded-lg tw-p-1.5">
//                         <CheckCircle2 className="tw-w-6 tw-h-6 tw-text-white" />
//                       </div>
//                     )}
//                     {step.status === "loading" && (
//                       <div className="tw-bg-blue-500 tw-rounded-lg tw-p-1.5">
//                         <Loader2 className="tw-w-6 tw-h-6 tw-text-white tw-animate-spin" />
//                       </div>
//                     )}
//                     {step.status === "pending" && (
//                       <div className="tw-bg-gray-100 tw-rounded-lg tw-p-1.5">
//                         {step.id === 3
//                           ? <FileText   className="tw-w-6 tw-h-6 tw-text-gray-400" />
//                           : <ListChecks className="tw-w-6 tw-h-6 tw-text-gray-400" />
//                         }
//                       </div>
//                     )}
//                   </div>
//                   <div className="tw-flex-1">
//                     <div className="tw-flex tw-justify-between tw-items-center">
//                       <h3 className={`tw-font-bold ${
//                         step.status === "complete" ? "tw-text-green-600" :
//                         step.status === "loading"  ? "tw-text-blue-600"  :
//                         "tw-text-gray-600"
//                       }`}>
//                         {step.title}
//                       </h3>
//                       {step.status === "complete" && (
//                         <span className="tw-text-green-600 tw-text-sm tw-font-medium">Completed</span>
//                       )}
//                     </div>
//                     <p className="tw-text-sm tw-text-gray-500">{step.description}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Pro Tip */}
//             <div className="tw-mt-8 tw-w-full tw-max-w-2xl tw-bg-gray-50 tw-rounded-xl tw-p-5 tw-flex tw-items-start tw-gap-4">
//               <div className="tw-mt-2">
//                 <i className="icon-AI-fill tw-text-[30px] tw-text-blue-500" />
//               </div>
//               <p className="tw-text-xs tw-text-gray-600 tw-leading-relaxed">
//                 <span className="tw-font-bold tw-text-gray-800">Pro tip:</span> Our AI analyzes your RFP
//                 to identify sections like Scope of Work, Qualifications, Pricing, and more to create a
//                 comprehensive proposal.
//               </p>
//             </div>

//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RFPAnalysisUI;



import React, { useEffect, useState } from 'react';
import {
  Brain, CheckCircle2, Loader2,
  FileText, ListChecks,
} from 'lucide-react';
import { ExtractProposalSections, GetProposalDrafterDetail } from '../../../../services/techus-services';
import { showToast } from '../../../../genriccomponents/techus-ToastNotification';

// ─── Constants ────────────────────────────────────────────────────────────────
const STEPS_CONFIG = [
  { id: 1, title: "Analyzing the Document",                description: "Analyzing pages of content..."         },
  { id: 2, title: "Identifying the Proposal Section(s)",   description: "Scanning for RFP requirements..."      },
  { id: 3, title: "Extracting the Proposal Section(s)",    description: "Extracting relevant content..."        },
  { id: 4, title: "Analyzing the Section(s) Requirements", description: "Understanding section requirements..." },
];

const FINAL_PROGRESS  = 99;
const LOADING_TICK_MS = 600;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const safeParse = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('safeParse failed:', e, raw);
    return null;
  }
};

const getPageCount = (...sources) => {
  const PAGE_KEYS = new Set([
    "n_pages", "page_count", "total_pages",
    "pages", "nPages", "pageCount", "totalPages",
  ]);
  const seen = new WeakSet();

  const parsePageNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  const findPageCount = (value) => {
    if (value == null) return 0;
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findPageCount(item);
        if (found > 0) return found;
      }
      return 0;
    }
    if (typeof value !== "object") return 0;
    if (seen.has(value)) return 0;
    seen.add(value);
    for (const key of PAGE_KEYS) {
      const found = parsePageNumber(value?.[key]);
      if (found > 0) return found;
    }
    for (const nestedValue of Object.values(value)) {
      if (!nestedValue || typeof nestedValue !== "object") continue;
      const found = findPageCount(nestedValue);
      if (found > 0) return found;
    }
    return 0;
  };

  for (const source of sources) {
    const found = findPageCount(source);
    if (found > 0) return found;
  }
  return 0;
};

// ─── Component ────────────────────────────────────────────────────────────────
const RFPAnalysisUI = ({ drafterId, templateName, onAnalysisComplete, isCompleted }) => {
  const [steps,     setSteps]     = useState(STEPS_CONFIG.map((s) => ({ ...s, status: "pending" })));
  const [progress,  setProgress]  = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg,  setErrorMsg]  = useState("");
  // ✅ FIX: tracks when animation is stuck at 99 waiting for API
  const [isWaiting, setIsWaiting] = useState(false);

  // ─── Animation ──────────────────────────────────────────────────────────────
  // ✅ FIX: interval does NOT stop itself at 99 — only the API response clears it.
  //         Previously: `if (isDone) clearInterval(interval)` caused the UI to
  //         freeze at 99% while the API was still running.
  const runStepAnimation = () => {
    setProgress(1);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= FINAL_PROGRESS) return prev; // hold at 99, don't stop

        const next = prev + 1;

        const activeStepIndex = Math.min(
          Math.floor((next / FINAL_PROGRESS) * STEPS_CONFIG.length),
          STEPS_CONFIG.length - 1
        );

        setSteps((prevSteps) =>
          prevSteps.map((step, index) => {
            if (index < activeStepIndex) return { ...step, status: "complete" };
            if (index === activeStepIndex) return { ...step, status: "loading" };
            return { ...step, status: "pending" };
          })
        );

        return next;
      });
    }, LOADING_TICK_MS);

    return { clear: () => clearInterval(interval) };
  };

  // ✅ FIX: show "waiting" message when progress hits 99 and API hasn't returned yet
 useEffect(() => {
  if (progress >= FINAL_PROGRESS && !isCompleted && isRunning) {
    setIsWaiting(true);
  } else {
    setIsWaiting(false);
  }
}, [progress, isCompleted, isRunning]);

  // ─── Main effect ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!drafterId) return;

    // Already completed — just show complete state, no API call
    if (isCompleted) {
      setSteps(STEPS_CONFIG.map((s) => ({ ...s, status: "complete" })));
      setProgress(100);
      setIsWaiting(false);
      return;
    }

    if (isRunning) return;

    let animationInterval;

    const callApi = async () => {
      setIsRunning(true);
      setErrorMsg("");
      animationInterval = runStepAnimation();

      try {
        // STEP 1 — Get encrypted drafter_id using UUID
        console.log("Calling GetProposalDrafterDetail with drafter_uuid →", drafterId);
        const detailRaw = await GetProposalDrafterDetail({ drafter_uuid: drafterId });
        const detail    = safeParse(detailRaw);
        console.log("Drafter Detail RESPONSE →", detail);

        if (!detail?.valid) {
          animationInterval.clear();
          setSteps(STEPS_CONFIG.map((s) => ({ ...s, status: "pending" })));
          setProgress(0);
          setIsWaiting(false);
          setErrorMsg(detail?.message || "Failed to fetch drafter details.");
          setIsRunning(false);
          return;
        }

        // STEP 2 — Use encrypted drafter_id from detail response
        const encryptedDrafterId = detail?.data?.drafter_id;
        console.log("encryptedDrafterId →", encryptedDrafterId);

        if (!encryptedDrafterId) {
          animationInterval.clear();
          setProgress(0);
          setIsWaiting(false);
          setErrorMsg("Could not retrieve drafter ID.");
          setIsRunning(false);
          return;
        }

        // STEP 3 — Call extract with encrypted drafter_id
        const payload = {
          drafter_id:    encryptedDrafterId,
          template_name: templateName || "modern_blue",
        };
        console.log("ExtractProposalSections REQUEST →", payload);

        const raw      = await ExtractProposalSections(payload);
        const response = safeParse(raw);
        console.log("ExtractProposalSections RESPONSE →", JSON.stringify(response, null, 2));

        // ✅ API responded — stop the animation interval NOW
        animationInterval.clear();
        setIsWaiting(false);

        if (response?.valid) {
          setSteps(STEPS_CONFIG.map((s) => ({ ...s, status: "complete" })));
          setProgress(100);
          showToast("success", "Analysis completed successfully.");

          // Handle all possible response structures
          const rawSections =
            response?.data?.sections ||
            response?.data?.content?.sections ||
            response?.data?.content ||
            [];

          console.log("🔍 RAW response.data FULL →", JSON.stringify(response?.data, null, 2));
          console.log("🔍 rawSections →", JSON.stringify(rawSections, null, 2));

          // Normalize to always be [{title, content}] objects
          const sections = Array.isArray(rawSections)
            ? rawSections.map((sec) =>
                typeof sec === "string"
                  ? { title: sec, content: "" }
                  : { title: sec.title || "", content: sec.content || "" }
              )
            : [];

          const nPages = getPageCount(response?.data, response);

          console.log("✅ Final sections →", JSON.stringify(sections, null, 2));
          console.log("✅ Final nPages →", nPages);

          setTimeout(() => {
            if (onAnalysisComplete) onAnalysisComplete(sections, nPages);
          }, 3000);

        } else {
          // ✅ API returned invalid — reset everything cleanly
          setSteps(STEPS_CONFIG.map((s) => ({ ...s, status: "pending" })));
          setProgress(0);
          setErrorMsg(response?.message || "Analysis failed. Please try again.");
        }

      } catch (err) {
        // ✅ Network/server error — clear animation, reset progress, show error
        animationInterval.clear();
        setIsWaiting(false);
        console.error("RFPAnalysisUI Error:", err);
        setSteps(STEPS_CONFIG.map((s) => ({ ...s, status: "pending" })));
        setProgress(0);
        setErrorMsg(
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong. Please try again."
        );
      } finally {
        setIsRunning(false);
      }
    };

    callApi();

    return () => {
      if (animationInterval) animationInterval.clear();
    };
  }, [drafterId, isCompleted]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="tw-min-h-screen tw-px-12 tw-pt-2">
      <div className="tw-mx-auto">
        <div className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-gray-200 tw-overflow-hidden tw-mb-6">
          <div className="tw-p-12 tw-flex tw-flex-col tw-items-center">

            {/* Brain icon */}
            <div className="tw-w-16 tw-h-16 tw-bg-blue-50 tw-rounded-xl tw-flex tw-items-center tw-justify-center tw-mb-6 tw-border tw-border-blue-100">
              <Brain className="tw-w-10 tw-h-10 tw-text-blue-600" />
            </div>

            <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-mb-2">Analyzing Your RFP</h1>
            <p className="tw-text-gray-500 tw-text-sm tw-mb-8">
              Our AI is carefully analyzing every section of your document...
            </p>

            {/* Error message */}
            {errorMsg && (
              <div className="tw-w-full tw-max-w-2xl tw-mb-6 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-xl tw-px-5 tw-py-4 tw-flex tw-items-center tw-gap-3">
                <i className="icon-Alert tw-text-red-500 tw-text-xl" />
                <div>
                  <p className="tw-text-sm tw-font-semibold tw-text-red-600">{errorMsg}</p>
                  {/* <p className="tw-text-xs tw-text-red-400 tw-mt-0.5">
                    drafter_id: {drafterId}
                  </p> */}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="tw-w-full tw-max-w-2xl tw-mb-10">
              <div className="tw-flex tw-justify-between tw-items-end tw-mb-2">
                <span className="tw-text-sm tw-font-semibold tw-text-gray-500">Overall Progress</span>
                <span className="tw-text-sm tw-font-bold tw-text-gray-900">{Math.round(progress)}%</span>
              </div>
              <div className="tw-w-full tw-bg-gray-100 tw-rounded-full tw-h-2.5">
                <div
                  className="tw-bg-blue-600 tw-h-2.5 tw-rounded-full tw-transition-all tw-duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* ✅ FIX: "Waiting for AI" message shown when stuck at 99% */}
              {isWaiting && !errorMsg && (
                <div className="tw-flex tw-items-center tw-gap-2 tw-mt-3">
                  <svg
                    className="tw-animate-spin tw-w-3.5 tw-h-3.5 tw-text-blue-500"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="tw-opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"
                    />
                    <path
                      className="tw-opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  <span className="tw-text-xs tw-text-blue-500 tw-font-medium">
                    AI is finalizing analysis, please wait...
                  </span>
                </div>
              )}
            </div>

            {/* Steps */}
            <div className="tw-w-full tw-max-w-2xl tw-border tw-border-blue-400 tw-rounded-xl tw-p-6 tw-space-y-4">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`tw-flex tw-items-start tw-p-4 tw-rounded-xl tw-transition-all ${
                    step.status === "complete" ? "tw-bg-green-50/50" :
                    step.status === "loading"  ? "tw-bg-blue-50 tw-border tw-border-blue-200" :
                    "tw-opacity-40"
                  }`}
                >
                  <div className="tw-mr-4 tw-mt-1">
                    {step.status === "complete" && (
                      <div className="tw-bg-green-500 tw-rounded-lg tw-p-1.5">
                        <CheckCircle2 className="tw-w-6 tw-h-6 tw-text-white" />
                      </div>
                    )}
                    {step.status === "loading" && (
                      <div className="tw-bg-blue-500 tw-rounded-lg tw-p-1.5">
                        <Loader2 className="tw-w-6 tw-h-6 tw-text-white tw-animate-spin" />
                      </div>
                    )}
                    {step.status === "pending" && (
                      <div className="tw-bg-gray-100 tw-rounded-lg tw-p-1.5">
                        {step.id === 3
                          ? <FileText   className="tw-w-6 tw-h-6 tw-text-gray-400" />
                          : <ListChecks className="tw-w-6 tw-h-6 tw-text-gray-400" />
                        }
                      </div>
                    )}
                  </div>
                  <div className="tw-flex-1">
                    <div className="tw-flex tw-justify-between tw-items-center">
                      <h3 className={`tw-font-bold ${
                        step.status === "complete" ? "tw-text-green-600" :
                        step.status === "loading"  ? "tw-text-blue-600"  :
                        "tw-text-gray-600"
                      }`}>
                        {step.title}
                      </h3>
                      {step.status === "complete" && (
                        <span className="tw-text-green-600 tw-text-sm tw-font-medium">Completed</span>
                      )}
                    </div>
                    <p className="tw-text-sm tw-text-gray-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pro Tip */}
            <div className="tw-mt-8 tw-w-full tw-max-w-2xl tw-bg-gray-50 tw-rounded-xl tw-p-5 tw-flex tw-items-start tw-gap-4">
              <div className="tw-mt-2">
                <i className="icon-AI-fill tw-text-[30px] tw-text-blue-500" />
              </div>
              <p className="tw-text-xs tw-text-gray-600 tw-leading-relaxed">
                <span className="tw-font-bold tw-text-gray-800">Pro tip:</span> Our AI analyzes your RFP
                to identify sections like Scope of Work, Qualifications, Pricing, and more to create a
                comprehensive proposal.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default RFPAnalysisUI;