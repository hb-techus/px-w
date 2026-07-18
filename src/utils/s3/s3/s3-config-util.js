import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { showToast } from '../../../genriccomponents/techus-ToastNotification';
import { GetAWSAccessKey } from '../../../services/techus-services';

let s3Instance = null;

export const initializeS3 = async () => {
  try {
    // Initialize only once
    if (!s3Instance) {
      const response = await GetAWSAccessKey();

      if (!response.valid || !response.data) {
        showToast('error', 'Failed to fetch AWS credentials', 'top-center');
        return null;
      }

      const credentials = response.data;

      const accessKey = credentials.find(a => a.key_name === "REACT_APP_AWS_ACCESS_KEY_ID")?.key_access;
      const secretKey = credentials.find(a => a.key_name === "REACT_APP_S3_SECRET_ACCESS_KEY")?.key_access;
      const region = process.env.REACT_APP_S3_REGION || 'us-east-1';

      if (!accessKey || !secretKey) {
        showToast('error', 'Invalid AWS credentials', 'top-center');
        return null;
      }

      // Create new modular S3 client (no deprecated querystring usage)
      s3Instance = new S3Client({
        region,
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey
        }
      });
    }

    return s3Instance;
  } catch (error) {
    console.error('S3 initialization error:', error);
    showToast('error', 'Failed to initialize AWS S3', 'top-center');
    return null;
  }
};

// Singleton getter for the S3 instance
export const getS3 = async () => {
  if (!s3Instance) {
    return await initializeS3();
  }
  return s3Instance;
};

// Optional: Example utility functions using v3 commands
export const uploadToS3 = async (bucketName, key, file) => {
  try {
    const s3 = await getS3();

    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: file
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    showToast('success', 'File uploaded successfully!', 'top-center');
  } catch (error) {
    console.error('S3 Upload Error:', error);
    showToast('error', 'Failed to upload to S3', 'top-center');
  }
};

export const getObjectFromS3 = async (bucketName, key) => {
  try {
    const s3 = await getS3();
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    const response = await s3.send(command);
    return response;
  } catch (error) {
    console.error('S3 GetObject Error:', error);
    showToast('error', 'Failed to retrieve file from S3', 'top-center');
    return null;
  }
};
