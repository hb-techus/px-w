import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogOutUser } from '../../services/techus-services'
import CONFIG from '../../config/config'
import FullPageLoader from '../../genriccomponents/loaders/FullPageLoader'
import { ShimmerThumbnail } from 'react-shimmer-effects'
import Bowser from 'bowser'
import defaultUserImg from '../../assets/Images/default_images/default_profile.png'
import { useDispatch, useSelector } from 'react-redux'
import { logout, fetchSession } from '../../reduxtoolbox/actions/authSlice'
import { clearPermissions } from '../../reduxtoolbox/actions/permissionsSlice'

const isInsideProject = pathname => pathname.startsWith('/project/view/')

const Navbar = ({ isExpanded }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch();
  

  const authStatus = useSelector(s => s?.auth?.status)
  const profileInfo = useSelector(s => s?.auth?.user?.[0]) || {}
  const isLoading = authStatus === 'idle' || authStatus === 'loading'

  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const profileMenuRef = useRef(null)
  const [imageVersion, setImageVersion] = useState(Date.now())
  const reduxProjectName = useSelector((s) => s.project?.project_name)
  const isAdminPortal = location.pathname.startsWith('/admin')
  const portal = isAdminPortal ? 'admin' : 'organization'
  const inProjectContext = isInsideProject(location.pathname)

  const capitalizeName = name =>
    name
      ? name
          .toLowerCase()
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : ''

  useEffect(() => {
    const handleProfileUpdate = () => {
      setImageVersion(Date.now())
      dispatch(fetchSession(portal))
    }
    window.addEventListener('profileUpdated', handleProfileUpdate)
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate)
  }, [dispatch, portal])

  useEffect(() => {
    const handleClickOutside = e => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target))
        setShowProfileMenu(false)
    }
    if (showProfileMenu)
      document.addEventListener('mousedown', handleClickOutside)
    else document.removeEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showProfileMenu])

 const confirmLogout = async () => {
  const browser = Bowser.getParser(window.navigator.userAgent)
  const device_info = {
    osName: browser.getOSName(),
    osVersion: browser.getOSVersion(),
    browserName: browser.getBrowserName(),
    browserVersion: browser.getBrowserVersion()
  }

  try {
    setIsLoggingOut(true)
    await LogOutUser({ device_info, user_id: profileInfo.id })
    dispatch(clearPermissions())
  } catch (e) {
    console.error('Logout Error:', e)
  } finally {
    setIsLoggingOut(false)

    dispatch(logout(portal))

    if (portal === 'admin') {
      localStorage.removeItem('prexo_admin_access_token')
      localStorage.removeItem('prexo_admin_uuid')
      localStorage.removeItem('prexo_admin_isAuthenticated')
      sessionStorage.removeItem('prexo_admin_2fa_allowed')
    } else {
      localStorage.removeItem('prexo_organization_access_token')
      localStorage.removeItem('prexo_organization_uuid')
      localStorage.removeItem('prexo_organization_isAuthenticated')
      localStorage.removeItem('organization_id')
      localStorage.removeItem('organization_uuid')
      sessionStorage.removeItem('prexo_organization_2fa_allowed')
    }

    navigate(isAdminPortal ? '/admin/login' : '/login', { replace: true })
  }
}

  // Extract UUID from URL: /project/view/:uuid/...
  const uuidFromPath = inProjectContext ? location.pathname.split('/')[3] : null;
  // Priority: location state → Redux (reactive) → per-UUID localStorage → old shared key (backwards compat)
  const projectName =
    location.state?.project?.project_name ||
    reduxProjectName ||
    (uuidFromPath && localStorage.getItem(`project_name_${uuidFromPath}`)) ||
    localStorage.getItem('current_project_name') ||
    ''
  return (
    <header
  className={`tw-fixed tw-bg-white tw-top-0 tw-right-0 tw-h-[60px]
    tw-shadow-[0_2px_1px_0_rgba(0,0,0,0.1)] tw-border-b tw-border-gray-200
    tw-flex tw-items-center tw-justify-between tw-px-4 tw-z-40
    tw-transition-all tw-duration-300 tw-ease-in-out
    ${isExpanded
      ? 'tw-ml-[220px] tw-w-[calc(100%-225px)]'
      : 'tw-ml-[60px] tw-w-[calc(100%-60px)]'
    }`}
>
  {isLoggingOut && <FullPageLoader />}
      

      {/* ── LEFT: back+breadcrumb on project pages, empty otherwise ── */}
      <div className='tw-flex tw-items-center tw-gap-3'>
        {inProjectContext ? (
          <div className='tw-flex tw-items-center tw-gap-2'>
            <button
              onClick={() => navigate('/projects')}
              className='tw-flex tw-items-center tw-justify-center tw-w-8 tw-h-8
                tw-rounded-md tw-border tw-border-gray-300 hover:tw-bg-gray-100 tw-transition'
            >
              <i className='icon-Back tw-text-[#0140c1] tw-text-[14px]' />
            </button>
            <div className='tw-flex tw-flex-col tw-leading-tight'>
              <span className='tw-text-xs tw-text-gray-400'>Projects/</span>
              <span className='tw-text-sm tw-font-semibold tw-text-[#0140c1] tw-truncate tw-max-w-[420px]'>
                {projectName}
              </span>
            </div>
          </div>
        ) : (
          // ✅ Empty on listing / non-project pages — no PrexoAI text
          <div />
        )}
      </div>
       
      {/* ── RIGHT: profile ── */}
      <div className='tw-flex tw-items-center tw-gap-2'>
        <div ref={profileMenuRef} className='tw-relative'>
          {isLoading ? (
            <div className='tw-flex tw-items-center tw-gap-2'>
              <ShimmerThumbnail height={32} width={180} rounded />
            </div>
          ) : (
            <button
              onClick={() => setShowProfileMenu(p => !p)}
              className='tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2 tw-rounded-md hover:tw-bg-gray-50 tw-transition'
            >
              <div className='tw-flex tw-flex-col tw-items-end tw-text-right'>
                <span className='tw-text-sm tw-font-semibold tw-text-gray-900 tw-leading-tight'>
                  {capitalizeName(profileInfo?.first_name)}
                  <span> </span>
                  {capitalizeName(profileInfo?.last_name)}
                </span>
                <span className='tw-text-xs tw-text-gray-500'>
                  {profileInfo?.role_name || 'Product Manager'}
                </span>
              </div>
              <div className='tw-h-9 tw-w-9 tw-rounded-lg tw-overflow-hidden tw-border tw-border-gray-200 tw-flex-shrink-0'>
                <img
                  src={`${CONFIG.VITE_AWS_ENDPOINT}/user_profile_images/${profileInfo?.image_name}?v=${imageVersion}`}
                  alt='Profile'
                  className='tw-h-full tw-w-full tw-object-cover'
                  onError={e => {
                    e.target.src = defaultUserImg
                  }}
                />
              </div>
              <i
                className={`icon-Dropdown tw-text-gray-500 tw-text-xs tw-transition-transform tw-duration-300 ${
                  showProfileMenu ? 'tw-rotate-180' : ''
                }`}
              />
            </button>
          )}

          {showProfileMenu && !isLoading && (
            <div className='tw-absolute tw-right-0 tw-mt-1 tw-w-[200px] tw-bg-white tw-rounded-md tw-shadow-lg tw-border tw-border-gray-100 tw-z-50'>
              <ul className='tw-text-sm tw-text-gray-700 tw-py-1'>
                <li
                  onClick={() => {
                    setShowProfileMenu(false)
                    navigate(isAdminPortal ? '/admin/profile' : '/profile')
                  }}
                  className='tw-px-4 tw-py-2.5 tw-cursor-pointer hover:tw-bg-gray-50 tw-border-b tw-border-gray-100'
                >
                  My Profile
                </li>
                <li
                  onClick={() => {
                    setShowProfileMenu(false)
                    setShowLogoutModal(true)
                  }}
                  className='tw-px-4 tw-py-2.5 tw-cursor-pointer hover:tw-bg-gray-50'
                >
                  Sign Out
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── LOGOUT MODAL ── */}
      {showLogoutModal && (
        <div className='tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black/50 tw-z-[60]'>
          <div className='tw-relative tw-bg-white tw-rounded-md tw-p-6 tw-w-[350px] tw-flex tw-flex-col tw-justify-center tw-items-center tw-gap-1'>
            <i className='icon icon-logout tw-text-[#939393] tw-text-4xl tw-mt-4 tw-mb-1' />
            <h2 className='tw-text-lg tw-text-[#444444] tw-font-semibold'>
              Sign Out
            </h2>
            <p className='tw-text-sm tw-text-[#474747] tw-mt-3 tw-mb-6 tw-text-center'>
              Are you sure you want to sign out of your account?
            </p>
            <div className='tw-w-full tw-flex tw-gap-3'>
              <button
                onClick={() => setShowLogoutModal(false)}
                className='tw-flex-1 tw-px-4 tw-py-2 tw-rounded-md tw-border tw-border-gray-300 tw-text-gray-700 hover:tw-bg-gray-50 tw-transition-all'
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className='tw-flex-1 tw-px-4 tw-py-2 tw-rounded-md tw-bg-[#0140c1] hover:tw-bg-[#3366dd] tw-text-white tw-transition-all'
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
