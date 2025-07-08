#!/usr/bin/env python3
"""
Modal JavaScript functionality for HTML Documentation Coverage Report - REBUILT FROM SCRATCH

Provides working modal dialog management including source code viewer, column picker, and help modals.
"""

def get_modal_manager_js() -> str:
    """Generate JavaScript for modal management functionality - REBUILT TO ACTUALLY WORK."""
    return """
    // Modal Manager - REBUILT FROM SCRATCH to actually work
    class ModalManager {
        constructor() {
            this.activeModal = null;
            this.sourceCodeData = {};
            this.currentFilePath = null;
            this.initializeModalSystem();
        }
        
        initializeModalSystem() {
            // Load source code data from embedded scripts
            this.loadEmbeddedSourceCode();
            
            // Setup event handlers
            this.setupGlobalHandlers();
            this.setupModalHandlers();
            
            console.log('🎭 Modal system initialized');
        }
        
        loadEmbeddedSourceCode() {
            const sourceScripts = document.querySelectorAll('script[data-source-code="true"]');
            
            sourceScripts.forEach(script => {
                try {
                    const data = JSON.parse(script.textContent);
                    this.sourceCodeData = { ...this.sourceCodeData, ...data };
                    console.log(`📄 Loaded source code for ${Object.keys(data).length} files`);
                } catch (e) {
                    console.warn('Failed to parse source code data:', e);
                    console.warn('Source code previews may not be available for some files');
                }
            });
            
            if (Object.keys(this.sourceCodeData).length === 0) {
                console.warn('No source code data loaded - modals will show fallback content');
            }
        }
        
        setupGlobalHandlers() {
            // Escape key closes modals
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.activeModal) {
                    this.closeModal();
                }
            });
            
            // NOTE: Row click handlers are handled by the table manager
            // No need to duplicate them here as that causes conflicts
        }
        
        setupModalHandlers() {
            // Modal backdrop clicks
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal')) {
                    this.closeModal();
                }
            });
            
            // Close button clicks
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-close')) {
                    this.closeModal();
                }
            });
            
            // GitHub button clicks
            document.addEventListener('click', (e) => {
                if (e.target.id === 'open-github-btn' || e.target.closest('#open-github-btn')) {
                    const githubUrl = e.target.dataset.githubUrl || e.target.closest('#open-github-btn').dataset.githubUrl;
                    if (githubUrl) {
                        window.open(githubUrl, '_blank');
                    }
                }
            });
        }
        
        openSourceCodeModal(row) {
            const filePath = row.dataset.filePath;
            const fileName = row.dataset.fileName || filePath.split('/').pop();
            const githubUrl = row.dataset.githubUrl;
            
            if (!filePath) {
                console.warn('No file path found for row');
                return;
            }
            
            // Store current file path for error messages
            this.currentFilePath = filePath;
            
            console.log(`📄 Opening source code modal for: ${fileName}`);
            
            // Get modal elements
            const modal = document.getElementById('source-code-modal');
            const title = document.getElementById('source-modal-title');
            const loading = document.getElementById('source-loading');
            const error = document.getElementById('source-error');
            const content = document.getElementById('source-code-content');
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
            }
            
            // Show modal
            this.showModal(modal);
            
            // Show loading state
            this.showLoadingState(loading, error, content);
            
            // Load source code
            setTimeout(() => {
                this.loadAndDisplaySourceCode(filePath, loading, error, content);
            }, 100);
        }
        
        showModal(modal) {
            if (this.activeModal && this.activeModal !== modal) {
                this.closeModal();
            }
            
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Trigger animation
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
            
            this.activeModal = modal;
            console.log('🎭 Modal opened');
        }
        
        closeModal() {
            if (!this.activeModal) return;
            
            this.activeModal.classList.remove('show');
            document.body.style.overflow = '';
            
            // Hide after animation
            setTimeout(() => {
                if (this.activeModal) {
                    this.activeModal.style.display = 'none';
                }
            }, 300);
            
            this.activeModal = null;
            console.log('🎭 Modal closed');
        }
        
        showLoadingState(loading, error, content) {
            if (loading) loading.style.display = 'flex';
            if (error) error.style.display = 'none';
            if (content) content.style.display = 'none';
        }
        
        loadAndDisplaySourceCode(filePath, loading, error, content) {
            const sourceData = this.sourceCodeData[filePath];
            
            if (sourceData) {
                this.displaySourceCode(sourceData, loading, error, content);
            } else {
                this.displaySourceCodeError('Source code not available in this report', loading, error, content);
            }
        }
        
        displaySourceCode(sourceData, loading, error, content) {
            if (!content) return;
            
            // Hide loading, show content
            if (loading) loading.style.display = 'none';
            if (error) error.style.display = 'none';
            content.style.display = 'block';
            
            // Clear existing content
            content.innerHTML = '';
            
            // Create actual code content with proper scrolling
            const codeContainer = document.createElement('div');
            codeContainer.className = 'source-code';
            
            const codeElement = document.createElement('code');
            codeElement.textContent = sourceData.content;
            
            codeContainer.appendChild(codeElement);
            content.appendChild(codeContainer);
            
            console.log(`📄 Source code loaded successfully`);
        }
        
        displaySourceCodeError(message, loading, error, content) {
            if (loading) loading.style.display = 'none';
            if (content) content.style.display = 'none';
            
            if (error) {
                error.style.display = 'flex';
                error.innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <div style="font-size: 2rem; margin-bottom: 1rem;">📂</div>
                        <h3 style="margin: 0 0 1rem 0; color: var(--text-primary);">Source Code Preview</h3>
                        <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">
                            Source code embedding is currently disabled to ensure optimal performance.
                        </p>
                        <div style="background: var(--bg-primary); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                            <p style="margin: 0; font-weight: 600; color: var(--text-primary);">To view this file:</p>
                            <ul style="text-align: left; margin: 0.5rem 0; padding-left: 1.5rem; color: var(--text-secondary);">
                                <li>Click the <strong>GitHub</strong> button above</li>
                                <li>Open the file in your code editor</li>
                                <li>Check the file path: <code style="background: var(--bg-secondary); padding: 2px 4px; border-radius: 3px;">${this.currentFilePath || 'File path not available'}</code></li>
                            </ul>
                        </div>
                        <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted);">
                            Future versions will include configurable source code embedding.
                        </p>
                    </div>
                `;
            }
            
            console.warn(`📄 Source code info: ${message}`);
        }
        
        openColumnPicker() {
            const modal = document.getElementById('column-picker-modal');
            if (modal) {
                this.showModal(modal);
            }
        }
        
        openHelpModal() {
            const modal = document.getElementById('help-modal');
            if (modal) {
                this.showModal(modal);
            }
        }
        
        // Alias method for backward compatibility
        showSourceCodeModal(row) {
            this.openSourceCodeModal(row);
        }
    }
    
    // Initialize the modal manager when DOM is ready
    let modalManager;
    
    function initializeModalManager() {
        modalManager = new ModalManager();
        window.modalManager = modalManager;
        console.log('✅ Modal manager ready');
    }
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeModalManager);
    } else {
        initializeModalManager();
    }
    """


def get_modal_styles_js() -> str:
    """Generate JavaScript for modal styling and animations - SIMPLIFIED."""
    return """
    // Modal Animation and Styling Manager - SIMPLIFIED
    class ModalStyleManager {
        constructor() {
            this.addModalStyles();
        }
        
        addModalStyles() {
            // Add any additional dynamic styles if needed
            console.log('🎨 Modal styles initialized');
        }
    }
    """


# Export the JavaScript generator functions
__all__ = [
    'get_modal_manager_js',
    'get_modal_styles_js'
] 