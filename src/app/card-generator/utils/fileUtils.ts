export const convertSvgToPng = async (svgContent: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!svgContent) {
      reject(new Error('No SVG content available'));
      return;
    }

    // eslint-disable-next-line no-console
    console.log('Starting PNG conversion, SVG length:', svgContent.length);

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // eslint-disable-next-line no-console
      console.log(
        'SVG loaded successfully, dimensions:',
        img.naturalWidth || img.width,
        'x',
        img.naturalHeight || img.height
      );

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      // Clear canvas to transparent (this is crucial for transparent backgrounds)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ensure canvas supports transparency
      ctx.globalCompositeOperation = 'source-over';

      // Draw the SVG image on the transparent canvas
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          // eslint-disable-next-line no-console
          console.log('PNG conversion successful, blob size:', blob.size);
          resolve(blob);
        } else {
          reject(new Error('Failed to create PNG blob'));
        }
      }, 'image/png'); // PNG format supports transparency
    };

    img.onerror = (error) => {
      // eslint-disable-next-line no-console
      console.error('SVG loading failed:', error);
      reject(new Error('Failed to load SVG as image'));
    };

    try {
      // Use base64 data URL approach instead of createObjectURL for better compatibility
      const svgBase64 = btoa(unescape(encodeURIComponent(svgContent)));
      img.src = `data:image/svg+xml;base64,${svgBase64}`;
      // eslint-disable-next-line no-console
      console.log('SVG data URL set, waiting for load...');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating SVG data URL:', error);
      reject(new Error('Failed to create SVG data URL'));
    }
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
