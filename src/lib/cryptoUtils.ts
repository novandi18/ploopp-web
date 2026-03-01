// Constants matching Android's logic
const PBKDF2_ITERATIONS = 600000;
const HASH_ALGO = "SHA-256";
const AES_ALGO = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16; // 128 bits for salt

/**
 * Derives a key from a password and salt using PBKDF2.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGO,
    },
    passwordKey,
    { name: AES_ALGO, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Hashes a password (e.g., for verifying without revealing the password itself).
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest(HASH_ALGO, data);
  return bytesToBase64(new Uint8Array(hash));
}

/**
 * Encrypts data using AES-GCM-256 with PBKDF2 key derivation.
 * The payload structure is: [16 bytes SALT] + [12 bytes IV] + [Ciphertext + Tag]
 */
export async function encryptData(text: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  // Derive key
  const key = await deriveKey(password, salt);
  
  // Encrypt
  const data = encoder.encode(text);
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: AES_ALGO, iv: iv },
    key,
    data
  );
  
  // Concatenate Salt + IV + Ciphertext
  const ciphertext = new Uint8Array(encryptedBuffer);
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(ciphertext, salt.length + iv.length);
  
  return bytesToBase64(combined);
}

/**
 * Decrypts a base64 string encrypted by `encryptData`.
 * The payload structure is: [16 bytes SALT] + [12 bytes IV] + [Ciphertext + Tag]
 */
export async function decryptData(encryptedBase64: string, password: string): Promise<string> {
  const combined = base64ToBytes(encryptedBase64);
  
  // Extract Salt and IV
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);
  
  // Derive key
  const key = await deriveKey(password, salt);
  
  // Decrypt
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: AES_ALGO, iv: iv },
    key,
    ciphertext
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

// --- Utils ---
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
