'use client';

import { useAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { shouldUpdateAtom } from '../../../../lib/state/atoms';
import { getEffectiveCharacterCount } from '../../../../lib/utils/string';
import { validateTagsInput } from '../../../../lib/utils/string/tag-regex';
import { ContentWithPills } from '../../ui/ContentWithPills';
import { SmartInput } from '../../ui/SmartInput';
import { createSubmissionAction, editSubmissionAction } from '../actions';
import { Submission } from '../schema';
import './SharedSubmissionForm.css';

interface SharedSubmissionFormProps {
  mode: 'create' | 'reply' | 'edit';
  parentId?: number;
  onSuccess?: (result?: {
    status: number;
    message?: string;
    error?: string;
    submission?: Submission;
  }) => void;
  replyToAuthor?: string;
  contextId?: string;
  className?: string;
  // Edit mode props
  submissionId?: number;
  initialTitle?: string;
  initialContent?: string;
  initialTags?: string;
}

// Helper function to upload image file
const uploadImageFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/upload/image', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload image');
  }

  const result = await response.json();
  return result.url;
};

// Helper function to convert file to data URL for temporary storage
const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper function to process temporary images and upload them
const processTemporaryImages = async (content: string): Promise<string> => {
  // Find all temporary image pills
  const tempImageRegex =
    /!\[([^\]]*)\]\(data:temp-image;name=[^;]*;(data:image\/[^;]*;base64,[A-Za-z0-9+/=]+)\)/g;
  const tempImages: Array<{
    fullMatch: string;
    behavior: string;
    dataURL: string;
    start: number;
    end: number;
  }> = [];

  let match;
  while ((match = tempImageRegex.exec(content)) !== null) {
    tempImages.push({
      fullMatch: match[0],
      behavior: match[1],
      dataURL: match[2],
      start: match.index,
      end: match.index + match[0].length
    });
  }

  if (tempImages.length === 0) {
    return content; // No temporary images to process
  }

  // Convert data URLs back to files and upload them
  const uploadPromises = tempImages.map(async (tempImage) => {
    try {
      // Convert data URL back to file
      const response = await fetch(tempImage.dataURL);
      const blob = await response.blob();
      const file = new File([blob], 'pasted-image.png', { type: blob.type });

      // Upload the file
      const uploadedURL = await uploadImageFile(file);

      return {
        ...tempImage,
        uploadedURL
      };
    } catch (error) {
      console.error('Failed to upload temporary image:', error);
      return {
        ...tempImage,
        uploadedURL: null
      };
    }
  });

  const uploadResults = await Promise.all(uploadPromises);

  // Replace temporary pills with uploaded URLs (process from end to start)
  let processedContent = content;
  const sortedResults = uploadResults.sort((a, b) => b.start - a.start);

  for (const result of sortedResults) {
    if (result.uploadedURL) {
      // Replace with uploaded URL
      const newPill = `![${result.behavior}](${result.uploadedURL})`;
      processedContent =
        processedContent.slice(0, result.start) +
        newPill +
        processedContent.slice(result.end);
    } else {
      // Remove failed uploads
      processedContent =
        processedContent.slice(0, result.start) +
        '[Image upload failed]' +
        processedContent.slice(result.end);
    }
  }

  return processedContent;
};

// Component that wraps ContentWithPills and adds cursor/selection visualization
const ContentWithPillsAndCursor: React.FC<{
  content: string;
  contextId: string;
  isEditMode?: boolean;
  className?: string;
  cursorPosition: number;
  selectionStart: number;
  selectionEnd: number;
  showCursor: boolean;
}> = ({
  content,
  contextId,
  isEditMode,
  className,
  cursorPosition,
  selectionStart,
  selectionEnd,
  showCursor
}) => {
  const hasSelection = selectionStart !== selectionEnd;

  // If no cursor or selection to show, just render the normal component
  if (!showCursor && !hasSelection) {
    return (
      <ContentWithPills
        content={content}
        contextId={contextId}
        isEditMode={isEditMode}
        className={className}
      />
    );
  }

  // Split content to insert cursor and selection markers
  const beforeSelection = content.slice(0, selectionStart);
  const selectedText = content.slice(selectionStart, selectionEnd);
  const afterSelection = content.slice(selectionEnd);

  return (
    <div className={`content-with-cursor ${className || ''}`}>
      {beforeSelection && (
        <ContentWithPills
          content={beforeSelection}
          contextId={`${contextId}-before`}
          isEditMode={isEditMode}
          className="content-part"
        />
      )}

      {hasSelection ? (
        <span className="text-selection">
          <ContentWithPills
            content={selectedText}
            contextId={`${contextId}-selected`}
            isEditMode={isEditMode}
            className="content-part"
          />
        </span>
      ) : (
        showCursor && <span className="text-cursor" />
      )}

      {afterSelection && (
        <ContentWithPills
          content={afterSelection}
          contextId={`${contextId}-after`}
          isEditMode={isEditMode}
          className="content-part"
        />
      )}
    </div>
  );
};

