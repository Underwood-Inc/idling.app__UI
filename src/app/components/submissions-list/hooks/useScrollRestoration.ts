'use client';

import { createLogger } from '@/lib/logging';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { highlightScrollTarget } from '../../../../lib/utils/scroll-highlight';
import {
    generateScrollKey,
    storeOrUpdateScrollPosition
} from '../../../../lib/utils/scroll-position';

// Create hook-specific logger
const logger = createLogger({
  context: {
    component: 'useScrollRestoration',
    module: 'components/submissions-list/hooks'
  },
  enabled: false // Temporarily disable scroll restoration logging
});

export interface ScrollRestorationOptions {
  isLoading: boolean;
  submissions: any[];
  pagination: {
    currentPage: number;
  };
  filters: Array<{ name: string; value: any }>;
  infiniteScrollMode: boolean;
}

export function useScrollRestoration({
  isLoading,
  submissions,
  pagination,
  filters,
  infiniteScrollMode
}: ScrollRestorationOptions) {
  const pathname = usePathname();

  // Handle scroll restoration from thread navigation
  useEffect(() => {
    const restoreKey = sessionStorage.getItem('restore-scroll-key');
    const restorePosition = sessionStorage.getItem('restore-scroll-position');

    if (restoreKey && restorePosition && !isLoading && submissions.length > 0) {
      try {
        const position = JSON.parse(restorePosition);

        // Check if we're on the correct page
        const expectedPage = position.currentPage || 1;
        const currentPage = pagination.currentPage;

        logger.group('scrollRestoration');
        logger.debug('Checking scroll restoration from back navigation', {
          restoreKey,
          position,
          expectedPage,
          currentPage,
          submissionsCount: submissions.length,
          isLoading,
          currentFilters: filters
        });

        // Only restore scroll if we're on the expected page and have data
        if (currentPage === expectedPage && submissions.length > 0) {
          logger.debug('Restoring scroll position from back navigation', {
            scrollY: position.scrollY
          });

          // Clean up session storage immediately to prevent re-restoration
          sessionStorage.removeItem('restore-scroll-key');
          sessionStorage.removeItem('restore-scroll-position');

          // Wait for virtual scrolling system to be ready and then restore scroll
          const attemptScrollRestore = (attempts = 0, maxAttempts = 15) => {
            const submissionsContainer = document.querySelector(
              '.submissions-list--virtual'
            ) as HTMLElement;

            if (!submissionsContainer) {
              if (attempts < maxAttempts) {
                setTimeout(
                  () => attemptScrollRestore(attempts + 1, maxAttempts),
                  150
                );
              } else {
                logger.warn(
                  'Submissions container not found after max attempts',
                  {
                    attempts,
                    maxAttempts
                  }
                );
              }
              return;
            }

            // Check if virtual scrolling has rendered content
            const hasContent = submissionsContainer.querySelector(
              '.submissions-list__content'
            );
            const hasItems =
              submissionsContainer.querySelectorAll('.submissions-list__item')
                .length > 0;

            // Also check for actual submission items with test IDs
            const submissionItems = submissionsContainer.querySelectorAll(
              '[data-testid*="submission-item"]'
            );

            if (!hasContent || (!hasItems && submissionItems.length === 0)) {
              if (attempts < maxAttempts) {
                logger.debug('Waiting for virtual content to render', {
                  attempt: attempts + 1,
                  hasContent: !!hasContent,
                  hasItems,
                  submissionItemsCount: submissionItems.length
                });
                setTimeout(
                  () => attemptScrollRestore(attempts + 1, maxAttempts),
                  250
                );
              } else {
                logger.warn('Virtual content not ready after max attempts', {
                  attempts,
                  maxAttempts
                });
              }
              return;
            }

            // Virtual scrolling is ready, now scroll
            if (position.scrollY && position.scrollY > 0) {
              // Set scrollTop directly for more reliable scrolling
              submissionsContainer.scrollTop = position.scrollY;

              // Also try smooth scrolling as a fallback
              submissionsContainer.scrollTo({
                top: position.scrollY,
                behavior: 'smooth'
              });

              // Apply highlight animation to the element at the scroll position
              setTimeout(() => {
                const highlighted = highlightScrollTarget(
                  submissionsContainer,
                  position.scrollY,
                  {
                    duration: 3500,
                    offset: 150,
                    intensity: 'normal',
                    speed: 'normal',
                    enablePulse: true,
                    enableScale: true
                  }
                );

                if (highlighted) {
                  logger.debug('Applied scroll restoration highlight');
                } else {
                  logger.warn('Failed to find element to highlight');
                }
              }, 200); // Small delay to ensure scroll is complete

              logger.debug('Successfully scrolled submissions container', {
                targetScrollY: position.scrollY,
                actualScrollTop: submissionsContainer.scrollTop,
                attempts: attempts + 1
              });

              // Clear the stored scroll position for this key to prevent future unwanted restorations
              const scrollKey = generateScrollKey(window.location.pathname, {
                page: position.currentPage,
                filters: position.filters,
                searchParams: new URLSearchParams(window.location.search)
              });

              logger.debug(
                'Clearing stored scroll position to prevent future unwanted restorations',
                {
                  scrollKey
                }
              );

              // Clear from localStorage after successful restoration
              try {
                const stored = localStorage.getItem('app-scroll-positions');
                if (stored) {
                  const positions = JSON.parse(stored);
                  delete positions[scrollKey];
                  localStorage.setItem(
                    'app-scroll-positions',
                    JSON.stringify(positions)
                  );
                }
              } catch (error) {
                logger.warn('Failed to clear stored scroll position', {
                  error: error instanceof Error ? error.message : String(error)
                });
              }
            }
          };

          // Start the scroll restoration process with a longer initial delay
          setTimeout(() => attemptScrollRestore(), 300);
        }
        logger.groupEnd();
      } catch (error) {
        logger.warn('Failed to restore scroll position', {
          error: error instanceof Error ? error.message : String(error)
        });
        // Clean up invalid data
        sessionStorage.removeItem('restore-scroll-key');
        sessionStorage.removeItem('restore-scroll-position');
        logger.groupEnd();
      }
    } else {
      logger.group('scrollRestoration');
      logger.debug('No back navigation detected, skipping scroll restoration', {
        hasRestoreKey: !!restoreKey,
        hasRestorePosition: !!restorePosition,
        isLoading,
        submissionsLength: submissions.length
      });
      logger.groupEnd();
    }
  }, [isLoading, submissions.length, pagination.currentPage, filters]);

  // Track scroll position for navigation restoration
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      isLoading ||
      submissions.length === 0
    ) {
      return;
    }

    let scrollTimeout: ReturnType<typeof setTimeout>;
    let isUserScrolling = false;
    let hasRestoredScroll = false;

    const handleScroll = () => {
      // Mark that user is actively scrolling
      isUserScrolling = true;

      // Debounce scroll updates to avoid excessive localStorage writes
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const submissionsContainer = document.querySelector(
          '.submissions-list--virtual'
        ) as HTMLElement;

        if (submissionsContainer) {
          const scrollY = submissionsContainer.scrollTop;

          // Generate scroll key for current state
          const scrollKey = generateScrollKey(window.location.pathname, {
            page: pagination.currentPage,
            filters: filters.reduce(
              (acc, filter) => {
                acc[filter.name] = filter.value;
                return acc;
              },
              {} as Record<string, any>
            ),
            searchParams: new URLSearchParams(window.location.search)
          });

          // If user has manually scrolled after initial load, we should reset stored positions
          if (isUserScrolling && !hasRestoredScroll) {
            logger.debug(
              'User manually scrolled - resetting stored scroll positions to prevent unwanted restoration'
            );

            // Clear any stored scroll position for this page to prevent future unwanted restorations
            try {
              const stored = localStorage.getItem('app-scroll-positions');
              if (stored) {
                const positions = JSON.parse(stored);
                // Clear all positions for this pathname to be thorough
                Object.keys(positions).forEach((key) => {
                  if (key.includes(window.location.pathname)) {
                    delete positions[key];
                  }
                });
                localStorage.setItem(
                  'app-scroll-positions',
                  JSON.stringify(positions)
                );
              }
            } catch (error) {
              logger.warn('Failed to clear stored scroll positions', {
                error: error instanceof Error ? error.message : String(error)
              });
            }

            // Mark that we've handled the user scroll reset
            hasRestoredScroll = true;
          }

          // Update stored scroll position for future back navigation
          storeOrUpdateScrollPosition(
            scrollKey,
            {
              currentPage: pagination.currentPage,
              filters: filters.reduce(
                (acc, filter) => {
                  acc[filter.name] = filter.value;
                  return acc;
                },
                {} as Record<string, any>
              )
            },
            scrollY
          );
        }

        // Reset the scrolling flag after a delay
        setTimeout(() => {
          isUserScrolling = false;
        }, 1000);
      }, 250); // 250ms debounce
    };

    const submissionsContainer = document.querySelector(
      '.submissions-list--virtual'
    ) as HTMLElement;

    if (submissionsContainer) {
      submissionsContainer.addEventListener('scroll', handleScroll, {
        passive: true
      });

      return () => {
        clearTimeout(scrollTimeout);
        submissionsContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isLoading, submissions.length, pagination.currentPage, filters]);

  // Scroll restoration effect for traditional pagination
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Restore scroll position when data loads
    if (submissions.length > 0 && !isLoading && !infiniteScrollMode) {
      const scrollKey = generateScrollKey(pathname, {
        page: pagination.currentPage,
        filters: filters.reduce(
          (acc, filter) => {
            acc[filter.name] = filter.value;
            return acc;
          },
          {} as Record<string, any>
        ),
        searchParams: new URLSearchParams(window.location.search)
      });

      logger.group('scrollRestoration');
      logger.debug('Attempting scroll restoration', {
        scrollKey,
        submissionsLength: submissions.length,
        isLoading,
        infiniteScrollMode,
        pathname,
        currentPage: pagination.currentPage
      });

      const attemptScrollRestore = (attempts = 0, maxAttempts = 15) => {
        try {
          const storedPosition = localStorage.getItem(scrollKey);
          
          // Early exit if no stored position - don't retry
          if (!storedPosition) {
            if (attempts === 0) {
              logger.debug('No stored scroll position found, skipping restoration', {
                scrollKey,
                attempts,
                maxAttempts
              });
            }
            return; // Exit immediately, don't retry
          }

          logger.debug('Stored scroll position', {
            storedPosition,
            attempts,
            maxAttempts
          });

          const position = parseInt(storedPosition, 10);
          if (!isNaN(position) && position > 0) {
            // Check if we can scroll to this position
            const maxScroll = Math.max(
              0,
              document.documentElement.scrollHeight - window.innerHeight
            );

            if (position <= maxScroll + 100) {
              // Allow some tolerance
              window.scrollTo({
                top: position,
                behavior: 'auto' // Instant scroll for restoration
              });

              logger.debug('Scroll restored successfully', {
                position,
                maxScroll,
                attempts
              });

              // Clear the stored position after successful restoration
              try {
                localStorage.removeItem(scrollKey);
              } catch (error) {
                logger.warn('Failed to clear stored scroll position', {
                  scrollKey,
                  error:
                    error instanceof Error ? error.message : String(error)
                });
              }

              return; // Success, exit
            }
          }

          // If we can't restore yet and haven't exceeded max attempts
          if (attempts < maxAttempts) {
            logger.debug('Retrying scroll restoration', {
              attempts: attempts + 1,
              maxAttempts
            });
            setTimeout(() => attemptScrollRestore(attempts + 1), 100);
          } else {
            logger.warn('Max scroll restoration attempts reached', {
              attempts,
              maxAttempts,
              scrollKey
            });
          }
        } catch (error) {
          logger.warn('Failed to restore scroll position', {
            scrollKey,
            attempts,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      };

      // Start restoration attempt
      attemptScrollRestore();
      logger.groupEnd();
    } else {
      logger.group('scrollRestoration');
      logger.debug('Skipping scroll restoration', {
        submissionsLength: submissions.length,
        isLoading,
        infiniteScrollMode
      });
      logger.groupEnd();
    }
  }, [
    submissions,
    isLoading,
    infiniteScrollMode,
    pathname,
    filters,
    pagination
  ]);

  // Cleanup scroll positions on unmount
  useEffect(() => {
    return () => {
      try {
        // Clean up any stored scroll positions when component unmounts
        const keys = Object.keys(localStorage);
        const scrollKeys = keys.filter((key) => key.startsWith('scroll-'));
        scrollKeys.forEach((key) => {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            logger.debug('Failed to remove scroll key', {
              key,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        });
      } catch (error) {
        logger.warn('Failed to clear stored scroll positions', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };
  }, []);
}
