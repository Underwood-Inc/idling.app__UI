'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import FadeIn from '../components/fade-in/FadeIn';
import { PageContainer } from '../components/page-container/PageContainer';
import PageContent from '../components/page-content/PageContent';
import PageHeader from '../components/page-header/PageHeader';
import styles from './page.module.css';

export default function OgImageViewer() {
  const searchParams = useSearchParams();
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Build API URL with current search params
  const buildApiUrl = () => {
    const apiUrl = new URL('/api/og-image', window.location.origin);
    apiUrl.searchParams.set('direct', 'true'); // Bypass browser redirect

    // Forward all current search params
    searchParams.forEach((value, key) => {
      apiUrl.searchParams.set(key, value);
    });

    return apiUrl.toString();
  };

  // Fetch SVG content on mount
  useEffect(() => {
    const fetchSvg = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(buildApiUrl());

        if (!response.ok) {
          throw new Error(`Failed to fetch SVG: ${response.statusText}`);
        }

        const svgText = await response.text();
        setSvgContent(svgText);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load image');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSvg();
  }, [searchParams]);

  // Convert SVG to PNG using canvas
  const convertSvgToPng = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!svgContent) {
        reject(new Error('No SVG content available'));
        return;
      }

      // Create an image element
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      img.onload = () => {
        // Set canvas dimensions to match the SVG
        canvas.width = 1200;
        canvas.height = 630;

        // Draw the SVG image onto the canvas
        ctx.drawImage(img, 0, 0);

        // Convert canvas to blob
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

      // Convert SVG to data URL
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      const svgUrl = URL.createObjectURL(svgBlob);
      img.src = svgUrl;
    });
  };

  // Download file
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate filename
  const generateFilename = (type: 'png' | 'svg') => {
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:.]/g, '-');
    const seed = searchParams.get('seed');
    const baseName = seed ? `og-image-${seed}` : `og-image-${timestamp}`;
    return `${baseName}.${type}`;
  };

  // Handle save as PNG
  const handleSaveAsPng = async () => {
    try {
      const pngBlob = await convertSvgToPng();
      downloadFile(pngBlob, generateFilename('png'));
    } catch (err) {
      console.error('Failed to convert to PNG:', err);
      alert('Failed to save as PNG. Please try again.');
    }
  };

  // Handle save as SVG
  const handleSaveAsSvg = () => {
    if (!svgContent) {
      alert('No SVG content available');
      return;
    }

    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
    downloadFile(svgBlob, generateFilename('svg'));
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader>
          <FadeIn>
            <h2>Card Generator</h2>
            <p>Loading image...</p>
          </FadeIn>
        </PageHeader>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader>
          <FadeIn>
            <h2>Card Generator</h2>
            <p>Error loading image: {error}</p>
          </FadeIn>
        </PageHeader>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <FadeIn>
          <div className={styles.header__content}>
            <div className={styles.header__text}>
              <h2>Card Generator</h2>
              <p>
                Generate beautiful social media cards with quotes and avatars
              </p>
            </div>
            <div className={styles.header__buttons}>
              <button
                onClick={handleSaveAsPng}
                className={styles.header__button}
                title="PNG - Raster image, best for social media"
              >
                📥 PNG
              </button>
              <button
                onClick={handleSaveAsSvg}
                className={styles.header__button}
                title="SVG - Vector image, scalable and smaller"
              >
                📥 SVG
              </button>
            </div>
          </div>
        </FadeIn>
      </PageHeader>

      <PageContent>
        <article className={styles.viewer__container}>
          <FadeIn className={styles.viewer__container_fade}>
            <div className={styles.image__wrapper}>
              <div
                className={styles.og__image}
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            </div>
          </FadeIn>
        </article>
      </PageContent>
    </PageContainer>
  );
}
