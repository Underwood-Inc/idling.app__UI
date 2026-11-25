export interface ToolsSvgConverterEnPageCopy {
  title: string;
  description: string;
  conversionFailed: string;
  dismiss: string;
  featuresTitle: string;
  features: string[];
  supportedTitle: string;
  formats: {
    inputLabel: string;
    inputValue: string;
    outputLabel: string;
    outputValue: string;
    maxSizeLabel: string;
    maxSizeValue: string;
    batchLabel: string;
    batchValue: string;
  };
  tipsTitle: string;
  tips: string[];
  signedInTitle: string;
  signedInNoLimits: string;
}

export interface ToolsSvgConverterEnInterfaceCopy {
  title: string;
  subtitle: string;
  uploadFile: string;
  pasteCode: string;
  uploadPromptStrong: string;
  uploadPromptRest: string;
  uploadHint: string;
  svgCodeLabel: string;
  svgCodePlaceholder: string;
  svgTagsHint: string;
  conversionOptionsTitle: string;
  filenameLabel: string;
  qualityLabel: string;
  scaleLabel: string;
  backgroundLabel: string;
  backgroundOptions: string[];
  convertToPng: string;
  converting: string;
  initializing: string;
  errors: {
    selectSvg: string;
    fileTooLarge: string;
    readFailed: string;
    dropSvg: string;
    provideContent: string;
  };
}

export interface ToolsSvgConverterEnCopy {
  page: ToolsSvgConverterEnPageCopy;
  interface: ToolsSvgConverterEnInterfaceCopy;
}

export const TOOLS_SVG_CONVERTER_EN = {
  page: {
    title: 'SVG to PNG Converter',
    description:
      'Transform your SVG vector graphics into high-quality PNG images with custom sizing, quality settings, and batch processing capabilities.',
    conversionFailed: 'Conversion Failed',
    dismiss: 'Dismiss',
    featuresTitle: 'Features',
    features: [
      'High-quality PNG output',
      'Custom scaling & dimensions',
      'Security validation',
      'Batch processing',
      'Background customization',
      'Real-time progress',
    ],
    supportedTitle: 'Supported',
    formats: {
      inputLabel: 'Input:',
      inputValue: 'SVG',
      outputLabel: 'Output:',
      outputValue: 'PNG',
      maxSizeLabel: 'Max Size:',
      maxSizeValue: '10MB',
      batchLabel: 'Batch:',
      batchValue: '10 files',
    },
    tipsTitle: 'Tips',
    tips: [
      'Remove script tags for security',
      'Use simple SVGs for faster conversion',
      'Higher quality = larger file size',
      'Try 2x scale for retina displays',
    ],
    signedInTitle: 'Signed In',
    signedInNoLimits: 'No conversion limits for registered users',
  },
  interface: {
    title: 'Convert SVG to PNG',
    subtitle: 'Upload an SVG file or paste SVG code to get started',
    uploadFile: 'Upload File',
    pasteCode: 'Paste Code',
    uploadPromptStrong: 'Click to upload',
    uploadPromptRest: 'or drag and drop',
    uploadHint: 'SVG files only, max 10MB',
    svgCodeLabel: 'SVG Code:',
    svgCodePlaceholder: 'Paste your SVG code here...',
    svgTagsHint: 'Make sure your SVG includes proper opening and closing tags',
    conversionOptionsTitle: 'Conversion Options',
    filenameLabel: 'Filename:',
    qualityLabel: 'Quality',
    scaleLabel: 'Scale',
    backgroundLabel: 'Background:',
    backgroundOptions: ['Transparent', 'White', 'Black', 'Light Gray'],
    convertToPng: 'Convert to PNG',
    converting: 'Converting...',
    initializing: 'Initializing...',
    errors: {
      selectSvg: 'Please select an SVG file',
      fileTooLarge: 'File size must be less than 10MB',
      readFailed: 'Failed to read file',
      dropSvg: 'Please drop an SVG file',
      provideContent: 'Please provide SVG content',
    },
  },
} satisfies ToolsSvgConverterEnCopy;