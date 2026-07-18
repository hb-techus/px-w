import React, { useEffect, useState } from 'react'
import { GetOneOrganization } from '../../../../services/techus-services'
import { showToast } from '../../../../genriccomponents/techus-ToastNotification';

const useInfo = () => {

// Hooks to get the organization data to handle the single source of truth
const [orgData,setOrgData]=useState(null);
const [loading,setLoading]=useState(false);
const organization_uuid=localStorage.getItem('organization_uuid');

const fetchOrganization=async()=>{
    try{
    if(!organization_uuid) return
    setLoading(true);
    const response=await GetOneOrganization({organization_uuid});
    if(!response.valid){
        showToast('error',response?.message)
    }
    setOrgData(response?.data)}
    catch(err){
        console.error(err)
    }
    finally{
        setLoading(false)
    }
}
useEffect(()=>{
    fetchOrganization();
},[organization_uuid])


return {orgData,loading}
}

export default useInfo