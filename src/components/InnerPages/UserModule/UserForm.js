import React from "react";
import { useState, useEffect } from "react";
import { Check, Circle, Eye, EyeOff } from "lucide-react";
import Dropdown from "../../Common/DropDown";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import FullPageLoader from "../../../genriccomponents/loaders/FullPageLoader";

import {
  RegisterUser,
  GetRolesList,
  UpdateUser,
} from "../../../services/techus-services";
import { showToast } from "../../../genriccomponents/techus-ToastNotification";
import NavigationHeader from "../../../genriccomponents/NavigationHeader";
import { capitalizeFirstLetter } from "../../../utils/commonUtils";

const rules = [
  { id: "len", label: "At least 8 characters", test: (p) => p.length >= 8 },
  {
    id: "upper",
    label: "One uppercase letter (A-Z)",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: "lower",
    label: "One lowercase letter (a-z)",
    test: (p) => /[a-z]/.test(p),
  },
  { id: "num", label: "One number (0-9)", test: (p) => /[0-9]/.test(p) },
  {
    id: "spec",
    label: "One special character (!@#$%^&*)",
    test: (p) => /[!@#$%^&*()_+{}[\]:;<>,.?~\\/-]/.test(p),
  },
];

const getStrength = (score) => {
  if (score <= 2) return { label: "Weak", color: "tw-bg-red-500" };
  if (score === 3 || score === 4)
    return { label: "Medium", color: "tw-bg-yellow-400" };
  if (score === 5) return { label: "Strong", color: "tw-bg-green-500" };
  return { label: "", color: "tw-bg-gray-200" };
};

export default function CreateUserForm() {
  const { id } = useParams();

  const isEditMode = Boolean(id);
  // const [view, setView] = useState("form");
  const location = useLocation();
  const isAdminPortal = location.pathname.startsWith("/admin");
  const userType = isAdminPortal ? "ADMIN" : "ORGANIZATION";
  // const userType = localStorage.getItem("user_type");
  const organizationId = localStorage.getItem("organization_id");
  const [passwordMode, setPasswordMode] = useState("activation");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);

  const [roles, setRoles] = useState([]);
  const navigate = useNavigate();
  const editData = location.state?.editData;
  console.log(editData);
  const [formData, setFormData] = useState({
    firstName: editData?.firstName || "",
    lastName: editData?.lastName || "",
    email: editData?.email || "",
    organizationId: editData?.organizationId || "", //
    role: editData?.role ? String(editData.role) : "",
    sendActivation: true,
    expiry: "24 hrs", // default 24 hours
  });

  // goBack
  const goBack = () => {
    // flushSync(() => setLoading(true));  // ← only this line changes
    navigate("/users");
  };

  const saveUser = async () => {
    const expiryMap = {
      "24 hrs": 1,
      "48 hrs": 2,
      "7 days": 7,
    };


    const payload = {
      userId: isEditMode ? editData?.id : undefined,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email_id: formData.email,
      password: passwordMode === "manual" ? password : "",
      user_type: userType || "",
      role_id: formData.role,
      organization_id: organizationId,
      activation_type: passwordMode === "manual" ? "password" : "activation",
      expiry_day: passwordMode === "manual" ? null : expiryMap[formData.expiry],
    };

    try {
      if (isEditMode) {
        console.log("payload", payload, "id", editData.id);
        return await UpdateUser(payload, editData?.id);
      } else {
        return await RegisterUser(payload);
      }
    } catch (error) {
      console.error("Save user error:", error);
      return { valid: false, message: "Something went wrong" };
    }
  };


  useEffect(() => {
    const loadRoles = async () => {
      try {
        setRolesLoading(true); // ← start loader
        const res = await GetRolesList(organizationId, {
          role_type: "ORGANIZATION",
        });
        const rawRoles = res?.data || res?.roles || [];
        if (res?.valid || rawRoles.length > 0) {
          const roleOptions = rawRoles
            .filter((d) => d.status !== 0)
            .map((role) => ({
              label: role.role_name,
              value: String(role.role_id || role.id),
            }));
          setRoles(roleOptions);
        }
      } catch (error) {
        console.error("Error fetching roles", error);
      } finally {
        setRolesLoading(false); // ← stop loader
      }
    };
    loadRoles();
  }, []);

  useEffect(() => {
    if (editData && roles.length > 0) {
      const matchedRole =
        roles.find((r) => String(r.value) === String(editData.role)) ||
        roles.find(
          (r) => r.label?.toLowerCase() === editData.role_name?.toLowerCase(), // ← fallback by name
        );
      if (matchedRole) {
        setFormData((prev) => ({
          ...prev,
          role: String(matchedRole.value),
        }));
      }
    }
  }, [roles, editData]);

  // handleSave
  const handleSave = async () => {
    const e = validate();
    setErrors(e);

    if (Object.keys(e).length === 0) {
      setLoading(true);

      const result = await saveUser();

      setLoading(false);

      if (result.valid) {
        navigate("/users");
        showToast(
          "success",
          isEditMode
            ? "User updated successfully."
            : "User created successfully.",
        );
      } else {
        showToast("error", result.message);

        setErrors({
          ...errors,
          email: result.message,
        });
      }
    }
  };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validate = () => {
    const e = {};
    if (!formData.firstName?.trim()) e.firstName = "First name is required.";
    if (!formData.lastName?.trim()) e.lastName = "Last name is required.";
    if (!formData.email?.trim()) {
      e.email = "Please enter your Email address.";
    } else if (!emailRegex.test(formData.email)) {
      e.email = "Enter a valid email address.";
    }

    if (!formData.role) e.role = "Role is required.";

    if (passwordMode === "manual") {
      if (!password) {
        e.password = "Please enter your password.";
      } else if (rules.filter((r) => r.test(password)).length < rules.length) {
        e.password = "Password does not meet all requirements."; // ← only ONE line here
      }
      if (!confirmPw) e.confirmPw = "Please enter your confirm password.";
      else if (confirmPw !== password) e.confirmPw = "Passwords do not match.";
    }

    if (!isEditMode && !formData.expiry)
      e.expiry = "Expiry duration is required.";

    return e;
  };

  const passedRules = rules.filter((r) => r.test(password)).length;
  const score = passedRules;
  // if (passedRules >= 2) score = 1;
  // if (passedRules >= 3) score = 2;
  // if (passedRules >= 5) score = 3;
  // const barColor = score > 0 ? strengthInfo[score - 1].color : "tw-bg-gray-200";
  // const strengthLabel = score > 0 ? strengthInfo[score - 1].label : "";
  const { label: strengthLabel, color: barColor } = getStrength(score);

  const field = (
    key,
    label,
    type = "text",
    placeholder = "",
    capitalize = false,
  ) => (
    <div>
      {/* LABEL */}
      <label className="tw-block  tw-text-[14px] tw-font-normal tw-text-[#3b3b3b] tw-mb-1">
        {label} <span className="tw-text-red-500">*</span>
      </label>

      {/* INPUT */}
      <input
        type={type}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        value={
          capitalize
            ? capitalizeFirstLetter(formData[key])
            : formData[key] || ""
        }
        onChange={(e) => {
          const val = e.target.value;
          setFormData({
            ...formData,
            [key]: capitalize ? capitalizeFirstLetter(val) : val,
          });
          setErrors({ ...errors, [key]: "" });
        }}
        className={`
    tw-w-full
    tw-px-3 tw-py-2
  
    tw-rounded-md
    tw-border tw-border-gray-200
  
    tw-text-gray-800            
    tw-placeholder-[#717182]     
    tw-text-sm
    tw-text-[medium]
   
        focus:tw-outline-none
    focus:tw-border-blue-500
    focus:tw-ring-1
    focus:tw-ring-blue-500
  
    focus:tw-bg-white
  `}
      />

      {errors[key] && (
        <p className="tw-text-[11px] tw-text-red-500 tw-mt-1">{errors[key]}</p>
      )}
    </div>
  );

  const isFormValid = () => {
    const basicValid =
      formData.firstName?.trim() &&
      formData.lastName?.trim() &&
      formData.email?.trim() &&
      emailRegex.test(formData.email) &&
      formData.role;

    if (!basicValid) return false;

    if (!isEditMode) {
      if (!formData.expiry) return false;

      if (passwordMode === "manual") {
        const allRulesPassed = rules.every((r) => r.test(password));
        if (!allRulesPassed) return false;
        if (!confirmPw || confirmPw !== password) return false;
      }
    }

    return true;
  };

  // if (loading) {
  //   return <FullPageLoader />
  // }
  const currentUserId = localStorage.getItem(
    isAdminPortal ? "prexo_admin_uuid" : "prexo_organization_uuid",
  );
  const isCurrentUser =
    isEditMode &&
    [editData?.id, editData?.user_uuid, id]
      .filter(Boolean)
      .some((value) => String(value) === String(currentUserId));
  console.log("URL id:", id);
  console.log("currentUserId:", currentUserId);
  return (
    <>
      <div className="tw-flex tw-min-h-screen">
        {(loading || (isEditMode && rolesLoading)) && <FullPageLoader />}
        <div className="tw-w-full tw-mx-auto">
          {/* <div class='tw-flex tw-items-center tw-gap-4 tw-mb-6'>
            <button
              onClick={goBack}
              class='tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-bg-[#cbd5e1] tw-rounded-lg hover:tw-bg-[#0140c1] tw-transition-colors tw-duration-200'
            >
              <i class='icon-Previous tw-text-white tw-text-lg'></i>
            </button>

            <div class='tw-flex tw-flex-col tw-justify-center'>
              <div class='tw-text-[#535353] tw-text-[14px] tw-font-normal'>
                Users /
              </div>
              <h1 class='tw-text-gray-900 tw-text-[20px] tw-font-bold tw-leading-tight'>
                {isEditMode ? 'Edit User' : 'Create User'}
              </h1>
            </div>
          </div> */}
          <div className="tw-mb-6">
            <NavigationHeader
              title="Users /"
              subTitle={isEditMode ? "Edit User" : "Create User"}
              navigation="/users"
            />
          </div>
          <div className="tw-bg-white tw-rounded-xl tw-border tw-shadow-sm tw-p-8">
            {/* ── Basic Info ── */}
            <section className="tw-mb-4">
              <h2 className="tw-text-[#101828] tw-text-[16px] tw-font-bold tw-mb-4">
                Basic Information
              </h2>
              <div className="tw-grid tw-grid-cols-3 tw-gap-6">
                {field("firstName", "First Name", "text", "", true)}
                {field("lastName", "Last Name", "text", "", true)}
                <div>
                  <label className="tw-block tw-text-[14px] tw-font-normal tw-text-[#3b3b3b] tw-mb-1 ">
                    Email Address <span className="tw-text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="example@domain.com"
                    value={formData.email || ""}
                    disabled={isEditMode}
                    onChange={(e) => {
                      const value = e.target.value;

                      setFormData({ ...formData, email: value });

                      if (!value.trim()) {
                        setErrors({
                          ...errors,
                          email: "Please enter your Email address.",
                        });
                      } else if (!emailRegex.test(value)) {
                        setErrors({
                          ...errors,
                          email: "Enter a valid email address.",
                        });
                      } else {
                        setErrors({ ...errors, email: "" });
                      }
                    }}
                    className={`tw-w-full tw-px-3 tw-py-2 tw-border tw-rounded-md tw-text-[#3e3e3e] tw-text-sm
  focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-1 focus:tw-ring-blue-500
  ${isEditMode ? "tw-bg-gray-100 tw-cursor-not-allowed" : ""}
  ${errors.email ? "tw-border-red-400" : "tw-border-gray-300"}`}
                  />
                  {errors.email ? (
                    <p className="tw-text-[11px] tw-text-red-500 tw-mt-1">
                      {errors.email}
                    </p>
                  ) : (
                    !isEditMode && (
                      <p className="tw-text-[10px] tw-text-gray-400 tw-mt-1">
                        Email must be unique globally
                      </p>
                    )
                  )}
                </div>
              </div>
            </section>

            {/* ── Org & Role ── */}
            {/* <section className="tw-mb-6">
              <div>
                <label className="tw-block tw-text-[14px] tw-font-normal tw-text-[#3b3b3b] tw-mb-1">
                  Role*
                </label>

                <Dropdown
                  options={roles.map((r) => r.label)}
                   width="tw-w-[380px]"
                  placeholder="Select Role"
                  disabled={isCurrentUser}
                  value={
                    roles.find((r) => String(r.value) === String(formData.role))
                      ?.label || ""
                  }
                  onChange={(label) => {
                    const selectedRole = roles.find((r) => r.label === label);
                    setFormData({ ...formData, role: selectedRole?.value });
                    setErrors({ ...errors, role: "" });
                  }}
                />

                {errors.role && (
                  <p className="tw-text-[11px] tw-text-red-500 tw-mt-1">
                    {errors.role}
                  </p>
                )}
              </div>
            </section> */}
            <section className="tw-mb-6">
  <div className="tw-grid tw-grid-cols-3 tw-gap-6">
    
    <div>
      <label className="tw-block tw-text-[14px] tw-font-normal tw-text-[#3b3b3b] tw-mb-1">
        Role <span className="tw-text-red-500">*</span>
      </label>

      <Dropdown
        options={roles.map((r) => r.label)}
        width="tw-w-full"
        placeholder="Select Role"
        disabled={isCurrentUser}
        value={
          roles.find((r) => String(r.value) === String(formData.role))?.label || ""
        }
        onChange={(label) => {
          const selectedRole = roles.find((r) => r.label === label);
          setFormData({ ...formData, role: selectedRole?.value });
          setErrors({ ...errors, role: "" });
        }}
      />

      {errors.role && (
        <p className="tw-text-[11px] tw-text-red-500 tw-mt-1">
          {errors.role}
        </p>
      )}
    </div>

    {/* keep grid alignment */}
    <div></div>
    <div></div>

  </div>
</section>

            {/* ── Password Setup ── */}
            {!isEditMode && (
              <section className="tw-mb-8">
                <h2 className="tw-text-[16px] tw-font-bold tw-text-[#101828] tw-mb-4">
                  Password Setup
                </h2>
                <div className="tw-flex tw-gap-4 tw-mb-6">
                  {[
                    {
                      mode: "activation",
                      title: "Use activation link",
                      badge: "(Recommended)",
                      desc: "User will receive an activation link to set their own password",
                    },
                    {
                      mode: "manual",
                      title: "Set password manually",
                      badge: null,
                      desc: "Set a temporary password and still send activation link",
                    },
                  ].map(({ mode, title, badge, desc }) => (
                    <div
                      key={mode}
                      onClick={() => setPasswordMode(mode)}
                      className={`tw-flex-1 tw-p-4 tw-border tw-rounded-lg tw-cursor-pointer tw-flex tw-items-start tw-gap-3 ${
                        passwordMode === mode
                          ? "tw-border-blue-500 tw-bg-blue-50"
                          : "tw-border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        readOnly
                        checked={passwordMode === mode}
                        className="tw-mt-1 tw-font-bold 
 tw-accent-[#0140c1] tw-h-4 tw-w-4"
                      />
                      <div>
                        <p className="tw-text-sm tw-font-semibold">
                          {title}{" "}
                          {badge && (
                            <span className="tw-text-green-600">{badge}</span>
                          )}
                        </p>
                        <p className="tw-text-xs tw-text-gray-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {passwordMode === "manual" && (
                  <div className="tw-grid tw-grid-cols-2 tw-gap-6">
                    {/* Password */}
                    <div>
                      <label className="tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-1">
                        Password <span className="tw-text-red-500">*</span>
                      </label>
                      <div className="tw-relative">
                        <input
                          type={showPw ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setErrors({ ...errors, password: "" });
                          }}
                          placeholder="Enter password"
                          className={`tw-w-full tw-px-3 tw-py-2 tw-pr-9 tw-border tw-rounded-md tw-text-sm     focus:tw-outline-none
    focus:tw-border-blue-500
    focus:tw-ring-1
    focus:tw-ring-blue-500 ${
      errors.password ? "tw-border-red-400" : "tw-border-gray-300"
    }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          className="tw-absolute tw-right-2 tw-top-2.5 tw-text-gray-400"
                        >
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="tw-text-[11px] tw-text-red-500 tw-mt-1">
                          {errors.password}
                        </p>
                      )}

                      {/* Strength bar */}
                      <div className="tw-flex tw-gap-1 tw-mt-2">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`tw-h-1 tw-flex-1 tw-rounded tw-transition-all tw-duration-300 ${
                              i < score ? barColor : "tw-bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      {password && (
                        <p
                          className={`tw-text-[11px] tw-mt-1 tw-font-medium ${
                            score <= 2
                              ? "tw-text-red-500"
                              : score <= 4
                                ? "tw-text-yellow-500"
                                : "tw-text-green-600"
                          }`}
                        >
                          {strengthLabel}
                        </p>
                      )}

                      {/* Checklist */}
                      <div className="tw-mt-3 tw-border tw-rounded-lg tw-p-3 tw-bg-gray-50">
                        <p className="tw-text-xs tw-font-bold tw-text-gray-700 tw-mb-2">
                          Password must contain:
                        </p>
                        <ul className="tw-space-y-1.5">
                          {rules.map((r) => {
                            const ok = r.test(password);
                            return (
                              <li
                                key={r.id}
                                className="tw-flex tw-items-center tw-gap-2"
                              >
                                {ok ? (
                                  <Check
                                    size={13}
                                    className="tw-text-green-500 tw-shrink-0"
                                    strokeWidth={3}
                                  />
                                ) : (
                                  <Circle
                                    size={13}
                                    className="tw-text-gray-300 tw-shrink-0"
                                  />
                                )}
                                <span
                                  className={`tw-text-xs ${
                                    ok
                                      ? "tw-text-green-600"
                                      : "tw-text-gray-500"
                                  }`}
                                >
                                  {r.label}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-1">
                        Confirm Password <span className="tw-text-red-500">*</span>
                      </label>
                      <div className="tw-relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={confirmPw}
                          onChange={(e) => {
                            setConfirmPw(e.target.value);
                            setErrors({ ...errors, confirmPw: "" });
                          }}
                          placeholder="Confirm Password"
                          className={`tw-w-full tw-px-3 tw-py-2 tw-pr-9 tw-border tw-rounded-md tw-text-sm     focus:tw-outline-none
    focus:tw-border-blue-500
    focus:tw-ring-1
    focus:tw-ring-blue-500${
      errors.confirmPw
        ? "tw-border-red-400"
        : confirmPw && confirmPw !== password
          ? "tw-border-red-400"
          : confirmPw && confirmPw === password
            ? "tw-border-green-400"
            : "tw-border-gray-300"
    }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="tw-absolute tw-right-2 tw-top-2.5 tw-text-gray-400"
                        >
                          {showConfirm ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                      {errors.confirmPw ? (
                        <p className="tw-text-[11px] tw-text-red-500 tw-mt-1">
                          {errors.confirmPw}
                        </p>
                      ) : confirmPw && confirmPw !== password ? (
                        <p className="tw-text-[11px] tw-text-red-500 tw-mt-1">
                          Passwords do not match
                        </p>
                      ) : confirmPw && confirmPw === password ? (
                        <p className="tw-text-[11px] tw-text-green-600 tw-mt-1">
                          Passwords match ✓
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}
              </section>
            )}
            {/* ── Activation Settings ── */}

            {/* ── Activation Settings ── */}
            {/* ── Activation Settings ── */}
            {!isEditMode && passwordMode === "activation" && (
              <section>
                <div className="tw-w-1/3">
                  <label className="tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-1">
                    Activation link expires in <span className="tw-text-red-500">*</span>
                  </label>

                  <Dropdown
                    options={["24 hrs", "48 hrs", "7 days"]}
                    placeholder="Select"
                    width="tw-w-[360px]"
                    value={formData.expiry}
                    onChange={(v) => {
                      setFormData({ ...formData, expiry: v });
                      setErrors({ ...errors, expiry: "" });
                    }}
                  />
                  {errors.expiry && (
                    <p className="tw-text-[11px] tw-text-red-500 tw-mt-1">
                      {errors.expiry}
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>
          {/* ── Footer ── */}
          <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-10">
            <button
              type="button"
              onClick={goBack}
              className="tw-px-6 tw-py-2 tw-border tw-rounded-[5px] tw-text-sm tw-font-medium tw-bg-[#dedede] hover:tw-bg-gray-200 tw-text-[#1e293b]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isFormValid()}
              className={`tw-px-8 tw-py-2 tw-rounded-md tw-text-sm tw-font-medium tw-transition-all tw-duration-200
    ${
      isFormValid()
        ? "tw-bg-blue-600 tw-text-white hover:tw-bg-blue-700 tw-cursor-pointer tw-shadow-sm"
        : "tw-bg-gray-100 tw-text-gray-400 tw-border tw-border-gray-200 tw-cursor-not-allowed"
    }`}
            >
              {isEditMode ? "Update" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
