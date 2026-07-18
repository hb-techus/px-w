import React from 'react'
import { formatDateTime } from '../../../utils/commonUtils'

const CIRCLE_DUR = 0.5 // ring draws for 0.5s
const TICK_DUR = 0.35 // tick draws for 0.35s after ring completes
const STEP_TOTAL = 1.0 // total slot per step before next begins

const colors = {
  done: '#17803d',
  active: '#c16217',
  pending: '#d1d5db',
  error: '#c11717'
}

function resolveStep (idx, status) {
  if (status === 1) {
    if (idx === 0) return 'done'
    if (idx === 1) return 'active'
    return 'pending'
  }
  if (status === 2) {
    if (idx <= 1) return 'done'
    return 'active'
  }
  if (status === 3) return 'done'
  if (status === 0) {
    if (idx <= 1) return 'done'
    return 'error'
  }
  return 'pending'
}

// ── keyframes injected once ──────────────────────────────────────────────────
const TimelineStyles = () => (
  <style>{`
    @keyframes tl-ring {
      from { stroke-dashoffset: 57; }
      to   { stroke-dashoffset: 0;  }
    }
    @keyframes tl-tick {
      from { stroke-dashoffset: 20; }
      to   { stroke-dashoffset: 0;  }
    }
    @keyframes tl-fill-down {
      from { height: 0%;   }
      to   { height: 100%; }
    }
    @keyframes tl-pop-in {
      0%   { opacity: 0; transform: scale(0.75); }
      65%  { opacity: 1; transform: scale(1.18); }
      100% { opacity: 1; transform: scale(1);    }
    }
    @keyframes tl-spin {
      to { transform: rotate(360deg); }
    }
  `}</style>
)

// ── step icons ───────────────────────────────────────────────────────────────

// 1. ring draws → then tick appears in centre
const CheckIcon = ({ stepDelay }) => (
  <svg
    width='20'
    height='20'
    viewBox='0 0 20 20'
    style={{ overflow: 'visible' }}
  >
    {/* light fill */}
    <circle cx='10' cy='10' r='9' fill={colors.done} opacity='0.12' />
    {/* ring that draws around — circumference of r=9 ≈ 56.5, use 57 */}
    <circle
      cx='10'
      cy='10'
      r='9'
      fill='none'
      stroke={colors.done}
      strokeWidth='1.5'
      strokeDasharray='57'
      strokeDashoffset='57'
      strokeLinecap='round'
      style={{
        animation: `tl-ring ${CIRCLE_DUR}s ease forwards`,
        animationDelay: `${stepDelay}s`
      }}
    />
    {/* tick — only starts after ring finishes */}
    <polyline
      points='5.5,10.5 8.5,13.5 14.5,7'
      fill='none'
      stroke={colors.done}
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeDasharray='20'
      strokeDashoffset='20'
      style={{
        animation: `tl-tick ${TICK_DUR}s ease forwards`,
        animationDelay: `${stepDelay + CIRCLE_DUR}s`
      }}
    />
  </svg>
)

// 2. active — pops in with scale bounce then spins
const ActiveIcon = ({ stepDelay }) => (
  <div
    style={{
      display: 'inline-flex',
      opacity: 0,
      transformOrigin: 'center',
      animation: `tl-pop-in 0.45s ease forwards`,
      animationDelay: `${stepDelay}s`
    }}
  >
    {/* <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      style={{ animation: 'tl-spin 1.1s linear infinite' }}
    >
      <circle
        cx='10'
        cy='10'
        r='8'
        fill='none'
        stroke={colors.pending}
        strokeWidth='2.5'
      />
      <circle
        cx='10'
        cy='10'
        r='8'
        fill='none'
        stroke={colors.active}
        strokeWidth='2.5'
        strokeDasharray='22 29'
        strokeLinecap='round'
      />
    </svg> */}
    <span className='icon-Timeline tw-text-[#c16217] tw-text-[24px]'></span>
  </div>
)

