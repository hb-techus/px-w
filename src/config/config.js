/***************************************************************************************
 * @module       Configuration 
 * @name         config
 * @description  Application configuration settings for different environments
 * @version      1.0.0
 * @license      Licensed under the MIT License
 * @createdon    October 2025
 * @since        1.0
 ***************************************************************************************/

const CONFIG = {
   
} 


if (process.env.VITE_ENV === 'LOCAL') {
  CONFIG.VITE_ENV= 'LOCAL';
  CONFIG.VITE_API_URL= "http://localhost:3002/api/v1";
  CONFIG.VITE_SOCKET_URL= 'http://localhost:3002';
  CONFIG.VITE_SITE_URL= 'http://localhost:4000/';
  CONFIG.VITE_AWS_END_POINT = 'https://constructionai-dev.s3.us-east-1.amazonaws.com'; //process.env.AWS_END_POINT;
  CONFIG.VITE_AWS_ENDPOINT= 'https://constructionai-dev.s3.us-east-1.amazonaws.com';
  CONFIG.VITE_S3_PATH= 'https://constructionai-dev.s3.us-east-1.amazonaws.com/';
  CONFIG.VITE_ML_TARGET_URL= '';
  CONFIG.VITE_REACT_APP_AWS_BUCKET= '';
  CONFIG.VITE_TIMEOUT= 10000;
  CONFIG.VITE_MINCHAR= 3;
  CONFIG.VITE_MAXCHAR= 100;
  CONFIG.VITE_CONTENT_LEGNTH= 2000;
  CONFIG.VITE_REACT_APP_AES_ENC_SECRET_KEY= process.env.VITE_REACT_APP_AES_ENC_SECRET_KEY
  CONFIG.VITE_REACT_APP_AES_ENC_IV= process.env.VITE_REACT_APP_AES_ENC_IV;
  CONFIG.VITE_REACT_APP_LANDING_AUTHORIZATION_KEY= process.env.VITE_REACT_APP_LANDING_AUTHORIZATION_KEY;
  CONFIG.VITE_REACT_APP_SESSION_PREFIX= "prexoai_";
  CONFIG.VITE_REACT_APP_S3_REGION= 'us-east-1';
  CONFIG.VITE_REACT_APP_AWS_ACCESS_KEY_ID= '';
  CONFIG.VITE_REACT_APP_S3_SECRET_ACCESS_KEY= '';
  CONFIG.VITE_REACT_APP_AWS_ACL= 'public-read';
  CONFIG.VITE_BASE_URL=''
  CONFIG.VITE_USERBACK_TOKEN=process.env.VITE_USERBACK_TOKEN;
  CONFIG.IS_DEVELOPMENT = 1;
}
if (process.env.VITE_ENV === 'DEV') {  
  CONFIG.VITE_ENV= 'DEV';
  CONFIG.VITE_API_URL= "https://dev-apis.prexoai.com/api/v1/";
  CONFIG.VITE_SOCKET_URL= 'https://dev-apis.prexoai.com';
  CONFIG.VITE_SITE_URL= 'https://dev.prexoai.com';
  CONFIG.VITE_AWS_END_POINT = 'https://constructionai-dev.s3.us-east-1.amazonaws.com'; //process.env.AWS_END_POINT;
  CONFIG.VITE_AWS_ENDPOINT= 'https://constructionai-dev.s3.us-east-1.amazonaws.com';
  CONFIG.VITE_S3_PATH= 'https://constructionai-dev.s3.us-east-1.amazonaws.com/';
  CONFIG.VITE_ML_TARGET_URL= '';
  CONFIG.VITE_REACT_APP_AWS_BUCKET= '';
  CONFIG.VITE_TIMEOUT= 10000;
  CONFIG.VITE_MINCHAR= 3;
  CONFIG.VITE_MAXCHAR= 25;
  CONFIG.CONTENT_LEGNTH= 2000;
  CONFIG.VITE_REACT_APP_AES_ENC_SECRET_KEY= process.env.VITE_REACT_APP_AES_ENC_SECRET_KEY
  CONFIG.VITE_REACT_APP_AES_ENC_IV= process.env.VITE_REACT_APP_AES_ENC_IV;
  CONFIG.VITE_REACT_APP_LANDING_AUTHORIZATION_KEY= process.env.VITE_REACT_APP_LANDING_AUTHORIZATION_KEY;
  CONFIG.VITE_REACT_APP_SESSION_PREFIX= "prexoai_";
  CONFIG.VITE_REACT_APP_S3_REGION= 'us-east-1';
  CONFIG.VITE_REACT_APP_AWS_ACCESS_KEY_ID= '';
  CONFIG.VITE_REACT_APP_S3_SECRET_ACCESS_KEY='';
  CONFIG.VITE_REACT_APP_AWS_ACL= 'public-read';
  CONFIG.VITE_BASE_URL='projects/prexoai_dev_871563/admin/'  //based an the client server setup main path to subpath
  CONFIG.VITE_USERBACK_TOKEN=process.env.VITE_USERBACK_TOKEN;
  CONFIG.IS_DEVELOPMENT = 1;
}
else if (process.env.VITE_ENV === 'QA') {
    CONFIG.VITE_ENV= 'QA';
  CONFIG.VITE_API_URL= "https://qa-apis.prexoai.com/api/v1/";
  CONFIG.VITE_SOCKET_URL= 'https://qa-apis.prexoai.com';
  CONFIG.VITE_SITE_URL= 'https://qa.prexoai.com';
  CONFIG.VITE_AWS_END_POINT = 'https://constructionai-qa.s3.us-east-1.amazonaws.com/'; //process.env.AWS_END_POINT;
  CONFIG.VITE_AWS_ENDPOINT= 'https://constructionai-qa.s3.us-east-1.amazonaws.com';
  CONFIG.VITE_S3_PATH= 'https://constructionai-qa.s3.us-east-1.amazonaws.com/';
  CONFIG.VITE_ML_TARGET_URL= '';
  CONFIG.VITE_REACT_APP_AWS_BUCKET= '';
  CONFIG.VITE_TIMEOUT= 10000;
  CONFIG.VITE_MINCHAR= 3;
  CONFIG.VITE_MAXCHAR= 25;
  CONFIG.CONTENT_LEGNTH= 2000;
  CONFIG.VITE_REACT_APP_AES_ENC_SECRET_KEY= process.env.VITE_REACT_APP_AES_ENC_SECRET_KEY;
  CONFIG.VITE_REACT_APP_AES_ENC_IV= process.env.VITE_REACT_APP_AES_ENC_IV;
  CONFIG.VITE_REACT_APP_LANDING_AUTHORIZATION_KEY= process.env.VITE_REACT_APP_LANDING_AUTHORIZATION_KEY;
  CONFIG.VITE_REACT_APP_SESSION_PREFIX= "prexoai_";
  CONFIG.VITE_REACT_APP_S3_REGION= 'us-east-1';
  CONFIG.VITE_REACT_APP_AWS_ACCESS_KEY_ID= '';
  CONFIG.VITE_REACT_APP_S3_SECRET_ACCESS_KEY='';
  CONFIG.VITE_REACT_APP_AWS_ACL= 'public-read';
  CONFIG.VITE_BASE_URL=''  //based an the client server setup main path to subpath
  CONFIG.VITE_USERBACK_TOKEN=process.env.VITE_USERBACK_TOKEN;
  CONFIG.IS_DEVELOPMENT = 0;
}
else if (process.env.VITE_ENV === 'STAGING') {
  CONFIG.VITE_ENV= 'STAGING';
  CONFIG.VITE_API_URL= "https://web-apis-staging.prexo.ai/api/v1/";
  CONFIG.VITE_SOCKET_URL= 'https://web-apis-staging.prexo.ai';
  CONFIG.VITE_SITE_URL= 'https://staging.prexo.ai';
  CONFIG.VITE_AWS_END_POINT = 'https://prexo-staging.s3.us-east-1.amazonaws.com'; //process.env.AWS_END_POINT;
  CONFIG.VITE_AWS_ENDPOINT= 'https://prexo-staging.s3.us-east-1.amazonaws.com';
  CONFIG.VITE_S3_PATH= 'https://prexo-staging.s3.us-east-1.amazonaws.com/';
  CONFIG.VITE_ML_TARGET_URL= '';
  CONFIG.VITE_REACT_APP_AWS_BUCKET= '';
  CONFIG.VITE_TIMEOUT= 10000;
  CONFIG.VITE_MINCHAR= 3;
  CONFIG.VITE_MAXCHAR= 25;
  CONFIG.CONTENT_LEGNTH= 2000;
  CONFIG.VITE_REACT_APP_AES_ENC_SECRET_KEY= process.env.VITE_REACT_APP_AES_ENC_SECRET_KEY
  CONFIG.VITE_REACT_APP_AES_ENC_IV= process.env.VITE_REACT_APP_AES_ENC_IV;
  CONFIG.VITE_REACT_APP_LANDING_AUTHORIZATION_KEY= process.env.VITE_REACT_APP_LANDING_AUTHORIZATION_KEY;
  CONFIG.VITE_REACT_APP_SESSION_PREFIX= "prexoai_";
  CONFIG.VITE_REACT_APP_S3_REGION= 'us-east-1';
  CONFIG.VITE_REACT_APP_AWS_ACCESS_KEY_ID= '';
  CONFIG.VITE_REACT_APP_S3_SECRET_ACCESS_KEY='';
  CONFIG.VITE_REACT_APP_AWS_ACL= 'public-read';
  CONFIG.VITE_BASE_URL=''  //based an the client server setup main path to subpath
  CONFIG.VITE_USERBACK_TOKEN=process.env.VITE_USERBACK_TOKEN;
  CONFIG.IS_DEVELOPMENT = 0;
}
else if (process.env.ENV === 'TEST') {
  CONFIG.ENV= 'TEST';
 
}
else if (process.env.VITE_ENV === 'DEMO') {
  CONFIG.VITE_ENV= 'DEMO';
  CONFIG.VITE_API_URL= "https://web-apis-demo.prexo.ai/api/v1/";
  CONFIG.VITE_SOCKET_URL= 'https://web-apis-demo.prexo.ai';
  CONFIG.VITE_SITE_URL= 'https://demo.prexo.ai';
  CONFIG.VITE_AWS_END_POINT = 'https://prexo-demo.s3.us-east-1.amazonaws.com'; 
  CONFIG.VITE_AWS_ENDPOINT= 'https://prexo-demo.s3.us-east-1.amazonaws.com';
  CONFIG.VITE_S3_PATH= 'https://prexo-demo.s3.us-east-1.amazonaws.com/';
  CONFIG.VITE_ML_TARGET_URL= '';
  CONFIG.VITE_REACT_APP_AWS_BUCKET= 'prexo-demo';
  CONFIG.VITE_TIMEOUT= 10000;
  CONFIG.VITE_MINCHAR= 3;
  CONFIG.VITE_MAXCHAR= 25;
  CONFIG.CONTENT_LEGNTH= 2000;
  CONFIG.VITE_REACT_APP_AES_ENC_SECRET_KEY= process.env.VITE_REACT_APP_AES_ENC_SECRET_KEY
  CONFIG.VITE_REACT_APP_AES_ENC_IV= process.env.VITE_REACT_APP_AES_ENC_IV;
  CONFIG.VITE_REACT_APP_LANDING_AUTHORIZATION_KEY= process.env.VITE_REACT_APP_LANDING_AUTHORIZATION_KEY;
  CONFIG.VITE_REACT_APP_SESSION_PREFIX= "prexoai_";
  CONFIG.VITE_REACT_APP_S3_REGION= 'us-east-1';
  CONFIG.VITE_REACT_APP_AWS_ACCESS_KEY_ID= '';
  CONFIG.VITE_REACT_APP_S3_SECRET_ACCESS_KEY='';
  CONFIG.IS_DEVELOPMENT = 0;
}
else if (process.env.VITE_ENV === 'LIVE') {
  CONFIG.VITE_ENV= 'LIVE';
  CONFIG.VITE_API_URL= "https://web-apis-live.prexo.ai/api/v1/";
  CONFIG.VITE_SOCKET_URL= 'https://web-apis-live.prexo.ai';
  CONFIG.VITE_SITE_URL= 'https://app.prexo.ai';
  CONFIG.VITE_AWS_END_POINT = 'https://prexo-live.s3.us-east-1.amazonaws.com'; 
  CONFIG.VITE_AWS_ENDPOINT= 'https://prexo-live.s3.us-east-1.amazonaws.com';
  CONFIG.VITE_S3_PATH= 'https://prexo-live.s3.us-east-1.amazonaws.com/';
  CONFIG.VITE_ML_TARGET_URL= '';
  CONFIG.VITE_REACT_APP_AWS_BUCKET= 'prexo-live';
  CONFIG.VITE_TIMEOUT= 10000;
  CONFIG.VITE_MINCHAR= 3;
  CONFIG.VITE_MAXCHAR= 25;
  CONFIG.CONTENT_LEGNTH= 2000;
  CONFIG.VITE_REACT_APP_AES_ENC_SECRET_KEY= process.env.VITE_REACT_APP_AES_ENC_SECRET_KEY
  CONFIG.VITE_REACT_APP_AES_ENC_IV= process.env.VITE_REACT_APP_AES_ENC_IV;
  CONFIG.VITE_REACT_APP_LANDING_AUTHORIZATION_KEY= process.env.VITE_REACT_APP_LANDING_AUTHORIZATION_KEY;
  CONFIG.VITE_REACT_APP_SESSION_PREFIX= "prexoai_";
  CONFIG.VITE_REACT_APP_S3_REGION= 'us-east-1';
  CONFIG.VITE_REACT_APP_AWS_ACCESS_KEY_ID= '';
  CONFIG.VITE_REACT_APP_S3_SECRET_ACCESS_KEY='';
  CONFIG.IS_DEVELOPMENT = 0;
}
export default CONFIG;

