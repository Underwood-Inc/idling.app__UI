'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import FadeIn from '../components/fade-in/FadeIn';
import { PageAside } from '../components/page-aside/PageAside';
import { PageContainer } from '../components/page-container/PageContainer';
import PageContent from '../components/page-content/PageContent';
import { ConversionDisplay } from './components/ConversionDisplay';
import { ConversionHistory } from './components/ConversionHistory';
import { SvgConverterInterface } from './components/SvgConverterInterface';
import styles from './page.module.css';

export interface ConversionResult {
  id: string;
  filename: string;
  originalSize: number;
  convertedSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  conversionTime: number;
  blob: Blob;
  timestamp: Date;
}

export default function SvgConverter() {
  const { data: session } = useSession();

  // Core state
  const [currentResult, setCurrentResult] = useState<ConversionResult | null>(
    null
  );
  const [conversions, setConversions] = useState<ConversionResult[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleConversionComplete = (result: ConversionResult) => {
    setCurrentResult(result);
    setConversions((prev) => [result, ...prev.slice(0, 9)]); // Keep last 10
    setError('');
  };

  const handleConversionStart = () => {
    setIsConverting(true);
    setError('');
    setCurrentResult(null);
  };

  const handleConversionEnd = () => {
    setIsConverting(false);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsConverting(false);
    setCurrentResult(null);
  };

  const handleClearHistory = () => {
    setConversions([]);
    setCurrentResult(null);
  };

  const handleNewConversion = () => {
    setCurrentResult(null);
    setError('');
  };

  return (
    <PageContainer>
      <div className={styles.converter__layout}>
        <PageContent>
        <FadeIn>
          <div className={styles.converter}>
            <div className={styles.converter__header}>
              <h1 className={styles.converter__title}>
                <SiteIcon id="palette" sizeRem={1.25} />
                SVG to PNG Converter
              </h1>
              <p className={styles.converter__description}>
                Transform your SVG vector graphics into high-quality PNG images
                with custom sizing, quality settings, and batch processing
                capabilities.
              </p>
            </div>

            <div className={styles.converter__main}>
              <div className={styles.converter__interface}>
                <SvgConverterInterface
                  onConversionStart={handleConversionStart}
                  onConversionComplete={handleConversionComplete}
                  onConversionEnd={handleConversionEnd}
                  onError={handleError}
                  isConverting={isConverting}
                  error={error}
                />
              </div>

              {currentResult && (
                <div className={styles.converter__result}>
                  <ConversionDisplay
                    result={currentResult}
                    onNewConversion={handleNewConversion}
                  />
                </div>
              )}

              {error && (
                <div className={styles.converter__error}>
                  <div className={styles.error__content}>
                    <h3>
                      <SiteIcon id="alertTriangle" sizeRem={1.125} />
                      Conversion Failed
                    </h3>
                    <p>{error}</p>
                    <button
                      onClick={() => setError('')}
                      className={styles.error__dismiss}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      </PageContent>

      <PageAside className={styles.converter__aside}>
        <div className={styles.sidebar}>
          <div className={styles.sidebar__section}>
            <h3 className={styles.sidebar__title}>
              <SiteIcon id="sparkles" sizeRem={1.125} />
              Features
            </h3>
            <ul className={styles.feature__list}>
              <li>
                <SiteIcon id="target" sizeRem={1} />
                High-quality PNG output
              </li>
              <li>
                <SiteIcon id="settings" sizeRem={1} />
                Custom scaling & dimensions
              </li>
              <li>
                <SiteIcon id="lock" sizeRem={1} />
                Security validation
              </li>
              <li>
                <SiteIcon id="barChart" sizeRem={1} />
                Batch processing
              </li>
              <li>
                <SiteIcon id="palette" sizeRem={1} />
                Background customization
              </li>
              <li>
                <SiteIcon id="clock" sizeRem={1} />
                Real-time progress
              </li>
            </ul>
          </div>

          <div className={styles.sidebar__section}>
            <h3 className={styles.sidebar__title}>
              <SiteIcon id="clipboard" sizeRem={1.125} />
              Supported
            </h3>
            <div className={styles.format__grid}>
              <div className={styles.format__item}>
                <span className={styles.format__label}>Input:</span>
                <span className={styles.format__value}>SVG</span>
              </div>
              <div className={styles.format__item}>
                <span className={styles.format__label}>Output:</span>
                <span className={styles.format__value}>PNG</span>
              </div>
              <div className={styles.format__item}>
                <span className={styles.format__label}>Max Size:</span>
                <span className={styles.format__value}>10MB</span>
              </div>
              <div className={styles.format__item}>
                <span className={styles.format__label}>Batch:</span>
                <span className={styles.format__value}>10 files</span>
              </div>
            </div>
          </div>

          {conversions.length > 0 && (
            <div className={styles.sidebar__section}>
              <ConversionHistory
                conversions={conversions}
                onSelectConversion={setCurrentResult}
                onClearHistory={handleClearHistory}
                currentResult={currentResult}
              />
            </div>
          )}

          <div className={styles.sidebar__section}>
            <h3 className={styles.sidebar__title}>
              <SiteIcon id="lightbulb" sizeRem={1.125} />
              Tips
            </h3>
            <ul className={styles.tips__list}>
              <li>Remove script tags for security</li>
              <li>Use simple SVGs for faster conversion</li>
              <li>Higher quality = larger file size</li>
              <li>Try 2x scale for retina displays</li>
            </ul>
          </div>

          {session?.user && (
            <div className={styles.sidebar__section}>
              <h3 className={styles.sidebar__title}>
                <SiteIcon id="user" sizeRem={1.125} />
                Signed In
              </h3>
              <p className={styles.user__info}>
                Welcome back, {session.user.name || session.user.email}!
                <br />
                <small>No conversion limits for registered users</small>
              </p>
            </div>
          )}
        </div>
      </PageAside>
      </div>
    </PageContainer>
  );
}
