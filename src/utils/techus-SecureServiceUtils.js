/***************************************************************************************
 * @module       Secure Service Utils 
 * @name         techus-Secure Service Utils
 * @description  Utility functions for handling encryption and decryption of data using AES
 * @version      1.0.0
 * @license      Licensed under the MIT License
 * @createdon    October 2025
 * @since        1.0
 ***************************************************************************************/

import CryptoJS from 'crypto-js';
//#endregion
import CONFIG from  '../config/config';

// XOR salt — pairs with the obfuscated values stored in .env
// Run scripts/gen-enc-keys.mjs to regenerate .env values whenever keys change
const _KS = [0x5f,0x3a,0x71,0x2c,0x48,0x9e,0x1d,0x63,0x87,0xb2,0x4f,0x06,0xd5,0x3c,0x9a,0x51,
             0x7e,0x22,0xc8,0x15,0x6b,0xf0,0x38,0x4d,0x92,0xa6,0x0b,0xe7,0x29,0x55,0x80,0xce];

const _decode = (b64) => {
  try {
    const bytes = atob(b64).split('').map((c, i) => c.charCodeAt(0) ^ _KS[i % _KS.length]);
    return String.fromCharCode(...bytes);
  } catch {
    return b64; // fallback: treat as plain value (LOCAL dev without obfuscation)
  }
};

  //#region encryptParamHandler
  /**
   * Encrypts a parameter using AES encryption.
   * @name encryptParamHandler
   * @param {any} value - The value to be encrypted.
   * @returns {string} - The encrypted value as a string.
   * @version 1.0.0
  */

  const getKeys = () => {
    const secKey = _decode(CONFIG?.VITE_REACT_APP_AES_ENC_SECRET_KEY);
    const ivKey = _decode(CONFIG?.VITE_REACT_APP_AES_ENC_IV);

    if (!secKey || !ivKey) {
      throw new Error("AES keys missing in CONFIG");
    }

    return {
      key: CryptoJS.enc.Utf8.parse(secKey),
      iv: CryptoJS.enc.Utf8.parse(ivKey),
    };
  };

export let encryptParamHandler=  function (value) {
  const { key, iv } = getKeys();
    const encrypted = CryptoJS.AES.encrypt(
      CryptoJS.enc.Utf8.parse(value.toString()),
      key,
      {
        keySize: 256 / 32,
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    return encrypted.toString();
  };
  //#endregion

  //#region decryptParamHandler
  /**
   * Decrypts a parameter using AES decryption.
   * @name decryptParamHandler
   * @param {string} value - The encrypted value to be decrypted.
   * @returns {string} - The decrypted value as a string.
   * @version 1.0.0
  */
  export let decryptParamHandler=function (value) {
    const { key, iv } = getKeys();

    const decrypted = CryptoJS.AES.decrypt(value, key, {
      keySize: 256 / 32,
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }
  //#endregion

  //#region encryptHandler
  /**
   * Encrypts a value using AES encryption.
   * @name encryptHandler
   * @param {any} value - The value to be encrypted.
   * @returns {string} - The encrypted value as a string.
   * @version 1.0.0
  */
  export let encryptHandler = (value) => {
    const { key, iv } = getKeys();
  
    const encrypted = CryptoJS.AES.encrypt(
      CryptoJS.enc.Utf8.parse(value.toString()),
      key,
      {
        keySize: 256 / 32,
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
  
    return encrypted.toString();
  };
  //#endregion

  let encrypt_replace = function (text) {
    text = text.replace(/\+/g, 'xMl3xcJk');
    text = text.replace(/\//g, 'Por21xcLd');
    text = text.replace(/=/g, 'Mlxc32');
    return text;
  };
  
  let decrypt_replace = function (text) {
    text = text?.replace(/xMl3xcJk/g, '+');
    text = text?.replace(/Por21xcLd/g, '/');
    text = text?.replace(/Mlxc32/g, '=');
    return text;
  };

  //#region decryptHandler
  /**
   * Decrypts a value using AES decryption.
   * @name decryptHandler
   * @param {string} value - The encrypted value to be decrypted.
   * @returns {string} - The decrypted value as a string.
   * @version 1.0.0
  */
  export let decryptHandler = (value) => {
    const { key, iv } = getKeys();
  
    const decrypted = CryptoJS.AES.decrypt(value, key, {
      keySize: 256 / 32,
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
  
    return decrypted.toString(CryptoJS.enc.Utf8);
  };
  //#endregion

  //#region decryptJSONHandler
  /**
   * Decrypts a JSON object using AES decryption.
   * @name decryptJSONHandler
   * @param {string} value - The encrypted JSON object to be decrypted.
   * @returns {object} - The decrypted JSON object.
   * @version 1.0.0
  */
  export let decryptJSONHandler=(value) =>{
    const { key, iv } = getKeys();

    const replace_value = decrypt_replace(value)
    const decrypted = CryptoJS.AES.decrypt(replace_value, key, {
      keySize: 256 / 32,
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
  }
  //#endregion

  //#region encryptJSONHandler
  /**
   * Encrypts a JSON object using AES encryption.
   * @name encryptJSONHandler
   * @param {object} value - The JSON object to be encrypted.
   * @returns {string} - The encrypted JSON object as a string.
   * @version 1.0.0
  */
  export let encryptJSONHandler=(value)=> {
 const { key, iv } = getKeys();

    const encrypted = CryptoJS.AES.encrypt(value, key, {
      keySize: 256 / 32,
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypt_replace(encrypted.toString());
  }
  //#endregion

  export let decrypt = (encryptedData) => {
    const { key, iv } = getKeys();

    var stringWithPlusSigns = decrypt_replace(encryptedData);
  
    const decipher = CryptoJS.AES.decrypt(stringWithPlusSigns, CryptoJS.enc.Utf8.parse(key), {
      iv: CryptoJS.enc.Utf8.parse(iv),
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });
  
    return decipher.toString(CryptoJS.enc.Utf8);
  }

  
  export let encrypt = (data) => {
  try {
    if (data !== undefined || data !== '' || data !== null) {
      const { key, iv } = getKeys();

      var data_str = String(data);
      const cipher = CryptoJS.AES.encrypt(data_str, CryptoJS.enc.Utf8.parse(key), {
        iv: CryptoJS.enc.Utf8.parse(iv), // parse the IV 
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
      })

      // e.g. B6AeMHPHkEe7/KHsZ6TW/Q==
      return encrypt_replace(cipher.toString())
    } else {
      return null
    }
  } catch (err) {
    console.error("Error", err.message)
    return null;
  }
}
