
// works
// import { PutObjectCommand } from "@aws-sdk/client-s3";
// import { v4 as uuidv4 } from "uuid";
// import { getS3Client } from "./techus-awsConfig";
// import CONFIG from "../../../config/config";

// export const uploadFileToS3 = async ({ file, folder }) => {
//   if (!(file instanceof Blob)) {
//     throw new Error("Invalid file object");
//   }

//   const s3 = getS3Client();

//   const ext = file.name.substring(file.name.lastIndexOf("."));
//   const base = file.name.replace(ext, "");
//   const key = `${folder}/${base}_${uuidv4().slice(0, 8)}${ext}`;

//   // Convert File to ArrayBuffer for browser compatibility
//   const arrayBuffer = await file.arrayBuffer();

//   const command = new PutObjectCommand({
//     Bucket: CONFIG.VITE_REACT_APP_AWS_BUCKET, // Use your config
//     Key: key,
//     Body: arrayBuffer, // Use ArrayBuffer instead of File
//     ContentType: file.type || "application/octet-stream"
//   });

//   await s3.send(command);

//   return {
//     name: file.name,
//     size: file.size,
//     s3Path: key
//   };
// };


// 
// import { Upload } from "@aws-sdk/lib-storage";
// import { v4 as uuidv4 } from "uuid";
// import { getS3Client } from "./techus-awsConfig";
// import CONFIG from "../../../config/config";

// export const uploadFileToS3 = async ({ file, folder, onProgress }) => {
//   if (!(file instanceof Blob)) {
//     throw new Error("Invalid file object");
//   }

//   const s3 = getS3Client();
//   const uploadId = uuidv4();

//   const ext = file.name.substring(file.name.lastIndexOf("."));
//   const base = file.name.replace(ext, "");
//   const uniqueName = `${base}_${uuidv4().slice(0, 8)}${ext}`;
//   const key = `${folder}/${uploadId}/${uniqueName}`;

//   const arrayBuffer = await file.arrayBuffer();

//   const upload = new Upload({
//     client: s3,
//     params: {
//       Bucket: CONFIG.VITE_REACT_APP_AWS_BUCKET,
//       Key: key,
//       Body: arrayBuffer,
//       ContentType: file.type || "application/octet-stream",
//     }
//   });

//   // Progress tracking
//   if (onProgress) {
//     upload.on("httpUploadProgress", (progress) => {
//       const percent = Math.round((progress.loaded / progress.total) * 100);
//       onProgress(percent);
//     });
//   }

//   await upload.done();

//   return {
//     name: file.name,
//     size: file.size,
//     s3Path: key,
//     uploadId: uploadId,
//   };
// };


import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";
import { getS3Client } from "./techus-awsConfig";
import CONFIG from "../../../config/config";

export const uploadFileToS3 = async ({ file, folder, onProgress }) => {
  if (!(file instanceof Blob)) {
    throw new Error("Invalid file object");
  }

  const s3 = getS3Client();
  const uploadId = uuidv4();

  const ext = file.name.substring(file.name.lastIndexOf("."));
  const base = file.name.replace(ext, "");
  const uniqueName = `${base}_${uuidv4().slice(0, 8)}${ext}`;
  const key = `${folder}/${uploadId}/${uniqueName}`;

  // Use File/Blob directly - no need to convert!
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: CONFIG.VITE_REACT_APP_AWS_BUCKET,
      Key: key,
      Body: file, // Use file directly (it's a Blob)
      ContentType: file.type || "application/octet-stream",
    }
  });

  // Progress tracking
  if (onProgress) {
    upload.on("httpUploadProgress", (progress) => {
      const percent = Math.round((progress.loaded / progress.total) * 100);
      onProgress(percent);
    });
  }

  await upload.done();

  return {
    name: file.name,
    size: file.size,
    s3Path: key,
    uploadId: uploadId,
  };
};
// 
// import { Upload } from "@aws-sdk/lib-storage";

// export const uploadFileToS3 = async ({ file, folder, onProgress }) => {
//   if (!(file instanceof Blob)) {
//     throw new Error("Invalid file object");
//   }

//   const s3 = getS3Client();

//   const ext = file.name.substring(file.name.lastIndexOf("."));
//   const base = file.name.replace(ext, "");
//   const key = `${folder}/${base}_${uuidv4().slice(0, 8)}${ext}`;

//   const arrayBuffer = await file.arrayBuffer();

//   const upload = new Upload({
//     client: s3,
//     params: {
//       Bucket: CONFIG.VITE_REACT_APP_AWS_BUCKET,
//       Key: key,
//       Body: arrayBuffer,
//       ContentType: file.type || "application/octet-stream"
//     }
//   });

//   // Optional progress tracking
//   if (onProgress) {
//     upload.on("httpUploadProgress", (progress) => {
//       const percent = Math.round((progress.loaded / progress.total) * 100);
//       onProgress(percent);
//     });
//   }

//   await upload.done();

//   return {
//     name: file.name,
//     size: file.size,
//     s3Path: key
//   };
// };