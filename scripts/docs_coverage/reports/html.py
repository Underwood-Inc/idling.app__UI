#!/usr/bin/env python3
"""
HTML Report Generator for Documentation Coverage Analysis

This is now a lightweight wrapper around the refactored modular HTML reporter.
The actual implementation has been split into multiple smaller files.
"""

from pathlib import Path
from typing import Dict, List, Any, Optional
from ..models import CoverageReport, DocumentationGap
from ..config import ConfigManager
import html

class HtmlReporter:
    """
    HTML Report Generator - Refactored Version
    
    This class now uses a modular architecture with components split
    into smaller, maintainable files under html_components/.
    """
    
    def __init__(self, config_manager: ConfigManager, enable_syntax_highlighting: bool = True):
        """Initialize the HTML reporter.
        
        Args:
            config_manager: Configuration manager instance
            enable_syntax_highlighting: Whether to enable syntax highlighting (slower but prettier)
        """
        self.config_manager = config_manager
        self.config = config_manager.config
        self.output_file = Path("documentation-coverage-report.html")
        self.enable_syntax_highlighting = enable_syntax_highlighting
        
    def set_output_file(self, output_file: str) -> None:
        """Set custom output filename."""
        self.output_file = Path(output_file)
        
    def generate(self, report: CoverageReport) -> str:
        """Generate the complete HTML report using modular components."""
        html_content = self._build_html_document(report)
        
        # Write to file
        self.output_file.write_text(html_content, encoding='utf-8')
        
        # Return console summary
        return self._generate_console_summary(report)
    
    def _build_html_document(self, report: CoverageReport) -> str:
        """Build the complete HTML document with all components."""
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation Coverage Report - Idling.app</title>
    <style>
        {self._get_css_styles()}
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
        {self._generate_header(report)}
        {self._generate_overview_cards(report)}
        {self._generate_quality_metrics(report)}
        {self._generate_priority_breakdown(report)}
        {self._generate_gaps_analysis(report)}
        {self._generate_recommendations(report)}
        {self._generate_footer(report)}
    </div>
    
    {self._get_modals()}
    
    <script>
        {self._get_javascript()}
    </script>
