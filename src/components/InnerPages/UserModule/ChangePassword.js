import React, { useState } from "react";
import { showToast } from "../../../genriccomponents/techus-ToastNotification";
import { CurrentPasswordChange } from "../../../services/techus-services";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

const ChangePassword = () => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [errors, setErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false)

  const location = useLocation();
  const isAdminPortal = location.pathname.startsWith("/admin");

    const handleLogout = () => {
    localStorage.removeItem(
      isAdminPortal
        ? 'prexo_admin_access_token'
        : 'prexo_organization_access_token'
    )
    sessionStorage.clear()
    navigate(isAdminPortal ? '/admin/login' : '/login')
  }

  const validatePassword = (password) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/;
    return regex.test(password);
  };

const handleChange = (e) => {
  const { name, value } = e.target;
  const isPasswordField = ["currentPassword", "newPassword", "confirmPassword"].includes(name);
  const sanitized = isPasswordField ? value.replace(/\s/g, "") : value;

  setForm({ ...form, [name]: sanitized });

  // Clear errors inline as conditions are met
  setErrors((prev) => {
    const updated = { ...prev };

    if (name === "currentPassword" && sanitized.trim()) {
      delete updated.currentPassword;
    }
    if (name === "newPassword") {
      if (sanitized.trim() && validatePassword(sanitized)) delete updated.newPassword;
      // Also re-check confirmPassword match
      if (form.confirmPassword && sanitized === form.confirmPassword) delete updated.confirmPassword;
      else if (form.confirmPassword && sanitized !== form.confirmPassword) updated.confirmPassword = "Passwords do not match.";
    }
    if (name === "confirmPassword") {
      if (sanitized === form.newPassword) delete updated.confirmPassword;
      else if (sanitized) updated.confirmPassword = "Passwords do not match.";
    }

    return updated;
  });
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!form.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required.";
    }
    if (!form.newPassword.trim()) {
      newErrors.newPassword = "New password is required.";
    } else if (!validatePassword(form.newPassword)) {
      newErrors.newPassword =
        "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character.";
    }
    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your new password.";
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
         setLoading(true)
        const payload = {
          old_password: form.currentPassword,
          password: form.newPassword,
        };
        const response = await CurrentPasswordChange(payload);

        if (response.valid) {
          // showToast("success", response.message);
          setShowModal(true);
          // setTimeout(() => {
          //   localStorage.removeItem(
          //     isAdminPortal
          //       ? "prexo_admin_access_token"
          //       : "prexo_organization_access_token",
          //   );
          //   // localStorage.clear();
          //   sessionStorage.clear();
          //   navigate(isAdminPortal ? "admin/login" : "/login");
          // }, 3000);
        } else {
          showToast("error", response.message);
        }
      } catch (err) {
        console.error("Error updating password:", err);
      }
      finally{
         setLoading(false) 
      }
    }
  };

  return (
    <div className="tw-mx-auto tw-px-3 tw-py-4 tw-min-h-[75vh]">
      <p className="tw-text-sm tw-text-[#a3a3a3] tw-max-w-lg">
        To change your password, please fill in the fields below.
      </p>
      <p className="tw-text-sm tw-text-[#a3a3a3] tw-mb-6 tw-max-w-2xl">
        Your password must contain at least 8 characters, it must also include
        at least one upper case letter, one lower case letter, one number and
        one special character.
      </p>

      <form onSubmit={handleSubmit} className="tw-space-y-4 tw-max-w-sm">
        {/* Current Password */}
        <div className="tw-mb-5">
          <label className="tw-text-sm tw-text-[#3b3b3b]">
            Current Password
          </label>
          <div className="tw-relative tw-w-full">
            <div className="tw-absolute tw-inset-y-0 tw-top-2 tw-left-3 tw-flex tw-items-center tw-pointer-events-none">
              <i className="icon icon-Password tw-text-[#25333e] tw-text-xl"></i>
            </div>
            <input
              type={showPassword.current ? "text" : "password"}
              name="currentPassword"
              placeholder="Current Password"
              className={`tw-w-full tw-bg-[#fff] tw-text-sm tw-pl-10 tw-pr-10 tw-py-3 tw-border tw-rounded-md tw-mt-2 focus:tw-outline-none focus:tw-ring-1 tw-placeholder-[#25333e] tw-transition-all tw-duration-200 ${
                errors.currentPassword
                  ? "tw-border-red-500 focus:tw-ring-red-500"
                  : "tw-border-[#5e6c80] focus:tw-ring-[#0140c1] focus:tw-border-[#0140c1]"
              }`}
              value={form.currentPassword}
              onChange={handleChange}
            />
            <div
              className="tw-absolute tw-inset-y-0 tw-right-3 tw-top-1 tw-flex tw-items-center tw-cursor-pointer"
              onClick={() =>
                setShowPassword({
                  ...showPassword,
                  current: !showPassword.current,
                })
              }
            >
              <i
                className={`icon ${
                  showPassword.current ? "icon-Eye" : "icon-Eye-hide"
                } tw-transition-all tw-duration-200 tw-text-2xl tw-text-[#25333e]`}
              ></i>
            </div>
          </div>
          {errors.currentPassword && (
            <p className="tw-text-red-500 tw-text-xs tw-mt-1">
              {errors.currentPassword}
            </p>
          )}
        </div>

        {/* New Password */}
        <div className="tw-mb-5">
          <label className="tw-text-sm tw-text-[#3b3b3b]">New Password</label>
          <div className="tw-relative tw-w-full">
            <div className="tw-absolute tw-inset-y-0 tw-top-2 tw-left-3 tw-flex tw-items-center tw-pointer-events-none">
              <i className="icon icon-Password tw-text-[#25333e] tw-text-xl"></i>
            </div>
            <input
              type={showPassword.new ? "text" : "password"}
              name="newPassword"
              placeholder="New Password"
              className={`tw-w-full tw-bg-[#fff] tw-text-sm tw-pl-10 tw-pr-10 tw-py-3 tw-border tw-rounded-md tw-mt-2 focus:tw-outline-none focus:tw-ring-1 tw-placeholder-[#25333e] tw-transition-all tw-duration-200 ${
                errors.newPassword
                  ? "tw-border-red-500 focus:tw-ring-red-500"
                  : "tw-border-[#5e6c80] focus:tw-ring-[#0140c1] focus:tw-border-[#0140c1]"
              }`}
              value={form.newPassword}
              onChange={handleChange}
            />
            <div
              className="tw-absolute tw-inset-y-0 tw-right-3 tw-top-1 tw-flex tw-items-center tw-cursor-pointer"
              onClick={() =>
                setShowPassword({ ...showPassword, new: !showPassword.new })
              }
            >
              <i
                className={`icon ${
                  showPassword.new ? "icon-Eye" : "icon-Eye-hide"
                } tw-transition-all tw-duration-200 tw-text-2xl tw-text-[#25333e]`}
              ></i>
            </div>
          </div>
          {errors.newPassword && (
            <p className="tw-text-red-500 tw-text-xs tw-mt-1">
              {errors.newPassword}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="tw-mb-5">
          <label className="tw-text-sm tw-text-[#3b3b3b]">
            Confirm Password
          </label>
          <div className="tw-relative tw-w-full">
            <div className="tw-absolute tw-inset-y-0 tw-top-2 tw-left-3 tw-flex tw-items-center tw-pointer-events-none">
              <i className="icon icon-Password tw-text-[#25333e] tw-text-xl"></i>
            </div>
            <input
              type={showPassword.confirm ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              className={`tw-w-full tw-bg-[#fff] tw-text-sm tw-pl-10 tw-pr-10 tw-py-3 tw-border tw-rounded-md tw-mt-2 focus:tw-outline-none focus:tw-ring-1 tw-placeholder-[#25333e] tw-transition-all tw-duration-200 ${
                errors.confirmPassword
                  ? "tw-border-red-500 focus:tw-ring-red-500"
                  : "tw-border-[#5e6c80] focus:tw-ring-[#0140c1] focus:tw-border-[#0140c1]"
              }`}
              value={form.confirmPassword}
              onChange={handleChange}
            />
            <div
              className="tw-absolute tw-inset-y-0 tw-right-3 tw-top-1 tw-flex tw-items-center tw-cursor-pointer"
              onClick={() =>
                setShowPassword({
                  ...showPassword,
                  confirm: !showPassword.confirm,
                })
              }
            >
              <i
                className={`icon ${
                  showPassword.confirm ? "icon-Eye" : "icon-Eye-hide"
                } tw-transition-all tw-duration-200 tw-text-2xl tw-text-[#25333e]`}
              ></i>
            </div>
          </div>
          {errors.confirmPassword && (
            <p className="tw-text-red-500 tw-text-xs tw-mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* <div className="tw-flex tw-justify-end">
          <button
            type="submit"
            className="tw-bg-[#0140c1] tw-w-full tw-text-white tw-px-6 tw-py-2 tw-rounded-md hover:tw-bg-[#0140c1] tw-transition-all tw-duration-300"
          >
            Update Password
          </button>
        </div> */}
<button
  type="submit"
  disabled={loading}
  className="tw-bg-[#0140c1] tw-w-full tw-text-white tw-px-6 tw-py-2 tw-rounded-md hover:tw-bg-[#0140c1] tw-transition-all tw-duration-300 tw-flex tw-items-center tw-justify-center tw-gap-2 disabled:tw-opacity-70 disabled:tw-cursor-not-allowed"
>
  {loading ? (
    <>
      <span className="tw-flex tw-items-center tw-gap-1">
        <span className="tw-w-1.5 tw-h-1.5 tw-bg-white tw-rounded-full tw-animate-bounce [animation-delay:-0.3s]"></span>
        <span className="tw-w-1.5 tw-h-1.5 tw-bg-white tw-rounded-full tw-animate-bounce [animation-delay:-0.15s]"></span>
        <span className="tw-w-1.5 tw-h-1.5 tw-bg-white tw-rounded-full tw-animate-bounce"></span>
      </span>
      Updating...
    </>
  ) : (
    'Update Password'
  )}
</button>
      </form>

      {/* Force Logout Modal */}
      {/* {showModal && (
        <div className='tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-items-center tw-justify-center tw-z-50'>
          <div className='tw-bg-white tw-rounded-xl tw-shadow-xl tw-p-8 tw-text-center tw-max-w-sm tw-w-full'>
            <h2 className='tw-text-lg tw-font-semibold tw-text-[#25333e] tw-mb-3'>
              Password Updated Successfully
            </h2>
            <p className='tw-text-sm tw-text-gray-600 tw-mb-6'>
              For security reasons, you’ll be logged out automatically.
            </p>
            <div className='loader tw-border-t-4 tw-border-[#156082] tw-w-10 tw-h-10 tw-mx-auto tw-rounded-full tw-animate-spin tw-mb-4'></div>
            <p className='tw-text-xs tw-text-gray-500'>
              Redirecting to login...
            </p>
          </div>
        </div>
      )} */}

      {showModal && (
        <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-items-center tw-justify-center tw-z-50">
          <div className="tw-bg-white tw-rounded-xl tw-shadow-xl tw-p-8 tw-text-center tw-max-w-sm tw-w-full">
            {/* Icon */}
            <div className="tw-flex tw-items-center tw-justify-center tw-w-14 tw-h-14 tw-rounded-full tw-bg-green-100 tw-mx-auto tw-mb-4">
              <svg
                className="tw-w-7 tw-h-7 tw-text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="tw-text-base tw-font-semibold tw-text-[#25333e] tw-mb-2">
              Password updated successfully
            </h2>
            <p className="tw-text-sm tw-text-gray-500 tw-mb-6">
              For security reasons, you will be logged out of the portal.
            </p>

            <button
              onClick={handleLogout}
              onKeyDown={(e) => e.key === 'Enter' && handleLogout()}
              className="tw-bg-[#0140c1] tw-text-white tw-text-sm tw-font-medium tw-px-8 tw-py-2 tw-rounded-md hover:tw-bg-blue-700 tw-transition-all tw-duration-200 tw-w-full"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangePassword;
