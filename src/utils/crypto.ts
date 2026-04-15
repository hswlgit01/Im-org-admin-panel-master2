import JSEncrypt from 'jsencrypt';

// 生成 RSA 密钥对
export const generateRSAKeyPair = () => {
  const encrypt = new JSEncrypt();
  const privateKey = encrypt.getPrivateKey();
  const publicKey = encrypt.getPublicKey();
  return { privateKey, publicKey };
};

// 解密 AES 密钥
export const decryptAESKey = (encryptedAESKey: string, privateKey: string) => {
  const encrypt = new JSEncrypt();
  encrypt.setPrivateKey(privateKey);
  return encrypt.decrypt(encryptedAESKey);
};

const ensureKeyLength = (keyBase64: string) => {
  if (!keyBase64) {
    throw new Error('AES 密钥为空');
  }
  const keyBuffer = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));
  if (keyBuffer.length !== 32) {
    throw new Error('AES 密钥长度必须为 256 位（32 字节）');
  }
  return keyBuffer;
};
export const aesEncrypt = async (plaintext: string) => {
  const aesKey = localStorage.getItem('AES_KEY');

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const aesKeyBuffer = ensureKeyLength(aesKey);
    console.log(aesKey, 'qweasdd');
    const aesCryptoKey = await window.crypto.subtle.importKey(
      'raw',
      aesKeyBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt'],
    );
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      aesCryptoKey,
      data,
    );
    const encryptedData = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
    return btoa(String.fromCharCode.apply(null, encryptedData));
  } catch (error) {
    console.error('加密出错:', error);
    return null;
  }
};
