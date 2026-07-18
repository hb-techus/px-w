/***************************************************************************************
 * @module       Redux 
 * @name         techus-reduxStore
 * @description  Redux store configuration for the application
 * @version      1.0.0
 * @license      Licensed under the MIT License
 * @createdon    October 2025
 * @since        1.0
 ***************************************************************************************/

import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../actions/authSlice';
import permissionsReducer from "../actions/permissionsSlice.js";
import userReducer from "../actions/userSlice";
import tokenReducer from '../actions/keySlice.js'
import projectReducer from '../actions/projectSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    permissions : permissionsReducer,
    user: userReducer,
    tokens:tokenReducer,
        project: projectReducer,
  },
  //  devTools: false,
});

export default store;
