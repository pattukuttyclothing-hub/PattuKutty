import type { Request } from "express";

export interface FilePayload {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const ALLOWED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/ogg",
  "audio/opus",
  "audio/m4a",
  "audio/x-m4a",
  "audio/mp4",
  "audio/aac",
  "audio/3gpp",
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
  "video/3gpp",
  "video/x-m4v",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB for images/audio
const MAX_VIDEO_FILE_SIZE = 100 * 1024 * 1024; // 100 MB for video reels

function createUploadError(message: string, statusCode: number = 400): Error {
  const err = new Error(message);
  (err as unknown as { statusCode: number }).statusCode = statusCode;
  return err;
}

export async function parseAndValidateUpload(
  req: Request,
  expectedType: "image" | "audio" | "video" | "any" = "image"
): Promise<FilePayload> {
  const contentType = (req.headers["content-type"] as string) || (expectedType === "audio" ? "audio/webm" : "image/jpeg");
  const rawFileNameHeader = (req.headers["x-file-name"] as string) || "";
  const headerFileName = rawFileNameHeader ? decodeURIComponent(rawFileNameHeader) : "";

  let filePayload: FilePayload | null = null;

  // 1. Direct Buffer in req.body or req.rawBody (from express.raw middleware or Worker)
  const existingBuffer = Buffer.isBuffer(req.body) && req.body.length > 0
    ? req.body
    : Buffer.isBuffer((req as any).rawBody) && (req as any).rawBody.length > 0
    ? (req as any).rawBody
    : null;

  if (existingBuffer) {
    if (contentType.includes("multipart/form-data")) {
      const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
      const boundary = boundaryMatch ? boundaryMatch[1] || boundaryMatch[2] : null;
      if (boundary) {
        filePayload = extractMultipartFile(existingBuffer, boundary);
      }
    }
    if (!filePayload) {
      filePayload = {
        buffer: existingBuffer,
        fileName: headerFileName || `file_${Date.now()}`,
        mimeType: contentType.split(";")[0].trim().toLowerCase(),
      };
    }
  }

  // 2. Base64 payload in JSON body
  if (!filePayload && req.body && typeof req.body === "object" && req.body.base64Data) {
    const base64Str = String(req.body.base64Data).replace(/^data:[^;]+;base64,/, "");
    const buf = Buffer.from(base64Str, "base64");
    filePayload = {
      buffer: buf,
      fileName: req.body.fileName || headerFileName || `file_${Date.now()}`,
      mimeType: (req.body.fileType || contentType.split(";")[0]).trim().toLowerCase(),
    };
  }

  // 3. Raw Stream chunks if req body was not populated by middleware or rawBody
  if (!filePayload) {
    const chunks: Buffer[] = [];
    try {
      for await (const chunk of req) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
    } catch {
      /* ignore stream read error */
    }
    const rawBuffer = Buffer.concat(chunks);

    if (rawBuffer.length > 0) {
      if (contentType.includes("multipart/form-data")) {
        const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
        const boundary = boundaryMatch ? boundaryMatch[1] || boundaryMatch[2] : null;
        if (boundary) {
          filePayload = extractMultipartFile(rawBuffer, boundary);
        }
      }

      if (!filePayload) {
        filePayload = {
          buffer: rawBuffer,
          fileName: headerFileName || `file_${Date.now()}`,
          mimeType: contentType.split(";")[0].trim().toLowerCase(),
        };
      }
    }
  }

  if (!filePayload || !filePayload.buffer || filePayload.buffer.length === 0) {
    throw createUploadError(
      expectedType === "audio"
        ? "Empty or invalid voice note audio payload. Please record audio before uploading."
        : "Empty or invalid image payload. Please select a valid file to upload.",
      400
    );
  }

  // Size Validation
  const maxAllowed = expectedType === "video" ? MAX_VIDEO_FILE_SIZE : MAX_FILE_SIZE;
  if (filePayload.buffer.length > maxAllowed) {
    throw createUploadError(
      `File size (${(filePayload.buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of ${maxAllowed / (1024 * 1024)} MB.`,
      400
    );
  }

  // Strip codecs from MIME type (e.g. "audio/webm;codecs=opus" -> "audio/webm")
  let mimeType = (filePayload.mimeType || "").split(";")[0].trim().toLowerCase();

  if (!mimeType || mimeType === "application/octet-stream" || mimeType === "multipart/form-data") {
    const ext = filePayload.fileName.split(".").pop()?.toLowerCase();
    if (ext === "png") mimeType = "image/png";
    else if (ext === "webp") mimeType = "image/webp";
    else if (ext === "gif") mimeType = "image/gif";
    else if (ext === "svg") mimeType = "image/svg+xml";
    else if (ext === "webm") mimeType = "audio/webm";
    else if (ext === "mp3") mimeType = "audio/mpeg";
    else if (ext === "wav") mimeType = "audio/wav";
    else mimeType = expectedType === "audio" ? "audio/webm" : "image/jpeg";
  }

  // Format Type Validation
  if (expectedType === "image" && !ALLOWED_IMAGE_TYPES.has(mimeType)) {
    throw createUploadError(
      `Invalid image format '${mimeType}'. Allowed image formats: JPEG, PNG, WEBP, GIF, SVG.`,
      415
    );
  }

  if (expectedType === "audio" && !ALLOWED_AUDIO_TYPES.has(mimeType)) {
    throw createUploadError(
      `Invalid audio format '${mimeType}'. Allowed audio formats: WEBM, MP3, WAV, AAC, M4A, OGG, MP4.`,
      415
    );
  }

  return {
    buffer: filePayload.buffer,
    fileName: filePayload.fileName,
    mimeType,
  };
}

function extractMultipartFile(rawBuffer: Buffer, boundary: string): FilePayload | null {
  const boundaryBuf = Buffer.from(`--${boundary}`);
  const parts: Buffer[] = [];
  let start = 0;

  while (start < rawBuffer.length) {
    const idx = rawBuffer.indexOf(boundaryBuf, start);
    if (idx === -1) break;
    if (start !== 0) {
      parts.push(rawBuffer.subarray(start, idx));
    }
    start = idx + boundaryBuf.length;
  }

  for (const part of parts) {
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;

    const headersStr = part.subarray(0, headerEnd).toString("utf8");
    let content = part.subarray(headerEnd + 4);

    if (content.length >= 2 && content[content.length - 2] === 13 && content[content.length - 1] === 10) {
      content = content.subarray(0, content.length - 2);
    }

    const filenameMatch = headersStr.match(/filename="([^"]+)"/i);
    const contentTypeMatch = headersStr.match(/content-type:\s*([^\r\n]+)/i);

    if (filenameMatch || contentTypeMatch || content.length > 0) {
      return {
        buffer: content,
        fileName: filenameMatch ? filenameMatch[1] : `file_${Date.now()}`,
        mimeType: contentTypeMatch ? contentTypeMatch[1].trim() : "image/jpeg",
      };
    }
  }

  return null;
}
