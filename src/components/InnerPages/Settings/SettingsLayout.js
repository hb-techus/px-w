import React from 'react'
import Settings from './Settings'
import { SettingsContext } from './Context/SettingsContext'
import useInfo from './Hooks/useInfo'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'

const SettingsLayout = () => {

  const {orgData,loading}=useInfo()
 
if(loading)
  return <FullPageLoader/>
  return (
   <SettingsContext.Provider value={{orgData,loading}}>
    <Settings/>
   </SettingsContext.Provider>
  )
}

export default SettingsLayout