export interface DetectedImageBufferType {
  mimeType: string;
  extension: string;
}

const BLOCKED_UPLOAD_EXTENSIONS = new Set([
  'html',
  'htm',
  'svg',
  'xhtml',
  'xml',
  'js',
  'mjs',
  'php'
]);

export function isBlockedUploadExtension(extension: string): boolean {
  return BLOCKED_UPLOAD_EXTENSIONS.has(extension.toLowerCase());
}

export function detectImageBufferType(buffer: Buffer): DetectedImageBufferType | null {
  if (buffer.length < 12) {
    return null;
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { mimeType: 'image/png', extension: 'png' };
  }

  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { mimeType: 'image/gif', extension: 'gif' };
  }

  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mimeType: 'image/webp', extension: 'webp' };
  }

  return null;
}
