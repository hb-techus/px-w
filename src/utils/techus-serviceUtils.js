/***************************************************************************************
 * @module       Service Utils 
 * @name         techus-Service Utils
 * @description  Utility functions for handling API requests, session management, and data formatting
 * @version      1.0.0
 * @license      Licensed under the MIT License
 * @createdon    May 2025
 * @since        1.0
 ***************************************************************************************/

import { encryptHandler,encryptJSONHandler,decryptHandler,decryptJSONHandler } from "./techus-SecureServiceUtils";

import CONFIG from '../config/config';
 
const ServiceUtils = () => {
  //#endregion
  //#region isEmpty
  /**
   * Checks if a value is empty (null, undefined, or an empty string/array).
   * @name isEmpty
   * @param {any} inputValue - The value to be checked.
   * @returns {boolean} - True if the value is empty, false otherwise.
   * @version 1.0.0
  */
  const isEmpty = (inputValue) => {
    return (
      inputValue === null ||
      inputValue === undefined ||
      inputValue.length === 0
    );
  };
  //#endregion

  //#region setSession
  /**
   * Sets a value in the session storage, optionally encrypting it if specified.
   * @name setSession
   * @param {string} key - The key under which the value will be stored.
   * @param {any} value - The value to be stored.
   * @param {boolean} isJsonData - Indicates whether the value is JSON data and should be encrypted accordingly.
   * @returns {void}
   * @version 1.0.0
  */
  const setSession = (key, value, isJsonData) => {
    const storageKey = CONFIG.VITE_REACT_APP_SESSION_PREFIX + key;
    const encryptedValue = isJsonData ? encryptJSONHandler(value) : encryptHandler(value);
    localStorage.setItem(storageKey, encryptedValue);
  };
  //#endregion

  //#region getSession
  /**
  * Retrieves a value from the session storage, optionally decrypting it if specified.
  * @name getSession
  * @param {string} key - The key under which the value is stored.
  * @param {boolean} isJsonData - Indicates whether the stored value is JSON data and should be decrypted accordingly.
  * @returns {any} - The retrieved value.
  * @version 1.0.0
  */
  const getSession = (key, isJsonData) => {
    const storageKey = CONFIG.VITE_REACT_APP_SESSION_PREFIX + key;
    const storedValue = localStorage.getItem(storageKey);
    if (isJsonData && !isEmpty(storedValue)) {
      return decryptJSONHandler(storedValue);
    } else if (!isEmpty(storedValue)) {
      return decryptHandler(storedValue);
    }
    return "";
  };
  //#endregion

  //#region hasSession
  /**
  * Checks if a session with the given key exists.
  * @name hasSession
  * @param {string} key - The key to check.
  * @returns {boolean} - True if the session exists, false otherwise.
  * @version 1.0.0
  */
  const hasSession = (key) => {
    const storageKey = CONFIG.VITE_REACT_APP_SESSION_PREFIX + key;
    return (
      Object.prototype.hasOwnProperty.call(localStorage, storageKey) &&
      !isEmpty(localStorage.getItem(storageKey))
    );
  };
  //#endregion

  //#region removeSession
  /**
   * Removes a session with the given key.
   * @name removeSession
   * @param {string} key - The key of the session to be removed.
   * @returns {void}
   * @version 1.0.0
  */
  const removeSession = (key) => {
    localStorage.removeItem(CONFIG.VITE_REACT_APP_SESSION_PREFIX + key);
  };
  //#endregion

  //#region removeAllSessions
  /**
   * Removes all sessions stored in the local storage except for those related to app details.
   * @name removeAllSessions
   * @returns {void}
   * @version 1.0.0
  */
  const removeAllSessions = () => {
    for (let key in localStorage) {
      if (key.endsWith("appdetails")) {
        // intentionally add this for skip these steps
      } else if (key.startsWith(CONFIG.VITE_REACT_APP_SESSION_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  };
  //#endregion

  //#region removeSessionsExcept
  /**
   * Removes all sessions except those specified in the exceptKeys array.
   * @name removeSessionsExcept
   * @param {string[]} exceptKeys - An array of keys for sessions to be excluded from removal.
   * @returns {void}
   * @version 1.0.0
  */
  const removeSessionsExcept = (exceptKeys) => {
    for (let key in localStorage) {
      const isAppDetailsKey = key.endsWith("appdetails");
      const hasSessionPrefix = key.startsWith(CONFIG.VITE_REACT_APP_SESSION_PREFIX);
      const isExceptedKey = exceptKeys.some(
        (exceptKey) =>
          hasSessionPrefix && key === CONFIG.VITE_REACT_APP_SESSION_PREFIX + exceptKey
      );

      if (!isAppDetailsKey && !isExceptedKey && hasSessionPrefix) {
        localStorage.removeItem(key);
      }
    }
  };
  //#endregion

  //#region hasRealIPAddress
  /**
   * Checks if the stored IP address is different from the local IP address.
   * @name hasRealIPAddress
   * @param {string} key - The key for the stored IP address.
   * @returns {boolean} - True if the stored IP is different, false otherwise.
   * @version 1.0.0
   */
  const hasRealIPAddress = (key) => {
    const IP = getSession(key, false);
    return IP !== "127.0.0.1";
  };
  //#endregion

  //#region formatBytes
  /**
   * Formats the given number of bytes into a human-readable string with specified decimals.
   * @name formatBytes
   * @param {number} bytes - The number of bytes to be formatted.
   * @param {number} decimals - The number of decimal places (default is 2).
   * @returns {string} - The formatted byte string.
   * @version 1.0.0
  */
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };
  //#endregion

  //#region generateJSONFromArray
  /**
   * Generates a JSON string from an array.
   * @name generateJSONFromArray
   * @param {any[]} input - The input array.
   * @returns {string} - The generated JSON string.
   * @version 1.0.0
  */
  const generateJSONFromArray = (input) => {
    let output;
    output = JSON.stringify({ ...input });
    output = JSON.stringify(JSON.parse(output));
    return output;
  };
  //#endregion

  //#region prepareAPIRequest
  /**
   * Prepares an API request by encrypting and formatting the data.
   * @name prepareAPIRequest
   * @param {any} apiRequest - The API request data.
   * @returns {string} - The prepared API request string.
   * @version 1.0.0
  */
  const prepareAPIRequest = (apiRequest) => {
         if(CONFIG.IS_DEVELOPMENT ===1 || (CONFIG.VITE_ENV === 'QA' && localStorage.getItem('show_console') === "1") ){
          console.log('----------------------------Request Data Start Here ----------------------------')
          console.log(apiRequest);
          console.log('----------------------------Request Data End Here ----------------------------')
        }
        const apiRequestJSON = generateJSONFromArray(apiRequest);
        const encryptStr = encryptJSONHandler(apiRequestJSON);

        return JSON.stringify({ edata: encryptStr });
  };
  //#endregion

  //#region prepareAPIResponse
  /**
   * Prepares an API response by decrypting and formatting the data.
   * @name prepareAPIResponse
   * @param {string} apiresponse - The API response data.
   * @returns {any} - The prepared API response.
   * @version 1.0.0
  */
  const prepareAPIResponse = (apiresponse) => {
    let responseData = decryptJSONHandler(apiresponse);
     if(CONFIG.IS_DEVELOPMENT ===1 || (CONFIG.VITE_ENV === 'QA' && localStorage.getItem('show_console') === "1") ){
      console.log('----------------------------Response Data Start Here ----------------------------')
      console.log(responseData);
      console.log('----------------------------Response Data End Here ----------------------------')
    }
    return responseData;
  }
  //#endregion

  //#region displayMessage
  /**
  * Displays a message using the provided class, message, and type.
  * @name displayMessage
  * @param {string} className - The class name of the element to display the message in.
  * @param {string} message - The message to be displayed.
  * @param {string} type - The type of the message (e.g., 'success', 'info', 'warning', 'danger').
  * @param {boolean} isClosable - Indicates whether the message is closable.
  * @returns {void}
  * @version 1.0.0
  */
  const displayMessage = (className, message, type ) => {
    const element = document.getElementsByClassName(className)[0];

    if (message === '') {
      element.innerHTML = '';
    } else {
      const alertDiv = document.createElement('div');
      alertDiv.className = `alert-effect alert alert-${type} alert-dismissible`;

      const closeLink = document.createElement('a');
      closeLink.href = '#';
      closeLink.className = 'close d-flex align-items-center text-underline-none';
      closeLink.setAttribute('data-dismiss', 'alert');
      closeLink.setAttribute('aria-label', 'close');
      closeLink.addEventListener('click', ($event) => alertClose($event));

      const closeSymbol = document.createTextNode('\u00D7');
      closeLink.appendChild(closeSymbol);

      alertDiv.appendChild(closeLink);

      const messageText = document.createTextNode(message);
      alertDiv.appendChild(messageText);

      element.innerHTML = '';
      element.appendChild(alertDiv);
    }

  };
  //#endregion

  //#region alertClose
  /**
   * Closes an alert when the close link is clicked.
   * @name alertClose
   * @param {EventTarget} event - The event target corresponding to the close link.
   * @returns {void}
   * @version 1.0.0
   */
  const alertClose = (event) => {
    event.preventDefault();
    const alertElement = event.target.closest('.alert');
    if (alertElement) {
      alertElement.style.display = 'none';
    }
  };
  //#endregion

  /**
 * Converts XML to JSON format, excluding #text properties
 * @name xmlToJson
 * @param {Object} xml - The XML object to be converted to JSON.
 * @returns {Object} - The JSON representation of the XML input.
 * @version 1.0.0
 */
  const xmlToJson = (xml) => {
    let obj = {};
    if (xml.nodeType === 1) {
      if (xml.hasChildNodes()) {
        for (let i = 0; i < xml.childNodes.length; i++) {
          const item = xml.childNodes.item(i);
          const nodeName = item.nodeName;
          if (item.nodeType === 3 && item.nodeValue.trim() !== '') { // text node
            return item.nodeValue.trim(); // return the value directly
          } else if (item.nodeType === 1) { // element node
            if (typeof (obj[nodeName]) === "undefined") {
              obj[nodeName] = xmlToJson(item);
            } else {
              if (!Array.isArray(obj[nodeName])) {
                const old = obj[nodeName];
                obj[nodeName] = [old];
              }
              obj[nodeName].push(xmlToJson(item));
            }
          }
        }
      }
    }
    return obj;
  };
  //#endregion

  const formatDateString=(dateString) =>{
    const date = new Date(dateString);
  
    const options = { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric', 
      hour: 'numeric', 
      minute: 'numeric', 
      hour12: true 
    };
  
    return date.toLocaleString('en-US', options);
  }

  return {
    isEmpty,
    setSession,
    hasSession,
    hasRealIPAddress,
    formatBytes,
    removeSession,
    removeAllSessions,
    removeSessionsExcept,
    getSession,
    prepareAPIRequest,
    prepareAPIResponse,
    generateJSONFromArray,
    displayMessage,
    alertClose,
    xmlToJson,
    formatDateString
  };
};

export default ServiceUtils;