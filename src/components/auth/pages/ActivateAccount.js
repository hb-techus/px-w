import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { AccountActivation } from '../../../services/techus-services'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import { motion } from "framer-motion"

const ActivateAccount = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState('')
  const [form, setForm] = useState({
    password: '',
    confirmPassword: ''
  })

  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if it's admin based on pathname or lack of ut=org
  const ut = searchParams.get("ut")
  const isAdminLogin = location.pathname.startsWith("/admin") || ut !== "org"

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tokenFromUrl = params.get('token')
    if (tokenFromUrl) {
      setToken(tokenFromUrl)
    }
  }, [location.search])

  const validatePassword = password => {
    const regex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]:;"'<>,.?/]).{8,}$/
    return regex.test(password)
  }

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    let fieldError = ''
    if (name === 'password') {
      if (!value) fieldError = 'Please enter your password.'
      else if (!validatePassword(value))
        fieldError =
          'Must have 8 characters, 1 capital letter, 1 number, 1 special character'
      else if (form.confirmPassword && value !== form.confirmPassword)
        fieldError = 'Passwords do not match.'
    }

    if (name === 'confirmPassword') {
      if (!value) fieldError = 'Please enter your confirm password.'
      else if (value !== form.password) fieldError = 'Passwords do not match.'
    }

    setErrors(prev => ({ ...prev, [name]: fieldError }))
  }

  const handleSubmit = async e => {
    e.preventDefault()

    let tempErrors = {}
    if (!form.password) tempErrors.password = 'Please enter your password.'
    else if (!validatePassword(form.password))
      tempErrors.password =
        'Must have 8+ chars, 1 capital, 1 number, 1 special character.'

    if (!form.confirmPassword)
      tempErrors.confirmPassword = 'Please enter your confirm password.'
    else if (form.password !== form.confirmPassword)
      tempErrors.confirmPassword = 'Passwords do not match.'

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors)
      return
    }
    try {
      setIsLoading(true)
      const payload = {
        token: token,
        password: form.password,
        confirm_password: form.confirmPassword
      }
    
      const response = await AccountActivation(payload)
      //const parsed=JSON.parse(response)
      const parsed = typeof response === "string" ? JSON.parse(response) : response
      
   
    
      if (parsed.valid) {
        showToast('success', parsed?.message)
        // Navigate based on portal type
        navigate(isAdminLogin ? '/admin/login' : '/login')
      } else {
        showToast('error',parsed?.message)
       
      }
    } catch (error) {
      console.error('Error in Activate the Account:', error)
      showToast('error', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Shake animation for error fields
  // const shakeAnimation = (hasError) => hasError ? {
  //   x: [-8, 8, -6, 6, 0],
  //   transition: { duration: 0.4 }
  // } : {}

  return (
    <div className='tw-flex tw-flex-col tw-gap-3'>
      {isLoading && <FullPageLoader />}

      {/* Logo */}
      {/* <div className="tw-mb-10 tw-flex tw-justify-center">
        <div className="tw-w-12 tw-h-12 tw-rounded-xl tw-bg-gradient-to-br tw-from-blue-600 tw-to-purple-600 tw-text-white tw-font-extrabold tw-text-lg
             tw-flex tw-items-center tw-justify-center tw-shadow-lg tw-shadow-blue-500/30">
          AI
        </div>
      </div> */}

      {/* Header */}
      <motion.h2
        className='tw-text-2xl tw-font-semibold tw-text-center'
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        Activate Account
      </motion.h2>

      <motion.div
        className="tw-w-full tw-flex tw-justify-center tw-items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className='tw-text-center tw-max-w-[350px]'>
          <p className='tw-text-sm tw-text-[#414141]  tw-mb-0'>
            Your password must contain:
          </p>
          <p className='tw-text-sm tw-text-[#414141] tw-mb-5'>
            At least 8 characters; 1 capital letter; 1 number; 1 special character.
          </p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className='tw-flex tw-flex-col '>
        {/* Password */}
        <motion.div
          className='tw-mb-2'
          // animate={shakeAnimation(errors.password)}
        >
          <label className='tw-text-md tw-text-[#25333e]'>Password</label>
          <div className='tw-relative tw-w-full'>
            <div className='tw-absolute tw-inset-y-0 tw-top-2 tw-left-3 tw-flex tw-items-center tw-pointer-events-none'>
              <i className='icon icon-Password tw-text-[#25333e] tw-text-xl'></i>
            </div>

            <motion.input
              type={showPassword ? 'text' : 'password'}
              name='password'
              placeholder='Enter password'
              value={form.password}
              onChange={handleChange}
              disabled={isLoading}
              className={`tw-w-full tw-bg-white tw-text-sm tw-pl-10 tw-pr-10 tw-py-3 tw-border tw-rounded-md tw-mt-2 focus:tw-outline-none focus:tw-ring-1 tw-placeholder-[#25333e] tw-transition-all tw-duration-200 ${
                errors.password
                  ? 'tw-border-red-500 focus:tw-ring-red-500'
                  : 'tw-border-[#5e6c80] focus:tw-ring-[#0140c1] focus:tw-border-[#0140c1]'
              } placeholder:tw-text-[#999]`}
            />

            <div
              className='tw-absolute tw-inset-y-0 tw-right-3 tw-top-1 tw-flex tw-items-center tw-cursor-pointer'
              onClick={() => setShowPassword(!showPassword)}
            >
              <i
                className={`icon ${
                  showPassword ? 'icon-Eye' : 'icon-Eye-hide'
                } tw-transition-all tw-duration-200 tw-text-2xl tw-text-[#25333e]`}
              ></i>
            </div>
          </div>
          {(
            <motion.p
              className='tw-text-red-500 tw-text-xs tw-mt-2 tw-min-h-[16px]'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {errors.password && errors.password}
            </motion.p>
          )}
        </motion.div>

        {/* Confirm Password */}
        <motion.div
          className='tw-mb-3'
          // animate={shakeAnimation(errors.confirmPassword)}
        >
          <label className='tw-text-md tw-text-[#25333e]'>
            Confirm Password
          </label>
          <div className='tw-relative tw-w-full'>
            <div className='tw-absolute tw-inset-y-0 tw-top-2 tw-left-3 tw-flex tw-items-center tw-pointer-events-none'>
              <i className='icon icon-Password tw-text-[#25333e] tw-text-xl'></i>
            </div>

            <motion.input
              type={showConfirmPassword ? 'text' : 'password'}
              name='confirmPassword'
              placeholder='Re-enter password'
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              className={`tw-w-full tw-bg-white tw-text-sm tw-pl-10 tw-pr-10 tw-py-3 tw-border tw-rounded-md tw-mt-2 focus:tw-outline-none focus:tw-ring-1 tw-placeholder-[#25333e] tw-transition-all tw-duration-200 ${
                errors.confirmPassword
                  ? 'tw-border-red-500 focus:tw-ring-red-500'
                  : 'tw-border-[#5e6c80] focus:tw-ring-[#0140c1] focus:tw-border-[#0140c1]'
              } placeholder:tw-text-[#999]`}
            />

            <div
              className='tw-absolute tw-inset-y-0 tw-right-3 tw-top-1 tw-flex tw-items-center tw-cursor-pointer'
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <i
                className={`icon ${
                  showConfirmPassword ? 'icon-Eye' : 'icon-Eye-hide'
                } tw-transition-all tw-duration-200 tw-text-2xl tw-text-[#25333e]`}
              ></i>
            </div>
          </div>

          { (
            <motion.p
              className='tw-text-red-500 tw-text-xs tw-mt-2 tw-min-h-[16px]'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {errors.confirmPassword &&errors.confirmPassword}
            </motion.p>
          )}
        </motion.div>

        {/* Submit Button */}
        <motion.button
          type='submit'
          disabled={isLoading}
          whileHover={{
            scale: 1.03,
            backgroundPosition: "200% 0",
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={`
            tw-w-full tw-text-center tw-py-3 tw-rounded-md tw-font-medium tw-text-white
            tw-bg-blue-600 hover:tw-bg-blue-700 active:tw-bg-blue-800
            tw-bg-[length:200%_auto] tw-shadow-lg tw-select-none tw-cursor-pointer
            ${isLoading ? "tw-opacity-60 tw-cursor-not-allowed" : ""}
          `}
        >
          {isLoading ? 'Processing...' : 'Submit'}
        </motion.button>

        {/* Back to Login */}
        <motion.div
          onClick={() => navigate(isAdminLogin ? "/admin/login" : "/login")}
          className="tw-flex tw-justify-center tw-items-center tw-gap-3 tw-mt-10 tw-cursor-pointer tw-select-none"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <motion.i
            className="icon icon-Back tw-text-[#0140c1] tw-transition-colors tw-duration-300"
            transition={{ duration: 0.2 }}
          />

          <motion.p
            className="tw-text-[#0140c1] tw-font-medium tw-relative"
            whileHover={{ color: "#6f57ff" }}
            transition={{ duration: 0.2 }}
          >
            Back to Sign In

            <motion.span
              className="tw-absolute tw-left-1/2 tw-bottom-[-2px] tw-h-[1.5px] tw-bg-[#156082] tw-origin-center"
              initial={{ width: 0 }}
              whileHover={{ width: "100%", left: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          </motion.p>
        </motion.div>
      </form>
    </div>
  )
}

export default ActivateAccount