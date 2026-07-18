import React, { useMemo, useState, useEffect } from "react";
import NavigationHeader from "../../../../genriccomponents/NavigationHeader";
import TipBox from "./TipBox";
import BidForm from "./BidForm";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import { useNavigate, useLocation, useOutletContext, useParams } from "react-router-dom";
import { useRef } from "react";
import { add_bid_data, get_trade_data, update_bid_data, detail_bid_data, get_bid_list } from "../../../../services/techus-services";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import GeneratingBid from "../RFIDrafter/Loaders/GeneratingBid";

const DETAIL_POLL_INTERVAL_MS = 500;
const DUPLICATE_BID_NAME_MESSAGE = "A bid invite with this name already exists for the project.";
const normalizeBidName = (value = "") => value.trim().replace(/\s+/g, " ").toLowerCase();

const CreateBid = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const outletContext = useOutletContext();
  const isExpanded = outletContext?.isExpanded ?? true;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const { bid_uuid } = useParams();
  const isEdit = location.state?.isEdit || false;
  const [isFetching, setIsFetching] = useState(false);

  const [formData, setFormData] = useState({
    bidName: "",
    tradeCategory: "",
    companyName: "",
    contactName: "",
    contactEmail: "",
    address: "",
  });
  const [bidId, setBidId] = useState(null);
  const bidNameInputRef = useRef(null);

  useEffect(() => {
    if (!isEdit || !bid_uuid) return;
    const fetchBidDetail = async () => {
      try {
        setIsFetching(true);
        const res = await detail_bid_data({ bid_uuid });
        if (res?.valid) {
          const d = res.data;
          console.log(d)
          setBidId(d.bid_id);
          setFormData({
            bidName: d.bid_name || "",
            tradeCategory: d.trade_category_id || "",
            companyName: d.company_name || "",
            contactName: d.contact_name || "",
            contactEmail: d.contact_email || "",
            address: d.address || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch bid detail", err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchBidDetail();
  }, [bid_uuid, isEdit]);

  const requiredFields = ["bidName", "tradeCategory", "companyName"];
  const [tradeOptions, setTradeOptions] = useState([]);
  const [formErrors, setFormErrors] = useState({});
const isFormValid = useMemo(() => {
  return requiredFields.every((field) => {
    const value = formData[field];
    return value && value.toString().trim().length >= (field === "tradeCategory" ? 1 : 3);
  });
}, [formData]);
  const staticData = useMemo(
    () => [
      {
        title: "Bid Information",
        icon: "icon-Document",
        forms: [
          {
            type: "text",
            style: "bidForm",
            label: "Bid Name",
            name: "bidName",
            required: true,
            description: "A descriptive name for this bid invitation",
            placeholder: "e.g., Main Building Flooring Package",
          },
          {
            type: "select",
            style: "bidForm",
            label: "Trade Category * ",
            options: tradeOptions,
            required: true,
            name: "tradeCategory",
            description: "Select the trade scope for this bid",
            placeholder: "Select a trade category",
          },
        ],
      },
      {
        title: "Recipient Information",
        icon: "icon-Concrete",
        forms: [
          {
            type: "text",
            style: "bidForm",
            label: "Company Name",
            name: "companyName",
            required: true,
            description: null,
            placeholder: "e.g., Premium Floors Inc.",
          },
          {
            type: "text",
            style: "bidForm",
            label: "Contact Name",
            name: "contactName",
            required: false,
            description: null,
            placeholder: "e.g., John Smith",
          },
          {
            type: "text",
            style: "bidForm",
            label: "Contact Email",
            name: "contactEmail",
            required: false,
            description: null,
            placeholder: "e.g., john.smith@company.com",
          },
          {
            type: "text",
            style: "bidForm",
            label: "Address",
            required: false,
            name: "address",
            description: null,
            placeholder: "e.g., 123 Industrial Blvd, Chicago, IL 60601",
          },
        ],
      },
    ],
    [tradeOptions],
  );

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await get_trade_data();
        if (res?.valid) {
          const formatted = res.data.map((item) => ({
            label: item.display_name,
            value: item.id,
          }));
          setTradeOptions(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch trades", err);
      }
    };
    fetchTrades();
  }, []);

  const handleInputChange = (name, value) => {
    const normalizedValue = value.replace(/^\s+/, "").replace(/\s{2,}/g, " ");
    setFormData((prev) => ({ ...prev, [name]: normalizedValue }));
    const errors = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, ...errors }));
  };



  const validateField = (name, value) => {
    let error = {};
    value = value.trim();
    switch (name) {
      case "bidName":
        if (!value) error[name] = "Bid Name is required.";
        else if (value.length < 3) error[name] = "Bid Name must contain at least 3 characters.";
        else error[name] = "";
        break;
      case "tradeCategory":
        if (!value) error[name] = "Trade Category is required.";
        else error[name] = "";
        break;
      case "companyName":
        if (!value) error[name] = "Company Name is required.";
        else if (value.length < 3) error[name] = "Company Name must contain at least 3 characters.";
        else error[name] = "";
        break;
      case "contactName":
        if (value && value.length < 3) error[name] = "Contact Name must contain at least 3 characters.";
        else error[name] = "";
        break;
      case "contactEmail":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error[name] = "Please enter a valid email address.";
        } else {
          error[name] = "";
        }
        break;
    }
    return error;
  };

  const projectId = localStorage.getItem("project_id");
  const organizationId = localStorage.getItem("organization_id");
  const projectUId = localStorage.getItem("project_uuid");

  const focusBidNameField = () => {
    setTimeout(() => {
      bidNameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      bidNameInputRef.current?.focus();
    }, 50);
  };

  const setDuplicateBidNameError = (message = DUPLICATE_BID_NAME_MESSAGE) => {
    setFormErrors((prev) => ({ ...prev, bidName: message }));
    focusBidNameField();
  };

  const isDuplicateNameMessage = (message = "") => /already exists/i.test(message);

  const checkDuplicateBidName = async (nameToCheck) => {
    if (!projectId || !nameToCheck) return false;

    try {
      const res = await get_bid_list({ project_id: projectId });
      if (!res?.valid || !Array.isArray(res?.data)) {
        return false;
      }

      const normalizedTargetName = normalizeBidName(nameToCheck);

      return res.data.some((item) => {
        const isSameName = normalizeBidName(item?.bid_name) === normalizedTargetName;
        const isCurrentBid =
          (bidId && item?.bid_id === bidId) ||
          (bid_uuid && item?.bid_uuid === bid_uuid);

        return isSameName && !isCurrentBid;
      });
    } catch (error) {
      console.error("Failed to validate duplicate bid name:", error);
      return false;
    }
  };

  const handleSubmit = async () => {
    let errors = {};
    let hasError = false;
    requiredFields.forEach((field) => {
      const fieldErrors = validateField(field, formData[field] || "");
      if (fieldErrors[field]) hasError = true;
      errors = { ...errors, ...fieldErrors };
    });
    setFormErrors(errors);
    if (hasError) return;

    const trimmedBidName = formData.bidName.trim();
    const duplicateNameExists = await checkDuplicateBidName(trimmedBidName);
    if (duplicateNameExists) {
      setDuplicateBidNameError();
      return;
    }

    const basePayload = {
      bid_name: trimmedBidName,
      trade_category_id: formData.tradeCategory,
      project_id: projectId,
      organization_id: organizationId,
      company_name: formData.companyName.trim(),
      contact_name: formData.contactName.trim(),
      contact_email: formData.contactEmail.trim(),
      address: formData.address.trim(),
    };

    let navigating = false;
    let progressInterval = null;

    const stopProgressAnimation = () => {
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
    };

    const startProgressAnimation = () => {
      setGenerationProgress(0);

      progressInterval = setInterval(() => {
        setGenerationProgress((prevProgress) => {
          if (prevProgress >= 90) {
            return prevProgress;
          }

          if (prevProgress < 30) return prevProgress + 1;
          if (prevProgress < 60) return prevProgress + 0.6;
          return prevProgress + 0.3;
        });
      }, 180);
    };

    const completeProgressAnimation = () =>
      new Promise((resolve) => {
        stopProgressAnimation();

        progressInterval = setInterval(() => {
          let shouldResolve = false;

          setGenerationProgress((prevProgress) => {
            const remaining = 100 - prevProgress;

            if (remaining <= 0) {
              shouldResolve = true;
              return 100;
            }

            const nextProgress = Math.min(
              100,
              prevProgress + Math.max(remaining * 0.35, 2)
            );

            if (nextProgress >= 100) {
              shouldResolve = true;
            }

            return nextProgress;
          });

          if (shouldResolve) {
            stopProgressAnimation();
            resolve();
          }
        }, 40);
      });

    try {
      setIsSubmitting(true);
      startProgressAnimation();
      let successMessage = "";
      let res;
      if (isEdit && bidId) {
        res = await update_bid_data({ ...basePayload, bid_id: bidId });
        console.log(res)
        if (res?.valid) successMessage = res?.message;
        else if (isDuplicateNameMessage(res?.message)) {
          setDuplicateBidNameError(res?.message || DUPLICATE_BID_NAME_MESSAGE);
          return;
        } else showToast("error", res?.message);
      } else {
        res = await add_bid_data(basePayload);
        console.log(res);
        if (res?.valid) successMessage = res?.message;
        else if (isDuplicateNameMessage(res?.message)) {
          setDuplicateBidNameError(res?.message || DUPLICATE_BID_NAME_MESSAGE);
          return;
        } else showToast("error", res?.message);
      }
      if (res?.valid && isEdit) {
        let fullBidData = res?.data || res;
        if (bid_uuid) {
          try {
            for (let attempt = 0; attempt < 45; attempt += 1) {
              const detailRes = await detail_bid_data({ bid_uuid });
              const hasContent = !!detailRes?.data?.response_text || !!detailRes?.data?.content_text;
              if (detailRes?.valid && hasContent) {
                fullBidData = detailRes.data
                  ? { ...detailRes.data, data: detailRes.data }
                  : detailRes;
                break;
              }
              await new Promise((resolve) => setTimeout(resolve, DETAIL_POLL_INTERVAL_MS));
            }
          } catch (err) {
            console.error("Failed to fetch bid detail after update:", err);
          }
        }
        await completeProgressAnimation();
        if (successMessage) showToast("success", successMessage);
        navigating = true;
        setTimeout(() => {
          navigate(
            `/project/view/${projectUId}/contract-command/bid-invites/${bid_uuid || bidId}/bid-invite-company`,
            { state: { bidData: fullBidData, detail: formData, bid_id: bidId, isEdit: true } }
          );
        }, 500);
      } else if (res?.valid) {
        const createdBidUuid =
          res?.data?.bid_uuid ??
          res?.bid_uuid ??
          res?.data?.data?.bid_uuid;

        if (!createdBidUuid) {
          throw new Error("Bid UUID not found.");
        }

        try {
          let completedBidDetail = null;

          for (let attempt = 0; attempt < 45; attempt += 1) {
            const detailRes = await detail_bid_data({ bid_uuid: createdBidUuid });
            const hasGeneratedContent =
              !!detailRes?.data?.response_text || !!detailRes?.data?.content_text;

            if (detailRes?.valid && hasGeneratedContent) {
              completedBidDetail = detailRes;
              break;
            }

            await new Promise((resolve) => setTimeout(resolve, DETAIL_POLL_INTERVAL_MS));
          }

          if (!completedBidDetail) {
            throw new Error("Bid invite generation is taking longer than expected. Please try again.");
          }

          await completeProgressAnimation();
          if (successMessage) showToast("success", successMessage);
          navigating = true;

          setTimeout(() => {
            navigate(
              `/project/view/${projectUId}/contract-command/bid-invites/${createdBidUuid}/bid-invite-company`,
              {
                state: {
                  bidData: completedBidDetail.data
                    ? { ...completedBidDetail.data, data: completedBidDetail.data }
                    : completedBidDetail,
                  detail: formData,
                  bid_id: completedBidDetail?.data?.bid_id ?? bidId,
                },
              }
            );
          }, 500);
        } catch (pollErr) {
          stopProgressAnimation();
          throw pollErr;
        }
      }
    } catch (error) {
      stopProgressAnimation();
      console.error("Failed to save Bid:", error);
      if (isDuplicateNameMessage(error?.message)) {
        setDuplicateBidNameError(error?.message || DUPLICATE_BID_NAME_MESSAGE);
        return;
      }
      showToast("error", "Something went wrong. Please try again.");
    } finally {
      stopProgressAnimation();
      if (!navigating) {
        setIsSubmitting(false);
        setGenerationProgress(0);
      }
    }
  };

  return (
    <div className="tw-pr-4 tw-flex tw-flex-col tw-gap-6">
      {isFetching && <FullPageLoader />}

      {isSubmitting && (
        <div
          className="tw-fixed tw-inset-0 tw-z-[9999] tw-transition-all tw-duration-300 tw-ease-in-out"
          style={{
            top: "60px",
            left: isExpanded ? "225px" : "60px",
            right: 0,
            bottom: 0,
          }}
        >
          <GeneratingBid progress={generationProgress} />
        </div>
      )}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover />
      <NavigationHeader
        title="Contract Command /"
        subTitle={isEdit ? "Edit Bid" : "Create New Bid"}
        navigation={`/project/view/${projectUId}/contract-command/bid-invites`}
      />
      <div className="tw-pl-[1rem] tw-flex tw-flex-col tw-gap-[30px]">
        <TipBox />
        <div className="tw-grid tw-grid-cols-2 tw-gap-x-[20px] tw-justify-between">
          {staticData &&
            staticData.map((d, i) => (
              <BidForm
                key={i}
                data={d}
                handleInputChange={handleInputChange}
                formErrors={formErrors}
                formData={formData}
                tradeOptions={tradeOptions}
                bidNameInputRef={bidNameInputRef}
              />
            ))}
          <div></div>
        </div>
      </div>

      <div className="button tw-flex tw-flex-row-reverse">
       <button
  disabled={isSubmitting || !isFormValid}

className="group tw-min-w-[11.188rem] tw-border tw-bg-[#0140c1] tw-text-[#fff] tw-font-[500] tw-py-[10px] tw-rounded-[5px] tw-flex tw-items-center tw-justify-center tw-gap-2 tw-px-4 tw-whitespace-nowrap
  tw-transition-all tw-duration-300 tw-ease-in-out
  hover:tw-bg-[#1b44c4] hover:tw-shadow-lg hover:tw-shadow-blue-200/50
  hover:tw-scale-[1.03] hover:-tw-translate-y-[1px]
  active:tw-scale-[0.98]
  disabled:tw-opacity-50 disabled:tw-cursor-not-allowed disabled:tw-scale-100 disabled:tw-translate-y-0 disabled:tw-shadow-none"
  onClick={handleSubmit}
>
          <i className="icon-AI-fill tw-text-[22px]"></i>
          <span>{isSubmitting ? "Submitting..." : isEdit ? "Update Bid" : "AI Draft Bid Invite"}</span>
        </button>
      </div>
    </div>
  );
};

export default CreateBid;
