export const convertSvgToPng = async (svgContent: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!svgContent) {
      reject(new Error('No SVG content available'));
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create PNG blob'));
        }
      }, 'image/png');
    };

    img.onerror = () => {
      reject(new Error('Failed to load SVG as image'));
    };

    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    img.src = svgUrl;
  });
};

export const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateFilename = (
  type: 'png' | 'svg',
  currentSeed: string,
  selectedRatio: string
) => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  const seed = currentSeed;
  const ratioSuffix = selectedRatio !== 'default' ? `-${selectedRatio}` : '';
  const baseName = seed
    ? `og-image-${seed}${ratioSuffix}`
    : `og-image-${timestamp}${ratioSuffix}`;
  return `${baseName}.${type}`;
}; 