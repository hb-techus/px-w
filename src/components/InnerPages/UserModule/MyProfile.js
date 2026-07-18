import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ImageCropModal from "../../../genriccomponents/ImageUtils";
import { X } from "lucide-react";
// import DropDown from "../../../genriccomponents/FormDropDown";
import { GetUserList, UpdateUser } from "../../../services/techus-services";
import { showToast } from "../../../genriccomponents/techus-ToastNotification";
import FullPageLoader from "../../../genriccomponents/loaders/FullPageLoader";
// import { ShimmerCategoryItem } from "react-shimmer-effects";
import CONFIG from "../../../config/config";
import { capitalizeFirstLetter } from "../../../utils/commonUtils";

const convertS3ImageToBase64 = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl, { mode: "cors" });
    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Error converting S3 image to Base64:", err);
    return null;
  }
};

const MyProfile = () => {

  const location = useLocation();

  // Detect current portal
  const isAdminPortal = location.pathname.startsWith("/admin");

  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    role: "",
    employeeId: "",
    designation: "",
    address: "",
    department: "",
    proEmail: "",
  });
  const [errors, setErrors] = useState({});
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [openCropModal, setOpenCropModal] = useState(false);
  const [loading, setLoading] = useState(false);
  // const [roleLoading, setRoleLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const requiredFields = ["firstName", "lastName", "phone", "email"];

