import React, { useState, useEffect, useMemo } from "react";
import NavigationHeader from "../../../../genriccomponents/NavigationHeader";
import FormLayout from "./FormLayout";
import {
  GetPackageList,
  GetOneOrganization,
  GetOnePackage,
  AddOrganizationDetails,
  UpdateOrganization,
  GetIndustryAndCompanySize,
} from "../../../../services/techus-services";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import { useNavigate, useParams } from "react-router-dom";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import {
  formatPhoneNumber,
  generateStartAndEndDate,
} from "../../../../utils/commonUtils";

import PackageDetailsModal from "../../Packages/PackageDetailsModal";
import DeleteModal from "../../../../genriccomponents/DeleteModal";

const AddOrganization = () => {
  const [packageDetails, setPackageDetails] = useState([]);
  const [packageLoading, setPackageLoading] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [originalPackageData, setOriginalPackageData] = useState({
  package_id: "",
  applies_to: "",
});
  const { id } = useParams();
  // const organizationId = searchParams.get("id");
  const organizationId = id;
  const [packageModal, setPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [, setAllowedPermission] = useState([]);
  const [companyOptions, setCompanyOptions] = useState({});

  const [formData, setFormData] = useState({
    organization_name: "",
    address: "",
    first_name: "",
    last_name: "",
    email_id: "",
    mobile_number: "",
    description: "",
    package_id: "",
    // discount_type: "",
    company_size_id: "",
    industry_id: "",
    website_url: "",
    // discount_value: "",
    applies_to: "ANNUALLY",
    // start_date: defaultDates.start_date || "",
    // end_date: defaultDates.end_date || "",
    // discount_notes: "",
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const fieldDatas = {
    basicInformation: [
      {
        label: "Organization Name",
        type: "text",
        required: true,
        name: "organization_name",
        placeholder: "Enter organization name",
        style: "org",
        capitalize: true,
      },
      {
        label: "Address",
        required: false,
        type: "text",
        name: "address",
        placeholder: "Enter address",
        style: "org",
        capitalize: true,
      },
      {
        label: "Industry",
        required: false,
        type: "select",
        name: "industry_id",
        placeholder: "Select Industry",
        style: "org",
        capitalize: false,
      },
      {
        label: "Company Size",
        required: false,
        type: "select",
        name: "company_size_id",
        placeholder: "Select Company Size",
        style: "org",
        capitalize: false,
      },
      {
        label: "Website",
        required: false,
        type: "text",
        name: "website_url",
        placeholder: "Enter Company Website",
        style: "org",
        capitalize: false,
      },
    ],
    contactInformation: [
      {
        label: "First Name",
        type: "text",
        name: "first_name",
        required: true,
        placeholder: "Enter first name",
        style: "org",
        capitalize: true,
      },
      {
        label: "Last Name",
        required: true,
        type: "text",
        name: "last_name",
        placeholder: "Enter last name",
        style: "org",
        capitalize: true,
      },
      {
        label: "Contact Email",
        required: true,
        type: "text",
        name: "email_id",
        placeholder: "example@domain.com",
        style: "org",
        capitalize: false,
      },
      {
        label: "Contact Phone",
        required: false,
        type: "text",
        name: "mobile_number",
        placeholder: "+1 (555) 123-4567",
        style: "org",
        capitalize: false,
      },
    ],
    packageInformation: [
      {
        label: "Package",
        required: true,
        type: "select",
        name: "package_id",
        placeholder: "Select Package",
        style: "org",
        capitalize: true,
      },
    ],
  };

  const pricingFields = [
    "discount_type",
    "discount_value",
    "applies_to",
    "start_date",
    "end_date",
  ];
  const validateForm = () => {
    const newErrors = {};
    const pricingStarted = !!formData.discount_type;

    Object.keys(validationRules).forEach((field) => {
      const rule = validationRules[field];
      const v = (formData[field] ?? "").toString().trim();

      if (!pricingStarted && pricingFields.includes(field)) return;

      if (rule.required && !v) {
        newErrors[field] = `${rule.label} is required`;
        return;
      }

      if (!rule.required && !v) return;

      if (rule.min && v.length < rule.min) {
        newErrors[field] =
          `${rule.label} must contain at least ${rule.min} characters.`;
        return;
      }

      if (rule.max && v.length > rule.max) {
        newErrors[field] = `${rule.label} cannot exceed ${rule.max} characters.`;
        return;
      }
      if (formData.start_date && formData.end_date) {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);

        if (startDate > endDate) {
          newErrors.start_date = "Start Date cannot be after End Date.";
          newErrors.end_date = "End Date cannot be before Start Date.";
        }
      }

      if (rule.pattern && !rule.pattern.test(v)) {
        if (field === "email_id") {
          newErrors[field] = "Please enter a valid email address.";
        } else if (field === "mobile_number") {
          newErrors[field] = "Mobile Number must contain 10-15 digits.";
        } else {
          newErrors[field] = `${rule.label} is invalid.`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const discountPlaceholder = useMemo(() => {
    if (!formData.discount_type) return "Enter discount";

    if (formData.discount_type === "PERCENT") {
      return "0 - 100 %";
    }
    //
    //
    if (formData.discount_type === "FIXED") {
      const pkg = packageDetails.find(
        (p) => p.package_id === formData.package_id,
      );

      if (!pkg) return "Enter amount";

      if (formData.applies_to === "MONTHLY") {
        return `Maximum Discount Price $${pkg.pricing_monthly}`;
      }

    if (formData.applies_to === "ANNUALLY") {  
  return `Maximum Discount Price $${pkg.pricing_annual}`;
}

      return "Enter Discount value";
    }
  }, [
    formData.discount_type,
    formData.applies_to,
    formData.package_id,
    packageDetails,
  ]);

  const validationRules = {
    organization_name: {
      required: true,
      min: 3,
      max: 100,
      label: "Organization Name",
    },

    address: {
      required: false,
      min: 3,
      max: 200,
      label: "Address",
    },

    first_name: {
      required: true,
      min: 3,
      max: 50,
      label: "First Name",
    },

    last_name: {
      required: true,
      min: 1,
      max: 50,
      label: "Last Name",
    },
    website_url: {
      required: false,
      label: "Website",
      pattern: /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/,
    },

    email_id: {
      required: true,
      label: "Contact Email",
      pattern:
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[A-Za-z]{2,}$/,
    },

    mobile_number: {
      required: false,
      label: "Mobile Number",
    },

    package_id: {
      required: true,
      label: "Package",
    },
    description: {
      required: false,
      min: 5,
      max: 500,
      label: "Description",
    },
    applies_to: {
      required: true,
      label: "Applies To",
    },
  };

  const fetchPackageDetails = async () => {
    try {
      setPackageLoading(true);
      const response = await GetPackageList();
      const parsed = await JSON.parse(response);
      setPackageDetails(parsed?.data);
    } catch (err) {
      console.error(err);
    } finally {
      setPackageLoading(false);
    }
  };

  const fetchOrganization = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const res = await GetOneOrganization({
        organization_uuid: organizationId,
      });

      if (res?.valid) {
        const org = res.data;

        setFormData((prev) => ({
          ...prev,
          organization_name: org.organization_name || "",
          address: org.address || "",
          first_name: org.first_name || "",
          last_name: org.last_name || "",
          email_id: org.email_id || "",
          mobile_number: org.mobile_number
            ? formatPhoneNumber(org.mobile_number.replace(/\D/g, ""))
            : "",
          description: org.description || "",
          fax: org.fax || "",
          role_id: org.role_id || "",
          package_id: org.package_id || "",
          applies_to: org.subscription_applies_to  || "",
          company_size_id: org.company_size_id || "",
          website_url: org.website_url || "",
          industry_id: org.industry_id || "",
        }));
             setOriginalPackageData({
  package_id: org.package_id || "",
  applies_to: org.subscription_applies_to || "",
});
      }
 
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const filterSelectedFeatures = (data) => {
    return data.features
      .filter((feature) => feature.selected === true)
      .map((feature) => ({
        ...feature,
        children: feature.children.filter((child) => child.selected === true),
      }))
      .filter((feature) => feature.children.length > 0);
  };

  const packageOptions = useMemo(() => {
    if (!packageDetails) return [];
    return packageDetails.map((d) => ({
      label: d.name,
      value: d.package_id,
    }));
  }, [packageDetails]);

  const industryOptions = useMemo(() => {
    if (!companyOptions?.industries) return [];
    return companyOptions.industries.map((i) => ({
      label: i.name,
      value: i.id,
    }));
  }, [companyOptions]);

  const companySizeOptions = useMemo(() => {
    if (!companyOptions?.company_sizes) return [];
    return companyOptions.company_sizes.map((c) => ({
      label: c.name,
      value: c.id,
    }));
  }, [companyOptions]);

  const discountOptions = ["Percentage (%)", "Fixed ($)"];
  const handleViewPackage = async () => {
    try {
      setPackageModal(true);
      if (!formData.package_id) return;

      const packageUUID = packageDetails.find(
        (pkg) => pkg.package_id === formData.package_id,
      )?.package_uuid;
      setPackageLoading(true);
      const response = await GetOnePackage({
        package_uuid: packageUUID,
      });

      const parsed =
        typeof response === "string" ? JSON.parse(response) : response;

      if (parsed?.valid) {
        setSelectedPackage(parsed.data, formData.package_id);
        const selectedFeatures = filterSelectedFeatures(parsed.data);
        setAllowedPermission(selectedFeatures);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPackageLoading(false);
    }
  };
  const handleChange = (name, value) => {
    let updatedValue = value;
    if (name === "mobile_number") {
      const digits = value.replace(/\D/g, "");

      if (digits.length > 15) return;

      // format first 10 digits as US phone
      const formatted =
        digits.length <= 10
          ? formatPhoneNumber(digits)
          : `${formatPhoneNumber(digits.slice(0, 10))} ${digits.slice(10)}`;

      updatedValue = formatted;
    }
    if (name === "applies_to") {
      const dates = generateStartAndEndDate(updatedValue);
      setFormData((prev) => ({
        ...prev,
        applies_to: value,
        start_date: dates.start_date,
        end_date: dates.end_date,
      }));

      return;
    }

    const updatedForm = {
      ...formData,
      [name]: updatedValue,
    };

    setFormData(updatedForm);

    validateField(name, updatedValue);
  };
  const validateField = (name, value) => {
    const rule = validationRules[name];
    if (!rule) return;

    const packageSelected = !!formData.package_id;

    if (!packageSelected && pricingFields.includes(name)) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }

    const v = (value ?? "").toString().trim();
    let msg = "";

    if (rule.required && !v) {
      msg = `${rule.label} is required`;
    }

    if (!rule.required && !v) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }

    if (!msg && rule.min && v.length < rule.min) {
      msg = `${rule.label} must contain at least ${rule.min} characters.`;
    }
    if (name === "start_date" || name === "end_date") {
      const start = name === "start_date" ? value : formData.start_date;
      const end = name === "end_date" ? value : formData.end_date;

      if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (startDate > endDate) {
          if (name === "start_date") {
            msg = "Start Date cannot be after End Date.";
          }

          if (name === "end_date") {
            msg = "End Date cannot be before Start Date.";
          }
        }
      }
    }
    if (name === "mobile_number") {
      const digits = v.replace(/\D/g, "");

      if (digits.length < 10 || digits.length > 15) {
        msg = "Mobile Number must contain 10-15 digits.";
      }
    }
    if (name === "discount_value") {
      const value = Number(v);

      if (formData.discount_type === "PERCENT") {
        if (value > 100) {
          msg = "Percentage discount cannot exceed 100%";
        }
      }

      if (formData.discount_type === "FIXED") {
        const pkg = packageDetails.find(
          (p) => p.package_id === formData.package_id,
        );

        let maxPrice = 0;

        if (formData.applies_to === "MONTHLY") {
          maxPrice = pkg?.pricing_monthly || 0;
        }

        if (formData.applies_to === "ANNUALLY") { 
  maxPrice = pkg?.pricing_annual || 0;
}

        if (value > maxPrice) {
          msg = `Discount cannot exceed $${maxPrice}`;
        }
      }
    }

    if (!msg && rule.max && v.length > rule.max) {
      msg = `${rule.label} cannot exceed ${rule.max} characters.`;
    }

    if (!msg && rule.pattern && !rule.pattern.test(v)) {
      if (name === "email_id") {
        msg = "Please enter a valid email address.";
      } else if (name === "mobile_number") {
        msg = "Mobile Number must contain 10-15 digits.";
      } else {
        msg = `${rule.label} is invalid`;
      }
    }

    setErrors((prev) => ({
      ...prev,
      [name]: msg,
    }));
  };

 const handleSubmit = async () => {
  if (!validateForm()) return;

  // In edit mode, check if package or applies_to changed
  if (organizationId) {
    const packageChanged = formData.package_id !== originalPackageData.package_id;
    const appliesToChanged = formData.applies_to !== originalPackageData.applies_to;

    if (packageChanged || appliesToChanged) {
      setShowUpdateModal(true); // show confirmation modal first
      return;
    }
  }

  await submitForm();
};

const submitForm = async () => {
  try {
    setLoading(true);
    const payload = {
      ...formData,
      mobile_number: formData.mobile_number
        ? formData.mobile_number.replace(/\D/g, "")
        : "",
    };

    if (organizationId) {
      const packageChanged = formData.package_id !== originalPackageData.package_id;
      const appliesToChanged = formData.applies_to !== originalPackageData.applies_to;
      if (packageChanged || appliesToChanged) {
        payload.update_package = true;
      }
    }
console.log(payload)
    let res;
    if (organizationId) {
      res = await UpdateOrganization({
        organization_uuid: organizationId,
        ...payload,
      });
    } else {
      res = await AddOrganizationDetails(payload);
    }

    if (res?.valid) {
      showToast("success", res.message);
      navigate("/admin/organizations", { state: { refresh: true } });
    } else {
      showToast("error", res.message);
    }
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};
const fetchIndustryAndCompanySizeData = async () => {
    const response = await GetIndustryAndCompanySize();
    setCompanyOptions(response?.data);
  };

  useEffect(() => {
    fetchPackageDetails();
    fetchIndustryAndCompanySizeData();
    fetchOrganization();
  }, []);

  useEffect(() => {
    if (packageModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [packageModal]);
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[A-Za-z]{2,}$/;

  const isFormValid = () => {
    return (
      formData.organization_name?.trim().length >= 3 &&
      formData.first_name?.trim().length >= 3 &&
      formData.last_name?.trim().length >= 1 &&
      formData.email_id?.trim() &&
      emailRegex.test(formData.email_id) &&
      formData.package_id &&
      Object.keys(errors).every((key) => !errors[key])
    );
  };

  return (
    <div>
      {loading && <FullPageLoader />}
      <NavigationHeader
        title="Organizations /"
        subTitle={
          organizationId ? "Update Organization" : "Create Organization"
        }
        navigation="/admin/organizations"
      />
      <div className="tw-pt-[30px]">
        {/* <FormLayout fieldDatas={fieldDatas} packageOptions={packageOptions} discountOptions={discountOptions}/>
         */}
        <FormLayout
          fieldDatas={fieldDatas}
        setPackageModal={setPackageModal}
          packageOptions={packageOptions}
          discountOptions={discountOptions}
          isEdit={organizationId ? true : false}
          formData={formData}
          onChange={handleChange}
          onViewPackage={handleViewPackage}
          errors={errors}
          discountPlaceholder={discountPlaceholder}
          industryOptions={industryOptions}
          companySizeOptions={companySizeOptions}
        />
      </div>
      <div className="buttons tw-flex tw-flex-row-reverse tw-gap-4 tw-pt-6">
        <button
         disabled={!isFormValid()}
          className={`tw-rounded-[5px] tw-w-[201px] tw-py-[12px] tw-text-sm tw-font-medium tw-transition-all tw-duration-200
    ${
      isFormValid()
        ? "tw-bg-[#0140c1] tw-text-white hover:tw-opacity-90 tw-cursor-pointer tw-shadow-sm"
        : "tw-bg-gray-100 tw-text-gray-400 tw-border tw-border-gray-200 tw-cursor-not-allowed"
    }`}
          onClick={handleSubmit}
        >
          Save Organization
        </button>
        <button
          className="tw-rounded-[5px] tw-w-[114px] tw-py-[12px] tw-bg-[#dedede]"
          onClick={() => navigate("/admin/organizations")}
        >
          Cancel
        </button>
      </div>

      {packageModal && (
  <PackageDetailsModal
    packageData={selectedPackage}
    isLoading={packageLoading}
    onClose={() => setPackageModal(false)}
  />
)}

{showUpdateModal && (
  <DeleteModal
    action="update"
    entity="organization"
    icon="icon-Organization"
    onClose={() => setShowUpdateModal(false)}
    onConfirm={() => {
      setShowUpdateModal(false);
      submitForm();
    }}
  />
)}
    </div>
  );
};

export default AddOrganization;
