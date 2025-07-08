#!/usr/bin/env python3
"""
Main JavaScript coordinator for HTML Documentation Coverage Report

Combines all JavaScript components and provides the main initialization function.
"""

try:
    from .js_table_manager import get_table_manager_js
    from .js_modals import get_modal_manager_js, get_modal_styles_js
    from .js_theme_utils import (
        get_theme_manager_js,
        get_timestamp_manager_js,
        get_keyboard_manager_js,
        get_utility_functions_js
    )
except ImportError:
    # Fallback functions for when modules are not available
    def get_table_manager_js() -> str: return "// Table manager not available"
    def get_modal_manager_js() -> str: return "// Modal manager not available"
    def get_modal_styles_js() -> str: return "// Modal styles not available"
    def get_theme_manager_js() -> str: return "// Theme manager not available"
    def get_timestamp_manager_js() -> str: return "// Timestamp manager not available"
    def get_keyboard_manager_js() -> str: return "// Keyboard manager not available"
    def get_utility_functions_js() -> str: return "// Utility functions not available"


def get_complete_javascript() -> str:
    """Generate the complete JavaScript for the HTML report."""
    return f"""
    {get_utility_functions_js()}
    
    {get_theme_manager_js()}
    
    {get_timestamp_manager_js()}
    
    {get_keyboard_manager_js()}
    
    {get_modal_manager_js()}
    
    {get_modal_styles_js()}
    
    {get_table_manager_js()}
    
    // Main Application Initialization
    class DocumentationCoverageApp {{
        constructor() {{
            this.components = {{}};
            this.initialized = false;
            this.init();
        }}
        
        init() {{
            console.log('🚀 Initializing Documentation Coverage Report App...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {{
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            }} else {{
                this.initializeApp();
            }}
        }}
        
        initializeApp() {{
            try {{
                // Initialize all components in order
                this.components.utilityManager = new UtilityManager();
                this.components.themeManager = new ThemeManager();
                this.components.timestampManager = new TimestampManager();
                this.components.keyboardManager = new KeyboardManager();
                this.components.modalStyleManager = new ModalStyleManager();
                this.components.modalManager = new ModalManager();
                this.components.tableManager = new EnhancedTableManager();
                
                // Make modal manager globally accessible
                window.modalManager = this.components.modalManager;
                
                this.initialized = true;
                this.setupGlobalErrorHandling();
                
                console.log('✅ Documentation Coverage Report App initialized successfully!');
                console.log('🎯 All interactive features are now active');
                
                // Show initialization notification
                if (this.components.utilityManager) {{
                    window.docsCoverageUtils.showNotification(
                        'Documentation Coverage Report loaded successfully!',
                        'success',
                        2000
                    );
                }}
                
            }} catch (error) {{
                console.error('❌ Failed to initialize app:', error);
                this.showInitializationError(error);
            }}
        }}
        
        setupGlobalErrorHandling() {{
            window.addEventListener('error', (event) => {{
                console.error('Global error:', event.error);
                
                // Show user-friendly error message
                if (window.docsCoverageUtils) {{
                    window.docsCoverageUtils.showNotification(
                        'An error occurred. Please refresh the page if issues persist.',
                        'error',
                        5000
                    );
                }}
            }});
            
            window.addEventListener('unhandledrejection', (event) => {{
                console.error('Unhandled promise rejection:', event.reason);
                
                // Show user-friendly error message
                if (window.docsCoverageUtils) {{
                    window.docsCoverageUtils.showNotification(
                        'An error occurred. Please refresh the page if issues persist.',
                        'error',
                        5000
                    );
                }}
            }});
        }}
        
        showInitializationError(error) {{
            // Create error message element
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #ef4444;
                color: white;
                padding: 16px;
                text-align: center;
                z-index: 10000;
                font-family: monospace;
            `;
            errorDiv.innerHTML = `
                <strong>⚠️ Initialization Error</strong><br>
                Some interactive features may not work properly.<br>
                <small>Error: ${{error.message}}</small><br>
                <button onclick="location.reload()" style="margin-top: 8px; padding: 4px 8px; background: white; color: #ef4444; border: none; border-radius: 4px; cursor: pointer;">
                    Reload Page
                </button>
            `;
            
            document.body.insertBefore(errorDiv, document.body.firstChild);
            
            // Auto-hide after 10 seconds
            setTimeout(() => {{
                if (errorDiv.parentNode) {{
                    errorDiv.parentNode.removeChild(errorDiv);
                }}
            }}, 10000);
        }}
        
        getComponent(name) {{
            return this.components[name];
        }}
        
        isInitialized() {{
            return this.initialized;
        }}
    }}
    
    // Initialize the application
    const app = new DocumentationCoverageApp();
    
    // Make app globally accessible for debugging
    window.docsCoverageApp = app;
    
    // Export for potential module usage
    if (typeof module !== 'undefined' && module.exports) {{
        module.exports = {{ DocumentationCoverageApp, app }};
    }}
    """


def get_legacy_javascript() -> str:
    """Generate JavaScript with legacy support for older browsers."""
    return f"""
    // Legacy browser support check
    (function() {{
        'use strict';
        
        // Check for required features
        const requiredFeatures = [
            'querySelector',
            'addEventListener',
            'classList',
            'dataset',
            'localStorage',
            'JSON'
        ];
        
        const missingFeatures = requiredFeatures.filter(feature => {{
            if (feature === 'querySelector') return !document.querySelector;
            if (feature === 'addEventListener') return !document.addEventListener;
            if (feature === 'classList') return !document.body.classList;
            if (feature === 'dataset') return !document.body.dataset;
            if (feature === 'localStorage') return !window.localStorage;
            if (feature === 'JSON') return !window.JSON;
            return false;
        }});
        
        if (missingFeatures.length > 0) {{
            console.warn('⚠️ Legacy browser detected. Missing features:', missingFeatures);
            
            // Show legacy browser warning
            const warning = document.createElement('div');
            warning.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #f59e0b;
                color: white;
                padding: 12px;
                text-align: center;
                z-index: 10000;
                font-family: Arial, sans-serif;
            `;
            warning.innerHTML = `
                <strong>⚠️ Browser Compatibility Notice</strong><br>
                Your browser may not support all interactive features of this report.<br>
                For the best experience, please use a modern browser.
            `;
            
            document.body.insertBefore(warning, document.body.firstChild);
            
            // Provide basic functionality fallback
            return;
        }}
        
        // Modern browser - load full functionality
        {get_complete_javascript()}
    }})();
    """


# Export the main JavaScript functions
__all__ = [
    'get_complete_javascript',
    'get_legacy_javascript'
] 