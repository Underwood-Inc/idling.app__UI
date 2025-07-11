#!/usr/bin/env python3
"""
Modal JavaScript functionality for HTML Documentation Coverage Report

Provides references to modular JavaScript files for modal management.
This file has been refactored to use external JS modules instead of inline code.
"""

import os
import re

def _remove_es6_module_syntax(js_content: str) -> str:
    """Remove ES6 module syntax (import/export) from JavaScript for inline use."""
    # Remove import statements (various forms)
    js_content = re.sub(r'^import\s+.*?from\s+[\'"][^\'"]*[\'"];?\s*\n?', '', js_content, flags=re.MULTILINE)
    js_content = re.sub(r'^import\s+[\'"][^\'"]*[\'"];?\s*\n?', '', js_content, flags=re.MULTILINE)
    js_content = re.sub(r'^import\s+.*?;?\s*\n?', '', js_content, flags=re.MULTILINE)
    
    # Remove export statements (various forms)
    js_content = re.sub(r'^export\s+function\s+', 'function ', js_content, flags=re.MULTILINE)
    js_content = re.sub(r'^export\s+class\s+', 'class ', js_content, flags=re.MULTILINE)
    js_content = re.sub(r'^export\s+const\s+', 'const ', js_content, flags=re.MULTILINE)
    js_content = re.sub(r'^export\s+let\s+', 'let ', js_content, flags=re.MULTILINE)
    js_content = re.sub(r'^export\s+var\s+', 'var ', js_content, flags=re.MULTILINE)
    js_content = re.sub(r'^export\s+default\s+', '', js_content, flags=re.MULTILINE)
    js_content = re.sub(r'^export\s+\{[^}]*\};?\s*\n?', '', js_content, flags=re.MULTILINE)
    
    return js_content

def get_modal_manager_js() -> str:
    """Generate inlined modal management functionality by combining modular files."""
    
    # Get the directory containing this Python file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    js_dir = os.path.join(current_dir, 'js')
    
    # Read the separate JavaScript files
    syntax_highlighting_js = ""
    modal_manager_js = ""
    source_code_modal_js = ""
    
    try:
        # Read syntax highlighting utilities
        with open(os.path.join(js_dir, 'utils', 'syntax-highlighting.js'), 'r') as f:
            syntax_highlighting_js = f.read()
        
        # Read modal manager
        with open(os.path.join(js_dir, 'components', 'modal-manager.js'), 'r') as f:
            modal_manager_js = f.read()
        
        # Read source code modal (remove ES6 module syntax)
        with open(os.path.join(js_dir, 'components', 'source-code-modal.js'), 'r') as f:
            source_code_modal_js = f.read()
            # Remove import/export statements since we're inlining
            source_code_modal_js = _remove_es6_module_syntax(source_code_modal_js)
            # Remove the auto-execution part since we'll handle it in the main script
            source_code_modal_js = source_code_modal_js.replace(
                "// Call the extension function if this file is loaded\nif (typeof window !== 'undefined') {\n    extendModalManagerWithSourceCode();\n}", ""
            )
        
        # Clean syntax highlighting JS of export statements
        syntax_highlighting_js = _remove_es6_module_syntax(syntax_highlighting_js)
        
        # Clean modal manager JS of export statements  
        modal_manager_js = _remove_es6_module_syntax(modal_manager_js)
        
    except FileNotFoundError as e:
        print(f"⚠️  Warning: Could not load modular JavaScript files: {e}")
        print("    Falling back to inline JavaScript...")
        return get_fallback_modal_js()
    
    # Combine all JavaScript into a single inline script
    combined_js = f"""
    // Modal Manager - Combined from modular files for production
    // Source: js/utils/syntax-highlighting.js + js/components/modal-manager.js + js/components/source-code-modal.js
    
    // ============================================================================
    // Syntax Highlighting Utilities
    // ============================================================================
    
    {syntax_highlighting_js}
    
    // ============================================================================
    // Modal Manager
    // ============================================================================
    
    {modal_manager_js}
    
    // ============================================================================
    // Source Code Modal Extensions
    // ============================================================================
    
    {source_code_modal_js}
    
    // ============================================================================
    // Initialization
    // ============================================================================
    
    function initializeModalManager() {{
        if (window.modalManager) {{
            window.modalManager.destroy();
        }}
        
        window.modalManager = new ModalManager();
        
        // Extend with source code functionality
        if (typeof extendModalManagerWithSourceCode === 'function') {{
            extendModalManagerWithSourceCode();
        }}
        
        console.log('✅ Modal manager initialized');
    }}
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {{
        document.addEventListener('DOMContentLoaded', initializeModalManager);
    }} else {{
        initializeModalManager();
    }}
    """
    
    return combined_js


