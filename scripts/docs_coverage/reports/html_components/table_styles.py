#!/usr/bin/env python3
"""
Table-specific CSS styles for HTML Documentation Coverage Report

Provides enhanced table styling with improved contrast, scrollbars, and cell handling.
"""

def get_table_styles() -> str:
    """Generate table-specific CSS styles."""
    return """
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
        min-width: 100px;
        max-width: 140px;
        width: 120px;
    }

    /* Improved Text Truncation */
    .doc-path {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--text-secondary);
        word-break: break-word;
        overflow-wrap: break-word;
        line-height: 1.3;
        max-width: 100%;
        display: block;
    }

    .issues-text {
        font-size: 13px;
        line-height: 1.4;
        max-width: 100%;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .issues-text:hover {
        white-space: normal;
        overflow: visible;
        text-overflow: unset;
        background: var(--bg-tertiary);
        padding: 4px 8px;
        border-radius: 4px;
        box-shadow: var(--shadow-md);
        z-index: 100;
        position: relative;
    }

    /* Enhanced Multi-Sort Indicators */
    .header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 20px;
        padding-right: 24px;
        gap: 8px;
    }

    .header-text {
        flex: 1;
        font-weight: 600;
        min-width: 0;
    }

    .sort-indicators {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        min-width: 20px;
    }

    .sort-indicator {
        font-size: 10px;
        line-height: 1;
        opacity: 0.7;
        transition: all 0.2s ease;
    }

    .sort-indicator.primary {
        font-size: 12px;
        opacity: 1;
        color: var(--brand-primary);
        font-weight: bold;
    }

    .sort-indicator.secondary {
        font-size: 10px;
        opacity: 0.8;
        color: var(--brand-secondary);
    }

    .sort-indicator.asc::before {
        content: '▲';
    }

    .sort-indicator.desc::before {
        content: '▼';
    }

    .sort-indicator.primary.asc::before {
        content: '🔺';
    }

    .sort-indicator.primary.desc::before {
        content: '🔻';
    }

    /* Sort Order Numbers */
    .sort-order {
        font-size: 8px;
        background: var(--brand-primary);
        color: white;
        border-radius: 50%;
        width: 14px;
        height: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        top: 2px;
        right: 2px;
        font-weight: bold;
    }

    /* Resize Handle */
    .resize-handle {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 8px;
        cursor: col-resize;
        background: transparent;
        border-right: 2px solid transparent;
        transition: border-color var(--transition-fast);
    }

    .resize-handle:hover {
        border-right-color: var(--brand-primary);
        background: linear-gradient(to right, transparent, rgba(237, 174, 73, 0.1));
    }

    .resize-handle.resizing {
        border-right-color: var(--brand-primary);
        background: linear-gradient(to right, transparent, rgba(237, 174, 73, 0.2));
    }

    /* Badge Styles */
    .effort-badge {
        padding: 4px 8px;
        border-radius: var(--radius-sm);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .effort-low {
        background: var(--color-success);
        color: white;
    }

    .effort-medium {
        background: var(--color-warning);
        color: white;
    }

    .effort-high {
        background: var(--color-error);
        color: white;
    }

    .file-type-badge {
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        font-size: 10px;
        font-weight: 500;
        background: var(--brand-secondary);
        color: var(--dark-text-primary);
        text-transform: uppercase;
    }

    .size-estimate {
        font-size: 12px;
        color: var(--text-secondary);
        font-weight: 500;
    }

    .badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: var(--radius-sm);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .badge-success {
        background: var(--color-success);
        color: white;
    }

    .badge-warning {
        background: var(--color-warning);
        color: white;
    }

    .badge-error {
        background: var(--color-error);
        color: white;
    }

    .badge-info {
        background: var(--color-info);
        color: white;
    }
    """ 