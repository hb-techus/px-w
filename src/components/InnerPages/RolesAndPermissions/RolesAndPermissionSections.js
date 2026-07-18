
/***************************************************************************************
 * @module       RolesAndPermission
 * @name         RolesAndPermission
 * @description  Component for displaying roles permission details accordion view
 * @createdon    March 2025
 ***************************************************************************************/

import React, { useMemo, useState } from 'react'

export default function PermissionsAccordion({
  apiResponse,
  selectedPermissionIds,
  setSelectedPermissionIds,
  setFormData
}) {
  const [openSections, setOpenSections] = useState({})
  const [openModules, setOpenModules] = useState({})

  // ── All original logic kept exactly ──────────────────────────────────────────
  const PERMISSION_HIERARCHIES = [
    ['view', 'add', 'create', 'edit', 'delete'],
    ['add_discount', 'edit_discount', 'delete_discount'],
    ['create_draft', 'edit', 'delete'],
    ['view', 'ai_extraction', 'ai_detection'],
  ]

  const getHierarchyForPermission = (label) =>
    PERMISSION_HIERARCHIES.find(chain => chain.includes(label)) || null

  const sections = useMemo(() => {
    const uniqueSections = new Set()
    apiResponse.forEach(item => uniqueSections.add(item.section_name))
    return Array.from(uniqueSections)
  }, [apiResponse])

  const groupedData = useMemo(() => {
    const grouped = {}
    sections.forEach(section => { grouped[section] = [] })
    ;(apiResponse || []).forEach(item => {
      if (grouped[item.section_name]) grouped[item.section_name].push(item)
    })
    return grouped
  }, [apiResponse, sections])

  const handlePermissionChange = (permissionId) => {
    let clickedPermission = null
    let siblingPermissions = []

    for (const item of apiResponse) {
      const found = item.permissions?.find(p => p.id === permissionId)
      if (found) {
        clickedPermission = found
        siblingPermissions = item.permissions
        break
      }
    }

    const exists = selectedPermissionIds?.includes(permissionId)
    const label = clickedPermission?.permission_label?.toLowerCase()

    if (!exists) {
      const idsToAdd = new Set([permissionId])
      const chain = getHierarchyForPermission(label)
      if (chain) {
        const idx = chain.indexOf(label)
        chain.slice(0, idx).forEach(reqLabel => {
          const match = siblingPermissions.find(p => p.permission_label?.toLowerCase() === reqLabel)
          if (match) idsToAdd.add(match.id)
        })
      } else {
        if (label !== 'view') {
          const viewPerm = siblingPermissions.find(p => p.permission_label?.toLowerCase() === 'view')
          if (viewPerm) idsToAdd.add(viewPerm.id)
        }
      }
      const merged = Array.from(new Set([...selectedPermissionIds, ...idsToAdd]))
      setSelectedPermissionIds(merged)
      setFormData(prev => ({ ...prev, permissions: Array.from(new Set([...prev.permissions, ...merged])) }))
    } else {
      const idsToRemove = new Set([permissionId])
      if (label === 'view') {
        siblingPermissions.forEach(p => idsToRemove.add(p.id))
      } else {
        const chain = getHierarchyForPermission(label)
        if (chain) {
          const idx = chain.indexOf(label)
          chain.slice(idx + 1).forEach(depLabel => {
            const match = siblingPermissions.find(p => p.permission_label?.toLowerCase() === depLabel)
            if (match) idsToRemove.add(match.id)
          })
        }
      }
      setSelectedPermissionIds(prev => prev.filter(id => !idsToRemove.has(id)))
      setFormData(prev => ({ ...prev, permissions: prev.permissions.filter(id => !idsToRemove.has(id)) }))
    }
  }

  const isPermissionChecked = permissionId => selectedPermissionIds.includes(permissionId)

  // ── UI helpers ────────────────────────────────────────────────────────────────
  const getSectionPermissionIds = (section) =>
    (groupedData[section] || []).flatMap(m => m.permissions?.map(p => p.id) || [])

  const getSectionSelectedCount = (section) =>
    getSectionPermissionIds(section).filter(id => selectedPermissionIds.includes(id)).length

  const getModulePermissionIds = (module) => module.permissions?.map(p => p.id) || []

  const isSectionAllChecked = (section) => {
    const ids = getSectionPermissionIds(section)
    return ids.length > 0 && ids.every(id => selectedPermissionIds.includes(id))
  }

  const isSectionIndeterminate = (section) => {
    const ids = getSectionPermissionIds(section)
    const count = ids.filter(id => selectedPermissionIds.includes(id)).length
    return count > 0 && count < ids.length
  }

  const isModuleAllChecked = (module) => {
    const ids = getModulePermissionIds(module)
    return ids.length > 0 && ids.every(id => selectedPermissionIds.includes(id))
  }

  const isModuleIndeterminate = (module) => {
    const ids = getModulePermissionIds(module)
    const count = ids.filter(id => selectedPermissionIds.includes(id)).length
    return count > 0 && count < ids.length
  }

  const handleSectionSelectAll = (section) => {
    const ids = getSectionPermissionIds(section)
    const allSelected = ids.every(id => selectedPermissionIds.includes(id))
    if (allSelected) {
      setSelectedPermissionIds(prev => prev.filter(id => !ids.includes(id)))
      setFormData(prev => ({ ...prev, permissions: prev.permissions.filter(id => !ids.includes(id)) }))
    } else {
      const merged = Array.from(new Set([...selectedPermissionIds, ...ids]))
      setSelectedPermissionIds(merged)
      setFormData(prev => ({ ...prev, permissions: Array.from(new Set([...prev.permissions, ...ids])) }))
    }
  }

  const handleModuleSelectAll = (module) => {
    const ids = getModulePermissionIds(module)
    const allSelected = ids.every(id => selectedPermissionIds.includes(id))
    if (allSelected) {
      setSelectedPermissionIds(prev => prev.filter(id => !ids.includes(id)))
      setFormData(prev => ({ ...prev, permissions: prev.permissions.filter(id => !ids.includes(id)) }))
    } else {
      const merged = Array.from(new Set([...selectedPermissionIds, ...ids]))
      setSelectedPermissionIds(merged)
      setFormData(prev => ({ ...prev, permissions: Array.from(new Set([...prev.permissions, ...ids])) }))
    }
  }

  const toggleSection = (section) =>
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))


  const handleExpandAll = () => {
    const s = {}; sections.forEach(sec => { s[sec] = true }); setOpenSections(s)
    const m = {}; apiResponse.forEach(mod => { m[mod.id] = true }); setOpenModules(m)
  }

  const handleCollapseAll = () => {
    setOpenSections({})
    const allClosed = {}
    apiResponse.forEach(mod => { allClosed[mod.id] = false })
    setOpenModules(allClosed)
  }

  const totalPermissions = apiResponse.flatMap(m => m.permissions || []).length
  const totalSelected = selectedPermissionIds.length

  const leftSections = sections.filter((_, i) => i % 2 === 0)
  const rightSections = sections.filter((_, i) => i % 2 !== 0)

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div className='tw-w-full tw-p-8 tw-bg-[#fff] tw-rounded-xl tw-border tw-shadow-sm'>

      {/* Top bar */}
      <div className='tw-flex tw-items-center tw-justify-between tw-mb-4'>
        <div className=''>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                Role Permissions
              </p>
              <p class="tw-text-[12px] tw-text-gray-500 tw-mt-0.5">Configure role access for each module and sub-feature</p>
        </div>
        <div className='tw-flex tw-gap-3 tw-items-center'>
        <span  className='tw-text-[12px] tw-font-semibold tw-px-2.5 tw-py-1 tw-rounded-full tw-bg-blue-50 tw-text-[#2563eb] tw-border tw-border-blue-100'>
          {totalSelected}/{totalPermissions} Permissions Enabled
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['Expand All', 'Collapse All'].map(label => (
            <button
              key={label}
              type='button'
              onClick={label === 'Expand All' ? handleExpandAll : handleCollapseAll}
              // style={{
              //   fontSize: '13px', color: '#374151',
              //   border: '1px solid #d1d5db', background: '#fff',
              //   borderRadius: '6px', padding: '5px 14px', cursor: 'pointer',
              // }}
              className='tw-text-[12px] tw-font-medium tw-px-4 tw-py-1 tw-rounded-md tw-border tw-border-gray-200 tw-text-gray-700 tw-bg-white hover:tw-bg-gray-50'
            >
              {label}
            </button>
          ))}
        </div>
        </div>
      </div>

      {/* Two-column grid */}
      <div className='tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4 tw-items-start'>
        {[leftSections, rightSections].map((colSections, colIdx) => (
          <div key={colIdx} className='tw-flex tw-flex-col tw-gap-4'>
            {colSections.map(section => {
              const sectionData = groupedData[section] || []
              const isSectionOpen = !!openSections[section]
              const selectedCount = getSectionSelectedCount(section)
              const totalCount = getSectionPermissionIds(section).length
              const allSelected = isSectionAllChecked(section)
              const indeterminate = isSectionIndeterminate(section)

              return (
                <div
                  key={section}
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Section header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px' ,  background: '#eff6ff'}}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Chevron toggle */}
                      <button
                        type='button'
                        onClick={() => toggleSection(section)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <svg
                          style={{ width: '17px', height: '17px', color: '#6b7280', transition: 'transform 0.2s', transform: isSectionOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                          fill='none' stroke='currentColor' strokeWidth='2.2' viewBox='0 0 24 24'
                        >
                          <path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7' />
                        </svg>
                      </button>

                      <IndeterminateCheckbox
                        checked={allSelected}
                        indeterminate={indeterminate}
                        onChange={() => handleSectionSelectAll(section)}
                      />

                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{section}</span>

                      {/* X/Y badge */}
                 
                    </div>
                      <div className='tw-flex tw-gap-4 tw-items-center'>
                             {totalCount > 0 && (
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#1d4ed8', background: '#dbeafe', padding: '2px 8px', borderRadius: '999px' }}>
                          {selectedCount}/{totalCount}
                        </span>
                      )}

                    <button
                      type='button'
                      onClick={() => handleSectionSelectAll(section)}
                      style={{ fontSize: '14px', fontWeight: 500, color: '#1d4ed8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' }}
                    >
                      {allSelected ? 'Deselect all' : 'Select all'}
                    </button>
                    </div>
                  </div>

                  {/* Modules */}
                  {isSectionOpen && (
                    <div style={{ borderTop: '1px solid #f3f4f6' }}>
                      {sectionData.length > 0 ? sectionData.map((module, mIdx) => {
                        const isModuleOpen = openModules[module.id] !== false
                        const modAllSelected = isModuleAllChecked(module)
                        const modIndeterminate = isModuleIndeterminate(module)

                        const skipModuleHeader =
                          sectionData.length === 1 &&
                          module.module_name?.trim().toLowerCase() === section?.trim().toLowerCase()

                        return (
                          <div key={module.id} style={{ borderBottom: mIdx < sectionData.length - 1 ? '1px solid #f3f4f6' : 'none' }}>

                            {/* Module header row — hidden when name duplicates section */}
                            {!skipModuleHeader && (
                              <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 16px 8px 42px',
                                background: '#fafafa',
                                borderBottom: '1px solid #f3f4f6',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button
                                    type='button'
                                    onClick={() => setOpenModules(prev => ({ ...prev, [module.id]: !isModuleOpen }))}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                                  >
                                    <svg
                                      style={{ width: '11px', height: '11px', color: '#9ca3af', transition: 'transform 0.2s', transform: isModuleOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                                      fill='none' stroke='currentColor' strokeWidth='2.5' viewBox='0 0 24 24'
                                    >
                                      <path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7' />
                                    </svg>
                                  </button>

                                  <IndeterminateCheckbox
                                    checked={modAllSelected}
                                    indeterminate={modIndeterminate}
                                    onChange={() => handleModuleSelectAll(module)}
                                    size='sm'
                                  />

                                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                                    {module.module_name}
                                  </span>
                                </div>

                                <button
                                  type='button'
                                  onClick={() => handleModuleSelectAll(module)}
                                  style={{ fontSize: '12px', fontWeight: 500, color: '#1d4ed8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' }}
                                >
                                  {modAllSelected ? 'Deselect all' : 'Select all'}
                                </button>
                              </div>
                            )}

                            {/* Permission checkboxes */}
                            {(isModuleOpen || skipModuleHeader) && (
                              <div style={{
                                display: 'flex', flexWrap: 'wrap', gap: '20px 20px',
                                padding: skipModuleHeader ? '12px 16px 14px 68px' : '10px 16px 12px 94px',
                                background: '#fff',
                              }}>
                                {module.permissions?.map(permission => (
                                  <PermCheckbox
                                    key={permission.id}
                                    label={permission.permission_name}
                                    checked={isPermissionChecked(permission.id)}
                                    onChange={() => handlePermissionChange(permission.id)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      }) : (
                        <p style={{ fontSize: '13px', color: '#9ca3af', padding: '12px 16px' }}>No modules available</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Indeterminate checkbox ────────────────────────────────────────────────────
function IndeterminateCheckbox({ checked, indeterminate, onChange, size = 'md' }) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate
  }, [indeterminate])
  const dim = size === 'sm' ? '18px' : '18px'
  return (
    <input
      ref={ref}
      type='checkbox'
      checked={checked}
      onChange={onChange}
      className={`${indeterminate?'#17803d':'#1d4ed8'}`}
      style={{ width: dim, height: dim,  cursor: 'pointer', flexShrink: 0 }}
    />
  )
}



// ── Individual permission checkbox ────────────────────────────────────────────
function PermCheckbox({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={onChange}
        style={{
          width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0,
          border: checked ? '2px solid #17803d' : '1.5px solid #d1d5db',
          background: checked ?'#17803d' : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.12s',
        }}
      >
        {checked && (
          <svg width='9' height='9' viewBox='0 0 24 24' fill='none'>
            <path d='M4 12L10 18L20 6' stroke='#fff' strokeWidth='3.5' strokeLinecap='round' strokeLinejoin='round' />
          </svg>
        )}
      </div>
      <span style={{ fontSize: '13px', color: '#4b5563' }}>{label}</span>
    </label>
  )
}