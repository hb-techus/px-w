import React from "react";
import { Outlet } from "react-router-dom";
import leftImg from "../../../assets/Images/login_assets/Adminl-loginbg.webp";
import { motion } from "framer-motion";

const AuthLayout = () => {
  return (
    <motion.div
      className="tw-min-h-screen tw-flex tw-overflow-hidden tw-bg-gradient-to-br tw-from-[#f7f9fc] tw-to-[#eef3ff]"
    >

      {/* LEFT SECTION */}
      <motion.div
        className="tw-hidden lg:tw-flex tw-w-1/2 tw-bg-cover tw-bg-center tw-relative"
        style={{ backgroundImage: `url(${leftImg})` }}
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >

        {/* TOP TEXT */}
        <div className="tw-absolute tw-top-16 tw-left-16 tw-text-white tw-z-10">
          <h1 className="tw-text-3xl tw-font-semibold tw-tracking-wider">
            PrexoAI
          </h1>
          <p className="tw-text-blue-100 tw-text-md tw-font-light">
            Pre-Construction Intelligence Platform
          </p>
        </div>

        {/* BOTTOM TEXT */}
        <div className="tw-absolute tw-bottom-20 tw-left-16 tw-text-white tw-z-10 ">
          <h2 className="tw-text-4xl tw-font-bold tw-leading-tight">
            Preconstruction Intelligence <br />
            Platform
            <span className="tw-text-4xl tw-font-light tw-ml-1">™</span>
          </h2>

          <p className="tw-text-blue-100 tw-text-[18px] tw-mt-5 tw-font-light">
            Unlock the power of artificial intelligence to streamline workflows,<br />
            gain insights, and drive innovation.
          </p>
        </div>

      </motion.div>
      {/* RIGHT LOGIN SECTION */}
      <motion.div
        className="tw-flex tw-flex-col tw-w-full lg:tw-w-1/2 tw-bg-white tw-justify-between tw-shadow-xl tw-rounded-l-3xl"
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* CONTENT */}
        <motion.div
          className="tw-flex tw-flex-col tw-items-center tw-px-8 sm:tw-px-12 tw-pt-20 sm:tw-pt-24 tw-pb-8 tw-flex-1 tw-overflow-y-auto"
          initial={{ opacity: 0, y: 25 }}
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
