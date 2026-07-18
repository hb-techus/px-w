

/***************************************************************************************
 * @module       Session Handler 
 * @name         SessionHandler
 * @description  Handles session management, authentication, and WebSocket connections
 * @version      1.0.0
 * @license      Licensed under the MIT License
 * @createdon    October 2025
 * @since        1.0
 ***************************************************************************************/

import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CONFIG from '../config/config';
import AlertModal from '../genriccomponents/AlertModal';
import { setToastSuppressed } from '../genriccomponents/techus-ToastNotification';
import { UserInfoByToken } from '../services/techus-services';
import ServiceUtils from '../utils/techus-serviceUtils';
import { logout } from '../reduxtoolbox/actions/authSlice';
import { useDispatch } from 'react-redux';

const API_BASE_URL = `${CONFIG.VITE_API_URL}`;
const API_LANDING_KEY = CONFIG.VITE_REACT_APP_LANDING_AUTHORIZATION_KEY;

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

const utilsService = ServiceUtils();

const SessionHandler = ({ portal }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ title: '', content: '' });
  const history = useNavigate();
  const dispatch = useDispatch();

  const tokenKey =
    portal === 'admin'
      ? 'prexo_admin_access_token'
      : 'prexo_organization_access_token';

  const loginPath = portal === 'admin' ? '/admin/login' : '/login';

  const clearPortalStorage = useCallback(() => {
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
  }, [portal]);

  const handleLogoutOkay = useCallback(async () => {
    const token = localStorage.getItem(tokenKey);

    if (!token) {
      setToastSuppressed(false);
      clearPortalStorage();
      dispatch(logout(portal));
      setShowModal(false);
      history(loginPath);
      return;
    }

    const response = await UserInfoByToken({ token });

    if (response.valid) {
      if (response.user?.length === 0) {
        setToastSuppressed(false);
        clearPortalStorage();
        dispatch(logout(portal));
        setShowModal(false);
        history(loginPath);
      } else {
        setToastSuppressed(false);
        window.location.reload();
      }
    } else {
      setToastSuppressed(false);
      clearPortalStorage();
      dispatch(logout(portal));
      setShowModal(false);
      history(loginPath);
    }
  }, [tokenKey, clearPortalStorage, dispatch, portal, history, loginPath]);

  const checkSessionExpire = (data) => {
    setToastSuppressed(true);
    setModalData({ title: data.head, content: data.text });
    setShowModal(true);
  };

  useEffect(() => {
    const interceptorRequest = httpClient.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(tokenKey);

        config.headers.Authorization =
          token && !['/login', '/verify-otp'].includes(config.url)
            ? `Bearer ${token}`
            : API_LANDING_KEY;

        return config;
      },
      (error) => Promise.reject(error)
    );

    const interceptorResponse = httpClient.interceptors.response.use(
      (response) => {
        if (response.config.responseType === 'arraybuffer') {
          return response.data;
        }

        if (response.data.session_expired === 1) {
          checkSessionExpire({
            head: 'Session Expired',
            text: 'Your session has expired. Please log in again.',
          });
        } else if (response.data.force_logout === 1) {
          checkSessionExpire({
            head: 'Force Log Out',
            text: 'You will be logged out from this device because your account is currently active on another device. Please log in again if you wish to continue using this device.',
          });
        } else {
          return utilsService.prepareAPIResponse(response.data.edata);
        }

        return Promise.resolve(response);
      },
      (error) => {
        if (error.response && error.response.status === 401) {
          console.error('Unauthorized access, logging out');
          handleLogoutOkay();
          return Promise.resolve({ data: { valid: false, message: '' } });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      httpClient.interceptors.request.eject(interceptorRequest);
      httpClient.interceptors.response.eject(interceptorResponse);
    };
  }, [tokenKey, handleLogoutOkay]);

  return (
    <div>
      {showModal && (
        <AlertModal
          button="Log Out"
          title={modalData.title}
          content={modalData.content}
          handleOkay={handleLogoutOkay}
          showModal={showModal}
        />
      )}
    </div>
  );
};

export { httpClient, SessionHandler };
