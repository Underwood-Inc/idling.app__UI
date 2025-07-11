#!/usr/bin/env python3
"""
Main JavaScript coordinator for HTML Documentation Coverage Report

Combines all JavaScript components and provides the main initialization function.
"""

try:
    # First try relative imports
    from .js_table_manager import get_table_manager_js
    from .js_modals import get_modal_manager_js
    from .js_theme_utils import (
        get_theme_manager_js,
        get_timestamp_manager_js,
        get_keyboard_manager_js,
        get_utility_functions_js
    )
    print("✅ All JavaScript components imported successfully")
except ImportError as e:
    print(f"❌ Relative import error: {e}")
    # Try absolute imports
    try:
        import sys
        from pathlib import Path
        sys.path.append(str(Path(__file__).parent))
        
        from js_table_manager import get_table_manager_js
        from js_modals import get_modal_manager_js
        from js_theme_utils import (
            get_theme_manager_js,
            get_timestamp_manager_js,
            get_keyboard_manager_js,
            get_utility_functions_js
        )
        print("✅ JavaScript components imported via absolute import")
    except ImportError as e2:
        print(f"❌ Absolute import error: {e2}")
        # Fallback functions for when modules are not available
        def get_table_manager_js() -> str: return "// Table manager not available"
        def get_modal_manager_js() -> str: return "// Modal manager not available"
        def get_theme_manager_js() -> str: return "// Theme manager not available"
        def get_timestamp_manager_js() -> str: return "// Timestamp manager not available"
        def get_keyboard_manager_js() -> str: return "// Keyboard manager not available"
        def get_utility_functions_js() -> str: return "// Utility functions not available"


def get_complete_javascript() -> str:
    """Generate the complete JavaScript for the HTML report."""
    # Build JavaScript components
    utility_js = get_utility_functions_js()
    theme_js = get_theme_manager_js()
    timestamp_js = get_timestamp_manager_js()
    keyboard_js = get_keyboard_manager_js()
    modal_js = get_modal_manager_js()
    table_js = get_table_manager_js()
    
    # Main app JavaScript without f-string formatting issues
    main_app_js = """
    // Main Application Controller - FIXED VERSION
    class DocumentationCoverageApp {
        constructor() {
            this.components = {};
            this.initialized = false;
            this.isDestroyed = false;
            this.init();
        }
        
        init() {
            console.log('🚀 Initializing Documentation Coverage Report App...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                this.initializeApp();
            }
        }
        
        initializeApp() {
            if (this.isDestroyed) return;
            
            console.log('🔧 Starting component initialization...');
            
            // Initialize core components
            this.initializeGlobalErrorHandling();
            this.initializeSyntaxHighlighting();
            this.initializeUtilities();
            this.initializeTheme();
            this.initializeTimestamps();
            this.initializeKeyboardShortcuts();
            this.initializeModals();
            this.initializeTable();
            
            this.initialized = true;
            console.log('✅ Documentation Coverage Report App initialized successfully!');
            console.log('🎯 All interactive features are now active');
        }
        
        initializeGlobalErrorHandling() {
            this.setupGlobalErrorHandling();
        }
        
        initializeSyntaxHighlighting() {
            try {
                // Initialize highlight.js if available
                if (typeof window.hljs !== 'undefined') {
                    window.hljs.configure({
                        languages: ['typescript', 'javascript', 'python', 'css', 'json', 'html'],
                        ignoreUnescapedHTML: true
                    });
                    console.log('✨ Syntax highlighting initialized successfully');
                } else {
                    console.warn('⚠️ Highlight.js not available');
                }
            } catch (error) {
                console.warn('⚠️ Failed to initialize syntax highlighting:', error);
            }
        }
        
        initializeUtilities() {
            try {
                if (typeof UtilityManager !== 'undefined') {
                    this.components.utilityManager = new UtilityManager();
                    console.log('✅ Utility manager initialized');
                } else {
                    console.log('ℹ️ Utility manager not available');
                }
            } catch (error) {
                console.warn('⚠️ Failed to initialize utilities:', error);
            }
        }
        
        initializeTheme() {
            try {
                if (typeof ThemeManager !== 'undefined') {
                    this.components.themeManager = new ThemeManager();
                    console.log('✅ Theme manager initialized');
                } else {
                    console.log('ℹ️ Theme manager not available');
                }
            } catch (error) {
                console.warn('⚠️ Failed to initialize theme manager:', error);
            }
        }
        
        initializeTimestamps() {
            try {
                if (typeof TimestampManager !== 'undefined') {
                    this.components.timestampManager = new TimestampManager();
                    console.log('✅ Timestamp manager initialized');
                } else {
                    console.log('ℹ️ Timestamp manager not available');
                }
            } catch (error) {
                console.warn('⚠️ Failed to initialize timestamp manager:', error);
            }
        }
        
        initializeKeyboardShortcuts() {
            try {
                if (typeof KeyboardManager !== 'undefined') {
                    this.components.keyboardManager = new KeyboardManager();
                    console.log('✅ Keyboard manager initialized');
                } else {
                    console.log('ℹ️ Keyboard manager not available');
                }
            } catch (error) {
                console.warn('⚠️ Failed to initialize keyboard manager:', error);
            }
        }
        
        initializeModals() {
            try {
                // Modal manager initializes itself, just ensure it's available
                if (window.modalManager) {
                    this.components.modalManager = window.modalManager;
                    console.log('✅ Modal manager ready');
                } else {
                    console.warn('⚠️ Modal manager not available');
                }
                
            } catch (error) {
                console.warn('⚠️ Failed to initialize modal components:', error);
            }
        }
        
        initializeTable() {
            try {
                if (typeof EnhancedTableManager !== 'undefined') {
                    this.components.tableManager = new EnhancedTableManager();
                    console.log('✅ Table manager initialized');
                } else {
                    console.log('ℹ️ Table manager not available');
                }
            } catch (error) {
                console.warn('⚠️ Failed to initialize table manager:', error);
            }
        }
        
        setupGlobalErrorHandling() {
            window.addEventListener('error', (event) => {
                console.error('🚨 Global error caught:', event.error);
                // Don't prevent default behavior, just log
            });
            
            window.addEventListener('unhandledrejection', (event) => {
                console.error('🚨 Unhandled promise rejection:', event.reason);
                // Don't prevent default behavior, just log
            });
        }
        
        destroy() {
            this.isDestroyed = true;
            
            // Clean up all components
            Object.values(this.components).forEach(component => {
                if (component && typeof component.destroy === 'function') {
                    component.destroy();
                }
            });
            
            this.components = {};
            this.initialized = false;
        }
    }
    
    // Global initialization function
    function initializeDocsCoverageApp() {
        // Clean up any existing instance
        if (window.docsCoverageApp) {
            window.docsCoverageApp.destroy();
        }
        
        // Create new instance
        window.docsCoverageApp = new DocumentationCoverageApp();
    }
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDocsCoverageApp);
    } else {
        initializeDocsCoverageApp();
    }
    """
    
    # Combine all JavaScript components using string concatenation
    complete_js = """
    // Documentation Coverage Report - Main JavaScript Application
    // FIXED VERSION - No conflicts, proper syntax highlighting
    
    """ + utility_js + """
    
    """ + theme_js + """
    
    """ + timestamp_js + """
    
    """ + keyboard_js + """
    
    """ + modal_js + """
    
    """ + table_js + """
    
    """ + main_app_js
    
    return complete_js


# Export the main function
__all__ = ['get_complete_javascript'] 