
/***************************************************************************************
 * @module       Service 
 * @name         techus-Service
 * @description  Get the User Authentication Service 
 * @version      1.0.0
 * @license      Licensed under the MIT License
 * @createdon    October 2025
 * @since        1.0
 ***************************************************************************************/

/**
 * Function to register a user via Axios HTTP POST request.
 * @name registerUser
 * @param {object} userData - The user data to be registered.
 * @returns {Promise<object>} - A Promise that resolves with the response data (e.g., success message, user object).
 * @throws {Error} - If an error occurs during the registration process.
 * @version 1.0.0
 */

import { httpClient } from '../axois/SessionHandler';
import Http from '../axois/techus-useAxois';

import ServiceUtils from '../utils/techus-serviceUtils'; // Adjust the import based on your project structure
const utilsService = ServiceUtils();
import CONFIG from '../config/config';
export const LoginUser = async (userData = '') => {
  const response = await Http.post('/login', utilsService.prepareAPIRequest(userData));
  return response;
};

export const LogOutUser = async (userData = '') => {
  const response = await Http.post('/logout', userData);
  return response;
};

export const UserImageUpload = async (image_data = '') => {
  const response = await Http.post('/user_image_upload', utilsService.prepareAPIRequest(image_data));
  return response;
}

export const ForgotPassword = async (userData = '') => {
  var response;
  // if (!token) {
  response = await Http.post('/forget_password', utilsService.prepareAPIRequest(userData));
  // }
  // else {
  //   response = {
  //     message: 'already_login',
  //     valid: false
  //   }
  // }
  return response;
};

export const ResetPassword = async (userData) => {
  const response = await Http.post('/user_password_reset', utilsService.prepareAPIRequest(userData));
  return response;

}

export const ForgotPasswordTokenCheck = async (userData = '') => {
  const response = await Http.post('/forget_password_token_check', utilsService.prepareAPIRequest(userData));
  return response;
};


export const PasswordReset = async (userData = '') => {
  var response = await Http.post('/password_reset', utilsService.prepareAPIRequest(userData));
  return response;
};

export const UserInfoByToken = async (userData = '') => {
  const response = await Http.get('/get_user_info_by_token', userData);
  return response;
};


// export const GetUserList = async (userData = '') => {
//     const response = await Http.get('/get_user_list',userData);
//     return response;
// };

export const GetUserList = async (params = {}) => {
  return await Http.get('/get_user_list', params);
};


export const UpdateUser = async (userData = '', userId) => {
  const response = await Http.post(
    `/update_user?userId=${userId}`,
    utilsService.prepareAPIRequest(userData)
  );
  return response;
};

export const ViewUser = async (userId) => {
  const response = await Http.get(`/view_user?user_uuid=${userId}`);
  return response;
};

export const RegisterUser = async (userData = '') => {
  const response = await Http.post('/register', utilsService.prepareAPIRequest(userData));
  return response;
};

export const CurrentPasswordChange = async (userData = '') => {

  const response = await Http.post('/old_password_reset', utilsService.prepareAPIRequest(userData));
  return response;
};

export const GetAuthLog = async (userData = '') => {
  const response = await Http.get('/authentiocation_log_list', userData);
  return response;
};


export const DeleteUser = async (userData = '') => {
  const response = await Http.post('/delete_user', utilsService.prepareAPIRequest(userData));
  return response;
};

export const DeactivateUser = async (userData = '') => {
  const response = await Http.post('/deactivate_user', utilsService.prepareAPIRequest(userData));
  return response;
};
export const GetCity = async (userData = '') => {
  const response = await Http.post('/get_city', utilsService.prepareAPIRequest(userData));
  return response;
};

export const GetState = async (userData = '') => {
  const response = await Http.post('/get_state', utilsService.prepareAPIRequest(userData));
  return response;

};

export const GetContry = async (userData = '') => {
  const response = await Http.get('/get_country', userData);
  return response;
};

export const GetAWSAccessKey = async (userData = '') => {
  const response = await Http.get('/access_key_fetch', userData);
  return response;
};

export const FetchAuditLogs = async (params = {}) => {
  const response = await Http.post('/get_user_logs_list', utilsService.prepareAPIRequest(params));
  return response;
}

export const GetLogSections = async (params = {}) => {
  const response = await Http.get('/get_user_log_sections', params);
  return response;
}

// 
export const VerifyOTP = async (data = '') => {
  const response = await Http.post('/verify-otp', utilsService.prepareAPIRequest(data));
  return response;
}

