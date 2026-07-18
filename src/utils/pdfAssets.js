import coverImage from '../assets/Images/pdf_images/Cover_Img.png';
import logoImage from '../assets/Images/pdf_images/logo.webp';
import aiIcon from '../assets/Images/pdf_images/AI_fill_white.webp';
import DefaultLogo from '../assets/Images/default_images/Default-Logo-V2.png'
const getMimeType = (url, response) => {
  const responseType = response.headers.get('content-type');
  if (responseType) {
    return responseType.split(';')[0];
  }

  const pathname = new URL(url, window.location.href).pathname.toLowerCase();
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  if (pathname.endsWith('.gif')) return 'image/gif';
  return 'image/webp';
};

async function toBase64(url) {
  const res = await fetch(url);
  const mimeType = getMimeType(url, res);
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

let _cache = null;

export async function getPdfAssets() {
  if (_cache) return _cache;
  const [coverBg, companyLogo, aiIconBase64, defaultLogo] = await Promise.all([
    toBase64(coverImage),
    toBase64(logoImage),
    toBase64(aiIcon),
    toBase64(DefaultLogo),
  ]);
  _cache = { coverBg, companyLogo, aiIconBase64, defaultLogo };
  return _cache;
}
