'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import FadeIn from '../components/fade-in/FadeIn';
import { PageAside } from '../components/page-aside/PageAside';
import { PageContainer } from '../components/page-container/PageContainer';
import PageContent from '../components/page-content/PageContent';
import { ToolsCopyProvider, useToolsCopy } from '../tools/ToolsCopyContext';
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

function SvgConverterPageContent() {
  const { data: session } = useSession();
  const { svgConverter } = useToolsCopy();
  const page = svgConverter.page;

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
                {page.title}
              </h1>
              <p className={styles.converter__description}>{page.description}</p>
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
                      {page.conversionFailed}
                    </h3>
                    <p>{error}</p>
                    <button
                      onClick={() => setError('')}
                      className={styles.error__dismiss}
                    >
                      {page.dismiss}
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
              {page.featuresTitle}
            </h3>
            <ul className={styles.feature__list}>
              {page.features.map((feature, index) => {
                const featureIcons = ['target', 'settings', 'lock', 'barChart', 'palette', 'clock'] as const;
                return (
                  <li key={feature}>
                    <SiteIcon id={featureIcons[index] ?? 'target'} sizeRem={1} />
                    {feature}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={styles.sidebar__section}>
            <h3 className={styles.sidebar__title}>
              <SiteIcon id="clipboard" sizeRem={1.125} />
              {page.supportedTitle}
            </h3>
            <div className={styles.format__grid}>
              <div className={styles.format__item}>
                <span className={styles.format__label}>{page.formats.inputLabel}</span>
                <span className={styles.format__value}>{page.formats.inputValue}</span>
              </div>
              <div className={styles.format__item}>
                <span className={styles.format__label}>{page.formats.outputLabel}</span>
                <span className={styles.format__value}>{page.formats.outputValue}</span>
              </div>
              <div className={styles.format__item}>
                <span className={styles.format__label}>{page.formats.maxSizeLabel}</span>
                <span className={styles.format__value}>{page.formats.maxSizeValue}</span>
              </div>
              <div className={styles.format__item}>
                <span className={styles.format__label}>{page.formats.batchLabel}</span>
                <span className={styles.format__value}>{page.formats.batchValue}</span>
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
              {page.tipsTitle}
            </h3>
            <ul className={styles.tips__list}>
              {page.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>

          {session?.user && (
            <div className={styles.sidebar__section}>
              <h3 className={styles.sidebar__title}>
                <SiteIcon id="user" sizeRem={1.125} />
                {page.signedInTitle}
              </h3>
              <p className={styles.user__info}>
                Welcome back, {session.user.name || session.user.email}!
                <br />
                <small>{page.signedInNoLimits}</small>
              </p>
            </div>
          )}
        </div>
      </PageAside>
      </div>
    </PageContainer>
  );
}

export default function SvgConverter() {
  return (
    <ToolsCopyProvider>
      <SvgConverterPageContent />
    </ToolsCopyProvider>
  );
}