export const ResendOTP = async (data = '') => {
  const response = await Http.post('/resend_otp', utilsService.prepareAPIRequest(data));
  return response;
}

export const AccountActivation = async (userData = '') => {
  var response = await Http.post('/activate', utilsService.prepareAPIRequest(userData));
  return (JSON.parse(response));
};

export const ResendActivation = async (userData = '') => {
  var response = await Http.post('/resend_activation_link', utilsService.prepareAPIRequest(userData))
  return (JSON.parse(response));
}

// user module ends

// role module starts
export const GetRolesList = async (organization_id, companyData = '') => {


  const response = await Http.get(`/role_list?organization_id=${organization_id}`, companyData);
  return response;
};

export const DeleteRole = async (companyData = '') => {
  const response = await Http.post(`/delete_role`, utilsService.prepareAPIRequest(companyData));
  return response;
};

export const CreateRoles = async (companyData = '') => {
  const response = await Http.post(`/add_role`, utilsService.prepareAPIRequest(companyData));
  return response;
};

export const UpdateRole = async (companyData = '') => {
  const response = await Http.post(`/update_role`, utilsService.prepareAPIRequest(companyData));
  return response;
};

export const GetModulesPermissionList = async (companyData = '') => {
  const response = await Http.get(`/modules_permissions_list`, companyData);
  return response;
};
export const GetRoleDetail = async (companyData = '') => {
  const response = await Http.get(`/get_role_detail`, companyData);
  return response;
};

// role module ends



// 

export const GetAgenciesList = async (agencyData = '') => {
  var response = await Http.get('/agency/list', agencyData);
  return (JSON.parse(response));
};

export const AddAgencyData = async (agencyData = '') => {
  var response = await Http.post('/agency/add', utilsService.prepareAPIRequest(agencyData));
  return (JSON.parse(response));
};

export const UpdateAgencyData = async (agencyData = '') => {
  var response = await Http.post('/agency/update', utilsService.prepareAPIRequest(agencyData));
  return (JSON.parse(response));
};

export const DeleteAgencyData = async (agencyData = '') => {
  var response = await Http.post('/agency/delete', utilsService.prepareAPIRequest(agencyData));
  return (JSON.parse(response));
};


/**
 * Get organizations list with search/filter/pagination
 */

export const GetOrganizationsList = async (params = {}) => {

  const response = await Http.get('/organization/list', params);
  const parsed = typeof response === "string" ? JSON.parse(response) : response;
  return parsed;
};


/**
 * Add new organization
 */
export const AddOrganizationData = async (organizationData = {}) => {
  try {
    const payload = {
      first_name: organizationData.first_name,
      last_name: organizationData.last_name,
      email_id: organizationData.email_id,
      mobile_number: organizationData.mobile_number,
      address: organizationData.address || null,
      city: organizationData.city || null,
      state_id: organizationData.state_id || null,
      organization_name: organizationData.organization_name,
      fax: organizationData.fax || null,
      notes: organizationData.notes || null,
      imgsrc: organizationData.imgsrc || null,
    };

    const response = await Http.post(
      '/organization/add',
      utilsService.prepareAPIRequest(payload)
    );
    return JSON.parse(response);
  } catch (error) {
    console.error('Error adding organization:', error);
    throw error;
  }
};

/**
 * Update organization
 */
