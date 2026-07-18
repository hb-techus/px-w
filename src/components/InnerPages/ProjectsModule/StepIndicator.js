// 
import React, { useMemo, useRef, useEffect, useState } from "react";

const STEPS = [
  { id: 1, title: "Project Details" },
  { id: 2, title: "Upload Documents" },
];

const COLORS = {
  primary: "#2f69ff",
  gray: "#e5e7eb",
};

const getStepState = (currentStep, stepId) => {
  if (currentStep === stepId) return "active";
  if (currentStep > stepId) return "done";
  return "upcoming";
};

const getCircleStyles = (state) => {
  const stateStyles = {
    active:   "tw-border-[#48f] tw-text-[#48f] tw-bg-white",
    done:     "tw-bg-[#2f69ff] tw-border-[#2f69ff] tw-text-white",
    upcoming: "tw-border-[#bdbdbd] tw-text-[#8b8b8b] tw-bg-white",
  };
  return stateStyles[state] || stateStyles.upcoming;
};

const getTextStyles = (state) => {
  const stateStyles = {
    active:   "tw-text-[#2f69ff] tw-font-semibold",
    done:     "tw-text-[#6b7280] tw-font-medium",
    upcoming: "tw-text-[#8b8b8b] tw-font-medium",
  };
  return stateStyles[state] || stateStyles.upcoming;
};

// ─── Checkmark SVG (draw animation via stroke-dashoffset) ────────────────────
const AnimatedCheck = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 14, height: 14 }}
  >
    <polyline
      points="20 6 9 17 4 12"
      style={{
        strokeDasharray: 22,
        strokeDashoffset: 22,
        animation: "draw-check 0.35s ease-out forwards",
      }}
    />
  </svg>
);

// ─── Step circle with animated transitions ────────────────────────────────────
const StepCircle = ({ stepNumber, state }) => {
  const prevStateRef = useRef(state);
  const [content, setContent] = useState(state); // drives what's rendered
  const [animKey, setAnimKey] = useState(0);      // forces re-mount → restarts animation

  useEffect(() => {
    const prev = prevStateRef.current;
    if (prev !== state) {
      prevStateRef.current = state;
      setContent(state);
      setAnimKey((k) => k + 1); // restart animation
    }
  }, [state]);

  const innerStyle =
    content === "done"
      ? { animation: "pop-in 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards" }
      : { animation: "pop-in 0.25s ease-out forwards" };

  return (
    <div
      className={`tw-w-7 tw-h-7 tw-rounded-full tw-border tw-flex tw-items-center tw-justify-center tw-overflow-hidden ${getCircleStyles(state)}`}
      style={{ transition: "background-color 0.3s ease, border-color 0.3s ease" }}
    >
      <div key={animKey} style={innerStyle}>
        {content === "done" ? (
          <AnimatedCheck />
        ) : (
          <span className="tw-text-[14px] tw-font-semibold">{stepNumber}</span>
        )}
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const StepLabel = ({ title, state }) => (
  <span className={`tw-text-[14px] tw-text-[#48f] tw-font-[600] tw-flex-1 ${getTextStyles(state)}`}>
    {title}
  </span>
);

const ChevronDivider = () => (
  <div className="tw-relative tw-w-[65px] tw-flex tw-items-center tw-justify-center">
    <svg width="24" height="50" viewBox="0 0 24 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0 0 L20 25 L0 50"
        //stroke={isActive ? COLORS.primary : COLORS.gray}
        stroke={COLORS.gray}
        strokeWidth="1"
        fill="none"
        style={{ transition: "stroke 0.3s ease" }}
      />
    </svg>
  </div>
);

const StepContent = ({ step, currentStep, side = "left" }) => {
  const state = getStepState(currentStep, step.id);
  const px = side === "left" ? "tw-pl-4 tw-pr-0" : "tw-pl-0 tw-pr-4";
  return (
    <div className={`tw-flex-1 tw-flex tw-items-center tw-gap-5 ${px}`}>
      <StepCircle stepNumber={step.id} state={state} />
      <StepLabel title={step.title} state={state} />
    </div>
  );
};

// ─── Keyframe injection (runs once) ──────────────────────────────────────────
const STYLE_ID = "step-indicator-keyframes";
const injectKeyframes = () => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes pop-in {
      0%   { transform: scale(0.5); opacity: 0; }
      60%  { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(1);   opacity: 1; }
    }
    @keyframes draw-check {
      to { stroke-dashoffset: 0; }
    }
  `;
  document.head.appendChild(style);
};

// ─── Main export ──────────────────────────────────────────────────────────────
export default function StepIndicator({ step = 1 }) {
  useMemo(() => injectKeyframes(), []);
  const dividerIsActive = step > 1;

  return (
    <div className="tw-w-full tw-flex tw-justify-center">
      <div className="tw-w-full tw-max-w-[460px] tw-bg-white tw-border tw-border-[#e6e6e6] tw-rounded-full tw-overflow-hidden">
        <div className="tw-flex tw-items-stretch tw-h-[50px]">
          <StepContent step={STEPS[0]} currentStep={step} side="left" />
          <ChevronDivider isActive={dividerIsActive} />
          <StepContent step={STEPS[1]} currentStep={step} side="right" />
        </div>
      </div>
    </div>
  );
}