import React, { useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ForgotPassword } from "../../../services/techus-services";
import FullPageLoader from "../../../genriccomponents/loaders/FullPageLoader";
import { showToast } from "../../../genriccomponents/techus-ToastNotification";
import { motion } from "framer-motion";
import emailHeaderImg from "/src/assets/Images/default_images/email_header.png";
import tickImg from "/src/assets/Images/default_images/tick.png";
import triImg from "/src/assets/Images/default_images/tri.png";
import crossImg from "/src/assets/Images/default_images/cross.png?url";

const ForgetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: "" });
  const [errors, setErrors] = useState({ email: "" });
  const [isLoading, setIsLoading] = useState(false);

  // Check if it's admin portal based on pathname OR ut parameter
  const isAdminLogin = location.pathname.startsWith("/admin") || searchParams.get("ut") === "admin";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ email: "" });

    if (!form.email) {
      setErrors({ email: "Please enter your Email address." });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setErrors({ email: "Enter a Valid Email Address." });
      return;
    }

    try {
      setIsLoading(true);
      const payload = { 
        email_id: form.email,
        user_type: isAdminLogin ? "ADMIN" : "ORGANIZATION"
       };
      const response = await ForgotPassword(payload);
      const parsed = typeof response === "string" ? JSON.parse(response) : response
      if (parsed?.valid === true) {
        showToast("success", parsed.message);
      } else {
        showToast("error", parsed.message);
      }
    } catch (error) {
      console.error("error", error);
      showToast("error", error?.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tw-space-y-6">
      {isLoading && <FullPageLoader />}
      <motion.h2
        className="tw-text-2xl tw-font-semibold tw-text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        Forgot Password
      </motion.h2>

      <motion.div
        className="tw-w-full tw-flex tw-justify-center tw-items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <p className="tw-text-center tw-text-sm tw-text-[#414141] tw-mt-2 tw-max-w-[300px] tw-w-full">
          A code will be sent to your email to help reset your password.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <motion.div
          className="tw-mb-4"
        >
          <label className="tw-text-md tw-text-[#25333e]">Email Address</label>
          <div className="tw-relative tw-w-full">
            <div className="tw-absolute tw-top-2 tw-inset-y-0 tw-left-3 tw-flex tw-items-center tw-pointer-events-none">
              <i className="icon icon-Email-address tw-text-[#25333e] tw-text-lg"></i>
            </div>
            <motion.input
              type="text"
              name="email"
              placeholder="Email Address"
              className={`tw-w-full tw-bg-white tw-text-sm tw-pl-10 tw-pr-3 tw-py-3 tw-border tw-rounded-md tw-mt-2 focus:tw-outline-none focus:tw-ring-1 tw-placeholder-[#25333e] tw-transition-all tw-duration-200 ${errors.email
                ? "tw-border-red-500 focus:tw-ring-red-500"
                : "tw-border-[#5e6c80] focus:tw-ring-[#0140c1] focus:tw-border-[#0140c1]"
                }`}
              value={form.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          {errors.email && (
            <motion.p
              className="tw-text-red-500 tw-text-xs tw-mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {errors.email}
            </motion.p>
          )}
        </motion.div>

        <motion.button
          type="submit"
          disabled={isLoading}
          className="tw-w-full tw-bg-blue-600 hover:tw-bg-blue-700 active:tw-bg-blue-800 disabled:tw-bg-gray-400 tw-text-white tw-py-3 tw-rounded-lg tw-font-semibold tw-transition-all tw-duration-300 tw-text-base disabled:tw-cursor-not-allowed tw-shadow-md hover:tw-shadow-lg"
        >
          {isLoading ? "Sending..." : "Submit"}
        </motion.button>
        <motion.div
          onClick={() => navigate(isAdminLogin ? "/admin/login" : "/login")}
          className="tw-flex tw-justify-center tw-items-center tw-gap-3 tw-mt-10 tw-cursor-pointer tw-select-none"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <motion.i
            className="icon icon-Back tw-text-[#0140c1] tw-transition-colors tw-duration-300"
            transition={{ duration: 0.2 }}
          />

          <motion.p
            className="tw-text-[#0140c1] tw-font-medium tw-relative"
            whileHover={{ color: "#1d4ed8" }}
            transition={{ duration: 0.2 }}
          >
            Back to Sign In


            <motion.span
              className="tw-absolute tw-left-1/2 tw-bottom-[-2px] tw-h-[1.5px] tw-bg-[#156082] tw-origin-center"
              initial={{ width: 0 }}
              whileHover={{ width: "100%", left: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          </motion.p>
        </motion.div>
        <img style={{ display: "none" }} src={emailHeaderImg} alt="" />
        <img style={{ display: "none" }} src={tickImg} alt="" />
        <img style={{ display: "none" }} src={triImg} alt="" />
        <img style={{ display: "none" }} src={crossImg} alt="" />
      </form>
    </div>
  );
};

export default ForgetPassword;