'use client';

import type { SvgToPngConversionOptions } from '@lib/services/svg-conversion';
import { createSvgToPngConverter } from '@lib/services/svg-conversion';
import React, { useCallback, useRef, useState } from 'react';
import type { ConversionResult } from '../page';
import styles from './SvgConverterInterface.module.css';

interface SvgConverterInterfaceProps {
  onConversionStart: () => void;
  onConversionComplete: (result: ConversionResult) => void;
  onConversionEnd: () => void;
  onError: (error: string) => void;
  isConverting: boolean;
  error: string;
}

export function SvgConverterInterface({
  onConversionStart,
  onConversionComplete,
  onConversionEnd,
  onError,
  isConverting,
  error
}: SvgConverterInterfaceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Form state
  const [svgContent, setSvgContent] = useState('');
  const [filename, setFilename] = useState('converted-image');
  const [options, setOptions] = useState<SvgToPngConversionOptions>({
    quality: 1,
    scale: 1,
    backgroundColor: 'transparent'
  });
  const [inputMethod, setInputMethod] = useState<'file' | 'text'>('file');

  // Progress state
  const [conversionProgress, setConversionProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.svg')) {
        onError('Please select an SVG file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        onError('File size must be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSvgContent(content);
        setFilename(file.name.replace('.svg', ''));
      };
      reader.onerror = () => {
        onError('Failed to read file');
      };
      reader.readAsText(file);
    },
    [onError]
  );

  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setSvgContent(event.target.value);
    },
    []
  );

  const handleConvert = useCallback(async () => {
    if (!svgContent.trim()) {
      onError('Please provide SVG content');
      return;
    }

    try {
      onConversionStart();
      setConversionProgress(0);
      setProgressStep('Initializing...');

      const converter = createSvgToPngConverter({
        enableLogging: true,
        enableSecurityValidation: true
      });

      const result = await converter.convertWithProgress(svgContent, {
        ...options,
        onProgress: (progress) => {
          setConversionProgress(progress.progress);
          setProgressStep(progress.description);
        }
      });

      // Create result
      const conversionResult: ConversionResult = {
        id: `conversion-${Date.now()}`,
        filename: filename || 'converted-image',
        originalSize: result.metadata.originalSize,
        convertedSize: result.metadata.convertedSize,
        dimensions: result.dimensions,
        conversionTime: result.metadata.conversionTime,
        blob: result.blob,
        timestamp: new Date()
      };

      onConversionComplete(conversionResult);

      // Reset form
      setSvgContent('');
      setFilename('converted-image');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (textAreaRef.current) {
        textAreaRef.current.value = '';
      }
    } catch (err: any) {
      onError(err.message || 'Conversion failed');
    } finally {
      onConversionEnd();
      setConversionProgress(0);
      setProgressStep('');
    }
  }, [
    svgContent,
    filename,
    options,
    onConversionStart,
    onConversionComplete,
    onConversionEnd,
    onError
  ]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files);
      const svgFile = files.find((file) =>
        file.name.toLowerCase().endsWith('.svg')
      );

      if (svgFile) {
        if (svgFile.size > 10 * 1024 * 1024) {
          onError('File size must be less than 10MB');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setSvgContent(content);
          setFilename(svgFile.name.replace('.svg', ''));
          setInputMethod('file');
        };
        reader.readAsText(svgFile);
      } else {
        onError('Please drop an SVG file');
      }
    },
    [onError]
  );

  return (
    <div className={styles.interface}>
      <div className={styles.interface__header}>
        <h2 className={styles.interface__title}>Convert SVG to PNG</h2>
        <p className={styles.interface__subtitle}>
          Upload an SVG file or paste SVG code to get started
        </p>
      </div>

      <div className={styles.interface__content}>
        {/* Input Method Selector */}
        <div className={styles.input__selector}>
          <button
            className={`${styles.selector__button} ${inputMethod === 'file' ? styles['selector__button--active'] : ''}`}
            onClick={() => setInputMethod('file')}
          >
            📁 Upload File
          </button>
          <button
            className={`${styles.selector__button} ${inputMethod === 'text' ? styles['selector__button--active'] : ''}`}
            onClick={() => setInputMethod('text')}
          >
            📝 Paste Code
          </button>
        </div>

        {/* File Upload */}
        {inputMethod === 'file' && (
          <div
            className={styles.upload__area}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg"
              onChange={handleFileUpload}
              className={styles.upload__input}
              id="svg-file-input"
            />
            <label htmlFor="svg-file-input" className={styles.upload__label}>
              <div className={styles.upload__content}>
                <div className={styles.upload__icon}>📤</div>
                <div className={styles.upload__text}>
                  <strong>Click to upload</strong> or drag and drop
                </div>
                <div className={styles.upload__hint}>
                  SVG files only, max 10MB
                </div>
              </div>
            </label>
            {svgContent && (
              <div className={styles.upload__preview}>
                ✅ SVG loaded ({Math.round(svgContent.length / 1024)}KB)
              </div>
            )}
          </div>
        )}

        {/* Text Input */}
        {inputMethod === 'text' && (
          <div className={styles.text__input}>
            <label htmlFor="svg-textarea" className={styles.text__label}>
              SVG Code:
            </label>
            <textarea
              ref={textAreaRef}
              id="svg-textarea"
              value={svgContent}
              onChange={handleTextChange}
              placeholder="Paste your SVG code here..."
              className={styles.text__area}
              rows={10}
            />
            <div className={styles.text__hint}>
              Make sure your SVG includes proper opening and closing tags
            </div>
          </div>
        )}

        {/* Conversion Options */}
        <div className={styles.options}>
          <h3 className={styles.options__title}>Conversion Options</h3>

          <div className={styles.options__grid}>
            <div className={styles.option__group}>
              <label className={styles.option__label}>
                Filename:
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className={styles.option__input}
                  placeholder="converted-image"
                />
              </label>
            </div>

            <div className={styles.option__group}>
              <label className={styles.option__label}>
                Quality ({Math.round((options.quality || 1) * 100)}%):
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={options.quality || 1}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      quality: parseFloat(e.target.value)
                    }))
                  }
                  className={styles.option__slider}
                />
              </label>
            </div>

            <div className={styles.option__group}>
              <label className={styles.option__label}>
                Scale ({options.scale || 1}x):
                <input
                  type="range"
                  min="0.5"
                  max="4"
                  step="0.5"
                  value={options.scale || 1}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      scale: parseFloat(e.target.value)
                    }))
                  }
                  className={styles.option__slider}
                />
              </label>
            </div>

            <div className={styles.option__group}>
              <label className={styles.option__label}>
                Background:
                <select
                  value={options.backgroundColor || 'transparent'}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      backgroundColor: e.target.value
                    }))
                  }
                  className={styles.option__select}
                >
                  <option value="transparent">Transparent</option>
                  <option value="#ffffff">White</option>
                  <option value="#000000">Black</option>
                  <option value="#f0f0f0">Light Gray</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Convert Button */}
        <div className={styles.convert__section}>
          <button
            onClick={handleConvert}
            disabled={!svgContent.trim() || isConverting}
            className={`${styles.convert__button} ${isConverting ? styles['convert__button--loading'] : ''}`}
          >
            {isConverting ? (
              <>
                <span className={styles.button__spinner}>⏳</span>
                Converting...
              </>
            ) : (
              <>
                <span className={styles.button__icon}>🎨</span>
                Convert to PNG
              </>
            )}
          </button>

          {isConverting && (
            <div className={styles.progress}>
              <div className={styles.progress__bar}>
                <div
                  className={styles.progress__fill}
                  style={{ width: `${conversionProgress}%` }}
                />
              </div>
              <div className={styles.progress__text}>
                {progressStep} ({Math.round(conversionProgress)}%)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