export const UpdateOrganizationData = async (organizationData = {}) => {
  try {
    const payload = {
      organization_id: organizationData.organization_id,
      first_name: organizationData.first_name,
      last_name: organizationData.last_name,
      email_id: organizationData.email_id,
      mobile_number: organizationData.mobile_number,
      address: organizationData.address || null,
      city: organizationData.city || null,
      state_id: organizationData.state_id || null,
      organization_name: organizationData.organization_name,
      fax: organizationData.fax || null,
      notes: organizationData.notes || null,
      status: organizationData.status || 0,
      imgsrc: organizationData.imgsrc || null, // Keep for now if needed
    };

    const response = await Http.post(
      '/organization/update',
      utilsService.prepareAPIRequest(payload)
    );
    return JSON.parse(response);
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
};


/**
 * Delete organization
 */
export const DeleteOrganizationData = async (organizationUuid) => {
  try {
    const payload = { organization_uuid: organizationUuid };
    const response = await Http.post(
      '/organization/delete',
      utilsService.prepareAPIRequest(payload)
    );
    return JSON.parse(response);
  } catch (error) {
    console.error('Error deleting organization:', error);
    throw error;
  }
};

// Get product list with search and pagination
export const GetProductList = async (params) => {
    const response = await Http.get('/products/list', params);
    return response;
};

// Get takeoff categories
export const GetTakeoffCategories = async (params) => {
  const response = await Http.get('/product/takeoff_list', params);
  return response;
};

// Unit List
export const GetProductUnitList = async (params) => {
  const response = await Http.get('/products/get_unit_list', params);
  return response;
};

// Eligible Units Mapping List
export const GetEligibleUnits = async () => {
  const response = await Http.get('/products/get_eligible_units');
  return response;
};

// Save product (create)
export const SaveProduct = async (productData = '') => {
  const response = await Http.post('/products/add', utilsService.prepareAPIRequest(productData));
  return response;
};

// Update product (edit)
export const UpdateProduct = async (productData = '') => {
  const response = await Http.post('/products/edit', utilsService.prepareAPIRequest(productData));
  return response;
};

// Delete product
export const DeleteProduct = async (productId, extraData = {}) => {
  const response = await Http.post('/products/delete', utilsService.prepareAPIRequest({ product_id: productId, ...extraData }));
  return response;
};

// Detail by id
export const GetProductDetail = async (data = '') => {
  const response = await Http.post('/products/detail', utilsService.prepareAPIRequest(data));
  return response;
};

// Division , Section , Subsection List
export const GetProductCategories = async (params) => {
  const response = await Http.get('/products/get_categories', params);
  return response;
};

// Next sequential Product Code based on subsection_id
export const GetNextProductCode = async (params) => {
  const response = await Http.get('/products/next_product_code', params);
  return response;
};

// Product Get Steel Category
export const GetSteelCategory = async () => {
  const response = await Http.get('/products/get_steel_category');
  return response;
};

// Product Get Element Type
export const GetElementType = async (params) => {
  const response = await Http.get('/products/get_element_type',params );
  return response;
};


// Get project list with search and pagination
export const GetProjectList = async (params) => {
  try {
    const response = await Http.get('/project/list', params);
    return response;
  } catch (error) {
    console.error(' API ERROR: GetProjectList', error);
    console.error(' API ERROR Response:', error.response);
    throw error;
  }
};

// Get single project by ID
export const GetProjectById = async (payload) => {
  try {
    const response = await Http.post(`/project/detail`, (payload));
    return response;
  } catch (error) {
    console.error(' API ERROR: GetProjectById', error);
    console.error(' API ERROR Response:', error.response);
    throw error;
  }
};

// Save project (create or update)
export const SaveProject = async (projectData) => {
  try {
    const response = await Http.post('/project/add', projectData);
    return response;
  } catch (error) {
    console.error(' API ERROR: SaveProject', error);
    console.error(' API ERROR Response:', error.response);
    throw error;
  }
};

export const MarkAsComplete = async (projectData) => {
  try {
    const response = await Http.post('/project/mark_as_complete', projectData);
    return response;
  } catch (error) {
    console.error(' API ERROR: SaveProject', error);
    console.error(' API ERROR Response:', error.response);
    throw error;
  }
};

export const UpdateProject = async (projectData) => {
  try {
    const response = await Http.post('/project/update', projectData);
    return response;
  } catch (error) {
    console.error(' API ERROR: SaveProject', error);
    console.error(' API ERROR Response:', error.response);
    throw error;
  }
};


export const GetUploadUrl = async (payload) => {
  try {
    const response = await Http.post(`/project/get_upload_url`, payload);
    return response;
  } catch (error) {
    console.error('API ERROR: GetUploadUrl', error);
    throw error;
  }
};

export const ConfirmUpload = async (payload) => {
  try {
    const response = await Http.post(`/project/confirm_upload`, payload);
    return response;
  } catch (error) {
    console.error('API ERROR: ConfirmUpload', error);
    throw error;
  }
};
// Delete project (soft delete)
export const DeleteProject = async (payload) => {
  try {
    const response = await Http.post(`/project/delete`, payload);
    return response;
  } catch (error) {
    console.error(' API ERROR: DeleteProject', error);
    console.error(' API ERROR Response:', error.response);
    throw error;
  }
};

// 
export const StartAiAnalysis = async (payload) => {
  try {
    const response = await Http.post(`/project/start_ai_analysis`, payload);
    return response;
  } catch (error) {
    console.error('API ERROR: StartAiAnalysis', error);
    throw error;
  }
};

export const UpdateStep = async (payload) => {
  try {
    const response = await Http.post(`/project/update_step`, payload);
    return response;
  } catch (error) {
    console.error('API ERROR: UpdateStep', error);
    throw error;
  }
};

export const DeleteProjectDocument = async (data = '') => {
  const response = await Http.post(`/project/delete_document`, utilsService.prepareAPIRequest(data));
  return response;
};

// get_rfp_data

export const GetRfpData = async (payload) => {
  const response = await Http.post('/project/get_rfp_data', payload);
  return JSON.parse(response);
};

export const GetProjectDocuments = async (payload) => {
  const response = await Http.post('/project/get_documents', payload);
  return JSON.parse(response);
};

export const CreateChat = async (payload) => {
  const response = await Http.post('/project/create_chat', payload);
  return response;
};

export const GetChatList = async (payload) => {
  const response = await Http.post('/project/get_chat_list', payload);
  return response;
};


// Takeoff
export const GetTakeoffDocuments = async (payload) => {
  const response = await Http.post('/takeoff/get_documents', payload);
  return JSON.parse(response);
};

export const setLastOpenedDocument = async (payload) => {
  const response = await Http.post("takeoff/set_last_opened_document", payload);
  return response.data;
};

export const saveDetectionObjects = async (payload) => {
  const response = await Http.post("/takeoff/save_detection_objects", payload);
  return JSON.parse(response);
};

// 
export const resetPage = async (payload) => {
  const response = await Http.post("/takeoff/v2/reset_page", payload);
  return JSON.parse(response);
};

export const getPageDetection = async (payload) => {
  const response = await Http.post("/takeoff/get_page_detection", payload);
  return JSON.parse(response);
};

export const addDetectionObject = async (payload) => {
  const response = await Http.post("/takeoff/add_detection_object", payload);
  //   console.log("SERVICE response:", response);
  // console.log("SERVICE response.data:", response.data);
  return response;
};

export const updateDetectionObject = async (payload) => {
  const response = await Http.post("/takeoff/update_detection_object", payload);
  return response.data;
};


export const addAiExtraction = async (payload) => {
  const response = await Http.post("/takeoff/v2/ai_extraction", payload);
  return JSON.parse(response);
};

export const getAiExtraction = async (payload) => {
  const response = await Http.post("/takeoff/v2/get_ai_extraction", payload);
  return JSON.parse(response);
};

export const getLineItems = async (payload) => {
  const response = await Http.post("/takeoff/v2/get_line_item", payload);
  return JSON.parse(response);
};

export const getConfigV2 = async (payload) => {
  const response = await Http.post("/takeoff/v2/get_config", payload);
  return JSON.parse(response);
};

export const getTypesV2 = async (payload) => {
  const response = await Http.post("/takeoff/v2/get_types", payload);
  return JSON.parse(response);
};

export const addLineItem = async (payload) => {
  const response = await Http.post("/takeoff/v2/add_line_item", payload);
  return JSON.parse(response);
};
export const getAssemblyTargets = async (payload) => {
  const response = await Http.post("/takeoff/v2/get_assembly_targets", payload);
  return JSON.parse(response);
};
export const getGeneralTargets = async (payload) => {
  const response = await Http.post("/takeoff/v2/get_general_targets", payload);
  return JSON.parse(response);
};
export const updateAiItem = async (payload) => {
  const response = await Http.post("/takeoff/v2/update_ai_item", payload);
  return JSON.parse(response);
};

export const DeleteLineItem = async (data = '') => {
  const response = await Http.post(`/takeoff/v2/delete_item`, data);
  return JSON.parse(response);
};

export const DeleteLineCategory = async (data = '') => {
  const response = await Http.post(`/takeoff/v2/delete_takeoff`, data);
  return JSON.parse(response);
};

export const deleteDetectionObject = async (data = '') => {
  const response = await Http.post(`/takeoff/v2/delete_detection_object`, data);
  return JSON.parse(response);
};

export const UpdatePageScale = async (data = '') => {
  const response = await Http.post(`/takeoff/update_page_scale`, data);
  return JSON.parse(response);
};

export const GetDocumentDetail = async (data = '') => {
  const response = await Http.post(`/takeoff/get_document_detail`, data);
  return JSON.parse(response);
};

export const UpdateTakeoffOrder = async (data = '') => {
  const response = await Http.post(`/takeoff/v2/update_takeoff_order`, data);
  return typeof response === 'string' ? JSON.parse(response) : response;
};

export const UpdateLineitemOrder = async (data = '') => {
  const response = await Http.post(`/takeoff/v2/update_lineitem_order`, data);
  return typeof response === 'string' ? JSON.parse(response) : response;
};

export const getEligibleTakeoffs = async (data = '') => {
  const response = await Http.post(`/takeoff/get_eligible_takeoffs `, data);
  return JSON.parse(response);
};

export const saveNonEligibleTakeoffs = async (data = '') => {
  const response = await Http.post(`/takeoff/v2/save_non_eligible `, data);
  return JSON.parse(response);
};

export const updateEligibleTakeoffs = async (data = '') => {
  const response = await Http.post(`/takeoff/update_eligible_takeoffs `, data);
  return JSON.parse(response);
};

export const ProceedToEstimation = async (data = "") => {
  const response = await Http.post(`/estimation/calc/proceed`, data);
  return JSON.parse(response);
};

// view pdf and image
export const getViewUrl = async (s3_key) => {
  const response = await Http.post("/project/view_url", { s3_key });
  return JSON.parse(response);
};


export const getImageStream = async (s3_key) => {
  const token =
    localStorage.getItem("prexo_organization_access_token") ||
    localStorage.getItem("prexo_admin_access_token") ||
    "";

  const response = await fetch(`${CONFIG.VITE_API_URL}/project/get_image_stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ s3_key }),
  });

  if (!response.ok) throw new Error(`Image stream failed: ${response.status}`);

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const getBatchViewUrl = async (payload) => {
  const response = await Http.post("/project/get-batch-view-url", payload);
  return JSON.parse(response);
};

export const getPdfStream = async (s3_key) => {
  const response = await httpClient.get('/project/get-pdf-stream', {
    params: { s3_key },
    responseType: 'arraybuffer',  // tells axios + interceptor to skip JSON parse
  });
  return response.data; // raw ArrayBuffer
};

// download as pdf
export const GeneratePdf = async (payload) => {
  const response = await httpClient.post('/generate', payload, {
    responseType: 'arraybuffer', // bypasses decrypt interceptor
  });
  return response;
};

// estimation
export const fetchEstimationOverview = async (data = "") => {
  const response = await Http.post(`/estimation/calc/overview`, data);
  return JSON.parse(response);
};

export const fetchEstimationMaterial = async (data = "") => {
  const response = await Http.post(`/estimation/calc/material`, data);
  return JSON.parse(response);
};

export const fetchEstimationLabour = async (data = "") => {
  const response = await Http.post(`/estimation/calc/labour`, data);
  return JSON.parse(response);
};

export const updateMaterialQuantity = async (data = "") => {
  const response = await Http.post(`/estimation/calc/update-material`, data);
  return JSON.parse(response);
};

export const addEstimationLine = async (data = "") => {
  const response = await Http.post(`/estimation/calc/add-line`, data);
  return JSON.parse(response);
};

export const deleteEstimationItem = async (data = "") => {
  const response = await Http.post(`/estimation/calc/delete-line`, data);
  return JSON.parse(response);
};

export const deleteLabourCrew = async (data = "") => {
  const response = await Http.post(`/estimation/calc/delete-labour-crew`, data);
  return JSON.parse(response);
};

export const updateLabourHours = async (data = "") => {
  const response = await Http.post(`/estimation/calc/update-labour-hours`, data);
  return JSON.parse(response);
};



// Package API's

export const GetPackageList = async (data = '') => {
  const response = await Http.get('/package/list', data);
  return response

}


export const AddPackage = async (userData = '') => {
  const response = await Http.post('/package/add', utilsService.prepareAPIRequest(userData));
  return response;
};

export const UpdatePackage = async (userData = '') => {
  const response = await Http.post('/package/update', utilsService.prepareAPIRequest(userData));
  return response;
};


export const GetPackageFeatures = async (data = '') => {
  const response = await Http.get('/package/features', data);
  return response

}

export const ViewPackage = async (userData = '') => {
  const response = await Http.post('/package/detail', utilsService.prepareAPIRequest(userData));
  return response

}


export const DeletePackage = async (userData = '') => {
  const response = await Http.post('/package/delete', utilsService.prepareAPIRequest(userData));
  return response

}

export const AddOrganizationDetails = async (payload) => {

  const response = await Http.post("/organization/add", payload);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;
  return parsed;
};

export const UpdateOrganization = async (data) => {
  const response = await Http.post('/organization/update', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;
  return parsed;

}
export const GetOneOrganization = async (data) => {
  const response = await Http.post('/organization/detail', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
}

export const GetOnePackage = async (data = '') => {
  const response = await Http.post('/package/detail', data);
  return response;
};


export const get_RFI_list = async (params = {}) => {
  console.log(params)
  const response = await httpClient.get('/rfi_drafter/list', { params });
  const parsed = typeof response === "string" ? JSON.parse(response) : response;

  return parsed;
};

export const add_RFI_data = async (data = '') => {
  const response = await Http.post('/rfi_drafter/add', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};

export const update_RFI_data = async (data = '') => {
  const response = await Http.post('/rfi_drafter/update', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};

export const delete_RFI_data = async (data = '') => {
  const response = await Http.post('/rfi_drafter/delete', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};

export const get_RFP_data = async (data = '') => {
  const response = await Http.post('/project/get_rfp_data', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};

export const detail_RFI_data = async (data = '') => {
  const response = await Http.post('/rfi_drafter/detail', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};

export const Update_generate_data = async (data = '') => {
  const response = await Http.post('/rfi_drafter/update', utilsService.prepareAPIRequest(data));
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};

export const generate_data = async (data = '') => {
  const response = await Http.post('/rfi_drafter/draft_rfi', utilsService.prepareAPIRequest(data));
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};


// bid invite

export const get_bid_list = async (params = {}) => {
  console.log(params)
  const response = await httpClient.get('/bid_invite_drafter/list', { params });
  const parsed = typeof response === "string" ? JSON.parse(response) : response;

  return parsed;
}

export const add_bid_data = async (data = '') => {
  const response = await Http.post('/bid_invite_drafter/add', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};

export const get_trade_data = async (data = '') => {
  const response = await Http.get('/get_trade_category', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};


export const update_bid_data = async (data = '') => {
  const response = await Http.post('/bid_invite_drafter/update', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};
export const save_bid_data = async (data = '') => {
  const response = await Http.post('/bid_invite_drafter/update_content_text', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};

export const draft_bid_data = async (data = '') => {
  const response = await Http.post('/bid_invite_drafter/draft_bid_invite', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};

export const draft_bid_detail = async (data = '') => {
  const response = await Http.post('/bid_invite_drafter/detail', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};
export const delete_bid_data = async (data = '') => {
  const response = await Http.post('/bid_invite_drafter/delete', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};

export const detail_bid_data = async (data = '') => {
  const response = await Http.post('/bid_invite_drafter/detail', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};

export const draft_bid_read = async (data = '') => {
  const response = await Http.post('/bid_invite_drafter/mark_as_sent', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};


// health checker
export const get_checker_list = async (params = {}) => {
  console.log(params)
  const response = await httpClient.get('/health_checker/list', { params });
  const parsed = typeof response === "string" ? JSON.parse(response) : response;

  return parsed;
}
export const create_health_checker = async (data = '') => {
  const response = await Http.post('/health_checker/add', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};


export const HealthCheckerUpload = async (data = '') => {
  const response = await Http.post('/company_document/add', utilsService.prepareAPIRequest(data));
  return response;
};
export const health_checker_detail = async (data = '') => {
  const response = await Http.post('/health_checker/detail', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};

export const delete_HealthChecker_data = async (data = '') => {
  const response = await Http.post('/health_checker/delete', data);
  const parsed =
    typeof response === "string"
      ? JSON.parse(response)
      : response;

  return parsed;
};

export const CheckExistsHealthChecker = async (payload) => {
  const response = await Http.post(
    `/health_checker/check_name`, payload
  );
  return response;
};


export const PerformHealthChecker = async (payload) => {
  const response = await Http.post(
    `/health_checker/perform_health_check`, payload
  );
  return response;
};



export const ExportHealthCheckerPdf = async (payload) => {
  const response = await httpClient.post('/health-checker/export-pdf', payload, {
    responseType: 'arraybuffer',
  });
  return response;
};


export const GenerateRfiPdf = async (data) => {
  const response = await httpClient.post('/rfi-pdf/generate', data, {
    responseType: 'arraybuffer',
  });
  return response;
};


export const GenerateRfiWord = async (data) => {
  const response = await httpClient.post('/rfi-word/generate', data, {
    responseType: 'arraybuffer',
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
  });
  return response;
}; export const GenerateBidPdf = async (payload) => {
  const response = await httpClient.post('/generate-bid', payload, {
    responseType: 'arraybuffer',
  });
  return response;
};


export const GetIndustryAndCompanySize = async (data = {}) => {
  const response = await Http.post('/get_lookup_data', data);
  return response;
};


export const GetCompanyUploadedUrl = async (data = '') => {
  const response = await Http.post('/company_document/get_upload_url', utilsService.prepareAPIRequest(data));
  return response;
};
export const AddCompanyDocument = async (data = '') => {
  const response = await Http.post('/company_document/add', utilsService.prepareAPIRequest(data));
  return response;
};
export const GetCompanyDocumentList = async (data = '') => {
  const response = await Http.get(`/company_document/list?organization_uuid=${data}`);
  return response;
};
export const GetCompanyDocView = async (data = '') => {
  const response = await Http.get(`/company_document/view?file_uuid=${data}`);
  return response;
};
export const MultiExtenSionPresign = async (data = '') => {
  const response = await Http.post(`/multi-exten-presign`, utilsService.prepareAPIRequest(data));
  return response;
};
export const GetRfpAnalyzerData = async (organization_id = '') => {
  const response = await Http.get(`/company_document/rfp_analyzer/get?organization_id=${organization_id}`);
  return typeof response === 'string' ? JSON.parse(response) : response;
};
export const UpdateRfpAnalyzerData = async (data = '') => {
  const response = await Http.post('/company_document/rfp_analyzer/update', utilsService.prepareAPIRequest(data));
  return typeof response === 'string' ? JSON.parse(response) : response;
};

// 
export const GetGeneralSettings = async (data) => {
  const response = await Http.post(`/organization/takeoff/general_settings`, utilsService.prepareAPIRequest(data));
  return response;
}

export const UpdateGeneralSettings = async (data = '') => {
  const response = await Http.post(`/organization/takeoff/general_settings/update`, utilsService.prepareAPIRequest(data));
  return response;
};

export const GetEstimationSettings = async (data) => {
  const response = await Http.post(`/organization/takeoff/estimation_settings`, utilsService.prepareAPIRequest(data));
  return response;
}

export const UpdateEstimationSettings = async (data) => {
  const response = await Http.post(`/organization/takeoff/estimation_settings/update`, utilsService.prepareAPIRequest(data));
  return response;
}

export const GetTakeoffConfig = async (data) => {
  const response = await Http.post(`/takeoff/org_settings/get_config`, utilsService.prepareAPIRequest(data));
  return response;
}

export const UpdateTakeoffConfigV2 = async (data) => {
  const response = await Http.post(`/takeoff/v2/org_settings/update_config`, utilsService.prepareAPIRequest(data));
  return response;
}

export const GetTakeoffConfigV2 = async (data) => {
  const response = await Http.post(`/takeoff/v2/org_settings/get_config`, utilsService.prepareAPIRequest(data));
  return response;
}

//Drafter proposal
export const GetProposalDrafterList = async (project_id) => {
  const response = await Http.get(
    `/proposal_drafter/list?project_id=${project_id}`
  );
  return response;
};

export const GetProposalDrafterCategory = async (project_id) => {
  const response = await Http.get(
    `/product/takeoff_list?project_id=${project_id}`
  );
  return response;
};
export const AddProposalDrafter = async (data = '') => {
  const response = await Http.post('/proposal_drafter/add', utilsService.prepareAPIRequest(data));
  return response;
};

export const UpdateProposalDrafter = async (data = '') => {
  const response = await Http.post('/proposal_drafter/update', utilsService.prepareAPIRequest(data));
  return response;
};
export const DeleteProposalDrafter = async (data = '') => {
  const response = await Http.post('/proposal_drafter/delete', utilsService.prepareAPIRequest(data));
  return response;
};
export const GetProposalDrafterRFP = async (payload) => {
  const response = await Http.post(
    `/project/get_documents`, payload
  );
  return response;
};

export const GetProposalDrafterCompanyDoc = async (payload) => {
  const response = await Http.get(
    `/company_document/list?organization_uuid=${payload.organization_uuid}`
  );
  return response;
};

export const ExtractProposalSections = async (data = '') => {
  const response = await Http.post(
    '/proposal_drafter/extract_proposal_sections',
    utilsService.prepareAPIRequest(data)
  );
  return response;
};


export const GetProposalDrafterDetail = async (data = '') => {
  const response = await Http.post(
    '/proposal_drafter/detail',
    utilsService.prepareAPIRequest(data)
  );
  return response;
};

export const ProposalDrafterView = async (data = '') => {
  const response = await Http.post('/proposal_drafter/draft_proposal', utilsService.prepareAPIRequest(data));
  return response;
};

export const GenerateProposalPdf = async (payload) => {

  // Encode each section's content as base64 to preserve HTML through middleware
  const encodedSections = payload.sections.map(s => {
    const html = s.content || '';
    const content_b64 = btoa(unescape(encodeURIComponent(html)));
    return { ...s, content_b64 };
  });

  const encodedPayload = { ...payload, sections: encodedSections };

  const response = await httpClient.post('/proposal/generate', encodedPayload, {
    responseType: 'arraybuffer',
    headers: { 'Content-Type': 'application/json' },
  });

  return response;
};


export const SaveEditor = async (data = '') => {
  const response = await Http.post('/proposal_drafter/add_drafter_section_data', utilsService.prepareAPIRequest(data));
  return response;
};

// update role status
export const UpdateRoleStatus = async (data = '') => {
  const response = await Http.post('/update_role_status', utilsService.prepareAPIRequest(data));
  return response;
};


//clause suggester

export const GetClauseSuggesterList = async (project_id) => {
  const response = await Http.get(
    `/clause_suggester/list?project_id=${project_id}`
  );
  return response;
};

export const AddClauseSuggester = async (data = '') => {
  const response = await Http.post('/clause_suggester/add', utilsService.prepareAPIRequest(data));
  return response;
};

export const AddUploadDoc = async (data = '') => {
  const response = await Http.post('/company_document/add', utilsService.prepareAPIRequest(data));
  return response;
};

export const DeleteClauseSuggester = async (data = '') => {
  const response = await Http.post('/clause_suggester/delete', utilsService.prepareAPIRequest(data));
  return response;
};

export const GetClauseSuggesterRFP = async (payload) => {
  const response = await Http.post(
    `/project/get_documents`, payload
  );
  return response;
};

export const CheckExistsSuggester = async (payload) => {
  const response = await Http.post(
    `/clause_suggester/check_name`, payload
  );
  return response;
};

export const GetClauseSuggesterDetail = async (data = '') => {
  const response = await Http.post('/clause_suggester/detail', utilsService.prepareAPIRequest(data));
  return response;
};

export const GenerateClauseAuditPdf = async (payload) => {
  const response = await httpClient.post('/clause-suggester/export-pdf', payload, {
    responseType: 'arraybuffer',
  });
  return response;
};

export const SuggestClause = async (data = '') => {
  const response = await Http.post('/clause_suggester/suggest_clause', utilsService.prepareAPIRequest(data));
  return response;
};

export const addLogo = async (data = '') => {
  var response = await Http.post(`/organization/org_image_update`, utilsService.prepareAPIRequest(data));
  return response
}

// Labor crew and member
export const LaborWorkerList = async (params) => {
  const response = await Http.get('/labor_worker/list', { params });
  return response;
};

export const LaborWorkerDetail = async (data = '') => {
  const response = await Http.post('/labor_worker/detail', utilsService.prepareAPIRequest(data));
  return response;
};

export const LaborCrewList = async (params) => {
  const response = await Http.get('/labor_crew/list', { params });
  return response;
};

export const LaborCrewDetail = async (data = '') => {
  const response = await Http.post('/labor_crew/detail', utilsService.prepareAPIRequest(data));
  return response;
};

export const LaborCrewUpdate = async (data = '') => {
  const response = await Http.post('/labor_crew/update', utilsService.prepareAPIRequest(data));
  return response;
};

export const LaborWorkerAdd = async (data = '') => {
  const response = await Http.post('/labor_worker/add', utilsService.prepareAPIRequest(data));
  return response;
};

export const LaborWorkerUpdate = async (data = '') => {
  const response = await Http.post('/labor_worker/update', utilsService.prepareAPIRequest(data));
  return response;
};

export const LaborWorkerDelete = async (data = '') => {
  const response = await Http.post('/labor_worker/delete', utilsService.prepareAPIRequest(data));
  return response;
};
 
// export const countAccess = async () => {

//   return {
//     "valid": true,
//     "status": true,
//     "current_count": 3,
//     "allowed_count": 5,
//     "allowed": true,
//     "message": "You have used 3 of 5 allowed users. You can add 2 more.",
//     "module_name": "users",
//     "sub_module_name": ""
// };

//   const response = await Http.post(
//     `/count_access/get`, payload
//   );
//   return response;
// };

export const countAccess = async (payload) => {
  const response = await Http.post(
    `/count_access/get`, payload
  );
  return response;
};

