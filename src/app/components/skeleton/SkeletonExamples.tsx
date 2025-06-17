'use client';

import React, { useRef, useState } from 'react';
import {
  SkeletonBox,
  SkeletonCircle,
  SkeletonLoader,
  SkeletonText,
  useSmartSkeleton
} from './SkeletonLoader';
import { SmartPostsSkeleton } from './useSmartPostsSkeleton';

/**
 * SkeletonExamples - Demonstrates various skeleton loader usage patterns
 *
 * This component serves as both documentation and testing for the skeleton system.
 * It shows:
 * 1. Basic manual skeleton components
 * 2. Manual skeleton configurations
 * 3. Smart skeleton auto-detection
 * 4. Specialized skeletons for specific components
 */
export const SkeletonExamples: React.FC = () => {
  const [showExample, setShowExample] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const { isCapturing, skeletonConfig, captureLayout, stopCapture } =
    useSmartSkeleton(contentRef);

  const toggleExample = (exampleNumber: number) => {
    setShowExample(exampleNumber);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Skeleton Loader Examples</h1>

      <div
        style={{
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <button onClick={() => toggleExample(1)}>Basic Components</button>
        <button onClick={() => toggleExample(2)}>Manual Configurations</button>
        <button onClick={() => toggleExample(3)}>Smart Detection</button>
        <button onClick={() => toggleExample(4)}>Posts Skeleton</button>
        <button onClick={() => toggleExample(5)}>Real Content</button>
      </div>

      {showExample === 1 && (
        <div>
          <h2>Basic Skeleton Components</h2>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div>
              <h3>SkeletonText</h3>
              <SkeletonText width="200px" height="1rem" />
              <SkeletonText width="150px" height="0.875rem" />
              <SkeletonText width="300px" height="1.2rem" />
            </div>

            <div>
              <h3>SkeletonBox</h3>
              <SkeletonBox width="100%" height="100px" />
              <SkeletonBox width="200px" height="50px" />
            </div>

            <div>
              <h3>SkeletonCircle</h3>
              <div
                style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
              >
                <SkeletonCircle size="40px" />
                <SkeletonCircle size="60px" />
                <SkeletonCircle size="80px" />
              </div>
            </div>
          </div>
        </div>
      )}

      {showExample === 2 && (
        <div>
          <h2>Manual Skeleton Configurations</h2>

          <div style={{ marginBottom: '2rem' }}>
            <h3>Paragraph Configuration</h3>
            <SkeletonLoader
              config={{
                type: 'manual',
                paragraphs: 3
              }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3>Words Configuration</h3>
            <SkeletonLoader
              config={{
                type: 'manual',
                words: 12
              }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3>Boxes Configuration</h3>
            <SkeletonLoader
              config={{
                type: 'manual',
                boxes: 3
              }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3>Custom Elements</h3>
            <SkeletonLoader
              config={{
                type: 'manual',
                customElements: [
                  <div
                    key="custom"
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}
                  >
                    <SkeletonCircle size="50px" />
                    <div style={{ flex: 1 }}>
                      <SkeletonText
                        width="60%"
                        height="1.2rem"
                        className="mb-2"
                      />
                      <SkeletonText width="40%" height="0.9rem" />
                    </div>
                  </div>
                ]
              }}
            />
          </div>
        </div>
      )}

      {showExample === 3 && (
        <div>
          <h2>Smart Skeleton Detection</h2>
          <div style={{ marginBottom: '1rem' }}>
            <button onClick={captureLayout} disabled={isCapturing}>
              Capture Current Layout
            </button>
            <button onClick={stopCapture} style={{ marginLeft: '1rem' }}>
              Stop Capture
            </button>
          </div>

          {isCapturing && <p>Analyzing layout...</p>}

          {skeletonConfig && (
            <div style={{ marginBottom: '2rem' }}>
              <h3>Generated Smart Skeleton</h3>
              <SkeletonLoader config={skeletonConfig} />
            </div>
          )}

          <div
            ref={contentRef}
            style={{
              border: '2px dashed #ccc',
              padding: '1rem',
              marginBottom: '2rem'
            }}
          >
            <h3>Sample Content for Analysis</h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}
            >
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  background: '#ddd',
                  borderRadius: '50%'
                }}
              ></div>
              <div>
                <h4>Sample Title</h4>
                <p>
                  This is sample content that the smart skeleton will analyze.
                </p>
              </div>
            </div>
            <div
              style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}
            >
              <span
                style={{
                  background: '#e0e0e0',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem'
                }}
              >
                Tag 1
              </span>
              <span
                style={{
                  background: '#e0e0e0',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem'
                }}
              >
                Tag 2
              </span>
            </div>
            <button style={{ marginRight: '0.5rem' }}>Action 1</button>
            <button>Action 2</button>
          </div>
        </div>
      )}

      {showExample === 4 && (
        <div>
          <h2>Specialized Posts Skeleton</h2>

          <div style={{ marginBottom: '2rem' }}>
            <h3>Default Posts Skeleton</h3>
            <SmartPostsSkeleton submissionCount={3} showPagination={true} />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3>Thread Mode Posts Skeleton</h3>
            <SmartPostsSkeleton
              submissionCount={2}
              showPagination={false}
              enableThreadMode={true}
            />
          </div>
        </div>
      )}

      {showExample === 5 && (
        <div>
          <h2>Real Content (For Comparison)</h2>
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem'
              }}
            >
              <span style={{ fontWeight: 500 }}>John Doe</span>
              <span style={{ color: '#666', fontSize: '0.875rem' }}>
                2 hours ago
              </span>
            </div>
            <h3
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.125rem',
                fontWeight: 600
              }}
            >
              How to implement skeleton loaders in React
            </h3>
            <p style={{ margin: '0 0 0.75rem 0', color: '#666' }}>
              A comprehensive guide to creating smooth loading states with
              skeleton components.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '0.75rem'
              }}
            >
              <span
                style={{
                  background: '#e0f2fe',
                  color: '#0369a1',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem'
                }}
              >
                React
              </span>
              <span
                style={{
                  background: '#e0f2fe',
                  color: '#0369a1',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem'
                }}
              >
                UI/UX
              </span>
              <span
                style={{
                  background: '#e0f2fe',
                  color: '#0369a1',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem'
                }}
              >
                TypeScript
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                style={{
                  background: 'none',
                  border: '1px solid #ddd',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                Reply
              </button>
              <button
                style={{
                  background: 'none',
                  border: '1px solid #ddd',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                Expand (3)
              </button>
            </div>
          </div>

          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem'
              }}
            >
              <span style={{ fontWeight: 500 }}>Jane Smith</span>
              <span style={{ color: '#666', fontSize: '0.875rem' }}>
                4 hours ago
              </span>
            </div>
            <h3
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.125rem',
                fontWeight: 600
              }}
            >
              Best practices for loading states
            </h3>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '0.75rem'
              }}
            >
              <span
                style={{
                  background: '#e0f2fe',
                  color: '#0369a1',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem'
                }}
              >
                Design
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                style={{
                  background: 'none',
                  border: '1px solid #ddd',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkeletonExamples;
