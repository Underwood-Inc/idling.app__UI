export function createCanvasVisualizerTimeDomainBuffer(size) {
    return new Float32Array(Math.max(8, size));
}
export function sampleCanvasVisualizerTimeDomain(analyser, byteBuffer, output) {
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
