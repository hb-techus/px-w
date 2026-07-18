import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsCards from './StatsCard';
import FormSections from './FormSection';
import { useROI } from './ROIContext';
import FullPageLoader from '../../../../genriccomponents/loaders/FullPageLoader';
import usePermissions from '../../../Common/usePermissions';

const isFormComplete = (data) =>
  Object.values(data).every((v) => String(v).trim() !== "");

const ROICalculator = () => {
  const navigate = useNavigate();
  const project_uuid = localStorage.getItem("project_uuid");
  const { formData, setFormData } = useROI();
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const { permissions, packagePermissions } = usePermissions('roi_calculator');
  const allFilled = isFormComplete(formData);
  const canExecute = permissions?.execute !== false;

  const handleCalculate = () => {
    if (!allFilled) return;
    setIsCalculating(true);
    setTimeout(() => {
      navigate(`/project/view/${project_uuid}/roi-calculator/dashboard`);
    }, 800);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  void packagePermissions;

  return (
    <div className="tw-min-h-screen">
      {(isLoading || isCalculating) && <FullPageLoader />}

      <div className="tw-mx-auto">
        <div className="tw-flex tw-justify-between tw-items-start tw-mb-8">
          <div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-text-[19px] tw-font-bold tw-text-gray-900">ROI Calculator</span>
            </div>
            <p className="tw-text-[#1e293b] tw-text-[13px]">Estimate your ROI by modeling time savings, cost reductions, and revenue impact from using AI-powered preconstruction.</p>
          </div>
          {permissions?.execute && (
            <button
              onClick={handleCalculate}
              disabled={!allFilled || isCalculating}
              title={!allFilled ? "Please fill in all fields to calculate ROI" : ""}
              className={[
                "tw-px-5 tw-py-2.5 tw-rounded-[5px] tw-font-[500] tw-flex tw-items-center tw-gap-2 tw-transition-all tw-duration-200",
                allFilled && !isCalculating
                  ? "tw-bg-[#0140c1] hover:tw-bg-blue-700 tw-text-white tw-cursor-pointer"
                  : "tw-bg-gray-200 tw-text-gray-400 tw-cursor-not-allowed",
              ].join(" ")}
            >
              <i className="icon-calculator tw-text-[19px]"></i>
              {isCalculating ? "Calculating..." : "Calculate ROI"}
            </button>
          )}
        </div>

        <StatsCards />
        <FormSections
          formData={formData}
          setFormData={setFormData}
          canExecute={canExecute}
        />
      </div>
    </div>
  );
};

export default ROICalculator;