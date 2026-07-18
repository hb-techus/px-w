/***************************************************************************************
 * @module       Redux 
 * @name         authSlice
 * @description  Authentication slice for managing user authentication state
 * @version      1.0.0
 * @license      Licensed under the MIT License
 * @createdon    October 2025
 * @since        1.0
 ***************************************************************************************/

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { UserInfoByToken } from '../../services/techus-services';
import ServiceUtils from '../../utils/techus-serviceUtils';
import { addTokens } from './keySlice';
import { setPermissions } from './permissionsSlice';

const utilsService = ServiceUtils();

const getTokenByPortal = (portal) => {
  return portal === 'admin'
    ? localStorage.getItem('prexo_admin_access_token')
    : localStorage.getItem('prexo_organization_access_token');
};

const getUserKeyByPortal = (portal) => {
  return portal === 'admin' ? 'admin_user' : 'organization_user';
};

export const fetchSession = createAsyncThunk(
  'auth/fetchSession',
  async (portal, { dispatch, rejectWithValue }) => {
    try {
      const token = getTokenByPortal(portal);

      if (!token) {
        throw new Error('No token found');
      }

      const response = await UserInfoByToken({ token });

      const userData = response.user_data?.[0] || {}
      const permissionInfo = response.user_data?.[1] || {}
      dispatch(addTokens({
        user_type: userData.user_type || '',
        uuid: userData.id || '',
        isAuthenticated: true,
        permissions: permissionInfo || {},
        ...(userData.organization_id && { organization_id: userData.organization_id }),
        ...(userData.organization_uuid && { organization_uuid: userData.organization_uuid })
      }))

      dispatch(setPermissions({ permissions: permissionInfo }))

      return { ...response, portal };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  token: null,
  user: null,
  portal: null,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      const { portal, token } = action.payload;
      let userData = action.payload?.user_data || action.payload?.user;
      // VerifyOTP returns user_data as a plain object; UserInfoByToken returns an array.
      // Normalize to array so auth.user[0] always resolves to the profile object.
      if (userData && !Array.isArray(userData)) {
        userData = [userData];
      }

      state.token = token;
      state.user = userData;
      state.portal = portal;
      state.status = 'succeeded';

      if (portal === 'admin') {
        localStorage.setItem('prexo_admin_access_token', token);
      } else {
        localStorage.setItem('prexo_organization_access_token', token);
      }

      utilsService.setSession(
        getUserKeyByPortal(portal),
        JSON.stringify(userData),
        true
      );
    },

    logout: (state, action) => {
      const portal = action.payload;

      if (portal === 'admin') {
        localStorage.removeItem('prexo_admin_access_token');
        localStorage.removeItem('prexo_admin_uuid');
        localStorage.removeItem('prexo_admin_isAuthenticated');
        sessionStorage.removeItem('prexo_admin_2fa_allowed');
      } else {
        localStorage.removeItem('prexo_organization_access_token');
        localStorage.removeItem('prexo_organization_uuid');
        localStorage.removeItem('prexo_organization_isAuthenticated');
        sessionStorage.removeItem('prexo_organization_2fa_allowed');
      }

      utilsService.removeSession(getUserKeyByPortal(portal), true);

      state.token = null;
      state.user = null;
      state.portal = null;
      state.status = 'idle';
      state.error = null;
    },

    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };

      if (state.portal) {
        utilsService.setSession(
          getUserKeyByPortal(state.portal),
          JSON.stringify(state.user),
          true
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSession.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.status = 'succeeded';

        const userData = action.payload?.user_data || action.payload?.user;

        state.user = userData;
        state.token = getTokenByPortal(action.payload.portal);
        state.portal = action.payload.portal;

        if (userData) {
          utilsService.setSession(
            getUserKeyByPortal(action.payload.portal),
            JSON.stringify(userData),
            true
          );
        }
      })
      .addCase(fetchSession.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      });
  },
});

export const { login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;