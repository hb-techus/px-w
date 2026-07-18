import React, { useMemo } from 'react'

export default function RolePermissionView ({
  selectedPermissions = [],
  allPermissionsData = []
}) {
  const SECTION_ICONS = {
  'Bid Intelligence': 'icon-AI-RPF-Analyzer',
  'Takeoff Engine': 'icon-AI-Takeoff',
  'Estimate Builder': 'icon-AI-Estimator',
  'Contract Command': 'icon-Contract-Command',
  'User Management': 'icon-Admin-users',
  'Role Management': 'icon-Roles--Permissions',
  'Company Knowledge Management': 'icon-Company-knowledges',
  'Package Management':"icon-Packages",
  'Organization Management':"icon-Organization",
  "Product Management":"icon-Products"
}
  const groupedMatchedData = useMemo(() => {
    const grouped = {}

    allPermissionsData.forEach(moduleItem => {
      const matchedPermissions = moduleItem.permissions.filter(permission =>
        selectedPermissions.some(
          selected =>
            selected.module_id === moduleItem.id &&
            selected.permission_id === permission.id
        )
      )

      if (matchedPermissions.length > 0) {
        if (!grouped[moduleItem.section_name]) {
          grouped[moduleItem.section_name] = []
        }

        grouped[moduleItem.section_name].push({
          module_name: moduleItem.module_name,
          permissions: matchedPermissions.map(p => p.permission_name)
        })
      }
    })

    return grouped
  }, [selectedPermissions, allPermissionsData])
  const sectionNames = Object.keys(groupedMatchedData)

  return (
    <div className='tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-10'>
      {sectionNames.length > 0 ? (
        sectionNames?.map(sectionName => (
          <div
            key={sectionName}
            className='tw-rounded-[15px] tw-shadow-[0_4px_3px_0_rgba(0,0,0,0.05)] tw-border tw-border-[#e0e0e0]  '
          >
            
         
              

            <div className='tw-border-b tw-border-[#e0e0e0] tw-h-[60px] tw-bg-blue-50 tw-rounded-t-[15px] tw-flex tw-items-center'>
                   <div className='tw-ml-6 tw-bg-blue-100 tw-px-3 tw-py-3 tw-rounded-[10px] tw-flex tw-items-center tw-justify-center'>
                   <i
                  className={`${
                    SECTION_ICONS[sectionName] ?? 'icon-Settings'
                  } tw-text-blue-700 tw-text-[20px]`}
                />
              </div>
              <h3 className='tw-text-[16px] tw-font-semibold tw-leading-[1.5] tw-tracking-[-0.31px] tw-text-[#101828] tw-px-[25px]'>
                {sectionName}
              </h3>
            
            </div>

            <div className='tw-py-[12px] tw-px-[25px]'>
              {/* <div className="tw-grid tw-grid-cols-2 tw-gap-y-3 tw-gap-x-4 tw-mb-3">
                <p className="tw-text-[14px] tw-font-semibold tw-text-[#101828]">
                  Module Name
                </p>
                <p className="tw-text-[14px] tw-font-semibold tw-text-[#101828]">
                  Permission
                </p>
              </div> */}

              <div className='tw-space-y-3'>
                {groupedMatchedData[sectionName].map((item, index) => (
                  <div
                    key={index}
                    className='tw-grid tw-grid-cols-2 tw-gap-x-4 tw-py-2'
                  >
                    <p className='tw-text-[14px] tw-text-[#344054]'>
                      {item.module_name}
                    </p>

                    <div className='tw-flex tw-flex-wrap tw-gap-[20px]'>
                      {item.permissions.map(permission => (
                        <span
                          key={permission}
                          className='tw-px-2 tw-py-[2px] tw-rounded-[8px] tw-bg-blue-100 tw-text-blue-700 tw-text-xs'
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className='tw-col-span-full tw-text-center tw-text-[#667085] tw-py-8'>
          No matching permissions found
        </div>
      )}
    </div>
  )
}
