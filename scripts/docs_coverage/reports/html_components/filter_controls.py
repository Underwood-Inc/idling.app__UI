#!/usr/bin/env python3
"""
Filter Controls for HTML Documentation Coverage Report

Generates advanced filter controls, search functionality, and table management options.
"""

from typing import Dict, Any


class FilterControlsGenerator:
    """Generator for filter controls and search functionality."""
    
    def __init__(self):
        pass
    
    def generate_filter_controls(self, report_data: Dict[str, Any]) -> str:
        """Generate advanced filter controls for the table."""
        total_gaps = report_data.get('total_gaps', 0)
        by_priority = report_data.get('by_priority', {})
        missing_docs = report_data.get('missing_documentation', 0)
        inadequate_docs = report_data.get('inadequate_documentation', 0)
        
        return f"""
        <!-- Enhanced Filter Controls -->
        <div class="advanced-filter-controls">
            <div class="filter-row">
                <div class="search-container">
                    <input type="text" id="gap-search" placeholder="🔍 Search files, paths, or issues..." class="search-input">
                    <button id="clear-search" class="search-clear" title="Clear search">×</button>
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
                    <button id="help-btn" class="control-btn" title="Show Help">
                        <span class="btn-icon">❓</span>
                        <span class="btn-text">Help</span>
                    </button>
                </div>
            </div>
            
            <div class="filter-tags">
                <button class="filter-tag active" data-filter="all">All ({total_gaps})</button>
                <button class="filter-tag" data-filter="critical">Critical ({by_priority.get('critical', 0)})</button>
                <button class="filter-tag" data-filter="high">High ({by_priority.get('high', 0)})</button>
                <button class="filter-tag" data-filter="medium">Medium ({by_priority.get('medium', 0)})</button>
                <button class="filter-tag" data-filter="low">Low ({by_priority.get('low', 0)})</button>
                <button class="filter-tag" data-filter="missing">Missing ({missing_docs})</button>
                <button class="filter-tag" data-filter="inadequate">Inadequate ({inadequate_docs})</button>
            </div>
            
            <div class="filter-status-row">
                <span id="filter-status">Showing all {total_gaps} items</span>
                <button id="clear-filters" class="clear-btn">Clear All Filters</button>
            </div>
        </div>
        """
    
    def generate_search_suggestions(self) -> str:
        """Generate search suggestions dropdown."""
        return """
        <!-- Search Suggestions -->
        <div id="search-suggestions" class="search-suggestions" style="display: none;">
            <div class="suggestions-header">
                <span class="suggestions-title">Search Suggestions</span>
                <button class="suggestions-close">×</button>
            </div>
            <div class="suggestions-content">
                <div class="suggestion-group">
                    <div class="suggestion-group-title">Common Searches</div>
                    <div class="suggestion-items">
                        <div class="suggestion-item" data-query="missing">Missing documentation</div>
                        <div class="suggestion-item" data-query="inadequate">Inadequate documentation</div>
                        <div class="suggestion-item" data-query="critical">Critical priority</div>
                        <div class="suggestion-item" data-query="high">High priority</div>
                    </div>
                </div>
                <div class="suggestion-group">
                    <div class="suggestion-group-title">File Types</div>
                    <div class="suggestion-items">
                        <div class="suggestion-item" data-query=".py">Python files</div>
                        <div class="suggestion-item" data-query=".js">JavaScript files</div>
                        <div class="suggestion-item" data-query=".ts">TypeScript files</div>
                        <div class="suggestion-item" data-query=".jsx">React files</div>
                    </div>
                </div>
            </div>
        </div>
        """
    
    def generate_filter_summary(self) -> str:
        """Generate active filters summary display."""
        return """
        <!-- Active Filters Summary -->
        <div id="active-filters-summary" class="active-filters-summary" style="display: none;">
            <div class="summary-header">
                <span class="summary-title">Active Filters</span>
                <button id="clear-all-filters" class="summary-clear">Clear All</button>
            </div>
            <div class="summary-content">
                <div id="active-filters-list" class="active-filters-list">
                    <!-- Active filters will be populated here -->
                </div>
            </div>
        </div>
        """
    
    def generate_filter_styles(self) -> str:
        """Generate CSS styles for filter controls."""
        return """
        /* Advanced Filter Controls */
        .advanced-filter-controls {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: var(--spacing-md);
            margin-bottom: var(--spacing-md);
        }
        
        .filter-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--spacing-md);
            flex-wrap: wrap;
            gap: var(--spacing-sm);
        }
        
        .search-container {
            position: relative;
            flex: 1;
            min-width: 300px;
        }
        
        .search-input {
            width: 100%;
            padding: var(--spacing-sm) var(--spacing-md);
            padding-right: 40px;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: var(--font-size-sm);
            transition: border-color 0.2s ease;
        }
        
        .search-input:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
        }
        
        .search-clear {
            position: absolute;
            right: var(--spacing-sm);
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: var(--font-size-lg);
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
        }
        
        .search-clear:hover {
            background: var(--bg-hover);
            color: var(--text-primary);
        }
        
        .table-controls {
            display: flex;
            gap: var(--spacing-sm);
            flex-wrap: wrap;
        }
        
        .control-btn {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            padding: var(--spacing-sm) var(--spacing-md);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            background: var(--bg-primary);
            color: var(--text-primary);
            cursor: pointer;
            font-size: var(--font-size-sm);
            transition: all 0.2s ease;
            white-space: nowrap;
        }
        
        .control-btn:hover {
            background: var(--bg-hover);
            border-color: var(--color-primary);
        }
        
        .btn-icon {
            font-size: var(--font-size-sm);
        }
        
        .btn-text {
            font-weight: 500;
        }
        
        .filter-tags {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-xs);
            margin-bottom: var(--spacing-md);
        }
        
        .filter-tag {
            padding: var(--spacing-xs) var(--spacing-sm);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            background: var(--bg-primary);
            color: var(--text-secondary);
            cursor: pointer;
            font-size: var(--font-size-sm);
            transition: all 0.2s ease;
            white-space: nowrap;
            font-family: inherit;
            font-weight: 500;
            outline: none;
            user-select: none;
        }
        
        .filter-tag:hover {
            background: var(--bg-hover);
            border-color: var(--color-primary);
        }
        
        .filter-tag:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
        }
        
        .filter-tag.active {
            background: var(--color-primary);
            color: white;
            border-color: var(--color-primary);
        }
        
        .filter-status-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: var(--spacing-sm);
        }
        
        .clear-btn {
            padding: var(--spacing-xs) var(--spacing-sm);
            border: 1px solid var(--color-secondary);
            border-radius: var(--radius-sm);
            background: var(--bg-primary);
            color: var(--color-secondary);
            cursor: pointer;
            font-size: var(--font-size-sm);
            transition: all 0.2s ease;
        }
        
        .clear-btn:hover {
            background: var(--color-secondary);
            color: white;
        }
        
        /* Search Suggestions */
        .search-suggestions {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .suggestions-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-sm) var(--spacing-md);
            border-bottom: 1px solid var(--border-color);
            background: var(--bg-secondary);
        }
        
        .suggestions-title {
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .suggestions-close {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: var(--font-size-lg);
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
        }
        
        .suggestions-close:hover {
            background: var(--bg-hover);
            color: var(--text-primary);
        }
        
        .suggestion-group {
            padding: var(--spacing-sm) 0;
        }
        
        .suggestion-group-title {
            padding: var(--spacing-xs) var(--spacing-md);
            font-weight: 600;
            color: var(--text-secondary);
            font-size: var(--font-size-xs);
            text-transform: uppercase;
        }
        
        .suggestion-item {
            padding: var(--spacing-xs) var(--spacing-md);
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        
        .suggestion-item:hover {
            background: var(--bg-hover);
        }
        
        /* Active Filters Summary */
        .active-filters-summary {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            margin-bottom: var(--spacing-sm);
        }
        
        .summary-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-sm) var(--spacing-md);
            border-bottom: 1px solid var(--border-color);
        }
        
        .summary-title {
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .summary-clear {
            background: none;
            border: none;
            color: var(--color-secondary);
            cursor: pointer;
            font-size: var(--font-size-sm);
            padding: var(--spacing-xs);
            border-radius: var(--radius-sm);
            transition: all 0.2s ease;
        }
        
        .summary-clear:hover {
            background: var(--color-secondary);
            color: white;
        }
        
        .active-filters-list {
            padding: var(--spacing-sm) var(--spacing-md);
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-xs);
        }
        
        /* Mobile responsiveness */
        @media (max-width: 768px) {
            .filter-row {
                flex-direction: column;
                align-items: stretch;
            }
            
            .search-container {
                min-width: unset;
            }
            
            .table-controls {
                justify-content: center;
            }
            
            .filter-tags {
                justify-content: center;
            }
            
            .filter-status-row {
                flex-direction: column;
                align-items: center;
                text-align: center;
            }
        }
        """


# Export the generator class
__all__ = ['FilterControlsGenerator'] 