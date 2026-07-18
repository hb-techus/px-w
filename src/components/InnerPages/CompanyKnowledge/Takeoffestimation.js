import React, { useState } from 'react'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import usePermissions from '../../Common/usePermissions'
import GeneralSection    from './GeneralSection'
import TakeoffSection    from './TakeoffSection'
// import EstimationSection from './EstimationSection'

// ══════════════════════════════════════════════════════════════════════════════
// ROOT EXPORT
// ══════════════════════════════════════════════════════════════════════════════

const TakeoffEstimationTab = () => {
    const organizationUuid = localStorage.getItem('organization_uuid')

    // permission check
    const { permissions } = usePermissions('company_knowledge_management', 'org_kb')
    const canEdit = !!permissions?.edit

    const [isPageLoading, setIsPageLoading] = useState(false)

    return (
        <div className='tw-flex tw-flex-col tw-gap-6 tw-p-[25px_30px_30px]'>
            {isPageLoading && <FullPageLoader />}

            <GeneralSection
                organizationUuid={organizationUuid}
                setPageLoading={setIsPageLoading}
                canEdit={canEdit}
            />
            <TakeoffSection
                organizationUuid={organizationUuid}
                setPageLoading={setIsPageLoading}
                canEdit={canEdit}
            />
            {/* <EstimationSection
                organizationUuid={organizationUuid}
                setPageLoading={setIsPageLoading}
                canEdit={canEdit}
            /> */}
        </div>
    )
}

export default TakeoffEstimationTab