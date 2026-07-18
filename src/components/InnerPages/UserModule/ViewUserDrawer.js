import React, { useState } from 'react'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ResendActivation, ViewUser } from '../../../services/techus-services'
import { useParams } from 'react-router-dom'

import { DeactivateUser } from '../../../services/techus-services'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import { formatDateTime } from '../../../utils/commonUtils'
import { Link } from 'lucide-react'
import DeleteModal from '../../../genriccomponents/DeleteModal'
import usePermissions from '../../Common/usePermissions';
import ResetPasswordModal from '../../auth/pages/ResetPasswordModal'

const AdminViewUserPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { id } = useParams()
  const [userData, setUserData] = React.useState(
    location.state?.userData || null
  )
  const [loading, setLoading] = React.useState(true)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = React.useState(false)
  const [, setApiLoading] = React.useState(false)
  const pathName = location.pathname.split('/')

  const { permissions } = usePermissions('user_management', 'users');



  const isAdminPortal = location.pathname.startsWith('/admin')

  const uuid = localStorage.getItem(
    isAdminPortal ? 'prexo_admin_uuid' : 'prexo_organization_uuid'
  )

  console.log(pathName)
  const goBack = () => navigate('/users')

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true)
        const response = await ViewUser(id)
        console.log('Full response:', JSON.stringify(response, null, 2)) // CHECK THIS

        if (response?.valid) {
          const data =
            response.data?.user ||
            response.data?.data ||
            response.data ||
            response.user ||
            null

          console.log('Resolved data:', data) // CHECK THIS TOO
          setUserData(data)
        }
      } catch (error) {
        console.error('Error fetching user details:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchUserDetails()
  }, [id])

  console.log(userData)

  const handleDeactivateConfirm = async () => {
    try {
      setShowDeactivateModal(false)
      setApiLoading(true)

      const payload = {
        userId: userData?.id,
        status: userData?.status == 1 ? 0 : 1
      }

      const response = await DeactivateUser(payload)

      if (response?.valid) {
        showToast(
          'success',
          response.message || 'User status updated successfully'
        )
        pathName.includes('admin')
          ? navigate('/admin/users')
          : navigate('/users')
      } else {
        showToast('error', response?.message || 'Failed to update user status')
      }
    } catch (error) {
      console.error('Deactivate error:', error)
      showToast('error', 'Something went wrong while updating user status')
    } finally {
      setApiLoading(false)
    }
  }
  // const handlePasswordReset = async () => {
  //   try {

  //     if (!userData?.email_id) {
  //       showToast("Email not found", "error");
  //       return;
  //     }

  //     const payload = {
  //       email_id: userData.email_id
  //     };

  //     const response = await ForgotPassword(payload);

  //     if (response.valid) {
  //       showToast(response.message, "success");
  //     } else {
  //       showToast(response.message || "Failed to send password reset", "error");
  //     }

  //   } catch (error) {
  //     console.error("Password reset error:", error);
  //     showToast("Something went wrong. Please try again.", "error");
  //   }
  // };
  if (loading) {
    return <FullPageLoader />
  }
  return (
    <div className='tw-p-2 tw-min-h-screen '>
      {/* Breadcrumb & Header */}
      {/* <div className="tw-flex tw-items-center tw-gap-4 tw-mb-6">
        <button 
          onClick={goBack}
          className="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-bg-white tw-border tw-rounded-lg hover:tw-bg-gray-50 tw-transition-colors"
        >
          <ArrowLeft size={20} className="tw-text-gray-600" />
        </button>
        <div>
          <p className="tw-text-xs tw-text-gray-500">Users /</p>
          <h1 className="tw-text-xl tw-font-bold tw-text-gray-900">View User</h1>
        </div>
      </div> */}
      <div class='tw-flex tw-items-center tw-gap-4 tw-mb-6'>
        <button
          onClick={goBack}
          class='tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-bg-[#cbd5e1] tw-rounded-lg hover:tw-bg-[#0140c1] tw-transition-colors tw-duration-200'
        >
          <i class='icon-Previous tw-text-white tw-text-lg'></i>
        </button>

        <div class='tw-flex tw-flex-col tw-justify-center'>
          <div class='tw-text-gray-500 tw-text-sm tw-font-normal'>Users /</div>
          <h1 class='tw-text-gray-900 tw-text-xl tw-font-bold tw-leading-tight'>
            View user
          </h1>
        </div>
      </div>
      <div className='tw-flex tw-gap-6'>
        {/* Left Content Area */}
        <div className='tw-flex-[2.5] tw-space-y-6'>
          {/* Profile Information Card */}
          <section className='tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-p-8 tw-shadow-sm'>
            {/* Header Section */}
            <div className='tw-flex tw-items-center tw-gap-2.5 tw-mb-8'>
              <div className='tw-text-blue-600'>
                <i className='icon-Bonds tw-text-xl'></i>
              </div>
              <h2 className='tw-text-[18px] tw-font-bold tw-text-[#101828]'>
                Profile Information
              </h2>
            </div>

            {/* Two-Column Grid Layout */}
            <div className='tw-grid tw-grid-cols-2 tw-gap-x-16 tw-gap-y-6'>
              {/* Row 1: First and Last Name */}
              <div>
                <p className='tw-text-[14px] tw-font-medium tw-text-[#6a7282] tw-mb-1'>
                  First Name
                </p>
                <p className='tw-text-[14px] tw-font-normal tw-text-[#101828]'>
                  {userData?.first_name || 'N/A'}
                </p>
              </div>
              <div>
                <p className='tw-text-[13px] tw-font-medium tw-text-[#6a7282] tw-mb-1'>
                  Last Name
                </p>
                <p className='tw-text-[14px] tw-font-normal tw-text-[#101828]'>
                  {userData?.last_name || 'N/A'}
                </p>
              </div>

              {/* Row 2: Email Address (Full Width or Left Aligned) */}
              <div className='tw-col-span-2'>
                <p className='tw-text-[13px] tw-font-medium tw-text-[#6a7282] tw-mb-1'>
                  Email Address
                </p>
                <p className='tw-text-[14px] tw-font-normal tw-text-[#101828]'>
                  {userData?.email_id || 'N/A'}
                </p>
              </div>

              {/* Row 3: Organization and Role */}
              <div>
                <p className='tw-text-[13px] tw-font-medium tw-text-[#6a7282] tw-mb-1'>
                  Organization
                </p>
                <p className='tw-text-[14px] tw-font-normal tw-text-[#101828]'>
                  {userData?.organization_name || 'N/A'}
                </p>
              </div>
              <div>
                <p className='tw-text-[13px] tw-font-medium tw-text-[#6a7282] tw-mb-1'>
                  Role
                </p>
                <p className='tw-text-[14px] tw-font-normal tw-text-[#101828]'>
                  {userData?.role_name || 'N/A'}
                </p>
              </div>

              {/* Row 4: Status and Created At */}
              <div className='tw-w-fit'>
                <p className='tw-text-[13px] tw-font-medium tw-text-[#6a7282] tw-mb-1'>
                  Status
                </p>
                {!userData?.activation_date ? (
                  <span className='tw-inline-flex tw-items-center tw-gap-1.5 tw-px-3 tw-py-1 tw-rounded-full tw-bg-[#dee9ff] tw-text-[#0140c1] tw-border tw-border-blue-200 tw-text-[11px] tw-font-normal'>
                    <i className='icon-Timeline-fill tw-text-[10px]'></i>
                    Pending Activation
                  </span>
                ) : userData?.status === 1 || userData?.status === '1' ? (
                  <span className='tw-inline-flex tw-items-center tw-gap-1.5 tw-px-3 tw-py-1 tw-rounded-full tw-bg-green-50 tw-text-green-600 tw-border tw-border-green-100 tw-text-[11px] tw-font-normal'>
                    <i className='icon-Project-Details tw-text-[10px]'></i>
                    Active
                  </span>
                ) : (
                  <span className='tw-inline-flex tw-items-center tw-gap-1.5 tw-px-3 tw-py-1 tw-rounded-full tw-bg-[#fef3f2] tw-text-[#b91c1b] tw-border tw-border-[#fecaca] tw-text-[11px] tw-font-normal'>
                    <i className='icon-Error tw-text-[10px]'></i>
                    Inactive
                  </span>
                )}
              </div>
              <div>
                <p className='tw-text-[13px] tw-font-medium tw-text-[#6a7282] tw-mb-1'>
                  Created At
                </p>
                <p className='tw-text-[14px] tw-font-normal tw-text-[#101828]'>
                  {formatDateTime(userData?.created_date) || 'N/A'}
                </p>
              </div>
            </div>
          </section>

          {/* Activity Information Card */}
          <section className='tw-bg-white tw-rounded-xl tw-border tw-p-8 tw-shadow-sm '>
            <h2 className='tw-text-[18px] tw-font-bold tw-text-gray-800 tw-mb-6'>
              Activity Information
            </h2>

            <div className='tw-flex tw-flex-col tw-gap-y-5'>
              {/* Last Login */}
              <div>
                <p className='tw-text-[14px] tw-font-normal tw-text-slate-400 tw-mb-1'>
                  Last Login
                </p>
                <p className='tw-text-[16px] tw-font-normal tw-text-gray-900'>
                  {userData?.last_login_date
                    ? formatDateTime(userData?.last_login_date)
                    : 'N/A'}
                </p>
              </div>

              {/* Last Password Change */}
              <div>
                <p className='tw-text-[14px] tw-font-normal tw-text-slate-400 tw-mb-1'>
                  Last Password Change
                </p>
                <p className='tw-text-[16px] tw-font-normal tw-text-gray-900'>
                  {userData?.last_password_change_date
                    ? formatDateTime(userData?.last_password_change_date)
                    : 'N/A'}
                </p>
              </div>
            </div>
          </section>

          {/* Security Events Section */}
          <section className='tw-bg-white tw-rounded-xl tw-border tw-p-6 tw-shadow-sm'>
            <div className='tw-flex tw-items-center tw-gap-2 tw-mb-8'>
              <div className='tw-flex tw-items-center tw-justify-center tw-w-5 tw-h-5 tw-rounded-full tw-border-2 tw-border-blue-500 tw-text-blue-500'>
                <span className='tw-text-xs tw-font-bold'>!</span>
              </div>
              <h2 className='tw-text-[18px] tw-font-bold tw-text-slate-800'>
                Security Events
              </h2>
            </div>

            <div className='tw-space-y-8'>
              {/* Activation */}
              <div className='tw-border-l-2 tw-border-blue-200 tw-pl-4 tw-ml-1'>
                <h3 className='tw-text-[14px] tw-font-bold tw-text-slate-800 tw-mb-3'>
                  Activation
                </h3>
                <div className='tw-space-y-4'>
                  {/* Activation link sent */}
                  <div className='tw-flex tw-justify-between tw-items-start'>
                    <div>
                      <p className='tw-text-[14px] tw-text-slate-500'>
                        Activation link sent
                      </p>
                      <p className='tw-text-sm tw-font-normal tw-text-slate-800'>
                        {userData?.activation_link_sent_date
                          ? formatDateTime(userData?.activation_link_sent_date)
                          : 'N/A'}
                      </p>
                    </div>
                    <span className='tw-text-[10px] tw-font-bold tw-bg-blue-50 tw-text-blue-500 tw-px-2 tw-py-1 tw-rounded'>
                      Email
                    </span>
                  </div>

                  {/* Account activated */}
                  <div className='tw-flex tw-justify-between tw-items-start'>
                    <div>
                      <p className='tw-text-[14px] tw-text-slate-500'>
                        Account activated
                      </p>
                      <p className='tw-text-sm tw-font-normal tw-text-slate-800'>
                        {userData?.activation_date
                          ? formatDateTime(userData?.activation_date)
                          : 'N/A'}
                      </p>
                    </div>
                    <span className='tw-text-[10px] tw-font-bold tw-bg-green-50 tw-text-green-600 tw-px-2 tw-py-1 tw-rounded'>
                      Completed
                    </span>
                  </div>
                </div>
              </div>

              {/* Password Reset */}
              <div className='tw-border-l-2 tw-border-purple-200 tw-pl-4 tw-ml-1'>
                <h3 className='tw-text-sm tw-font-bold tw-text-slate-800 tw-mb-3'>
                  Password Reset
                </h3>
                {userData?.password_reset_date ? (
                  <div className='tw-flex tw-justify-between tw-items-start'>
                    <div>
                      <p className='tw-text-[14px] tw-text-slate-500'>
                        Password reset requested
                      </p>
                      <p className='tw-text-sm tw-font-normal tw-text-slate-800'>
                        {new Date(
                          userData.password_reset_date
                        ).toLocaleString()}
                      </p>
                    </div>
                    <span className='tw-text-[10px] tw-font-bold tw-bg-purple-50 tw-text-purple-600 tw-px-2 tw-py-1 tw-rounded'>
                      Completed
                    </span>
                  </div>
                ) : (
                  <p className='tw-text-sm tw-italic tw-text-slate-400'>
                    No password reset requests
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Sidebar - Quick Actions */}
        {/* Right Sidebar - Quick Actions */}
        {/* {userData?.last_login_date && ( */}
        {<div className='tw-flex-1'>
          {(permissions?.edit) && <div className='tw-bg-white tw-rounded-xl tw-border tw-p-6 tw-shadow-sm'>
            <h2 className='tw-text-sm tw-font-bold tw-text-gray-800 tw-mb-4'>
              Quick Actions
            </h2>

            <div className='tw-space-y-3'>
              <button
                onClick={() =>
                  navigate(`/users/update/${id}`, {
                    state: {
                      editData: {
                        firstName: userData?.first_name,
                        lastName: userData?.last_name,
                        id: userData?.id,
                        email: userData?.email_id,
                        role: String(userData?.role_id),
                        role_name: userData?.role_name,
                        role_id: userData?.role_id,
                        organizationId: userData?.organization_id
                      }
                    }
                  })
                }
                className='tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-2 tw-px-4 tw-border tw-rounded-lg tw-text-sm tw-font-normal tw-text-gray-700 hover:tw-bg-gray-50'
              >
                <i className='icon-Edit tw-text-base'></i>
                Edit Profile
              </button>
              {permissions?.edit && String(userData?.id) !== String(uuid) && (
                <button
                  onClick={() => setShowResetModal(true)}
                  className='tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-2 tw-px-4 tw-border tw-rounded-lg tw-text-sm tw-font-normal tw-text-gray-700 hover:tw-bg-gray-50'
                >
                  <i className='icon-Passward-reset tw-text-base'></i>
                  Reset password
                </button>
              )}

              {/* Resend Activation — only for pending users */}
              {!userData?.activation_date && (
                <button
                  onClick={async () => {
                    setApiLoading(true)
                    try {
                      const response = await ResendActivation({
                        email: userData?.email_id
                      })
                      if (response?.valid) {
                        showToast(
                          'success',
                          response.message ||
                          'Activation link has been sent to the registered email account successfully'
                        )
                      } else {
                        showToast(
                          'error',
                          response?.message || 'Failed to resend activation'
                        )
                      }
                    } catch {
                      showToast('error', 'Something went wrong')
                    } finally {
                      setApiLoading(false)
                    }
                  }}
                  className='tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-2 tw-px-4 tw-border tw-border-orange-100 tw-bg-orange-50 tw-text-orange-600 tw-rounded-lg tw-text-sm tw-font-normal hover:tw-bg-orange-100'
                >
                  <i className='icon-Resend tw-text-base'></i>{' '}
                  <Link size={20}></Link>
                  Resend Activation
                </button>
              )}

              {/* Deactivate/Activate — only for activated users, not self */}
              {/* {userData?.activation_date &&
                userData?.id !== uuid && (
                  <button
                    onClick={() => setShowDeactivateModal(true)}
                    className='tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-2 tw-px-4 tw-border tw-border-red-100 tw-bg-red-50 tw-text-red-600 tw-rounded-lg tw-text-sm tw-font-normal hover:tw-bg-red-100'
                  >
                    <i className='icon-Deactivate tw-text-base'></i>
                    {userData?.status == 1 ? 'Deactivate' : 'Activate'} User
                  </button>
                )} */}
              {userData?.activation_date &&
                userData?.id !== uuid &&
                permissions?.edit && (
                  <button
                    onClick={() => setShowDeactivateModal(true)}
                    className={`tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-2 tw-px-4 tw-rounded-lg tw-text-sm tw-font-normal
        ${userData?.status == 1

                        ? "tw-border tw-border-red-100 tw-bg-red-50 tw-text-red-600 hover:tw-bg-red-100"
                        : "tw-border tw-border-green-100 tw-bg-green-50 tw-text-green-600 hover:tw-bg-green-100"
                      }
      `}
                  >
                    <i
                      className={`${userData?.status == 1 ? "icon-Deactivate" : "icon-Project-Details"
                        } tw-text-base`}
                    ></i>

                    {userData?.status == 1 ? "Deactivate" : "Activate"} User
                  </button>
                )}
            </div>
          </div>}
        </div>}
        {/* )} */}
      </div>
      {showDeactivateModal && (
        <DeleteModal
          action='deactivate'
          entity='user'
          icon='icon-Admin-users'
          status={userData?.status == 1 ? 'Active' : 'Inactive'}
          onClose={() => setShowDeactivateModal(false)}
          onConfirm={handleDeactivateConfirm}
        />
      )}
      <ResetPasswordModal
        key={userData?.user_uuid}
        open={showResetModal}
        user={userData}
        onClose={() => setShowResetModal(false)}
      />
    </div>
  )
}

export default AdminViewUserPage
