import React from 'react'
import no_data from '../assets/Images/no_data_images/No-data-found.webp'

/**
 * NoDataFound — common reusable empty-state component
 * Image is baked in — no need to pass imageSrc from every page.
 *
 * Props:
 *  title        : string  – heading text        (default: "No Data Found")
 *  description  : string  – sub-text
 *  buttonLabel  : string  – button text         (default: "Back To List")
 *  onReset      : func    – called on button click (button hidden if not passed)
 *  btnColor     : string  – button bg colour    (default: "#156082")
 */
const NoDataFound = ({
  title = 'No Data Found',

  buttonLabel = 'Back To List',
  onReset,
  btnColor = '#0140c1',
}) => {
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-16 tw-text-center tw-w-full">
      <img
        src={no_data}
        alt="No data found"
        className="tw-w-md tw-h-56 tw-mb-4"
      />
      <h3 className="tw-text-xl tw-font-semibold tw-text-gray-800">{title}</h3>
      {/* <p className="tw-text-gray-600 tw-mt-1">{description}</p> */}
      {onReset && (
        <button
          onClick={onReset}
          style={{ backgroundColor: btnColor }}
          className="tw-text-white tw-rounded-md tw-px-6 tw-py-2 tw-mt-5 hover:tw-opacity-90 tw-transition-all tw-w-[200px]"
        >
          {buttonLabel}
        </button>
      )}
    </div>
  )
}

export default NoDataFound