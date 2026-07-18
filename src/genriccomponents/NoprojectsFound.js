import React from "react";
import { useNavigate } from "react-router-dom";
import constructionImg from "../assets/Images/no_data_images/Create-Project-img.webp"; // <-- update path to your image

const NoProjectsFound = ({ onCreateClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onCreateClick) {
      onCreateClick();
    } else {
      navigate("/projects/create");
    }
  };

  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-w-full tw-mt-16 tw-font-inter">
      <div className="tw-bg-white tw-rounded-md tw-shadow-sm tw-border tw-border-[#e0e0e0] tw-w-full tw-max-w-[1094px] tw-px-8 tw-py-10">
        <div className="tw-flex tw-items-center tw-gap-12">

          {/* LEFT - Image with decorative dots */}
          <div className="tw-relative tw-flex-shrink-0 tw-w-[440px]">
            {/* Main Image */}
            <img
              src={constructionImg}
              alt="No Projects"
              className="tw-relative tw-z-10 tw-w-full tw-rounded-2xl tw-object-cover"
            />
          </div>

          {/* RIGHT - Text + CTA */}
          <div className="tw-flex tw-flex-col tw-gap-5">
            <div>
              <h2 className="tw-text-xl tw-font-bold tw-text-gray-900 tw-mb-3">
                Welcome to PrexoAI
              </h2>
              <p className="tw-text-[#555] tw-text-sm tw-max-w-[410px]">
                Strategic pre-construction is the heartbeat of every successful build.
                We harmonize design with budget, ensuring every risk is managed and
                every detail is optimized before the first shovel hits.
              </p>
            </div>

            <button
              onClick={handleClick}
              className="tw-bg-[#0140c1] hover:tw-bg-blue-700 tw-text-white tw-text-sm tw-px-8 tw-py-3 tw-rounded-md tw-transition-all tw-duration-200 tw-w-72"
            >
              Create Your First Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoProjectsFound;