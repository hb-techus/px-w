/***************************************************************************************
 * @module       Common Utils 
 * @name         techus-Common Utils
 * @description  Get the User Authentication Common Utils 
 * @version      1.0.0
 * @copyright    © 2024 Tech.us
 * @license      Licensed under the MIT License
 * @createdon    May 2024
 * @modifiedon   October 2025
 * @since        1.0
 ***************************************************************************************/
  
export function formatDateFromISOString(dateString) { 
  // Create a new Date object from the ISO string
  let date = new Date(dateString);

  // Extract the month, day, and year from the Date object
  let month = date.getMonth() + 1; // Months are zero indexed, so we add 1
  let day = date.getDate();
  let year = date.getFullYear();

  // Format the date in MM/DD/YYYY format
  let formattedDate = `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;

  return formattedDate;  // Outputs: "07/11/2024"
}

export function formatDateFromISOStrings(dateString) { 
  // Create a new Date object from the ISO string
  let date = new Date(dateString);

  // Extract the month, day, and year from the Date object
  let month = date.getMonth() + 1; // Months are zero indexed, so we add 1
  let day = date.getDate();
  let year = date.getFullYear();

  // Format the date in MM/DD/YYYY format
  let formattedDate = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}-${year}`;

  return formattedDate;  // Outputs: "07/11/2024"
}

export function formatDateString(dateString) {
  const date = new Date(dateString);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  // let hours = date.getHours();
  // const minutes = String(date.getMinutes()).padStart(2, '0');
  // const ampm = hours >= 12 ? 'PM' : 'AM';
  // hours = hours % 12;
  // hours = hours ? hours : 12;

  return `${month} ${day}, ${year}` ;
  //  ${hours}:${minutes} ${ampm};
}

export function formatDateStringWithTime(dateString) {
  const date = new Date(dateString);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  return `${day} ${month}, ${year} ${hours}:${minutes} ${ampm} ` ;
  //  ${hours}:${minutes} ${ampm};
}
// capitailse first letter

export const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export function formatDollarCompact(value, options = {}) {
  const {
    mode     = 'auto',   // 'auto' | 'compact' | 'full'
    decimals = null,     // null = smart default per mode
    withDollar = true,
    fallback   = '',
    locale     = 'en-US',
  } = options

  // ─── GUARDS ──────────────────────────────────────────────────
  if (value == null || value === '')  return fallback
  if (typeof value === 'boolean')     return fallback
  if (typeof value === 'object')      return fallback

  const cleaned = String(value).replace(/[$,\s]/g, '')
  const n = Number(cleaned)

  if (Number.isNaN(n))     return fallback
  if (!Number.isFinite(n)) return fallback

  // ─── INTERNALS ───────────────────────────────────────────────
  const sign = n < 0 ? '-' : ''
  const abs  = Math.abs(n)
  const sym  = withDollar ? '$' : ''

  const trim = str => str.replace(/\.?0+$/, '')

  const UNITS = [
    { v: 1e12, s: 'T' },
    { v: 1e9,  s: 'B' },
    { v: 1e6,  s: 'M' },
    { v: 1e3,  s: 'K' },
  ]

  // ─── FULL MODE  → $1,500.75 ──────────────────────────────────
const toFull = (dp = 2) => {
  return new Intl.NumberFormat(locale, {
    style: withDollar ? 'currency' : 'decimal',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: dp,
  }).format(n)
}

  // ─── COMPACT MODE  → $30K ────────────────────────────────────
  const toCompact = (dp = 1) => {
    if (abs < 1000) {
      return `${sign}${sym}${trim(abs.toFixed(dp))}`
    }
    const unit = UNITS.find(u => abs >= u.v) || UNITS[UNITS.length - 1]
    return `${sign}${sym}${trim((abs / unit.v).toFixed(dp))}${unit.s}`
  }

  // ─── AUTO MODE  → smart pick based on value ──────────────────
  const toAuto = () => {
    if (abs >= 1000) return toCompact(decimals ?? 1)  // 1000+  → compact
    if (abs % 1 !== 0) return toFull(decimals ?? 2)   // has decimals → full
    return toFull(decimals ?? 0)                       // whole number → full no cents
  }

  // ─── RESOLVE MODE ────────────────────────────────────────────
  switch (mode) {
    case 'compact': return toCompact(decimals ?? 1)
    case 'full':    return toFull(decimals ?? 2)
    case 'auto':    return toAuto()
    default:        return toAuto()
  }
}

export const allowOnlyNumbersWithTwoDecimals = (event) => {
  const charCode = event.which ? event.which : event.keyCode;
  const charStr = String.fromCharCode(charCode);
  const inputValue = event.target.value;

  // Allow numbers and a single decimal point
  if (!/[0-9]/.test(charStr) && charStr !== '.') {
    event.preventDefault();
  }

  // Prevent multiple decimal points
  if (charStr === '.' && inputValue.includes('.')) {
    event.preventDefault();
  }

  // Ensure only two decimal places
  const decimalIndex = inputValue.indexOf('.');
  if (decimalIndex !== -1 && inputValue.length - decimalIndex > 4) {
    event.preventDefault();
  }
};

export const allowOnlyNumbersWithTwoDecimalsOrMinutes = (event) => {
  const charCode = event.which ? event.which : event.keyCode;
  const charStr = String.fromCharCode(charCode);
  const inputValue = event.target.value;

  // Allow numbers, a single decimal point, and a minus sign only at the beginning
  if (!/[0-9]/.test(charStr) && charStr !== '.' && charStr !== '-') {
    event.preventDefault();
    return;
  }

  // Prevent minus sign if it's not at the beginning
  if (charStr === '-' && inputValue.length > 0) {
    event.preventDefault();
    return;
  }

  // Prevent multiple decimal points
  if (charStr === '.' && inputValue.includes('.')) {
    event.preventDefault();
    return;
  }

  // Check if the current input is a minute value (0-59) or -59 to -0
  const numValue = parseFloat(inputValue + charStr);
  if (!isNaN(numValue) && Math.abs(numValue) <= 59 && !inputValue.includes('.')) {
    return; // Allow minutes up to 59 or down to -59 without decimals
  }

  // Ensure only two decimal places
  const decimalIndex = inputValue.indexOf('.');
  if (decimalIndex !== -1 && inputValue.length - decimalIndex > 2) {
    event.preventDefault();
  }
};

export const findDuplicates=(data, targetId) =>{
  const duplicates = []; // To store duplicate objects

  // Iterate through each page in data
  Object.values(data).forEach(pageArray => {
      // Check if pageArray is an array
      if (Array.isArray(pageArray)) {
          pageArray.forEach(item => {
              const id = item.structure_details.extract_structure_id;
              // If the id matches the targetId, add to duplicates
              if (id === targetId) {
                  duplicates.push(item);
              }
          });
      }
  });

  // Return duplicates only if there are multiple occurrences
  return duplicates.length > 1 ? duplicates : [];
}


export const getDescription = (structure) => {
  const { is_dot, width_ft, length_ft, wall_type, category_id } = structure;

  // Check if category is 1
  if (category_id !== 1) {
    return '-'; // Return '-' if category_id is not 1
  }

  // Determine wall type description
  const wallTypeDesc = is_dot !== 1 ? (wall_type === 1 ? 'Solid' : 'Waffle') : 'Custom';

  if (length_ft !== null) {
    // Catch Basin (CB) with Length
    return `${width_ft}x${length_ft} ${wallTypeDesc} Box`;
  } else {
    // Manhole (MH) without Length
    return `${width_ft * 12}" ${wallTypeDesc} Manhole`;
  }
};


export const allowPipeDiameterInput = (event) => {
  const charCode = event.which ? event.which : event.keyCode;
  const charStr = String.fromCharCode(charCode);
  const inputValue = event.target.value;

  // Allow numbers and a single decimal point
  if (!/[0-9]/.test(charStr) && charStr !== '.') {
    event.preventDefault();
  }

  // Prevent multiple decimal points
  if (charStr === '.' && inputValue.includes('.')) {
    event.preventDefault();
  }

  // Ensure only two decimal places
  const decimalIndex = inputValue.indexOf('.');
  if (decimalIndex !== -1 && inputValue.length - decimalIndex > 3) { // 2 decimal places + 1 for '.'
    event.preventDefault();
  }

  // Ensure the number stays between 0 and 99
  const numberValue = parseFloat(inputValue + charStr); // Potential new value after typing
  if (numberValue > 99 || numberValue < 0) {
    event.preventDefault();
  }
};


