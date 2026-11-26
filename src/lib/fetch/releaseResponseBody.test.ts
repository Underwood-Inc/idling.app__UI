import { describe, expect, test } from 'vitest';
import { releaseResponseBody } from './releaseResponseBody';

describe('releaseResponseBody', () => {
  test('drains only a bounded prefix of the body', async () => {
    let readChunks = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        readChunks += 1;
        if (readChunks > 200) {
          controller.close();
          return;
        }
        controller.enqueue(new Uint8Array(1024));
      },
    });

    const response = new Response(stream);
    await releaseResponseBody(response);

    expect(readChunks).toBeLessThan(200);
    expect(readChunks).toBeLessThanOrEqual(33);
  });
});