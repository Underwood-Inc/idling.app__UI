import {
  detectImageBufferType,
  isBlockedUploadExtension
} from './detectImageBufferType';

/** Minimal JPEG file header (SOI + JFIF marker) */
const minimalJpeg = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01
]);

/** Minimal PNG signature + IHDR chunk length */
const minimalPng = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d
]);

const htmlPayload = Buffer.from('<html><body>alert(1)</body></html>', 'utf8');

describe('detectImageBufferType', () => {
  test('when an upload contains a real JPEG header, detection reports image/jpeg and jpg extension', () => {
    expect(detectImageBufferType(minimalJpeg)).toEqual({
      mimeType: 'image/jpeg',
      extension: 'jpg'
    });
  });

  test('when an upload contains a real PNG header, detection reports image/png and png extension', () => {
    expect(detectImageBufferType(minimalPng)).toEqual({
      mimeType: 'image/png',
      extension: 'png'
    });
  });

  test('when someone renames HTML to .jpg but bytes are still HTML, detection returns null', () => {
    expect(detectImageBufferType(htmlPayload)).toBeNull();
  });

  test('when the buffer is too short to contain a known signature, detection returns null', () => {
    expect(detectImageBufferType(Buffer.from([0xff, 0xd8]))).toBeNull();
  });
});

describe('isBlockedUploadExtension', () => {
  test('when a filename would end in .html, the extension is treated as unsafe for public uploads', () => {
    expect(isBlockedUploadExtension('html')).toBe(true);
  });

  test('when a filename would end in .jpg, the extension is allowed', () => {
    expect(isBlockedUploadExtension('jpg')).toBe(false);
  });
});
