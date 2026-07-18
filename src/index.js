/***************************************************************************************
 * @module       Index 
 * @name         Index
 * @description  Application entry point that sets up React, Redux store and global providers
 * @version      1.0.0
 * @license      Licensed under the MIT License
 * @createdon    October 2025
 * @since        1.0
 ***************************************************************************************/

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import {store} from './reduxtoolbox/stores/techus-reduxStore';
import "./assets/styles/index.css";
import "./global.css";
// import "./assets/conai_Fonts/style.css";

// identify your logged-in users (optional)

window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('Loading chunk')) {
    window.location.reload();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
   <Provider store={store}>
    {/* <UserbackProvider token={'P-kcQwLKwTQyZ3h4jnhY8TFd8EF'} options={{user_data: user_data}}> */}
      <App />
    {/* </UserbackProvider> */}
  </Provider>,
);
