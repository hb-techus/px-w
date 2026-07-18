// import React from 'react'
// import General from './General'
// import Package from './Package'
// import AdvancedSettings from './AdvancedSettings'
// import { useEffect, useRef } from "react";

// const OrganizationDetailsLayout = () => {
//   const generalRef = useRef(null);
// const packageRef = useRef(null);
// const advancedRef = useRef(null);

// useEffect(() => {
//   const observer = new IntersectionObserver(
//     (entries) => {
//       entries.forEach((entry) => {
//         if (entry.isIntersecting) {
//           setActiveSection(entry.target.id);
//         }
//       });
//     },
//     { threshold: 0.6 }
//   );

//   [generalRef, packageRef, advancedRef].forEach((ref) => {
//     if (ref.current) observer.observe(ref.current);
//   });

//   return () => observer.disconnect();
// }, []);
//   return (
//     <div className='tw-w-full tw-flex tw-gap-4 tw-flex-col'>
//      <div id="general" ref={generalRef}>
//   <General />
// </div>

// <div id="package" ref={packageRef}>
//   <Package />
// </div>

// <div id="advanced" ref={advancedRef}>
//   <AdvancedSettings />
// </div>
//     </div>
//   )
// }

// export default OrganizationDetailsLayout

import React from 'react'
import General from './General'
import Package from './Package'
import AdvancedSettings from './AdvancedSettings'

const SECTION_MAP = {
  general:  <General />,
  package:  <Package />,
  advanced: <AdvancedSettings />,
}

const OrganizationDetailsLayout = ({ activeSection }) => {
  return (
    <div className='tw-w-full'>
      {SECTION_MAP[activeSection] ?? null}
    </div>
  )
}

export default OrganizationDetailsLayout
