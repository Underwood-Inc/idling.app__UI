export function createCanvasVisualizerTimeDomainBuffer(size: number): Float32Array {
  return new Float32Array(Math.max(8, size));
}

export function sampleCanvasVisualizerTimeDomain(
  analyser: AnalyserNode,
  byteBuffer: Uint8Array<ArrayBuffer>,
  output: Float32Array
): Float32Array {
  analyser.getByteTimeDomainData(byteBuffer);
  const length = Math.min(byteBuffer.length, output.length);

  for (let index = 0; index < length; index += 1) {
    output[index] = ((byteBuffer[index] ?? 128) - 128) / 128;
  }

  for (let index = length; index < output.length; index += 1) {
    output[index] = 0;
  }

  return output;
}
