import React from 'react';

import noDataImg from '../../assets/Images/no_data_images/No-data-found.webp';

const NoDataComponent = () => {
  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-min-h-screen tw-mt-[-80px] ">
      <div className="tw-w-full tw-max-w-4xl tw-bg-white tw-border tw-border-gray-200 tw-rounded-sm tw-shadow-sm tw-py-24 tw-px-10 tw-flex tw-flex-col tw-items-center tw-justify-center">
        
        {/* Illustration Container */}
        <div className="tw-mb-6">
          <img 
            src={noDataImg} 
            alt="No Data Found" 
            className="tw-w-48 tw-h-auto tw-opacity-90"
          />
        </div>

        {/* Text Content */}
        <div className="tw-text-center">
          <h2 className="tw-text-xl tw-font-bold tw-text-gray-800 tw-mb-2">
            No Data Found
          </h2>
          <p className="tw-text-gray-500 tw-text-sm tw-font-medium">
            There is no data to show you right now
          </p>
        </div>

      </div>
    </div>
  );
};

export default NoDataComponent;