// Portal component to render suggestions in document.body to avoid clipping
const SuggestionPortal: React.FC<{
  children: React.ReactNode;
  isVisible: boolean;
}> = ({ children, isVisible }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isVisible || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
};

// Custom Form Pill Input Component using hybrid approach
const FormPillInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  disabled?: boolean;
  contextId: string;
  as: 'input' | 'textarea';
  rows?: number;
  viewMode?: 'preview' | 'raw';
}> = ({
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  contextId,
  as,
  rows,
  viewMode = 'preview'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [hasSuggestions, setHasSuggestions] = useState(false);
  const [suggestionData, setSuggestionData] = useState<{
    rect: { top: number; left: number; width: number };
    suggestions: Array<{
      trigger: string;
      label: string;
      value: string;
      type: 'hashtag' | 'user';
      originalElement: HTMLElement;
      index: number;
    }>;
  } | null>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [portalPosition, setPortalPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [hoveredSuggestionIndex, setHoveredSuggestionIndex] = useState(-1);
  const hasSuggestionsRef = useRef(false);
  const suggestionDataRef = useRef<typeof suggestionData>(null);

  // Track cursor position and selection from the hidden input
  const updateCursorAndSelection = () => {
    if (containerRef.current) {
      const hiddenInput = containerRef.current.querySelector(
        '.form-pill-input__smart-overlay input, .form-pill-input__smart-overlay textarea'
      ) as HTMLInputElement | HTMLTextAreaElement;
      if (hiddenInput) {
        const start = hiddenInput.selectionStart || 0;
        const end = hiddenInput.selectionEnd || 0;
        setCursorPosition(start);
        setSelectionStart(start);
        setSelectionEnd(end);
      }
    }
  };

  // Set up event listeners for cursor tracking and suggestion detection
  useEffect(() => {
    if (containerRef.current) {
      const hiddenInput = containerRef.current.querySelector(
        '.form-pill-input__smart-overlay input, .form-pill-input__smart-overlay textarea'
      ) as HTMLInputElement | HTMLTextAreaElement;
      if (hiddenInput) {
        const handleFocus = () => {
          setIsFocused(true);
          updateCursorAndSelection();
        };

        const handleBlur = () => {
          setIsFocused(false);
        };

        const handleSelectionChange = () => {
          updateCursorAndSelection();
        };

        const handleKeyDown = (e: Event) => {
          const keyboardEvent = e as KeyboardEvent;
          // If Enter or Tab is pressed while suggestions are visible, clear our portal
          if (
            (keyboardEvent.key === 'Enter' || keyboardEvent.key === 'Tab') &&
            hasSuggestionsRef.current &&
            suggestionDataRef.current
          ) {
            // Small delay to let the SmartInput process the selection first
            setTimeout(() => {
              setSuggestionData(null);
              suggestionDataRef.current = null;
              setHasSuggestions(false);
              hasSuggestionsRef.current = false;
              setSelectedSuggestionIndex(-1);
              setHoveredSuggestionIndex(-1);
              setPortalPosition(null);
            }, 50);
          }
        };

        // Add event listeners
        hiddenInput.addEventListener('focus', handleFocus);
        hiddenInput.addEventListener('blur', handleBlur);
        hiddenInput.addEventListener('keyup', handleSelectionChange);
        hiddenInput.addEventListener('mouseup', handleSelectionChange);
        hiddenInput.addEventListener('select', handleSelectionChange);
        hiddenInput.addEventListener('keydown', handleKeyDown);

        // Watch for suggestion dropdown changes and selection updates
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (
              mutation.type === 'childList' ||
              mutation.type === 'attributes'
            ) {
              const suggestionList =
                containerRef.current?.querySelector('.suggestion-list');
              const inlineSuggestions = containerRef.current?.querySelector(
                '.inline-suggestion-input__suggestions'
              );
              const hasActiveSuggestions = Boolean(
                suggestionList || inlineSuggestions
              );

              if (
                hasActiveSuggestions &&
                suggestionList &&
                containerRef.current
              ) {
                // Store suggestion data for portal rendering
                const displayOverlay = containerRef.current.querySelector(
                  '.form-pill-input__display-overlay'
                ) as HTMLElement;
                if (displayOverlay) {
                  const rect = displayOverlay.getBoundingClientRect();
                  const suggestionElement = suggestionList as HTMLElement;

                  // Extract suggestion data from DOM
                  const suggestionItems =
                    suggestionElement.querySelectorAll('.suggestion-item');

                  // Find the currently selected suggestion
                  let currentSelectedIndex = -1;
                  const suggestions = Array.from(suggestionItems).map(
                    (item, index) => {
                      const trigger =
                        item.querySelector('.suggestion-trigger')
                          ?.textContent || '';
                      const label =
                        item.querySelector('.suggestion-label')?.textContent ||
                        '';

                      // Check if this item is selected
                      if (item.classList.contains('selected')) {
                        currentSelectedIndex = index;
                      }

                      // Parse the suggestion data more carefully
                      let suggestionValue = '';
                      let suggestionType: 'hashtag' | 'user' = 'hashtag';

                      if (trigger === '@') {
                        suggestionType = 'user';
                        // For users, the value should be the user ID, which we need to extract
                        // The label format is typically "username" or "username (display name)"
                        suggestionValue = label.split(' ')[0];
                      } else if (trigger === '#') {
                        suggestionType = 'hashtag';
                        // For hashtags, extract the hashtag value
                        suggestionValue = label.replace('#', '');
                      }

                      return {
                        trigger,
                        label,
                        value: suggestionValue,
                        type: suggestionType,
                        originalElement: item as HTMLElement,
                        index
                      };
                    }
                  );

                  // Update selected index
                  setSelectedSuggestionIndex(currentSelectedIndex);

                  const newSuggestionData = {
                    rect: {
                      top: rect.bottom,
                      left: rect.left,
                      width: rect.width
                    },
                    suggestions
                  };

                  setSuggestionData(newSuggestionData);
                  suggestionDataRef.current = newSuggestionData;

                  // Hide the original suggestion element but keep it in DOM for functionality
                  suggestionElement.style.position = 'absolute';
                  suggestionElement.style.top = '-9999px';
                  suggestionElement.style.left = '-9999px';
                  suggestionElement.style.opacity = '0';
                  suggestionElement.style.pointerEvents = 'auto'; // Allow clicks for keyboard navigation
                  suggestionElement.style.zIndex = '-1';
                }
              } else {
                // Clear suggestion data when no suggestions
                setSuggestionData(null);
                suggestionDataRef.current = null;
                setSelectedSuggestionIndex(-1);
                setHoveredSuggestionIndex(-1);
              }

              setHasSuggestions(hasActiveSuggestions);
              hasSuggestionsRef.current = hasActiveSuggestions;
            }
          });
        });

        // Start observing the smart overlay for suggestion changes
        const smartOverlay = containerRef.current.querySelector(
          '.form-pill-input__smart-overlay'
        );
        if (smartOverlay) {
          observer.observe(smartOverlay, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
          });
        }

        // Cleanup
        return () => {
          hiddenInput.removeEventListener('focus', handleFocus);
          hiddenInput.removeEventListener('blur', handleBlur);
          hiddenInput.removeEventListener('keyup', handleSelectionChange);
          hiddenInput.removeEventListener('mouseup', handleSelectionChange);
          hiddenInput.removeEventListener('select', handleSelectionChange);
          hiddenInput.removeEventListener('keydown', handleKeyDown);
          observer.disconnect();
        };
      }
    }
  }, [value]); // Re-run when value changes to ensure we have the latest input element

  // Keep the hidden input focused when suggestions appear and ensure it can receive keyboard events
  useEffect(() => {
    if (suggestionData && containerRef.current) {
      // Ensure the hidden input stays focused when suggestions appear
      const hiddenInput = containerRef.current.querySelector(
        '.form-pill-input__smart-overlay input, .form-pill-input__smart-overlay textarea'
      ) as HTMLInputElement | HTMLTextAreaElement;

      if (hiddenInput) {
        // Always ensure the input is focused when suggestions are visible
        if (document.activeElement !== hiddenInput) {
          hiddenInput.focus();
        }

        // Add a small delay to ensure focus is properly set
        setTimeout(() => {
          if (document.activeElement !== hiddenInput) {
            hiddenInput.focus();
          }
        }, 0);
      }
    }
  }, [suggestionData]);

  // Update portal position on scroll and initially
  useEffect(() => {
    const updatePortalPosition = () => {
      if (containerRef.current && suggestionData) {
        const displayOverlay = containerRef.current.querySelector(
          '.form-pill-input__display-overlay'
        ) as HTMLElement;
        if (displayOverlay) {
          const rect = displayOverlay.getBoundingClientRect();
          setPortalPosition({
            top: rect.bottom,
            left: rect.left,
            width: rect.width
          });
        }
      } else {
        setPortalPosition(null);
      }
    };

    // Update position initially when suggestions appear
    updatePortalPosition();

    if (suggestionData) {
      // Update position on scroll and resize
      const handleScroll = () => {
        updatePortalPosition();
      };

      // Listen to scroll events on window and document
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleScroll, { passive: true });

      // Also listen to scroll events on all scrollable parent elements
      let element = containerRef.current?.parentElement;
      const scrollableElements: Element[] = [];

      while (element && element !== document.body) {
        const style = window.getComputedStyle(element);
        if (
          style.overflow === 'auto' ||
          style.overflow === 'scroll' ||
          style.overflowY === 'auto' ||
          style.overflowY === 'scroll'
        ) {
          scrollableElements.push(element);
          element.addEventListener('scroll', handleScroll, { passive: true });
        }
        element = element.parentElement;
      }

      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
        scrollableElements.forEach((el) => {
          el.removeEventListener('scroll', handleScroll);
        });
      };
    }
  }, [suggestionData]);

  // Raw mode: simple text input/textarea
  if (viewMode === 'raw') {
    const InputComponent = as === 'textarea' ? 'textarea' : 'input';

    return (
      <InputComponent
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`form-pill-input__raw-input ${className}`}
        disabled={disabled}
        rows={as === 'textarea' ? rows : undefined}
      />
    );
  }

  // Preview mode: hybrid approach with always-visible inline content + smart suggestions
  const handleDisplayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Focus the hidden input within this specific container
    if (containerRef.current) {
      const hiddenInput = containerRef.current.querySelector(
        '.form-pill-input__smart-overlay input, .form-pill-input__smart-overlay textarea'
      ) as HTMLInputElement | HTMLTextAreaElement;
      if (hiddenInput) {
        hiddenInput.focus();

        // Calculate cursor position based on click location
        const displayElement = e.currentTarget;
        const rect = displayElement.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Estimate cursor position based on click coordinates
        const cursorPos = estimateCursorPosition(
          value,
          clickX,
          clickY,
          displayElement
        );

        // Set cursor position in the hidden input
        setTimeout(() => {
          hiddenInput.setSelectionRange(cursorPos, cursorPos);
          updateCursorAndSelection();
        }, 0);
      }
    }
  };

  // Handle focus events
  const handleFocus = () => {
    setIsFocused(true);
    updateCursorAndSelection();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Handle input events to track cursor position
  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setTimeout(updateCursorAndSelection, 0);
  };

  // Function to insert suggestion directly into the input
  const insertSuggestionIntoInput = (suggestion: {
    trigger: string;
    label: string;
    value: string;
    type: 'hashtag' | 'user';
    originalElement: HTMLElement;
  }) => {
    // Get the hidden input element first
    if (containerRef.current) {
      const hiddenInput = containerRef.current.querySelector(
        '.form-pill-input__smart-overlay input, .form-pill-input__smart-overlay textarea'
      ) as HTMLInputElement | HTMLTextAreaElement;

      if (hiddenInput) {
        const currentValue = value || '';
        const cursorPosition = hiddenInput.selectionStart || 0;

        // Find the trigger start position by looking backwards from cursor
        const beforeCursor = currentValue.substring(0, cursorPosition);
        const triggerIndex = beforeCursor.lastIndexOf(suggestion.trigger);

        if (triggerIndex !== -1) {
          // Calculate the parts of the text
          const before = currentValue.substring(0, triggerIndex);
          const after = currentValue.substring(cursorPosition);

          // Create the replacement text based on suggestion type
          let replacement = '';

          if (suggestion.type === 'user') {
            // Create enhanced mention format: @[username|userId|author]
            // For users, suggestion.value is the userId, and we need to extract clean username from label
            const userId = suggestion.value;

            // Extract clean username from label (remove metadata like "(5 posts)")
            let cleanUsername = suggestion.label;
            if (cleanUsername.includes('(')) {
              cleanUsername = cleanUsername.split('(')[0].trim();
            }

            // Remove @ if present at the start
            if (cleanUsername.startsWith('@')) {
              cleanUsername = cleanUsername.substring(1);
            }

            // Create enhanced mention with default filter type
            replacement = `@[${cleanUsername}|${userId}|author] `;
          } else if (suggestion.type === 'hashtag') {
            // Handle hashtags - use suggestion.value which should be the clean hashtag
            let hashtagValue = suggestion.value;

            // If the value has metadata, extract just the hashtag part
            if (hashtagValue.includes('(')) {
              hashtagValue = hashtagValue.split('(')[0].trim();
            }

            // Remove # if present at the start
            if (hashtagValue.startsWith('#')) {
              hashtagValue = hashtagValue.substring(1);
            }

            replacement = `#${hashtagValue} `;
          } else {
            // Fallback for other types
            replacement = `${suggestion.trigger}${suggestion.value} `;
          }

          // Create the new value
          const newValue = before + replacement + after;
          const newCursorPosition = before.length + replacement.length;

          // Update the input value
          onChange(newValue);

          // Focus and set cursor position
          setTimeout(() => {
            hiddenInput.focus();
            hiddenInput.setSelectionRange(newCursorPosition, newCursorPosition);
            updateCursorAndSelection();
          }, 0);
        }
      }
    }

    // Clear suggestions after processing
    setSuggestionData(null);
    suggestionDataRef.current = null;
    setHasSuggestions(false);
    hasSuggestionsRef.current = false;
    setSelectedSuggestionIndex(-1);
    setHoveredSuggestionIndex(-1);
    setPortalPosition(null);
  };

  // Helper function to estimate cursor position based on click coordinates
  const estimateCursorPosition = (
    text: string,
    clickX: number,
    clickY: number,
    element: HTMLElement
  ): number => {
    if (!text) return 0;

    // Create a temporary element to measure text more accurately
    const measureElement = document.createElement('div');
    measureElement.style.position = 'absolute';
    measureElement.style.visibility = 'hidden';
    measureElement.style.whiteSpace = 'pre-wrap';
    measureElement.style.font = window.getComputedStyle(element).font;
    measureElement.style.fontSize = window.getComputedStyle(element).fontSize;
    measureElement.style.fontFamily =
      window.getComputedStyle(element).fontFamily;
    measureElement.style.lineHeight =
      window.getComputedStyle(element).lineHeight;
    measureElement.style.padding = window.getComputedStyle(element).padding;
    measureElement.style.width = element.clientWidth + 'px';
    document.body.appendChild(measureElement);

    try {
      // Get the actual text content (strip pill formatting for measurement)
      const displayText = text
        .replace(/@\[[^\]]+\]/g, (match) => {
          // Replace structured mentions with display format @username
          const usernameMatch = match.match(/@\[([^|]+)\|/);
          return usernameMatch ? `@${usernameMatch[1]}` : match;
        })
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '[image]') // Replace image pills with placeholder
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Replace URL pills with text

      measureElement.textContent = displayText;

      // Find the closest character position
      let bestPosition = 0;
      let minDistance = Infinity;

      // Test each character position
      for (let i = 0; i <= displayText.length; i++) {
        const range = document.createRange();
        const textNode = measureElement.firstChild;

        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          range.setStart(
            textNode,
            Math.min(i, textNode.textContent?.length || 0)
          );
          range.setEnd(
            textNode,
            Math.min(i, textNode.textContent?.length || 0)
          );

          const rect = range.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();

          // Calculate distance from click point to this character position
          const charX = rect.left - elementRect.left;
          const charY = rect.top - elementRect.top + rect.height / 2;

          const distance = Math.sqrt(
            Math.pow(clickX - charX, 2) + Math.pow(clickY - charY, 2)
          );

          if (distance < minDistance) {
            minDistance = distance;
            bestPosition = i;
          }
        }
      }

      // Map display position back to original text position
      // This is approximate since we simplified the text for measurement
      const ratio = bestPosition / displayText.length;
      const originalPosition = Math.round(ratio * text.length);

      return Math.max(0, Math.min(originalPosition, text.length));
    } finally {
      document.body.removeChild(measureElement);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`form-pill-input form-pill-input--hybrid ${className} ${isFocused ? 'form-pill-input--focused' : ''} ${hasSuggestions ? 'form-pill-input--with-suggestions' : ''}`}
    >
      {/* Always visible content with pills, cursor, and selection */}
      <div
        className="form-pill-input__display-overlay"
        onClick={handleDisplayClick}
      >
        {value ? (
          <ContentWithPillsAndCursor
            content={value}
            contextId={contextId}
            isEditMode={true}
            className="form-pill-input__content"
            cursorPosition={cursorPosition}
            selectionStart={selectionStart}
            selectionEnd={selectionEnd}
            showCursor={isFocused}
          />
        ) : (
          <span className="form-pill-input__placeholder">{placeholder}</span>
        )}
      </div>

      {/* Completely hidden input for smart suggestions - positioned off-screen */}
      <div className="form-pill-input__smart-overlay">
        <SmartInput
          value={value}
          onChange={handleInputChange}
          placeholder=""
          className="form-pill-input__hidden-input"
          disabled={disabled}
          as={as}
          rows={rows}
          enableHashtags={true}
          enableUserMentions={true}
          enableEmojis={true}
        />
      </div>

      {/* Portal for suggestions to avoid clipping */}
      <SuggestionPortal isVisible={!!suggestionData && !!portalPosition}>
        {suggestionData && portalPosition && (
          <div
            ref={portalRef}
            className="suggestion-list"
            style={{
              position: 'fixed',
              top: portalPosition.top,
              left: portalPosition.left,
              width: portalPosition.width,
              zIndex: 10000,
              backgroundColor: 'var(--light-background--primary)',
              border: '1px solid var(--light-border--primary)',
              borderRadius: 'var(--border-radius)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            <div className="suggestion-header">
              <span className="suggestion-count">
                {suggestionData.suggestions.length} of{' '}
                {suggestionData.suggestions.length} results
              </span>
            </div>
            {suggestionData.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`suggestion-item ${
                  index === selectedSuggestionIndex ? 'selected' : ''
                } ${index === hoveredSuggestionIndex ? 'hovered' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertSuggestionIntoInput(suggestion);
                }}
                onMouseDown={(e) => {
                  // Handle selection in mousedown as backup
                  e.preventDefault();
                  e.stopPropagation();
                  insertSuggestionIntoInput(suggestion);
                }}
                onMouseEnter={() => {
                  setHoveredSuggestionIndex(index);
                  // Also add hover state to original element for consistency
                  if (suggestion.originalElement) {
                    suggestion.originalElement.classList.add(
                      'suggestion-item--hovered'
                    );
                  }
                }}
                onMouseLeave={() => {
                  setHoveredSuggestionIndex(-1);
                  // Remove hover state from original element
                  if (suggestion.originalElement) {
                    suggestion.originalElement.classList.remove(
                      'suggestion-item--hovered'
                    );
                  }
                }}
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              >
                <span className="suggestion-trigger">{suggestion.trigger}</span>
                <span className="suggestion-label">{suggestion.label}</span>
              </div>
            ))}
          </div>
        )}
      </SuggestionPortal>
    </div>
  );
};

export function SharedSubmissionForm({
  mode,
  parentId,
  onSuccess,
  replyToAuthor,
  contextId,
  className = '',
  submissionId,
  initialTitle = '',
  initialContent = '',
  initialTags = ''
}: SharedSubmissionFormProps) {
  const [, setShouldUpdate] = useAtom(shouldUpdateAtom);
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tagErrors, setTagErrors] = useState<string[]>([]);
  const [contentViewMode, setContentViewMode] = useState<'preview' | 'raw'>(
    'preview'
  );

  // Initialize form data based on mode
  useEffect(() => {
    const initializeForm = async () => {
      if (mode === 'edit') {
        const newFormData = {
          title: initialTitle,
          content: initialContent,
          tags: initialTags
        };
        setFormData(newFormData);
      } else if (mode === 'reply' && replyToAuthor) {
        // Create properly formatted mention for reply
        try {
          const { getUserInfo } = await import(
            '../../../../lib/actions/search.actions'
          );
          const userInfo = await getUserInfo(replyToAuthor);

          const properMention =
            userInfo && userInfo.userId
              ? `@[${replyToAuthor}|${userInfo.userId}|author] `
              : `@${replyToAuthor} `;

          setFormData({
            title: '',
            content: properMention,
            tags: ''
          });
        } catch (error) {
          console.error('Error creating mention format:', error);
          // Fallback to simple format
          setFormData({
            title: '',
            content: `@${replyToAuthor} `,
            tags: ''
          });
        }
      } else {
        setFormData({
          title: '',
          content: '',
          tags: ''
        });
      }
    };

    initializeForm();
  }, [mode, initialTitle, initialContent, initialTags, replyToAuthor]);

  const isReply = mode === 'reply';
  const isEdit = mode === 'edit';
  const titleLabel = isReply
    ? 'Reply Title'
    : isEdit
      ? 'Edit Title'
      : 'Post Title';
  const contentLabel = isReply
    ? 'Reply Content'
    : isEdit
      ? 'Edit Content'
      : 'Post Content';
  const submitText = isReply
    ? 'Submit Reply'
    : isEdit
      ? 'Update Post'
      : 'Create Post';
  const submittingText = isReply
    ? 'Submitting Reply...'
    : isEdit
      ? 'Updating Post...'
      : 'Creating Post...';

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    // For title and content fields, FormPillInput already handles URL conversion
    // So we just save the value directly
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // Validate tags if tags field changed
    if (field === 'tags') {
      const validationErrors = validateTagsInput(value);
      setTagErrors(validationErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }

    if (getEffectiveCharacterCount(formData.title) > 255) {
      setError('Title must be 255 characters or less');
      return;
    }

    if (getEffectiveCharacterCount(formData.content) > 1000) {
      setError('Content must be 1000 characters or less');
      return;
    }

    if (tagErrors.length > 0) {
      setError('Please fix tag errors before submitting');
      return;
    }

    if (isReply && !parentId) {
      setError('Parent ID is required for replies');
      return;
    }

    if (isEdit && !submissionId) {
      setError('Submission ID is required for editing');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const submitFormData = new FormData();
      submitFormData.append('submission_title', formData.title.trim());
      submitFormData.append('submission_content', formData.content.trim());
      submitFormData.append('submission_tags', formData.tags.trim());

      // Add parent ID for replies
      if (isReply && parentId) {
        submitFormData.append('thread_parent_id', parentId.toString());
      }

      // Add submission ID for edits
      if (isEdit && submissionId) {
        submitFormData.append('submission_id', submissionId.toString());
      }

      // Choose the correct action based on mode
      const action = isEdit ? editSubmissionAction : createSubmissionAction;
      const result = await action({ status: 0 }, submitFormData);

      if (result.status === 1) {
        // Reset form only for create/reply modes, not edit
        if (!isEdit) {
          if (mode === 'reply' && replyToAuthor) {
            // Try to get proper mention format for reset
            try {
              const { getUserInfo } = await import(
                '../../../../lib/actions/search.actions'
              );
              const userInfo = await getUserInfo(replyToAuthor);

              const properMention =
                userInfo && userInfo.userId
                  ? `@[${replyToAuthor}|${userInfo.userId}|author] `
                  : `@${replyToAuthor} `;

              setFormData({
                title: '',
                content: properMention,
                tags: ''
              });
            } catch (error) {
              console.error('Error creating mention format for reset:', error);
              setFormData({
                title: '',
                content: `@${replyToAuthor} `,
                tags: ''
              });
            }
          } else {
            setFormData({
              title: '',
              content: '',
              tags: ''
            });
          }
        }
        setTagErrors([]);
        setShouldUpdate(true);

        // Call success callback
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        const errorMessage =
          result.error ||
          `Failed to ${isReply ? 'submit reply' : isEdit ? 'update post' : 'create post'}`;
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formData.title.trim() && formData.content.trim() && tagErrors.length === 0;

  const titleCharsRemaining = 255 - getEffectiveCharacterCount(formData.title);
  const contentCharsRemaining =
    1000 - getEffectiveCharacterCount(formData.content);

  return (
    <form
      onSubmit={handleSubmit}
      className={`shared-submission-form ${className}`}
    >
      {/* Title Field */}
      <div className="shared-submission-form__field">
        <label className="shared-submission-form__label">{titleLabel} *</label>
        <FormPillInput
          value={formData.title}
          onChange={(value) => handleInputChange('title', value)}
          placeholder={`Enter a ${isReply ? 'reply' : isEdit ? 'post' : 'post'} title... Use #hashtags, @mentions, and paste URLs!`}
          className={`shared-submission-form__form-input ${
            titleCharsRemaining < 0
              ? 'shared-submission-form__input--error'
              : ''
          }`}
          disabled={isSubmitting}
          contextId={`${contextId || 'shared-form'}-title`}
          as="input"
          viewMode="preview"
        />
        <div className="shared-submission-form__char-count">
          <span
            className={
              titleCharsRemaining < 0
                ? 'shared-submission-form__char-count--error'
                : ''
            }
          >
            {titleCharsRemaining} characters remaining
          </span>
        </div>
      </div>

      {/* Content Field */}
      <div className="shared-submission-form__field">
        <div className="shared-submission-form__field-header">
          <label className="shared-submission-form__label">
            {contentLabel} *
          </label>
          <div className="shared-submission-form__view-toggle">
            <button
              type="button"
              className={`shared-submission-form__toggle-btn ${
                contentViewMode === 'preview'
                  ? 'shared-submission-form__toggle-btn--active'
                  : ''
              }`}
              onClick={() => setContentViewMode('preview')}
              disabled={isSubmitting}
            >
              PREVIEW
            </button>
            <button
              type="button"
              className={`shared-submission-form__toggle-btn ${
                contentViewMode === 'raw'
                  ? 'shared-submission-form__toggle-btn--active'
                  : ''
              }`}
              onClick={() => setContentViewMode('raw')}
              disabled={isSubmitting}
            >
              RAW
            </button>
          </div>
        </div>

        <FormPillInput
          value={formData.content}
          onChange={(value) => handleInputChange('content', value)}
          placeholder={
            contentViewMode === 'preview'
              ? `Write your ${isReply ? 'reply' : isEdit ? 'post' : 'post'} content... Use #hashtags, @mentions, and paste URLs!`
              : `Write your ${isReply ? 'reply' : isEdit ? 'post' : 'post'} content... Raw text mode for easy editing of #hashtags, @mentions, and ![behavior](URLs)`
          }
          className={`shared-submission-form__form-input ${
            contentCharsRemaining < 0
              ? 'shared-submission-form__textarea--error'
              : ''
          }`}
          disabled={isSubmitting}
          contextId={`${contextId || 'shared-form'}-content`}
          as="textarea"
          rows={4}
          viewMode={contentViewMode}
        />

        <div className="shared-submission-form__char-count">
          <span
            className={
              contentCharsRemaining < 0
                ? 'shared-submission-form__char-count--error'
                : ''
            }
          >
            {contentCharsRemaining} characters remaining
          </span>
        </div>
      </div>

      {/* Tags Field */}
      <div className="shared-submission-form__field">
        <label className="shared-submission-form__label">Additional Tags</label>
        <SmartInput
          value={formData.tags}
          onChange={(value) => handleInputChange('tags', value)}
          placeholder="#tag1, #tag2, #tag3"
          className={`shared-submission-form__input ${
            tagErrors.length > 0 ? 'shared-submission-form__input--error' : ''
          }`}
          disabled={isSubmitting}
          enableHashtags={true}
          enableUserMentions={false}
          as="input"
        />
        {tagErrors.length > 0 && (
          <div className="shared-submission-form__tag-errors">
            {tagErrors.map((error, index) => (
              <p
                key={index}
                className="shared-submission-form__error-text"
                role="alert"
              >
                {error}
              </p>
            ))}
          </div>
        )}
        <div className="shared-submission-form__help">
          <span className="shared-submission-form__help-text">
            Tags must start with # and contain only letters, numbers, hyphens,
            and underscores. Tags from your title and content will be
            automatically detected.
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="shared-submission-form__error" role="alert">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="shared-submission-form__actions">
        <button
          type="submit"
          disabled={
            !isFormValid ||
            isSubmitting ||
            titleCharsRemaining < 0 ||
            contentCharsRemaining < 0
          }
          className="shared-submission-form__submit"
        >
          {isSubmitting ? submittingText : submitText}
        </button>
      </div>
    </form>
  );
}
