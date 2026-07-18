import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  GetRoleDetail,
  GetModulesPermissionList,
  DeleteRole
} from '../../../services/techus-services'
import { capitalizeFirstLetter } from '../../../utils/commonUtils'
import PageHeader from '../../Common/PageHeader'
import RolePermissionView from './ViewRoleComponent'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import DeleteModal from '../../../genriccomponents/DeleteModal'
import { useSelector } from 'react-redux'

const ViewRolePage = () => {
  const {role_uuid}=useParams()
  const location = useLocation()
    const isAdminPortal = location.pathname.startsWith('/admin')
    const userType = isAdminPortal?'ADMIN':'ORGANIZATION'
  // const userType = localStorage.getItem('user_type')
  const navigate = useNavigate()
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [, setIsDeleting] = useState(false);

  const [roleDetails, setRoleDetails] = useState(null)
  const [moduleList, setModuleList] = useState([])
  const [permissionList, setPermissionList] = useState([])
  const [isLoading, setIsLoading] = useState(true);
    const permissionsList = useSelector ((s)=>s?.auth?.user?.[0]?.permission_info) || {};
  const permissions = permissionsList?.role_management || {};
    console.log(permissions)

  // Fetch role details and permissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [roleRes, moduleRes] = await Promise.all([
          GetRoleDetail({ role_uuid }),
          GetModulesPermissionList()
        ])
        if (roleRes.valid && moduleRes.valid) {
          setRoleDetails(roleRes.data)
          setPermissionList(roleRes.data.permissions)
          setModuleList(moduleRes.data)
        }
      } catch (error) {
        console.error('Error fetching role details:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [role_uuid])

  // const handleDelete = async () => {
  //   try {
  //     const response = await DeleteRole({ role_uuid })
  //     if (response.valid) {
  //       showToast('success', response.message)
  //     } else {
  //       showToast('error', response.message)
  //     }
  //     navigate(getRoleBasePath())
  //   } catch (err) {
  //     showToast('error', err)
  //   }
  // }

  const handleDelete = async () => {
  try {
    setShowDeleteModal(false);   
    setIsDeleting(true);         

    const response = await DeleteRole({ role_uuid });
    if (response.valid) {
      showToast('success', response.message);
      navigate(getRoleBasePath());
    } else {
      showToast('error', response.message);
    }
  } catch {
    showToast('error', 'Something went wrong');
  } finally {
    setIsDeleting(false);
  }
};

  const getRoleBasePath = () => {
    if (userType === 'ADMIN') {
      return '/admin/roles'
    }
    return '/roles'
  }

  if (isLoading) {
    return <FullPageLoader />
  }
  return (
    <div>
      {/* Header */}

      <div className='tw-flex tw-justify-between tw-mb-[12px]'>
        <PageHeader
          parentTitle='Roles'
          title='View Role'
          onBack={() => navigate(getRoleBasePath())}
        />

      { roleDetails?.is_system_role!==1 &&<div className='tw-flex tw-gap-2 tw-mt-[20px] tw-mb-4'>
         {permissions?.edit&& <button
            className='tw-text-white  tw-w-[108px] tw-relative py-[10px] tw-rounded-[5px]  tw-bg-[#0140c1] tw-isolation-auto tw-z-10
        before:tw-absolute before:tw-w-full before:tw-transition-all before:tw-duration-700 before:hover:tw-w-full 
        before:-tw-right-full before:hover:tw-right-0 before:tw-rounded-full  before:tw-bg-[#506adf] before:-tw-z-10  
        before:tw-aspect-square before:hover:tw-scale-150 tw-overflow-hidden before:hover:tw-duration-700'
            onClick={() => {
              navigate(`${getRoleBasePath()}/update/${role_uuid}`)
            }}
          >
            Edit
          </button>}
          {permissions?.delete&&<div
            className='tw-text-[#aaa] tw-bg-transparent tw-cursor-pointer tw-items-center tw-justify-center tw-flex tw-w-[96px] tw-py-[10px] 
          tw-rounded-[5px] tw-border  tw-border-[#e0e0e0] tw-transition-all tw-duration-300 tw-text-[16px]'
            onClick={() => setShowDeleteModal(true)}
          >
            <span className='px-3'>Delete</span>
          </div>}
        </div>}
      </div>

      {/* Role Details */}
      <div className='tw-flex tw-flex-col tw-gap-3'>
        <div className="tw-bg-white tw-p-[25px] tw-rounded-[15px] tw-shadow-[0_4px_3px_0_rgba(0,0,0,0.05)] tw-border tw-border-[#e0e0e0]'>">
          <p className='tw-text-[18px] tw-text-[#000] tw-font-semibold tw-mb-[20px]'>
            Basic Information
          </p>
          <div className='tw-grid tw-grid-cols-4 tw-gap-8 tw-text-[15px] tw-text-[#585858]'>
            <div>
              <p className='tw-text-[12px] tw-uppercase tw-text-[#6a7282] tw-mb-[8px]'>
                Role Name
              </p>
              <span>{capitalizeFirstLetter(roleDetails?.role_name)}</span>
            </div>
            <div className='tw-col-span-2'>
              <p className='tw-text-[12px] tw-uppercase tw-text-[#6a7282] tw-mb-[8px]'>
                Role Description
              </p>
              <span>
                {capitalizeFirstLetter(roleDetails?.role_description)}
              </span>
            </div>
            {/* <div>
              <p className='tw-text-[12px] tw-uppercase tw-text-[#6a7282] tw-mb-[8px]'>
                Status
              </p>
              <span
                className={`tw-rounded-[20px] tw-flex tw-items-center tw-justify-center ${
                  roleDetails.status == 0
                    ? 'tw-bg-[#fef3f2] tw-border-[#fecaca] tw-text-[#b91c1b]'
                    : 'tw-bg-[#f1fdf4] tw-border-[#c1f9d5] tw-text-[#17803d]'
                } tw-border tw-p-[5px_12px] tw-gap-[5px]  tw-w-fit`}
              >
                <i
                  className={`${
                    roleDetails.status == 0 ? 'icon-Alert' : 'icon-Processed'
                  } tw-text-[14px] tw-font-bold`}
                />
                <span>{roleDetails.status == 0 ? 'Inactive' : 'Active'}</span>
              </span>
            </div> */}
          </div>
        </div>

        {/* Permissions Table */}
        <div className='tw-mt-[8px]'>
          <p className='tw-text-[18px] tw-font-semibold tw-text-[#000] tw-mb-[14px]'>
            Role Permissions
          </p>
          <RolePermissionView
            selectedPermissions={permissionList}
            allPermissionsData={moduleList}
          />
          {/* <CustomDataTable
            columns={permissionColumn}
            data={listView0}
            enablePagination={false}
            withHeight={false}
          /> */}
        </div>
  {showDeleteModal && (
  <DeleteModal
    action="delete"
    entity="role"
    icon="icon-Roles--Permissions"
    subscriptionCount={roleDetails?.user_count ?? 0}
    onClose={() => setShowDeleteModal(false)}
    onConfirm={handleDelete}
  />
)}
      </div>

      {/* Footer */}
      {/* <div className='tw-flex tw-justify-end tw-gap-2 tw-mt-[20px] tw-mb-4'>
        <button
          onClick={() =>
            navigate(
              userType == 'Admin'
                ? '/admin/roles'
                : '/roles'
            )
          }
          className='tw-text-[#5e6c80] tw-border tw-border-[#5e6c80] tw-rounded-[5px] tw-px-6 tw-py-2 tw-text-sm tw-transition-all tw-duration-300 hover:tw-bg-[#5e6c80] hover:tw-text-white'
        >
          Back
        </button>
      </div> */}
    </div>
  )
}

export default ViewRolePage
