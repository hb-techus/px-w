import React from 'react';

/**
 * SliderComponent
 */
const SliderComponent = ({
  label,
  value = 0,
  onChange,
  impact,
  canExecute = true,
  onBlockedInteraction,
}) => {
  const thumbPercent = ((value + 50) / 100) * 100;
  const fillLeft     = value < 0 ? thumbPercent : 50;
  const fillWidth    = Math.abs(value);

  const isPositive = value > 0;
  const isNegative = value < 0;

  /* ── dollar badge helpers ── */
  const hasImpact     = impact !== undefined && impact !== null;
  const impactPositive = hasImpact && impact >= 0;

  const fmtImpact = (v) => {
    const abs = "$" + Math.abs(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return v >= 0 ? `+${abs}` : `-${abs}`;
  };

  // ── Interaction handlers ──────────────────────────────────────────────────
  // If canExecute is false we intercept every user action on the input and
  // show the upgrade modal instead of changing the value.

  const handleChange = (e) => {
    if (!canExecute) {
      onBlockedInteraction?.();
      return;
    }
    onChange(parseInt(e.target.value));
  };

  // mousedown / touchstart: fires before the range input steals focus, so
  // this is the earliest we can intercept a drag attempt.
  const handlePointerDown = (e) => {
    if (!canExecute) {
      e.preventDefault(); // prevents the range thumb from moving
      onBlockedInteraction?.();
    }
  };

  return (
    <div className="tw-mb-6 last:tw-mb-0">
      {/* ── Label row: name | dollar-impact  %value ── */}
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-3">
        <span className="tw-text-[13px] tw-font-[600] tw-text-[#000]">{label}</span>

        <div className="tw-flex tw-items-center tw-gap-2">
          {hasImpact && (
            <span className={`tw-text-[13px] tw-font-semibold ${impactPositive ? "tw-text-[#f44]" : "tw-text-[#002149]"}`}>
              {fmtImpact(impact)}
            </span>
          )}
          <span className={`tw-text-[13px] tw-font-semibold tw-min-w-[36px] tw-text-right ${
            isPositive ? "tw-text-[#f44]" : isNegative ? "tw-text-[#002149]" : "tw-text-slate-400"
          }`}>
            {value > 0 ? `+${value}%` : value < 0 ? `${value}%` : "0%"}
          </span>
        </div>
      </div>

      {/* ── Track ── */}
      <div
        className="tw-relative tw-w-full tw-h-1.5 tw-flex tw-items-center"
        // show not-allowed cursor on the whole track area when blocked
        style={!canExecute ? { cursor: 'not-allowed' } : undefined}
      >
        <div className="tw-absolute tw-w-full tw-h-full tw-bg-slate-100 tw-rounded-full" />
        <div
          className="tw-absolute tw-h-full tw-bg-blue-500 tw-rounded-full tw-z-10"
          style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
        />
        <div
          className="tw-absolute tw-w-4 tw-h-4 tw-bg-white tw-border-2 tw-border-[#48f] tw-rounded-full tw-shadow-md tw-z-20 tw-pointer-events-none"
          style={{ left: `${thumbPercent}%`, transform: "translateX(-50%)" }}
        />
        <input
          type="range"
          min="-50"
          max="50"
          value={value}
          onChange={handleChange}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          // Keep the input in the tab order but visually signal it's locked
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            opacity: 0, zIndex: 30,
            cursor: canExecute ? 'pointer' : 'not-allowed',
          }}
        />
      </div>

      {/* ── Scale labels ── */}
      <div className="tw-flex tw-justify-between tw-mt-2">
        <span className="tw-text-[12px] tw-font-[500] tw-text-[#999]">-50%</span>
        <span className="tw-text-[12px] tw-font-[500] tw-text-[#999]">0%</span>
        <span className="tw-text-[12px] tw-font-[500] tw-text-[#999]">+50%</span>
      </div>
    </div>
  );
};

export default SliderComponent;