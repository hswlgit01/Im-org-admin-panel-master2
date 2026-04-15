import { API_URL } from '@/config';
import SparkMD5 from 'spark-md5';
import { v4 } from 'uuid';

// api
const handleResponse = async (res: Response) => {
  if (!res.ok) {
    throw new Error(res.statusText);
  }
  const data = await res.json();
  if (data.errCode !== 0) {
    throw new Error(data.errMsg);
  }
  return data.data;
};

export const getUploadPartsize = (size: number): Promise<{ size: number }> =>
  fetch(`${API_URL}/object/part_size`, {
    method: 'POST',
    headers: {
      operationID: v4(),
      token: localStorage.getItem('IMAdminToken') || '',
    },
    body: JSON.stringify({
      size,
    }),
  }).then(handleResponse);

export const getUploadUrl = (
  params: API.SplitUpload.UploadParams,
): Promise<API.SplitUpload.UploadData> =>
  fetch(`${API_URL}/object/initiate_multipart_upload`, {
    method: 'POST',
    headers: {
      operationID: v4(),
      token: localStorage.getItem('IMAdminToken') || '',
    },
    body: JSON.stringify(params),
  }).then(handleResponse);

export const confirmUpload = (params: API.SplitUpload.ConfirmData): Promise<{ url: string }> =>
  fetch(`${API_URL}/object/complete_multipart_upload`, {
    method: 'POST',
    headers: {
      operationID: v4(),
      token: localStorage.getItem('IMAdminToken') || '',
    },
    body: JSON.stringify(params),
  }).then(handleResponse);

// common
const mimeTypesMap: Record<string, string> = {
  txt: 'text/plain',
  html: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  json: 'application/json',
  csv: 'text/csv',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  wav: 'audio/wav',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xml: 'application/xml',
  zip: 'application/zip',
  tar: 'application/x-tar',
  '7z': 'application/x-7z-compressed',
  rar: 'application/vnd.rar',
  ogg: 'audio/ogg',
  midi: 'audio/midi',
  webm: 'audio/webm',
  avi: 'video/x-msvideo',
  mpeg: 'video/mpeg',
  ts: 'video/mp2t',
  mov: 'video/quicktime',
  wmv: 'video/x-ms-wmv',
  flv: 'video/x-flv',
  mkv: 'video/x-matroska',
  webp: 'image/webp',
  heic: 'image/heic',
  psd: 'image/vnd.adobe.photoshop',
  ai: 'application/postscript',
  eps: 'application/postscript',
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
  jsonld: 'application/ld+json',
  ics: 'text/calendar',
  sh: 'application/x-sh',
  php: 'application/x-httpd-php',
  jar: 'application/java-archive',
};

export const getMimeType = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  return mimeTypesMap[extension] || 'application/octet-stream';
};

export const splitUpload = async (file: File): Promise<{ url?: string; error?: Error }> => {
  try {
    const fileName = `${localStorage.getItem('IMUserID')}/${file.name}`;
    const contentType = getMimeType(file.name);
    const { size: partSize } = await getUploadPartsize(file.size);
    const chunks = Math.ceil(file.size / partSize);
    const chunkGapList: { start: number; end: number }[] = [];
    const chunkHashList: string[] = [];
    const fileSpark = new SparkMD5.ArrayBuffer();
    let currentChunk = 0;

    while (currentChunk < chunks) {
      const start = currentChunk * partSize;
      const end = Math.min(start + partSize, file.size);
      const chunk = file.slice(start, end);
      chunkGapList.push({ start, end });

      // Use a self-invoking function to capture the currentChunk index
      const chunkHash = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(chunk);
        reader.onload = (e) => {
          if (e.target) {
            fileSpark.append(e.target.result as ArrayBuffer);
            resolve(fileSpark.end());
          }
        };
        reader.onerror = (err) => reject(err);
      });
      chunkHashList.push(chunkHash);
      currentChunk++;
    }

    const totalFileHash = chunkHashList.join(',');
    fileSpark.destroy();
    const textSpark = new SparkMD5();
    textSpark.append(totalFileHash);
    const { url: finishUrl, upload } = await getUploadUrl({
      hash: textSpark.end(),
      size: file.size,
      partSize,
      maxParts: -1,
      cause: '',
      name: fileName,
      contentType,
    });
    textSpark.destroy();
    if (finishUrl) {
      return {
        url: finishUrl,
      };
    }

    let uploadParts = upload.sign.parts;
    const signQuery = upload.sign.query;
    const signHeader = upload.sign.header;

    // Use Promise.all to wait for all PUT operations to complete
    await Promise.all(
      uploadParts.map(async (part, idx) => {
        const url = part.url || upload.sign.url;
        const rawUrl = new URL(url);
        if (signQuery) {
          const params = new URLSearchParams(rawUrl.search);
          signQuery.forEach((item) => {
            params.set(item.key, item.values[0]);
          });
          rawUrl.search = params.toString();
        }
        if (part.query) {
          const params = new URLSearchParams(rawUrl.search);
          part.query.forEach((item) => {
            params.set(item.key, item.values[0]);
          });
          rawUrl.search = params.toString();
        }
        const putUrl = rawUrl.toString();
        const headers = new Headers();
        if (signHeader) {
          signHeader.forEach((item) => {
            headers.set(item.key, item.values[0]);
          });
        }
        if (part.header) {
          part.header.forEach((item) => {
            headers.set(item.key, item.values[0]);
          });
        }
        headers.set('Content-Length', (chunkGapList[idx].end - chunkGapList[idx].start).toString());

        const response = await fetch(putUrl, {
          method: 'PUT',
          headers,
          body: file.slice(chunkGapList[idx].start, chunkGapList[idx].end),
        });

        if (!response.ok) {
          throw new Error(`Failed to upload chunk ${idx + 1}`);
        }
      }),
    );

    const { url } = await confirmUpload({
      uploadID: upload.uploadID,
      parts: chunkHashList,
      cause: '',
      name: fileName,
      contentType,
    });
    return { url };
  } catch (error) {
    console.error('Upload failed:', error);
    return { error: error as Error };
  }
};
