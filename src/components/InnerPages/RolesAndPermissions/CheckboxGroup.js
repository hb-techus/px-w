import React, { useEffect, useRef, useState } from 'react'
import { capitalizeFirstLetter } from '../../../utils/commonUtils'

const CheckboxGroup = ({
  label,
  childrenLabels,
  setPermissionList,
  PermissionList,
  setFormData,
  setStartPermissionCheck
}) => {
  const [checked, setChecked] = useState(
    new Array(childrenLabels.length).fill(false)
  )
  const parentRef = useRef(null)
  const [isIndeterminate, setIsIndeterminate] = useState(false)

  //When PermissionList changes (like when editing), sync checkbox state
  useEffect(() => {
    if (PermissionList?.length && childrenLabels?.length) {
      const updatedChecked = childrenLabels.map(child =>
        PermissionList.includes(child.id)
      )
      setChecked(updatedChecked)
    }
  }, [PermissionList, childrenLabels])

  // Handle parent checkbox toggle (select/deselect all)
  const handleParentChange = checkedValue => {
    setChecked(new Array(childrenLabels.length).fill(checkedValue))
    const childIds = childrenLabels.map(c => c.id)

    setStartPermissionCheck(true)
    if (checkedValue) {
      // Add all children IDs (no duplicates)

      setPermissionList(prev => Array.from(new Set([...prev, ...childIds])))
      setFormData(prev => ({
        ...prev,
        permissions: Array.from(new Set([...prev.permissions, ...childIds]))
      }))
    } else {
      // Remove all children IDs

      setPermissionList(prev => prev.filter(id => !childIds.includes(id)))
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(id => !childIds.includes(id))
      }))
    }
  }

  // Handle individual child checkbox
  const handleChildChange = (index, checkedValue, id) => {
    const newChecked = [...checked]
    newChecked[index] = checkedValue
    setChecked(newChecked)
    setStartPermissionCheck(true)
    if (checkedValue) {
      setPermissionList(prev => Array.from(new Set([...prev, id])))
      setFormData(prev => ({
        ...prev,
        permissions: Array.from(new Set([...prev.permissions, id]))
      }))
    } else {
      setPermissionList(prev => prev.filter(num => num !== id))
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(num => num !== id)
      }))
    }
  }

  //Manage indeterminate parent state
  useEffect(() => {
    if (parentRef.current) {
      const allChecked = checked.every(Boolean)
      const noneChecked = checked.every(v => !v)
      parentRef.current.indeterminate = !allChecked && !noneChecked
      setIsIndeterminate(!allChecked && !noneChecked)
    }
  }, [checked])

  return (
    <div className='tw-w-full'>
      {/* Parent */}
      <div className='tw-h-[45px] tw-px-[13px] py-[10.6px] tw-rounded-[5px] tw-bg-[#baced6] tw-flex tw-items-center tw-gap-[14px]'>
        <label
          className='tw-relative tw-inline-block tw-select-none tw-cursor-pointer'
          htmlFor={`parent-checkbox-${label}`}
        >
          <input
            ref={parentRef}
            type='checkbox'
            checked={checked.every(Boolean)}
            onChange={e => handleParentChange(e.target.checked)}
            className={`
    tw-appearance-none
    tw-relative tw-h-[20px] tw-w-[20px] tw-rounded-[3px]
    tw-border tw-border-solid tw-border-[#aaa]
    tw-transition-all tw-duration-300 tw-cursor-pointer
    ${isIndeterminate ? 'tw-bg-[#156082]' : 'tw-bg-[#fff]'}
    checked:tw-bg-[#156082]
    before:tw-content-[''] before:tw-absolute before:tw-hidden
    checked:before:tw-block before:tw-left-[7px] before:tw-top-[3px]
    before:tw-w-[5px] before:tw-h-[9px] before:tw-border-solid
    before:tw-border-[#fff] before:tw-border-r-[2px]
    before:tw-border-b-[2px] before:tw-rotate-45
    ${
      isIndeterminate
        ? 'after:tw-content-[""] after:tw-absolute after:tw-block after:tw-top-[8px] after:tw-left-[4px] after:tw-w-[10px] after:tw-h-[2px] after:tw-bg-white'
        : 'after:tw-hidden'
    }
  `}
            data-indeterminate={isIndeterminate}
            id={`parent-checkbox-${label}`}
          />
        </label>
        <span
          className='tw-text-[#002841] tw-text-[15px] tw-cursor-pointer'
          onClick={() => handleParentChange(!checked.every(Boolean))}
        >
          {capitalizeFirstLetter(label)}
        </span>
      </div>

      {/* Children */}
      <div className='tw-ml-[13px] tw-mt-[27px] tw-space-y-[24px]'>
        {childrenLabels.map((child, index) => (
          <div
            key={`${child.id}-${index}`}
            className='tw-flex tw-items-center tw-gap-[20px] tw-text-gray-700'
          >
            <label
              htmlFor={`child-checkbox-${child.id}`}
              className='tw-relative tw-inline-flex tw-items-center tw-select-none tw-cursor-pointer tw-gap-[10px]'
            >
              <input
                id={`child-checkbox-${child.id}`}
                type='checkbox'
                checked={checked[index]}
                onChange={e =>
                  handleChildChange(index, e.target.checked, child.id)
                }
                className={`tw-relative tw-w-5 tw-h-5 tw-cursor-pointer tw-appearance-none tw-border tw-border-gray-400 
             checked:tw-bg-[#156082] checked:tw-border-[#156082]
             before:tw-content-[''] before:tw-absolute before:tw-top-[4px] before:tw-left-[6px]
             before:tw-w-[5px] before:tw-h-[9px] before:tw-border-r-[2px] before:tw-border-b-[2px]
             before:tw-border-white before:tw-rotate-45 before:tw-opacity-0 
             checked:before:tw-opacity-100 tw-transition-all tw-rounded-[3px] `}
              />
              <span className='tw-text-[#25333e] tw-text-[14px]'>
                {child.permission_name}
              </span>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CheckboxGroup
