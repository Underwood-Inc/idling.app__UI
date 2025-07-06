/**
 * =============================================================================
 * Mermaid System Initializer
 * =============================================================================
 * 
 * Professional initialization and coordination system for Mermaid diagrams.
 * Orchestrates configuration setup, modal system, and provides unified API.
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
    // Initialization timing
    TIMING: {
      READY_CHECK_INTERVAL: 100,
      MAX_READY_WAIT: 10000,
      INITIALIZATION_TIMEOUT: 5000
    },

    // Required dependencies
    DEPENDENCIES: {
      MERMAID: 'mermaid',
      MERMAID_CONFIG: 'MermaidConfig',
      MERMAID_MODAL: 'MermaidModal'
    },

    // System states
    STATES: {
      UNINITIALIZED: 'uninitialized',
      INITIALIZING: 'initializing',
      READY: 'ready',
      ERROR: 'error'
    },

    // Error types
    ERRORS: {
      DEPENDENCY_MISSING: 'Required dependency is missing',
      INITIALIZATION_TIMEOUT: 'Initialization timed out',
      SETUP_FAILED: 'System setup failed'
    },

    // Debug mode
    DEBUG: false
  };

  /**
   * Professional Mermaid System Initializer
   * 
   * Coordinates the initialization of the complete Mermaid system including
   * configuration management, modal viewer, and diagram processing.
   * 
   * @class MermaidInitializer
   */
  class MermaidInitializer {
    /**
     * Initialize the system coordinator
     * 
     * @param {Object} [options] - Configuration options
     * @param {boolean} [options.debugMode=false] - Enable debug logging
     * @param {Object} [options.configOptions] - Custom config options
     * @param {Object} [options.modalOptions] - Custom modal options
     */
    constructor(options = {}) {
      this._debugMode = options.debugMode || CONFIG.DEBUG;
      this._configOptions = options.configOptions || {};
      this._modalOptions = options.modalOptions || {};
      
      // System state
      this._state = CONFIG.STATES.UNINITIALIZED;
      this._error = null;
      
      // Component instances
      this._components = {
        config: null,
        modal: null
      };
      
      // Initialization tracking
      this._initializationPromise = null;
      this._readyCallbacks = [];
      this._errorCallbacks = [];

      this._log('MermaidInitializer instance created', { options });
    }

    /**
     * Public API Methods
     * ==================
     */

    /**
     * Initialize the complete Mermaid system
     * 
     * @returns {Promise<Object>} Initialization results
     */
    async initialize() {
      if (this._initializationPromise) {
        this._log('Initialization already in progress, returning existing promise');
        return this._initializationPromise;
      }

      this._initializationPromise = this._performInitialization();
      return this._initializationPromise;
    }

    /**
     * Get current system state
     * 
     * @returns {string} Current state
     */
    getState() {
      return this._state;
    }

    /**
     * Check if system is ready
     * 
     * @returns {boolean} True if system is ready
     */
    isReady() {
      return this._state === CONFIG.STATES.READY;
    }

    /**
     * Get system error (if any)
     * 
     * @returns {Error|null} Current error or null
     */
    getError() {
      return this._error;
    }

    /**
     * Get component instances
     * 
     * @returns {Object} Component instances
     */
    getComponents() {
      return {
        config: this._components.config,
        modal: this._components.modal
      };
    }

    /**
     * Register callback for when system is ready
     * 
     * @param {Function} callback - Callback function
     * @returns {Function} Unregister function
     */
    onReady(callback) {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }

      if (this._state === CONFIG.STATES.READY) {
        // Already ready, call immediately
        setTimeout(() => callback(this.getComponents()), 0);
      } else {
        this._readyCallbacks.push(callback);
      }

      // Return unregister function
      return () => {
        const index = this._readyCallbacks.indexOf(callback);
        if (index > -1) {
          this._readyCallbacks.splice(index, 1);
        }
      };
    }

    /**
     * Register callback for system errors
     * 
     * @param {Function} callback - Error callback function
     * @returns {Function} Unregister function
     */
    onError(callback) {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }

      if (this._state === CONFIG.STATES.ERROR) {
        // Already in error state, call immediately
        setTimeout(() => callback(this._error), 0);
      } else {
        this._errorCallbacks.push(callback);
      }

      // Return unregister function
      return () => {
        const index = this._errorCallbacks.indexOf(callback);
        if (index > -1) {
          this._errorCallbacks.splice(index, 1);
        }
      };
    }

    /**
     * Run comprehensive system diagnostics
     * 
     * @returns {Object} Diagnostic results
     */
    runDiagnostics() {
      const diagnostics = {
        systemState: this._state,
        error: this._error ? this._error.message : null,
        dependencies: this._checkDependencies(),
        components: {
          config: this._components.config ? this._components.config.runDiagnostics() : null,
          modal: this._components.modal ? this._components.modal.runDiagnostics() : null
        },
        timing: {
          initializationComplete: !!this._initializationPromise,
          readyCallbacks: this._readyCallbacks.length,
          errorCallbacks: this._errorCallbacks.length
        }
      };

      this._log('System diagnostics completed', diagnostics);
      return diagnostics;
    }

    /**
     * Private Implementation Methods
     * ==============================
     */

    /**
     * Perform the complete initialization process
     * 
     * @private
     * @returns {Promise<Object>} Initialization results
     */
    async _performInitialization() {
      try {
        this._setState(CONFIG.STATES.INITIALIZING);
        this._log('Starting system initialization');

        // Wait for dependencies to be ready
        await this._waitForDependencies();

        // Create and initialize components
        await this._initializeComponents();

        // Setup complete system
        const results = await this._setupSystem();

        // Mark as ready
        this._setState(CONFIG.STATES.READY);
        this._notifyReady();

        this._log('System initialization completed successfully', results);
        return results;

      } catch (error) {
        this._handleInitializationError(error);
        throw error;
      }
    }

    /**
     * Wait for all required dependencies to be available
     * 
     * @private
     * @returns {Promise<void>}
     */
    async _waitForDependencies() {
      const startTime = Date.now();
      const maxWait = CONFIG.TIMING.MAX_READY_WAIT;

      this._log('Waiting for dependencies to be ready');

      return new Promise((resolve, reject) => {
        const checkDependencies = () => {
          const elapsed = Date.now() - startTime;
          
          if (elapsed > maxWait) {
            reject(new Error(`${CONFIG.ERRORS.INITIALIZATION_TIMEOUT}: Dependencies not ready after ${maxWait}ms`));
            return;
          }

          const missing = this._checkDependencies();
          if (missing.length === 0) {
            this._log('All dependencies are ready');
            resolve();
          } else {
            this._log(`Still waiting for dependencies: ${missing.join(', ')}`);
            setTimeout(checkDependencies, CONFIG.TIMING.READY_CHECK_INTERVAL);
          }
        };

        checkDependencies();
      });
    }

    /**
     * Check which dependencies are missing
     * 
     * @private
     * @returns {string[]} Array of missing dependency names
     */
    _checkDependencies() {
      const missing = [];

      if (typeof global[CONFIG.DEPENDENCIES.MERMAID] === 'undefined') {
        missing.push(CONFIG.DEPENDENCIES.MERMAID);
      }

      if (typeof global[CONFIG.DEPENDENCIES.MERMAID_CONFIG] === 'undefined') {
        missing.push(CONFIG.DEPENDENCIES.MERMAID_CONFIG);
      }

      if (typeof global[CONFIG.DEPENDENCIES.MERMAID_MODAL] === 'undefined') {
        missing.push(CONFIG.DEPENDENCIES.MERMAID_MODAL);
      }

      return missing;
    }

    /**
     * Initialize all system components
     * 
     * @private
     * @returns {Promise<void>}
     */
    async _initializeComponents() {
      this._log('Initializing system components');

      // Initialize configuration manager
      this._components.config = new global.MermaidConfig(
        this._configOptions, 
        this._debugMode
      );

      // Initialize modal viewer
      this._components.modal = new global.MermaidModal({
        debugMode: this._debugMode,
        ...this._modalOptions
      });

      // Initialize modal system
      const modalInitialized = await this._components.modal.init();
      if (!modalInitialized) {
        throw new Error('Failed to initialize modal system');
      }

      this._log('All components initialized successfully');
    }

         /**
      * Setup the complete system
      * 
      * @private
      * @returns {Promise<Object>} Setup results
      */
     async _setupSystem() {
       this._log('Setting up complete system');

       // Setup configuration and convert code blocks
       const configResults = this._components.config.setup();

       // Wait a moment for Mermaid to finish rendering, then wrap diagrams
       setTimeout(() => {
         this._components.modal.wrapExistingDiagrams();
         this._log('Wrapped diagrams after Mermaid rendering');
       }, 1000);

       // Compile results
       const results = {
         config: configResults,
         modal: {
           initialized: this._components.modal.isInitialized()
         },
         success: configResults.success && this._components.modal.isInitialized()
       };

       if (!results.success) {
         const errorDetails = {
           configError: configResults.error,
           modalError: !this._components.modal.isInitialized() ? 'Modal initialization failed' : null
         };
         throw new Error(`System setup failed: ${JSON.stringify(errorDetails)}`);
       }

       return results;
     }

    /**
     * State Management
     * ================
     */

    /**
     * Set system state and log transition
     * 
     * @private
     * @param {string} newState - New state
     */
    _setState(newState) {
      const oldState = this._state;
      this._state = newState;
      this._log(`State transition: ${oldState} → ${newState}`);
    }

    /**
     * Handle initialization error
     * 
     * @private
     * @param {Error} error - Initialization error
     */
    _handleInitializationError(error) {
      this._error = error;
      this._setState(CONFIG.STATES.ERROR);
      this._logError('System initialization failed', error);
      this._notifyError(error);
    }

    /**
     * Notification System
     * ===================
     */

    /**
     * Notify all ready callbacks
     * 
     * @private
     */
    _notifyReady() {
      const components = this.getComponents();
      this._readyCallbacks.forEach(callback => {
        try {
          callback(components);
        } catch (error) {
          this._logError('Error in ready callback', error);
        }
      });
    }

    /**
     * Notify all error callbacks
     * 
     * @private
     * @param {Error} error - Error to notify about
     */
    _notifyError(error) {
      this._errorCallbacks.forEach(callback => {
        try {
          callback(error);
        } catch (callbackError) {
          this._logError('Error in error callback', callbackError);
        }
      });
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
        const logMessage = `[MermaidInitializer] ${timestamp}: ${message}`;
        
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
      const errorMessage = `[MermaidInitializer] ${timestamp}: ERROR - ${message}`;
      
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
   * Global System Instance and Auto-Initialization
   * ===============================================
   */

  // Create global system instance
  const mermaidSystem = new MermaidInitializer({
    debugMode: false // Set to true for development
  });

  /**
   * Auto-initialize when DOM is ready (only if diagrams are present)
   */
  function autoInitialize() {
    function initializeIfNeeded() {
      // Only initialize if there are mermaid diagrams on the page
      const hasDiagrams = document.querySelector('pre code.language-mermaid, .mermaid') !== null;
      
      if (hasDiagrams) {
        mermaidSystem.initialize().catch(error => {
          console.error('Mermaid system auto-initialization failed:', error);
        });
      }
    }
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeIfNeeded);
    } else {
      // DOM already ready
      initializeIfNeeded();
    }
  }

  /**
   * Export to global namespace
   */
  global.MermaidInitializer = MermaidInitializer;
  global.mermaidSystem = mermaidSystem;

  /**
   * Export configuration constants for external use
   */
  global.MermaidInitializer.CONFIG = CONFIG;

  /**
   * Start auto-initialization
   */
  autoInitialize();

  // Also provide manual initialization function for advanced use cases
  global.initializeMermaidSystem = (options) => {
    const customSystem = new MermaidInitializer(options);
    return customSystem.initialize();
  };

})(window); 