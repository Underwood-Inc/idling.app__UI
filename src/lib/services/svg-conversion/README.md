# SVG to PNG Conversion Service

A comprehensive, agnostic TypeScript service for converting SVG content to PNG images. Extracted and enhanced from the card generator's original implementation to provide a reusable, standalone module.

## Features

- ✅ **Client-side Canvas-based conversion** - Uses HTML5 Canvas API for high-quality rendering
- ✅ **Configurable quality and scaling** - Fine-tune output quality and dimensions
- ✅ **Security validation** - Scans SVG content for potentially malicious code
- ✅ **Comprehensive error handling** - Detailed error types and context
- ✅ **Progress tracking** - Monitor conversion progress for large files
- ✅ **Batch processing** - Convert multiple SVGs simultaneously
- ✅ **TypeScript support** - Full type safety with comprehensive interfaces
- ✅ **Memory management** - Prevents resource exhaustion with configurable limits

## Quick Start

```typescript
import { convertSvgToPng, createSvgToPngConverter } from '@lib/services/svg-conversion';

// Simple conversion (backward compatible)
const svgContent = '<svg width="100" height="100">...</svg>';
const blob = await convertSvgToPng(svgContent);

// Advanced conversion with options
const converter = createSvgToPngConverter({
  enableLogging: true,
  maxSvgSize: 5 * 1024 * 1024 // 5MB limit
});

const result = await converter.convertToPng(svgContent, {
  scale: 2,
  quality: 0.9,
  backgroundColor: '#ffffff'
});

console.log(`Converted ${result.metadata.originalSize} bytes to ${result.metadata.convertedSize} bytes`);
```

## API Reference

### Types

#### `SvgToPngConversionOptions`
```typescript
interface SvgToPngConversionOptions {
  quality?: number;           // 0-1, higher = better quality
  scale?: number;             // Scale factor (1 = original size)
  backgroundColor?: string;   // Background color or 'transparent'
  maxWidth?: number;          // Maximum output width
  maxHeight?: number;         // Maximum output height
  maintainAspectRatio?: boolean; // Keep original proportions
  timeout?: number;           // Conversion timeout in ms
}
```

#### `SvgToPngResult`
```typescript
interface SvgToPngResult {
  blob: Blob;                 // The converted PNG blob
  dimensions: {               // Output dimensions
    width: number;
    height: number;
  };
  originalDimensions: {       // Input dimensions
    width: number;
    height: number;
  };
  metadata: {                 // Conversion metadata
    conversionTime: number;   // Time taken in ms
    originalSize: number;     // SVG size in bytes
    convertedSize: number;    // PNG size in bytes
    scaleApplied: number;     // Actual scale factor used
  };
}
```

### Main Classes

#### `SvgToPngConverter`

The main conversion service with advanced features:

```typescript
const converter = new SvgToPngConverter({
  defaultOptions: {
    quality: 1,
    scale: 1,
    timeout: 30000
  },
  maxSvgSize: 10 * 1024 * 1024, // 10MB
  maxConcurrentConversions: 5,
  enableLogging: false,
  enableSecurityValidation: true
});
```

**Methods:**

- `validateSvg(svgContent: string): SvgValidationResult` - Validate SVG content
- `convertToPng(svgContent: string, options?: SvgToPngConversionOptions): Promise<SvgToPngResult>` - Convert SVG to PNG
- `convertBatch(requests: BatchConversionRequest[]): Promise<BatchConversionResult[]>` - Batch conversion
- `convertWithProgress(svgContent: string, options?: AdvancedConversionOptions): Promise<SvgToPngResult>` - Convert with progress tracking
- `getStatus()` - Get current service status

### Factory Functions

#### `createSvgToPngConverter(config?: Partial<SvgToPngServiceConfig>)`
Creates a converter instance with sensible defaults.

#### `convertSvgToPng(svgContent: string, options?: SvgToPngConversionOptions)`
Convenience function for simple conversions (maintains backward compatibility).

## Usage Examples

### Basic Conversion
```typescript
import { convertSvgToPng } from '@lib/services/svg-conversion';

const svgContent = `
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="50" fill="blue"/>
</svg>`;

try {
  const blob = await convertSvgToPng(svgContent);
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'circle.png';
  link.click();
  URL.revokeObjectURL(url);
} catch (error) {
  console.error('Conversion failed:', error);
}
```