// 3. error — same pop-in as active
const ErrorIcon = ({ stepDelay }) => (
  <svg
    width='20'
    height='20'
    viewBox='0 0 20 20'
    style={{
      opacity: 0,
      transformOrigin: 'center',
      animation: `tl-pop-in 0.4s ease forwards`,
      animationDelay: `${stepDelay}s`
    }}
  >
    <circle cx='10' cy='10' r='9' fill={colors.error} opacity='0.12' />
    <circle
      cx='10'
      cy='10'
      r='9'
      fill='none'
      stroke={colors.error}
      strokeWidth='1.5'
    />
    <line
      x1='6.5'
      y1='6.5'
      x2='13.5'
      y2='13.5'
      stroke={colors.error}
      strokeWidth='2'
      strokeLinecap='round'
    />
    <line
      x1='13.5'
      y1='6.5'
      x2='6.5'
      y2='13.5'
      stroke={colors.error}
      strokeWidth='2'
      strokeLinecap='round'
    />
  </svg>
)

const Dot = () => (
  <span
    style={{
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: '#e5e7eb',
      display: 'inline-block'
    }}
  />
)

// ── connector — fills top→bottom only after the step above it finishes ───────
const Connector = ({ fromState, connectorDelay }) => {
  const filled = fromState === 'done' || fromState === 'error'
  const color =
    fromState === 'error'
      ? colors.error
      : fromState === 'done'
      ? colors.done
      : colors.pending

  return (
    <div
      style={{
        position: 'relative',
        width: 2,
        flex: 1,
        minHeight: 36,
        margin: '4px auto',
        background: colors.pending,
        overflow: 'hidden'
      }}
    >
      {filled && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '0%',
            background: color,
            animation: `tl-fill-down 0.45s ease forwards`,
            animationDelay: `${connectorDelay}s`
          }}
        />
      )}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────
const Timeline = ({ data, viewResponse }) => {
  console.log('data.status', data, viewResponse)
  const stepLabels =
    data?.status === 0
      ? ['Uploaded', 'Processing', 'Error']
      : ['Uploaded', 'Processing', 'Completed']

  const timelineSteps = [
    { label: 'Uploaded', date: formatDateTime(viewResponse?.uploaded_date) },
    { label: 'Processing', date: formatDateTime(viewResponse.process_start_date) },
    { label: 'Completed', date: formatDateTime(viewResponse.process_end_date) }
  ]
  return (
    <>
      <TimelineStyles />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {timelineSteps.map((step, idx) => {
          const state = resolveStep(idx, data?.status)

          // each step starts only after the previous step's ring + tick finishes
          const stepDelay = idx * STEP_TOTAL
          const connectorDelay = stepDelay + CIRCLE_DUR + TICK_DUR

          return (
            <div
              key={idx}
              style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}
            >
              {/* icon + connector column */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 20
                }}
              >
                {state === 'done' && <CheckIcon stepDelay={stepDelay} />}
                {state === 'active' && <ActiveIcon stepDelay={stepDelay} />}
                {state === 'error' && <ErrorIcon stepDelay={stepDelay} />}
                {state === 'pending' && <Dot />}

                {idx < timelineSteps.length - 1 && (
                  <Connector
                    fromState={state}
                    connectorDelay={connectorDelay}
                  />
                )}
              </div>

              {/* label + date */}
              <div
                style={{
                  paddingBottom: idx < timelineSteps.length - 1 ? 20 : 0
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    margin: 0,
                    color:
                      state === 'pending'
                        ? '#9ca3af'
                        : state === 'error'
                        ? colors.error
                        : colors[state === 'active' ? 'active' : 'done'],
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {stepLabels[idx]}
                  {state === 'active' && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: colors.active,
                        background: '#fff7ed',
                        borderRadius: 4,
                        padding: '1px 6px'
                      }}
                    >
                      In Progress
                    </span>
                  )}
                </p>
                <p
                  style={{ fontSize: 12, color: '#6a7282', margin: '2px 0 0' }}
                >
                  {state !== 'pending'
                    ? (step.date?(step.date):'-')
                    : '-'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

export default Timeline
