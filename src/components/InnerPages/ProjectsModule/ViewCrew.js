import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import {
  LaborCrewDetail,
  LaborCrewUpdate,
  LaborWorkerList
} from '../../../services/techus-services'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import PageHeader from '../../Common/PageHeader'
import { normalizeLabel } from '../../../utils/textUtils'
import FilterDropdown from '../../../genriccomponents/FilterDropdown'

let _lid = 0
const nextId = () => ++_lid

const MAX_TRADES_IN_LABEL = 2

function tradeLabel (trade_names) {
  if (!trade_names) return ''
  const trades = trade_names.split(',').map(t => normalizeLabel(t.trim())).filter(Boolean)
  if (trades.length === 0) return ''
  if (trades.length <= MAX_TRADES_IN_LABEL) return trades.join(', ')
  return `${trades.slice(0, MAX_TRADES_IN_LABEL).join(', ')} +${trades.length - MAX_TRADES_IN_LABEL}`
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ViewCrew () {
  const navigate = useNavigate()
  const { id: crewUuid } = useParams()
  const location = useLocation()
  const isAdminPortal = location.pathname.startsWith('/admin')
  const backPath = isAdminPortal ? '/admin/labor/crew' : '/labor/crew'
  const organizationId = !isAdminPortal ? localStorage.getItem('organization_id') : null
  const scrollContainerRef = useRef(null)
  const permissionsList = useSelector(s => s?.auth?.user?.[0]?.permission_info) || {}
  const canEdit = !!permissionsList?.labor_cost?.edit

  const [crew, setCrew] = useState(null)
  const [members, setMembers] = useState([])
  const [allWorkers, setAllWorkers] = useState([])
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const totalEffort = Math.round(members.reduce((sum, m) => sum + (Number(m.ratio_percent) || 0), 0) * 100) / 100
  const isOver100 = totalEffort > 100
  const canUpdate =
    canEdit &&
    members.length > 0 &&
    totalEffort === 100 &&
    !isSaving &&
    members.every(m => m.worker_id && Number(m.ratio_percent) > 0)

  const getHourly = workerId => {
    if (!workerId) return ''
    const w = allWorkers.find(w => w.worker_id === workerId || w.worker_uuid === workerId)
    return w?.cost_per_hour ?? ''
  }

  const workerLabel = w => {
    const tl = tradeLabel(w.trade_names)
    return `${w.worker_name}${tl ? ` (${tl})` : ''}`
  }
  const workerOptions = allWorkers.map(workerLabel)

  const loadWorkers = useCallback(async () => {
    try {
      const res = await LaborWorkerList({
        search: '',
        sort_column: 'worker_name',
        sort_order: 'asc',
        limit: 1000,
        offset: 0,
        ...(organizationId && { organization_id: organizationId })
      })
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) setAllWorkers(Array.isArray(d.data) ? d.data : [])
    } catch { /* silent */ }
  }, [])

  const loadCrew = useCallback(async id => {
    try {
      setIsPageLoading(true)
      const res = await LaborCrewDetail({ crew_uuid: id, ...(organizationId && { organization_id: organizationId }) })
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) {
        const data = d.data
        setCrew(data)
        setMembers((data.members || []).map((m, i) => ({
          _lid: nextId(),
          member_id: m.member_id,
          worker_id: m.worker_id,
          worker_name: m.worker_name,
          ratio_percent: parseFloat(m.ratio_percent ?? 0),
          sort_order: i
        })))
      } else {
        showToast('error', d?.message || 'Crew not found')
        navigate(backPath)
      }
    } catch {
      showToast('error', 'Failed to load crew')
      navigate(backPath)
    } finally {
      setIsPageLoading(false)
    }
  }, [backPath, navigate])

  useEffect(() => { loadWorkers() }, [loadWorkers])
  useEffect(() => { if (crewUuid) loadCrew(crewUuid) }, [crewUuid, loadCrew])

  const addMember = () => {
    setMembers(prev => [...prev, {
      _lid: nextId(),
      member_id: null,
      worker_id: '',
      worker_name: '',
      ratio_percent: 0,
      sort_order: prev.length
    }])
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }
    }, 50)
  }

  const removeMember = lid => setMembers(prev => prev.filter(m => m._lid !== lid))

  const setMemberWorker = (lid, worker) => {
    setMembers(prev => prev.map(m =>
      m._lid === lid
        ? { ...m, worker_id: worker.worker_id ?? worker.worker_uuid, worker_name: worker.worker_name }
        : m
    ))
  }

  const setMemberEffort = (lid, value) => {
    setMembers(prev => prev.map(m =>
      m._lid === lid ? { ...m, ratio_percent: value } : m
    ))
  }

  const handleUpdate = async () => {
    if (!canUpdate) return
    if (members.some(m => !m.worker_id)) {
      showToast('error', 'Please select a worker for all member rows')
      return
    }
    try {
      setIsSaving(true)
      const payload = {
        crew_id: crew.crew_id,
        members: members.map((m, i) => ({
          worker_id: m.worker_id,
          ratio_percent: Number(m.ratio_percent) || 0,
          sort_order: i
        })),
        ...(organizationId && { organization_id: organizationId })
      }
      const res = await LaborCrewUpdate(payload)
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) {
        showToast('success', d.message || 'Crew updated successfully')
        navigate(backPath)
      } else {
        showToast('error', d?.message || 'Failed to update crew')
      }
    } catch (err) {
      showToast('error', err?.response?.data?.message || 'Failed to update crew')
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass =
    'tw-w-full tw-border tw-border-gray-200 tw-rounded-lg tw-px-3 tw-py-2.5 tw-text-sm tw-outline-none tw-bg-white tw-text-gray-800 focus:tw-border-blue-400 focus:tw-ring-1 focus:tw-ring-blue-200 tw-transition-colors'
  const disabledClass =
    'tw-w-full tw-border tw-border-[#dedddd] tw-rounded-lg tw-px-3 tw-py-2.5 tw-text-sm tw-outline-none tw-bg-[#efefef] tw-text-[#3e3e3e] tw-cursor-not-allowed'

  return (
    <div className='tw-min-h-screen tw-flex tw-flex-col tw-pt-[10px]'>
      {isPageLoading && <FullPageLoader />}

      <PageHeader
        parentTitle='Labor'
        title='View Labor Crew'
        onBack={() => navigate(backPath)}
      />

      {/* Crew info card */}
      <div className='tw-mt-[10px] tw-p-6 tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-mb-4 tw-max-w-[650px]'>
        <p className='tw-text-[14px] tw-font-medium tw-text-[#6a7282] tw-mb-1'>Crew Name</p>
        <p className='tw-text-[16px] tw-font-semibold tw-text-[#101828] tw-mb-3'>
          {crew?.crew_name || '—'}
        </p>
        {crew?.subsection_name && (
          <span className='tw-inline-flex tw-items-center tw-font-semibold tw-px-3 tw-py-1 tw-rounded-full tw-border tw-border-[#b6b7b9] tw-text-[12px] tw-text-[#3f3f3f] tw-bg-[#efefef]'>
            {crew.subsection_name}
          </span>
        )}
      </div>

      {/* Members card */}
      <div className='tw-p-6 tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-mb-4 tw-max-w-[650px]'>
        <div className='tw-flex tw-items-center tw-justify-between tw-mb-5'>
          <h3 className='tw-text-[16px] tw-font-medium tw-text-[#2d2e32]'>Crew Member(s)</h3>
          <button
            type='button'
            onClick={addMember}
            className='tw-inline-flex tw-items-center tw-gap-1.5 tw-text-sm tw-text-[#0140c1] tw-font-medium tw-bg-transparent tw-border-none tw-cursor-pointer hover:tw-text-blue-700 tw-transition-colors'
          >
            <Plus size={14} /> Add Member
          </button>
        </div>

        {members.length === 0 ? (
          <p className='tw-text-sm tw-text-gray-400 tw-py-4 tw-text-center'>
            No members. Click "+ Add Member" to add one.
          </p>
        ) : (
            <div ref={scrollContainerRef} className='tw-flex tw-flex-col tw-gap-3 tw-max-h-[320px] tw-overflow-y-auto tw-pr-1 custom-visible-scroll'>
            {members.map(m => {
              const hourly = getHourly(m.worker_id)
              return (
                <div key={m._lid} className='tw-border tw-border-gray-200 tw-rounded-lg tw-p-4'>
                  <div
                    className='tw-grid tw-gap-3 tw-items-end'
                    style={{ gridTemplateColumns: '1fr 90px 80px 32px' }}
                  >
                    <div className='tw-min-w-0'>
                      <p className='tw-text-[14px] tw-text-[#3b3b3b] tw-mb-1.5'>Member</p>
                      <FilterDropdown
                        options={workerOptions}
                        value={(() => {
                          const sel = allWorkers.find(w => w.worker_id === m.worker_id || w.worker_uuid === m.worker_id)
                          return sel ? workerLabel(sel) : (m.worker_name || undefined)
                        })()}
                        placeholder='Select Member'
                        onChange={opt => {
                          const w = allWorkers.find(w => workerLabel(w) === opt)
                          if (!w) return
                          const wId = w.worker_id ?? w.worker_uuid
                          const alreadyAdded = members.some(
                            existing => existing._lid !== m._lid && existing.worker_id === wId
                          )
                          if (alreadyAdded) {
                            showToast('error', 'Member is already added to this crew')
                            return
                          }
                          setMemberWorker(m._lid, w)
                        }}
                        width='tw-w-full'
                      />
                    </div>

                    <div>
                      <p className='tw-text-[14px] tw-text-[#3b3b3b] tw-mb-1.5'>$/hour</p>
                      <input
                        type='text'
                        value={hourly !== '' ? hourly : '—'}
                        readOnly
                        className={disabledClass}
                      />
                    </div>

                    <div>
                      <p className='tw-text-[14px] tw-text-[#3b3b3b] tw-mb-1.5'>% effort</p>
                      <input
                        type='number'
                        min='0'
                        max='100'
                        step='any'
                        value={m.ratio_percent}
                        onKeyDown={e => {
                          if (e.key === '-' || e.key === 'Subtract' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                            e.preventDefault()
                          }
                        }}
                        onChange={e => {
                          const val = e.target.value
                          if (val === '') {
                            setMemberEffort(m._lid, '')
                            return
                          }
                          const num = Number(val)
                          if (num >= 0) {
                            setMemberEffort(m._lid, num)
                          }
                        }}
                        className={inputClass}
                      />
                    </div>

                    <div className='tw-flex tw-items-end tw-justify-center'>
                      <button
                        type='button'
                        onClick={() => removeMember(m._lid)}
                        className='tw-h-[42px] tw-w-[32px] tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-border-none tw-cursor-pointer tw-text-red-400 hover:tw-text-red-600 tw-transition-colors tw-rounded'
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Total effort */}
        {members.length > 0 && (
          <div className='tw-mt-4 tw-pt-3 tw-border-t tw-border-gray-200'>
            <p className={`tw-text-[14px] tw-font-semibold ${isOver100 ? 'tw-text-red-500' : 'tw-text-green-600'}`}>
              Total effort: {totalEffort}%
            </p>
          </div>
        )}
      </div>

      {/* Footer — same style as CreateMember */}
      <div className='tw-flex tw-justify-end tw-gap-2 tw-mt-[20px] tw-mb-4'>
        <div
          className='tw-text-[#1e293b] tw-bg-[#dedede] tw-cursor-pointer tw-items-center tw-justify-center tw-flex tw-w-[114px] tw-py-[10px]
          tw-rounded-[5px] tw-border tw-border-transparent hover:tw-border-[#5e6c80] tw-transition-all tw-duration-300 tw-text-[16px]'
          onClick={() => navigate(backPath)}
        >
          <span className='px-3'>Cancel</span>
        </div>
        <button
          disabled={!canUpdate}
          onClick={handleUpdate}
          className={`tw-text-white tw-w-[216px] tw-relative py-[10px] tw-rounded-[5px]
            ${!canUpdate
              ? 'tw-bg-[#f0f0f0] !tw-text-[#a0a0a0] tw-border tw-cursor-not-allowed'
              : 'tw-bg-[#0140c1] tw-isolation-auto tw-z-10 before:tw-absolute before:tw-w-full before:tw-transition-all before:tw-duration-700 before:hover:tw-w-full before:-tw-right-full before:hover:tw-right-0 before:tw-rounded-full before:tw-bg-[#506adf] before:-tw-z-10 before:tw-aspect-square before:hover:tw-scale-150 tw-overflow-hidden before:hover:tw-duration-700'
            }`}
        >
          {isSaving ? 'Saving...' : 'Update'}
        </button>
      </div>
    </div>
  )
}
