import React, { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import { VerifyOTP, ResendOTP } from '../../../services/techus-services'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import Bowser from 'bowser'
import { useDispatch } from 'react-redux'
import { setPermissions } from '../../../reduxtoolbox/actions/permissionsSlice'
import { login } from '../../../reduxtoolbox/actions/authSlice'
import { addTokens } from '../../../reduxtoolbox/actions/keySlice'
import { motion } from 'framer-motion'

const OTP_LENGTH = 6
//const MASK_DELAY = 500

const TwoFactorAuth = () => {
  const [code, setCode] = useState(Array(OTP_LENGTH).fill(''))
  //const [visibleIndexes, setVisibleIndexes] = useState({})
  const inputRefs = useRef([])
  //const maskTimeoutRefs = useRef({})

  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)
  const location = useLocation()
  const email_id = location.state?.email_id

  const isAdminRoute = location.pathname.startsWith('/admin')
  const portal = location.state?.portal || (isAdminRoute ? 'admin' : 'organization')

  //const userType = location.state?.user_type || (portal === 'admin' ? 'ADMIN' : 'ORGANIZATION')

  const dispatch = useDispatch()

  // const revealDigitTemporarily = index => {
  //   if (maskTimeoutRefs.current[index]) {
  //     clearTimeout(maskTimeoutRefs.current[index])
  //   }

  //   setVisibleIndexes(prev => ({
  //     ...prev,
  //     [index]: true
  //   }))

  //   maskTimeoutRefs.current[index] = setTimeout(() => {
  //     setVisibleIndexes(prev => ({
  //       ...prev,
  //       [index]: false
  //     }))
  //   }, MASK_DELAY)
  // }

  const handleVerify = async e => {
    e.preventDefault()
    const enteredCode = code.join('')

    if (!enteredCode || enteredCode.length !== 6) {
      showToast('error', 'The 2FA code is invalid, please enter valid code.')
      return
    }

    try {
      setIsLoading(true)

      const payload = {
        email_id,
        otp: enteredCode,
        keep_me_logged_in: keepLoggedIn ? true : false
      }

      const response = await VerifyOTP(payload)

      if (response?.valid === true) {
        const { id, organization_uuid } = response.user_data
        const organizationId = response.user_data?.organization_id

        const {
          organization_management,
          role_management,
          user_management,
          package_management,
          product_management
        } = response.user_data.permission_info

        if (portal === 'admin') {
          localStorage.setItem('prexo_admin_access_token', response.token)
          localStorage.setItem('prexo_admin_uuid', id)
          localStorage.setItem('prexo_admin_isAuthenticated', 'true')
          sessionStorage.removeItem('prexo_admin_2fa_allowed')
        } else {
          localStorage.setItem('prexo_organization_access_token', response.token)
          localStorage.setItem('prexo_organization_uuid', id)
          localStorage.setItem('prexo_organization_isAuthenticated', 'true')

          if (organizationId) {
            localStorage.setItem('organization_id', organizationId)
          }

          if (organization_uuid) {
            localStorage.setItem('organization_uuid', organization_uuid)
          }

          sessionStorage.removeItem('prexo_organization_2fa_allowed')
        }

        dispatch(
          setPermissions({ permissions: response.user_data.permission_info })
        )

        dispatch(
          login({
            portal,
            token: response.token,
            user_data: response.user_data
          })
        )

        const ud = response.user_data
        dispatch(addTokens({
          user_type: ud.user_type || '',
          uuid: ud.id || '',
          isAuthenticated: true,
          permissions: ud.permission_info || {},
          ...(ud.organization_id && { organization_id: ud.organization_id }),
          ...(ud.organization_uuid && { organization_uuid: ud.organization_uuid })
        }))

        if (portal === 'admin') {
          if (organization_management?.view) {
            navigate('/admin/organizations', { replace: true })
            return
          }
          if (package_management?.view) {
            navigate('/admin/packages', { replace: true })
            return
          }
          if (product_management?.view) {
            navigate('/admin/products', { replace: true })
            return
          }
          if (role_management?.view) {
            navigate('/admin/roles', { replace: true })
            return
          }
          if (user_management?.view) {
            navigate('/admin/users', { replace: true })
            return
          }
        } else {
          navigate('/projects', { replace: true })
        }
      } else {
        showToast('error', response.message)
        localStorage.setItem(
          portal === 'admin'
            ? 'prexo_admin_isAuthenticated'
            : 'prexo_organization_isAuthenticated',
          'false'
        )
      }
    } catch (error) {
      console.error('OTP Verification Error:', error)
      showToast('error', 'Error verifying OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return

    try {
      setIsLoading(true)

      const browser = Bowser.getParser(window.navigator.userAgent)
      const device_info = {
        os_name: browser.getOSName(),
        os_version: browser.getOSVersion(),
        browser_name: browser.getBrowserName(),
        browser_version: browser.getBrowserVersion()
      }

      const payload = {
        email_id,
        device_info
      }

      const response = await ResendOTP(payload)

      console.log("ResendOTP",response)
      if (response?.valid) {
        showToast('success', response.message || 'OTP resent successfully!')

        setCooldown(30)
        const interval = setInterval(() => {
          setCooldown(prev => {
            if (prev <= 1) {
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        showToast('error', response?.message || 'Failed to resend OTP.')
      }
    } catch (error) {
      console.error('Resend OTP Error:', error)
      showToast('error')
    } finally {
      setIsLoading(false)
    }
  }

 const handleChange = (value, index) => {
  if (!/^\d?$/.test(value)) return
  const newCode = [...code]
  newCode[index] = value
  setCode(newCode)
  if (value) {
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }
}

const handleKeyDown = (e, index) => {
  if (e.key === 'Backspace') {
    if (code[index]) {
      const newCode = [...code]
      newCode[index] = ''
      setCode(newCode)
      return
    }
    if (index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }
}

 const handlePaste = e => {
  e.preventDefault()
  const pasteData = e.clipboardData.getData('text').trim()
  if (!/^\d{6}$/.test(pasteData)) return
  setCode(pasteData.split(''))
  inputRefs.current[OTP_LENGTH - 1]?.focus()
}

 
const getDisplayValue = (digit) => {
  if (!digit) return ''
  return '*'
}

  return (
    <div className='tw-space-y-6'>
      {isLoading && <FullPageLoader />}

      <div className='tw-mb-10 tw-w-fit md:tw-w-[400px] md:tw-h-[50px]' />

      <h2 className='tw-text-2xl tw-font-semibold tw-text-[#0140c1] tw-text-center'>
        Two-Factor Authentication
      </h2>

      <div className='tw-w-full tw-flex tw-justify-center tw-items-center'>
        <p className='tw-text-center tw-text-sm tw-text-[#414141] tw-mt-2 tw-max-w-[300px] tw-w-full'>
          Please enter the 6-digit code sent to your registered email address
        </p>
      </div>

      <form onSubmit={handleVerify} className='tw-px-0 sm:tw-px-8'>
        <label className='tw-block tw-text-[#25333e]'>Enter Code</label>

        <div className='tw-flex tw-justify-between tw-mt-2 tw-mb-5'>
          {code.map((digit, index) => (
            <input
              key={index}
              type='text'
              inputMode='numeric'
              autoComplete='one-time-code'
              autoFocus={index === 0}
              maxLength={1}
             value={getDisplayValue(digit)}
              onChange={e => handleChange(e.target.value, index)}
              onKeyDown={e => handleKeyDown(e, index)}
              onPaste={index === 0 ? handlePaste : undefined}
              ref={el => (inputRefs.current[index] = el)}
              className='tw-w-10 tw-h-10 sm:tw-w-12 sm:tw-h-12 tw-text-center tw-text-lg tw-border-2 tw-bg-white tw-border-[#c1c1c1] tw-rounded-md
               focus:tw-border-[#0140c1] focus:tw-shadow-[0_0_8px_rgba(23,97,131,0.3)]
               hover:tw-border-[#0140c1] hover:tw-scale-105 tw-transition-all tw-duration-300
               tw-outline-none'
            />
          ))}
        </div>

        <div className='tw-flex tw-justify-between tw-items-center tw-mb-5'>
          <label className='tw-flex tw-items-center tw-space-x-2 tw-cursor-pointer'>
            <input
              type='checkbox'
              name='keep'
              onChange={e => setKeepLoggedIn(e.target.checked)}
              className='tw-w-5 tw-h-5 tw-cursor-pointer tw-rounded-full tw-border tw-border-gray-400 tw-accent-[#0140c1] tw-transition-all tw-duration-300 tw-ease-in-out focus:tw-ring-2 focus:tw-ring-[#0140c1]/40'
            />
            <span className='tw-text-[#25333e] tw-text-[11px] sm:tw-text-[13px]'>
              Keep me logged in 30 days
            </span>
          </label>

          <button
            type='button'
            onClick={handleResend}
            disabled={cooldown > 0 || isLoading}
            className={`tw-text-xs tw-underline tw-transition-all tw-duration-200 ${
              cooldown > 0
                ? 'tw-text-gray-400 tw-cursor-not-allowed'
                : 'tw-text-[#0140c1] hover:tw-text-[#0d3f56]'
            }`}
          >
            <span className='tw-text-[11px] sm:tw-text-[13px]'>
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
            </span>
          </button>
        </div>

        <motion.button
          type="submit"
          disabled={isLoading}
          className="tw-w-full tw-bg-blue-600 hover:tw-bg-blue-700 active:tw-bg-blue-800 disabled:tw-bg-gray-400 tw-text-white tw-py-3 tw-rounded-lg tw-font-semibold tw-transition-all tw-duration-300 tw-text-base disabled:tw-cursor-not-allowed tw-shadow-md hover:tw-shadow-lg"
        >
          {isLoading ? "Verifying..." : "Verify"}
        </motion.button>
      </form>
    </div>
  )
}

export default TwoFactorAuth