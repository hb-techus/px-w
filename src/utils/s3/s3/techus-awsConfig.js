import { S3Client } from '@aws-sdk/client-s3';
import CONFIG from '../../../config/config';

let s3Client = null;

export const getS3Client = () => {
  if (s3Client) return s3Client;

  s3Client = new S3Client({
    region: CONFIG.VITE_REACT_APP_S3_REGION,
    credentials: {
      accessKeyId: CONFIG.VITE_REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: CONFIG.VITE_REACT_APP_S3_SECRET_ACCESS_KEY
    }
  });

  return s3Client;
};