import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import DropDown from "../../../../genriccomponents/FormDropDown";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import Shimmer from "../../../../genriccomponents/Shimmer";
import CONFIG from "../../../../config/config";
import { AddAgentData, UpdateAgentData } from "../../../../services/techus-services";

const AgentForm = ({
  openCropModal,
  setOpenCropModal,
  setImageSrc,
  roles,
  croppedImage,
  setCroppedImage,
  isEditMode,
  editUserData,
  onCloseDrawer,
  setIsPageLoading,
  onAgentSave,
  agencyId
}) => {
  const [loading, setLoading] = useState(isEditMode);
  const [status, setStatus] = useState(false);

  /** ---------------------------------------------------------
   * Updated formData → Removed: fax, license#, license exp
   * Added: designation (REQUIRED FIELD)
   * --------------------------------------------------------- */
  const [formData, setFormData] = useState({
    agentCode: "#65VIEW",
    agentName: "Test Agent",
    phonenumber: "9896836521",
    email: "test@gmail.com",
    address: "Test Address",
    city: "Test City",
    state: "12",
    country: "Asia",
    firstName: "Test",
    lastName: "User",
    role: "",
    note: "Test note",
    designation: "test", // NEW REQUIRED FIELD
  });

  /** REQUIRED FIELDS **/
  const requiredFields = [
    "phonenumber",
    "email",
    "firstName",
    "lastName",
    "designation", // ⬅ NEW REQUIRED FIELD
  ];

  /** LABELS **/
  const fieldLabels = {
    agentCode: "Agent Code",
    agentName: "Agent Name",
    phonenumber: "Phone Number",
    email: "Email Address",
    address: "Address",
    city: "City",
    state: "State",
    country: "Country",
    firstName: "First Name",
    lastName: "Last Name",
    role: "Role",
    note: "Note",
    designation: "Designation",
  };

  /** ---------------------------------------------------------
   * PREFILL IN EDIT MODE (Removed fax & license fields)
   * --------------------------------------------------------- */

  useEffect(() => {
    if (isEditMode && editUserData) {
      const matchedRole = roles?.find((r) => r.role_id === editUserData.role_id);

      setFormData({
        agentCode: editUserData.agent_code || "",
        agentName: editUserData.agent_name || "",
        firstName: editUserData.first_name || "",
        lastName: editUserData.last_name || "",
        phonenumber: editUserData.mobile_number || "",
        email: editUserData.email_id || "",
        role: matchedRole?.role_name || "",
        address: editUserData.address || "",
        city: editUserData.city || "",
        state: editUserData.state_name || "",
        note: editUserData.notes || "",
        designation: editUserData.designation || "", // NEW
      });

      setStatus(editUserData.status === 1);

      // AWS profile image handler
      if (editUserData.image_name) {
        const awsImageUrl = `${CONFIG.VITE_AWS_ENDPOINT}/user_profile_images/user_image_${editUserData.id}.png?v=${Date.now()}`;
        setCroppedImage(awsImageUrl);
      }

      setLoading(false);
    }
  }, [isEditMode, editUserData]);

  /** FIELD VALIDATION **/
  const validateField = (name, value) => {
    const trimmedValue = value?.trim() || "";
    const label = fieldLabels[name] || name;

    if (requiredFields.includes(name) && !trimmedValue) {
      return `${label} is required`;
    }
    if (name === "email" && trimmedValue) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedValue)) return "Enter a valid Email Address";
    }
    if (name === "phonenumber" && trimmedValue) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(trimmedValue)) return "Enter a valid Phone Number";
    }
    return "";
  };

  /** HANDLERS **/
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const trimmed = value.trimStart();
    setFormData((prev) => ({ ...prev, [name]: trimmed }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, trimmed),
    }));
  };

  const [errors, setErrors] = useState({});

  const handleDropdownChange = (field, value) => {
    const selectedRole = roles.find((r) => r.role_name === value);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      role: selectedRole?.role_name || "",
    }));
  };

  /** IMAGE HANDLERS **/
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target.result);
      setOpenCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleImageEdit = () => {
    if (croppedImage) {
      setImageSrc(croppedImage);
      setOpenCropModal(true);
    }
  };

  const handleImageDelete = () => setCroppedImage(null);

  /** ---------------------------------------------------------
   * SUBMIT HANDLER (Removed fax, license fields)
   * --------------------------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const selectedRole = roles.find((r) => r.role_name === formData.role);

    const payload = {
      agency_id: agencyId,
      first_name: formData.firstName,
      last_name: formData.lastName,
      agent_email: formData.email,
      email_id: formData.email,
      mobile_number: formData.phonenumber,
      role_id: String(selectedRole?.role_id ?? ""),
      state_id: formData.state,
      city: formData.city,
      address: formData.address,
      agent_code: formData.agentCode,
      agent_name: formData.agentName,
      designation: formData.designation, // NEW FIELD
      notes: formData.note,
      status: status ? 1 : 0,
    };

    if (isEditMode && editUserData?.agent_id) {
      payload.agent_id = editUserData.agent_id;
    }

    try {
      setIsPageLoading(true);
      const response = isEditMode
        ? await UpdateAgentData(payload)
        : await AddAgentData(payload);

      if (response.valid) {
        showToast("success", response.message);
        onAgentSave?.();
        onCloseDrawer?.();
      } else {
        showToast("error", response.message || "Operation failed");
      }
    } catch (err) {
      console.error("Error saving agent:", err);
      showToast("error", "An unexpected error occurred");
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
            className="tw-space-y-4 tw-bg-white tw-rounded-lg tw-p-4 tw-h-full tw-transition-all tw-duration-300"
          >
            {/* -------------------- IMAGE + BASIC INFO -------------------- */}
            <div className="tw-grid tw-grid-cols-2 tw-gap-8 tw-pr-6">
              <div className="tw-flex tw-flex-col tw-items-start tw-gap-4">
                {/* IMAGE BLOCK */}
                <div className="tw-relative tw-w-[100px] tw-h-[100px] tw-border tw-border-gray-300 tw-rounded-full tw-overflow-hidden group">
                  {croppedImage ? (
                    <>
                      <img
                        src={croppedImage}
                        alt="Profile"
                        onClick={handleImageEdit}
                        className="tw-w-full tw-h-full tw-object-cover tw-cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={handleImageDelete}
                        className="tw-absolute tw-top-1 tw-right-1 tw-bg-gray-700 tw-text-white tw-rounded-full tw-p-1 tw-opacity-0 group-hover:tw-opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-text-gray-400 tw-text-sm">
                      No Photo
                    </div>
                  )}
                </div>

                <label className="tw-cursor-pointer tw-bg-white tw-border tw-border-[#156082] tw-text-[#156082] hover:tw-bg-[#156082] hover:tw-text-white tw-px-3 tw-py-1 tw-rounded-md tw-text-sm tw-w-[132px] tw-text-center">
                  Change Photo
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="tw-hidden" />
                </label>
              </div>

              {/* AGENT CODE / NAME */}
              <div className="tw-space-y-2">
                <div>
                  <label className="tw-block tw-text-xs tw-text-[#25333e]">Agent Code</label>
                  <input
                    name="agentCode"
                    value={formData.agentCode}
                    onChange={handleInputChange}
                    className="form-with-error-btn tw-border-[#cacaca]"
                  />
                </div>

                <div>
                  <label className="tw-block tw-text-xs tw-text-[#25333e]">Agent Name</label>
                  <input
                    name="agentName"
                    value={formData.agentName}
                    onChange={handleInputChange}
                    className="form-with-error-btn tw-border-[#cacaca]"
                  />
                </div>
              </div>
            </div>

            {/* -------------------- CONTACT SECTION -------------------- */}
            <div className="tw-grid tw-grid-cols-2 tw-gap-x-8 tw-pr-6 tw-gap-y-2">
              <div>
                <label className="tw-block tw-text-xs tw-text-[#25333e]">Phone Number*</label>
                <input
                  name="phonenumber"
                  value={formData.phonenumber}
                  onChange={handleInputChange}
                  className={`form-with-error-btn ${errors.phonenumber ? "tw-border-red-500" : ""}`}
                />
                <p className="tw-text-red-500 tw-text-xs">{errors.phonenumber}</p>
              </div>

              <div>
                <label className="tw-block tw-text-xs tw-text-[#25333e]">Email Address*</label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-with-error-btn ${errors.email ? "tw-border-red-500" : ""}`}
                />
                <p className="tw-text-red-500 tw-text-xs">{errors.email}</p>
              </div>
            </div>

            {/* ADDRESS SECTION */}
            <div className="tw-grid tw-grid-cols-2 tw-gap-x-8 tw-pr-6 tw-gap-y-2">
              <div>
                <label className="tw-block tw-text-xs">Address</label>
                <input name="address" value={formData.address} onChange={handleInputChange} className="form-with-error-btn" />
              </div>

              <div>
                <label className="tw-block tw-text-xs">City</label>
                <input name="city" value={formData.city} onChange={handleInputChange} className="form-with-error-btn" />
              </div>
            </div>

            <div className="tw-grid tw-grid-cols-2 tw-gap-x-8 tw-pr-6 tw-gap-y-2">
              <div>
                <label className="tw-block tw-text-xs">State</label>
                <input name="state" value={formData.state} onChange={handleInputChange} className="form-with-error-btn" />
              </div>

              {/* -------------------- DESIGNATION (NEW REQUIRED FIELD) -------------------- */}
              <div>
                <label className="tw-block tw-text-xs tw-text-[#25333e]">Designation*</label>
                <input
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className={`form-with-error-btn ${errors.designation ? "tw-border-red-500" : ""}`}
                />
                <p className="tw-text-red-500 tw-text-xs">{errors.designation}</p>
              </div>
            </div>

          <div className="tw-grid tw-grid-cols-2 tw-gap-x-8 tw-pr-6 tw-gap-y-2">

  {/* NOTE FIELD */}
  <div>
    <label className="tw-block tw-text-xs tw-text-[#25333e]">Note</label>
    <textarea
      name="note"
      rows="4"
      value={formData.note}
      onChange={handleInputChange}
      className="tw-w-full tw-bg-white tw-text-sm tw-h-20 tw-px-3 tw-py-1 tw-mt-2 tw-border tw-border-[#cacaca] tw-rounded-md 
                 focus:tw-outline-none focus:tw-ring-[#176183] focus:tw-border-[#176183]"
    ></textarea>
  </div>

  {/* STATUS TOGGLE — ONLY IN EDIT MODE */}
  {isEditMode && (
    <div className="tw-flex tw-flex-col tw-items-start tw-mt-2">

      <label className="tw-block tw-text-xs tw-text-transparent">Status</label>

      <div
        className={`tw-w-full tw-flex tw-items-center tw-justify-between tw-rounded-md tw-px-4 tw-py-2 tw-transition-all tw-duration-300 ${
          status
            ? "tw-bg-green-50 tw-border tw-border-green-400"
            : "tw-bg-gray-100 tw-border tw-border-gray-400"
        }`}
      >
        <span className="tw-text-sm tw-font-semibold tw-text-gray-800">
          Status
        </span>

        <div className="tw-flex tw-items-center tw-gap-4">
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
              className={`tw-inline-block tw-h-4 tw-w-4 tw-bg-white tw-rounded-full tw-shadow-md tw-transform tw-transition-transform tw-duration-300 ${
                status ? "tw-translate-x-6" : "tw-translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
        Toggle status to make {status ? "Inactive" : "Active"}
      </p>
    </div>
  )}

</div>


            {/* -------------------- PRIMARY CONTACT -------------------- */}
            <h3 className="tw-text-md tw-font-semibold tw-rounded-md tw-p-2 tw-text-[#156082] tw-bg-[#f4f4f4]">
              Primary Contact
            </h3>

            <div className="tw-grid tw-grid-cols-2 tw-gap-8 tw-p-4">
              <div>
                <label className="tw-text-xs">First Name*</label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`form-with-error-btn ${errors.firstName ? "tw-border-red-500" : ""}`}
                />
                <p className="tw-text-red-500 tw-text-xs">{errors.firstName}</p>
              </div>

              <div>
                <label className="tw-text-xs">Last Name*</label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`form-with-error-btn ${errors.lastName ? "tw-border-red-500" : ""}`}
                />
                <p className="tw-text-red-500 tw-text-xs">{errors.lastName}</p>
              </div>

              <div>
                <label className="tw-text-xs">Email Address*</label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-with-error-btn ${errors.email ? "tw-border-red-500" : ""}`}
                />
                <p className="tw-text-red-500 tw-text-xs">{errors.email}</p>
              </div>

              <div>
                <label className="tw-text-xs">Role*</label>
                <DropDown
                  options={roles.map((r) => r.role_name)}
                  placeholder="Select role"
                  value={formData.role}
                  onChange={(value) => handleDropdownChange("role", value)}
                />
              </div>
            </div>
          </form>

          <div className="tw-flex tw-justify-end tw-w-full">
            <button
              type="submit"
              onClick={handleSubmit}
              className="tw-bg-[#156082] tw-text-white tw-px-4 tw-w-[200px] tw-h-[40px] tw-rounded-md hover:tw-bg-[#18769c] tw-transition-all"
            >
              {isEditMode ? "Update Agent" : "Add Agent"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AgentForm;
