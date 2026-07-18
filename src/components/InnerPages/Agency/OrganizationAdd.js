// need to optimizee
import React, { useState, useEffect } from "react";
import DropDown from "../../../genriccomponents/FormDropDown";
import { showToast } from "../../../genriccomponents/techus-ToastNotification";
import Shimmer from "../../../genriccomponents/Shimmer";
import {
  AddOrganizationData,
  UpdateOrganizationData,
  GetState
} from "../../../services/techus-services";
import "react-datepicker/dist/react-datepicker.css";
import "react-phone-input-2/lib/style.css";
import PhoneInput from "react-phone-input-2";

const OrganizationAdd = ({
  openCropModal,
  isEditMode,
  editUserData,
  onCloseDrawer,
  setIsPageLoading,
  onOrganizationSave,
}) => {
  const [loading, setLoading] = useState(isEditMode);
  const [status, setStatus] = useState(false);
  const [formData, setFormData] = useState({
    organization_name: "",
    mobile_number: "",
    email_id: "",
    fax: "",
    address: "",
    city: "",
    state_id: "",
    notes: "",
    first_name: "",
    last_name: "",
  });
  const [states, setStates] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);

  const [errors, setErrors] = useState({});
  const requiredFields = [
    "mobile_number",
    "email_id",
    "first_name",
    "last_name",
    "organization_name",
  ];

  const fieldLabels = {
    organization_name: "Organization Name",
    mobile_number: "Phone Number",
    email_id: "Email Address",
    fax: "FAX",
    address: "Address",
    city: "City",
    state_id: "State",
    notes: "Notes",
    first_name: "First Name",
    last_name: "Last Name",
  };

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await GetState();
        if (response?.data && Array.isArray(response.data)) {
          // Filter states for country_id 231 only
          const filteredStates = response.data.filter(s => s.country_id === 231);
          // Extract labels for dropdown display
          const stateLabels = filteredStates.map((s) => s.label);
          setStates(filteredStates);
          setStateOptions(stateLabels);
        }
      } catch (error) {
        console.error("Failed to load states", error);
      }
    };

    fetchStates();
  }, []);

  useEffect(() => {
    if (isEditMode && editUserData) {
      // Find state label from value
      const stateLabel = states.find((s) => s.value === editUserData.state_id)?.label || "";
      
      // Prefill fields from edit data
      setFormData({
        organization_name: editUserData.organization_name || "",
        first_name: editUserData.first_name || "",
        last_name: editUserData.last_name || "",
        mobile_number: editUserData.mobile_number || "",
        email_id: editUserData.email_id || "",
        fax: editUserData.fax || "",
        address: editUserData.address || "",
        city: editUserData.city || "",
        state_id: stateLabel, // Store state label for display
        notes: editUserData.notes || "",
      });

      setStatus(editUserData.status === 1 ? true : false);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [isEditMode, editUserData, states]);

  const validateField = (name, value) => {
    const trimmedValue = value?.trim?.() || "";
    const label = fieldLabels[name] || name;

    // Required Validation
    if (requiredFields.includes(name) && !trimmedValue) {
      return `${label} is required`;
    }

    // Email Validation
    if (name === "email_id" && trimmedValue) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedValue)) {
        return `Please enter a valid ${label}`;
      }
    }

    return "";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const trimmedValue = value.trimStart();
    setFormData((prev) => ({ ...prev, [name]: trimmedValue }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, trimmedValue),
    }));
  };

  const handlePhoneChange = (value) => {
    setFormData((prev) => ({ ...prev, mobile_number: value }));
    setErrors((prev) => ({
      ...prev,
      mobile_number: validateField("mobile_number", value),
    }));
  };

  const handleStateChange = (stateName) => {
    // Store state name in formData for display
    setFormData((prev) => ({ ...prev, state_id: stateName }));
    setErrors((prev) => ({
      ...prev,
      state_id: validateField("state_id", stateName),
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // Convert state label back to state value (id) for payload
    const selectedState = states.find((s) => s.label === formData.state_id);
    const stateValue = selectedState ? selectedState.value : null;

    const payload = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email_id: formData.email_id,
      mobile_number: formData.mobile_number,
      state_id: stateValue ? Number(stateValue) : null,
      city: formData.city || null,
      fax: formData.fax || null,
      address: formData.address || null,
      organization_name: formData.organization_name,
      notes: formData.notes || null,
    };

    // Inject primary key only in EDIT mode
    if (isEditMode && editUserData?.organization_id) {
      payload.organization_id = editUserData.organization_id;
      payload.status = status ? 1 : 0;
    }

    try {
      setIsPageLoading(true);

      let response;
      if (isEditMode) {
        response = await UpdateOrganizationData(payload);
      } else {
        response = await AddOrganizationData(payload);
      }

      if (response.valid) {
        showToast("success", response.message);
        if (onOrganizationSave) onOrganizationSave();
        if (onCloseDrawer) onCloseDrawer();
      } else {
        showToast("error", response.message);
      }
    } catch (err) {
      console.error("Error saving organization:", err);
      showToast("error", "An error occurred while saving organization");
    } finally {
      setIsPageLoading(false);
    }
  };

  return (
    <div className={`tw-w-full ${openCropModal ? "" : "tw-space-y-8"}`}>
      {loading ? (
        <div className="tw-p-8">
          <Shimmer count={10} height={40} />
        </div>
      ) : (
        <>
          <form
            onSubmit={handleSubmit}
            className="tw-space-y-6 tw-bg-white tw-rounded-lg tw-p-6 tw-h-full tw-transition-all tw-duration-300"
          >
            {/* Organization Info Section */}
            <div className="tw-space-y-4">
              <h3 className="tw-text-md tw-font-semibold tw-rounded-md tw-p-2 tw-text-[#4466ff] tw-bg-[#f4f4f4]">
                Organization Information
              </h3>

              <div className="tw-grid tw-grid-cols-2 tw-gap-6">
                <div>
                  <label className="tw-block tw-text-xs tw-text-[#25333e] tw-mb-2">
                    Organization Name <span className="tw-text-red-500">*</span>
                  </label>
                  <input
                    name="organization_name"
                    value={formData.organization_name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Enter organization name"
                    className={`form-with-error-btn ${
                      errors.organization_name
                        ? "tw-border-red-500 focus:tw-ring-red-500"
                        : "tw-border-[#cacaca] focus:tw-ring-[#176183] focus:tw-border-[#176183]"
                    }`}
                  />
                  <p className="tw-text-red-500 tw-text-xs tw-h-[16px]">
                    {errors.organization_name || ""}
                  </p>
                </div>

                <div>
                  <label className="tw-block tw-text-xs tw-text-[#25333e] tw-mb-2">
                    Phone Number <span className="tw-text-red-500">*</span>
                  </label>
                  <PhoneInput
                    country={"us"}
                    value={formData.mobile_number}
                    onChange={handlePhoneChange}
                    enableSearch={true}
                    containerStyle={{
                      width: "100%",
                    }}
                    inputStyle={{
                      width: "100%",
                      fontSize: "14px",
                      color: "black",
                      borderColor: errors.mobile_number ? "#ef4444" : "#cacaca",
                    }}
                    buttonStyle={{
                      backgroundColor: "white",
                    }}
                    containerClass={`phone-container ${
                      errors.mobile_number ? "phone-error" : ""
                    }`}
                    inputClass={`tw-text-left tw-text-[14px] tw-text-black`}
                  />
                  <p className="tw-text-red-500 tw-text-xs tw-h-[16px]">
                    {errors.mobile_number || ""}
                  </p>
                </div>

                <div>
                  <label className="tw-block tw-text-xs tw-text-[#25333e] tw-mb-2">
                    FAX
                  </label>
                  <input
                    name="fax"
                    value={formData.fax}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Enter fax number"
                    className={`form-with-error-btn ${
                      errors.fax
                        ? "tw-border-red-500 focus:tw-ring-red-500"
                        : "tw-border-[#cacaca] focus:tw-ring-[#176183] focus:tw-border-[#176183]"
                    }`}
                  />
                  <p className="tw-text-red-500 tw-text-xs tw-h-[16px]">
                    {errors.fax || ""}
                  </p>
                </div>

                <div>
                  <label className="tw-block tw-text-xs tw-text-[#25333e] tw-mb-2">
                    Address
                  </label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Enter address"
                    className={`form-with-error-btn ${
                      errors.address
                        ? "tw-border-red-500 focus:tw-ring-red-500"
                        : "tw-border-[#cacaca] focus:tw-ring-[#176183] focus:tw-border-[#176183]"
                    }`}
                  />
                  <p className="tw-text-red-500 tw-text-xs tw-h-[16px]">
                    {errors.address || ""}
                  </p>
                </div>

                <div>
                  <label className="tw-block tw-text-xs tw-text-[#25333e] tw-mb-2">
                    City
                  </label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Enter city"
                    className={`form-with-error-btn ${
                      errors.city
                        ? "tw-border-red-500 focus:tw-ring-red-500"
                        : "tw-border-[#cacaca] focus:tw-ring-[#176183] focus:tw-border-[#176183]"
                    }`}
                  />
                  <p className="tw-text-red-500 tw-text-xs tw-h-[16px]">
                    {errors.city || ""}
                  </p>
                </div>

                <div>
                  <label className="tw-block tw-text-xs tw-text-[#25333e] tw-mb-2">
                    State
                  </label>
                  <DropDown
                    options={stateOptions}
                    placeholder="Select State"
                    value={formData.state_id}
                    onChange={handleStateChange}
                    disabled={isEditMode ? false : false}
                    readOnly={false}
                    isViewMode={false}
                  />
                  <p className="tw-text-red-500 tw-text-xs tw-h-[16px]">
                    {errors.state_id || ""}
                  </p>
                </div>

                <div>
                  <label className="tw-block tw-text-xs tw-text-[#25333e] tw-mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows="3"
                    value={formData.notes || ""}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Enter notes"
                    className="tw-w-full tw-bg-white tw-text-sm tw-px-3 tw-py-2 tw-border tw-rounded-md focus:tw-outline-none focus:tw-ring-1 tw-transition-all tw-duration-200 tw-placeholder-[#25333e] tw-border-[#cacaca] focus:tw-ring-[#176183] focus:tw-border-[#176183]"
                  />
                  <p className="tw-text-red-500 tw-text-xs tw-h-[16px]">
                    {errors.notes || ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Contact Section */}
            <div className="tw-space-y-4">
              <h3 className="tw-text-md tw-font-semibold tw-rounded-md tw-p-2 tw-text-[#4466ff] tw-bg-[#f4f4f4]">
                Primary Contact
              </h3>

              <div className="tw-grid tw-grid-cols-2 tw-gap-6">
                <div>
                  <label className="tw-block tw-text-xs tw-text-[#25333e] tw-mb-2">
                    First Name <span className="tw-text-red-500">*</span>
                  </label>
                  <input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Enter first name"
                    className={`form-with-error-btn ${
                      errors.first_name
                        ? "tw-border-red-500 focus:tw-ring-red-500"
                        : "tw-border-[#cacaca] focus:tw-ring-[#176183] focus:tw-border-[#176183]"
                    }`}
                  />
                  <p className="tw-text-red-500 tw-text-xs tw-h-[16px]">
                    {errors.first_name || ""}
                  </p>
                </div>

                <div>
                  <label className="tw-block tw-text-xs tw-text-[#25333e] tw-mb-2">
                    Last Name <span className="tw-text-red-500">*</span>
                  </label>
                  <input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Enter last name"
                    className={`form-with-error-btn ${
                      errors.last_name
                        ? "tw-border-red-500 focus:tw-ring-red-500"
                        : "tw-border-[#cacaca] focus:tw-ring-[#176183] focus:tw-border-[#176183]"
                    }`}
                  />
                  <p className="tw-text-red-500 tw-text-xs tw-h-[16px]">
                    {errors.last_name || ""}
                  </p>
                </div>

                <div>
                  <label className="tw-block tw-text-xs tw-text-[#25333e] tw-mb-2">
                    Email Address <span className="tw-text-red-500">*</span>
                  </label>
                  <input
                    name="email_id"
                    type="email"
                    value={formData.email_id}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Enter email address"
                    className={`form-with-error-btn ${
                      errors.email_id
                        ? "tw-border-red-500 focus:tw-ring-red-500"
                        : "tw-border-[#cacaca] focus:tw-ring-[#176183] focus:tw-border-[#176183]"
                    }`}
                  />
                  <p className="tw-text-red-500 tw-text-xs tw-h-[16px]">
                    {errors.email_id || ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Toggle (Edit Mode Only) */}
            {isEditMode && (
              <div className="tw-space-y-4">
                <div className="tw-flex tw-items-center tw-justify-between tw-rounded-md tw-px-4 tw-py-3 tw-border tw-border-gray-300 tw-bg-gray-50">
                  <span className="tw-text-sm tw-font-semibold tw-text-gray-800">
                    Status
                  </span>

                  <div className="tw-flex tw-items-center tw-gap-3">
                    <span
                      className={`tw-text-sm tw-font-medium ${
                        status ? "tw-text-[#156082]" : "tw-text-gray-500"
                      }`}
                    >
                      {status ? "Active" : "Inactive"}
                    </span>

                    <button
                      type="button"
                      onClick={() => setStatus((prev) => !prev)}
                      className={`tw-relative tw-inline-flex tw-h-6 tw-w-11 tw-items-center tw-rounded-full tw-transition-all tw-duration-300 ${
                        status ? "tw-bg-[#156082]" : "tw-bg-gray-400"
                      }`}
                    >
                      <span
                        className={`tw-inline-block tw-h-4 tw-w-4 tw-transform tw-rounded-full tw-bg-white tw-shadow-md tw-transition-transform tw-duration-300 ${
                          status ? "tw-translate-x-6" : "tw-translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Save Button */}
          <div className="tw-flex tw-justify-end tw-w-full tw-gap-3">
            <button
              type="button"
              onClick={onCloseDrawer}
              className="tw-flex tw-justify-center tw-gap-2 tw-items-center tw-bg-gray-200 tw-px-6 tw-h-[40px] tw-text-gray-800 tw-rounded-md tw-transition-all tw-duration-300 tw-ease-in-out tw-transform hover:-tw-translate-y-0.5 hover:tw-shadow-[0_4px_10px_rgba(0,0,0,0.1)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="tw-flex tw-justify-center tw-gap-2 tw-items-center tw-bg-[#4466FF] tw-px-6 tw-h-[40px] tw-text-white tw-rounded-md tw-transition-all tw-duration-300 tw-ease-in-out tw-transform hover:-tw-translate-y-0.5 hover:tw-shadow-[0_4px_10px_rgba(21,96,130,0.4)] hover:tw-bg-[#4466FF]"
            >
              {isEditMode ? "Update Organization" : "Add Organization"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default OrganizationAdd;

