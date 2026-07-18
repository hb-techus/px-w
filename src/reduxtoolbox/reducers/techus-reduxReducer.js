/***************************************************************************************
 * @module       Redux 
 * @name         techus-reduxReducer
 * @description  Redux reducer configuration for the application
 * @version      1.0.0
 * @license      Licensed under the MIT License
 * @createdon    October 2025
 * @since        1.0
 ***************************************************************************************/

// store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../actions/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export default store;
