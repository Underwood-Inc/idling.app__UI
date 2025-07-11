/**
 * Source Code Modal Component
 * Handles source code display and modal interactions
 */

import { applySyntaxHighlighting } from '../utils/syntax-highlighting.js';

// Function to extend ModalManager with source code modal methods
function extendModalManagerWithSourceCode() {
    if (typeof ModalManager === 'undefined') {
        console.error('ModalManager is not defined');
        return;
    }
    
    ModalManager.prototype.showSourceCodeModal = function(row) {
        if (this.isDestroyed) { return; }
        
        const filePath = row.dataset.filePath || row.dataset.fileName;
        const fileName = row.dataset.fileName || filePath?.split('/').pop() || 'Unknown File';
        const githubUrl = row.dataset.githubUrl;
        
        if (!filePath) {
            console.warn('No file path found for row');
            return;
        }
        
        this.currentFilePath = filePath;
        console.log(`📄 Opening source code modal for: ${fileName}`);
        
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
        
        if (title) {
            title.textContent = `📄 ${fileName}`;
        }
        
        if (githubBtn && githubUrl) {
            githubBtn.dataset.githubUrl = githubUrl;
            githubBtn.style.display = 'inline-flex';
        } else if (githubBtn) {
            githubBtn.style.display = 'none';
        }
        
        this.showModal(modal);
        this.showLoadingState(loading, error, content);
        
        setTimeout(() => {
            this.loadAndDisplaySourceCode(filePath, loading, error, content, codeText);
        }, 100);
    };

    ModalManager.prototype.loadAndDisplaySourceCode = function(filePath, loading, error, content, codeText) {
        const fileInfo = this.fileMetadata[filePath];
        
        if (fileInfo && fileInfo.content_base64) {
            try {
                // Decode base64 content back to normal text
                const decodedContent = atob(fileInfo.content_base64);
                // Load the source code directly from embedded data
                this.displaySourceCode(decodedContent, fileInfo.language, loading, error, content, codeText);
            } catch (e) {
                console.error('Failed to decode base64 content:', e);
                this.displaySourceCodeError('Failed to decode source code', loading, error, content);
            }
        } else {
            // Fallback if no content is available
            this.displaySourceCodeError('Source code not available', loading, error, content);
        }
    };

    ModalManager.prototype.displaySourceCode = function(sourceContent, language, loading, error, content, codeText) {
        if (!content || !codeText) { return; }
        
        if (loading) { loading.style.display = 'none'; }
        if (error) { error.style.display = 'none'; }
        content.style.display = 'block';
        
        codeText.innerHTML = '';
        codeText.className = '';
        codeText.textContent = sourceContent;
        
        applySyntaxHighlighting(codeText, language);
        
        console.log('📄 Source code displayed successfully');
    };

    ModalManager.prototype.displaySourceCodeError = function(message, loading, error, content) {
        if (loading) { loading.style.display = 'none'; }
        if (content) { content.style.display = 'none'; }
        
        if (error) {
            error.style.display = 'flex';
            error.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">📂</div>
                    <h3 style="margin: 0 0 1rem 0;">Source Code Viewer</h3>
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
    };
    
    console.log('🔧 Modal manager extended with source code functionality');
}

// Call the extension function if this file is loaded
if (typeof window !== 'undefined') {
    extendModalManagerWithSourceCode();
} 