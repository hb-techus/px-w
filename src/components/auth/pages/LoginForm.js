import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LoginUser } from "../../../services/techus-services";
import Bowser from "bowser";
import Cookies from "js-cookie";
import FullPageLoader from "../../../genriccomponents/loaders/FullPageLoader";
import { showToast } from "../../../genriccomponents/techus-ToastNotification";
import { motion } from "framer-motion";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
    keep: false,
  });

  const [errors, setErrors] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isAdminLogin = location.pathname.startsWith("/admin");
  const portal = isAdminLogin ? "admin" : "organization";

  // ─── userType as state so it can be restored from cookie on mount ─────────
  const [userType, setUserType] = useState(isAdminLogin ? "ADMIN" : "ORGANIZATION");

  // Email validation regex
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ─── Cookie key prefix per login type (keeps org & admin fully separate) ─
  const cookiePrefix = isAdminLogin ? "admin" : "org";

  // ─── On mount: restore remembered email from Cookies ─────────────────────
  useEffect(() => {
    Cookies.remove(`${cookiePrefix}_remember_password`);
    const savedEmail = Cookies.get(`${cookiePrefix}_remember_email`);
    const savedKeep = Cookies.get(`${cookiePrefix}_remember_keep`) === "true";
    const savedUserType = Cookies.get(`${cookiePrefix}_remember_userType`);

    if (savedEmail && savedKeep) {
      setForm((prev) => ({
        ...prev,
        email: savedEmail,
        keep: true,
      }));

      if (savedUserType) {
        setUserType(savedUserType);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
   const updatedValue = type === "checkbox" ? checked : (name === "email" || name === "password" ? value.replace(/\s/g, "") : value);
    setForm((prev) => ({ ...prev, [name]: updatedValue }));

    // ─── If user unchecks "Remember me", clear only this login type's cookies ─
    if (name === "keep" && !updatedValue) {
      Cookies.remove(`${cookiePrefix}_remember_email`);
      Cookies.remove(`${cookiePrefix}_remember_keep`);
      Cookies.remove(`${cookiePrefix}_remember_userType`);
    }

    if (name === "email") {
      if (!value.trim()) setErrors((prev) => ({ ...prev, email: "Please enter your Email address." }));
      else if (!validateEmail(value))
        setErrors((prev) => ({ ...prev, email: "Enter a valid email address." }));
      else setErrors((prev) => ({ ...prev, email: "" }));
    }

    if (name === "password") {
      if (!value.trim()) setErrors((prev) => ({ ...prev, password: "Please enter your password." }));
      else setErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    if (!form.email.trim()) newErrors.email = "Please enter your Email address.";
    else if (!validateEmail(form.email)) newErrors.email = "Enter a valid email address.";

    if (!form.password.trim()) newErrors.password = "Please enter your password.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length !== 0) return;

    const browser = Bowser.getParser(window.navigator.userAgent);
    const device_info = {
      os_name: browser.getOSName(),
      os_version: browser.getOSVersion(),
      browser_name: browser.getBrowserName(),
      browser_version: browser.getBrowserVersion(),
    };

    const payload = {
      email_id: form.email,
      password: form.password,
      user_type: userType,
      device_info,
    };

    try {
      setIsLoading(true);
      const response = await LoginUser(payload);

      if (response.valid) {
        if (form.keep) {
          Cookies.set(`${cookiePrefix}_remember_email`, form.email, { expires: 30, secure: true, sameSite: 'strict' });
          Cookies.set(`${cookiePrefix}_remember_keep`, "true", { expires: 30, secure: true, sameSite: 'strict' });
          Cookies.set(`${cookiePrefix}_remember_userType`, userType, { expires: 30, secure: true, sameSite: 'strict' });
        } else {
          Cookies.remove(`${cookiePrefix}_remember_email`);
          Cookies.remove(`${cookiePrefix}_remember_keep`);
          Cookies.remove(`${cookiePrefix}_remember_userType`);
        }

        showToast("success", response.message);

        sessionStorage.setItem(
          portal === "admin"
            ? "prexo_admin_2fa_allowed"
            : "prexo_organization_2fa_allowed",
          "true"
        );

        navigate(
          portal === "admin"
            ? "/admin/two-factor-authentication"
            : "/two-factor-authentication",
          {
            state: {
              email_id: form.email,
              user_type: userType,
              portal,
            },
          }
        );
      } else {
        showToast("error", response.message);
      }
    } catch (e) {
      console.error("Login Error:", e);
      showToast("error", e.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <motion.div
      className="tw-w-full tw-space-y-6 tw-font-inter"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {isLoading && <FullPageLoader />}

      {/* Header */}
      <div className="tw-space-y-2">
        <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900 ">
          Welcome back
        </h1>
        <p className="tw-text-base tw-text-gray-600">
          Sign in to your account to continue
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="tw-space-y-5">
        {/* Email Input */}
        <div className="tw-space-y-2">
          <label className="tw-text-sm tw-font-medium tw-text-gray-900">
            Email Address
          </label>
          <div className="tw-relative tw-w-full">
            <div className="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-4 tw-flex tw-items-center tw-pointer-events-none">
              <i className="icon icon-Email-address tw-text-gray-400 tw-text-xl"></i>
            </div>
            <input
              type="text"
              name="email"
              id="email"
              data-lp="true"
              placeholder="you@example.com"
              className={`tw-w-full tw-bg-white tw-text-sm tw-pl-12 tw-pr-4 tw-py-3 tw-border tw-rounded-md tw-transition-all tw-duration-200 tw-placeholder-gray-400 focus:tw-outline-none focus:tw-ring-2 focus:tw-bg-white ${errors.email
                ? "tw-border-red-300 focus:tw-ring-red-500/30"
                : "tw-border-gray-300 focus:tw-ring-blue-500/30 focus:tw-border-blue-400"
                }`}
              value={form.email}
              onChange={handleChange}
            />
          </div>
          {errors.email && (
            <motion.p
              className="tw-text-red-500 tw-text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {errors.email}
            </motion.p>
          )}
        </div>

        {/* Password Input */}
        <div className="tw-space-y-2">
          <div className="tw-flex tw-justify-between tw-items-center">
            <label className="tw-text-sm tw-font-medium tw-text-gray-900">
              Password
            </label>
          </div>
          <div className="tw-relative tw-w-full">
            <div className="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-4 tw-flex tw-items-center tw-pointer-events-none">
              <i className="icon icon-Password tw-text-gray-400 tw-text-xl"></i>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              data-lp="true"
              placeholder="Enter your password"
              className={`tw-w-full tw-bg-white tw-text-sm tw-pl-12 tw-pr-12 tw-py-3 tw-border tw-rounded-md tw-transition-all tw-duration-200 tw-placeholder-gray-400 focus:tw-outline-none focus:tw-ring-2 focus:tw-bg-white ${errors.password
                ? "tw-border-red-300 focus:tw-ring-red-500/30"
                : "tw-border-gray-300 focus:tw-ring-blue-500/30 focus:tw-border-blue-400"
                }`}
              value={form.password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="tw-absolute tw-inset-y-0 tw-right-0 tw-pr-4 tw-flex tw-items-center tw-text-gray-400 hover:tw-text-gray-600 tw-transition-colors tw-cursor-pointer"
            >
              <i
                className={`icon ${showPassword ? "icon-Eye" : "icon-Eye-hide"} tw-text-xl`}
              ></i>
            </button>
          </div>
          {errors.password && (
            <motion.p
              className="tw-text-red-500 tw-text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {errors.password}
            </motion.p>
          )}
        </div>

        {/* Remember Me Checkbox */}
        <label className="tw-flex tw-items-center tw-gap-3 tw-cursor-pointer tw-select-none tw-justify-between ">
          <div className="tw-flex tw-items-center tw-gap-2">
            <input
              type="checkbox"
              name="keep"
              checked={form.keep}
              onChange={handleChange}
              className="tw-w-5 tw-h-5 tw-appearance-none tw-border tw-border-gray-300 tw-rounded tw-relative tw-cursor-pointer tw-bg-white checked:tw-bg-blue-600"
            />
            <span className="tw-text-sm tw-text-gray-700">
              Remember me
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate(isAdminLogin ? "/admin/forgot-password" : "/forgot-password")
            }
            className="tw-text-sm tw-text-blue-600 hover:tw-text-blue-700 tw-font-medium tw-transition-colors"
          >
            Forgot Password?
          </button>
        </label>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isLoading}
          className="tw-w-full tw-bg-blue-600 hover:tw-bg-blue-700 active:tw-bg-blue-800 disabled:tw-bg-gray-400 tw-text-white tw-py-3 tw-rounded-lg tw-font-semibold tw-transition-all tw-duration-300 tw-text-base tw-mt-8 disabled:tw-cursor-not-allowed tw-shadow-md hover:tw-shadow-lg"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </motion.button>
      </form>

      {/* Terms Text */}
      <p className="tw-text-xs tw-text-gray-600 tw-text-center tw-leading-relaxed">
        By clicking on Login, you agree to our{" "}
        <a href="#" className="tw-text-blue-600 hover:tw-underline tw-font-medium">
          Terms of Use
        </a>
        {" "}&{" "}
        <a href="#" className="tw-text-blue-600 hover:tw-underline tw-font-medium">
          Privacy Policy
        </a>
      </p>
    </motion.div>
  );
};

export default Login;