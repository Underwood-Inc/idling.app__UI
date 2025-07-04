#!/usr/bin/env python3
"""
Modal JavaScript functionality for HTML Documentation Coverage Report

Provides modal dialog management including source code viewer, column picker, and help modals.
"""

def get_modal_manager_js() -> str:
    """Generate JavaScript for modal management functionality."""
    return """
    // Modal Manager for handling all modal dialogs
    class ModalManager {
        constructor() {
            this.activeModal = null;
            this.setupModalHandlers();
        }
        
        setupModalHandlers() {
            // Setup escape key handler
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.activeModal) {
                    this.closeModal(this.activeModal);
                }
            });
            
            // Setup modal backdrop click handlers
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeModal(modal);
                    }
                });
            });
            
            // Setup close button handlers
            document.querySelectorAll('.modal-close').forEach(closeBtn => {
                closeBtn.addEventListener('click', (e) => {
                    const modal = e.target.closest('.modal');
                    if (modal) {
                        this.closeModal(modal);
                    }
                });
            });
            
            console.log('🎭 Modal handlers initialized');
        }
        
        showModal(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) {
                console.warn(`⚠️ Modal not found: ${modalId}`);
                return;
            }
            
            // Close any existing modal
            if (this.activeModal) {
                this.closeModal(this.activeModal);
            }
            
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
            
            this.activeModal = modal;
            
            // Focus management
            const firstFocusable = modal.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            }
            
            console.log(`🎭 Modal opened: ${modalId}`);
        }
        
        closeModal(modal) {
            if (!modal) return;
            
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
            
            this.activeModal = null;
            
            console.log('🎭 Modal closed');
        }
        
        showSourceCodeModal(row) {
            const fileName = row.dataset.fileName || 'Unknown File';
            const filePath = row.dataset.filePath || '';
            const githubUrl = row.dataset.githubUrl || '';
            
            // Update modal content
            const modal = document.getElementById('source-code-modal');
            if (!modal) return;
            
            const title = modal.querySelector('#source-modal-title');
            const pathElement = modal.querySelector('#source-path');
            const statsElement = modal.querySelector('#source-stats');
            const codeContent = modal.querySelector('#source-code-content code');
            const githubBtn = modal.querySelector('#open-github-btn');
            
            if (title) title.textContent = `Source: ${fileName}`;
            if (pathElement) pathElement.textContent = filePath;
            if (statsElement) statsElement.textContent = 'Loading file information...';
            if (codeContent) codeContent.textContent = 'Loading source code...';
            if (githubBtn) githubBtn.dataset.githubUrl = githubUrl;
            
            this.showModal('source-code-modal');
            
            // Simulate loading source code (in real implementation, this would fetch from server)
            setTimeout(() => {
                if (codeContent) {
                    codeContent.textContent = `// Source code for ${fileName}
// This is a placeholder - in a real implementation, 
// the actual source code would be fetched from the server
                    
class ExampleClass {
    constructor() {
        this.fileName = '${fileName}';
        this.filePath = '${filePath}';
    }
    
    getDocumentationGaps() {
        // Implementation would analyze the file for documentation gaps
        return [];
    }
}

export default ExampleClass;`;
                }
                
                if (statsElement) {
                    statsElement.textContent = 'Lines: 42 | Size: 1.2 KB | Type: JavaScript';
                }
            }, 500);
        }
        
        showColumnPicker() {
            this.showModal('column-picker-modal');
        }
        
        showHelpModal() {
            this.showModal('help-modal');
        }
    }
    
    // Source Code Modal Functionality
    class SourceCodeManager {
        constructor() {
            this.setupSourceCodeHandlers();
        }
        
        setupSourceCodeHandlers() {
            // Copy source code button
            const copyBtn = document.getElementById('copy-source-btn');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    this.copySourceCode();
                });
            }
            
            // Download source code button
            const downloadBtn = document.getElementById('download-source-btn');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => {
                    this.downloadSourceCode();
                });
            }
            
            // GitHub button
            const githubBtn = document.getElementById('open-github-btn');
            if (githubBtn) {
                githubBtn.addEventListener('click', () => {
                    const url = githubBtn.dataset.githubUrl;
                    if (url) {
                        window.open(url, '_blank');
                    }
                });
            }
            
            console.log('📄 Source code handlers initialized');
        }
        
        copySourceCode() {
            const codeElement = document.querySelector('#source-code-content code');
            if (!codeElement) return;
            
            const text = codeElement.textContent;
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    this.showCopyFeedback('Source code copied to clipboard!');
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    this.fallbackCopyText(text);
                });
            } else {
                this.fallbackCopyText(text);
            }
        }
        
        fallbackCopyText(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showCopyFeedback('Source code copied to clipboard!');
            } catch (err) {
                console.error('Fallback copy failed:', err);
                this.showCopyFeedback('Failed to copy source code', 'error');
            }
            
            document.body.removeChild(textArea);
        }
        
        showCopyFeedback(message, type = 'success') {
            const copyBtn = document.getElementById('copy-source-btn');
            if (!copyBtn) return;
            
            const originalText = copyBtn.querySelector('.btn-text').textContent;
            const textElement = copyBtn.querySelector('.btn-text');
            
            textElement.textContent = message;
            copyBtn.classList.add(type === 'success' ? 'success' : 'error');
            
            setTimeout(() => {
                textElement.textContent = originalText;
                copyBtn.classList.remove('success', 'error');
            }, 2000);
        }
        
        downloadSourceCode() {
            const codeElement = document.querySelector('#source-code-content code');
            const pathElement = document.querySelector('#source-path');
            
            if (!codeElement || !pathElement) return;
            
            const content = codeElement.textContent;
            const fileName = pathElement.textContent.split('/').pop() || 'source-code.txt';
            
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            console.log(`💾 Downloaded: ${fileName}`);
        }
    }
    
    // Column Picker Modal Functionality
    class ColumnPickerManager {
        constructor() {
            this.setupColumnPickerHandlers();
        }
        
        setupColumnPickerHandlers() {
            // Column checkboxes
            document.querySelectorAll('.column-option input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const column = e.target.dataset.column;
                    const isVisible = e.target.checked;
                    this.toggleColumn(column, isVisible);
                });
            });
            
            // Reset columns button
            const resetBtn = document.getElementById('reset-columns-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetColumns();
                });
            }
            
            // Apply columns button
            const applyBtn = document.getElementById('apply-columns-btn');
            if (applyBtn) {
                applyBtn.addEventListener('click', () => {
                    this.applyColumnChanges();
                });
            }
            
            console.log('⚙️ Column picker handlers initialized');
        }
        
        toggleColumn(column, isVisible) {
            const table = document.getElementById('gaps-table');
            if (!table) return;
            
            const headers = table.querySelectorAll(`th.col-${column}`);
            const cells = table.querySelectorAll(`td.col-${column}`);
            
            headers.forEach(header => {
                header.style.display = isVisible ? '' : 'none';
            });
            
            cells.forEach(cell => {
                cell.style.display = isVisible ? '' : 'none';
            });
            
            console.log(`⚙️ Column ${column} ${isVisible ? 'shown' : 'hidden'}`);
        }
        
        resetColumns() {
            // Reset all checkboxes to default state
            document.querySelectorAll('.column-option input[type="checkbox"]').forEach(checkbox => {
                const isEssential = checkbox.disabled;
                checkbox.checked = isEssential || checkbox.dataset.defaultVisible === 'true';
                
                const column = checkbox.dataset.column;
                this.toggleColumn(column, checkbox.checked);
            });
            
            console.log('🔄 Columns reset to default');
        }
        
        applyColumnChanges() {
            // Save column visibility state
            const columnState = {};
            document.querySelectorAll('.column-option input[type="checkbox"]').forEach(checkbox => {
                const column = checkbox.dataset.column;
                columnState[column] = checkbox.checked;
            });
            
            localStorage.setItem('docs-coverage-column-state', JSON.stringify(columnState));
            
            // Close modal
            const modal = document.getElementById('column-picker-modal');
            if (modal) {
                window.modalManager.closeModal(modal);
            }
            
            console.log('✅ Column changes applied');
        }
    }
    """


def get_modal_styles_js() -> str:
    """Generate JavaScript for modal styling and animations."""
    return """
    // Modal Animation and Styling Manager
    class ModalStyleManager {
        constructor() {
            this.setupModalAnimations();
        }
        
        setupModalAnimations() {
            // Add CSS classes for modal animations
            const style = document.createElement('style');
            style.textContent = `
                .modal {
                    transition: opacity 0.3s ease-out, visibility 0.3s ease-out;
                }
                
                .modal.show {
                    opacity: 1;
                    visibility: visible;
                }
                
                .modal-content {
                    transition: transform 0.3s ease-out;
                }
                
                .modal.show .modal-content {
                    transform: scale(1);
                }
                
                .btn.success {
                    background-color: var(--color-success);
                    border-color: var(--color-success);
                    color: white;
                }
                
                .btn.error {
                    background-color: var(--color-error);
                    border-color: var(--color-error);
                    color: white;
                }
            `;
            document.head.appendChild(style);
            
            console.log('🎨 Modal animations initialized');
        }
    }
    """


# Export the JavaScript generator functions
__all__ = [
    'get_modal_manager_js',
    'get_modal_styles_js'
] 