### Advanced Conversion with Options
```typescript
import { createSvgToPngConverter } from '@lib/services/svg-conversion';

const converter = createSvgToPngConverter({
  enableLogging: true,
  enableSecurityValidation: true
});

const result = await converter.convertToPng(svgContent, {
  scale: 3,                    // 3x original size
  quality: 0.95,              // High quality
  maxWidth: 1920,             // Limit width to 1920px
  backgroundColor: '#f0f0f0', // Light gray background
  timeout: 60000              // 60 second timeout
});

console.log('Conversion details:', result.metadata);
```

### Batch Conversion
```typescript
const batchRequests = [
  { id: 'icon1', svgContent: icon1Svg, options: { scale: 2 } },
  { id: 'icon2', svgContent: icon2Svg, options: { scale: 2 } },
  { id: 'logo', svgContent: logoSvg, options: { quality: 1 } }
];

const results = await converter.convertBatch(batchRequests);

results.forEach(result => {
  if (result.success) {
    console.log(`✅ ${result.id}: ${result.result.metadata.convertedSize} bytes`);
  } else {
    console.error(`❌ ${result.id}: ${result.error.message}`);
  }
});
```

### Progress Tracking
```typescript
const result = await converter.convertWithProgress(largeSvgContent, {
  scale: 4,
  onProgress: (progress) => {
    console.log(`${progress.step}: ${progress.progress}% - ${progress.description}`);
  }
});
```

### SVG Validation
```typescript
const validation = converter.validateSvg(svgContent);

if (!validation.isValid) {
  console.error('SVG validation failed:', validation.error);
  if (validation.safetyIssues) {
    validation.safetyIssues.forEach(issue => {
      console.warn('Security issue:', issue);
    });
  }
} else {
  console.log('SVG is valid:', validation.dimensions);
}
```

## Error Handling

The service provides detailed error information:

```typescript
try {
  await converter.convertToPng(invalidSvg);
} catch (error: ConversionError) {
  switch (error.type) {
    case 'INVALID_SVG':
      console.error('SVG format issue:', error.message);
      break;
    case 'CANVAS_ERROR':
      console.error('Browser canvas issue:', error.message);
      break;
    case 'TIMEOUT':
      console.error('Conversion took too long:', error.message);
      break;
    case 'MEMORY_ERROR':
      console.error('Resource limit exceeded:', error.message);
      break;
    default:
      console.error('Unknown error:', error.message);
  }
  
  // Access additional context
  if (error.context) {
    console.log('Error context:', error.context);
  }
}
```

## Performance Considerations

### Memory Usage
- Large SVGs (>5MB) may consume significant memory during rendering
- Use `maxSvgSize` config to prevent memory exhaustion
- Batch processing is limited to prevent resource overuse

### Browser Compatibility
- Requires HTML5 Canvas support (IE9+)
- Uses modern JavaScript features (ES2017+)
- Base64 encoding for SVG data URLs

### Optimization Tips
- Simplify complex SVGs before conversion
- Use appropriate quality settings (0.8-0.9 usually sufficient)
- Consider client-side caching for repeated conversions
- Monitor conversion times and adjust timeouts accordingly

## Security Features

### Input Validation
- Scans for `<script>` tags and JavaScript content
- Checks for iframe, object, and embed elements
- Validates SVG structure and format
- Configurable security validation levels

### Safe Defaults
- XSS prevention through content sanitization
- Resource limits to prevent DoS attacks
- Timeout protection against infinite loops
- Memory usage monitoring

## Migration from Card Generator

This service is extracted from the original card generator implementation in `src/app/card-generator/utils/fileUtils.ts`. Key improvements:

### Enhanced Features
- ✅ Configurable options (original was hardcoded)
- ✅ Batch processing (original was single-file only)
- ✅ Security validation (original had basic checks)
- ✅ Progress tracking (original had none)
- ✅ Comprehensive error handling (original was basic)
- ✅ TypeScript interfaces (original used inline types)

### Backward Compatibility
The `convertSvgToPng()` function maintains the same signature as the original:
```typescript
// Original usage still works
const blob = await convertSvgToPng(svgContent);
```

### Migration Path
1. Update imports to use the new service
2. Optionally enhance with new configuration options
3. Consider using the class-based API for advanced features

## Contributing

When modifying this service:

1. **Maintain backward compatibility** - Don't break the simple `convertSvgToPng()` function
2. **Follow type definitions** - Use interfaces instead of inline types
3. **Add comprehensive tests** - Cover security validation and error cases
4. **Update documentation** - Keep examples current and accurate
5. **Consider performance** - Monitor memory usage and conversion times

## Dependencies

- **Browser APIs**: Canvas 2D, Blob, URL
- **TypeScript**: ES2017+ features
- **No external libraries** - Pure web standards implementation

---

*Service extracted from card generator utils | Enhanced for reusability | Maintained for production use* 