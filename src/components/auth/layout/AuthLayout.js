import React from "react";
import { Outlet } from "react-router-dom";
import leftImg from "../../../assets/Images/login_assets/Sign-in-image.webp";
import { motion } from "framer-motion";

// Feature card images
import DocumentIcon from "../../../assets/Images/login_assets/img-1.webp";
import PlanningIcon from "../../../assets/Images/login_assets/img-2.webp";
import InsightsIcon from "../../../assets/Images/login_assets/img-3.webp";

const AuthLayout = () => {
  return (
    <motion.div
      className="tw-min-h-screen tw-flex tw-overflow-hidden tw-bg-white tw-font-inter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* LEFT SECTION - WITH BACKGROUND IMAGE */}
      <motion.div
        className="tw-hidden lg:tw-flex lg:tw-w-1/2 tw-bg-cover tw-bg-center tw-relative"
        style={{ backgroundImage: `url(${leftImg})` }}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Dark Overlay */}
        <div className="tw-absolute tw-inset-0" />

        {/* Content Container */}
        <motion.div
          className="tw-relative tw-z-10 tw-flex tw-flex-col tw-w-full tw-h-full tw-px-12 tw-py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* TOP SECTION - Logo & Tagline */}
            <motion.div
            className="tw-space-y-2 tw-pt-4 tw-pl-4 "
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="tw-text-3xl tw-text-[#fff] tw-font-semibold tw-tracking-wider">
              PrexoAI
            </h1>
            <p className="tw-text-blue-100 tw-text-md tw-font-light !tw-m-0">
              Pre-Construction Intelligence Platform
            </p>
          </motion.div>

          {/* MIDDLE SECTION - Description Below */}
          <motion.div
            className="tw-mt-[90px] tw-pl-4 tw-space-y-8"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Description Text */}
            <p className="tw-text-blue-100 tw-text-base tw-leading-relaxed tw-max-w-[540px] tw-font-light">
              Advanced AI-powered document analysis and pre-construction insights to streamline your project planning and execution.
            </p>

            {/* Feature Cards */}
            <div className="tw-space-y-4">
              {/* Card 1 - Document Analysis */}
              <div className="tw-flex tw-gap-4">
                <div className="tw-w-14 tw-h-14 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0s">
                  <img 
                    src={DocumentIcon} 
                    alt="Document Analysis" 
                    className="tw-w-16 tw-h-[45px] tw-object-contain" 
                  />
                </div>
                <div className="tw-flex-1">
                  <h3 className="tw-text-white tw-font-semibold tw-text-base tw-mt-1">
                    Document Analysis
                  </h3>
                  <p className="tw-text-blue-100 tw-text-[13px] tw-mt-1 tw-font-light">
                    Intelligent extraction and analysis of construction documents
                  </p>
                </div>
              </div>

              {/* Card 2 - Pre-Construction Planning */}
              <div className="tw-flex tw-gap-4">
                <div className="tw-w-14 tw-h-14 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 ">
                  <img 
                    src={PlanningIcon} 
                    alt="Pre-Construction Planning" 
                    className="tw-w-16 tw-h-[45px] tw-object-contain" 
                  />
                </div>
                <div className="tw-flex-1">
                  <h3 className="tw-text-white tw-font-semibold tw-text-base tw-mt-1">
                    Pre-Construction Planning
                  </h3>
                  <p className="tw-text-blue-100 tw-text-[13px] tw-mt-1 tw-font-light">
                    Optimize project timelines and resource allocation
                  </p>
                </div>
              </div>

              {/* Card 3 - Project Insights */}
              <div className="tw-flex tw-gap-4">
                <div className="tw-w-14 tw-h-14 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <img 
                    src={InsightsIcon} 
                    alt="Project Insights" 
                    className="tw-w-16 tw-h-[45px] tw-object-contain" 
                  />
                </div>
                <div className="tw-flex-1">
                  <h3 className="tw-text-white tw-font-semibold tw-text-base tw-mt-1">
                    Project Insights
                  </h3>
                  <p className="tw-text-blue-100 tw-text-[13px] tw-mt-1 tw-font-light">
                    Real-time analytics and risk assessment
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </motion.div>

      {/* RIGHT SECTION - LOGIN FORM */}
      <motion.div
        className="tw-flex tw-flex-col tw-w-full lg:tw-w-1/2 tw-bg-white tw-justify-between tw-overflow-hidden"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* FORM CONTENT */}
        <motion.div
          className="tw-flex tw-flex-col tw-items-center tw-px-8 sm:tw-px-12 tw-pt-20 sm:tw-pt-24 tw-pb-8 tw-flex-1 tw-overflow-y-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
        >
          <div className="tw-w-full tw-max-w-[480px]">
            <Outlet />
          </div>
        </motion.div>

        {/* FOOTER */}
        <motion.div
          className="tw-w-full tw-py-6 tw-px-8 tw-text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <p className="tw-text-xs tw-text-gray-500 tw-font-light">
            © 2026 tech.us, All rights reserved.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default AuthLayout;