const uuid = localStorage.getItem(
  isAdminPortal
    ? 'prexo_admin_uuid'
    : 'prexo_organization_uuid'
)

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);

        const userRes = await GetUserList();
        const currentUUID = uuid;
        const user = userRes?.user?.find(
          (u) => String(u.id) === String(currentUUID),
        );

        if (user) {
          setFormData({
            id: user.id,
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            phone: user.mobile_number || "",
            email: user.email_id || "",
            image_name: user.image_name,
            employeeId: user.emloyee_id || "",
            designation: user.designation || "",
            address: user.address || "",
            department: user.department || "",
            proEmail: user.professional_email || "",
          });

          const s3ImageUrl = `${CONFIG.VITE_AWS_ENDPOINT}/user_profile_images/user_image_${user.id}.png?v=${Date.now()}`;
          // convertS3ImageToBase64(s3ImageUrl).then((base64) => {
          //   if (base64) setCroppedImage(base64);
          //   else setCroppedImage(null);
          // });
          setIsImageLoading(true);
          convertS3ImageToBase64(s3ImageUrl).then((base64) => {
            if (base64) setCroppedImage(base64);
            else setCroppedImage(null);
            setIsImageLoading(false);
          });
        }
      } catch (e) {
        console.error("Error fetching user profile:", e);
      } finally {
        setTimeout(() => setLoading(false), 200);
      }
    };

    loadUser();
  }, []);
  const labels = {
    firstName: "First Name",
    lastName: "Last Name",
    phone: "Phone Number",
    email: "Email Address",
  };
  const validateField = (name, value) => {
    let label = labels[name];
    if (requiredFields.includes(name) && !String(value || "").trim()) {
      const formatted = label
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase());
      return `${formatted} is required`;
    }
    if ((name === "email" || name === "proEmail") && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Enter a valid email address";
    }
    if (name === "phone" && value && !/^[6-9]\d{9}$/.test(value))
      return "Enter a valid 10-digit phone number";
    return "";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleInputBlur = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  // const handleDropdownChange = (name, value) => {
  //   setFormData((prev) => ({ ...prev, [name]: value }));
  //   setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  // };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target.result);
      setOpenCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropSave = (base64) => {
    setCroppedImage(base64);
    setOpenCropModal(false);
  };

  const handleImageDelete = () => setCroppedImage(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const selectedRole = roles.find((r) => r.role_name === formData.role);
    const payload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      mobile_number: formData.phone,
      email_id: formData.email,
      role: selectedRole?.role_id || "",
      emloyee_id: formData.employeeId,
      designation: formData.designation,
      department: formData.department,
      prof_email: formData.proEmail,
      address: formData.address,
      image_name: croppedImage ? `profile_${Date.now()}.png` : "",
      imgsrc: croppedImage,
      userId: formData.id,
      is_profile_update: true,
      user_fullname: `${formData.firstName} ${formData.lastName}`,
    };

    try {
      setSaving(true);
      const response = await UpdateUser(payload);
      if (response.valid) {
        showToast("success", "Profile updated successfully!");
        window.dispatchEvent(new Event("profileUpdated"));
        // Navigate back to users page in the correct portal
        // navigate(isAdminPortal ? "/admin/users" : "/users");
      } else {
        showToast("error", response.message || "Update failed");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      showToast("error", "Something went wrong while updating");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FullPageLoader />;

  void setRoles;
  return (
    <div
      className={`tw-w-full ${openCropModal ? "tw-space-y-0" : "tw-space-y-8"}`}
    >
      <form
        onSubmit={handleSubmit}
        className="tw-space-y-4 tw-bg-white tw-rounded-lg tw-p-4 tw-transition-all tw-duration-300"
      >
        {/* Personal Information */}
        <div className="tw-space-y-4">
          <div className="tw-grid tw-grid-cols-3 tw-gap-8 tw-px-6 tw-pb-6">
            {/* Image Section */}
            <div className="tw-flex tw-flex-col tw-items-start tw-gap-4">
              <div className="tw-relative tw-w-[132px] tw-h-[132px] tw-border tw-border-gray-300 tw-rounded-full tw-overflow-hidden group tw-bg-gray-50">
                {isImageLoading ? (
                  <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-gray-100 tw-rounded-full tw-gap-2">
                    <div className="tw-w-6 tw-h-6 tw-border-2 tw-border-[#0140c1] tw-border-t-transparent tw-rounded-full tw-animate-spin" />
                    <span className="tw-text-[13px] tw-text-gray-600 tw-font-medium">
                      Loading...
                    </span>
                  </div>
                ) : croppedImage ? (
                  <>
                    <img
                      src={croppedImage}
                      alt="Profile"
                      onLoad={() => setIsImageLoading(false)}
                      onError={() => {
                        setIsImageLoading(false);
                        setCroppedImage(null);
                      }}
                      className="tw-w-full tw-h-full tw-object-cover tw-transition-opacity tw-duration-500 tw-opacity-100"
                    />
                    <button
                      type="button"
                      onClick={handleImageDelete}
                      className="tw-absolute tw-top-1 tw-right-1 tw-bg-gray-700 tw-text-white tw-rounded-full tw-p-1 tw-opacity-0 group-hover:tw-opacity-100 tw-transition-all tw-duration-200"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <div className="tw-w-full tw-h-full tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-gray-400 tw-gap-1">
                    <span className="tw-text-sm tw-text-gray-500">
                      No Photo
                    </span>
                  </div>
                )}
              </div>

              <label className="tw-cursor-pointer tw-bg-white tw-border tw-border-[#0140c1] tw-text-[#0140c1] hover:tw-bg-[#0140c1] hover:tw-text-white tw-px-3 tw-py-1 tw-rounded-md tw-transition-all tw-duration-300 tw-text-sm tw-w-[132px] tw-text-center">
                {croppedImage ? "Change Photo" : "Upload Photo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="tw-hidden"
                />
              </label>
            </div>

            {/* Column 2 */}
            <div className="tw-space-y-3">
              <div>
                <label className="tw-block tw-text-xs tw-text-[#3b3b3b]">
                  First Name*
                </label>
                <input
                  name="firstName"
                  value={formData.firstName?capitalizeFirstLetter(formData.firstName):''}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  data-lpignore="true"
                  data-form-type="other"
                  className={`form-with-error-btn ${
                    errors.firstName
                      ? "tw-border-red-500 focus:tw-ring-red-500"
                      : "tw-border-[#cacaca] focus:tw-ring-[#0140c1] focus:tw-border-[#0140c1]"
                  }`}
                />
                {errors.firstName && (
                  <p className="tw-text-red-500 tw-text-xs tw-mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="tw-block tw-text-xs tw-text-[#3b3b3b">
                  Phone Number*
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className={`form-with-error-btn ${
                    errors.phone
                      ? "tw-border-red-500 focus:tw-ring-red-500"
                      : "tw-border-[#cacaca] focus:tw-ring-[#0140c1] focus:tw-border-[#0140c1]"
                  }`}
                />
                {errors.phone && (
                  <p className="tw-text-red-500 tw-text-xs tw-mt-1">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Column 3 */}
            <div className="tw-space-y-3">
              <div>
                <label className="tw-block tw-text-xs tw-text-[#3b3b3b">
                  Last Name*
                </label>
                <input
                  name="lastName"
                   value={formData.lastName?capitalizeFirstLetter(formData.lastName):''}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className={`form-with-error-btn ${
                    errors.lastName
                      ? "tw-border-red-500 focus:tw-ring-red-500"
                      : "tw-border-[#cacaca] focus:tw-ring-[#0140c1] focus:tw-border-[#0140c1]"
                  }`}
                />
                {errors.lastName && (
                  <p className="tw-text-red-500 tw-text-xs tw-mt-1">
                    {errors.lastName}
                  </p>
                )}
              </div>

              <div className="tw-relative tw-group">
                <label className="tw-block tw-text-xs tw-text-[#3b3b3b">
                  Email Address*
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled
                  className={`form-with-error-btn ${
                    errors.email
                      ? "tw-border-red-500 focus:tw-ring-red-500"
                      : "tw-border-[#cacaca] focus:tw-ring-[#0140c1] focus:tw-border-[#0140c1]"
                  }`}
                />

                <div className="tw-absolute tw-top-[-35px] tw-left-1/2 tw--translate-x-1/2 tw-whitespace-nowrap tw-bg-black tw-text-white tw-text-[11px] tw-rounded tw-px-[8px] tw-py-[4px] tw-opacity-0 group-hover:tw-opacity-100 tw-transition-all tw-duration-200 tw-pointer-events-none tw-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                  You can't edit this field
                </div>

                {errors.email && (
                  <p className="tw-text-red-500 tw-text-xs tw-mt-1">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Submit Button */}
      <div className="tw-flex tw-justify-end tw-mt-4">
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={saving}
          className="tw-flex tw-justify-center tw-gap-5 tw-items-center tw-bg-[#0140c1] tw-px-4 tw-w-[150px] tw-h-[45px] tw-text-white tw-rounded-md tw-transition-all tw-duration-300 hover:tw-shadow-[0_4px_10px_rgba(21,96,130,0.4)] hover:tw-bg-[#0140c1]"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {openCropModal && (
        <ImageCropModal
          imageSrc={imageSrc}
          onClose={() => setOpenCropModal(false)}
          onSave={handleCropSave}
        />
      )}
    </div>
  );
};

export default MyProfile;
