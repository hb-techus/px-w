/***************************************************************************************
 * @module       Axios HTTP Client 
 * @name         techus-useAxois
 * @description  HTTP client wrapper for making API requests with axios
 * @version      1.0.0
 * @license      Licensed under the MIT License
 * @createdon    October 2025
 * @since        1.0
 ***************************************************************************************/

import { httpClient } from './SessionHandler'; // Adjust the import based on your project structure

const Http = {
  get: (url, params, route, userRole) =>
    httpClient.get(url, { params, route, userRole }),
  post: (url, data, route, userRole) =>
    httpClient.post(url, data, { route, userRole }),
  put: (url, data, route, userRole) =>
    httpClient.put(url, data, { route, userRole }),
  patch: (url, data, route, userRole) =>
    httpClient.patch(url, data, { route, userRole }),
  delete: (url, route, userRole) =>
    httpClient.delete(url, { data: { route, userRole } }),
};

export default Http;