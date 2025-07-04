#!/usr/bin/env python3
"""
CSS Styles for HTML Documentation Coverage Report

Provides comprehensive styling with Idling.app's golden brand theme,
improved contrast, and enhanced table functionality.
"""

def get_css_styles() -> str:
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
    }
    
    .line-content {
        display: inline;
        color: var(--code-text);
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
    
    .hljs-selector-tag {
        color: #ef4444;
    }
    
    .hljs-selector-class {
        color: #f59e0b;
    }
    
    .hljs-selector-id {
        color: #f59e0b;
    }
    
    .hljs-regexp {
        color: #22c55e;
    }
    
    .hljs-deletion {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
    }
    
    .hljs-addition {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
    }
    
    .hljs-emphasis {
        font-style: italic;
    }
    
    .hljs-strong {
        font-weight: 700;
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
    [data-theme="dark"] .hljs-code-preview {
        background: var(--dark-bg-tertiary);
        color: var(--dark-text-primary);
        border-color: var(--dark-border);
    }
    
    [data-theme="dark"] .line-number {
        color: var(--dark-text-secondary);
    }
    
    [data-theme="dark"] .line-content {
        color: var(--dark-text-primary);
    }
    
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
    
    [data-theme="dark"] .hljs-selector-tag {
        color: #f87171;
    }
    
    [data-theme="dark"] .hljs-selector-class,
    [data-theme="dark"] .hljs-selector-id {
        color: #fbbf24;
    }
    
    [data-theme="dark"] .hljs-regexp {
        color: #4ade80;
    }
    
    /* Auto theme detection for syntax highlighting */
    @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]) .hljs-code-preview {
            background: var(--dark-bg-tertiary);
            color: var(--dark-text-primary);
            border-color: var(--dark-border);
        }
        
        :root:not([data-theme="light"]) .line-number {
            color: var(--dark-text-secondary);
        }
        
        :root:not([data-theme="light"]) .line-content {
            color: var(--dark-text-primary);
        }
        
        :root:not([data-theme="light"]) .hljs-keyword {
            color: var(--brand-secondary);
        }
        
        :root:not([data-theme="light"]) .hljs-string {
            color: #4ade80;
        }
        
        :root:not([data-theme="light"]) .hljs-number {
            color: #fbbf24;
        }
        
        :root:not([data-theme="light"]) .hljs-comment {
            color: var(--dark-text-secondary);
            opacity: 0.7;
        }
        
        :root:not([data-theme="light"]) .hljs-function,
        :root:not([data-theme="light"]) .hljs-title.function_ {
            color: #60a5fa;
        }
        
        :root:not([data-theme="light"]) .hljs-variable.language_ {
            color: #a78bfa;
        }
        
        :root:not([data-theme="light"]) .hljs-title.class_ {
            color: #fbbf24;
        }
        
        :root:not([data-theme="light"]) .hljs-property,
        :root:not([data-theme="light"]) .hljs-attr {
            color: #22d3ee;
        }
        
        :root:not([data-theme="light"]) .hljs-built_in {
            color: #a78bfa;
        }
        
        :root:not([data-theme="light"]) .hljs-literal {
            color: #fbbf24;
        }
        
        :root:not([data-theme="light"]) .hljs-operator {
            color: var(--brand-secondary);
        }
        
        :root:not([data-theme="light"]) .hljs-tag,
        :root:not([data-theme="light"]) .hljs-name {
            color: #f87171;
        }
        
        :root:not([data-theme="light"]) .hljs-selector-tag {
            color: #f87171;
        }
        
        :root:not([data-theme="light"]) .hljs-selector-class,
        :root:not([data-theme="light"]) .hljs-selector-id {
            color: #fbbf24;
        }
        
        :root:not([data-theme="light"]) .hljs-regexp {
            color: #4ade80;
        }
    }
    """ 