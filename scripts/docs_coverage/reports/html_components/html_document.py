#!/usr/bin/env python3
"""
HTML Document Structure for Documentation Coverage Report

Provides the main HTML document template and structure.
"""

from typing import Dict, Any
from .styles import get_css_styles
from .table_styles import get_table_styles
try:
    from .js_main import get_complete_javascript
except ImportError:
    from .javascript import get_javascript
    get_complete_javascript = get_javascript


class HtmlDocumentGenerator:
    """Generates the main HTML document structure."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
    
    def generate_document_template(self, content: str) -> str:
        """Generate the complete HTML document with given content."""
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation Coverage Report - Idling.app</title>
    <!-- Highlight.js CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/vs2015.min.css">
    <style>
        {get_css_styles()}
        {get_table_styles()}
        {self._get_modal_styles()}
        {self._get_additional_styles()}
    </style>
</head>
<body>
    <div class="theme-toggle">
        <button id="theme-toggle-btn" class="theme-toggle-btn" aria-label="Toggle theme">
            <span class="theme-icon light-icon">☀️</span>
            <span class="theme-icon dark-icon">🌙</span>
        </button>
    </div>
    
    <div class="container">
        {content}
    </div>
    
    {self._generate_modals()}
    {self._generate_tooltip_templates()}
    
    <!-- Highlight.js JavaScript -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/languages/typescript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/languages/javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/languages/python.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/languages/css.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/languages/json.min.js"></script>
    <script>
        {get_complete_javascript()}
    </script>
</body>
</html>"""
    
    def _generate_modals(self) -> str:
        """Generate modal dialogs for the document."""
        return """
    <!-- Source Code Modal -->
    <div id="source-code-modal" class="modal source-modal">
        <div class="modal-content source-modal-content">
            <div class="modal-header">
                <h3 id="source-modal-title">📄 Source Code Preview</h3>
                <div class="modal-header-actions">
                    <button id="open-github-btn" class="btn-secondary" title="Open on GitHub">
                        <span class="btn-icon">🔗</span>
                        <span class="btn-text">GitHub</span>
                    </button>
                    <button class="modal-close">&times;</button>
                </div>
            </div>
            <div class="modal-body source-modal-body">
                <div id="source-loading" class="source-loading">
                    <div class="loading-spinner"></div>
                    <p>Loading source code...</p>
                </div>
                <div id="source-error" class="source-error" style="display: none;">
                    <p>❌ Could not load source code</p>
                    <p id="source-error-message"></p>
                </div>
                <pre id="source-code-content" class="source-code" style="display: none;"><code id="source-code-text"></code></pre>
            </div>
        </div>
    </div>
    
    <!-- Column Picker Modal -->
    <div id="column-picker-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>🎛️ Column Visibility</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p>Select which columns to display in the table:</p>
                <div class="column-picker">
                    <!-- Column picker content will be inserted here -->
                </div>
            </div>
            <div class="modal-footer">
                <button id="reset-columns-btn" class="btn-secondary">Reset to Default</button>
                <button id="apply-columns-btn" class="btn-primary">Apply Changes</button>
            </div>
        </div>
    </div>
    
    <!-- Help Modal -->
    <div id="help-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>❓ Help & Keyboard Shortcuts</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="help-section">
                    <h4>🔍 Search & Filtering</h4>
                    <ul>
                        <li>Use the search box to find specific files or issues</li>
                        <li>Click filter tags to show only items of that type</li>
                        <li>Use priority filters to focus on critical issues</li>
                    </ul>
                </div>
                <div class="help-section">
                    <h4>⌨️ Keyboard Shortcuts</h4>
                    <ul>
                        <li><kbd>Ctrl+F</kbd> - Focus search box</li>
                        <li><kbd>Ctrl+K</kbd> - Open column picker</li>
                        <li><kbd>Ctrl+Shift+D</kbd> - Toggle theme</li>
                        <li><kbd>F1</kbd> - Show this help</li>
                        <li><kbd>Escape</kbd> - Close modals</li>
                    </ul>
                </div>
                <div class="help-section">
                    <h4>📊 Table Features</h4>
                    <ul>
                        <li>Click column headers to sort</li>
                        <li>Hold <kbd>Shift</kbd> + click for multi-column sorting</li>
                        <li>Click rows to view source code</li>
                        <li>Click file names to open in GitHub</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
        """
    
    def _generate_tooltip_templates(self) -> str:
        """Generate tooltip templates for the document."""
        return """
    <!-- Timestamp Tooltip Template -->
    <div id="timestamp-tooltip" class="timestamp-tooltip" style="display: none;">
        <div class="tooltip-header">
            <h4>🕒 Exact Time</h4>
            <div class="tooltip-relative-time"></div>
        </div>
        <div class="tooltip-section">
            <div class="tooltip-label">UTC Time</div>
            <div class="tooltip-utc-time"></div>
        </div>
        <div class="tooltip-section">
            <div class="tooltip-label">Your Local Time</div>
            <div class="tooltip-local-time"></div>
        </div>
    </div>
        """
    
    def _get_modal_styles(self) -> str:
        """Get CSS styles for modal functionality."""
        try:
            from .template_loader import TemplateLoader
            loader = TemplateLoader()
            return loader.load_style('modals.css')
        except (ImportError, FileNotFoundError):
            # Fallback modal styles
            return """
            /* Modal Styles */
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.8);
                z-index: 9999;
                backdrop-filter: blur(4px);
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .modal.show {
                display: flex !important;
                opacity: 1;
            }
            
            .modal-content {
                background: var(--bg-secondary);
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                border: 1px solid var(--border-color);
                width: 90vw;
                height: 80vh;
                max-width: 1200px;
                max-height: 800px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            
            .modal.show .modal-content {
                transform: scale(1);
            }
            
            .source-modal .modal-content {
                width: 95vw;
                height: 95vh;
                max-height: none;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem 1.5rem;
                border-bottom: 1px solid var(--border-color);
                background: linear-gradient(135deg, #f4d03f, #f7dc6f);
                color: #000;
                flex-shrink: 0;
            }
            
            .modal-header h3 {
                margin: 0;
                font-size: 1.1rem;
                font-weight: 600;
                flex: 1;
            }
            
            .modal-header-actions {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }
            
            #open-github-btn {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                padding: 0.4rem 0.8rem;
                color: #000;
                font-weight: 500;
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.2s ease;
                display: inline-flex;
                align-items: center;
                gap: 0.4rem;
            }
            
            #open-github-btn:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-1px);
            }
            
            .modal-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #000;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s ease;
            }
            
            .modal-close:hover {
                background: rgba(0, 0, 0, 0.1);
            }
            
            .modal-body {
                flex: 1;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                min-height: 0;
                padding: 1.5rem;
            }
            
            .source-modal-body {
                padding: 0;
                height: 100%;
            }
            
            .source-code {
                flex: 1;
                margin: 0;
                padding: 1rem;
                overflow: auto;
                background: var(--bg-primary);
                font-family: 'Consolas', 'Monaco', 'Ubuntu Mono', 'Courier New', monospace;
                font-size: 0.9rem;
                line-height: 1.4;
                border: none;
                color: var(--text-primary);
                white-space: pre;
                height: 100%;
                min-height: 0;
            }
            
            .source-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 3rem;
                color: var(--text-secondary);
                height: 100%;
            }
            
            .source-error {
                text-align: center;
                padding: 3rem;
                color: var(--status-error);
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            
            .loading-spinner {
                border: 3px solid var(--border-color);
                border-top: 3px solid var(--brand-primary);
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Syntax Highlighting */
            .hljs-keyword, .hljs-built_in, .hljs-type {
                color: #569cd6;
                font-weight: 500;
            }
            
            .hljs-string, .hljs-template-string {
                color: #ce9178;
            }
            
            .hljs-comment {
                color: #6a9955;
                font-style: italic;
            }
            
            .hljs-number {
                color: #b5cea8;
            }
            
            .hljs-class, .hljs-title {
                color: #4ec9b0;
                font-weight: 500;
            }
            
            .hljs-variable, .hljs-property {
                color: #9cdcfe;
            }
            
            .hljs-function .hljs-title {
                color: #dcdcaa;
                font-weight: 500;
            }
            
            .hljs-tag {
                color: #569cd6;
            }
            
            .hljs-name {
                color: #4ec9b0;
            }
            
            .hljs-attr {
                color: #92c5f7;
            }
            
            .hljs-value {
                color: #ce9178;
            }
            
            .hljs-punctuation {
                color: #d4d4d4;
            }
            
            .hljs-operator {
                color: #d4d4d4;
            }
            
            .hljs-literal, .hljs-boolean {
                color: #569cd6;
            }
            """
    
    def _get_additional_styles(self) -> str:
        """Get additional CSS styles for components not in main style files."""
        return """
        /* Additional Component Styles */
        
        /* Filtering Styles */
        .clickable-card {
            cursor: pointer;
            transition: all var(--transition-normal);
        }
        
        .clickable-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 8px 25px rgba(237, 174, 73, 0.3);
            border-color: var(--brand-primary);
        }
        
        .clickable-card:active {
            transform: translateY(-2px);
        }
        
        .filter-controls {
            background: var(--bg-tertiary);
            border-radius: var(--radius-lg);
            padding: var(--spacing-lg);
            margin-bottom: var(--spacing-lg);
            border: 1px solid var(--border-color);
        }
        
        .search-container {
            margin-bottom: var(--spacing-md);
        }
        
        .search-input {
            width: 100%;
            padding: var(--spacing-sm) var(--spacing-md);
            border: 2px solid var(--border-color);
            border-radius: var(--radius-md);
            background: var(--card-bg);
            color: var(--text-primary);
            font-size: var(--font-size-base);
            transition: all var(--transition-normal);
        }
        
        .search-input:focus {
            outline: none;
            border-color: var(--brand-primary);
            box-shadow: 0 0 0 3px rgba(237, 174, 73, 0.1);
        }
        
        .filter-tags {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-sm);
            margin-bottom: var(--spacing-md);
        }
        
        .filter-tag {
            background: var(--card-bg);
            color: var(--text-secondary);
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--radius-sm);
            font-size: var(--font-size-sm);
            cursor: pointer;
            transition: all var(--transition-normal);
            border: 1px solid var(--border-color);
        }
        
        .filter-tag:hover {
            background: var(--bg-hover);
            border-color: var(--brand-primary);
        }
        
        .filter-tag.active {
            background: var(--brand-primary);
            color: var(--text-on-primary);
            border-color: var(--brand-primary);
        }
        
        /* Loading Spinner */
        .loading-spinner {
            border: 3px solid var(--border-color);
            border-top: 3px solid var(--brand-primary);
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto var(--spacing-sm);
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Source Code Styles */
        .source-loading {
            text-align: center;
            padding: var(--spacing-xl);
            color: var(--text-secondary);
        }
        
        .source-error {
            text-align: center;
            padding: var(--spacing-xl);
            color: var(--status-error);
        }
        
        .source-code {
            background: transparent;
            border: none;
            padding: 1rem;
            overflow: auto;
            height: 100%;
            min-height: 0;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: var(--font-size-sm);
            line-height: 1.1;
            display: flex;
            flex-direction: column;
            flex: 1;
        }
        
        .source-code code {
            flex: 1;
            display: block;
            height: 100%;
            min-height: 0;
        }
        
        /* Ensure hljs elements fill space */
        .hljs-code-preview {
            height: 100%;
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: auto;
        }
        
        .hljs-lines {
            flex: 1;
            height: 100%;
            min-height: 0;
        }
        
        /* Ensure modal content fills height properly */
        .source-modal .modal-content {
            height: 90vh;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
        }
        
        .source-modal-content {
            height: 100%;
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .source-modal-body {
            flex: 1;
            height: 100%;
            min-height: 0;
            display: flex;
            flex-direction: column;
        }
        
        /* Enhanced Modal Button Styling */
        .modal-header-actions .btn-secondary {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            padding: 0.5rem 1rem;
            color: #000;
            font-weight: 500;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .modal-header-actions .btn-secondary:hover {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2));
            border-color: rgba(255, 255, 255, 0.5);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .modal-header-actions .btn-secondary:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        /* Help Modal Styles */
        .help-section {
            margin-bottom: var(--spacing-lg);
        }
        
        .help-section h4 {
            color: var(--text-primary);
            margin-bottom: var(--spacing-sm);
            font-size: var(--font-size-md);
        }
        
        .help-section ul {
            list-style: none;
            padding: 0;
        }
        
        .help-section li {
            padding: var(--spacing-xs) 0;
            color: var(--text-secondary);
            line-height: 1.4;
        }
        
        .help-section kbd {
            background: var(--bg-tertiary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-xs);
            padding: 2px 6px;
            font-size: var(--font-size-xs);
            font-family: monospace;
            color: var(--text-primary);
        }
        
        /* Tooltip Styles */
        .timestamp-tooltip {
            position: absolute;
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: var(--spacing-sm);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            max-width: 300px;
            font-size: var(--font-size-sm);
            opacity: 0;
            transition: opacity 0.2s ease;
        }
        
        .tooltip-header {
            border-bottom: 1px solid var(--border-color);
            padding-bottom: var(--spacing-xs);
            margin-bottom: var(--spacing-xs);
        }
        
        .tooltip-header h4 {
            margin: 0;
            color: var(--text-primary);
            font-size: var(--font-size-sm);
        }
        
        .tooltip-relative-time {
            color: var(--text-secondary);
            font-size: var(--font-size-xs);
        }
        
        .tooltip-section {
            margin-bottom: var(--spacing-xs);
        }
        
        .tooltip-label {
            font-weight: 600;
            color: var(--text-primary);
            font-size: var(--font-size-xs);
        }
        
        .tooltip-utc-time,
        .tooltip-local-time {
            color: var(--text-secondary);
            font-family: monospace;
            font-size: var(--font-size-xs);
        }
        """


# Export the generator class
__all__ = ['HtmlDocumentGenerator'] 