// Minimal SSE test endpoint
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { withUniversalEnhancementsNoRateLimit } from '@lib/api/withUniversalEnhancements';

async function sseHandler() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send immediate data
      controller.enqueue(encoder.encode('data: {"test": "immediate"}\\n\\n'));

      // Send more data after 1 second
      setTimeout(() => {
        controller.enqueue(encoder.encode('data: {"test": "delayed"}\\n\\n'));
        controller.close();
      }, 1000);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
}

export const GET = withUniversalEnhancementsNoRateLimit(sseHandler);
