#!/usr/bin/env python3
"""
Pagination components coordinator for HTML report generation.

This module coordinates pagination controls, filters, and related UI components
for the interactive HTML documentation coverage report.
"""

from typing import Dict, Any
from .pagination_controls import PaginationControlsGenerator
from .filter_controls import FilterControlsGenerator
from .table_controls import TableControlsGenerator


class PaginationGenerator:
    """Coordinator for pagination controls and related UI components."""
    
    def __init__(self):
        self.pagination_controls = PaginationControlsGenerator()
        self.filter_controls = FilterControlsGenerator()
        self.table_controls = TableControlsGenerator()
    
    def generate_pagination_controls(self, total_items: int, position: str = "top") -> str:
        """Generate pagination controls for top or bottom of table."""
        return self.pagination_controls.generate_pagination_controls(total_items, position)
    
    def generate_filter_controls(self, report_data: Dict[str, Any]) -> str:
        """Generate advanced filter controls for the table."""
        return self.filter_controls.generate_filter_controls(report_data)
    
    def generate_table_controls(self) -> str:
        """Generate table control buttons and options."""
        return self.table_controls.generate_table_controls()
    
    def generate_search_suggestions(self) -> str:
        """Generate search suggestions dropdown."""
        return self.filter_controls.generate_search_suggestions()
    
    def generate_filter_summary(self) -> str:
        """Generate active filters summary display."""
        return self.filter_controls.generate_filter_summary()


