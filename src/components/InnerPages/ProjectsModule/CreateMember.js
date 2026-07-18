import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import {
  GetTakeoffCategories,
  LaborWorkerDetail,
  LaborWorkerAdd,
  LaborWorkerUpdate
} from '../../../services/techus-services'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import PageHeader from '../../Common/PageHeader'
import { normalizeLabel } from '../../../utils/textUtils'
import { capitalizeFirstLetter } from '../../../utils/commonUtils'
import DeleteModal from '../../../genriccomponents/DeleteModal'
import { TakeoffDropdown } from '../ConAiModule/TakeoffComponents/ToolbarShared'

const EXCLUDED_TRADES = ['general contractor', 'labor', 'labour']

const getDefaultForm = () => ({
  member_name: '',
  code: '',
  wage: '',
  trade_ids: []
})

const normalizeOptionValue = v => String(v ?? '').trim().toLowerCase()

export default function CreateMember () {
  const navigate = useNavigate()
  const { id: memberIdFromUrl = null } = useParams()
  const location = useLocation()

  const isAdminPortal = location.pathname.startsWith('/admin')
  const isExisting = Boolean(memberIdFromUrl)
  const basePath = isAdminPortal ? '/admin/labor/member' : '/labor/member'
  const organizationId = !isAdminPortal ? localStorage.getItem('organization_id') : null

  const [form, setForm] = useState(getDefaultForm)
  const [initialForm, setInitialForm] = useState(null)
  const [tradeRawData, setTradeRawData] = useState([])
  const [tradeDropOpen, setTradeDropOpen] = useState(false)
  const tradeRef = useRef(null)
  const [workerInternalId, setWorkerInternalId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const CODE_PATTERN = /^\d{2}-\d{4}(\.\d{2})?$/

  // Click-outside to close trade dropdown
  useEffect(() => {
    const handler = e => {
      if (tradeRef.current && !tradeRef.current.contains(e.target)) {
        setTradeDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const tradeDropOptions = useMemo(() =>
    tradeRawData.map(t => ({
      key: t.takeoff_id,
      label: normalizeLabel(t.takeoff_name)
    })),
    [tradeRawData]
  )

  const selectedTradeIds = useMemo(() => new Set(form.trade_ids), [form.trade_ids])

  const tradeTriggerLabel = useMemo(() => {
    if (selectedTradeIds.size === 0) return 'Select Trades'
    if (selectedTradeIds.size === 1) {
      const opt = tradeDropOptions.find(o => o.key === [...selectedTradeIds][0])
      return opt?.label || 'Trade'
    }
    return `${selectedTradeIds.size} Trades Selected`
  }, [selectedTradeIds, tradeDropOptions])

  const toggleTradeId = key => {
    const current = form.trade_ids
    setForm(prev => ({
      ...prev,
      trade_ids: current.includes(key)
        ? current.filter(k => k !== key)
        : [...current, key]
    }))
  }

  const updateField = (key, value) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const isFormValid =
    form.member_name.trim() &&
    form.code.trim() &&
    CODE_PATTERN.test(form.code.trim()) &&
    form.trade_ids.length > 0 &&
    String(form.wage).trim() !== ''

  const hasFormChanged =
    isExisting &&
    initialForm !== null &&
    JSON.stringify(form) !== JSON.stringify(initialForm)

  const loadTradeCategories = useCallback(async () => {
    try {
      const res = await GetTakeoffCategories(organizationId ? { organization_id: organizationId } : {})
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) {
        const filtered = (Array.isArray(d.data) ? d.data : []).filter(
          item => !EXCLUDED_TRADES.includes(normalizeOptionValue(normalizeLabel(item.takeoff_name)))
        )
        setTradeRawData(filtered)
      }
    } catch {
      showToast('error', 'Failed to fetch trade categories')
    }
  }, [])

  const loadMember = useCallback(async id => {
    try {
      setIsPageLoading(true)
      const res = await LaborWorkerDetail({ worker_uuid: id, ...(organizationId && { organization_id: organizationId }) })
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) {
        const worker = d.data || d
        // Capture the internal ID used for update/delete
        setWorkerInternalId(worker.worker_id ?? null)

        // trade_ids: try multiple response shapes
        let tradeIds = []
        if (Array.isArray(worker.trade_ids) && worker.trade_ids.length) {
          tradeIds = worker.trade_ids
        } else if (Array.isArray(worker.trades) && worker.trades.length) {
          tradeIds = worker.trades.map(t => t.takeoff_id ?? t.trade_id ?? t.id ?? t)
        }

        const loaded = {
          member_name: worker.worker_name || '',
          code: worker.code || '',
          wage: String(worker.cost_per_hour ?? ''),
          trade_ids: tradeIds
        }
        setForm(loaded)
        setInitialForm(loaded)
      } else {
        showToast('error', d?.message || 'Member not found')
        navigate(basePath)
      }
    } catch {
      showToast('error', 'Failed to load member')
      navigate(basePath)
    } finally {
      setIsPageLoading(false)
    }
  }, [basePath, navigate])

  useEffect(() => {
    loadTradeCategories()
  }, [loadTradeCategories])

  useEffect(() => {
    if (memberIdFromUrl) loadMember(memberIdFromUrl)
  }, [memberIdFromUrl, loadMember])

  const validate = () => {
    const err = {}
    if (!form.member_name.trim()) err.member_name = 'Member Name is required'
    if (!form.code.trim()) {
      err.code = 'Code is required'
    } else if (!CODE_PATTERN.test(form.code.trim())) {
      err.code = 'Code must be in format XX-XXXX or XX-XXXX.XX (e.g. 47-2043 or 47-2081.01)'
    }
    if (form.trade_ids.length === 0) err.trade = 'At least one trade is required'
    if (String(form.wage).trim() === '') err.wage = 'Wage is required'
    else if (Number(form.wage) < 0) err.wage = 'Wage cannot be negative'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const saveMember = async () => {
    if (!validate()) return
    try {
      setIsLoading(true)
      const payload = {
        worker_name: form.member_name,
        code: form.code || null,
        cost_per_hour: parseFloat(form.wage) || 0,
        trade_ids: form.trade_ids,
        ...(organizationId && { organization_id: organizationId })
      }

      let res
      if (isExisting) {
        res = await LaborWorkerUpdate({ ...payload, worker_id: workerInternalId ?? memberIdFromUrl })
      } else {
        res = await LaborWorkerAdd(payload)
      }

      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) {
        showToast('success', d.message || `Member ${isExisting ? 'updated' : 'saved'} successfully`)
        navigate(basePath)
      } else {
        showToast('error', d?.message || 'Failed to save member')
      }
    } catch (err) {
      showToast('error', err?.response?.data?.message || err?.message || 'Failed to save member')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = () => {
    if (!validate()) return
    if (isExisting && hasFormChanged) {
      setShowUpdateModal(true)
      return
    }
    void saveMember()
  }

  const validateCode = val => {
    const trimmed = val.trim()
    if (!trimmed) {
      return 'Code is required'
    } else if (!CODE_PATTERN.test(trimmed)) {
      return 'Code must be in format XX-XXXX or XX-XXXX.XX (e.g. 47-2043 or 47-2081.01)'
    }
    return ''
  }

  const handleCodeBlur = e => {
    const err = validateCode(e.target.value)
    setErrors(prev => ({ ...prev, code: err }))
  }

  const handleCodeChange = e => {
    const raw = e.target.value.replace(/[^0-9\-.]/g, '')
    const dotIdx = raw.indexOf('.')
    const mainPart = dotIdx >= 0 ? raw.slice(0, dotIdx) : raw
    const suffixPart = dotIdx >= 0 ? raw.slice(dotIdx + 1) : null
    const mainDigits = mainPart.replace(/-/g, '')
    const formatted = mainDigits.length > 2
      ? mainDigits.slice(0, 2) + '-' + mainDigits.slice(2, 6)
      : mainDigits
    const result = suffixPart !== null
      ? formatted + '.' + suffixPart.replace(/[^0-9]/g, '').slice(0, 2)
      : formatted
    updateField('code', result)

    if (!result.trim() || CODE_PATTERN.test(result.trim())) {
      setErrors(prev => ({ ...prev, code: '' }))
    } else {
      setErrors(prev => {
        if (prev.code) {
          return {
            ...prev,
            code: 'Code must be in format XX-XXXX or XX-XXXX.XX (e.g. 47-2043 or 47-2081.01)'
          }
        }
        return prev
      })
    }
  }

  const preventNegativeInput = e => {
    if (e.key === '-' || e.key === 'Subtract' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault()
  }

  const inputBase =
    'tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2.5 tw-text-sm tw-outline-none tw-transition-colors tw-bg-white tw-border-[#cacaca] focus:tw-border-[#0140c1] focus:tw-ring-1 focus:tw-ring-blue-200'
  const inputDisabled =
    'tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2.5 tw-text-sm tw-outline-none tw-bg-gray-50 tw-border-[#cacaca] tw-text-gray-500 tw-cursor-not-allowed'
  const inputError = 'tw-border-red-400 focus:tw-ring-1 focus:tw-ring-red-300'

  return (
    <div className='tw-min-h-screen tw-flex tw-flex-col tw-pt-[10px]'>
      {isPageLoading && <FullPageLoader />}

      <PageHeader
        parentTitle='Labor'
        title={`${isExisting ? 'Update' : 'Add'} Member`}
        onBack={() => navigate(basePath)}
      />

      <div
        className='tw-mt-[10px] tw-p-[25px] tw-rounded-[15px] tw-shadow-[0px_4px_3px_0px_rgba(0,0,0,0.05)]
        tw-border tw-border-[#e0e0e0] tw-bg-[#fff] tw-max-w-[37rem]'
      >
        <div className='tw-flex tw-flex-col tw-gap-5'>

          {/* Member Name */}
          <div>
            <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>
              Member Name <span className="tw-text-red-500">*</span>
            </label>
            <input
              value={capitalizeFirstLetter(form.member_name)}
              onChange={isExisting ? undefined : e => {
                const val = e.target.value.trimStart()
                updateField('member_name', val)
                setErrors(prev => ({ ...prev, member_name: val ? '' : prev.member_name }))
              }}
              onBlur={isExisting ? undefined : e => {
                const val = e.target.value.trim()
                updateField('member_name', val)
                setErrors(prev => ({ ...prev, member_name: val ? '' : 'Member Name is required' }))
              }}
              readOnly={isExisting}
              placeholder='Eg: Carpet Installers'
              maxLength={150}
              className={isExisting ? inputDisabled : `${inputBase} ${errors.member_name ? inputError : ''}`}
            />
            {errors.member_name && (
              <p className='tw-text-red-500 tw-text-xs tw-mt-1'>{errors.member_name}</p>
            )}
          </div>

          {/* Code — auto-formats as XX-XXXX or XX-XXXX.XX */}
          <div>
            <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>Code <span className="tw-text-red-500">*</span></label>
            <input
              value={form.code}
              onChange={isExisting ? undefined : handleCodeChange}
              onBlur={isExisting ? undefined : handleCodeBlur}
              readOnly={isExisting}
              placeholder='E.g. 47-2043 or 47-2081.01'
              maxLength={10}
              className={isExisting ? inputDisabled : `${inputBase} ${errors.code ? inputError : ''}`}
            />
            {errors.code && (
              <p className='tw-text-red-500 tw-text-xs tw-mt-1'>{errors.code}</p>
            )}
          </div>

          {/* Trade — multi-select */}
          <div>
            <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>Trade <span className="tw-text-red-500">*</span></label>
            {isExisting ? (
              <div className='tw-flex tw-flex-wrap tw-gap-1.5 tw-p-2.5 tw-border tw-border-[#cacaca] tw-rounded-lg tw-bg-gray-50 tw-min-h-[42px]'>
                {tradeDropOptions.filter(o => selectedTradeIds.has(o.key)).length === 0
                  ? <span className='tw-text-gray-400 tw-text-sm'>—</span>
                  : tradeDropOptions.filter(o => selectedTradeIds.has(o.key)).map(o => (
                      <span key={o.key} style={{
                        display: 'inline-flex', alignItems: 'center',
                        background: '#fff', border: '1px solid #E5E7EB',
                        borderRadius: 6, padding: '4px 10px',
                        fontSize: 13, color: '#374151', fontFamily: 'inherit', flexShrink: 0,
                      }}>
                        {o.label}
                      </span>
                    ))
                }
              </div>
            ) : (
              <TakeoffDropdown
                dropRef={tradeRef}
                dropOpen={tradeDropOpen}
                onDropOpen={() => setTradeDropOpen(p => !p)}
                dropOptions={tradeDropOptions}
                selected={selectedTradeIds}
                toggleItem={toggleTradeId}
                triggerLabel={tradeTriggerLabel}
              />
            )}
            {errors.trade && (
              <p className='tw-text-red-500 tw-text-xs tw-mt-2'>{errors.trade}</p>
            )}
          </div>

          {/* Wage */}
          <div>
            <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>
              Wage ($/hour) <span className="tw-text-red-500">*</span>
            </label>
            <div
              className={`tw-flex tw-w-full tw-items-center tw-border tw-rounded-lg tw-overflow-hidden tw-bg-white
                ${errors.wage
                  ? 'tw-border-red-400'
                  : 'tw-border-[#cacaca] focus-within:tw-border-[#0140c1] focus-within:tw-ring-1 focus-within:tw-ring-blue-200'
                }`}
            >
              <input
                type='number'
                min='0'
                step='0.01'
                value={form.wage}
                onChange={e => {
                  const val = e.target.value
                  if (val === '') {
                    updateField('wage', val)
                    setErrors(prev => ({ ...prev, wage: '' }))
                    return
                  }
                  if (Number(val) >= 0) {
                    const parts = val.split('.')
                    if (parts[1] && parts[1].length > 2) {
                      return
                    }
                    updateField('wage', val)
                    setErrors(prev => ({ ...prev, wage: '' }))
                  }
                }}
                onBlur={e => {
                  const val = e.target.value.trim()
                  let err = ''
                  if (val === '') err = 'Wage is required'
                  else if (Number(val) < 0) err = 'Wage cannot be negative'
                  setErrors(prev => ({ ...prev, wage: err }))
                }}
                onKeyDown={preventNegativeInput}
                placeholder='0.00'
                className='tw-w-full tw-flex-1 tw-px-3 tw-py-2.5 tw-text-sm tw-outline-none tw-bg-transparent tw-text-gray-800'
              />
            </div>
            {errors.wage && (
              <p className='tw-text-red-500 tw-text-xs tw-mt-1'>{errors.wage}</p>
            )}
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className='tw-flex tw-justify-end tw-gap-2 tw-mt-[20px] tw-mb-4'>
        <div
          className='tw-text-[#1e293b] tw-bg-[#dedede] tw-cursor-pointer tw-items-center tw-justify-center tw-flex tw-w-[114px] tw-py-[10px]
          tw-rounded-[5px] tw-border tw-border-transparent hover:tw-border-[#5e6c80] tw-transition-all tw-duration-300 tw-text-[16px]'
          onClick={() => navigate(basePath)}
        >
          <span className='px-3'>Cancel</span>
        </div>
        <button
          disabled={isLoading || !isFormValid}
          className={`tw-text-white tw-w-[216px] tw-relative py-[10px] tw-rounded-[5px]
            ${isLoading || !isFormValid
              ? 'tw-bg-[#f0f0f0] !tw-text-[#a0a0a0] tw-border tw-cursor-not-allowed'
              : 'tw-bg-[#0140c1] tw-isolation-auto tw-z-10 before:tw-absolute before:tw-w-full before:tw-transition-all before:tw-duration-700 before:hover:tw-w-full before:-tw-right-full before:hover:tw-right-0 before:tw-rounded-full before:tw-bg-[#506adf] before:-tw-z-10 before:tw-aspect-square before:hover:tw-scale-150 tw-overflow-hidden before:hover:tw-duration-700'
            }`}
          onClick={handleSave}
        >
          {isLoading ? 'Saving...' : isExisting ? 'Update Member' : 'Save Member'}
        </button>
      </div>

      {showUpdateModal && (
        <DeleteModal
          action='update'
          entity='member'
          icon='icon-Delete-memeber'
          onClose={() => setShowUpdateModal(false)}
          onConfirm={() => { setShowUpdateModal(false); void saveMember() }}
        />
      )}
    </div>
  )
}
