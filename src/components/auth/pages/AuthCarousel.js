import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";


const imageMap = {
  "/login": {
    // src: image1,
    caption:
      "Driving Protection for Every Mile - From Local Routes to Long Hauls.",
  },
  "/forgot-password": {
    // src: image2,
    caption: "Specialized Coverage for Trucks, Taxis, and Everything in Between",
  },
  "/reset-password": {
    // src: image3,
    caption: "Smart, Reliable Insurance for the Road-Ready Professionals",
  },
  "/two-factor": {
    // src: image4,
    caption:
      "Your Cargo, Your Fleet, Your Peace of Mind - Covered up to $100,000",
  },
};

const AuthCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const keys = Object.keys(imageMap);
  const current = imageMap[keys[activeIndex]];

  // Auto-scroll every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % keys.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [keys.length]);

  return (
    <div className="tw-flex tw-flex-row tw-w-full tw-h-full">
      {/* Left: Auto-scrolling Image Section */}
      <div className="tw-relative tw-w-full tw-h-full tw-overflow-hidden tw-rounded-l-2xl">
        <AnimatePresence mode="sync">
          <motion.img
            key={keys[activeIndex]}
            src={current.src}
            alt="Auth Visual"
            className="tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-full tw-object-cover tw-rounded-l-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </AnimatePresence>

        {/* Caption */}
        <motion.div
          key={`${keys[activeIndex]}-caption`}
          className="tw-absolute tw-top-8 tw-left-0 -tw-translate-x-1/2 tw-pointer-events-none tw-w-full tw-flex tw-justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ delay: 1, duration: 0.6, ease: "easeInOut" }}
        >
          <div
            className="tw-text-white tw-text-2xl tw-font-normal tw-drop-shadow-md 
               tw-bg-[rgba(21,96,130,0.67)] tw-backdrop-blur-[4px]
                tw-p-6 tw-rounded-xl tw-max-w-[470px] xl:tw-max-w-[500px] tw-text-left tw-w-full tw-mx-auto"
          >
            {current.caption}
          </div>
        </motion.div>

        {/* Pagination Dots */}
        <div className="tw-flex tw-space-x-[5px] tw-absolute tw-bottom-4 tw-left-1/2 -tw-translate-x-1/2">
          {keys.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`tw-w-6 tw-h-[3px] tw-rounded-full tw-transition-all ${
                index === activeIndex
                  ? "tw-bg-white tw-scale-105"
                  : "tw-bg-gray-300 tw-bg-opacity-40"
              }`}
            ></button>
          ))}
        </div>
      </div>
    </div>
    // <div className="">
    //   Test
    // </div>
  );
};

export default AuthCarousel;
