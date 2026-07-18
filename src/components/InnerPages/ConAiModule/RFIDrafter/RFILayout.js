import React from 'react'
import { Outlet, useOutletContext } from 'react-router-dom'

const RFILayout = () => {
  const outletContext = useOutletContext()

  return (
    <>
    <Outlet context={outletContext} />
    </>
  )
}

export default RFILayout
