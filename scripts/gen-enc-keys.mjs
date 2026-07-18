/**
 * Run this script once whenever you change the AES key or IV.
 * It produces the obfuscated values to put in your .env files.
 *
 * Usage:
 *   node scripts/gen-enc-keys.mjs <plain_key> <plain_iv>
 *
 * Example:
 *   node scripts/gen-enc-keys.mjs MyAesSecretKey12 MyIvValue123456!
 *
 * Then copy the output into your .env files:
 *   VITE_REACT_APP_AES_ENC_SECRET_KEY=<output_key>
 *   VITE_REACT_APP_AES_ENC_IV=<output_iv>
 *
 * IMPORTANT: Keep this script and the _KS salt in techus-SecureServiceUtils.js in sync.
 * The salt below must match _KS in techus-SecureServiceUtils.js exactly.
 */

const _KS = [0x5f,0x3a,0x71,0x2c,0x48,0x9e,0x1d,0x63,0x87,0xb2,0x4f,0x06,0xd5,0x3c,0x9a,0x51,
             0x7e,0x22,0xc8,0x15,0x6b,0xf0,0x38,0x4d,0x92,0xa6,0x0b,0xe7,0x29,0x55,0x80,0xce];

function obfuscate(plaintext) {
  const bytes = Buffer.from(plaintext, 'utf8');
  const xored = bytes.map((b, i) => b ^ _KS[i % _KS.length]);
  return Buffer.from(xored).toString('base64');
}

const [,, key, iv] = process.argv;

if (!key || !iv) {
  console.error('Usage: node scripts/gen-enc-keys.mjs <plain_key> <plain_iv>');
  process.exit(1);
}

console.log('\nPaste these into your .env files:\n');
console.log(`VITE_REACT_APP_AES_ENC_SECRET_KEY=${obfuscate(key)}`);
console.log(`VITE_REACT_APP_AES_ENC_IV=${obfuscate(iv)}`);
console.log('\nDone. Never commit plain keys.');
