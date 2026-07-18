// import React, { useState } from 'react'
// import LeftPanel from './Components/LeftPanel'
// import OrganizationDetailsLayout from './Components/OrganizationDetailsLayout'

// const Settings = () => {
//   const [activeSection, setActiveSection] = useState ("general");


//   return (
//     <div className='tw-py-4 tw-flex tw-gap-2'>
//         <LeftPanel activeSection={activeSection}/>
//         <OrganizationDetailsLayout setActiveSection={setActiveSection}/>
        
//     </div>
//   )
// }

// export default Settings

import React, { useState } from 'react'
import LeftPanel from './Components/LeftPanel'
import OrganizationDetailsLayout from './Components/OrganizationDetailsLayout'

const Settings = () => {
  const [activeSection, setActiveSection] = useState('general')

  return (
    <div className='tw-py-4 tw-flex tw-gap-2'>
      <LeftPanel activeSection={activeSection} setActiveSection={setActiveSection} />
      <OrganizationDetailsLayout activeSection={activeSection} />
    </div>
  )
}

export default Settings
