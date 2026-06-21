import { buildRadioNowPlaying, parseIcyStreamTitle } from './parseIcyStreamTitle';
import type { RadioNowPlaying } from './radioNowPlaying.types';

const FETCH_TIMEOUT_MS = 12000;
const MAX_METADATA_BLOCK_BYTES = 255 * 16;

interface ByteReader {
  readExact: (byteCount: number) => Promise<Uint8Array | null>;
  cancel: () => Promise<void>;
}

function createByteReader(
  reader: ReadableStreamDefaultReader<Uint8Array>
): ByteReader {
  /** @type {Uint8Array[]} */
  const queue: Uint8Array[] = [];
  let queueOffset = 0;

  const pullChunk = async (): Promise<boolean> => {
    const { done, value } = await reader.read();
    if (done || !value) {
      return false;
    }
    queue.push(value);
    return true;
  };

  const readExact = async (byteCount: number): Promise<Uint8Array | null> => {
    const output = new Uint8Array(byteCount);
    let written = 0;

    while (written < byteCount) {
      if (queue.length === 0) {
        const hasChunk = await pullChunk();
        if (!hasChunk) {
          return null;
        }
      }

      const current = queue[0];
      const available = current.length - queueOffset;
      const take = Math.min(available, byteCount - written);
      output.set(current.subarray(queueOffset, queueOffset + take), written);
      written += take;
      queueOffset += take;

      if (queueOffset >= current.length) {
        queue.shift();
        queueOffset = 0;
      }
    }

    return output;
  };

  return {
    readExact,
    cancel: () => reader.cancel(),
  };
}

export async function fetchStreamNowPlaying(
  station: string,
  streamUrl: string
): Promise<RadioNowPlaying> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(streamUrl, {
      method: 'GET',
      headers: {
        'Icy-MetaData': '1',
        'User-Agent': 'IdlingRadioNowPlaying/1.0 (https://idling.app)',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    if (!response.ok || !response.body) {
      return buildRadioNowPlaying(station, null, false);
    }

    const metaIntRaw =
      response.headers.get('icy-metaint') ?? response.headers.get('Icy-Metaint');
    const metaInt = metaIntRaw ? Number.parseInt(metaIntRaw, 10) : Number.NaN;

    if (!Number.isFinite(metaInt) || metaInt <= 0) {
      return buildRadioNowPlaying(station, null, false);
    }

    const reader = createByteReader(response.body.getReader());

    try {
      const boundary = await reader.readExact(metaInt + 1);
      if (!boundary) {
        return buildRadioNowPlaying(station, null, true);
      }

      const metadataLength = boundary[metaInt] * 16;
      if (metadataLength <= 0 || metadataLength > MAX_METADATA_BLOCK_BYTES) {
        return buildRadioNowPlaying(station, null, true);
      }

      const metadataBytes = await reader.readExact(metadataLength);
      if (!metadataBytes) {
        return buildRadioNowPlaying(station, null, true);
      }

      const metadataText = new TextDecoder('utf-8').decode(metadataBytes);
      const streamTitle = parseIcyStreamTitle(metadataText);

      return buildRadioNowPlaying(station, streamTitle, true);
    } finally {
      await reader.cancel();
    }
  } catch {
    return buildRadioNowPlaying(station, null, false);
  } finally {
    clearTimeout(timer);
  }
}