</body>
</html>"""
    
    def _get_css_styles(self) -> str:
        """Generate CSS styles with product colors and theme support."""
        return """
        /* CSS Custom Properties - Idling.app Design System */
        :root {
            /* Brand Colors - Primary Palette */
            --brand-primary: #edae49;
            --brand-primary-dark: #c68214;
            --brand-primary-light: #f9df74;
            --brand-secondary: #f9df74;
            --brand-secondary-dark: #f5c60c;
            --brand-tertiary: #f9edcc;
            --brand-quaternary: #ea2b1f;
            --brand-quinary: #61210f;
            
            /* Semantic Colors */
            --color-success: #22c55e;
            --color-warning: #f59e0b;
            --color-error: #ef4444;
            --color-info: #3b82f6;
            
            /* Light Theme Colors */
            --light-bg-primary: #fff8e1;
            --light-bg-secondary: #ffe4b5;
            --light-bg-tertiary: #ffdab9;
            --light-text-primary: #2a150d;
            --light-text-secondary: #8b4513;
            --light-border: #e2e8f0;
            --light-file-path: #4a5568;
            --light-file-directory: #718096;
            --light-hover-bg: #f7fafc;
            
            /* Dark Theme Colors */
            --dark-bg-primary: #1a1611;
            --dark-bg-secondary: #252017;
            --dark-bg-tertiary: #2f2a1d;
            --dark-text-primary: #ffffff;
            --dark-text-secondary: #fff8e1;
            --dark-border: #4a5568;
            --dark-file-path: #e2e8f0;
            --dark-file-directory: #a0aec0;
            --dark-hover-bg: #2d3748;
            
            /* Theme Variables - Default Light */
            --bg-primary: var(--light-bg-primary);
            --bg-secondary: var(--light-bg-secondary);
            --bg-tertiary: var(--light-bg-tertiary);
            --text-primary: var(--light-text-primary);
            --text-secondary: var(--light-text-secondary);
            --border-color: var(--light-border);
            --file-path-color: var(--light-file-path);
            --file-directory-color: var(--light-file-directory);
            --hover-bg: var(--light-hover-bg);
            --card-bg: var(--light-bg-secondary);
            --code-bg: var(--light-bg-tertiary);
            --code-text: var(--light-text-primary);
            
            /* Typography */
            --font-family: 'Fira Code', 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', monospace;
            --font-mono: 'Fira Code', 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', monospace;
            --font-size-xs: 0.75rem;
            --font-size-sm: 0.875rem;
            --font-size-base: 1rem;
            --font-size-lg: 1.125rem;
            --font-size-xl: 1.25rem;
            --font-size-2xl: 1.5rem;
            --font-size-3xl: 1.875rem;
            
            /* Spacing */
            --spacing-xs: 0.25rem;
            --spacing-sm: 0.5rem;
            --spacing-md: 1rem;
            --spacing-lg: 1.5rem;
            --spacing-xl: 2rem;
            --spacing-2xl: 3rem;
            
            /* Border Radius */
            --radius-sm: 0.25rem;
            --radius-md: 0.5rem;
            --radius-lg: 0.75rem;
            --radius-xl: 1rem;
            
            /* Shadows */
            --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
            --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
            --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
            
            /* Transitions */
            --transition-fast: 0.15s ease-out;
            --transition-normal: 0.3s ease-out;
            --transition-slow: 0.5s ease-out;
        }
        
        /* Dark Theme */
        [data-theme="dark"] {
            --bg-primary: var(--dark-bg-primary);
            --bg-secondary: var(--dark-bg-secondary);
            --bg-tertiary: var(--dark-bg-tertiary);
            --text-primary: var(--dark-text-primary);
            --text-secondary: var(--dark-text-secondary);
            --border-color: var(--dark-border);
            --file-path-color: var(--dark-file-path);
            --file-directory-color: var(--dark-file-directory);
            --hover-bg: var(--dark-hover-bg);
            --card-bg: var(--dark-bg-secondary);
            --code-bg: var(--dark-bg-tertiary);
            --code-text: var(--dark-text-primary);
        }
        
        /* Auto Theme Detection */
        @media (prefers-color-scheme: dark) {
            :root:not([data-theme="light"]) {
                --bg-primary: var(--dark-bg-primary);
                --bg-secondary: var(--dark-bg-secondary);
                --bg-tertiary: var(--dark-bg-tertiary);
                --text-primary: var(--dark-text-primary);
                --text-secondary: var(--dark-text-secondary);
                --border-color: var(--dark-border);
                --file-path-color: var(--dark-file-path);
                --file-directory-color: var(--dark-file-directory);
                --hover-bg: var(--dark-hover-bg);
                --card-bg: var(--dark-bg-secondary);
                --code-bg: var(--dark-bg-tertiary);
                --code-text: var(--dark-text-primary);
            }
        }
        
        /* Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: var(--font-family);
            font-size: var(--font-size-base);
            line-height: 1.6;
            color: var(--text-primary);
            background-color: var(--bg-primary);
            transition: background-color var(--transition-normal), color var(--transition-normal);
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: var(--spacing-xl);
        }
        
        /* Theme Toggle */
        .theme-toggle {
            position: fixed;
            top: var(--spacing-lg);
            right: var(--spacing-lg);
            z-index: 1000;
        }
        
        .theme-toggle-btn {
            background: var(--bg-secondary);
            border: 2px solid var(--border-color);
            border-radius: var(--radius-xl);
            padding: var(--spacing-sm);
            cursor: pointer;
            transition: all var(--transition-normal);
            box-shadow: var(--shadow-md);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }
        
        .theme-toggle-btn:hover {
            background: var(--brand-primary);
            border-color: var(--brand-primary);
            transform: scale(1.05);
        }
        
        .theme-icon {
            font-size: var(--font-size-lg);
            display: inline-block;
            transition: opacity var(--transition-fast);
        }
        
        [data-theme="dark"] .light-icon,
        :root:not([data-theme="light"]) .light-icon {
            opacity: 0;
        }
        
        [data-theme="dark"] .dark-icon,
        :root:not([data-theme="light"]) .dark-icon {
            opacity: 1;
        }
        
        [data-theme="light"] .light-icon {
            opacity: 1;
        }
        
        [data-theme="light"] .dark-icon {
            opacity: 0;
        }
        
        @media (prefers-color-scheme: dark) {
            .light-icon { opacity: 0; }
            .dark-icon { opacity: 1; }
        }
        
        /* Header */
        .header {
            text-align: center;
            margin-bottom: var(--spacing-2xl);
            padding: var(--spacing-xl);
            background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
            color: white;
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-lg);
        }
        
        .header h1 {
            font-size: var(--font-size-3xl);
            font-weight: 700;
            margin-bottom: var(--spacing-sm);
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .header p {
            font-size: var(--font-size-lg);
            opacity: 0.9;
        }
        
        /* Cards */
        .card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            padding: var(--spacing-lg);
            margin-bottom: var(--spacing-lg);
            box-shadow: var(--shadow-md);
            transition: all var(--transition-normal);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }
        
        .card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }
        
        .card h2 {
            color: var(--brand-primary);
            font-size: var(--font-size-xl);
            margin-bottom: var(--spacing-md);
            font-weight: 600;
        }
        
        .card h3 {
            color: var(--text-primary);
            font-size: var(--font-size-lg);
            margin-bottom: var(--spacing-sm);
            font-weight: 500;
        }
        
        /* Overview Cards Grid */
        .overview-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: var(--spacing-lg);
            margin-bottom: var(--spacing-xl);
        }
        
        .metric-card {
            background: var(--card-bg);
            padding: var(--spacing-lg);
            border-radius: var(--radius-lg);
            text-align: center;
            border: 1px solid var(--border-color);
            transition: all var(--transition-normal);
            position: relative;
            overflow: hidden;
        }
        
        .metric-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary));
        }
        
        .metric-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-xl);
        }
        
        /* Enhanced Clickable Cards */
        .clickable-card {
            cursor: pointer;
            transition: all var(--transition-fast);
            position: relative;
            border: 2px solid transparent;
        }
        
        .clickable-card::after {
            content: '👆';
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            font-size: 0.75rem;
            opacity: 0;
            transition: opacity var(--transition-fast);
            z-index: 1;
        }
        
        .clickable-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 12px 32px rgba(237, 174, 73, 0.3);
            border-color: var(--brand-primary);
        }
        
        .clickable-card:hover::after {
            opacity: 0.8;
        }
        
        .clickable-card:active {
            transform: translateY(-2px);
            transition-duration: 0.1s;
        }
        
        .metric-value {
            font-size: var(--font-size-2xl);
            font-weight: 700;
            color: var(--brand-primary);
            margin-bottom: var(--spacing-xs);
        }
        
        .metric-label {
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Progress Bars */
        .progress-bar {
            width: 100%;
            height: 8px;
            background: var(--bg-tertiary);
            border-radius: var(--radius-sm);
            overflow: hidden;
            margin: var(--spacing-sm) 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary));
            transition: width var(--transition-slow);
            border-radius: var(--radius-sm);
        }
        
        /* Quality Indicators */
        .quality-excellent { color: var(--color-success); }
        .quality-good { color: var(--brand-primary); }
        .quality-fair { color: var(--color-warning); }
        .quality-poor { color: var(--color-error); }
        
                 /* Highlight.js Theme - Custom Golden Theme for Idling.app */
         .hljs-code-preview {
             background: transparent;
             color: var(--code-text);
             font-family: var(--font-mono);
             font-size: var(--font-size-sm);
             line-height: 1.1;
            overflow-x: auto;
         }
         
         .hljs-lines {
             display: block;
             white-space: pre;
             margin: 0;
             padding: 0;
             line-height: 1.1;
         }
         
         .line-wrapper {
             display: block;
             min-height: 1.1em;
             line-height: 1.1;
             margin: 0;
             padding: 0;
         }
         
         .line-number {
             display: inline-block;
             width: 3em;
             color: var(--text-secondary);
             opacity: 0.7;
             text-align: right;
             margin-right: var(--spacing-sm);
             user-select: none;
             font-weight: 400;
             line-height: 1.1;
             vertical-align: top;
         }
         
         .line-content {
             display: inline;
             color: var(--code-text);
             line-height: 1.1;
             vertical-align: top;
         }
         
         /* Ensure tight line height for all code elements */
         .hljs-code-preview * {
             line-height: 1.1 !important;
         }
         
         .hljs-code-preview pre {
             line-height: 1.1;
             margin: 0;
             padding: 0;
         }
         
         .hljs-code-preview code {
             line-height: 1.1;
             margin: 0;
             padding: 0;
         }
        
        /* Highlight.js Syntax Colors - Golden Theme */
        .hljs-keyword {
            color: var(--brand-primary);
            font-weight: 600;
        }
        
        .hljs-string {
            color: #22c55e;
        }
        
        .hljs-number {
            color: #f59e0b;
        }
        
        .hljs-comment {
            color: var(--text-secondary);
            font-style: italic;
            opacity: 0.8;
        }
        
        .hljs-function,
        .hljs-title.function_ {
            color: #3b82f6;
            font-weight: 500;
        }
        
        .hljs-variable {
            color: var(--text-primary);
        }
        
        .hljs-variable.language_ {
            color: #8b5cf6;
            font-weight: 500;
        }
        
        .hljs-title.class_ {
            color: #f59e0b;
            font-weight: 600;
        }
        
        .hljs-title.class_.inherited__ {
            color: #f59e0b;
            opacity: 0.8;
        }
        
        .hljs-property {
            color: #06b6d4;
        }
        
        .hljs-attr {
            color: #06b6d4;
        }
        
        .hljs-built_in {
            color: #8b5cf6;
            font-weight: 500;
        }
        
        .hljs-literal {
            color: #f59e0b;
        }
        
        .hljs-operator {
            color: var(--brand-primary);
        }
        
        .hljs-punctuation {
            color: var(--text-primary);
        }
        
        .hljs-tag {
            color: #ef4444;
        }
        
        .hljs-name {
            color: #ef4444;
            font-weight: 500;
        }
        
        .hljs-params {
            color: var(--text-primary);
        }
        
        .hljs-meta {
            color: var(--text-secondary);
        }
        
        /* JSX/TSX specific highlighting */
        .language-xml .hljs-tag {
            color: #ef4444;
        }
        
        .language-xml .hljs-name {
            color: #ef4444;
            font-weight: 500;
        }
        
        .language-xml .hljs-attr {
            color: #06b6d4;
        }
        
        .language-xml .hljs-string {
            color: #22c55e;
        }
        
        /* Dark theme adjustments for syntax highlighting */
        [data-theme="dark"] .hljs-keyword {
            color: var(--brand-secondary);
        }
        
        [data-theme="dark"] .hljs-string {
            color: #4ade80;
        }
        
        [data-theme="dark"] .hljs-number {
            color: #fbbf24;
        }
        
        [data-theme="dark"] .hljs-comment {
            color: var(--dark-text-secondary);
            opacity: 0.7;
        }
        
        [data-theme="dark"] .hljs-function,
        [data-theme="dark"] .hljs-title.function_ {
            color: #60a5fa;
        }
        
        [data-theme="dark"] .hljs-variable.language_ {
            color: #a78bfa;
        }
        
        [data-theme="dark"] .hljs-title.class_ {
            color: #fbbf24;
        }
        
        [data-theme="dark"] .hljs-property,
        [data-theme="dark"] .hljs-attr {
            color: #22d3ee;
        }
        
        [data-theme="dark"] .hljs-built_in {
            color: #a78bfa;
        }
        
        [data-theme="dark"] .hljs-literal {
            color: #fbbf24;
        }
        
        [data-theme="dark"] .hljs-operator {
            color: var(--brand-secondary);
        }
        
                 [data-theme="dark"] .hljs-tag,
         [data-theme="dark"] .hljs-name {
             color: #f87171;
        }
        
        /* Advanced Table Styles */
        .advanced-table-container {
            max-height: 600px;
            overflow-y: auto;
            overflow-x: auto;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            background: var(--card-bg);
            box-shadow: var(--shadow-sm);
            position: relative;
        }

         /* Modal Styles - Source Code Modal Height Fix */
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
        
        /* Enhanced GitHub Button Styling */
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

        /* Enhanced Custom Scrollbars - Idling.app Golden Theme */
        .advanced-table-container::-webkit-scrollbar {
             width: 14px;
             height: 14px;
        }

        .advanced-table-container::-webkit-scrollbar-track {
             background: var(--bg-secondary);
             border-radius: 8px;
             margin: 6px;
             border: 1px solid var(--border-color);
        }

        .advanced-table-container::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
             border-radius: 8px;
             border: 2px solid var(--bg-secondary);
             transition: all 0.3s ease;
             box-shadow: 0 2px 4px rgba(237, 174, 73, 0.2);
        }

        .advanced-table-container::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, var(--brand-secondary), var(--brand-primary));
             box-shadow: 0 4px 8px rgba(237, 174, 73, 0.4);
             transform: scale(1.05);
         }

         .advanced-table-container::-webkit-scrollbar-thumb:active {
             background: linear-gradient(135deg, var(--brand-primary-dark), var(--brand-primary));
             box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .advanced-table-container::-webkit-scrollbar-corner {
             background: var(--bg-secondary);
             border-radius: 8px;
        }

         /* Firefox Enhanced Scrollbars */
        .advanced-table-container {
             scrollbar-width: auto;
             scrollbar-color: var(--brand-primary) var(--bg-secondary);
        }

        /* Table Styling */
        .advanced-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            background: var(--card-bg);
             min-width: 1200px;
        }

        .advanced-table th,
        .advanced-table td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
            position: relative;
             vertical-align: top;
        }

        .advanced-table th {
            background: var(--bg-secondary);
            font-weight: 600;
            color: var(--text-primary);
            position: sticky;
            top: 0;
            z-index: 10;
            user-select: none;
            white-space: nowrap;
             border-bottom: 2px solid var(--border-color);
        }

        .advanced-table tbody tr:hover {
            background: var(--hover-bg);
            cursor: pointer;
        }

        .advanced-table tbody tr.clickable-row:hover {
            background: linear-gradient(135deg, var(--hover-bg), rgba(237, 174, 73, 0.05));
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(237, 174, 73, 0.1);
        }

         /* Enhanced File Path Styling with Better Contrast */
        .file-path-container {
            display: flex;
            align-items: center;
            gap: 0;
            font-family: var(--font-mono);
            font-size: 13px;
             line-height: 1.4;
             word-break: break-word;
             overflow-wrap: break-word;
             max-width: 100%;
        }

        .file-directory {
             color: var(--file-directory-color);
             opacity: 0.8;
             font-weight: 400;
        }

        .file-name {
             color: var(--file-path-color);
             font-weight: 600;
             text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .clickable-filename {
            cursor: pointer;
            color: var(--brand-primary);
            text-decoration: underline;
            text-decoration-style: dotted;
            text-underline-offset: 2px;
            transition: all 0.2s ease;
             font-weight: 600;
        }

        .clickable-filename:hover {
            color: var(--brand-secondary);
            text-decoration-style: solid;
            text-shadow: 0 0 4px rgba(237, 174, 73, 0.3);
             transform: translateY(-1px);
         }

         /* Enhanced Cell Content Management */
         .advanced-table td {
             min-width: 0;
             overflow: hidden;
         }

         /* File Path Column - Flexible but not too wide */
         .col-file {
             min-width: 200px;
             max-width: 350px;
             width: 300px;
         }

         /* Status Column - Compact */
         .col-status {
             min-width: 100px;
             max-width: 120px;
             width: 110px;
         }

         /* Priority Column - Compact */
         .col-priority {
             min-width: 80px;
             max-width: 100px;
             width: 90px;
         }

         /* Expected Documentation - Flexible */
         .col-expected {
             min-width: 180px;
             max-width: 280px;
             width: 220px;
         }

         /* Effort Column - Compact */
         .col-effort {
             min-width: 70px;
             max-width: 90px;
             width: 80px;
         }

         /* Issues Column - Flexible */
         .col-issues {
             min-width: 150px;
             max-width: 250px;
             width: 200px;
         }

         /* Type Column - Compact */
         .col-type {
             min-width: 80px;
             max-width: 120px;
             width: 100px;
         }

         /* Size Column - Compact */
         .col-size {
             min-width: 60px;
             max-width: 80px;
             width: 70px;
         }

         /* Badges and Status Indicators */
         .badge {
             display: inline-block;
             padding: 4px 8px;
             border-radius: 4px;
             font-size: 11px;
             font-weight: 600;
             text-transform: uppercase;
             letter-spacing: 0.5px;
             white-space: nowrap;
         }

         .priority-high {
             background: linear-gradient(135deg, #fee2e2, #fecaca);
             color: #dc2626;
             border: 1px solid #fca5a5;
         }

         .priority-medium {
             background: linear-gradient(135deg, #fef3c7, #fde68a);
             color: #d97706;
             border: 1px solid #fbbf24;
         }

         .priority-low {
             background: linear-gradient(135deg, #dcfce7, #bbf7d0);
             color: #16a34a;
             border: 1px solid #4ade80;
         }

         .status-missing {
             background: linear-gradient(135deg, #fee2e2, #fecaca);
             color: #dc2626;
             border: 1px solid #fca5a5;
         }

         .status-inadequate {
             background: linear-gradient(135deg, #fef3c7, #fde68a);
             color: #d97706;
             border: 1px solid #fbbf24;
         }

         .status-quality {
             background: linear-gradient(135deg, #dbeafe, #bfdbfe);
             color: #2563eb;
             border: 1px solid #60a5fa;
         }

         .doc-path {
             font-family: var(--font-mono);
             font-size: 12px;
             background: var(--code-bg);
             padding: 2px 6px;
             border-radius: 4px;
             border: 1px solid var(--border-color);
             color: var(--code-text);
         }

         .empty-state {
             text-align: center;
             padding: 60px 20px;
            color: var(--text-secondary);
        }

         .empty-state h3 {
             color: var(--color-success);
            margin-bottom: 16px;
        }

         /* Modal Styles */
         .modal {
             display: none;
             position: fixed;
             z-index: 1000;
             left: 0;
             top: 0;
             width: 100%;
             height: 100%;
             background-color: rgba(0, 0, 0, 0.5);
             backdrop-filter: blur(4px);
         }

         .modal-content {
             background-color: var(--card-bg);
             margin: 5% auto;
            padding: 20px;
             border: 1px solid var(--border-color);
             border-radius: 12px;
             width: 90%;
             max-width: 800px;
             max-height: 80vh;
             overflow-y: auto;
             box-shadow: var(--shadow-xl);
         }

         .close {
             color: var(--text-secondary);
             float: right;
             font-size: 28px;
             font-weight: bold;
             cursor: pointer;
             transition: color 0.2s ease;
         }

         .close:hover {
             color: var(--brand-primary);
         }

         .modal h2 {
             color: var(--brand-primary);
             margin-bottom: 20px;
         }

         .modal pre {
            background: var(--code-bg);
             padding: 16px;
            border-radius: 8px;
             overflow-x: auto;
            font-family: var(--font-mono);
             font-size: 14px;
            line-height: 1.5;
            border: 1px solid var(--border-color);
        }

         /* Enhanced Filter Controls */
         .advanced-filter-controls {
             margin-bottom: var(--spacing-lg);
             padding: var(--spacing-md);
             background: var(--card-bg);
             border-radius: var(--radius-lg);
             border: 1px solid var(--border-color);
             backdrop-filter: blur(10px);
             -webkit-backdrop-filter: blur(10px);
             box-shadow: var(--shadow-sm);
         }
         
         .filter-row {
            display: flex;
             gap: var(--spacing-md);
            align-items: center;
             flex-wrap: wrap;
             margin-bottom: var(--spacing-md);
         }
         
         .search-container {
             flex: 1;
             min-width: 200px;
             position: relative;
         }
         
         .search-input {
             width: 100%;
             padding: var(--spacing-sm) var(--spacing-md);
             border: 1px solid var(--border-color);
             border-radius: var(--radius-md);
             background: var(--bg-primary);
             color: var(--text-primary);
             font-size: var(--font-size-sm);
             transition: all var(--transition-normal);
             backdrop-filter: blur(5px);
             -webkit-backdrop-filter: blur(5px);
         }
         
         .search-input:focus {
             outline: none;
             border-color: var(--brand-primary);
             box-shadow: 0 0 0 3px rgba(237, 174, 73, 0.2);
            background: var(--bg-secondary);
        }

         .table-controls {
            display: flex;
             gap: var(--spacing-sm);
            align-items: center;
        }
        
         .control-btn {
            display: flex;
            align-items: center;
             gap: var(--spacing-xs);
             padding: var(--spacing-sm) var(--spacing-md);
             border: 1px solid var(--border-color);
             border-radius: var(--radius-md);
            background: var(--bg-secondary);
            color: var(--text-primary);
             font-size: var(--font-size-sm);
            cursor: pointer;
             transition: all var(--transition-normal);
             backdrop-filter: blur(10px);
             -webkit-backdrop-filter: blur(10px);
             box-shadow: var(--shadow-sm);
         }
         
         .control-btn:hover {
            background: var(--brand-primary);
            border-color: var(--brand-primary);
             color: white;
             transform: translateY(-2px);
             box-shadow: var(--shadow-md);
        }

        .btn-icon {
             font-size: var(--font-size-sm);
        }

        .btn-text {
            font-weight: 500;
        }

         .filter-tags {
             display: flex;
             gap: var(--spacing-sm);
             flex-wrap: wrap;
         }
         
         .filter-tag {
             padding: var(--spacing-xs) var(--spacing-sm);
             border-radius: var(--radius-xl);
             background: var(--bg-tertiary);
            color: var(--text-secondary);
            font-size: var(--font-size-xs);
            font-weight: 500;
             cursor: pointer;
             transition: all var(--transition-normal);
             border: 1px solid var(--border-color);
             backdrop-filter: blur(5px);
             -webkit-backdrop-filter: blur(5px);
        }
        
         .filter-tag:hover {
             background: var(--brand-primary);
            color: white;
             transform: translateY(-1px);
             box-shadow: var(--shadow-sm);
        }
        
         .filter-tag.active {
             background: var(--brand-primary);
            color: white;
             border-color: var(--brand-primary);
             box-shadow: var(--shadow-sm);
         }
         
         /* Enhanced Pagination Controls */
         .table-pagination {
            display: flex;
            justify-content: space-between;
            align-items: center;
             padding: var(--spacing-md);
             background: var(--card-bg);
            border-top: 1px solid var(--border-color);
             border-radius: 0 0 var(--radius-lg) var(--radius-lg);
             backdrop-filter: blur(10px);
             -webkit-backdrop-filter: blur(10px);
         }
         
         .pagination-info {
             font-size: var(--font-size-sm);
            color: var(--text-secondary);
            font-weight: 500;
        }

         .pagination-controls {
            display: flex;
             gap: var(--spacing-sm);
            align-items: center;
         }
         
         .pagination-select {
             padding: var(--spacing-xs) var(--spacing-sm);
             border: 1px solid var(--border-color);
             border-radius: var(--radius-sm);
             background: var(--bg-secondary);
             color: var(--text-primary);
             font-size: var(--font-size-sm);
             cursor: pointer;
             transition: all var(--transition-normal);
         }
         
         .pagination-select:focus {
             outline: none;
             border-color: var(--brand-primary);
             box-shadow: 0 0 0 2px rgba(237, 174, 73, 0.2);
         }
         
         .pagination-buttons {
            display: flex;
            gap: var(--spacing-xs);
         }
         
         .pagination-btn {
             padding: var(--spacing-xs) var(--spacing-sm);
            border: 1px solid var(--border-color);
             border-radius: var(--radius-sm);
            background: var(--bg-secondary);
            color: var(--text-primary);
            font-size: var(--font-size-sm);
             cursor: pointer;
             transition: all var(--transition-normal);
             min-width: 32px;
             height: 32px;
            display: flex;
            align-items: center;
             justify-content: center;
             backdrop-filter: blur(5px);
             -webkit-backdrop-filter: blur(5px);
         }
         
         .pagination-btn:hover:not(:disabled) {
             background: var(--brand-primary);
            border-color: var(--brand-primary);
             color: white;
             transform: translateY(-1px);
             box-shadow: var(--shadow-sm);
         }
         
         .pagination-btn:disabled {
             opacity: 0.5;
             cursor: not-allowed;
         }
         
         .pagination-btn.active {
             background: var(--brand-primary);
             border-color: var(--brand-primary);
             color: white;
            font-weight: 600;
             box-shadow: var(--shadow-sm);
         }
         
         /* Enhanced Footer */
         .footer {
             margin-top: var(--spacing-2xl);
             background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
             border-radius: var(--radius-xl);
             border: 1px solid var(--border-color);
             backdrop-filter: blur(10px);
             -webkit-backdrop-filter: blur(10px);
             box-shadow: var(--shadow-xl);
             overflow: hidden;
         }
         
         /* Footer Hero Section */
         .footer-hero {
             background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
             padding: var(--spacing-xl);
            text-align: center;
             position: relative;
             overflow: hidden;
        }
        
         .footer-hero::before {
             content: '';
            position: absolute;
            top: 0;
             left: 0;
             right: 0;
            bottom: 0;
             background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
             animation: shimmer 3s ease-in-out infinite;
         }
         
         @keyframes shimmer {
             0%, 100% { transform: translateX(-100%); }
             50% { transform: translateX(100%); }
         }
         
         .footer-hero-content h3 {
             color: #000;
             font-size: var(--font-size-2xl);
             font-weight: 700;
             margin-bottom: var(--spacing-sm);
             text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
             position: relative;
             z-index: 1;
         }
         
         .footer-subtitle {
             color: rgba(0, 0, 0, 0.8);
             font-size: var(--font-size-lg);
             margin-bottom: var(--spacing-lg);
             font-weight: 500;
             position: relative;
             z-index: 1;
         }
         
         .footer-hero-stats {
             display: flex;
             justify-content: center;
             gap: var(--spacing-xl);
             flex-wrap: wrap;
             position: relative;
             z-index: 1;
         }
         
         .hero-stat {
            display: flex;
            flex-direction: column;
            align-items: center;
             padding: var(--spacing-md);
             background: rgba(255, 255, 255, 0.2);
             border-radius: var(--radius-lg);
             backdrop-filter: blur(10px);
             border: 1px solid rgba(255, 255, 255, 0.3);
             min-width: 120px;
             transition: all var(--transition-normal);
         }
         
         .hero-stat:hover {
             transform: translateY(-2px);
             background: rgba(255, 255, 255, 0.3);
             box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
         }
         
         .hero-stat-value {
             font-size: var(--font-size-3xl);
             font-weight: 800;
             color: #000;
             line-height: 1;
             margin-bottom: var(--spacing-xs);
         }
         
         .hero-stat-label {
             font-size: var(--font-size-sm);
             color: rgba(0, 0, 0, 0.8);
             font-weight: 600;
             text-transform: uppercase;
             letter-spacing: 0.5px;
         }
         
         /* Footer Content Sections */
         .footer-content {
             display: grid;
             grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
             gap: var(--spacing-xl);
             padding: var(--spacing-xl);
         }
         
         .footer-section {
             background: var(--card-bg);
             border-radius: var(--radius-lg);
             padding: var(--spacing-lg);
             border: 1px solid var(--border-color);
             transition: all var(--transition-normal);
             position: relative;
         }
         
         .footer-section:hover {
             transform: translateY(-2px);
             box-shadow: var(--shadow-lg);
             border-color: var(--brand-primary);
         }
         
         .footer-section-icon {
             font-size: var(--font-size-2xl);
             margin-bottom: var(--spacing-sm);
             display: block;
         }
         
         .footer-section h4 {
             color: var(--brand-primary);
             font-size: var(--font-size-lg);
             font-weight: 600;
             margin-bottom: var(--spacing-md);
            display: flex;
            align-items: center;
             gap: var(--spacing-sm);
         }
         
         .footer-info-grid {
            display: flex;
             flex-direction: column;
            gap: var(--spacing-sm);
        }
        
         .info-item {
            display: flex;
             justify-content: space-between;
            align-items: center;
             padding: var(--spacing-sm);
             background: var(--bg-primary);
             border-radius: var(--radius-sm);
            border: 1px solid var(--border-color);
            transition: all var(--transition-fast);
        }
        
         .info-item:hover {
             background: var(--hover-bg);
            border-color: var(--brand-primary);
        }
        
         .info-label {
            color: var(--text-secondary);
             font-size: var(--font-size-sm);
            font-weight: 500;
        }
        
         .info-value {
             color: var(--text-primary);
             font-weight: 600;
            font-size: var(--font-size-sm);
         }
         
         /* Footer Tips Section */
         .footer-tips {
             display: grid;
             grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
             gap: var(--spacing-xl);
             padding: 0 var(--spacing-xl) var(--spacing-xl);
         }
         
         .tip-section {
             background: var(--card-bg);
            border-radius: var(--radius-lg);
            padding: var(--spacing-lg);
            border: 1px solid var(--border-color);
        }
        
         .tip-section h4 {
             color: var(--brand-primary);
             font-size: var(--font-size-lg);
             font-weight: 600;
            margin-bottom: var(--spacing-md);
         }
         
         .tip-list {
             list-style: none;
            padding: 0;
             margin: 0;
         }
         
         .tip-list li {
             padding: var(--spacing-sm) 0;
             color: var(--text-secondary);
             font-size: var(--font-size-sm);
             line-height: 1.5;
             border-bottom: 1px solid var(--border-color);
             transition: all var(--transition-fast);
         }
         
         .tip-list li:last-child {
             border-bottom: none;
         }
         
         .tip-list li:hover {
             color: var(--text-primary);
             padding-left: var(--spacing-sm);
         }
         
         .tip-list kbd {
             background: var(--bg-tertiary);
             border: 1px solid var(--border-color);
             border-radius: var(--radius-sm);
             padding: 2px 6px;
             font-size: var(--font-size-xs);
             font-family: var(--font-mono);
             color: var(--brand-primary);
             font-weight: 600;
             margin-right: var(--spacing-xs);
         }
         
         /* Footer Bottom */
         .footer-bottom {
            display: flex;
            justify-content: space-between;
             align-items: center;
             padding: var(--spacing-lg) var(--spacing-xl);
             background: var(--bg-primary);
             border-top: 1px solid var(--border-color);
             flex-wrap: wrap;
             gap: var(--spacing-md);
         }
         
         .footer-branding {
            display: flex;
            align-items: center;
             gap: var(--spacing-md);
         }
         
         .footer-logo {
             font-size: var(--font-size-2xl);
             background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
             padding: var(--spacing-sm);
             border-radius: var(--radius-md);
             display: flex;
             align-items: center;
             justify-content: center;
             box-shadow: var(--shadow-sm);
         }
         
         .footer-brand-text {
             display: flex;
             flex-direction: column;
         }
         
         .brand-name {
             font-size: var(--font-size-lg);
             font-weight: 700;
            color: var(--brand-primary);
             line-height: 1;
         }
         
         .brand-tagline {
             font-size: var(--font-size-sm);
            color: var(--text-secondary);
             font-weight: 500;
         }
         
         .footer-links {
            display: flex;
            gap: var(--spacing-md);
             flex-wrap: wrap;
         }
         
         .footer-link {
            display: flex;
            align-items: center;
             gap: var(--spacing-xs);
            color: var(--brand-primary);
             text-decoration: none;
            font-weight: 500;
             font-size: var(--font-size-sm);
             padding: var(--spacing-sm) var(--spacing-md);
            border-radius: var(--radius-md);
             border: 1px solid var(--border-color);
             background: var(--card-bg);
             transition: all var(--transition-normal);
         }
         
         .footer-link:hover {
             background: var(--brand-primary);
             color: #000;
             transform: translateY(-1px);
             box-shadow: var(--shadow-md);
            border-color: var(--brand-primary);
        }
        
         .link-icon {
             font-size: var(--font-size-base);
         }
         
         /* Enhanced Recommendations Section */
         .recommendations {
             background: linear-gradient(135deg, var(--bg-secondary), var(--card-bg));
             border-radius: var(--radius-lg);
             padding: var(--spacing-lg);
             margin-bottom: var(--spacing-lg);
             border: 1px solid var(--border-color);
             backdrop-filter: blur(10px);
             -webkit-backdrop-filter: blur(10px);
             box-shadow: var(--shadow-md);
         }
         
         .recommendation-item {
            padding: var(--spacing-md);
             margin-bottom: var(--spacing-md);
             background: var(--bg-primary);
            border-radius: var(--radius-md);
             border: 1px solid var(--border-color);
             transition: all var(--transition-normal);
         }
         
         .recommendation-item:hover {
             transform: translateY(-2px);
             box-shadow: var(--shadow-md);
             border-color: var(--brand-primary);
         }
         
         .recommendation-title {
             color: var(--brand-primary);
             font-weight: 600;
             margin-bottom: var(--spacing-xs);
         }
         
         .recommendation-description {
            color: var(--text-secondary);
             font-size: var(--font-size-sm);
             line-height: 1.5;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
             .filter-row {
                 flex-direction: column;
                 align-items: stretch;
             }
             
             .table-controls {
                 justify-content: center;
             }
             
             .pagination-controls {
                 flex-direction: column;
            gap: var(--spacing-sm);
        }
        
             .footer-hero-stats {
                 flex-direction: column;
                 align-items: center;
             }
             
             .footer-content {
                 grid-template-columns: 1fr;
                 gap: var(--spacing-lg);
             }
             
             .footer-tips {
                 grid-template-columns: 1fr;
                 gap: var(--spacing-lg);
             }
             
             .footer-bottom {
                 flex-direction: column;
                 text-align: center;
             }
             
             .footer-links {
                 justify-content: center;
             }
         }
         
         @media (max-width: 480px) {
             .footer-hero {
            padding: var(--spacing-lg);
        }
        
             .footer-content {
            padding: var(--spacing-lg);
             }
             
             .footer-tips {
                 padding: 0 var(--spacing-lg) var(--spacing-lg);
             }
             
             .footer-bottom {
                 padding: var(--spacing-md) var(--spacing-lg);
             }
         }
         
         /* Column Picker Modal Styling */
        .column-picker {
            display: grid;
             grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
             gap: 0.75rem;
             margin-top: 1rem;
             padding: 0;
         }

         .column-item {
            display: flex;
            align-items: center;
             gap: 0.75rem;
             padding: 0.75rem 1rem;
             border: 2px solid transparent;
            border-radius: var(--radius-md);
             background: linear-gradient(135deg, 
                 rgba(255, 255, 255, 0.1) 0%, 
                 rgba(255, 255, 255, 0.05) 100%);
             backdrop-filter: blur(10px);
             box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: all var(--transition-normal);
            cursor: pointer;
             position: relative;
             overflow: hidden;
             min-height: 48px;
         }

         .column-item::before {
             content: '';
             position: absolute;
             top: 0;
             left: 0;
             right: 0;
             bottom: 0;
             background: linear-gradient(135deg, 
                 rgba(237, 174, 73, 0.1) 0%, 
                 rgba(249, 223, 116, 0.05) 100%);
             opacity: 0;
             transition: opacity var(--transition-normal);
             z-index: 1;
         }

         .column-item:hover {
             transform: translateY(-2px);
             border-color: var(--brand-primary);
             box-shadow: 0 8px 32px rgba(237, 174, 73, 0.2);
         }

         .column-item:hover::before {
             opacity: 1;
         }

         .column-item.essential {
            border-color: var(--brand-primary);
             background: linear-gradient(135deg, 
                 rgba(237, 174, 73, 0.15) 0%, 
                 rgba(249, 223, 116, 0.1) 100%);
             box-shadow: 0 4px 20px rgba(237, 174, 73, 0.3);
         }

         .column-item.essential::after {
             content: '✨';
             position: absolute;
             top: 0.25rem;
             right: 0.25rem;
             font-size: 0.75rem;
             opacity: 0.7;
         }

         .column-checkbox {
             width: 20px;
             height: 20px;
            cursor: pointer;
             border: 2px solid var(--border-color);
             border-radius: var(--radius-sm);
             background: var(--bg-primary);
            transition: all var(--transition-fast);
             position: relative;
             z-index: 2;
             -webkit-appearance: none;
             -moz-appearance: none;
             appearance: none;
         }

         .column-checkbox:checked {
             background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
             border-color: var(--brand-primary);
         }

         .column-checkbox:checked::after {
             content: '✓';
             position: absolute;
             top: 50%;
             left: 50%;
             transform: translate(-50%, -50%);
             color: white;
             font-weight: bold;
             font-size: 0.75rem;
         }

         .column-checkbox:hover {
            border-color: var(--brand-primary);
             box-shadow: 0 0 0 3px rgba(237, 174, 73, 0.2);
         }

         .column-checkbox:disabled {
             opacity: 0.7;
             cursor: not-allowed;
         }

         .column-label {
             flex: 1;
            font-weight: 500;
             cursor: pointer;
             color: var(--text-primary);
             font-size: var(--font-size-base);
             position: relative;
             z-index: 2;
             transition: color var(--transition-fast);
         }

         .column-item:hover .column-label {
             color: var(--brand-primary);
         }

         .column-essential {
             font-size: 0.625rem;
             color: var(--brand-primary);
             text-transform: uppercase;
             font-weight: 700;
             letter-spacing: 0.3px;
             padding: 0.125rem 0.375rem;
             background: linear-gradient(135deg, 
                 rgba(237, 174, 73, 0.2) 0%, 
                 rgba(249, 223, 116, 0.1) 100%);
             border-radius: var(--radius-sm);
             border: 1px solid rgba(237, 174, 73, 0.3);
             position: relative;
             z-index: 2;
             white-space: nowrap;
         }

         /* Column Picker Modal Enhancements */
         #column-picker-modal .modal-content {
             background: linear-gradient(135deg, 
                 rgba(255, 255, 255, 0.1) 0%, 
                 rgba(255, 255, 255, 0.05) 100%);
             backdrop-filter: blur(20px);
             border: 1px solid rgba(255, 255, 255, 0.2);
             box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
             max-width: 700px;
             width: 90vw;
             max-height: 70vh;
             height: auto;
             display: flex;
                flex-direction: column;
             overflow: hidden;
         }

         #column-picker-modal .modal-header {
             background: linear-gradient(135deg, 
                 rgba(237, 174, 73, 0.1) 0%, 
                 rgba(249, 223, 116, 0.05) 100%);
             border-bottom: 1px solid rgba(237, 174, 73, 0.2);
             padding: 1rem 1.5rem;
             display: flex;
             justify-content: space-between;
             align-items: center;
             flex-shrink: 0;
         }

         #column-picker-modal .modal-header h3 {
             color: var(--brand-primary);
             font-size: var(--font-size-xl);
             font-weight: 600;
             margin: 0;
             display: flex;
             align-items: center;
             gap: 0.5rem;
         }

         #column-picker-modal .modal-body {
             padding: 1.25rem 1.5rem;
             flex: 1;
             overflow-y: auto;
             min-height: 0;
         }

         #column-picker-modal .modal-body > p {
            color: var(--text-secondary);
             margin-bottom: 0.75rem;
             font-size: var(--font-size-sm);
         }

         #column-picker-modal .modal-footer {
             background: linear-gradient(135deg, 
                 rgba(237, 174, 73, 0.05) 0%, 
                 rgba(249, 223, 116, 0.02) 100%);
             border-top: 1px solid rgba(237, 174, 73, 0.2);
             padding: 1rem 1.5rem;
             display: flex;
             gap: 0.75rem;
             justify-content: flex-end;
             flex-shrink: 0;
         }

         #column-picker-modal .modal-footer .btn {
             padding: 0.625rem 1.25rem;
             border-radius: var(--radius-md);
             font-weight: 600;
             font-size: var(--font-size-sm);
            cursor: pointer;
             transition: all var(--transition-fast);
             border: none;
             position: relative;
             overflow: hidden;
             display: flex;
             align-items: center;
             gap: 0.375rem;
             min-width: 100px;
             justify-content: center;
         }

         #column-picker-modal .modal-footer .btn::before {
             content: '';
             position: absolute;
             top: 0;
             left: -100%;
             width: 100%;
             height: 100%;
             background: linear-gradient(90deg, 
                 transparent, 
                 rgba(255, 255, 255, 0.2), 
                 transparent);
             transition: left 0.5s;
         }

         #column-picker-modal .modal-footer .btn:hover::before {
             left: 100%;
         }

         #column-picker-modal .modal-footer .btn-secondary {
             background: linear-gradient(135deg, 
                 rgba(255, 255, 255, 0.1) 0%, 
                 rgba(255, 255, 255, 0.05) 100%);
            color: var(--text-primary);
             border: 2px solid rgba(255, 255, 255, 0.2);
             backdrop-filter: blur(10px);
         }

         #column-picker-modal .modal-footer .btn-secondary::after {
             content: '↺';
             font-size: 0.875rem;
             opacity: 0.7;
         }

         #column-picker-modal .modal-footer .btn-secondary:hover {
             background: linear-gradient(135deg, 
                 rgba(255, 255, 255, 0.2) 0%, 
                 rgba(255, 255, 255, 0.1) 100%);
             transform: translateY(-2px);
             border-color: rgba(255, 255, 255, 0.4);
             box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
         }

         #column-picker-modal .modal-footer .btn-secondary:active {
             transform: translateY(0);
         }

         #column-picker-modal .modal-footer .btn-primary {
             background: linear-gradient(135deg, 
                 var(--brand-primary-dark) 0%, 
                 var(--brand-primary) 100%);
             color: #ffffff;
             border: 2px solid var(--brand-primary);
             box-shadow: 0 4px 16px rgba(237, 174, 73, 0.3);
             font-weight: 700;
             text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
         }

         #column-picker-modal .modal-footer .btn-primary::after {
             content: '✓';
             font-size: 0.875rem;
             font-weight: bold;
         }

         #column-picker-modal .modal-footer .btn-primary:hover {
             background: linear-gradient(135deg, 
                 #a67c14 0%, 
                 var(--brand-primary-dark) 100%);
             transform: translateY(-2px);
             box-shadow: 0 8px 32px rgba(237, 174, 73, 0.4);
             border-color: var(--brand-primary-light);
             color: #ffffff;
         }

         #column-picker-modal .modal-footer .btn-primary:active {
             transform: translateY(0);
             box-shadow: 0 4px 16px rgba(237, 174, 73, 0.3);
         }

         /* Button loading state */
         #column-picker-modal .modal-footer .btn:disabled {
             opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
         #column-picker-modal .modal-footer .btn:disabled:hover {
             transform: none;
             box-shadow: none;
         }

         /* Dark theme adjustments */
         [data-theme="dark"] .column-item {
             background: linear-gradient(135deg, 
                 rgba(255, 255, 255, 0.05) 0%, 
                 rgba(255, 255, 255, 0.02) 100%);
         }

         [data-theme="dark"] .column-checkbox {
             background: var(--dark-bg-tertiary);
             border-color: var(--dark-border);
         }

         [data-theme="dark"] #column-picker-modal .modal-content {
             background: linear-gradient(135deg, 
                 rgba(0, 0, 0, 0.8) 0%, 
                 rgba(0, 0, 0, 0.6) 100%);
             border-color: rgba(255, 255, 255, 0.1);
         }

         /* Enhanced Modal Close Button */
         .modal-close {
             width: 32px;
             height: 32px;
             border-radius: 50%;
             border: none;
             background: linear-gradient(135deg, 
                 rgba(255, 255, 255, 0.1) 0%, 
                 rgba(255, 255, 255, 0.05) 100%);
             color: var(--text-secondary);
             font-size: 1.25rem;
             font-weight: 300;
             display: flex;
             align-items: center;
             justify-content: center;
             cursor: pointer;
             transition: all var(--transition-fast);
            backdrop-filter: blur(10px);
             position: relative;
             overflow: hidden;
         }

         .modal-close::before {
             content: '';
             position: absolute;
             top: 0;
             left: 0;
             right: 0;
             bottom: 0;
             background: linear-gradient(135deg, 
                 rgba(237, 174, 73, 0.2) 0%, 
                 rgba(249, 223, 116, 0.1) 100%);
             opacity: 0;
             transition: opacity var(--transition-fast);
             border-radius: 50%;
         }

         .modal-close:hover {
             transform: scale(1.1);
            color: var(--brand-primary);
             box-shadow: 0 4px 16px rgba(237, 174, 73, 0.3);
         }

         .modal-close:hover::before {
             opacity: 1;
         }

         .modal-close:active {
             transform: scale(0.95);
         }

         /* Dark theme modal close button */
         [data-theme="dark"] .modal-close {
             background: linear-gradient(135deg, 
                 rgba(255, 255, 255, 0.05) 0%, 
                 rgba(255, 255, 255, 0.02) 100%);
             color: var(--dark-text-secondary);
         }

         [data-theme="dark"] .modal-close:hover {
             color: var(--brand-primary);
         }

         /* Dark theme button adjustments */
         [data-theme="dark"] #column-picker-modal .modal-footer .btn-secondary {
             background: linear-gradient(135deg, 
                 rgba(255, 255, 255, 0.05) 0%, 
                 rgba(255, 255, 255, 0.02) 100%);
             border-color: rgba(255, 255, 255, 0.1);
             color: var(--dark-text-primary);
         }

                  [data-theme="dark"] #column-picker-modal .modal-footer .btn-secondary:hover {
             background: linear-gradient(135deg, 
                 rgba(255, 255, 255, 0.1) 0%, 
                 rgba(255, 255, 255, 0.05) 100%);
             border-color: rgba(255, 255, 255, 0.2);
         }

         /* Pulse animation for pending changes */
         @keyframes pulse {
             0% { transform: scale(1); }
             50% { transform: scale(1.05); }
             100% { transform: scale(1); }
         }

         /* Enhanced Pagination Controls */
            .pagination-controls {
             display: flex;
             justify-content: space-between;
             align-items: center;
             padding: 1rem 1.5rem;
             background: linear-gradient(135deg, 
                 rgba(255, 255, 255, 0.1) 0%, 
                 rgba(255, 255, 255, 0.05) 100%);
             backdrop-filter: blur(10px);
             border-radius: var(--radius-lg);
             border: 1px solid rgba(255, 255, 255, 0.2);
             margin: 1rem 0;
             box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
         }

         .pagination-buttons {
             display: flex;
             gap: 0.5rem;
             align-items: center;
         }

         .pagination-btn {
             width: 40px;
             height: 40px;
             border: 2px solid rgba(255, 255, 255, 0.2);
             border-radius: 50%;
             background: linear-gradient(135deg, 
                 rgba(255, 255, 255, 0.1) 0%, 
                 rgba(255, 255, 255, 0.05) 100%);
             color: var(--text-primary);
             font-size: 1rem;
             font-weight: 600;
             cursor: pointer;
             transition: all var(--transition-fast);
             display: flex;
             align-items: center;
                justify-content: center;
             backdrop-filter: blur(10px);
             position: relative;
             overflow: hidden;
         }

         .pagination-btn::before {
             content: '';
             position: absolute;
             top: 0;
             left: 0;
             right: 0;
             bottom: 0;
             background: linear-gradient(135deg, 
                 rgba(237, 174, 73, 0.2) 0%, 
                 rgba(249, 223, 116, 0.1) 100%);
             opacity: 0;
             transition: opacity var(--transition-fast);
             border-radius: 50%;
         }

         .pagination-btn:hover {
             transform: translateY(-2px) scale(1.05);
             border-color: var(--brand-primary);
             box-shadow: 0 6px 20px rgba(237, 174, 73, 0.3);
             color: var(--brand-primary);
         }

         .pagination-btn:hover::before {
             opacity: 1;
         }

         .pagination-btn:active {
             transform: translateY(0) scale(0.95);
         }

         .pagination-btn:disabled {
             opacity: 0.4;
             cursor: not-allowed;
             transform: none;
         }

         .pagination-btn:disabled:hover {
             transform: none;
             border-color: rgba(255, 255, 255, 0.2);
             box-shadow: none;
             color: var(--text-primary);
         }

         .pagination-btn:disabled::before {
             opacity: 0;
         }

         .page-indicator {
             padding: 0.5rem 1rem;
             background: linear-gradient(135deg, 
                 rgba(237, 174, 73, 0.15) 0%, 
                 rgba(249, 223, 116, 0.1) 100%);
             border: 2px solid rgba(237, 174, 73, 0.3);
             border-radius: var(--radius-md);
            color: var(--brand-primary);
            font-weight: 600;
             font-size: var(--font-size-sm);
             backdrop-filter: blur(10px);
             margin: 0 1rem;
        }

         .pagination-summary {
            color: var(--text-secondary);
             font-size: var(--font-size-sm);
             font-weight: 500;
         }

         /* Enhanced Clear All Filters Button */
         .clear-btn, #clear-filters {
             padding: 0.5rem 1rem;
             border: 2px solid rgba(255, 255, 255, 0.2);
             border-radius: var(--radius-md);
             background: linear-gradient(135deg, 
                 rgba(255, 255, 255, 0.1) 0%, 
                 rgba(255, 255, 255, 0.05) 100%);
             color: var(--text-primary);
             font-size: var(--font-size-sm);
             font-weight: 600;
             cursor: pointer;
             transition: all var(--transition-fast);
             backdrop-filter: blur(10px);
            position: relative;
             overflow: hidden;
             display: flex;
             align-items: center;
             gap: 0.375rem;
         }

         .clear-btn::before, #clear-filters::before {
             content: '';
            position: absolute;
             top: 0;
             left: 0;
             right: 0;
             bottom: 0;
             background: linear-gradient(135deg, 
                 rgba(239, 68, 68, 0.2) 0%, 
                 rgba(220, 38, 127, 0.1) 100%);
             opacity: 0;
             transition: opacity var(--transition-fast);
         }

         .clear-btn::after, #clear-filters::after {
             content: '🧹';
             font-size: 0.875rem;
             opacity: 0.8;
         }

         .clear-btn:hover, #clear-filters:hover {
             transform: translateY(-2px);
             border-color: #ef4444;
             box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3);
             color: #ef4444;
         }

         .clear-btn:hover::before, #clear-filters:hover::before {
             opacity: 1;
         }

         .clear-btn:active, #clear-filters:active {
             transform: translateY(0);
         }

         /* Page Size Selector Enhancement */
                  .page-size-select {
             padding: 0.5rem 0.75rem;
             border: 2px solid rgba(255, 255, 255, 0.2);
             border-radius: var(--radius-md);
             background: linear-gradient(135deg, 
                 rgba(255, 255, 255, 0.1) 0%, 
                 rgba(255, 255, 255, 0.05) 100%);
             color: var(--text-primary);
             font-size: var(--font-size-sm);
             font-weight: 500;
             cursor: pointer;
             transition: all var(--transition-fast);
             backdrop-filter: blur(10px);
         }

         .page-size-select option {
             background: var(--bg-primary);
             color: var(--text-primary);
             padding: 0.5rem;
             border: none;
         }

         .page-size-select:hover {
             border-color: var(--brand-primary);
             box-shadow: 0 4px 12px rgba(237, 174, 73, 0.2);
         }

         .page-size-select:focus {
             outline: none;
             border-color: var(--brand-primary);
             box-shadow: 0 0 0 3px rgba(237, 174, 73, 0.2);
         }

         /* Dark theme adjustments for select options */
         [data-theme="dark"] .page-size-select option {
             background: var(--bg-secondary);
            color: var(--text-primary);
         }

         /* Dark theme adjustments for pagination */
         [data-theme="dark"] .pagination-controls {
             background: linear-gradient(135deg, 
                 rgba(255, 255, 255, 0.05) 0%, 
                 rgba(255, 255, 255, 0.02) 100%);
             border-color: rgba(255, 255, 255, 0.1);
         }

         [data-theme="dark"] .pagination-btn {
             background: linear-gradient(135deg, 
                 rgba(255, 255, 255, 0.05) 0%, 
                 rgba(255, 255, 255, 0.02) 100%);
             border-color: rgba(255, 255, 255, 0.1);
         }

         [data-theme="dark"] .clear-btn, 
         [data-theme="dark"] #clear-filters {
             background: linear-gradient(135deg, 
                 rgba(255, 255, 255, 0.05) 0%, 
                 rgba(255, 255, 255, 0.02) 100%);
             border-color: rgba(255, 255, 255, 0.1);
         }

         [data-theme="dark"] .page-size-select {
             background: linear-gradient(135deg, 
                 rgba(255, 255, 255, 0.05) 0%, 
                 rgba(255, 255, 255, 0.02) 100%);
             border-color: rgba(255, 255, 255, 0.1);
        }
        """
    
    def _generate_header(self, report: CoverageReport) -> str:
        """Generate the report header."""
        return f"""
        <div class="header">
            <h1>📊 Documentation Coverage Report</h1>
            <p>Comprehensive analysis of documentation coverage across the Idling.app codebase</p>
            <p>Generated: {report.timestamp}</p>
        </div>
        """
    
    def _generate_overview_cards(self, report: CoverageReport) -> str:
        """Generate overview metrics cards with filtering capabilities."""
        min_coverage = self.config["documentation_standards"]["minimum_coverage_percentage"]
        
        return f"""
        <div class="overview-grid">
            <div class="metric-card" data-filter="all" title="Click to show all files">
                <div class="metric-value">{report.total_code_files}</div>
                <div class="metric-label">Total Files</div>
            </div>
            <div class="metric-card clickable-card" data-filter="all" title="📄 Click to show all documentation issues and reset any active filters">
                <div class="metric-value">{report.adequately_documented}</div>
                <div class="metric-label">Documented Files</div>
            </div>
            <div class="metric-card clickable-card" data-filter="all" title="📊 Click to show all documentation issues and reset any active filters">
                <div class="metric-value {self._get_coverage_class(report.coverage_percentage, min_coverage)}">{report.coverage_percentage:.1f}%</div>
                <div class="metric-label">Coverage</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {min(report.coverage_percentage, 100)}%"></div>
                </div>
            </div>
            <div class="metric-card clickable-card" data-filter="inadequate" title="⭐ Click to filter and show only files with inadequate documentation that need quality improvements">
                <div class="metric-value {self._get_quality_class(report.quality_score)}">{report.quality_score:.2f}</div>
                <div class="metric-label">Quality Score</div>
                <div class="quality-bar">
                    <div class="quality-fill" style="width: {min(report.quality_score * 100, 100)}%"></div>
                </div>
                <p style="font-size: var(--font-size-xs); margin-top: var(--spacing-xs);">Shows files needing quality improvements</p>
            </div>
            <div class="metric-card clickable-card" data-filter="missing" title="❌ Click to filter and show only files with missing documentation">
                <div class="metric-value {self._get_status_class(report.missing_documentation == 0)}">{report.missing_documentation}</div>
                <div class="metric-label">Missing Documentation</div>
                <p style="font-size: var(--font-size-xs); margin-top: var(--spacing-xs);">Files without any documentation</p>
            </div>
            <div class="metric-card clickable-card" data-filter="inadequate" title="⚠️ Click to filter and show only files with inadequate documentation">
                <div class="metric-value {self._get_status_class(report.inadequate_documentation == 0)}">{report.inadequate_documentation}</div>
                <div class="metric-label">Inadequate Documentation</div>
                <p style="font-size: var(--font-size-xs); margin-top: var(--spacing-xs);">Files with incomplete documentation</p>
            </div>
        </div>
        """
    
    def _generate_quality_metrics(self, report: CoverageReport) -> str:
        """Generate quality metrics section with filtering capabilities."""
        return f"""
        <div class="card">
            <h2>📈 Quality Metrics</h2>
            <div class="overview-grid">
                <div class="metric-card clickable-card" data-filter="missing" title="❌ Click to filter and show only files with missing documentation">
                    <div class="metric-value {self._get_status_class(report.missing_documentation == 0)}">{report.missing_documentation}</div>
                    <div class="metric-label">Missing Documentation</div>
                </div>
                <div class="metric-card clickable-card" data-filter="inadequate" title="⚠️ Click to filter and show only files with inadequate documentation">
                    <div class="metric-value {self._get_status_class(report.inadequate_documentation == 0)}">{report.inadequate_documentation}</div>
                    <div class="metric-label">Inadequate Documentation</div>
                </div>
                <div class="metric-card clickable-card" data-filter="all" title="📊 Click to show all documentation issues and reset any active filters">
                    <div class="metric-value quality-good">{len(report.gaps)}</div>
                    <div class="metric-label">Total Issues</div>
                </div>
            </div>
        </div>
        """
    
    def _generate_gaps_analysis(self, report: CoverageReport) -> str:
        """Generate advanced gaps analysis table with filtering and sorting."""
        if not report.gaps:
            return """
            <div class="card">
                <h2>📄 Documentation Gaps Analysis</h2>
                <div class="empty-state">
                    <h3>🎉 No documentation gaps found!</h3>
                    <p>All code files have adequate documentation coverage.</p>
                </div>
            </div>
            """
        
        # Pre-process file contents for batch highlighting if enabled
        file_previews = {}
        if self.enable_syntax_highlighting:
            print("🎨 Generating syntax-highlighted previews (this may take a moment)...")
            
            # Collect all file contents first
            file_contents = {}
            for gap in report.gaps:
                try:
                    with open(gap.code_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Limit content size for HTML embedding (first 30 lines or 2000 chars)
                    lines = content.split('\n')
                    if len(lines) > 30:
                        content = '\n'.join(lines[:30])
                    elif len(content) > 2000:
                        content = content[:2000]
                    
                    file_contents[gap.code_file] = content
                except Exception as e:
                    print(f"Could not read {gap.code_file}: {e}")
                    continue
            
            # Batch highlight all files at once
            if file_contents:
                try:
                    file_previews = self._highlight_batch_with_hljs(file_contents)
                    print(f"✨ Highlighted {len(file_previews)} files in batch")
                except Exception as e:
                    print(f"Batch highlighting failed: {e}")
                    file_previews = {}
        
        # Define table columns with enhanced configuration
        columns = [
            {"id": "file", "label": "📁 File", "width": "300px", "sortable": True, "visible": True, "essential": True},
            {"id": "status", "label": "📊 Status", "width": "120px", "sortable": True, "visible": True, "essential": True},
            {"id": "priority", "label": "⚡ Priority", "width": "100px", "sortable": True, "visible": True, "essential": True},
            {"id": "expected", "label": "📄 Expected Doc Path", "width": "250px", "sortable": True, "visible": True, "essential": False},
            {"id": "effort", "label": "🔧 Effort", "width": "100px", "sortable": True, "visible": True, "essential": False},
            {"id": "issues", "label": "⚠️ Issues", "width": "200px", "sortable": True, "visible": True, "essential": False},
            {"id": "type", "label": "📝 Type", "width": "80px", "sortable": True, "visible": True, "essential": False},
            {"id": "size", "label": "📏 Size", "width": "80px", "sortable": True, "visible": True, "essential": False},
        ]
        
        # Generate table rows with enhanced data attributes
        rows = []
        for gap in report.gaps:
            priority_badge = self._get_priority_badge(gap.priority)
            status_badge = self._get_gap_status_badge(gap.gap_type)
            
            file_type = gap.code_file.split('.')[-1].upper() if '.' in gap.code_file else 'Unknown'
            estimated_size = self._estimate_doc_size(gap.estimated_effort)
            
            # Get file preview (either from batch processing or individual call)
            if self.enable_syntax_highlighting and gap.code_file in file_previews:
                file_preview = file_previews[gap.code_file] or "Preview not available"
            else:
                file_preview = self._get_file_preview(gap.code_file)
            
            # Properly escape the file preview for HTML attributes
            file_preview_escaped = html.escape(file_preview, quote=True)
            
            # Add comprehensive data attributes for filtering and sorting
            data_attrs = f'''data-priority="{gap.priority}" 
                           data-gap-type="{gap.gap_type}" 
                           data-effort="{gap.estimated_effort}"
                           data-file-type="{file_type.lower()}"
                           data-file-name="{gap.code_file}"
                           data-expected-doc="{gap.expected_doc_path}"
                           data-issues-count="{len(gap.quality_issues)}"
                           data-github-url="https://github.com/Underwood-Inc/idling.app__UI/blob/docs/links/{gap.code_file}"
                           data-source-preview="{file_preview_escaped}"'''
            
            quality_issues = ', '.join(gap.quality_issues[:3]) if gap.quality_issues else 'None'
            if len(gap.quality_issues) > 3:
                quality_issues += f' (+{len(gap.quality_issues) - 3} more)'
            
            # Split file path for better display
            file_parts = gap.code_file.split('/')
            file_name = file_parts[-1]
            file_dir = '/'.join(file_parts[:-1]) if len(file_parts) > 1 else ''
            
            rows.append(f"""
            <tr class="gap-row clickable-row" {data_attrs}>
                <td class="col-file" data-sort="{gap.code_file}">
                    <div class="file-path-container">
                        {f'<span class="file-directory">{file_dir}/</span>' if file_dir else ''}
                        <span class="file-name clickable-filename" 
                              data-github-url="https://github.com/Underwood-Inc/idling.app__UI/blob/docs/links/{gap.code_file}"
                              title="Click to open on GitHub">{file_name}</span>
                    </div>
                </td>
                <td class="col-status" data-sort="{gap.gap_type}">
                    {status_badge}
                </td>
                <td class="col-priority" data-sort="{self._get_priority_sort_value(gap.priority)}">
                    {priority_badge}
                </td>
                <td class="col-expected" data-sort="{gap.expected_doc_path}">
                    <code class="doc-path">{gap.expected_doc_path}</code>
                </td>
                <td class="col-effort" data-sort="{self._get_effort_sort_value(gap.estimated_effort)}">
                    <span class="effort-badge effort-{gap.estimated_effort.lower()}">{gap.estimated_effort.title()}</span>
                </td>
                <td class="col-issues" data-sort="{len(gap.quality_issues)}">
                    <span class="issues-text" title="{'; '.join(gap.quality_issues) if gap.quality_issues else 'No issues'}">{quality_issues}</span>
                </td>
                <td class="col-type" data-sort="{file_type}">
                    <span class="file-type-badge">{file_type}</span>
                </td>
                <td class="col-size" data-sort="{estimated_size}">
                    <span class="size-estimate">{estimated_size}</span>
                </td>
            </tr>
            """)
        
        # Generate column picker options
        column_picker_html = ""
        for col in columns:
            essential_class = "essential" if col["essential"] else ""
            column_picker_html += f'''
            <label class="column-option {essential_class}">
                <input type="checkbox" 
                       data-column="{col['id']}" 
                       {"checked" if col["visible"] else ""} 
                       {"disabled" if col["essential"] else ""}>
                <span class="column-label">{col['label']}</span>
                {' <small>(essential)</small>' if col["essential"] else ''}
            </label>
            '''
        
        # Generate table headers with resize handles
        headers_html = ""
        for col in columns:
            visible_class = "" if col["visible"] else "hidden"
            sortable_class = "sortable" if col["sortable"] else ""
            headers_html += f'''
            <th class="col-{col['id']} {visible_class} {sortable_class}" 
                data-column="{col['id']}" 
                data-width="{col['width']}"
                style="width: {col['width']};">
                <div class="header-content">
                    <span class="header-text">{col['label']}</span>
                    {f'<span class="sort-indicator"></span>' if col["sortable"] else ''}
                </div>
                <div class="resize-handle"></div>
            </th>
            '''
        
        return f"""
        <div class="card">
            <h2>📄 Advanced Documentation Gaps Analysis</h2>
            
            <!-- Enhanced Filter Controls -->
            <div class="advanced-filter-controls">
                <div class="filter-row">
                    <div class="search-container">
                        <input type="text" id="gap-search" placeholder="🔍 Search files, paths, or issues..." class="search-input">
                    </div>
                    <div class="table-controls">
                        <button id="column-picker-btn" class="control-btn" title="Show/Hide Columns">
                            <span class="btn-icon">⚙️</span>
                            <span class="btn-text">Columns</span>
                        </button>
                        <button id="reset-table-btn" class="control-btn" title="Reset Table Settings">
                            <span class="btn-icon">🔄</span>
                            <span class="btn-text">Reset</span>
                        </button>
                    </div>
                </div>
                
                <div class="filter-tags">
                    <span class="filter-tag active" data-filter="all">All ({len(report.gaps)})</span>
                    <span class="filter-tag" data-filter="critical">Critical ({report.by_priority.get('critical', 0)})</span>
                    <span class="filter-tag" data-filter="high">High ({report.by_priority.get('high', 0)})</span>
                    <span class="filter-tag" data-filter="medium">Medium ({report.by_priority.get('medium', 0)})</span>
                    <span class="filter-tag" data-filter="low">Low ({report.by_priority.get('low', 0)})</span>
                    <span class="filter-tag" data-filter="missing">Missing ({report.missing_documentation})</span>
                    <span class="filter-tag" data-filter="inadequate">Inadequate ({report.inadequate_documentation})</span>
                </div>
                
                <div class="filter-status-row">
                    <span id="filter-status">Showing all {len(report.gaps)} items</span>
                    <button id="clear-filters" class="clear-btn">Clear All Filters</button>
                </div>
            </div>
            
            <!-- Pagination Controls (Top) -->
            <div class="pagination-controls pagination-top">
                <div class="pagination-info">
                    <span id="pagination-info-text">Showing 1-50 of {len(report.gaps)} items</span>
                </div>
                <div class="pagination-controls-group">
                    <label class="page-size-label">
                        Items per page:
                        <select id="page-size-select" class="page-size-select">
                            <option value="25">25</option>
                            <option value="50" selected>50</option>
                            <option value="100">100</option>
                            <option value="200">200</option>
                            <option value="all">All</option>
                        </select>
                    </label>
                    <div class="pagination-buttons">
                        <button id="first-page-btn" class="pagination-btn" title="First page" disabled>⏮️</button>
                        <button id="prev-page-btn" class="pagination-btn" title="Previous page" disabled>⏪</button>
                        <span id="page-indicator" class="page-indicator">Page 1 of 1</span>
                        <button id="next-page-btn" class="pagination-btn" title="Next page" disabled>⏩</button>
                        <button id="last-page-btn" class="pagination-btn" title="Last page" disabled>⏭️</button>
                    </div>
                </div>
            </div>
            
            <!-- Advanced Table Container with Max Height -->
            <div class="advanced-table-container">
                <table id="gaps-table" class="advanced-table">
                    <thead>
                        <tr>
                            {headers_html}
                        </tr>
                    </thead>
                    <tbody id="table-tbody">
                        {''.join(rows)}
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination Controls (Bottom) -->
            <div class="pagination-controls pagination-bottom">
                <div class="pagination-summary">
                    <span id="pagination-summary-text">Total: {len(report.gaps)} items</span>
                </div>
                <div class="pagination-buttons">
                    <button id="first-page-btn-bottom" class="pagination-btn" title="First page" disabled>⏮️</button>
                    <button id="prev-page-btn-bottom" class="pagination-btn" title="Previous page" disabled>⏪</button>
                    <span id="page-indicator-bottom" class="page-indicator">Page 1 of 1</span>
                    <button id="next-page-btn-bottom" class="pagination-btn" title="Next page" disabled>⏩</button>
                    <button id="last-page-btn-bottom" class="pagination-btn" title="Last page" disabled>⏭️</button>
                </div>
            </div>
            
            <!-- Table Status Bar -->
            <div class="table-status-bar">
                <div class="status-info">
                    <span id="table-info">Table initialized</span>
                </div>
                <div class="sort-info">
                    <span id="sort-status">Click column headers to sort. Click rows to view source code.</span>
                </div>
            </div>
            
            <!-- Column Picker Content (Injected by JavaScript) -->
            <div style="display: none;">
                <div id="column-picker-content">
                    {column_picker_html}
                </div>
            </div>
        </div>
        """
    
    def _generate_priority_breakdown(self, report: CoverageReport) -> str:
        """Generate priority breakdown section with filtering capabilities."""
        if not any(count > 0 for count in report.by_priority.values()):
            return ""
        
        priority_cards = []
        priority_info = {
            "critical": {"emoji": "🚨", "desc": "Immediate action required", "color": "quality-poor"},
            "high": {"emoji": "⚠️", "desc": "Action needed soon", "color": "quality-fair"},
            "medium": {"emoji": "📝", "desc": "Should be documented", "color": "quality-good"},
            "low": {"emoji": "💡", "desc": "Nice to have", "color": "quality-excellent"}
        }
        
        for priority, count in report.by_priority.items():
            if count > 0:
                info = priority_info[priority]
                priority_cards.append(f"""
                <div class="metric-card clickable-card" data-filter="{priority}" title="{info['emoji']} Click to filter and show only {priority} priority items - {info['desc']}">
                    <div class="metric-value {info['color']}">{count}</div>
                    <div class="metric-label">{info['emoji']} {priority.title()}</div>
                    <p style="font-size: var(--font-size-xs); margin-top: var(--spacing-xs);">{info['desc']}</p>
                </div>
                """)
        
        return f"""
        <div class="card">
            <h2>🎯 Priority Breakdown</h2>
            <div class="overview-grid">
                {''.join(priority_cards)}
            </div>
        </div>
        """
    
    def _generate_recommendations(self, report: CoverageReport) -> str:
        """Generate recommendations section."""
        recommendations = []
        min_coverage = self.config["documentation_standards"]["minimum_coverage_percentage"]
        
        # Generate recommendations based on the report
        if report.coverage_percentage < min_coverage:
            recommendations.append({
                'title': 'Low Documentation Coverage',
                'description': f'Current coverage ({report.coverage_percentage:.1f}%) is below the minimum requirement ({min_coverage}%). Focus on creating documentation for critical files.'
            })
        
        if report.quality_score < 0.7:
            recommendations.append({
                'title': 'Quality Improvement Needed',
                'description': f'Documentation quality score ({report.quality_score:.2f}) indicates room for improvement. Add missing sections and examples.'
            })
        
        if report.missing_documentation > 0:
            recommendations.append({
                'title': 'Missing Documentation Files',
                'description': f'{report.missing_documentation} files lack documentation entirely. Prioritize creating index.md files for these.'
            })
        
        if report.inadequate_documentation > 0:
            recommendations.append({
                'title': 'Inadequate Documentation',
                'description': f'{report.inadequate_documentation} files have incomplete documentation. Review and enhance these files.'
            })
        
        if not recommendations:
            recommendations.append({
                'title': 'Excellent Coverage!',
                'description': 'Your documentation coverage meets standards. Continue maintaining this quality level.'
            })
        
        rec_html = []
        for rec in recommendations:
            rec_html.append(f"""
            <div class="recommendation">
                <h4>{rec['title']}</h4>
                <p>{rec['description']}</p>
            </div>
            """)
        
        return f"""
        <div class="card">
            <h2>💡 Recommendations</h2>
            {''.join(rec_html)}
        </div>
        """
    
    def _generate_footer(self, report: CoverageReport) -> str:
        """Generate enhanced footer with improved layout and styling."""
        return f"""
        <div class="footer">
            <div class="footer-hero">
                <div class="footer-hero-content">
                    <h3>🎯 Documentation Coverage Analysis Complete</h3>
                    <p class="footer-subtitle">Comprehensive analysis of your codebase documentation</p>
                </div>
                <div class="footer-hero-stats">
                    <div class="hero-stat">
                        <span class="hero-stat-value">{report.total_code_files}</span>
                        <span class="hero-stat-label">Files Analyzed</span>
                    </div>
                    <div class="hero-stat">
                        <span class="hero-stat-value">{len(report.gaps)}</span>
                        <span class="hero-stat-label">Issues Found</span>
                    </div>
                    <div class="hero-stat">
                        <span class="hero-stat-value">{report.coverage_percentage:.1f}%</span>
                        <span class="hero-stat-label">Coverage</span>
                    </div>
                </div>
            </div>
            
            <div class="footer-content">
                <div class="footer-section">
                    <div class="footer-section-icon">📊</div>
                    <h4>Report Information</h4>
                    <div class="footer-info-grid">
                        <div class="info-item">
                            <span class="info-label">Generated by</span>
                            <span class="info-value">Idling.app Documentation Coverage Tool</span>
                </div>
                        <div class="info-item">
                            <span class="info-label">Analysis Engine</span>
                            <span class="info-value">Advanced Pattern Recognition</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Report Version</span>
                            <span class="info-value">2.0.0</span>
                        </div>
                    </div>
                </div>
                
                <div class="footer-section">
                    <div class="footer-section-icon">🕒</div>
                    <h4>Timestamp Information</h4>
                    <div class="footer-info-grid">
                        <div class="info-item">
                            <span class="info-label">Generated</span>
                            <span class="info-value timestamp-with-tooltip" data-timestamp="{report.timestamp}">
                        <span class="relative-time">Loading...</span>
                            </span>
                </div>
                        <div class="info-item">
                            <span class="info-label">Analysis Duration</span>
                            <span class="info-value">< 2 seconds</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Next Recommended Scan</span>
                            <span class="info-value">Weekly</span>
                        </div>
                    </div>
                </div>
                
                <div class="footer-section">
                    <div class="footer-section-icon">⚙️</div>
                    <h4>Configuration</h4>
                    <div class="footer-info-grid">
                        <div class="info-item">
                            <span class="info-label">Coverage Threshold</span>
                            <span class="info-value">85.0%</span>
                </div>
                        <div class="info-item">
                            <span class="info-label">Quality Threshold</span>
                            <span class="info-value">0.7</span>
            </div>
                        <div class="info-item">
                            <span class="info-label">Syntax Highlighting</span>
                            <span class="info-value">✅ Enabled</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="footer-tips">
                <div class="tip-section">
                    <h4>💡 Usage Tips</h4>
                    <ul class="tip-list">
                        <li>Click table rows to view source code with syntax highlighting</li>
                        <li>Click filenames to open files directly on GitHub</li>
                        <li>Use the search box to quickly find specific files or issues</li>
                        <li>Filter by priority or status using the overview cards</li>
                    </ul>
                </div>
                <div class="tip-section">
                    <h4>⌨️ Keyboard Shortcuts</h4>
                    <ul class="tip-list">
                        <li><kbd>Ctrl+F</kbd> Focus search box</li>
                        <li><kbd>Ctrl+K</kbd> Open column picker</li>
                        <li><kbd>Ctrl+Shift+D</kbd> Toggle theme</li>
                        <li><kbd>Escape</kbd> Close modals</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer-bottom">
                <div class="footer-branding">
                    <span class="footer-logo">🎯</span>
                    <div class="footer-brand-text">
                        <span class="brand-name">Idling.app</span>
                        <span class="brand-tagline">Documentation Coverage Tool</span>
                    </div>
                </div>
                <div class="footer-links">
                    <a href="https://github.com/idling-app" class="footer-link" target="_blank">
                        <span class="link-icon">🔗</span>
                        <span>GitHub</span>
                    </a>
                    <a href="#" class="footer-link" onclick="window.print(); return false;">
                        <span class="link-icon">🖨️</span>
                        <span>Print Report</span>
                    </a>
                    <a href="#" class="footer-link" onclick="document.getElementById('help-modal')?.classList.add('show'); return false;">
                        <span class="link-icon">❓</span>
                        <span>Help</span>
                    </a>
                </div>
            </div>
        </div>
        
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
    
    def _get_javascript(self) -> str:
        """Generate comprehensive JavaScript for all interactive features."""
        return r"""
        // Enhanced Table Manager with Fixed DOM Selectors
        class EnhancedTableManager {
            constructor() {
                this.table = null;
                this.allRows = [];
                this.filteredRows = [];
                this.currentPage = 1;
                this.pageSize = 50;
                this.totalPages = 1;
                this.currentFilter = 'all';
                this.searchTerm = '';
                this.sortState = { column: null, direction: 'asc', secondary: null };
                this.columnWidths = {};
                this.hiddenColumns = new Set();
                this.storageKey = 'docs-coverage-table-state';
                
                this.init();
            }
            
            init() {
                console.log('🔧 Initializing Enhanced Table Manager...');
                this.setupTable();
                this.setupPagination();
                this.setupModals();
                this.setupFilters();
                this.setupColumnManagement();
                this.setupTimestampTooltips();
                this.setupKeyboardShortcuts();
                this.loadPersistedState();
                this.updateDisplay();
                console.log('✅ Enhanced Table Manager initialized successfully!');
            }
            
            setupTable() {
                this.table = document.getElementById('gaps-table');
                if (!this.table) {
                    console.warn('⚠️ Table not found!');
                    return;
                }
                
                this.allRows = Array.from(this.table.querySelectorAll('tbody tr'));
                this.filteredRows = [...this.allRows];
                
                console.log(`📊 Found ${this.allRows.length} table rows`);
                
                // Setup row click handlers for source code modal
                this.allRows.forEach(row => {
                    row.addEventListener('click', (e) => {
                        // Don't trigger if clicking on filename (GitHub link)
                        if (e.target.classList.contains('clickable-filename')) {
                            return;
                        }
                        this.showSourceCodeModal(row);
                    });
                });
                
                // Setup filename click handlers for GitHub links
                this.table.querySelectorAll('.clickable-filename').forEach(filename => {
                    filename.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const githubUrl = filename.dataset.githubUrl;
                        if (githubUrl) {
                            console.log('🔗 Opening GitHub URL:', githubUrl);
                            window.open(githubUrl, '_blank');
                        }
                    });
                });
                
                // Setup column sorting
                this.table.querySelectorAll('th.sortable').forEach(th => {
                    th.addEventListener('click', (e) => {
                        const column = th.dataset.column;
                        const isMultiSort = e.shiftKey;
                        console.log(`🔄 Sorting column: ${column}, Multi-sort: ${isMultiSort}`);
                        this.toggleSort(column, isMultiSort);
                    });
                });
                
                // Setup column resizing
                this.setupColumnResizing();
                
                // Update table status
                const statusElement = document.getElementById('table-info');
                if (statusElement) {
                    statusElement.textContent = 'Table initialized';
                }
            }
            
            setupPagination() {
                // Page size selector
                const pageSizeSelect = document.getElementById('page-size-select');
                if (pageSizeSelect) {
                    pageSizeSelect.addEventListener('change', (e) => {
                        this.pageSize = e.target.value === 'all' ? this.filteredRows.length : parseInt(e.target.value);
                        this.currentPage = 1;
                        this.updateDisplay();
                        this.saveState();
                        console.log(`📄 Page size changed to: ${this.pageSize}`);
                    });
                }
                
                // Pagination buttons - top
                document.getElementById('first-page-btn')?.addEventListener('click', () => this.goToPage(1));
                document.getElementById('prev-page-btn')?.addEventListener('click', () => this.goToPage(this.currentPage - 1));
                document.getElementById('next-page-btn')?.addEventListener('click', () => this.goToPage(this.currentPage + 1));
                document.getElementById('last-page-btn')?.addEventListener('click', () => this.goToPage(this.totalPages));
                
                // Pagination buttons - bottom
                document.getElementById('first-page-btn-bottom')?.addEventListener('click', () => this.goToPage(1));
                document.getElementById('prev-page-btn-bottom')?.addEventListener('click', () => this.goToPage(this.currentPage - 1));
                document.getElementById('next-page-btn-bottom')?.addEventListener('click', () => this.goToPage(this.currentPage + 1));
                document.getElementById('last-page-btn-bottom')?.addEventListener('click', () => this.goToPage(this.totalPages));
                
                console.log('📄 Pagination handlers attached');
            }
            
            setupModals() {
                // Source code modal
                const sourceModal = document.getElementById('source-code-modal');
                if (sourceModal) {
                    const closeBtn = sourceModal.querySelector('.modal-close');
                    closeBtn?.addEventListener('click', () => this.closeSourceModal());
                    
                    sourceModal.addEventListener('click', (e) => {
                        if (e.target === sourceModal) {
                            this.closeSourceModal();
                        }
                    });
                }
                
                // Column picker modal
                const columnModal = document.getElementById('column-picker-modal');
                if (columnModal) {
                    const closeBtn = columnModal.querySelector('.modal-close');
                    closeBtn?.addEventListener('click', () => this.closeColumnModal());
                    
                    columnModal.addEventListener('click', (e) => {
                        if (e.target === columnModal) {
                            this.closeColumnModal();
                        }
                    });
                }
                
                // GitHub button in source modal
                const githubBtn = document.getElementById('open-github-btn');
                githubBtn?.addEventListener('click', () => {
                    const url = githubBtn.dataset.githubUrl;
                    if (url) {
                        window.open(url, '_blank');
                    }
                });
                
                console.log('🎭 Modal handlers attached');
            }
            
            setupFilters() {
                // Search input - using the correct ID
                const searchInput = document.getElementById('gap-search');
                if (searchInput) {
                    searchInput.addEventListener('input', (e) => {
                        this.searchTerm = e.target.value.toLowerCase();
                        this.currentPage = 1;
                        this.applyFilters();
                        this.saveState();
                        console.log(`🔍 Search term: ${this.searchTerm}`);
                    });
                }
                
                // Filter tags
                document.querySelectorAll('.filter-tag').forEach(tag => {
                    tag.addEventListener('click', () => {
                        // Remove active class from all tags
                        document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
                        // Add active class to clicked tag
                        tag.classList.add('active');
                        
                        this.currentFilter = tag.dataset.filter;
                        this.currentPage = 1;
                        this.applyFilters();
                        this.saveState();
                        console.log(`🏷️ Filter applied: ${this.currentFilter}`);
                    });
                });
                
                // Overview cards filtering
                document.querySelectorAll('.clickable-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const filter = card.dataset.filter;
                        console.log(`🔍 Card clicked with filter: ${filter}`);
                        if (filter) {
                            // Update active filter tag
                            document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
                            const matchingTag = document.querySelector(`.filter-tag[data-filter="${filter}"]`);
                            if (matchingTag) {
                                matchingTag.classList.add('active');
                                console.log(`✅ Found matching filter tag for: ${filter}`);
                            } else {
                                console.warn(`⚠️ No matching filter tag found for: ${filter}`);
                            }
                            
                            this.currentFilter = filter;
                            this.currentPage = 1;
                            this.applyFilters();
                            this.scrollToTable();
                            this.saveState();
                            console.log(`📊 Card filter applied: ${filter}, filtered rows: ${this.filteredRows.length}`);
                        } else {
                            console.warn(`⚠️ Card clicked but no filter attribute found`);
                        }
                    });
                });
                
                // Clear filters button
                const clearBtn = document.getElementById('clear-filters');
                clearBtn?.addEventListener('click', () => {
                    this.clearAllFilters();
                    console.log('🧹 All filters cleared');
                });
                
                console.log('🏷️ Filter handlers attached');
            }
            
            setupColumnManagement() {
                const columnPickerBtn = document.getElementById('column-picker-btn');
                columnPickerBtn?.addEventListener('click', () => {
                    this.showColumnPicker();
                });
                
                const resetTableBtn = document.getElementById('reset-table-btn');
                resetTableBtn?.addEventListener('click', () => {
                    this.resetTableSettings();
                });
                
                console.log('⚙️ Column management handlers attached');
            }
            
            setupTimestampTooltips() {
                // Initialize timestamp tooltips
                document.querySelectorAll('.timestamp-with-tooltip').forEach(element => {
                    const timestamp = element.dataset.timestamp;
                    if (timestamp) {
                        const relativeTimeElement = element.querySelector('.relative-time');
                        if (relativeTimeElement) {
                            try {
                                const date = new Date(timestamp);
                                const now = new Date();
                                const diffMs = now - date;
                                const diffMins = Math.floor(diffMs / 60000);
                                const diffHours = Math.floor(diffMs / 3600000);
                                const diffDays = Math.floor(diffMs / 86400000);
                                
                                let relativeTime;
                                if (diffMins < 1) {
                                    relativeTime = 'Just now';
                                } else if (diffMins < 60) {
                                    relativeTime = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
                                } else if (diffHours < 24) {
                                    relativeTime = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
                                } else if (diffDays < 7) {
                                    relativeTime = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
                                } else {
                                    relativeTime = date.toLocaleDateString();
                                }
                                
                                relativeTimeElement.textContent = relativeTime;
                                element.title = date.toLocaleString();
                            } catch (e) {
                                console.warn('Failed to parse timestamp:', timestamp, e);
                                relativeTimeElement.textContent = timestamp;
                            }
                        }
                    }
                });
                
                console.log('🕒 Timestamp tooltips initialized');
            }
            
            setupKeyboardShortcuts() {
                document.addEventListener('keydown', (e) => {
                    // Ctrl/Cmd + F for search
                    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                        e.preventDefault();
                        const searchInput = document.getElementById('gap-search');
                        if (searchInput) {
                            searchInput.focus();
                        }
                    }
                    
                    // Ctrl/Cmd + K for column picker
                    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                        e.preventDefault();
                        this.showColumnPicker();
                    }
                    
                    // Escape key to close modals
                    if (e.key === 'Escape') {
                        // Close column picker modal
                        const columnModal = document.getElementById('column-picker-modal');
                        if (columnModal && columnModal.classList.contains('show')) {
                            this.closeColumnModal();
                        }
                        
                        // Close source modal
                        const sourceModal = document.getElementById('source-code-modal');
                        if (sourceModal && sourceModal.classList.contains('show')) {
                            this.closeSourceModal();
                        }
                    }
                });
                
                console.log('⌨️ Keyboard shortcuts initialized');
            }
            
            applyFilters() {
                this.filteredRows = this.allRows.filter(row => {
                    // Filter by priority/status
                    if (this.currentFilter !== 'all') {
                        const priority = row.dataset.priority;
                        const gapType = row.dataset.gapType; // data-gap-type becomes gapType in camelCase
                        
                        // Debug logging for first few rows
                        if (this.filteredRows.length < 3) {
                            console.log(`Debug: Row priority=${priority}, gapType=${gapType}, filter=${this.currentFilter}`);
                        }
                        
                        // Handle gap type filters
                        if (this.currentFilter === 'missing' && gapType !== 'missing') return false;
                        if (this.currentFilter === 'inadequate' && gapType !== 'inadequate') return false;
                        
                        // Handle priority filters
                        if (['critical', 'high', 'medium', 'low'].includes(this.currentFilter) && priority !== this.currentFilter) return false;
                        
                        // Handle any other filters that don't match - return false to exclude
                        if (!['missing', 'inadequate', 'critical', 'high', 'medium', 'low'].includes(this.currentFilter)) {
                            console.warn(`Unknown filter: ${this.currentFilter}`);
                            return false;
                        }
                    }
                    
                    // Filter by search term
                    if (this.searchTerm) {
                        const fileName = row.dataset.fileName || '';
                        const expectedDoc = row.dataset.expectedDoc || '';
                        const searchText = `${fileName} ${expectedDoc}`.toLowerCase();
                        if (!searchText.includes(this.searchTerm)) return false;
                    }
                    
                    return true;
                });
                
                this.totalPages = Math.ceil(this.filteredRows.length / this.pageSize);
                if (this.currentPage > this.totalPages) {
                    this.currentPage = Math.max(1, this.totalPages);
                }
                
                this.updateDisplay();
                this.updateFilterStatus();
            }
            
            updateFilterStatus() {
                const statusElement = document.getElementById('filter-status');
                if (statusElement) {
                    const total = this.filteredRows.length;
                    const filterText = this.currentFilter === 'all' ? 'all' : this.currentFilter;
                    statusElement.textContent = `Showing ${total} ${filterText} items`;
                }
            }
            
            clearAllFilters() {
                this.currentFilter = 'all';
                this.searchTerm = '';
                this.currentPage = 1;
                
                // Reset UI
                const searchInput = document.getElementById('gap-search');
                if (searchInput) searchInput.value = '';
                
                document.querySelectorAll('.filter-tag').forEach(tag => {
                    tag.classList.toggle('active', tag.dataset.filter === 'all');
                });
                
                this.applyFilters();
                this.saveState();
            }
            
            toggleSort(column, isMultiSort) {
                if (!isMultiSort) {
                    // Single column sort
                    if (this.sortState.column === column) {
                        this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
                    } else {
                        this.sortState.column = column;
                        this.sortState.direction = 'asc';
                        this.sortState.secondary = null;
                    }
                } else {
                    // Multi-column sort
                    if (this.sortState.column === column) {
                        this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
                    } else if (this.sortState.secondary === column) {
                        // Toggle secondary sort direction
                        this.sortState.secondary = column;
                    } else {
                        // Set new secondary sort
                        this.sortState.secondary = this.sortState.column;
                        this.sortState.column = column;
                        this.sortState.direction = 'asc';
                    }
                }
                
                this.applySort();
                this.updateSortIndicators();
                this.updateDisplay();
                this.saveState();
            }
            
            applySort() {
                if (!this.sortState.column) return;
                
                this.filteredRows.sort((a, b) => {
                    const primaryResult = this.compareRows(a, b, this.sortState.column, this.sortState.direction);
                    
                    if (primaryResult !== 0 || !this.sortState.secondary) {
                        return primaryResult;
                    }
                    
                    return this.compareRows(a, b, this.sortState.secondary, 'asc');
                });
            }
            
            compareRows(rowA, rowB, column, direction) {
                const cellA = rowA.querySelector(`td.col-${column}`);
                const cellB = rowB.querySelector(`td.col-${column}`);
                
                if (!cellA || !cellB) return 0;
                
                const valueA = cellA.dataset.sort || cellA.textContent.trim();
                const valueB = cellB.dataset.sort || cellB.textContent.trim();
                
                let result = 0;
                
                // Handle numeric values
                if (!isNaN(valueA) && !isNaN(valueB)) {
                    result = parseFloat(valueA) - parseFloat(valueB);
                } else {
                    result = valueA.localeCompare(valueB);
                }
                
                return direction === 'desc' ? -result : result;
            }
            
            updateSortIndicators() {
                // Clear all indicators
                this.table.querySelectorAll('.sort-indicator').forEach(indicator => {
                    indicator.innerHTML = '';
                });
                
                // Add primary sort indicator
                if (this.sortState.column) {
                    const primaryTh = this.table.querySelector(`th[data-column="${this.sortState.column}"]`);
                    if (primaryTh) {
                        const indicator = primaryTh.querySelector('.sort-indicator');
                        if (indicator) {
                            const arrow = this.sortState.direction === 'asc' ? '↑' : '↓';
                            indicator.innerHTML = `<span class="sort-primary">${arrow}</span>`;
                        }
                    }
                }
                
                // Add secondary sort indicator
                if (this.sortState.secondary) {
                    const secondaryTh = this.table.querySelector(`th[data-column="${this.sortState.secondary}"]`);
                    if (secondaryTh) {
                        const indicator = secondaryTh.querySelector('.sort-indicator');
                        if (indicator) {
                            indicator.innerHTML += `<span class="sort-secondary">↑</span>`;
                        }
                    }
                }
                
                // Update sort status
                const sortStatus = document.getElementById('sort-status');
                if (sortStatus) {
                    if (this.sortState.column) {
                        const direction = this.sortState.direction === 'asc' ? 'ascending' : 'descending';
                        sortStatus.textContent = `Sorted by ${this.sortState.column} (${direction})`;
                    } else {
                        sortStatus.textContent = 'Click column headers to sort. Click rows to view source code.';
                    }
                }
            }
            
            goToPage(page) {
                if (page < 1 || page > this.totalPages) return;
                
                this.currentPage = page;
                this.updateDisplay();
                this.saveState();
                
                // Scroll to table
                this.scrollToTable();
            }
            
            scrollToTable() {
                const tableContainer = document.querySelector('.advanced-table-container');
                if (tableContainer) {
                    tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
            
            updateDisplay() {
                this.updateTableRows();
                this.updatePaginationInfo();
                this.updatePaginationButtons();
            }
            
            updateTableRows() {
                // Calculate pagination
                this.totalPages = Math.ceil(this.filteredRows.length / this.pageSize);
                const startIndex = (this.currentPage - 1) * this.pageSize;
                const endIndex = Math.min(startIndex + this.pageSize, this.filteredRows.length);
                
                // Hide all rows
                this.allRows.forEach(row => {
                    row.style.display = 'none';
                });
                
                // Show current page rows
                for (let i = startIndex; i < endIndex; i++) {
                    if (this.filteredRows[i]) {
                        this.filteredRows[i].style.display = '';
                    }
                }
            }
            
            updatePaginationInfo() {
                const startIndex = (this.currentPage - 1) * this.pageSize + 1;
                const endIndex = Math.min(this.currentPage * this.pageSize, this.filteredRows.length);
                
                const infoText = `Showing ${startIndex}-${endIndex} of ${this.filteredRows.length} items`;
                
                // Update both top and bottom pagination info
                const infoElements = [
                    document.getElementById('pagination-info-text'),
                    document.getElementById('pagination-summary-text')
                ];
                
                infoElements.forEach(element => {
                    if (element) {
                        element.textContent = infoText;
                    }
                });
                
                // Update page indicators
                const pageText = `Page ${this.currentPage} of ${this.totalPages}`;
                const pageElements = [
                    document.getElementById('page-indicator'),
                    document.getElementById('page-indicator-bottom')
                ];
                
                pageElements.forEach(element => {
                    if (element) {
                        element.textContent = pageText;
                    }
                });
            }
            
            updatePaginationButtons() {
                const buttons = [
                    { ids: ['first-page-btn', 'first-page-btn-bottom'], condition: this.currentPage <= 1 },
                    { ids: ['prev-page-btn', 'prev-page-btn-bottom'], condition: this.currentPage <= 1 },
                    { ids: ['next-page-btn', 'next-page-btn-bottom'], condition: this.currentPage >= this.totalPages },
                    { ids: ['last-page-btn', 'last-page-btn-bottom'], condition: this.currentPage >= this.totalPages }
                ];
                
                buttons.forEach(({ ids, condition }) => {
                    ids.forEach(id => {
                        const btn = document.getElementById(id);
                        if (btn) {
                            btn.disabled = condition;
                        }
                    });
                });
            }
            
            showSourceCodeModal(row) {
                const fileName = row.dataset.fileName || 'Unknown File';
                const githubUrl = row.dataset.githubUrl || '';
                
                const modal = document.getElementById('source-code-modal');
                if (!modal) {
                    console.warn('Source code modal not found');
                    return;
                }
                
                // Get modal elements
                const title = modal.querySelector('#source-modal-title');
                const loadingDiv = modal.querySelector('#source-loading');
                const errorDiv = modal.querySelector('#source-error');
                const contentDiv = modal.querySelector('#source-code-content');
                const codeElement = modal.querySelector('#source-code-text');
                const githubBtn = modal.querySelector('#open-github-btn');
                
                // Update modal content
                if (title) title.textContent = `📄 ${fileName}`;
                if (githubBtn) githubBtn.dataset.githubUrl = githubUrl;
                
                // Show modal and loading state
                modal.style.display = 'flex';
                setTimeout(() => modal.classList.add('show'), 10);
                
                // Reset modal state - show loading
                if (loadingDiv) loadingDiv.style.display = 'block';
                if (errorDiv) errorDiv.style.display = 'none';
                if (contentDiv) contentDiv.style.display = 'none';
                
                console.log(`🎭 Source modal opened for: ${fileName}`);
                
                // Load source code preview after a short delay
                setTimeout(() => {
                    this.loadSourceCodePreview(fileName, loadingDiv, errorDiv, contentDiv, codeElement);
                }, 500);
            }
            
            loadSourceCodePreview(fileName, loadingDiv, errorDiv, contentDiv, codeElement) {
                try {
                    // Hide loading, show content
                    if (loadingDiv) loadingDiv.style.display = 'none';
                    if (contentDiv) contentDiv.style.display = 'block';
                    
                    // Get file extension for syntax highlighting
                    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                    const language = this.getLanguageFromExtension(fileExtension);
                    
                    // Get the source preview from the row data attribute
                    const row = document.querySelector(`[data-file-name="${fileName}"]`);
                    const sourcePreview = row?.dataset.sourcePreview;
                    
                    if (sourcePreview && sourcePreview !== 'undefined') {
                        // Decode HTML entities back to normal text and handle HTML content
                        const decodedContent = sourcePreview
                            .replace(/&amp;/g, '&')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"')
                            .replace(/&#x27;/g, "'");
                        
                        if (codeElement) {
                            // Check if content is HTML (contains tags) or plain text
                            if (decodedContent.includes('<div') || decodedContent.includes('<span')) {
                                // Content is pre-formatted HTML with syntax highlighting
                                codeElement.innerHTML = decodedContent;
                                codeElement.className = 'highlighted-code';
                            } else {
                                // Content is plain text
                                codeElement.textContent = decodedContent;
                                codeElement.className = `language-${language}`;
                            }
                        }
                        
                        console.log(`✅ Real source code loaded for: ${fileName}`);
                    } else {
                        // Fallback if no source preview available
                        const fallbackContent = `// Source code preview not available for: ${fileName}
//
// This could be because:
// 1. The file couldn't be read during report generation
// 2. The file is too large to embed
// 3. The file contains binary content
//
// To view the source code:
// • Click the "GitHub" button above to open the file online
// • Or open the file directly in your editor: ${fileName}
//
// File information:
// • Type: ${language.toUpperCase()}
// • Status: Needs documentation
// • Location: ${fileName}`;
                        
                        if (codeElement) {
                            codeElement.textContent = fallbackContent;
                            codeElement.className = `language-${language}`;
                        }
                        
                        console.log(`⚠️ Using fallback content for: ${fileName}`);
                    }
                    
                } catch (error) {
                    console.error('Error loading source preview:', error);
                    if (loadingDiv) loadingDiv.style.display = 'none';
                    if (errorDiv) {
                        errorDiv.style.display = 'block';
                        const errorMessage = errorDiv.querySelector('#source-error-message');
                        if (errorMessage) {
                            errorMessage.textContent = `Could not load preview for ${fileName}`;
                        }
                    }
                }
            }
            
            async fetchFileContent(fileName) {
                // Try different approaches to get file content
                
                // Approach 1: Try to fetch as if it's served by a local server
                try {
                    const response = await fetch(`/${fileName}`);
                    if (response.ok) {
                        return await response.text();
                    }
                } catch (e) {
                    console.log('Local server fetch failed:', e.message);
                }
                
                // Approach 2: Try relative path
                try {
                    const response = await fetch(fileName);
                    if (response.ok) {
                        return await response.text();
                    }
                } catch (e) {
                    console.log('Relative path fetch failed:', e.message);
                }
                
                // Approach 3: Try file:// protocol (will likely fail due to CORS)
                try {
                    const response = await fetch(`file://${window.location.pathname.replace('/documentation-coverage-report.html', '')}/${fileName}`);
                    if (response.ok) {
                        return await response.text();
                    }
                } catch (e) {
                    console.log('File protocol fetch failed:', e.message);
                }
                
                // If all approaches fail, throw error to trigger fallback
                throw new Error('Cannot access local files from browser');
            }
            
            getLanguageFromExtension(extension) {
                const languageMap = {
                    'ts': 'typescript',
                    'tsx': 'typescript',
                    'js': 'javascript',
                    'jsx': 'javascript',
                    'py': 'python',
                    'md': 'markdown',
                    'json': 'json',
                    'css': 'css',
                    'scss': 'scss',
                    'html': 'html',
                    'yml': 'yaml',
                    'yaml': 'yaml'
                };
                return languageMap[extension] || 'text';
            }
            
            getFilePriority(fileName) {
                // Determine priority based on file path and type
                if (fileName.includes('/api/') || fileName.includes('/routes/')) return 'High';
                if (fileName.includes('/components/') || fileName.includes('/pages/')) return 'Medium';
                if (fileName.includes('/utils/') || fileName.includes('/lib/')) return 'Medium';
                if (fileName.includes('/types/') || fileName.includes('/interfaces/')) return 'Low';
                return 'Medium';
            }
            
            closeSourceModal() {
                const modal = document.getElementById('source-code-modal');
                if (modal) {
                    modal.classList.remove('show');
                    setTimeout(() => modal.style.display = 'none', 300);
                }
            }
            
            showColumnPicker() {
                const modal = document.getElementById('column-picker-modal');
                if (modal) {
                    // First populate the column picker content
                    this.renderColumnPicker();
                    
                    // Then show the modal
                    modal.style.display = 'flex';
                    setTimeout(() => modal.classList.add('show'), 10);
                }
            }
            
            renderColumnPicker() {
                const picker = document.querySelector('.column-picker');
                if (!picker) return;
                
                // Define available columns
                const columns = [
                    { id: 'file', label: 'File Path', essential: true },
                    { id: 'status', label: 'Status', essential: false },
                    { id: 'priority', label: 'Priority', essential: false },
                    { id: 'expected', label: 'Expected Documentation', essential: false },
                    { id: 'effort', label: 'Effort', essential: false },
                    { id: 'issues', label: 'Quality Issues', essential: false },
                    { id: 'type', label: 'File Type', essential: false },
                    { id: 'size', label: 'Estimated Size', essential: false }
                ];
                
                // Generate column picker HTML
                picker.innerHTML = columns.map(col => {
                    const isVisible = !this.hiddenColumns.has(col.id);
                    const essentialClass = col.essential ? 'essential' : '';
                    const disabled = col.essential ? 'disabled' : '';
                    const checked = isVisible ? 'checked' : '';
                    
                    return `
                        <div class="column-item ${essentialClass}">
                            <input type="checkbox" 
                                   class="column-checkbox" 
                                   id="col-${col.id}" 
                                   data-column="${col.id}"
                                   ${checked} ${disabled}>
                            <label for="col-${col.id}" class="column-label">${col.label}</label>
                            ${col.essential ? '<span class="column-essential">Essential</span>' : ''}
                        </div>
                    `;
                }).join('');
                
                // Setup event handlers for checkboxes (no immediate toggle)
                picker.querySelectorAll('.column-checkbox').forEach(checkbox => {
                    checkbox.addEventListener('change', (e) => {
                        // Just update the checkbox state, don't apply changes yet
                        console.log(`📝 Column ${e.target.dataset.column} ${e.target.checked ? 'checked' : 'unchecked'} (pending)`);
                        
                        // Add visual indicator for pending changes
                        this.updateApplyButtonState();
                    });
                });
                
                // Initial button state
                this.updateApplyButtonState();
                
                // Setup modal footer buttons
                const resetBtn = document.getElementById('reset-columns-btn');
                const applyBtn = document.getElementById('apply-columns-btn');
                
                if (resetBtn) {
                    resetBtn.onclick = () => this.resetColumns();
                }
                
                if (applyBtn) {
                    applyBtn.onclick = () => this.applyColumnChanges();
                }
            }
            
            toggleColumn(column, isVisible) {
                const table = document.getElementById('gaps-table');
                if (!table) return;
                
                // Update hidden columns set
                if (isVisible) {
                    this.hiddenColumns.delete(column);
                } else {
                    this.hiddenColumns.add(column);
                }
                
                // Toggle column visibility
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
                // Reset to default visible columns
                this.hiddenColumns.clear();
                this.hiddenColumns.add('type');
                this.hiddenColumns.add('size');
                
                // Update all checkboxes
                document.querySelectorAll('.column-checkbox').forEach(checkbox => {
                    const column = checkbox.dataset.column;
                    const isVisible = !this.hiddenColumns.has(column);
                    checkbox.checked = isVisible;
                    this.toggleColumn(column, isVisible);
                });
                
                console.log('🔄 Columns reset to default');
            }
            
            updateApplyButtonState() {
                const applyBtn = document.getElementById('apply-columns-btn');
                if (!applyBtn) return;
                
                // Check if there are any pending changes
                const picker = document.querySelector('.column-picker');
                let hasPendingChanges = false;
                
                if (picker) {
                    picker.querySelectorAll('.column-checkbox').forEach(checkbox => {
                        const column = checkbox.dataset.column;
                        const currentlyVisible = !this.hiddenColumns.has(column);
                        const checkboxChecked = checkbox.checked;
                        
                        if (currentlyVisible !== checkboxChecked) {
                            hasPendingChanges = true;
                        }
                    });
                }
                
                // Update button appearance
                if (hasPendingChanges) {
                    applyBtn.style.background = 'linear-gradient(135deg, #ff6b35 0%, #f39c12 100%)';
                    applyBtn.style.boxShadow = '0 4px 16px rgba(255, 107, 53, 0.4)';
                    applyBtn.style.animation = 'pulse 2s infinite';
                } else {
                    applyBtn.style.background = '';
                    applyBtn.style.boxShadow = '';
                    applyBtn.style.animation = '';
                }
            }
            
            applyColumnChanges() {
                // Apply all checkbox states to actual columns
                const picker = document.querySelector('.column-picker');
                if (picker) {
                    picker.querySelectorAll('.column-checkbox').forEach(checkbox => {
                        const column = checkbox.dataset.column;
                        const isVisible = checkbox.checked;
                        this.toggleColumn(column, isVisible);
                    });
                }
                
                // Save state
                this.saveState();
                
                // Close modal
                this.closeColumnModal();
                
                console.log('✅ Column changes applied and saved');
            }
            
            closeColumnModal() {
                const modal = document.getElementById('column-picker-modal');
                if (modal) {
                    modal.classList.remove('show');
                    setTimeout(() => modal.style.display = 'none', 300);
                }
            }
            
            setupColumnResizing() {
                if (!this.table) return;
                
                const headers = this.table.querySelectorAll('th');
                headers.forEach(th => {
                    const resizer = th.querySelector('.resize-handle');
                    if (resizer) {
                        let isResizing = false;
                        let startX = 0;
                        let startWidth = 0;
                        
                        resizer.addEventListener('mousedown', (e) => {
                            isResizing = true;
                            startX = e.clientX;
                            startWidth = parseInt(window.getComputedStyle(th).width, 10);
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                            e.preventDefault();
                        });
                        
                        const handleMouseMove = (e) => {
                            if (!isResizing) return;
                            const width = startWidth + e.clientX - startX;
                            th.style.width = Math.max(50, width) + 'px';
                            this.columnWidths[th.dataset.column] = Math.max(50, width);
                        };
                        
                        const handleMouseUp = () => {
                            isResizing = false;
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                            this.saveState();
                        };
                    }
                });
            }
            
            saveState() {
                try {
                    const state = {
                        currentFilter: this.currentFilter,
                        searchTerm: this.searchTerm,
                        currentPage: this.currentPage,
                        pageSize: this.pageSize,
                        sortState: this.sortState,
                        columnWidths: this.columnWidths,
                        hiddenColumns: Array.from(this.hiddenColumns)
                    };
                    localStorage.setItem(this.storageKey, JSON.stringify(state));
                } catch (e) {
                    console.warn('Failed to save table state:', e);
                }
            }
            
            loadPersistedState() {
                try {
                    const saved = localStorage.getItem(this.storageKey);
                    if (saved) {
                        const state = JSON.parse(saved);
                        this.currentFilter = state.currentFilter || 'all';
                        this.searchTerm = state.searchTerm || '';
                        this.currentPage = state.currentPage || 1;
                        this.pageSize = state.pageSize || 50;
                        this.sortState = state.sortState || { column: null, direction: 'asc', secondary: null };
                        this.columnWidths = state.columnWidths || {};
                        this.hiddenColumns = new Set(state.hiddenColumns || []);
                        
                        // Apply loaded state to UI
                        const searchInput = document.getElementById('gap-search');
                        if (searchInput) searchInput.value = this.searchTerm;
                        
                        document.querySelectorAll('.filter-tag').forEach(tag => {
                            tag.classList.toggle('active', tag.dataset.filter === this.currentFilter);
                        });
                        
                        this.applyColumnWidths();
                        this.updateSortIndicators();
                    }
                } catch (e) {
                    console.warn('Failed to load persisted table state:', e);
                }
            }
            
            applyColumnWidths() {
                Object.entries(this.columnWidths).forEach(([column, width]) => {
                    const th = this.table.querySelector(`th[data-column="${column}"]`);
                    if (th) {
                        th.style.width = width + 'px';
                    }
                });
            }
            
            resetTableSettings() {
                localStorage.removeItem(this.storageKey);
                location.reload();
            }
        }
        
        // Theme Manager
        class ThemeManager {
            constructor() {
                this.currentTheme = this.getStoredTheme() || this.getPreferredTheme();
                this.init();
            }
            
            init() {
                this.applyTheme(this.currentTheme);
                this.setupThemeToggle();
                this.setupMediaQuery();
            }
            
            getStoredTheme() {
                return localStorage.getItem('docs-coverage-theme');
            }
            
            getPreferredTheme() {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            
            applyTheme(theme) {
                document.documentElement.setAttribute('data-theme', theme);
                localStorage.setItem('docs-coverage-theme', theme);
                this.currentTheme = theme;
                this.updateThemeToggle();
            }
            
            setupThemeToggle() {
                const toggle = document.getElementById('theme-toggle-btn');
                if (toggle) {
                    toggle.addEventListener('click', () => {
                        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
                        this.applyTheme(newTheme);
                    });
                }
            }
            
            setupMediaQuery() {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                mediaQuery.addEventListener('change', (e) => {
                    if (!this.getStoredTheme()) {
                        this.applyTheme(e.matches ? 'dark' : 'light');
                    }
                });
            }
            
            updateThemeToggle() {
                const toggle = document.getElementById('theme-toggle-btn');
                if (toggle) {
                    toggle.setAttribute('aria-label', `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} theme`);
                }
            }
        }
        
        // Initialize everything when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 Initializing Documentation Coverage Report...');
            new ThemeManager();
            new EnhancedTableManager();
            console.log('✅ Documentation Coverage Report fully loaded!');
        });
        
        // Additional keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                const toggle = document.getElementById('theme-toggle-btn');
                if (toggle) {
                    toggle.click();
                }
            }
        });
        
        """
    
    def _get_priority_badge(self, priority: str) -> str:
        """Get priority badge HTML."""
        badges = {
            'critical': '<span class="badge badge-error">🚨 Critical</span>',
            'high': '<span class="badge badge-warning">⚠️ High</span>',
            'medium': '<span class="badge badge-info">📝 Medium</span>',
            'low': '<span class="badge badge-success">💡 Low</span>'
        }
        return badges.get(priority, '<span class="badge">Unknown</span>')
    
    def _get_gap_status_badge(self, gap_type: str) -> str:
        """Get gap status badge HTML."""
        badges = {
            'missing': '<span class="badge badge-error">❌ Missing</span>',
            'inadequate': '<span class="badge badge-warning">⚠️ Inadequate</span>',
            'outdated': '<span class="badge badge-info">🔄 Outdated</span>'
        }
        return badges.get(gap_type, '<span class="badge">Unknown</span>')
    
    def _get_coverage_class(self, coverage_pct: float, min_coverage: float) -> str:
        """Get CSS class for coverage percentage."""
        if coverage_pct >= min_coverage:
            return 'quality-excellent'
        elif coverage_pct >= min_coverage * 0.8:
            return 'quality-good'
        elif coverage_pct >= min_coverage * 0.6:
            return 'quality-fair'
        else:
            return 'quality-poor'
    
    def _get_quality_class(self, quality_score: float) -> str:
        """Get CSS class for quality score."""
        if quality_score >= 0.8:
            return 'quality-excellent'
        elif quality_score >= 0.6:
            return 'quality-good'
        elif quality_score >= 0.4:
            return 'quality-fair'
        else:
            return 'quality-poor'
    
    def _get_status_class(self, is_good: bool) -> str:
        """Get CSS class for status."""
        return 'quality-excellent' if is_good else 'quality-poor'
    
    def _estimate_doc_size(self, effort: str) -> str:
        """Estimate documentation size based on effort."""
        size_map = {
            'low': 'Small (< 500 words)',
            'medium': 'Medium (500-1500 words)', 
            'high': 'Large (1500+ words)'
        }
        return size_map.get(effort.lower(), 'Unknown')
    
    def _get_priority_sort_value(self, priority: str) -> int:
        """Get numeric sort value for priority (higher number = higher priority)."""
        priority_values = {
            'critical': 4,
            'high': 3,
            'medium': 2,
            'low': 1
        }
        return priority_values.get(priority.lower(), 0)
    
    def _get_effort_sort_value(self, effort: str) -> int:
        """Get numeric sort value for effort (higher number = more effort)."""
        effort_values = {
            'low': 1,
            'medium': 2,
            'high': 3
        }
        return effort_values.get(effort.lower(), 0)
    
    
    
    def _highlight_with_hljs(self, content: str, file_path: str) -> str:
        """Use highlight.js via Node.js to highlight code with proper TSX/JSX support."""
        import subprocess
        import json
        import tempfile
        import os
        
        # Map file extensions to highlight.js language names
        ext = file_path.split('.')[-1].lower()
        language_map = {
            'ts': 'typescript',
            'tsx': 'typescript',  # highlight.js handles TSX well with typescript
            'js': 'javascript',
            'jsx': 'javascript',  # highlight.js handles JSX well with javascript
            'py': 'python',
            'md': 'markdown',
            'json': 'json',
            'css': 'css',
            'scss': 'scss',
            'html': 'html',
            'htm': 'html',
            'xml': 'xml',
            'yml': 'yaml',
            'yaml': 'yaml',
            'sh': 'bash',
            'bash': 'bash',
            'zsh': 'bash',
            'txt': 'plaintext',
            'log': 'plaintext'
        }
        
        language = language_map.get(ext, 'plaintext')
        
        # Create a temporary Node.js script file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as temp_script:
            # Properly escape the content for JavaScript - avoid template literals for the code content
            escaped_content = json.dumps(content)  # This properly escapes all special characters
            
            temp_script.write(f'''
const hljs = require('highlight.js');
const fs = require('fs');

// Read the code content (properly escaped as JSON)
const code = {escaped_content};
const language = '{language}';

try {{
    let result;
    if (language === 'plaintext') {{
        result = hljs.highlightAuto(code);
    }} else {{
        result = hljs.highlight(code, {{ language: language }});
    }}
    
    // Add line numbers to the highlighted HTML
    const lines = result.value.split('\\n');
    const numberedLines = lines.map((line, index) => {{
        const lineNum = index + 1;
        return `<span class="line-wrapper"><span class="line-number">${{lineNum.toString().padStart(3, ' ')}}</span> <span class="line-content">${{line}}</span></span>`;
    }});
    
    const finalHtml = `<div class="hljs-code-preview"><div class="hljs-lines">${{numberedLines.join('')}}</div></div>`;
    console.log(finalHtml);
}} catch (error) {{
    console.error('Highlighting failed:', error.message);
    process.exit(1);
}}
''')
            temp_script_path = temp_script.name
        
        try:
            # Check if Node.js and highlight.js are available
            result = subprocess.run(['node', '--version'], capture_output=True, text=True, timeout=5)
            if result.returncode != 0:
                raise Exception("Node.js not available")
            
            # Get the current working directory (project root)
            project_root = os.getcwd()
            
            # Check if highlight.js is installed in the project
            hljs_check = subprocess.run(['node', '-e', 'require("highlight.js")'], 
                                      capture_output=True, text=True, timeout=5, cwd=project_root)
            if hljs_check.returncode != 0:
                raise Exception("highlight.js not found in project. Please run: npm install highlight.js")
            
            # Run the highlighting script from the project directory
            # Use NODE_PATH to ensure the script can find node_modules
            env = os.environ.copy()
            env['NODE_PATH'] = os.path.join(project_root, 'node_modules')
            
            result = subprocess.run(
                ['node', temp_script_path],
                capture_output=True,
                text=True,
                timeout=10,
                cwd=project_root,
                env=env
            )
            
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip()
            else:
                raise Exception(f"Node.js highlighting failed: {result.stderr}")
                
        except Exception as e:
            raise Exception(f"highlight.js subprocess failed: {str(e)}")
        finally:
            # Clean up the temporary script file
            try:
                os.unlink(temp_script_path)
            except:
                pass
    
    def _generate_console_summary(self, report: CoverageReport) -> str:
        """Generate console summary."""
        return f"""
🎨 Beautiful HTML Report Generated! ✨

📊 Coverage Summary:
   • Total Files: {report.total_code_files}
   • Documented: {report.adequately_documented}
   • Coverage: {report.coverage_percentage:.1f}%
   • Quality Score: {report.quality_score:.2f}

📄 Report Details:
   • File: {self.output_file}
   • Theme: Dark/Light support with product colors
   • Features: Interactive, responsive, accessible

🧙‍♂️ Open the HTML file in your browser to explore the beautiful report with Idling.app's signature golden theme!
        """
    
    def _get_modals(self) -> str:
        """Generate modal dialogs for the report."""
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
    
    def _get_file_preview(self, file_path: str) -> str:
        """Get a syntax-highlighted preview of the source file content for embedding in the modal."""
        try:
            # Try to read the file content
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Limit content size for HTML embedding (first 30 lines or 2000 chars for faster processing)
            lines = content.split('\n')
            truncated = False
            if len(lines) > 30:
                content = '\n'.join(lines[:30])
                truncated = True
            elif len(content) > 2000:
                content = content[:2000]
                truncated = True
            
            # Only use syntax highlighting if enabled (it's slow due to subprocess calls)
            if self.enable_syntax_highlighting:
                # Try to use highlight.js via Node.js for better TSX/JSX support
                try:
                    highlighted_html = self._highlight_with_hljs(content, file_path)
                    if highlighted_html:
                        if truncated:
                            highlighted_html += '<div class="truncation-notice">📄 File continues... <span class="truncation-hint">Click GitHub button to view complete file</span></div>'
                        return highlighted_html
                except Exception as e:
                    print(f"highlight.js failed for {file_path}: {e}")
                    # Fall through to fallback
            
            # Fallback to plain text with basic HTML structure
            content_escaped = content.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            
            # Add line numbers manually for plain text
            lines = content_escaped.split('\n')
            numbered_lines = []
            for i, line in enumerate(lines, 1):
                numbered_lines.append(f'<span class="line-number">{i:3d}</span> <span class="line-content">{line}</span>')
            
            plain_html = f'<div class="code-preview plain-text">{"".join(numbered_lines)}</div>'
            
            if truncated:
                plain_html += '<div class="truncation-notice">📄 File continues... <span class="truncation-hint">Click GitHub button to view complete file</span></div>'
            
            return plain_html
            
        except Exception as e:
            # If file can't be read, return a helpful message
            return f'''<div class="error-preview">
                <h4>❌ Could not read file: {file_path}</h4>
                <p><strong>Error:</strong> {str(e)}</p>
                <p>This file exists but couldn't be read for the preview.</p>
                <p>Click the GitHub button to view it online.</p>
            </div>'''
    
    def _highlight_batch_with_hljs(self, file_contents: Dict[str, str]) -> Dict[str, str]:
        """Use highlight.js via Node.js to highlight multiple files in a single call for better performance."""
        import subprocess
        import json
        import tempfile
        import os
        
        if not file_contents:
            return {}
            
        # Map file extensions to highlight.js language names
        def get_language(file_path: str) -> str:
            ext = file_path.split('.')[-1].lower()
            language_map = {
                'ts': 'typescript',
                'tsx': 'typescript',
                'js': 'javascript',
                'jsx': 'javascript',
                'py': 'python',
                'md': 'markdown',
                'json': 'json',
                'css': 'css',
                'scss': 'scss',
                'html': 'html',
                'htm': 'html',
                'xml': 'xml',
                'yml': 'yaml',
                'yaml': 'yaml',
                'sh': 'bash',
                'bash': 'bash',
                'zsh': 'bash',
                'txt': 'plaintext',
                'log': 'plaintext'
            }
            return language_map.get(ext, 'plaintext')
        
        # Prepare the batch data
        batch_data = {}
        for file_path, content in file_contents.items():
            batch_data[file_path] = {
                'content': content,
                'language': get_language(file_path)
            }
        
        # Create a temporary Node.js script file for batch processing
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as temp_script:
            # Use JSON to safely pass the batch data
            batch_json = json.dumps(batch_data)
            
            temp_script.write(f'''
const hljs = require('highlight.js');
const fs = require('fs');

// Read the batch data (properly escaped as JSON)
const batchData = {batch_json};
const results = {{}};

for (const [filePath, fileData] of Object.entries(batchData)) {{
    try {{
        const {{ content, language }} = fileData;
        
        let result;
        if (language === 'plaintext') {{
            result = hljs.highlightAuto(content);
        }} else {{
            result = hljs.highlight(content, {{ language: language }});
        }}
        
        // Add line numbers to the highlighted HTML
        const lines = result.value.split('\\n');
        const numberedLines = lines.map((line, index) => {{
            const lineNum = index + 1;
            return `<span class="line-wrapper"><span class="line-number">${{lineNum.toString().padStart(3, ' ')}}</span> <span class="line-content">${{line}}</span></span>`;
        }});
        
        const finalHtml = `<div class="hljs-code-preview"><div class="hljs-lines">${{numberedLines.join('')}}</div></div>`;
        results[filePath] = finalHtml;
    }} catch (error) {{
        console.error(`Highlighting failed for ${{filePath}}:`, error.message);
        results[filePath] = null;
    }}
}}

console.log(JSON.stringify(results));
''')
            temp_script_path = temp_script.name
        
        try:
            # Check if Node.js and highlight.js are available
            result = subprocess.run(['node', '--version'], capture_output=True, text=True, timeout=5)
            if result.returncode != 0:
                raise Exception("Node.js not available")
            
            # Get the current working directory (project root)
            project_root = os.getcwd()
            
            # Check if highlight.js is installed in the project
            hljs_check = subprocess.run(['node', '-e', 'require("highlight.js")'], 
                                      capture_output=True, text=True, timeout=5, cwd=project_root)
            if hljs_check.returncode != 0:
                raise Exception("highlight.js not found in project. Please run: npm install highlight.js")
            
            # Run the highlighting script from the project directory
            # Use NODE_PATH to ensure the script can find node_modules
            env = os.environ.copy()
            env['NODE_PATH'] = os.path.join(project_root, 'node_modules')
            
            result = subprocess.run(
                ['node', temp_script_path],
                capture_output=True,
                text=True,
                timeout=30,  # Increased timeout for batch processing
                cwd=project_root,
                env=env
            )
            
            if result.returncode == 0 and result.stdout.strip():
                return json.loads(result.stdout.strip())
            else:
                raise Exception(f"Node.js highlighting failed: {result.stderr}")
                
        except Exception as e:
            raise Exception(f"highlight.js batch subprocess failed: {str(e)}")
        finally:
            # Clean up the temporary script file
            try:
                os.unlink(temp_script_path)
            except:
                pass