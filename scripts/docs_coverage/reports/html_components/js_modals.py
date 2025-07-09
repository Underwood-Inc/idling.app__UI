#!/usr/bin/env python3
"""
Modal JavaScript functionality for HTML Documentation Coverage Report - FIXED VERSION

Provides working modal dialog management that doesn't break other JavaScript.
"""

def get_modal_manager_js() -> str:
    """Generate JavaScript for modal management functionality - FIXED TO NOT BREAK OTHER JS."""
    return """
    // Modal Manager - FIXED VERSION that doesn't break other JavaScript
    class ModalManager {
        constructor() {
            this.activeModal = null;
            this.sourceCodeData = {};
            this.currentFilePath = null;
            this.isDestroyed = false;
            this.originalBodyOverflow = '';
            this.initializeModalSystem();
        }
        
        initializeModalSystem() {
            if (this.isDestroyed) return;
            
            // Store original body overflow
            this.originalBodyOverflow = document.body.style.overflow || '';
            
            // Load source code data from embedded scripts
            this.loadEmbeddedSourceCode();
            
            // Setup event handlers with proper cleanup
            this.setupModalEventHandlers();
            
            console.log('🎭 Modal system initialized successfully');
        }
        
        loadEmbeddedSourceCode() {
            try {
                const sourceScripts = document.querySelectorAll('script[data-source-code="true"]');
                
                sourceScripts.forEach(script => {
                    try {
                        const data = JSON.parse(script.textContent);
                        this.sourceCodeData = { ...this.sourceCodeData, ...data };
                    } catch (e) {
                        console.warn('Failed to parse source code data:', e);
                    }
                });
                
                console.log(`📄 Loaded source code for ${Object.keys(this.sourceCodeData).length} files`);
            } catch (e) {
                console.warn('Failed to load source code data:', e);
            }
        }
        
        setupModalEventHandlers() {
            // CRITICAL: Use event delegation to prevent handler conflicts
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.activeModal && !this.isDestroyed) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeModal();
                }
            });
            
            // Modal backdrop clicks - use event delegation
            document.addEventListener('click', (e) => {
                if (this.isDestroyed) return;
                
                // Close modal if clicking backdrop
                if (e.target.classList.contains('modal') && this.activeModal) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeModal();
                }
                
                // Close modal if clicking close button
                if (e.target.classList.contains('modal-close') && this.activeModal) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeModal();
                }
                
                // Handle GitHub button clicks
                if (e.target.id === 'open-github-btn' || e.target.closest('#open-github-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const githubBtn = e.target.id === 'open-github-btn' ? e.target : e.target.closest('#open-github-btn');
                    const githubUrl = githubBtn.dataset.githubUrl;
                    if (githubUrl) {
                        window.open(githubUrl, '_blank');
                    }
                }
            });
        }
        
        showSourceCodeModal(row) {
            if (this.isDestroyed) return;
            
            const filePath = row.dataset.filePath || row.dataset.fileName;
            const fileName = row.dataset.fileName || filePath?.split('/').pop() || 'Unknown File';
            const githubUrl = row.dataset.githubUrl;
            
            if (!filePath) {
                console.warn('No file path found for row');
                return;
            }
            
            this.currentFilePath = filePath;
            console.log(`📄 Opening source code modal for: ${fileName}`);
            
            // Get modal elements
            const modal = document.getElementById('source-code-modal');
            const title = document.getElementById('source-modal-title');
            const loading = document.getElementById('source-loading');
            const error = document.getElementById('source-error');
            const content = document.getElementById('source-code-content');
            const codeText = document.getElementById('source-code-text');
            const githubBtn = document.getElementById('open-github-btn');
            
            if (!modal) {
                console.error('Source code modal not found');
                return;
            }
            
            // Update modal title
            if (title) {
                title.textContent = `📄 ${fileName}`;
            }
            
            // Setup GitHub button
            if (githubBtn && githubUrl) {
                githubBtn.dataset.githubUrl = githubUrl;
                githubBtn.style.display = 'inline-flex';
            } else if (githubBtn) {
                githubBtn.style.display = 'none';
            }
            
            // Show modal properly
            this.showModal(modal);
            
            // Show loading state
            this.showLoadingState(loading, error, content);
            
            // Load source code after a brief delay
            setTimeout(() => {
                this.loadAndDisplaySourceCode(filePath, loading, error, content, codeText);
            }, 100);
        }
        
        showModal(modal) {
            if (this.isDestroyed) return;
            
            // Close any existing modal first
            if (this.activeModal && this.activeModal !== modal) {
                this.closeModal();
            }
            
            // Store original body overflow if not already stored
            if (!this.originalBodyOverflow) {
                this.originalBodyOverflow = document.body.style.overflow || '';
            }
            
            // Show the modal
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Trigger animation
            requestAnimationFrame(() => {
                if (!this.isDestroyed) {
                    modal.classList.add('show');
                }
            });
            
            this.activeModal = modal;
            console.log('🎭 Modal opened successfully');
        }
        
        closeModal() {
            if (!this.activeModal || this.isDestroyed) return;
            
            console.log('🎭 Closing modal...');
            
            const modalToClose = this.activeModal;
            
            // Remove show class to trigger animation
            modalToClose.classList.remove('show');
            
            // CRITICAL: Reset the activeModal immediately to prevent conflicts
            this.activeModal = null;
            
            // CRITICAL: Restore body overflow immediately to prevent lockup
            document.body.style.overflow = this.originalBodyOverflow;
            
            // Hide modal after animation completes
            setTimeout(() => {
                if (!this.isDestroyed && modalToClose) {
                    modalToClose.style.display = 'none';
                }
            }, 300);
            
            console.log('🎭 Modal closed successfully');
        }
        
        showLoadingState(loading, error, content) {
            if (loading) {
                loading.style.display = 'flex';
            }
            if (error) {
                error.style.display = 'none';
            }
            if (content) {
                content.style.display = 'none';
            }
        }
        
        loadAndDisplaySourceCode(filePath, loading, error, content, codeText) {
            const sourceData = this.sourceCodeData[filePath];
            
            if (sourceData && sourceData.content) {
                this.displaySourceCode(sourceData.content, sourceData.language, loading, error, content, codeText);
            } else {
                this.displaySourceCodeError('Source code not available', loading, error, content);
            }
        }
        
        displaySourceCode(sourceContent, language, loading, error, content, codeText) {
            if (!content || !codeText) return;
            
            // Hide loading, show content
            if (loading) loading.style.display = 'none';
            if (error) error.style.display = 'none';
            content.style.display = 'block';
            
            // Clear any existing content and classes
            codeText.innerHTML = '';
            codeText.className = '';
            
            // Set the source code content
            codeText.textContent = sourceContent;
            
            // Apply syntax highlighting with multiple strategies
            this.applySyntaxHighlighting(codeText, language);
            
            console.log('📄 Source code displayed successfully');
        }
        
        applySyntaxHighlighting(element, language) {
            if (!element) return;
            
            // Strategy 1: Use hljs if available
            if (window.hljs && typeof window.hljs.highlightElement === 'function') {
                try {
                    // Clear existing classes
                    element.className = '';
                    
                    // Set language class
                    if (language) {
                        element.classList.add(`language-${language}`);
                    }
                    
                    // Apply highlighting
                    window.hljs.highlightElement(element);
                    console.log('✨ Syntax highlighting applied with hljs');
                    return;
                } catch (e) {
                    console.warn('Failed to apply hljs highlighting:', e);
                }
            }
            
            // Strategy 2: Use hljs.highlightBlock (older API)
            if (window.hljs && typeof window.hljs.highlightBlock === 'function') {
                try {
                    element.className = language ? `language-${language}` : '';
                    window.hljs.highlightBlock(element);
                    console.log('✨ Syntax highlighting applied with hljs (legacy)');
                    return;
                } catch (e) {
                    console.warn('Failed to apply hljs legacy highlighting:', e);
                }
            }
            
            // Strategy 3: Manual highlighting with classes
            try {
                this.applyManualSyntaxHighlighting(element, language);
                console.log('✨ Manual syntax highlighting applied');
            } catch (e) {
                console.warn('Failed to apply manual highlighting:', e);
            }
        }
        
        applyManualSyntaxHighlighting(element, language) {
            const content = element.textContent;
            element.className = `hljs language-${language || 'javascript'}`;
            
            // Apply basic regex-based highlighting
            let html = content;
            
            // Keywords
            const keywords = [
                'import', 'export', 'from', 'const', 'let', 'var', 'function', 'return',
                'if', 'else', 'for', 'while', 'class', 'interface', 'type', 'enum',
                'async', 'await', 'try', 'catch', 'finally', 'throw', 'new', 'this',
                'super', 'extends', 'implements', 'public', 'private', 'protected',
                'static', 'readonly', 'default', 'true', 'false', 'null', 'undefined'
            ];
            
            keywords.forEach(keyword => {
                const regex = new RegExp(`\\\\b${keyword}\\\\b`, 'g');
                html = html.replace(regex, `<span class="hljs-keyword">${keyword}</span>`);
            });
            
            // Strings
            html = html.replace(/(["'`])((?:\\\\\\\\.|(?!\\\\1)[^\\\\\\\\])*?)\\\\1/g, '<span class="hljs-string">$1$2$1</span>');
            
            // Comments
            html = html.replace(/(\/\/.*$)/gm, '<span class="hljs-comment">$1</span>');
            html = html.replace(/(\/\\*[\\\\s\\\\S]*?\\*\/)/g, '<span class="hljs-comment">$1</span>');
            
            // Numbers
            html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hljs-number">$1</span>');
            
            // Function names
            html = html.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, '<span class="hljs-function">$1</span>');
            
            // Types (capitalized words)
            html = html.replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span class="hljs-title class_">$1</span>');
            
            element.innerHTML = html;
        }
        
        displaySourceCodeError(message, loading, error, content) {
            if (loading) loading.style.display = 'none';
            if (content) content.style.display = 'none';
            
            if (error) {
                error.style.display = 'flex';
                error.innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <div style="font-size: 2rem; margin-bottom: 1rem;">📂</div>
                        <h3 style="margin: 0 0 1rem 0;">Source Code Preview</h3>
                        <p style="margin-bottom: 1.5rem; color: #888;">
                            ${message}
                        </p>
                        <div style="background: #1e1e1e; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                            <p style="margin: 0; font-weight: 600;">To view this file:</p>
                            <ul style="text-align: left; margin: 0.5rem 0; padding-left: 1.5rem;">
                                <li>Click the <strong>GitHub</strong> button above</li>
                                <li>Open the file in your code editor</li>
                                <li>File path: <code style="background: #333; padding: 2px 4px; border-radius: 3px;">${this.currentFilePath || 'Not available'}</code></li>
                            </ul>
                        </div>
                    </div>
                `;
            }
            
            console.log('📄 Source code error displayed');
        }
        
        showColumnPicker() {
            const modal = document.getElementById('column-picker-modal');
            if (modal) {
                this.showModal(modal);
            }
        }
        
        showHelpModal() {
            const modal = document.getElementById('help-modal');
            if (modal) {
                this.showModal(modal);
            }
        }
        
        // Cleanup method
        destroy() {
            if (this.activeModal) {
                this.closeModal();
            }
            this.isDestroyed = true;
            this.activeModal = null;
            this.sourceCodeData = {};
            this.currentFilePath = null;
            // Restore original body overflow
            document.body.style.overflow = this.originalBodyOverflow;
        }
    }
    
    // Initialize the modal manager
    window.modalManager = null;
    
    function initializeModalManager() {
        if (window.modalManager) {
            window.modalManager.destroy();
        }
        
        window.modalManager = new ModalManager();
        console.log('✅ Modal manager initialized');
    }
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeModalManager);
    } else {
        initializeModalManager();
    }
    """


# Export the JavaScript generator function
__all__ = ['get_modal_manager_js'] 