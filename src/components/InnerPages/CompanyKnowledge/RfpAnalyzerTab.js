import React, { useEffect, useState } from 'react'
import {
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import CommonTextEditor from './CommonTextEditor'
import { showToast, setToastSuppressed } from '../../../genriccomponents/techus-ToastNotification'
import { GetRfpAnalyzerData, UpdateRfpAnalyzerData } from '../../../services/techus-services'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import usePermissions from '../../Common/usePermissions'

const STRATEGY_OPTIONS = [
  'Perfectly compliant, strong experience, competitive price',
  'Price is strong, but experience is thinner (or not stated)',
  'Experience is strong, but price will not be lowest',
  'Team is strong, but compliance/admin is the weak spot',
  'Schedule looks tight / long-lead risks / staffing constraints',
  'Best & Final Offer (BAFO) is requested'
]

const SEVERITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low']
const SECTION_STYLES = {
  bidScore: {
    title: 'Bid Score (Go/No Go)',
    description:
      'Define context that informs Go / No-Go bid scoring across severity levels.',
    iconClass: 'icon-Respond',
    accent: '#4f8cff',
    borderColor: '#dee9ff',
    headerBackground: '#eef4ff'
  },
  riskRadar: {
    title: 'Risk Radar (Risks)',
    description:
      'Capture organizational guidance for risk identification and prioritization.',
    iconClass: 'icon-Construction-risk',
    accent: '#ff5f6d',
    borderColor: ' #ffd1d1',
    headerBackground: '#fef1f1'
  },
  scopeGap: {
    title: 'Scope Gap Finder (Gaps)',
    description:
      'Provide context used to detect scope gaps and missing requirements.',
    iconClass: 'icon-Scope-Gap-Finder',
    accent: '#f59e0b',
    borderColor: '#fef1e0',
    headerBackground: ' #fffaf4'
  },
  winStrategist: {
    title: 'Win Strategist (Scenario-Based Guidance)',
    description:
      'Select the strategic scenarios that apply to your typical bid posture.',
    iconClass: 'icon-Reward',
    accent: '#22a06b',
    borderColor: '#e1f5ed',
    headerBackground: '#f5fbf9'
  }
}

const SEVERITY_STYLES = {
  Critical: {
    active: 'tw-border-transparent tw-bg-[#ff4d4f] tw-text-white'
  },
  High: {
    active: 'tw-border-transparent tw-bg-[#f97316] tw-text-white'
  },
  Medium: {
    active: 'tw-border-transparent tw-bg-[#f59e0b] tw-text-white'
  },
  Low: {
    active: 'tw-border-transparent tw-bg-[#4f8cff] tw-text-white'
  }
}


// Maps component section keys to API field names
const API_SECTION_MAP = {
  bidScore: 'go_no_go_analysis',
  riskRadar: 'risk_analysis',
  scopeGap: 'gap_analysis'
}

const DEFAULT_DRAFT = {
  bidScore: {
    severity: 'Critical',
    Critical: '',
    High: '',
    Medium: '',
    Low: ''
  },
  riskRadar: {
    severity: 'Critical',
    Critical: '',
    High: '',
    Medium: '',
    Low: ''
  },
  scopeGap: {
    severity: 'Critical',
    Critical: '',
    High: '',
    Medium: '',
    Low: ''
  },
  winStrategist: {
    selections: [...STRATEGY_OPTIONS]
  }
}

const DEFAULT_COLLAPSED_STATE = {
  bidScore: false,
  riskRadar: false,
  scopeGap: false,
  winStrategist: false
}

// Returns the first severity that has content, fallback to 'Critical'
const getActiveSeverity = severityData => {
  return SEVERITY_OPTIONS.find(s => !!severityData[s]) || 'Critical'
}

const SEVERITY_STORAGE_KEY = 'rfp_analyzer_active_severity'

const getSavedSeverities = () => {
  try {
    return JSON.parse(localStorage.getItem(SEVERITY_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

const saveSeverityToStorage = (sectionKey, severity) => {
  try {
    const current = getSavedSeverities()
    localStorage.setItem(SEVERITY_STORAGE_KEY, JSON.stringify({ ...current, [sectionKey]: severity }))
  } catch {
    // Ignore localStorage write failures.
  }
}

const createInitialDraft = () => {
  const savedSeverities = getSavedSeverities()
  const draft = JSON.parse(JSON.stringify(DEFAULT_DRAFT))

  ;['bidScore', 'riskRadar', 'scopeGap'].forEach(sectionKey => {
    const saved = savedSeverities[sectionKey]
    if (saved && SEVERITY_OPTIONS.includes(saved)) {
      draft[sectionKey].severity = saved
    }
  })

  return draft
}

const mergeDraftForSectionSave = (savedDraft, currentDraft, sectionKey) => {
  const nextDraft = JSON.parse(JSON.stringify(savedDraft))

  if (sectionKey === 'winStrategist') {
    nextDraft.winStrategist = {
      selections: [...currentDraft.winStrategist.selections]
    }
    return nextDraft
  }

  nextDraft[sectionKey] = {
    ...currentDraft[sectionKey]
  }

  return nextDraft
}

// Convert API response data to component draft structure
const apiToDraft = (apiData, savedSeverities = {}) => {
  const draft = JSON.parse(JSON.stringify(DEFAULT_DRAFT))

  ;['bidScore', 'riskRadar', 'scopeGap'].forEach(sectionKey => {
    const apiSection = apiData[API_SECTION_MAP[sectionKey]] || {}
    const severityData = {
      Critical: apiSection.critical || '',
      High: apiSection.high || '',
      Medium: apiSection.medium || '',
      Low: apiSection.low || ''
    }
    const saved = savedSeverities[sectionKey]
    draft[sectionKey] = {
      severity: saved && SEVERITY_OPTIONS.includes(saved) ? saved : getActiveSeverity(severityData),
      ...severityData
    }
  })

  const winData = apiData.win_strategist || {}
  const selections = STRATEGY_OPTIONS.filter((_, i) => winData[String(i)] === true)
  draft.winStrategist = {
    selections: selections.length ? selections : DEFAULT_DRAFT.winStrategist.selections
  }

  return draft
}

// Convert component draft structure to API request payload
const draftToApi = (draft, sectionKey = null) => {
  const apiData = {}

  const analysisSectionKeys = ['bidScore', 'riskRadar', 'scopeGap']
  const targetAnalysisSections = sectionKey
    ? analysisSectionKeys.filter(key => key === sectionKey)
    : analysisSectionKeys

  targetAnalysisSections.forEach(key => {
    const section = draft[key]
    apiData[API_SECTION_MAP[key]] = {
      critical: section.Critical || '',
      high: section.High || '',
      medium: section.Medium || '',
      low: section.Low || ''
    }
  })

  if (!sectionKey || sectionKey === 'winStrategist') {
    const winData = {}
    STRATEGY_OPTIONS.forEach((option, i) => {
      winData[String(i)] = draft.winStrategist.selections.includes(option)
    })
    apiData.win_strategist = winData
  }

  return apiData
}

const SectionCard = ({
  sectionKey,
  collapsed,
  onToggle,
  children
}) => {
  const section = SECTION_STYLES[sectionKey]
  const headerBackground = section.headerBackground
  const borderColor = section.borderColor
  const accent = section.accent

  return (
    <div
      className='tw-overflow-hidden tw-rounded-[10px] tw-border tw-bg-white tw-shadow-[0_2px_8px_rgba(15,23,42,0.03)]'
      style={{ borderColor }}
    >
      <div
        className='tw-flex tw-items-center tw-justify-between tw-gap-4 tw-border-b tw-px-3 tw-py-2'
        style={{
          backgroundColor: headerBackground,
          borderColor
        }}
      >
        <div className='tw-flex tw-items-center tw-gap-3'>
          <div
            className='tw-flex tw-h-11 tw-w-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-[6px]'
            style={{
              color: accent,
              backgroundColor: `${accent}14`
            }}
          >
            {section.iconClass ? (
              <i className={`${section.iconClass} tw-text-[24px] tw-leading-none`} />
            ) : (
              <section.icon size={21} />
            )}
          </div>

          <div>
            <h3 className='tw-text-[18px] tw-font-bold tw-text-[#333]'>
              {section.title}
            </h3>
            <p className=' tw-text-[15px] tw-font-normal tw-leading-[1.67] tw-tracking-[0.31px]  tw-text-[#000]'>
              {section.description}
            </p>
          </div>
        </div>

        <button
          type='button'
          onClick={onToggle}
          className='tw-flex tw-h-8 tw-w-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-[5px] tw-border tw-border-[#999] tw-bg-transparent tw-text-[#999]'
          aria-label={collapsed ? 'Expand section' : 'Collapse section'}
        >
          {collapsed ? <ChevronDown size={16} className='tw-block' /> : <ChevronUp size={16} className='tw-block' />}
        </button>
      </div>

      {!collapsed && <div className='tw-p-4'>{children}</div>}
    </div>
  )
}

const RfpAnalyzerTab = () => {
  const { permissions } = usePermissions('company_knowledge_management', 'org_kb')
  const canEdit = !!permissions?.edit
  const [draft, setDraft] = useState(() => createInitialDraft())
  const [savedDraft, setSavedDraft] = useState(() => createInitialDraft())
  const [collapsedSections, setCollapsedSections] = useState(DEFAULT_COLLAPSED_STATE)
  const [isFetching, setIsFetching] = useState(true)
  const [savingSection, setSavingSection] = useState(null)
  const [winStrategistError, setWinStrategistError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const organization_id = window.localStorage.getItem('organization_id') || ''
      try {
        const response = await GetRfpAnalyzerData(organization_id)
        if (response?.valid && response?.data?.rfp_analyzer_data) {
          const nextDraft = apiToDraft(response.data.rfp_analyzer_data, getSavedSeverities())
          setDraft(nextDraft)
          setSavedDraft(nextDraft)
        }
      } catch (error) {
        console.error('Failed to fetch RFP analyzer data:', error)
      } finally {
        setIsFetching(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (draft.winStrategist.selections.length && winStrategistError) {
      setWinStrategistError('')
    }
  }, [draft.winStrategist.selections, winStrategistError])

  const updateSeverity = (sectionKey, severity) => {
    saveSeverityToStorage(sectionKey, severity)
    setDraft(currentDraft => ({
      ...currentDraft,
      [sectionKey]: {
        ...currentDraft[sectionKey],
        severity
      }
    }))
  }

  const updateEditorContent = (sectionKey, content) => {
    setDraft(currentDraft => ({
      ...currentDraft,
      [sectionKey]: {
        ...currentDraft[sectionKey],
        [currentDraft[sectionKey].severity]: content
      }
    }))
  }

  const toggleWinStrategy = option => {
    setDraft(currentDraft => {
      const selections = currentDraft.winStrategist.selections.includes(option)
        ? currentDraft.winStrategist.selections.filter(item => item !== option)
        : [...currentDraft.winStrategist.selections, option]

      return {
        ...currentDraft,
        winStrategist: {
          selections
        }
      }
    })
  }

  const toggleSection = sectionKey => {
    setCollapsedSections(currentState => ({
      ...currentState,
      [sectionKey]: !currentState[sectionKey]
    }))
  }

  const handleSave = async sectionKey => {
    if (sectionKey === 'winStrategist' && !draft.winStrategist.selections.length) {
      setWinStrategistError('Please select at least one scenario before saving.')
      return
    }

    if (sectionKey === 'winStrategist') {
      setWinStrategistError('')
    }

    const organization_id = window.localStorage.getItem('organization_id') || ''
    const payloadDraft = mergeDraftForSectionSave(savedDraft, draft, sectionKey)
    setSavingSection(sectionKey)
    try {
      const response = await UpdateRfpAnalyzerData({
        organization_id,
        rfp_analyzer_data: draftToApi(payloadDraft)
      })
      if (response?.valid) {
        setSavedDraft(payloadDraft)
        setToastSuppressed(false)
        showToast('success', response?.data?.message || response?.message || `${SECTION_STYLES[sectionKey].title} saved successfully`)
      } else {
        setToastSuppressed(false)
        showToast('error', response?.data?.message || response?.message || 'Failed to save. Please try again.')
      }
    } catch (error) {
      console.error('Failed to save RFP analyzer data:', error)
      showToast('error', 'Failed to save. Please try again.')
    } finally {
      setSavingSection(null)
    }
  }

  if (isFetching) {
    return <FullPageLoader />
  }

  return (
    <div className='tw-space-y-4'>
      {['bidScore', 'riskRadar', 'scopeGap'].map(sectionKey => {
        const selectedSeverity = draft[sectionKey].severity
        const activeSeverityStyle =
          SEVERITY_STYLES[selectedSeverity]?.active || SEVERITY_STYLES.Low.active
        const isSaving = savingSection === sectionKey

        return (
          <SectionCard
            key={sectionKey}
            sectionKey={sectionKey}
            collapsed={collapsedSections[sectionKey]}
            onToggle={() => toggleSection(sectionKey)}
          >
            <div className='tw-mb-5 tw-inline-flex tw-flex-wrap tw-items-center tw-gap-0.5 tw-rounded-[6px] tw-bg-[#f3f4f6] tw-p-1'>
              {SEVERITY_OPTIONS.map(severity => (
                <button
                  key={severity}
                  type='button'
                  onClick={() => updateSeverity(sectionKey, severity)}
                  className={`tw-min-w-[72px] tw-rounded-[5px] tw-px-4 tw-py-1 tw-text-[14px] tw-font-500 tw-transition-colors ${
                    selectedSeverity === severity
                      ? `${activeSeverityStyle} tw-shadow-[0_1px_2px_rgba(15,23,42,0.12)]`
                      : 'tw-border-transparent tw-bg-transparent tw-text-[#686868] hover:tw-bg-white hover:tw-text-[#334155]'
                  }`}
                >
                  {severity}
                </button>
              ))}
            </div>

            <CommonTextEditor
              key={`${sectionKey}-${selectedSeverity}`}
              value={draft[sectionKey][selectedSeverity]}
              onChange={value => updateEditorContent(sectionKey, value)}
              placeholder={`Add ${selectedSeverity} severity context...`}
              minHeight='180px'
            />

            <div className='tw-mt-4 tw-flex tw-justify-end'>
              <button
                type='button'
                onClick={() => handleSave(sectionKey)}
                disabled={isSaving || !canEdit}
                className='tw-min-w-[95px] tw-rounded-[5px] tw-bg-[#0140c1] tw-px-4 tw-py-2 tw-text-[16px] tw-font-500 tw-text-[#fff] hover:tw-bg-blue-700 disabled:tw-opacity-60 disabled:tw-cursor-not-allowed'
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </SectionCard>
        )
      })}

      <SectionCard
        sectionKey='winStrategist'
        collapsed={collapsedSections.winStrategist}
        onToggle={() => toggleSection('winStrategist')}
      >
        <div className='tw-space-y-2'>
          {STRATEGY_OPTIONS.map(option => {
            const isSelected = draft.winStrategist.selections.includes(option)

            return (
              <button
                key={option}
                type='button'
                onClick={() => toggleWinStrategy(option)}
                aria-pressed={isSelected}
                className={`tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-gap-3 tw-rounded-[6px] tw-border tw-px-3 tw-py-3 tw-transition-colors ${
                  isSelected
                    ? 'tw-border-[#bfd4ff] tw-bg-[#f8fbff]'
                    : 'tw-border-[#e2e8f0] tw-bg-white hover:tw-bg-[#f8fafc]'
                }`}
              >
                <span
                  className={`tw-flex tw-h-5 tw-w-5 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-[4px] tw-transition-colors ${
                    isSelected
                      ? 'tw-bg-[#0140c1]'
                      : 'tw-bg-white'
                  }`}
                  style={{ border: '1px solid #0140c1' }}
                >
                  {isSelected && (
                    <i
                      className='icon-Tick tw-text-white tw-text-[10px] tw-leading-none'
                      aria-hidden='true'
                    />
                  )}
                </span>
                <span className='tw-text-[16px] tw-text-[#000]'>{option}</span>
              </button>
            )
          })}
        </div>

        {winStrategistError && (
          <p className='tw-mt-2 tw-text-[14px] tw-font-500 tw-text-[#dc2626]' role='alert'>
            {winStrategistError}
          </p>
        )}

        <div className='tw-mt-4 tw-flex tw-justify-end'>
          <button
            type='button'
            onClick={() => handleSave('winStrategist')}
            disabled={savingSection === 'winStrategist' || !canEdit}
            className='tw-min-w-[95px] tw-rounded-[5px] tw-bg-[#0140c1] tw-px-4 tw-py-2 tw-text-[16px] tw-font-500 tw-text-[#fff] hover:tw-bg-blue-700 disabled:tw-opacity-60 disabled:tw-cursor-not-allowed'
          >
            {savingSection === 'winStrategist' ? 'Saving...' : 'Save'}
          </button>
        </div>
      </SectionCard>
    </div>
  )
}

export default RfpAnalyzerTab
