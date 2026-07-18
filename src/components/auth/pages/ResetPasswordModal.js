import React, { useEffect, useState } from "react";
import { ResetPassword } from "../../../services/techus-services";
import { showToast } from "../../../genriccomponents/techus-ToastNotification";

const ResetPasswordModal = ({ open, onClose, user }) => {
    console.log(user)
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


 useEffect(() => {
    if (open) {
      console.log("Modal opened with user:", user);  // ← debug only when open
      setForm({ password: "", confirmPassword: "" });
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open, user]);

  if (!open || !user) return null; 

  const validatePassword = (password) => {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password);
  };

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     setForm((prev) => ({ ...prev, [name]: value }));

//     let error = "";

//     if (name === "password") {
//       if (!value) error = "Password is required";
//       else if (!validatePassword(value))
//         error =
//           "Must have 8+ chars, 1 capital, 1 number, 1 special character";
//       else if (form.confirmPassword && value !== form.confirmPassword)
//         error = "Passwords do not match";
//     }

//     if (name === "confirmPassword") {
//       if (!value) error = "Confirm password is required";
//       else if (value !== form.password)
//         error = "Passwords do not match";
//     }

//     setErrors((prev) => ({ ...prev, [name]: error }));
//   };


const handleChange = (e) => {
  const { name, value } = e.target;
  const sanitizedValue = value.replace(/\s/g, ""); // ← remove spaces
  
  const updatedForm = {
    ...form,
    [name]: sanitizedValue, // ← use sanitized value
  };

  setForm(updatedForm);

  let error = "";

 if (name === "password") {
    if (!sanitizedValue) error = "Please enter your password.";
    else if (!validatePassword(sanitizedValue))
      error = "Must have 8+ chars, 1 capital, 1 number, 1 special character.";

    
    const confirmError =
      updatedForm.confirmPassword && sanitizedValue !== updatedForm.confirmPassword
        ? "Passwords do not match"
        : updatedForm.confirmPassword && sanitizedValue === updatedForm.confirmPassword
        ? ""
        : undefined;

    if (confirmError !== undefined) {
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  }

  if (name === "confirmPassword") {
    if (!sanitizedValue) error = "Please enter your confirm password.";
    else if (sanitizedValue !== updatedForm.password)
      error = "Passwords do not match.";
  }

  setErrors((prev) => ({ ...prev, [name]: error }));
};
  const handleSubmit = async () => {
     let tempErrors = {};

  if (!form.password)
    tempErrors.password = "Please enter your password.";
  else if (!validatePassword(form.password))
    tempErrors.password =
      "Must have 8+ chars, 1 capital, 1 number, 1 special character.";

  if (!form.confirmPassword)
    tempErrors.confirmPassword = "Please enter your confirm password.";
  else if (form.password !== form.confirmPassword)
    tempErrors.confirmPassword = "Passwords do not match.";

  if (Object.keys(tempErrors).length > 0) {
    setErrors(tempErrors);
    return;
  }

    if (!form.password || !form.confirmPassword) {
      setErrors({
        password: !form.password ? "Please enter your password." : "",
        confirmPassword: !form.confirmPassword
          ? "Please enter your confirm password."
          : "",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        userId: user?.id,
        password: form.password,
      };

      const res = await ResetPassword(payload);

      if (res?.valid) {
        showToast("success", res.message || "Password reset successfully.");
        onClose();
        setForm({ password: "", confirmPassword: "" });
      } else {
        showToast("error", res?.message || "Failed to reset password.");
      }
    } catch {
      showToast("error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/40 tw-flex tw-items-center tw-justify-center tw-z-[9999]">
      <div className="tw-bg-white tw-rounded-xl tw-w-[440px] tw-p-6">

        {/* Header */}
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
          <h2 className="tw-text-[18px] tw-font-semibold">Reset Password</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {/* Info */}
        <p className="tw-text-[13px] tw-text-[#6b7280] tw-mb-4">
          At least 8 characters; At least 1 capital letter; At least 1 number; At least 1 special character.
        </p>

        {/* New Password */}
        <div className="tw-mb-3">
          <label className="tw-text-[13px] tw-text-[#25333e]">
            New Password*
          </label>

          <div className="tw-relative">
            <div className="tw-absolute tw-left-3 tw-top-3.5">
              <i className="icon-Password tw-text-[#25333e]" />
            </div>

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
                placeholder="Enter New Password"
              className={`tw-w-full tw-pl-10 tw-pr-10 tw-py-2 tw-border tw-rounded-md tw-mt-1 focus:tw-outline-none placeholder:tw-text-[14px] ${
                errors.password
                  ? "tw-border-red-500"
                  : "focus:tw-border-[#0140c1]"
              }`}
            />

            <div
              className="tw-absolute tw-right-3 tw-top-3 tw-cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              <i
                className={`${
                  showPassword ? "icon-Eye" : "icon-Eye-hide"
                }`}
              />
            </div>
          </div>

          {errors.password && (
            <p className="tw-text-red-500 tw-text-xs tw-mt-1">
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="tw-mb-4">
          <label className="tw-text-[13px] tw-text-[#25333e]">
            Confirm Password*
          </label>

          <div className="tw-relative">
            <div className="tw-absolute tw-left-3 tw-top-3.5">
              <i className="icon-Password tw-text-[#25333e]" />
            </div>

            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-Enter New Password"
              className={`tw-w-full tw-pl-10 tw-pr-10 tw-py-2 tw-border tw-rounded-md tw-mt-1 focus:tw-outline-none placeholder:tw-text-[14px] ${
                errors.confirmPassword
                  ? "tw-border-red-500"
                  : "focus:tw-border-[#0140c1]"
              }`}
            />

            <div
              className="tw-absolute tw-right-3 tw-top-4 tw-cursor-pointer"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
            >
              <i
                className={`${
                  showConfirmPassword ? "icon-Eye" : "icon-Eye-hide"
                }`}
              />
            </div>
          </div>

          {errors.confirmPassword && (
            <p className="tw-text-red-500 tw-text-xs tw-mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Note */}
        {/* <p className="tw-text-[12px] tw-text-gray-400 tw-mb-4">
          For the security of your account, once you set your new password, you will be logged out of any other devices.
        </p> */}

        {/* Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="tw-w-full tw-bg-[#0140c1] tw-text-white tw-h-[42px] tw-rounded-md"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </div>
    </div>
  );
};

export default ResetPasswordModal;