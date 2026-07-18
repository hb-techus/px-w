import React from 'react'
import { Outlet, useOutletContext } from 'react-router-dom'

const BidInviteLayout = () => {
  const outletContext = useOutletContext()

  return (
    <>
    <Outlet context={outletContext} />

    </>
  )
}

export default BidInviteLayout
