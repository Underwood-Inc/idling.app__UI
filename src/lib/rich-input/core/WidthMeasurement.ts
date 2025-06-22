/**
 * Width Measurement Utility for Rich Input Tokens
 * Provides DOM-accurate measurements for pills in different states
 */

import type { RichContentToken } from '../types';

export interface MeasurementContext {
  isEditMode?: boolean;
  containerElement?: HTMLElement;
  measurementContainer?: HTMLElement;
  className?: string;
}

export interface TokenWidthData {
  normal: number;
  editMode?: number;
  lastMeasured: number;
  containerSelector?: string;
}

export class WidthMeasurementUtility {
  private measurementContainer: HTMLElement | null = null;
  private cachedMeasurements = new Map<string, TokenWidthData>();

  constructor() {
    this.ensureMeasurementContainer();
  }

  /**
   * Measure the width of a token in its current state
   */
  measureToken(
    token: RichContentToken,
    context: MeasurementContext = {}
  ): number {
    const cacheKey = this.getCacheKey(token, context);
    const cached = this.cachedMeasurements.get(cacheKey);

    // Return cached measurement if recent (within 5 seconds)
    if (cached && Date.now() - cached.lastMeasured < 5000) {
      return context.isEditMode
        ? cached.editMode || cached.normal
        : cached.normal;
    }

    const measuredWidth = this.performMeasurement(token, context);

    // Update cache
    const existing = this.cachedMeasurements.get(
      this.getCacheKey(token, { isEditMode: false })
    ) || {
      normal: 0,
      lastMeasured: Date.now()
    };

    if (context.isEditMode) {
      existing.editMode = measuredWidth;
    } else {
      existing.normal = measuredWidth;
    }
    existing.lastMeasured = Date.now();

    this.cachedMeasurements.set(cacheKey, existing);
    return measuredWidth;
  }

  /**
   * Perform the actual DOM measurement
   */
  private performMeasurement(
    token: RichContentToken,
    context: MeasurementContext
  ): number {
    // Return fallback width on server side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return token.rawText.length * 8; // Fallback: ~8px per character
    }

    if (!this.measurementContainer) {
      this.ensureMeasurementContainer();
    }

    if (!this.measurementContainer) {
      return token.rawText.length * 8; // Fallback if container creation failed
    }

    const element = this.createTokenElement(token, context);
    this.measurementContainer.appendChild(element);

    // Force layout calculation
    element.offsetHeight;

    const width = element.offsetWidth;

    // Clean up
    this.measurementContainer!.removeChild(element);

