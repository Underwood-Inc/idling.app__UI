/**
 * =============================================================================
 * Mermaid Configuration Manager
 * =============================================================================
 * 
 * Professional configuration and initialization system for Mermaid diagrams.
 * Handles theme management, code block conversion, and error recovery.
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
         // Default theme configuration with adaptive colors
     THEME_CONFIG: {
       startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      fontFamily: 'inherit',
      themeVariables: {
        // High contrast colors for better readability
        primaryColor: '#edae49',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#edae49',
        secondaryColor: '#252017',
        tertiaryColor: '#3a3323',
        
        // Background colors with good contrast
        background: '#1a1611',
        mainBkg: '#252017',
        secondBkg: '#2f2a1d',
        tertiaryBkg: '#3a3323',
        
        // Text colors optimized for readability
        textColor: '#ffffff',
        lineColor: '#edae49',
        sectionBkgColor: '#252017',
        altSectionBkgColor: '#2f2a1d',
        gridColor: '#666666',
        
        // Pie chart colors with good contrast
        pie1: '#edae49',
        pie2: '#f9df74',
        pie3: '#f5c60c',
        pie4: '#c68214',
        pie5: '#aa6c14',
        pie6: '#8b5a0f',
        pie7: '#6d470c',
        pie8: '#4f3509',
        pie9: '#312206',
        pie10: '#1a1104',
        pie11: '#0f0802',
        pie12: '#050301',
        
        // Journey diagram colors
        cScale0: '#edae49',
        cScale1: '#f9df74',
        cScale2: '#f5c60c',
        
        // Git graph colors
        git0: '#edae49',
        git1: '#f9df74',
        git2: '#f5c60c',
        git3: '#c68214',
        git4: '#aa6c14',
        
        // Quadrant colors
        quadrant1Fill: '#252017',
        quadrant2Fill: '#2f2a1d',
        quadrant3Fill: '#3a3323',
        quadrant4Fill: '#443d29',
        
        quadrant1TextFill: '#ffffff',
        quadrant2TextFill: '#ffffff',
        quadrant3TextFill: '#ffffff',
        quadrant4TextFill: '#ffffff'
      }
    },

    // Selectors for code block conversion
    SELECTORS: {
      CODE_BLOCKS: 'pre code.language-mermaid',
      MERMAID_CLASS: 'mermaid'
    },

    // Error messages
    ERRORS: {
      MERMAID_NOT_FOUND: 'Mermaid library is not available',
      INITIALIZATION_FAILED: 'Failed to initialize Mermaid configuration',
      CONVERSION_FAILED: 'Failed to convert code block to Mermaid diagram'
    },

    // Debug mode
    DEBUG: false
  };

  /**
   * Professional Mermaid Configuration Manager
   * 
   * Manages Mermaid diagram configuration, initialization, and code block conversion.
   * Provides a robust, error-tolerant system for diagram rendering.
   * 
   * @class MermaidConfig
   */
  class MermaidConfig {
    /**
     * Initialize the configuration manager
     * 
     * @param {Object} [customConfig] - Custom configuration overrides
     * @param {boolean} [debugMode=false] - Enable debug logging
     */
    constructor(customConfig = {}, debugMode = CONFIG.DEBUG) {
      this._initialized = false;
      this._debugMode = debugMode;
      this._config = this._mergeConfig(CONFIG.THEME_CONFIG, customConfig);
      this._conversionStats = {
        attempted: 0,
        successful: 0,
        failed: 0
      };

      this._log('MermaidConfig instance created', { config: this._config });
    }

    /**
     * Public API Methods
     * ==================
     */

    /**
     * Initialize Mermaid with the current configuration
     * 
     * @returns {boolean} True if initialization was successful
     * @throws {Error} If Mermaid library is not available
     */
    init() {
      if (this._initialized) {
        this._log('Mermaid already initialized, skipping');
        return true;
      }

      if (!this._isMermaidAvailable()) {
        const error = new Error(CONFIG.ERRORS.MERMAID_NOT_FOUND);
        this._logError('Mermaid initialization failed', error);
        throw error;
      }

      try {
        global.mermaid.initialize(this._config);
        this._initialized = true;
        this._log('Mermaid initialized successfully', { config: this._config });
        return true;
      } catch (error) {
        this._logError('Mermaid initialization failed', error);
        throw new Error(`${CONFIG.ERRORS.INITIALIZATION_FAILED}: ${error.message}`);
      }
    }

    /**
     * Convert Jekyll/Kramdown code blocks to Mermaid divs
     * 
     * Jekyll's Kramdown creates <pre><code class="language-mermaid"> but 
     * Mermaid expects <div class="mermaid"> elements.
     * 
     * @returns {Object} Conversion statistics
     */
    convertCodeBlocks() {
      const codeBlocks = document.querySelectorAll(CONFIG.SELECTORS.CODE_BLOCKS);
      this._conversionStats.attempted = codeBlocks.length;
      this._conversionStats.successful = 0;
      this._conversionStats.failed = 0;

      this._log(`Starting conversion of ${codeBlocks.length} code blocks`);

      codeBlocks.forEach((codeBlock, index) => {
        try {
          this._convertSingleCodeBlock(codeBlock, index);
          this._conversionStats.successful++;
        } catch (error) {
          this._conversionStats.failed++;
          this._logError(`Failed to convert code block ${index}`, error);
        }
      });

      const stats = { ...this._conversionStats };
      this._log('Code block conversion completed', stats);
      
      return stats;
    }

         /**
      * Complete setup process: convert code blocks and initialize Mermaid
      * 
      * @returns {Object} Setup results with initialization status and conversion stats
      */
     setup() {
       this._log('Starting Mermaid setup process');

       try {
         // First convert code blocks
         const conversionStats = this.convertCodeBlocks();
         
         // Then initialize Mermaid
         const initSuccess = this.init();
         
         // Finally, manually trigger Mermaid rendering since startOnLoad is false
         if (initSuccess && global.mermaid && global.mermaid.run) {
           global.mermaid.run();
           this._log('Manually triggered Mermaid rendering');
         }
         
         const results = {
           initialized: initSuccess,
           conversionStats,
           success: initSuccess && conversionStats.failed === 0
         };

         this._log('Mermaid setup completed', results);
         return results;
       } catch (error) {
         this._logError('Mermaid setup failed', error);
         return {
           initialized: false,
           conversionStats: this._conversionStats,
           success: false,
           error: error.message
         };
       }
     }

    /**
     * Configuration Management
     * ========================
     */

    /**
     * Get current configuration (deep copy)
     * 
     * @returns {Object} Current Mermaid configuration
     */
    getConfig() {
      return JSON.parse(JSON.stringify(this._config));
    }

    /**
     * Update theme variables
     * 
     * @param {Object} themeVariables - New theme variables to merge
     * @returns {boolean} True if update was successful
     */
    updateTheme(themeVariables) {
      if (!themeVariables || typeof themeVariables !== 'object') {
        this._logError('Invalid theme variables provided', { themeVariables });
        return false;
      }

      try {
        this._config.themeVariables = {
          ...this._config.themeVariables,
          ...themeVariables
        };

        // Re-initialize if already initialized
        if (this._initialized && this._isMermaidAvailable()) {
          global.mermaid.initialize(this._config);
          this._log('Theme updated and Mermaid re-initialized', { themeVariables });
        }

        return true;
      } catch (error) {
        this._logError('Failed to update theme', error);
        return false;
      }
    }

    /**
     * Status and Diagnostics
     * ======================
     */

    /**
     * Check if Mermaid is initialized
     * 
     * @returns {boolean} True if initialized
     */
    isInitialized() {
      return this._initialized;
    }

    /**
     * Get conversion statistics
     * 
     * @returns {Object} Conversion statistics
     */
    getConversionStats() {
      return { ...this._conversionStats };
    }

    /**
     * Run diagnostic checks
     * 
     * @returns {Object} Diagnostic results
     */
    runDiagnostics() {
      return {
        mermaidAvailable: this._isMermaidAvailable(),
        initialized: this._initialized,
        codeBlocksFound: document.querySelectorAll(CONFIG.SELECTORS.CODE_BLOCKS).length,
        mermaidDivsFound: document.querySelectorAll(`.${CONFIG.SELECTORS.MERMAID_CLASS}`).length,
        conversionStats: this._conversionStats,
        config: this.getConfig()
      };
    }

    /**
     * Private Implementation Methods
     * ==============================
     */

    /**
     * Check if Mermaid library is available
     * 
     * @private
     * @returns {boolean} True if Mermaid is available
     */
    _isMermaidAvailable() {
      return typeof global.mermaid !== 'undefined' && 
             typeof global.mermaid.initialize === 'function';
    }

    /**
     * Convert a single code block to Mermaid div
     * 
     * @private
     * @param {HTMLElement} codeBlock - The code block element to convert
     * @param {number} index - Index for logging purposes
     * @throws {Error} If conversion fails
     */
    _convertSingleCodeBlock(codeBlock, index) {
      if (!codeBlock || !codeBlock.parentElement) {
        throw new Error(`Invalid code block at index ${index}`);
      }

      const pre = codeBlock.parentElement;
      const content = codeBlock.textContent;

      if (!content || !content.trim()) {
        throw new Error(`Empty content in code block at index ${index}`);
      }

      // Create new Mermaid div
      const mermaidDiv = document.createElement('div');
      mermaidDiv.className = CONFIG.SELECTORS.MERMAID_CLASS;
      mermaidDiv.textContent = content;

      // Replace the pre element
      if (pre.parentNode) {
        pre.parentNode.replaceChild(mermaidDiv, pre);
        this._log(`Successfully converted code block ${index}`);
      } else {
        throw new Error(`No parent node for pre element at index ${index}`);
      }
    }

    /**
     * Merge configuration objects deeply
     * 
     * @private
     * @param {Object} defaultConfig - Default configuration
     * @param {Object} customConfig - Custom configuration overrides
     * @returns {Object} Merged configuration
     */
    _mergeConfig(defaultConfig, customConfig) {
      const merged = JSON.parse(JSON.stringify(defaultConfig));
      
      for (const key in customConfig) {
        if (customConfig.hasOwnProperty(key)) {
          if (typeof customConfig[key] === 'object' && customConfig[key] !== null) {
            merged[key] = this._mergeConfig(merged[key] || {}, customConfig[key]);
          } else {
            merged[key] = customConfig[key];
          }
        }
      }
      
      return merged;
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
        const logMessage = `[MermaidConfig] ${timestamp}: ${message}`;
        
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
      const errorMessage = `[MermaidConfig] ${timestamp}: ERROR - ${message}`;
      
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
  global.MermaidConfig = MermaidConfig;

  /**
   * Also export configuration constants for external use
   */
  global.MermaidConfig.CONFIG = CONFIG;

})(window); 
// Mermaid Configuration for Responsive Diagrams
window.mermaidConfig = {
  theme: 'default',
  startOnLoad: false,
  securityLevel: 'loose',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  fontSize: 14,
  
  // Responsive configuration
  maxWidth: '100%',
  useMaxWidth: true,
  
  // Flowchart configuration
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
    padding: 10
  },
  
  // Sequence diagram configuration
  sequence: {
    useMaxWidth: true,
    wrap: true,
    width: 150,
    height: 65,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35
  },
  
  // Gantt configuration
  gantt: {
    useMaxWidth: true,
    leftPadding: 75,
    gridLineStartPadding: 35,
    fontSize: 11,
    sectionFontSize: 11,
    numberSectionStyles: 4
  },
  
  // Git graph configuration
  gitGraph: {
    useMaxWidth: true,
    mainBranchName: 'main'
  },
  
  // Pie chart configuration
  pie: {
    useMaxWidth: true,
    textPosition: 0.75
  },
  
  // Class diagram configuration
  class: {
    useMaxWidth: true
  },
  
  // State diagram configuration
  state: {
    useMaxWidth: true
  },
  
  // Journey diagram configuration
  journey: {
    useMaxWidth: true,
    diagramMarginX: 50,
    diagramMarginY: 10,
    leftMargin: 150,
    width: 150,
    height: 50,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35
  },
  
  // Timeline configuration
  timeline: {
    useMaxWidth: true,
    padding: 5,
    useWidth: undefined
  }
};

// Initialize Mermaid with responsive configuration
if (typeof mermaid !== 'undefined') {
  mermaid.initialize(window.mermaidConfig);
} 
