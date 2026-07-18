/***************************************************************************************
 * @module       App 
 * @name         App
 * @description  Main application component that sets up routing and global components
 * @version      1.0.0
 * @license      Licensed under the MIT License
 * @createdon    October 2025
 * @since        1.0
 ***************************************************************************************/

import React, { useEffect, Suspense } from "react";
import { useDispatch } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import './assets/fonts/style.css'
import Loader from "./genriccomponents/loaders/RedLoader";
import ToastNotification from "./genriccomponents/techus-ToastNotification";
import { fetchSession } from './reduxtoolbox/actions/authSlice';
import router from './routes/techus-mainRoutes';

function App() {
  const dispatch = useDispatch();

 useEffect(() => {
  const adminToken = localStorage.getItem('prexo_admin_access_token')
  const organizationToken = localStorage.getItem('prexo_organization_access_token')

  const hash = window.location.hash || ''
  const path = hash.replace(/^#/, '')
  const portal = path.startsWith('/admin') ? 'admin' : 'organization'

  if (portal === 'admin' && adminToken) {
    dispatch(fetchSession('admin'))
  }

  if (portal === 'organization' && organizationToken) {
    dispatch(fetchSession('organization'))
  }
}, [dispatch])

  return (
    <Suspense fallback={<Loader />}>
      <RouterProvider router={router} />
      <ToastNotification />
    </Suspense>
  );
}

export default App;