    return width;
  }

  /**
   * Create a token element for measurement
   */
  private createTokenElement(
    token: RichContentToken,
    context: MeasurementContext
  ): HTMLElement {
    // This should only be called on client side, but add safety check
    if (typeof document === 'undefined') {
      throw new Error('createTokenElement called on server side');
    }

    const element = document.createElement('span');

    // Apply base styles
    element.style.position = 'absolute';
    element.style.visibility = 'hidden';
    element.style.whiteSpace = 'nowrap';

    // Apply token-specific classes and content
    switch (token.type) {
      case 'hashtag':
        element.className = 'content-pill content-pill--hashtag';
        element.textContent = token.rawText;
        break;

      case 'mention':
        element.className = 'content-pill content-pill--mention';
        if (context.isEditMode) {
          // In edit mode, mentions might have additional controls
          element.innerHTML = `
            <span class="mention-content">${token.content}</span>
            <button class="mention-remove-btn" style="margin-left: 4px; width: 16px; height: 16px;">×</button>
          `;
        } else {
          element.textContent = token.content;
        }
        break;

      case 'url':
        element.className = `content-pill content-pill--url content-pill--${token.metadata?.behavior || 'link'}`;
        if (context.isEditMode) {
          // URL pills in edit mode might have behavior controls
          element.innerHTML = `
            <span class="url-content">${token.content}</span>
            <select class="url-behavior-select" style="margin-left: 4px; font-size: 0.75em;">
              <option>link</option>
              <option>embed</option>
              <option>modal</option>
            </select>
          `;
        } else {
          element.textContent = token.content;
        }
        break;

      case 'emoji':
        element.className = 'rich-input-token rich-input-token--emoji emoji';
        if (token.metadata?.emojiUnicode) {
          element.textContent = token.metadata.emojiUnicode;
        } else if (token.metadata?.emojiImageUrl) {
          const img = document.createElement('img');
          img.src = token.metadata.emojiImageUrl;
          img.alt = `:${token.content}:`;
          img.style.width = '1.2em';
          img.style.height = '1.2em';
          element.appendChild(img);
        } else {
          element.textContent = token.rawText;
        }
        break;

      default:
        element.className = 'rich-input-token rich-input-token--text';
        element.textContent = token.rawText;
        break;
    }

    // Apply any additional context classes
    if (context.className) {
      element.className += ` ${context.className}`;
    }

    // Copy styles from existing similar elements if available
    if (context.containerElement) {
      this.copyRelevantStyles(element, context.containerElement, token.type);
    }

    return element;
  }

  /**
   * Copy relevant styles from the container to ensure accurate measurement
   */
  private copyRelevantStyles(
    element: HTMLElement,
    containerElement: HTMLElement,
    tokenType: string
  ): void {
    const containerStyles = window.getComputedStyle(containerElement);

    // Copy font-related styles
    element.style.fontSize = containerStyles.fontSize;
    element.style.fontFamily = containerStyles.fontFamily;
    element.style.fontWeight = containerStyles.fontWeight;
    element.style.lineHeight = containerStyles.lineHeight;

    // Look for existing pill in the container to copy pill-specific styles
    const existingPill = containerElement.querySelector(
      `.content-pill--${tokenType}`
    ) as HTMLElement;
    if (existingPill) {
      const pillStyles = window.getComputedStyle(existingPill);
      element.style.padding = pillStyles.padding;
      element.style.margin = pillStyles.margin;
      element.style.border = pillStyles.border;
      element.style.borderRadius = pillStyles.borderRadius;
      element.style.backgroundColor = pillStyles.backgroundColor;
      element.style.color = pillStyles.color;
      element.style.display = pillStyles.display;
      element.style.alignItems = pillStyles.alignItems;
      element.style.boxSizing = pillStyles.boxSizing;
    }
  }

  /**
   * Generate cache key for measurements
   */
  private getCacheKey(
    token: RichContentToken,
    context: MeasurementContext
  ): string {
    const baseKey = `${token.type}-${token.start}-${token.end}-${token.rawText.length}`;
    const modeKey = context.isEditMode ? 'edit' : 'normal';
    return `${baseKey}-${modeKey}`;
  }

  /**
   * Ensure measurement container exists
   */
  private ensureMeasurementContainer(): void {
    // Only create measurement container on client side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    if (!this.measurementContainer) {
      this.measurementContainer = document.createElement('div');
      this.measurementContainer.style.position = 'absolute';
      this.measurementContainer.style.top = '-9999px';
      this.measurementContainer.style.left = '-9999px';
      this.measurementContainer.style.visibility = 'hidden';
      this.measurementContainer.style.pointerEvents = 'none';
      this.measurementContainer.style.zIndex = '-1';
      document.body.appendChild(this.measurementContainer);
    }
  }

  /**
   * Clear measurement cache
   */
  clearCache(): void {
    this.cachedMeasurements.clear();
  }

  /**
   * Clean up measurement container
   */
  destroy(): void {
    if (this.measurementContainer && this.measurementContainer.parentNode) {
      this.measurementContainer.parentNode.removeChild(
        this.measurementContainer
      );
    }
    this.measurementContainer = null;
    this.clearCache();
  }
}

// Singleton instance
export const widthMeasurement = new WidthMeasurementUtility();
