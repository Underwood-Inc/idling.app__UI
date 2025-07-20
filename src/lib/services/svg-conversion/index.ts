/**
 * SVG to PNG Conversion Service
 *
 * Public API exports for the comprehensive SVG to PNG conversion service.
 * This module provides both simple and advanced conversion capabilities.
 */

export type {
  AdvancedConversionOptions,
  BatchConversionRequest,
  BatchConversionResult,
  ConversionError,
  ConversionProgress,
  ConversionProgressCallback,
  SvgToPngConversionOptions,
  SvgToPngResult,
  SvgToPngServiceConfig,
  SvgValidationResult
} from './types';

export {
  convertSvgToPng,
  createSvgToPngConverter,
  SvgToPngConverter
} from './SvgToPngConverter';