class PaginationStyleGenerator:
    """Generator for pagination-specific CSS styles."""
    
    def __init__(self):
        pass
    
    def generate_pagination_styles(self) -> str:
        """Generate CSS styles for pagination controls."""
        return """
        /* Pagination Controls */
        .pagination-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: var(--spacing-md) 0;
            padding: var(--spacing-md);
            background: var(--bg-secondary);
            border-radius: var(--radius-md);
            border: 1px solid var(--border-color);
        }
        
        .pagination-info {
            color: var(--text-secondary);
            font-size: var(--font-size-sm);
        }
        
        .pagination-controls-group {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
        }
        
        .page-size-label {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            color: var(--text-secondary);
            font-size: var(--font-size-sm);
        }
        
        .page-size-select {
            padding: var(--spacing-xs) var(--spacing-sm);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: var(--font-size-sm);
        }
        
        .pagination-buttons {
            display: flex;
            gap: var(--spacing-xs);
            align-items: center;
        }
        
        .pagination-btn {
            padding: var(--spacing-xs) var(--spacing-sm);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            background: var(--bg-primary);
            color: var(--text-primary);
            cursor: pointer;
            transition: all var(--transition-fast);
            font-size: var(--font-size-sm);
        }
        
        .pagination-btn:hover:not(:disabled) {
            background: var(--bg-tertiary);
            border-color: var(--brand-primary);
        }
        
        .pagination-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .page-indicator {
            padding: var(--spacing-xs) var(--spacing-sm);
            color: var(--text-secondary);
            font-size: var(--font-size-sm);
            font-weight: 500;
        }
        
        /* Filter Controls */
        .advanced-filter-controls {
            margin-bottom: var(--spacing-lg);
        }
        
        .filter-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--spacing-md);
            gap: var(--spacing-md);
        }
        
        .search-container {
            position: relative;
            flex: 1;
            max-width: 400px;
        }
        
        .search-input {
            width: 100%;
            padding: var(--spacing-sm) var(--spacing-md);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: var(--font-size-base);
            transition: all var(--transition-fast);
        }
        
        .search-input:focus {
            outline: none;
            border-color: var(--brand-primary);
            box-shadow: 0 0 0 2px var(--brand-primary-light);
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
            padding: var(--spacing-xs);
            border-radius: var(--radius-sm);
            transition: all var(--transition-fast);
        }
        
        .search-clear:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
        }
        
        .table-controls {
            display: flex;
            gap: var(--spacing-sm);
        }
        
        .control-btn {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            padding: var(--spacing-sm) var(--spacing-md);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            background: var(--bg-primary);
            color: var(--text-primary);
            cursor: pointer;
            transition: all var(--transition-fast);
            font-size: var(--font-size-sm);
        }
        
        .control-btn:hover {
            background: var(--bg-tertiary);
            border-color: var(--brand-primary);
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
            gap: var(--spacing-sm);
            margin-bottom: var(--spacing-md);
        }
        
        .filter-tag {
            padding: var(--spacing-xs) var(--spacing-sm);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            background: var(--bg-primary);
            color: var(--text-secondary);
            cursor: pointer;
            transition: all var(--transition-fast);
            font-size: var(--font-size-sm);
            user-select: none;
        }
        
        .filter-tag:hover {
            background: var(--bg-tertiary);
            border-color: var(--brand-primary);
        }
        
        .filter-tag.active {
            background: var(--brand-primary);
            color: var(--dark-text-primary);
            border-color: var(--brand-primary);
        }
        
        .filter-status-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-sm);
            background: var(--bg-secondary);
            border-radius: var(--radius-sm);
        }
        
        .clear-btn {
            background: none;
            border: none;
            color: var(--brand-primary);
            cursor: pointer;
            font-size: var(--font-size-sm);
            padding: var(--spacing-xs);
            border-radius: var(--radius-sm);
            transition: all var(--transition-fast);
        }
        
        .clear-btn:hover {
            background: var(--bg-tertiary);
        }
        
        /* Search Suggestions */
        .search-suggestions {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 100;
            margin-top: var(--spacing-xs);
        }
        
        .suggestions-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-sm) var(--spacing-md);
            border-bottom: 1px solid var(--border-color);
            background: var(--bg-secondary);
            border-radius: var(--radius-md) var(--radius-md) 0 0;
        }
        
        .suggestions-title {
            font-weight: 600;
            color: var(--text-primary);
            font-size: var(--font-size-sm);
        }
        
        .suggestions-close {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: var(--font-size-lg);
            padding: var(--spacing-xs);
            border-radius: var(--radius-sm);
            transition: all var(--transition-fast);
        }
        
        .suggestions-close:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
        }
        
        .suggestions-content {
            padding: var(--spacing-md);
        }
        
        .suggestion-group {
            margin-bottom: var(--spacing-md);
        }
        
        .suggestion-group:last-child {
            margin-bottom: 0;
        }
        
        .suggestion-group-title {
            font-weight: 600;
            color: var(--text-primary);
            font-size: var(--font-size-sm);
            margin-bottom: var(--spacing-sm);
        }
        
        .suggestion-items {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-xs);
        }
        
        .suggestion-item {
            padding: var(--spacing-xs) var(--spacing-sm);
            background: var(--bg-secondary);
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all var(--transition-fast);
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
        }
        
        .suggestion-item:hover {
            background: var(--brand-primary);
            color: var(--dark-text-primary);
        }
        
        /* Active Filters Summary */
        .active-filters-summary {
            margin-bottom: var(--spacing-md);
            padding: var(--spacing-md);
            background: var(--bg-secondary);
            border-radius: var(--radius-md);
            border: 1px solid var(--border-color);
        }
        
        .summary-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--spacing-sm);
        }
        
        .summary-title {
            font-weight: 600;
            color: var(--text-primary);
            font-size: var(--font-size-sm);
        }
        
        .summary-clear {
            background: none;
            border: none;
            color: var(--brand-primary);
            cursor: pointer;
            font-size: var(--font-size-sm);
            padding: var(--spacing-xs);
            border-radius: var(--radius-sm);
            transition: all var(--transition-fast);
        }
        
        .summary-clear:hover {
            background: var(--bg-tertiary);
        }
        
        .active-filters-list {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-xs);
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .pagination-controls {
                flex-direction: column;
                gap: var(--spacing-md);
            }
            
            .pagination-controls-group {
                flex-direction: column;
                gap: var(--spacing-sm);
            }
            
            .filter-row {
                flex-direction: column;
                gap: var(--spacing-sm);
            }
            
            .search-container {
                max-width: none;
            }
            
            .table-controls {
                justify-content: center;
            }
            
            .filter-tags {
                justify-content: center;
            }
            
            .filter-status-row {
                flex-direction: column;
                gap: var(--spacing-sm);
                text-align: center;
            }
        }
        """


# Export the main classes
__all__ = [
    'PaginationGenerator',
    'PaginationStyleGenerator'
] 