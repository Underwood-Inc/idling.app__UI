export interface ReusableFloat32Buffer {
  data: Float32Array;
  ensureCapacity: (floatCount: number) => Float32Array;
  uploadFrom: (values: ArrayLike<number>, floatCount: number) => Float32Array;
}

export function createReusableFloat32Buffer(initialCapacity = 256): ReusableFloat32Buffer {
  let data = new Float32Array(initialCapacity);

  return {
    data,
    ensureCapacity(floatCount) {
      if (data.length < floatCount) {
        const nextCapacity = Math.max(floatCount, data.length * 2);
        data = new Float32Array(nextCapacity);
        this.data = data;
      }
      return data;
    },
    uploadFrom(values, floatCount) {
      const target = this.ensureCapacity(floatCount);
      target.set(values, 0);
      return target.subarray(0, floatCount);
    },
  };
}

export interface ScratchNumberBuffer {
  values: number[];
  length: number;
  clear: () => void;
  push: (...items: number[]) => void;
}

export function createScratchNumberBuffer(initialCapacity = 256): ScratchNumberBuffer {
  const values: number[] = new Array(initialCapacity);
  let length = 0;

  return {
    values,
    length,
    clear() {
      length = 0;
      this.length = 0;
    },
    push(...items) {
      for (let index = 0; index < items.length; index += 1) {
        values[length] = items[index];
        length += 1;
      }
      this.length = length;
    },
  };
}

export function uploadArrayBuffer(
  gl: WebGL2RenderingContext,
  buffer: WebGLBuffer,
  reusable: ReusableFloat32Buffer,
  values: ArrayLike<number>,
  floatCount: number
): void {
  const upload = reusable.uploadFrom(values, floatCount);
  gl.bufferData(gl.ARRAY_BUFFER, upload, gl.DYNAMIC_DRAW);
}