def get_fallback_modal_js() -> str:
    """Fallback inline JavaScript if modular files cannot be loaded."""
    return """
    // Fallback modal functionality
    console.warn('🔧 Using fallback modal functionality');
    
    function applySyntaxHighlighting(element, language) {
        if (!element) { return; }
        
        if (window.hljs && typeof window.hljs.highlightElement === 'function') {
            try {
                element.className = '';
                if (language) {
                    element.classList.add(`language-${language}`);
                }
                window.hljs.highlightElement(element);
                console.log('✨ Syntax highlighting applied with hljs');
                return;
            } catch (e) {
                console.warn('Failed to apply hljs highlighting:', e);
            }
        }
        
        // Basic fallback highlighting
        element.className = `hljs language-${language || 'javascript'}`;
        console.log('✨ Basic highlighting applied');
    }
    
    class ModalManager {
        constructor() {
            this.activeModal = null;
            this.fileMetadata = {};
            this.currentFilePath = null;
            this.isDestroyed = false;
            this.originalBodyOverflow = '';
            this.initializeModalSystem();
        }
        
        initializeModalSystem() {
            if (this.isDestroyed) { return; }
            
            this.originalBodyOverflow = document.body.style.overflow || '';
            this.loadEmbeddedSourceCode();
            this.setupModalEventHandlers();
            
            console.log('🎭 Modal system initialized successfully');
        }
        
        loadEmbeddedSourceCode() {
            try {
                const sourceCodeScript = document.querySelector('script[data-source-code="true"]');
                
                if (sourceCodeScript) {
                    try {
                        this.fileMetadata = JSON.parse(sourceCodeScript.textContent);
                        console.log(`📄 Loaded source code for ${Object.keys(this.fileMetadata).length} files`);
                    } catch (e) {
                        console.warn('Failed to parse source code data:', e);
                        this.fileMetadata = {};
                    }
                } else {
                    console.warn('No source code data found');
                    this.fileMetadata = {};
                }
            } catch (e) {
                console.warn('Failed to load source code data:', e);
                this.fileMetadata = {};
            }
        }
        
        setupModalEventHandlers() {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.activeModal && !this.isDestroyed) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeModal();
                }
            });
            
            document.addEventListener('click', (e) => {
                if (this.isDestroyed) { return; }
                
                if (e.target.classList.contains('modal') && this.activeModal) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeModal();
                }
                
                if (e.target.classList.contains('modal-close') && this.activeModal) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeModal();
                }
            });
        }
        
        showModal(modal) {
            if (this.isDestroyed) { return; }
            
            if (this.activeModal && this.activeModal !== modal) {
                this.closeModal();
            }
            
            if (!this.originalBodyOverflow) {
                this.originalBodyOverflow = document.body.style.overflow || '';
            }
            
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            requestAnimationFrame(() => {
                if (!this.isDestroyed) {
                    modal.classList.add('show');
                }
            });
            
            this.activeModal = modal;
            console.log('🎭 Modal opened successfully');
        }
        
        closeModal() {
            if (!this.activeModal || this.isDestroyed) { return; }
            
            console.log('🎭 Closing modal...');
            
            const modalToClose = this.activeModal;
            modalToClose.classList.remove('show');
            this.activeModal = null;
            document.body.style.overflow = this.originalBodyOverflow;
            
            setTimeout(() => {
                if (!this.isDestroyed && modalToClose) {
                    modalToClose.style.display = 'none';
                }
            }, 300);
            
            console.log('🎭 Modal closed successfully');
        }
        
        showLoadingState(loading, error, content) {
            if (loading) { loading.style.display = 'flex'; }
            if (error) { error.style.display = 'none'; }
            if (content) { content.style.display = 'none'; }
        }
        
        showSourceCodeModal(row) {
            console.log('📄 Source code modal functionality not fully loaded');
        }
        
        destroy() {
            if (this.activeModal) {
                this.closeModal();
            }
            this.isDestroyed = true;
            this.activeModal = null;
            this.fileMetadata = {};
            this.currentFilePath = null;
            document.body.style.overflow = this.originalBodyOverflow;
        }
    }
    
    function initializeModalManager() {
        if (window.modalManager) {
            window.modalManager.destroy();
        }
        
        window.modalManager = new ModalManager();
        console.log('✅ Modal manager initialized (fallback mode)');
    }
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeModalManager);
    } else {
        initializeModalManager();
    }
    """


def get_modal_script_tags() -> str:
    """Generate script tags for loading modular JavaScript components."""
    return """
    <!-- Modular JavaScript Components -->
    """


def get_modal_fallback_js() -> str:
    """Get fallback JavaScript for modal functionality."""
    return get_fallback_modal_js()


# Export the JavaScript generator functions
__all__ = ['get_modal_manager_js', 'get_modal_script_tags', 'get_modal_fallback_js'] 