export const allowPipeAngleInput = (event) => {
  const charCode = event.which ? event.which : event.keyCode;
  const charStr = String.fromCharCode(charCode);
  const inputValue = event.target.value;

  // Allow only numbers (no decimal points or non-numeric characters)
  if (!/[0-9]/.test(charStr)) {
    event.preventDefault();
  }

  // Ensure the number stays between 0 and 359 (whole numbers only)
  const numberValue = parseInt(inputValue + charStr, 10); // Potential new value after typing
  if (numberValue > 359 || numberValue < 0) {
    event.preventDefault();
  }
};


import {parsePhoneNumber} from 'libphonenumber-js';

export const formatPhoneNumber = (num) => {
  if(num && num.length>5){
  const phoneNumber = parsePhoneNumber(num, 'US');
  return phoneNumber ? phoneNumber.formatNational() : num;
  }else{
    return num
  }
};

export const formatDateTime = (dateString) => {
    if (!dateString) return "-";

    const d = new Date(dateString);

    const day = d.getDate().toString().padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();

    return `${day} ${month}, ${year}`;
  };

export const generateStartAndEndDate = (type) => {
  const today = new Date();

  const start = new Date(today);
  const end = new Date(today);

  if (type === "ANNUAL") {
    end.setFullYear(end.getFullYear() + 1);
  }

  if (type === "MONTHLY") {
    end.setMonth(end.getMonth() + 1);
  }

  const format = (d) => d.toISOString().split("T")[0];

  return {
    start_date: format(start),
    end_date: format(end),
  };
};


export const formatDateWithTime=(dateString)=> {
  const date = new Date(dateString);
  const options = {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  return date.toLocaleString('en-US', options);
  // Output: "07/22/2024, 10:15 AM"
}

export const removeStructureSuffix=(id)=> {
  // Check if string ends with -i or -ii
  if (id.endsWith('-i') || id.endsWith('-ii')) {
      // Remove the last -i or -ii by getting substring up to last hyphen
      return id.substring(0, id.lastIndexOf('-'));
  }
  return id;
}

export const calculateDimensionIntoFt = (dimensionFt, dimensionIn) => {
  const ft = parseInt(dimensionFt);
  const inches = parseInt(dimensionIn);

  if (!isNaN(ft) && !isNaN(inches) && dimensionFt !== 0 || dimensionIn !== 0 && !isNaN(ft)) {
    // return (ft + inches / 12).toFixed(2) + ' Ft';
    const totalFt = (ft + inches / 12).toFixed(2);
    const [beforeDot, afterDot] = totalFt.split('.');
    
    return {
      ft: beforeDot , // part before the decimal
      in: afterDot // part after the decimal, converted to inches
    };
  }
  return {
    ft:'', // part before the decimal
    in:'' // part after the decimal, converted to inches
  };
};

export const calculateDimensionsFtToIn = (dimensionFt) => {
  const totalInches = dimensionFt * 12; // Convert feet to inches
  const ft = Math.floor(dimensionFt); // Extract the feet part
  const inches = Math.round(totalInches % 12); // Extract the remaining inches part

  return {ft:ft,  in:inches};
};



export const calculateDimensionIntoFts = (dimensionFt, dimensionIn) => {
  const ft = parseInt(dimensionFt);
  const inches = parseInt(dimensionIn);

  if (!isNaN(ft) && !isNaN(inches) && dimensionFt !== 0 || dimensionIn !== 0 && !isNaN(ft)) {
    return (ft + inches / 12).toFixed(2);
  
  
  }
  return '';
};

export function getFileExtension(filename) {
  return filename.split('.').pop();
}

export function bytesToMB(bytes) {
  const mb = bytes / (1024 * 1024);
  
  // Check if the value is too small and round it to 4 decimal places
  if (Math.abs(mb) < 0.0001) {
    return 0;  // If the value is too small, return 0
  }
  
  return mb.toFixed(4);  // Otherwise, round to 4 decimal places
}