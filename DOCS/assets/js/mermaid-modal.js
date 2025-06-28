/**
 * =============================================================================
 * Mermaid Modal Viewer
 * =============================================================================
 * 
 * Professional modal system for interactive Mermaid diagram viewing.
 * Features zoom, pan, drag controls, keyboard shortcuts, and accessibility support.
 * 
 * @version 1.0.0
 * @author Idling.app Team
 * @since 2025-01-28
 */

(function(global) {
  'use strict';

  /**
   * Configuration constants and defaults
   */
  const CONFIG = {
    // CSS class names (BEM methodology)
    CLASSES: {
      MODAL: 'mermaid-modal',
      MODAL_ACTIVE: 'mermaid-modal.active',
      MODAL_DRAGGING: 'mermaid-modal.dragging',
      CONTAINER: 'mermaid-modal__container',
      OVERLAY: 'mermaid-modal__overlay',
      TITLE: 'mermaid-modal__title',
      DIAGRAM_CONTAINER: 'mermaid-modal__diagram-container',
      ZOOM_INDICATOR: 'mermaid-modal__zoom-value',
      EXPAND_HINT: 'mermaid-expand-hint',
      MERMAID_CONTAINER: 'mermaid-container',
      MERMAID: 'mermaid'
    },

    // Data attributes
    ATTRIBUTES: {
      ACTION: 'data-action',
      ARIA_HIDDEN: 'aria-hidden'
    },

    // Action types
    ACTIONS: {
      ZOOM_IN: 'zoom-in',
      ZOOM_OUT: 'zoom-out',
      RESET: 'reset',
      CLOSE: 'close'
    },

    // Zoom configuration
    ZOOM: {
      MIN: 0.1,
      MAX: 5.0,
      STEP_IN: 1.25,
      STEP_OUT: 0.8,
      WHEEL_FACTOR_IN: 1.1,
      WHEEL_FACTOR_OUT: 0.9
    },

    // Touch interaction
    TOUCH: {
      SINGLE_FINGER: 1,
      TWO_FINGER: 2
    },

    // Keyboard shortcuts
    KEYS: {
      ESCAPE: 'Escape',
      PLUS: '+',
      EQUALS: '=',
      MINUS: '-',
      ZERO: '0'
    },

    // Animation timing
    TIMING: {
      TRANSFORM_TRANSITION: 100
    },

    // Template path
    TEMPLATE_PATH: '/includes/mermaid-modal-template.html',

    // Debug mode
    DEBUG: false
  };

  /**
   * Professional Mermaid Modal Viewer
   * 
   * Provides an interactive, accessible modal for viewing Mermaid diagrams
   * with advanced zoom, pan, and navigation capabilities.
   * 
   * @class MermaidModal
   */
  class MermaidModal {
    /**
     * Initialize the modal viewer
     * 
     * @param {Object} [options] - Configuration options
     * @param {boolean} [options.debugMode=false] - Enable debug logging
     * @param {string} [options.templatePath] - Custom template path
     */
    constructor(options = {}) {
      this._debugMode = options.debugMode || CONFIG.DEBUG;
      this._templatePath = options.templatePath || CONFIG.TEMPLATE_PATH;
      
      // Modal state
      this._isInitialized = false;
      this._isOpen = false;
      this._currentDiagram = null;
      
      // Transform state
      this._transform = {
        zoom: 1,
        x: 0,
        y: 0
      };
      
      // Interaction state
      this._interaction = {
        isDragging: false,
        dragStart: { x: 0, y: 0 },
        touchStart: null,
        initialDistance: 0,
        initialZoom: 1
      };
      
      // DOM references
      this._elements = {
        modal: null,
        overlay: null,
        container: null,
        title: null,
        diagramContainer: null,
        zoomIndicator: null
      };

      // Event handlers (bound to this instance)
      this._boundHandlers = {
        modalClick: this._handleModalClick.bind(this),
        containerClick: this._handleContainerClick.bind(this),
        controlClick: this._handleControlClick.bind(this),
        keydown: this._handleKeydown.bind(this),
        wheel: this._handleWheel.bind(this),
        mousedown: this._handleMouseDown.bind(this),
        mousemove: this._handleMouseMove.bind(this),
        mouseup: this._handleMouseUp.bind(this),
        touchstart: this._handleTouchStart.bind(this),
        touchmove: this._handleTouchMove.bind(this),
        touchend: this._handleTouchEnd.bind(this)
      };

      this._log('MermaidModal instance created', { options });
    }

    /**
     * Public API Methods
     * ==================
     */

    /**
     * Initialize the modal system
     * 
     * @returns {Promise<boolean>} True if initialization was successful
     */
    async init() {
      if (this._isInitialized) {
        this._log('Modal already initialized, skipping');
        return true;
      }

      try {
        this._log('Starting modal initialization');

        // Create modal from template
        await this._createModalFromTemplate();
        
        // Cache DOM references
        this._cacheDOMReferences();
        
                 // Note: We'll wrap diagrams later after Mermaid renders them
         // this.wrapExistingDiagrams();
        
        // Setup event listeners
        this._setupEventListeners();
        
        this._isInitialized = true;
        this._log('Modal initialization completed successfully');
        
        return true;
      } catch (error) {
        this._logError('Modal initialization failed', error);
        return false;
      }
    }

    /**
     * Open modal with specific diagram
     * 
     * @param {HTMLElement} diagram - The diagram element to display
     * @param {string} [title='Diagram Viewer'] - Modal title
     * @returns {boolean} True if modal was opened successfully
     */
    openModal(diagram, title = 'Diagram Viewer') {
      if (!this._isInitialized) {
        this._logError('Cannot open modal: not initialized');
        return false;
      }

      if (!diagram) {
        this._logError('Cannot open modal: no diagram provided');
        return false;
      }

      try {
        this._log('Opening modal', { title });

        // Clone and insert diagram
        this._insertDiagram(diagram);
        
        // Set title
        this._setTitle(title);
        
        // Reset transform
        this._resetTransform();
        
        // Show modal
        this._showModal();
        
        // Update state
        this._isOpen = true;
        this._currentDiagram = diagram;
        
        this._log('Modal opened successfully');
        return true;
      } catch (error) {
        this._logError('Failed to open modal', error);
        return false;
      }
    }

    /**
     * Close the modal
     * 
     * @returns {boolean} True if modal was closed successfully
     */
    closeModal() {
      if (!this._isOpen) {
        return true;
      }

      try {
        this._log('Closing modal');

        // Hide modal
        this._hideModal();
        
        // Clear diagram
        this._clearDiagram();
        
        // Update state
        this._isOpen = false;
        this._currentDiagram = null;
        
        this._log('Modal closed successfully');
        return true;
      } catch (error) {
        this._logError('Failed to close modal', error);
        return false;
      }
    }

    /**
     * Transform Controls
     * ==================
     */

    /**
     * Zoom by factor
     * 
     * @param {number} factor - Zoom factor (e.g., 1.25 for 25% larger)
     * @returns {boolean} True if zoom was applied
     */
    zoom(factor) {
      if (!this._isOpen || typeof factor !== 'number' || factor <= 0) {
        return false;
      }

      const newZoom = this._transform.zoom * factor;
      const clampedZoom = Math.max(CONFIG.ZOOM.MIN, Math.min(CONFIG.ZOOM.MAX, newZoom));
      
      if (clampedZoom !== this._transform.zoom) {
        this._transform.zoom = clampedZoom;
        this._applyTransform();
        this._updateZoomIndicator();
        this._log('Zoom applied', { factor, newZoom: clampedZoom });
        return true;
      }
      
      return false;
    }

    /**
     * Reset zoom and position
     * 
     * @returns {boolean} True if reset was applied
     */
    reset() {
      if (!this._isOpen) {
        return false;
      }

      this._resetTransform();
      this._log('Transform reset');
      return true;
    }

    /**
     * Status and Diagnostics
     * ======================
     */

    /**
     * Check if modal is initialized
     * 
     * @returns {boolean} True if initialized
     */
    isInitialized() {
      return this._isInitialized;
    }

    /**
     * Check if modal is currently open
     * 
     * @returns {boolean} True if open
     */
    isOpen() {
      return this._isOpen;
    }

    /**
     * Get current transform state
     * 
     * @returns {Object} Current transform state
     */
    getTransform() {
      return { ...this._transform };
    }

    /**
     * Run diagnostic checks
     * 
     * @returns {Object} Diagnostic results
     */
    runDiagnostics() {
      return {
        initialized: this._isInitialized,
        isOpen: this._isOpen,
        hasModal: !!this._elements.modal,
        diagramsFound: document.querySelectorAll(`.${CONFIG.CLASSES.MERMAID}`).length,
        wrappedDiagrams: document.querySelectorAll(`.${CONFIG.CLASSES.MERMAID_CONTAINER}`).length,
        currentTransform: this.getTransform(),
        currentDiagram: !!this._currentDiagram
      };
    }

    /**
     * Private Implementation Methods
     * ==============================
     */

    /**
     * Create modal from HTML template
     * 
     * @private
     * @returns {Promise<void>}
     */
    async _createModalFromTemplate() {
      try {
        // For now, create inline (template loading would require server setup)
        const modalHTML = this._getModalTemplate();
        
        // Create temporary container
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHTML;
        
        // Get the modal element
        const modalElement = tempDiv.firstElementChild;
        
        // Append to document body
        document.body.appendChild(modalElement);
        
        this._log('Modal created from template');
      } catch (error) {
        throw new Error(`Failed to create modal from template: ${error.message}`);
      }
    }

    /**
     * Get modal HTML template
     * 
     * @private
     * @returns {string} Modal HTML template
     */
    _getModalTemplate() {
      return `
        <div class="${CONFIG.CLASSES.MODAL}" role="dialog" aria-modal="true" aria-labelledby="mermaid-modal-title" aria-hidden="true">
          <div class="${CONFIG.CLASSES.OVERLAY}" aria-label="Close modal"></div>
          
          <div class="${CONFIG.CLASSES.CONTAINER}">
            <header class="mermaid-modal__header">
              <h2 id="mermaid-modal-title" class="${CONFIG.CLASSES.TITLE}">Diagram Viewer</h2>
              
              <div class="mermaid-modal__controls">
                <div class="mermaid-modal__control-group">
                  <button type="button" class="mermaid-modal__btn mermaid-modal__btn--zoom" ${CONFIG.ATTRIBUTES.ACTION}="${CONFIG.ACTIONS.ZOOM_OUT}" aria-label="Zoom out" title="Zoom Out (-)">
                    <span class="mermaid-modal__btn-icon">−</span>
                    <span class="mermaid-modal__btn-text">Zoom Out</span>
                  </button>
                  
                  <button type="button" class="mermaid-modal__btn mermaid-modal__btn--zoom" ${CONFIG.ATTRIBUTES.ACTION}="${CONFIG.ACTIONS.ZOOM_IN}" aria-label="Zoom in" title="Zoom In (+)">
                    <span class="mermaid-modal__btn-icon">+</span>
                    <span class="mermaid-modal__btn-text">Zoom In</span>
                  </button>
                  
                  <button type="button" class="mermaid-modal__btn mermaid-modal__btn--reset" ${CONFIG.ATTRIBUTES.ACTION}="${CONFIG.ACTIONS.RESET}" aria-label="Reset zoom and position" title="Reset (0)">
                    <span class="mermaid-modal__btn-icon">⌂</span>
                    <span class="mermaid-modal__btn-text">Reset</span>
                  </button>
                </div>
                
                <button type="button" class="mermaid-modal__btn mermaid-modal__btn--close" ${CONFIG.ATTRIBUTES.ACTION}="${CONFIG.ACTIONS.CLOSE}" aria-label="Close modal" title="Close (Esc)">
                  <span class="mermaid-modal__btn-icon">×</span>
                </button>
              </div>
            </header>
            
            <main class="mermaid-modal__content">
              <div class="${CONFIG.CLASSES.DIAGRAM_CONTAINER}" role="img" aria-label="Mermaid diagram">
                <!-- Diagram content will be inserted here -->
              </div>
              
              <div class="mermaid-modal__zoom-indicator" aria-live="polite" aria-atomic="true">
                <span class="${CONFIG.CLASSES.ZOOM_INDICATOR}">100%</span>
              </div>
            </main>
            
            <footer class="mermaid-modal__footer">
              <div class="mermaid-modal__help-text">
                <span class="mermaid-modal__help-item">Scroll to zoom</span>
                <span class="mermaid-modal__help-item">Drag to pan</span>
                <span class="mermaid-modal__help-item">ESC to close</span>
              </div>
            </footer>
          </div>
        </div>
      `;
    }

    /**
     * Cache DOM element references
     * 
     * @private
     */
    _cacheDOMReferences() {
      this._elements.modal = document.querySelector(`.${CONFIG.CLASSES.MODAL}`);
      this._elements.overlay = document.querySelector(`.${CONFIG.CLASSES.OVERLAY}`);
      this._elements.container = document.querySelector(`.${CONFIG.CLASSES.CONTAINER}`);
      this._elements.title = document.querySelector(`.${CONFIG.CLASSES.TITLE}`);
      this._elements.diagramContainer = document.querySelector(`.${CONFIG.CLASSES.DIAGRAM_CONTAINER}`);
      this._elements.zoomIndicator = document.querySelector(`.${CONFIG.CLASSES.ZOOM_INDICATOR}`);

      // Verify all required elements exist
      const requiredElements = ['modal', 'overlay', 'container', 'title', 'diagramContainer', 'zoomIndicator'];
      const missingElements = requiredElements.filter(key => !this._elements[key]);
      
      if (missingElements.length > 0) {
        throw new Error(`Missing required DOM elements: ${missingElements.join(', ')}`);
      }

      this._log('DOM references cached successfully');
    }

         /**
      * Wrap existing Mermaid diagrams in clickable containers
      * 
      * @public
      */
     wrapExistingDiagrams() {
      const diagrams = document.querySelectorAll(`.${CONFIG.CLASSES.MERMAID}`);
      let wrappedCount = 0;
      
      diagrams.forEach((diagram, index) => {
        // Skip if already wrapped
        if (diagram.closest(`.${CONFIG.CLASSES.MERMAID_CONTAINER}`)) {
          return;
        }

        try {
          this._wrapSingleDiagram(diagram, index);
          wrappedCount++;
        } catch (error) {
          this._logError(`Failed to wrap diagram ${index}`, error);
        }
      });

      this._log(`Wrapped ${wrappedCount} diagrams`);
    }

    /**
     * Wrap a single diagram in a clickable container
     * 
     * @private
     * @param {HTMLElement} diagram - The diagram element
     * @param {number} index - Diagram index for identification
     */
    _wrapSingleDiagram(diagram, index) {
      const container = document.createElement('div');
      container.className = CONFIG.CLASSES.MERMAID_CONTAINER;
      container.innerHTML = `<div class="${CONFIG.CLASSES.EXPAND_HINT}">Click to expand</div>`;
      
      // Insert container before diagram
      diagram.parentNode.insertBefore(container, diagram);
      
      // Move diagram into container
      container.appendChild(diagram);
      
      // Add click handler
      container.addEventListener('click', () => {
        this.openModal(diagram, `Diagram ${index + 1}`);
      });

      this._log(`Wrapped diagram ${index}`);
    }

    /**
     * Event Listener Setup
     * ====================
     */

         /**
      * Setup all event listeners
      * 
      * @private
      */
     _setupEventListeners() {
       // Modal-level events
       this._elements.modal.addEventListener('click', this._boundHandlers.modalClick);
       
       // Container events (prevent modal close)
       this._elements.container.addEventListener('click', this._boundHandlers.containerClick);
       
       // Control button events - use event delegation on the modal
       this._elements.modal.addEventListener('click', this._boundHandlers.controlClick);
       
       // Also add direct listeners to buttons for redundancy
       const buttons = this._elements.modal.querySelectorAll('[data-action]');
       buttons.forEach(button => {
         button.addEventListener('click', this._boundHandlers.controlClick);
       });
       
       // Keyboard events
       document.addEventListener('keydown', this._boundHandlers.keydown);
       
       // Mouse events for zoom and pan
       this._elements.diagramContainer.addEventListener('wheel', this._boundHandlers.wheel);
       this._elements.diagramContainer.addEventListener('mousedown', this._boundHandlers.mousedown);
       document.addEventListener('mousemove', this._boundHandlers.mousemove);
       document.addEventListener('mouseup', this._boundHandlers.mouseup);
       
       // Touch events for mobile
       this._elements.diagramContainer.addEventListener('touchstart', this._boundHandlers.touchstart, { passive: false });
       this._elements.diagramContainer.addEventListener('touchmove', this._boundHandlers.touchmove, { passive: false });
       this._elements.diagramContainer.addEventListener('touchend', this._boundHandlers.touchend);

       this._log('Event listeners setup completed');
     }

    /**
     * Event Handlers
     * ==============
     */

    /**
     * Handle modal background click
     * 
     * @private
     * @param {Event} event - Click event
     */
    _handleModalClick(event) {
      if (event.target === this._elements.modal || event.target === this._elements.overlay) {
        this.closeModal();
      }
    }

    /**
     * Handle container click (prevent modal close)
     * 
     * @private
     * @param {Event} event - Click event
     */
    _handleContainerClick(event) {
      event.stopPropagation();
    }

         /**
      * Handle control button clicks
      * 
      * @private
      * @param {Event} event - Click event
      */
     _handleControlClick(event) {
       console.log('Control click detected:', event.target);
       
       // Check if clicked element or its parent has the action attribute
       let target = event.target;
       let action = target.getAttribute(CONFIG.ATTRIBUTES.ACTION);
       
       console.log('Direct target action:', action);
       
       // If no action on direct target, check parent elements
       if (!action) {
         target = target.closest(`[${CONFIG.ATTRIBUTES.ACTION}]`);
         action = target ? target.getAttribute(CONFIG.ATTRIBUTES.ACTION) : null;
         console.log('Closest target action:', action);
       }
       
       if (!action) {
         console.log('No action found, returning');
         return;
       }

       console.log('Executing action:', action);

       // Prevent default and stop propagation
       event.preventDefault();
       event.stopPropagation();

       switch (action) {
         case CONFIG.ACTIONS.ZOOM_OUT:
           console.log('Zooming out');
           this.zoom(CONFIG.ZOOM.STEP_OUT);
           break;
         case CONFIG.ACTIONS.ZOOM_IN:
           console.log('Zooming in');
           this.zoom(CONFIG.ZOOM.STEP_IN);
           break;
         case CONFIG.ACTIONS.RESET:
           console.log('Resetting');
           this.reset();
           break;
         case CONFIG.ACTIONS.CLOSE:
           console.log('Closing modal');
           this.closeModal();
           break;
       }
     }

    /**
     * Handle keyboard shortcuts
     * 
     * @private
     * @param {KeyboardEvent} event - Keyboard event
     */
    _handleKeydown(event) {
      if (!this._isOpen) return;

      switch (event.key) {
        case CONFIG.KEYS.ESCAPE:
          this.closeModal();
          break;
        case CONFIG.KEYS.PLUS:
        case CONFIG.KEYS.EQUALS:
          this.zoom(CONFIG.ZOOM.STEP_IN);
          break;
        case CONFIG.KEYS.MINUS:
          this.zoom(CONFIG.ZOOM.STEP_OUT);
          break;
        case CONFIG.KEYS.ZERO:
          this.reset();
          break;
      }
    }

    /**
     * Handle mouse wheel zoom
     * 
     * @private
     * @param {WheelEvent} event - Wheel event
     */
    _handleWheel(event) {
      event.preventDefault();
      const factor = event.deltaY > 0 ? CONFIG.ZOOM.WHEEL_FACTOR_OUT : CONFIG.ZOOM.WHEEL_FACTOR_IN;
      this.zoom(factor);
    }

    /**
     * Handle mouse down for drag start
     * 
     * @private
     * @param {MouseEvent} event - Mouse event
     */
    _handleMouseDown(event) {
      this._interaction.isDragging = true;
      this._interaction.dragStart = {
        x: event.clientX - this._transform.x,
        y: event.clientY - this._transform.y
      };
      this._elements.modal.classList.add('dragging');
      event.preventDefault();
    }

    /**
     * Handle mouse move for dragging
     * 
     * @private
     * @param {MouseEvent} event - Mouse event
     */
    _handleMouseMove(event) {
      if (!this._interaction.isDragging) return;

      this._transform.x = event.clientX - this._interaction.dragStart.x;
      this._transform.y = event.clientY - this._interaction.dragStart.y;
      this._applyTransform();
    }

    /**
     * Handle mouse up for drag end
     * 
     * @private
     */
    _handleMouseUp() {
      if (this._interaction.isDragging) {
        this._interaction.isDragging = false;
        this._elements.modal.classList.remove('dragging');
      }
    }

    /**
     * Handle touch start
     * 
     * @private
     * @param {TouchEvent} event - Touch event
     */
    _handleTouchStart(event) {
      if (event.touches.length === CONFIG.TOUCH.SINGLE_FINGER) {
        // Single touch - pan
        this._interaction.touchStart = {
          x: event.touches[0].clientX - this._transform.x,
          y: event.touches[0].clientY - this._transform.y
        };
      } else if (event.touches.length === CONFIG.TOUCH.TWO_FINGER) {
        // Two finger - zoom
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        this._interaction.initialDistance = Math.sqrt(dx * dx + dy * dy);
        this._interaction.initialZoom = this._transform.zoom;
      }
      event.preventDefault();
    }

    /**
     * Handle touch move
     * 
     * @private
     * @param {TouchEvent} event - Touch event
     */
    _handleTouchMove(event) {
      if (event.touches.length === CONFIG.TOUCH.SINGLE_FINGER && this._interaction.touchStart) {
        // Pan
        this._transform.x = event.touches[0].clientX - this._interaction.touchStart.x;
        this._transform.y = event.touches[0].clientY - this._interaction.touchStart.y;
        this._applyTransform();
      } else if (event.touches.length === CONFIG.TOUCH.TWO_FINGER) {
        // Zoom
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scale = distance / this._interaction.initialDistance;
        const newZoom = this._interaction.initialZoom * scale;
        const clampedZoom = Math.max(CONFIG.ZOOM.MIN, Math.min(CONFIG.ZOOM.MAX, newZoom));
        
        this._transform.zoom = clampedZoom;
        this._applyTransform();
        this._updateZoomIndicator();
      }
      event.preventDefault();
    }

    /**
     * Handle touch end
     * 
     * @private
     */
    _handleTouchEnd() {
      this._interaction.touchStart = null;
    }

    /**
     * Transform and Display Methods
     * =============================
     */

    /**
     * Apply current transform to diagram container
     * 
     * @private
     */
    _applyTransform() {
      if (this._elements.diagramContainer) {
        const { zoom, x, y } = this._transform;
        this._elements.diagramContainer.style.transform = 
          `scale(${zoom}) translate(${x}px, ${y}px)`;
      }
    }

    /**
     * Reset transform to default state
     * 
     * @private
     */
    _resetTransform() {
      this._transform.zoom = 1;
      this._transform.x = 0;
      this._transform.y = 0;
      this._applyTransform();
      this._updateZoomIndicator();
    }

    /**
     * Update zoom indicator display
     * 
     * @private
     */
    _updateZoomIndicator() {
      if (this._elements.zoomIndicator) {
        const percentage = Math.round(this._transform.zoom * 100);
        this._elements.zoomIndicator.textContent = `${percentage}%`;
      }
    }

    /**
     * Modal Display Methods
     * =====================
     */

    /**
     * Insert diagram into modal
     * 
     * @private
     * @param {HTMLElement} diagram - Diagram element to clone and insert
     */
    _insertDiagram(diagram) {
      const clonedDiagram = diagram.cloneNode(true);
      this._elements.diagramContainer.innerHTML = '';
      this._elements.diagramContainer.appendChild(clonedDiagram);
    }

    /**
     * Set modal title
     * 
     * @private
     * @param {string} title - Modal title
     */
    _setTitle(title) {
      if (this._elements.title) {
        this._elements.title.textContent = title;
      }
    }

    /**
     * Show modal
     * 
     * @private
     */
    _showModal() {
      this._elements.modal.classList.add('active');
      this._elements.modal.setAttribute(CONFIG.ATTRIBUTES.ARIA_HIDDEN, 'false');
      document.body.style.overflow = 'hidden';
    }

    /**
     * Hide modal
     * 
     * @private
     */
    _hideModal() {
      this._elements.modal.classList.remove('active');
      this._elements.modal.setAttribute(CONFIG.ATTRIBUTES.ARIA_HIDDEN, 'true');
      document.body.style.overflow = '';
    }

    /**
     * Clear diagram from modal
     * 
     * @private
     */
    _clearDiagram() {
      if (this._elements.diagramContainer) {
        this._elements.diagramContainer.innerHTML = '';
      }
    }

    /**
     * Logging and Debug Methods
     * =========================
     */

    /**
     * Log debug message
     * 
     * @private
     * @param {string} message - Log message
     * @param {*} [data] - Additional data to log
     */
    _log(message, data = null) {
      if (this._debugMode) {
        const timestamp = new Date().toISOString();
        const logMessage = `[MermaidModal] ${timestamp}: ${message}`;
        
        if (data) {
          console.log(logMessage, data);
        } else {
          console.log(logMessage);
        }
      }
    }

    /**
     * Log error message
     * 
     * @private
     * @param {string} message - Error message
     * @param {Error} error - Error object
     */
    _logError(message, error) {
      const timestamp = new Date().toISOString();
      const errorMessage = `[MermaidModal] ${timestamp}: ERROR - ${message}`;
      
      if (error instanceof Error) {
        console.error(errorMessage, {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      } else {
        console.error(errorMessage, error);
      }
    }
  }

  /**
   * Export to global namespace
   */
  global.MermaidModal = MermaidModal;

  /**
   * Also export configuration constants for external use
   */
  global.MermaidModal.CONFIG = CONFIG;

})(window); 