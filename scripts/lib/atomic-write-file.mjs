/**
 * Sync write via temp file + rename (avoids Windows UNKNOWN errors on hot JSON paths).
 */
import fs from 'node:fs';
import path from 'node:path';

/** @param {string} filePath @param {string} content @param {number} [maxAttempts] */
export function atomicWriteFileSync(filePath, content, maxAttempts = 5) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const tmpPath = `${filePath}.${process.pid}.${attempt}.tmp`;
    try {
      fs.writeFileSync(tmpPath, content, 'utf8');
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
      }
      fs.renameSync(tmpPath, filePath);
      return;
    } catch (err) {
      lastError = err;
      try {
        fs.rmSync(tmpPath, { force: true });
      } catch {
        /* ignore */
      }
      if (attempt < maxAttempts) {
        const delayMs = 25 * attempt;
        const deadline = Date.now() + delayMs;
        while (Date.now() < deadline) {
          /* brief spin-wait for AV / indexer locks */
        }
      }
    }
  }
  throw lastError;
}
