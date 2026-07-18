import React, { useEffect, useRef, useState } from 'react'
import {
  CreateRoles,
  GetModulesPermissionList,
  GetRoleDetail,
  UpdateRole,
  UserInfoByToken
} from '../../../services/techus-services'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import 'react-datepicker/dist/react-datepicker.css'
import { capitalizeFirstLetter } from '../../../utils/commonUtils'
import { setPermissions } from '../../../reduxtoolbox/actions/permissionsSlice'
import { useDispatch } from 'react-redux'
import PermissionsAccordion from './RolesAndPermissionSections'
import PageHeader from '../../Common/PageHeader'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'

const RolesPermissionForm = () => {
  // const role_id = searchParams.get('id')
  const { role_uuid } = useParams()
  const [moduleList, setModuleList] = useState()
  const [roleId, setRoleId] = useState(null)
  const navigate = useNavigate()
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [startPermissionCheck] = useState(false)
  const [initialLoader, setInitialLoader] = useState(true)
  const [permissionList] = useState([])
  const dispatch = useDispatch()
  const location = useLocation()
  const isAdminPortal = location.pathname.startsWith('/admin')
  const userType = isAdminPortal ? 'ADMIN' : 'ORGANIZATION'
  // localStorage.getItem('user_type')
  const organization_id = localStorage.getItem('organization_id')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([])
  const [apiLoading, setApiLoading] = useState(false)
  const [formData, setFormData] = useState({
    role_name: '',
    role_description: '',
    permissions: []
  })
  const [formError, setFormError] = useState({})
  const ref_role_description = useRef()
  const ref_role_name = useRef()
  const ref_permissions = useRef()
  const add_role_ref = useRef()

  // ── All original logic kept exactly ──────────────────────────────────────────

  useEffect(() => {
    const getPermissionRoles = async () => {
      try {
        setApiLoading(true)
        if (role_uuid) {
          const response = await GetRoleDetail({ role_uuid })
          if (response.valid) {
            const { role_name, role_description, permissions, id } = response.data
            setRoleId(id)
            const permissionIds = permissions.map(per => per.permission_id)
            setFormData(prev => ({ ...prev, role_name, role_description, permissions: permissionIds }))
            setSelectedPermissionIds(permissionIds)
          }
        }
      } catch (e) {
        console.error('e', e)
      } finally {
        setApiLoading(false)
      }
    }
    getPermissionRoles()
  }, [role_uuid])

  useEffect(() => {
    if (formSubmitted) { handleUiError(); setFormSubmitted(false) }
  }, [formSubmitted])

  useEffect(() => {
    if (startPermissionCheck) handleUiError('permissions')
  }, [permissionList, startPermissionCheck])

  useEffect(() => {
    const handleGetModulePermission = async () => {
      try {
        setInitialLoader(true)
        const response = await GetModulesPermissionList()
        if (response.valid) setModuleList(response.data)
      } catch (e) {
        console.error(e)
      } finally {
        setInitialLoader(false)
      }
    }
    handleGetModulePermission()
  }, [])

  const validateForm = (formData, isSubmitting = false) => {
    const errors = {}
    const validateField = (fieldName, value, validators) => {
      validators.forEach(validator => {
        const error = validator(value)
        if (error && !errors[fieldName]) errors[fieldName] = error
      })
    }
    const fieldValidators = {
      role_description: [
        value => !value?.trim() && 'Role Description is required.',
        // value => value?.trim().length < 3 && `Role Description must contain a minimum of 3 characters`,
        // value => value?.trim().length > 100 && `Role Description must contain less than 100 characters`
      ],
      role_name: [
        value => !value?.trim() && 'Role Name is required.',
        value => value?.trim().length < 3 && `Role Name must contain a minimum of 3 characters.`,
        value => value?.trim().length > 101 && `Role Name must contain less than 100 characters.`
      ],
      permissions: [value => value?.length == 0 && 'Select atleast one Permission.']
    }
    Object.keys(formData).forEach(fieldName => {
      if (fieldValidators[fieldName]) validateField(fieldName, formData[fieldName], fieldValidators[fieldName])
    })
    if (isSubmitting) {
      const additionalErrors = form_validation(formData)
      Object.assign(errors, additionalErrors)
    }
    return errors
  }


  const isDisabled =
    selectedPermissionIds.length === 0 ||
    !formData.role_name.trim() ||
    !formData.role_description.trim()

  const handleOnChnage = e => {
    let name = e.target.name
    let value = e.target.value
    value = value.replace(/^\s+/, '')
    value = value.replace(/\s{2,}/g, ' ')
    setFormData({ ...formData, [name]: value })
    handleUiError(name)
  }

  const handleUiError = (e, val) => {
    const name = e
    if (formSubmitted) {
      if (formError.role_name) ref_role_name.current.classList.add('border-red-500')
      if (formError.role_description) ref_role_description.current.classList.add('border-red-500')
      if (formError?.role_name || formError?.role_description || formError?.permissions) {
        add_role_ref.current.scrollIntoView({ behavior: 'smooth' })
      }
    }
    const setError = (key, value) => {
      setFormError(error => {
        const { [key]: _, ...rest } = error
        return value ? { ...error, [key]: value } : rest
      })
    }
    if (name === 'role_name') {
      const input = ref_role_name.current
      if (input?.value?.trim().length === 0) {
        input.classList.add('border-red-500'); setError('role_name', 'Role Name is required')
      } else if (input?.value?.trim().length > 101) {
        input.classList.add('border-red-500'); setError('role_name', `Role Name must contain less than 100 characters`)
      } else if (input?.value?.trim().length < 3) {
        input.classList.add('border-red-500'); setError('role_name', `Role Name must contain a minimum of 3 characters`)
      } else {
        input?.classList?.remove('border-red-500'); setError('role_name', null)
      }
      return
    }
    if (name === 'role_description') {
      const input = ref_role_description.current
      if (input?.value?.trim().length === 0) {
        input.classList.add('border-red-500'); setError('role_description', 'Role Description is required.')
      } 
      else {
        input.classList.remove('border-red-500'); setError('role_description', null)
      }
      return
    }
    if (name === 'permissions') {
      if (val ? val.length == 0 : selectedPermissionIds.length == 0) {
        setError('permissions', 'Select atleast one Permission')
      } else {
        setError('permissions', null)
      }
    }
  }

  const getRoleBasePath = () => {
    if (userType === 'ADMIN') return '/admin/roles'
    return '/roles'
  }

  const handleSubmit = async () => {
    let error_data = validateForm(formData)
    if (Object.keys(error_data).length > 0) {
      setFormError(error_data); setFormSubmitted(true); return false
    }
    try {
      setApiLoading(true)
      let response
      if (role_uuid) {
        response = await UpdateRole({ ...formData, role_id: roleId, permissions: selectedPermissionIds, organization_id })
      } else {
        response = await CreateRoles({ ...formData, role_type: userType, permissions: selectedPermissionIds, organization_id })
      }
      if (response.valid) {
        setFormData({ role_name: '', role_description: '', permissions: [] })
        const isAdminPortal = location.pathname.startsWith('/admin')
        const token = localStorage.getItem(isAdminPortal ? 'prexo_admin_access_token' : 'prexo_organization_access_token')
        const refreshed = await UserInfoByToken({ token })
        if (refreshed.valid) dispatch(setPermissions({ permissions: refreshed?.data?.permission_info }))
        setApiLoading(false)
        showToast('success', response.message)
        navigate(getRoleBasePath())
      } else {
        setApiLoading(false)
        showToast('error', response.message)
      }
    } catch (e) {
      console.error('e', e)
    } finally {
      setApiLoading(false)
    }
  }

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <React.Fragment>
      {(apiLoading || initialLoader) && <FullPageLoader />}

      <div>

        <PageHeader
          parentTitle='Roles'
          title={`${role_uuid ? 'Update' : 'Add'} Role`}
          onBack={() => navigate(getRoleBasePath())}
        />

        <div
          className='tw-flex tw-flex-col tw-gap-5'
          ref={add_role_ref}
          style={{ padding: '0 0 8px 0' }}
        >

          {/* ── Basic Information ─────────────────────────────────────────── */}
          <div style={{
            background: '#fff',
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            padding: '24px',
          }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '20px' }}>
              Basic Information
            </p>

            {/* Role Name */}
            <div style={{ marginBottom: '20px', maxWidth: '320px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                Role Name <span className="tw-text-red-500">*</span>
              </label>
              <input
                maxLength={80}
                ref={ref_role_name}
                name='role_name'
                autoComplete='off'
                type='text'
                placeholder='E.g. Senior Estimator'
                value={capitalizeFirstLetter(formData.role_name)}
                onChange={e => handleOnChnage(e)}
                onBlur={() => handleUiError('role_name')}
                style={{
                  width: '100%', height: '40px', padding: '0 12px',
                  borderRadius: '7px', border: formError.role_name ? '1.5px solid #ef4444' : '1px solid #d1d5db',
                  fontSize: '14px', color: '#111827', background: '#fff', outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.border = '1.5px solid #1d4ed8'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.1)' }}
              />
              {/* Character counter */}
              <p style={{ fontSize: '11px', color: formError.role_name ? '#ef4444' : '#9ca3af', marginTop: '4px' }}>
                {formError.role_name
                  ? formError.role_name
                  : `${formData.role_name.length}/80 characters (min: 3)`
                }
              </p>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                Description <span className="tw-text-red-500">*</span>
              </label>
              <textarea
                ref={ref_role_description}
                name='role_description'
                autoComplete='off'
                placeholder='Brief description of the role'
                value={capitalizeFirstLetter(formData.role_description)}
                onChange={e => handleOnChnage(e)}
                onBlur={() => handleUiError('role_description')}
                style={{
                  width: '100%', maxWidth: '520px', height: '100px', padding: '10px 12px',
                  borderRadius: '7px', border: formError.role_description ? '1.5px solid #ef4444' : '1px solid #d1d5db',
                  fontSize: '14px', color: '#111827', background: '#fff', outline: 'none',
                  resize: 'none', boxSizing: 'border-box', display: 'block',
                }}
                onFocus={e => { e.target.style.border = '1.5px solid #1d4ed8'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.1)' }}
              />
              <p style={{ fontSize: '11px', color: formError.role_description ? '#ef4444' : '#9ca3af', marginTop: '4px' }}>
                {formError.role_description
                  ? formError.role_description
                  : `${formData.role_description.length}/500 characters`
                }
              </p>
            </div>
          </div>

          {/* ── Role Permissions ───────────────────────────────────────────── */}
          <div ref={ref_permissions}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }} className='tw-bg-[#fff]'>
              {/* <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                Role Permissions
              </p> */}
              {formError.permissions && (
                <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 500 }}>
                  ({formError.permissions})
                </span>
              )}
            </div>

            {moduleList && (
              <PermissionsAccordion
                apiResponse={moduleList}
                selectedPermissionIds={selectedPermissionIds}
                setSelectedPermissionIds={setSelectedPermissionIds}
                setFormData={setFormData}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Action buttons ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', marginBottom: '24px' }}>
        <button
          type='button'
          onClick={() => setTimeout(() => navigate(getRoleBasePath()), 300)}
          style={{
            height: '42px', padding: '0 24px',
            borderRadius: '5px', border: '1px solid #d1d5db',
            background: '#dedede', color: '#1e293b',
            fontSize: '14px', fontWeight: 500, cursor: 'pointer',
          }}
        >
          Cancel
        </button>

        <button
          type='button'
          disabled={isDisabled}
          onClick={() => handleSubmit()}
          style={{
            height: '42px', padding: '0 28px',
            borderRadius: '7px', border: 'none',
            background: isDisabled ? '#e5e7eb' : '#1d4ed8',
            color: isDisabled ? '#9ca3af' : '#fff',
            fontSize: '14px', fontWeight: 600,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            boxShadow: isDisabled ? 'none' : '0 1px 3px rgba(29,78,216,0.3)',
            transition: 'background 0.2s',
          }}
        >
          {role_uuid ? 'Update Role' : 'Save Role'}
        </button>
      </div>
    </React.Fragment>
  )
}

export default RolesPermissionForm

