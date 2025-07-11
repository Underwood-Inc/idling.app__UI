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
        except (ImportError, FileNotFoundError) as e:
            # No fallback CSS - fail fast if external CSS is missing
            print(f"❌ Failed to load modals.css: {e}")
            return "/* Modal CSS file not found - check styles/modals.css */"


# Export the generator class
__all__ = ['HtmlDocumentGenerator'] 