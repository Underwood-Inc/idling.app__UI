#!/usr/bin/env python3
"""
Pagination Controls for HTML Documentation Coverage Report

Generates pagination controls for navigating through large tables of data.
"""

from typing import Dict, Any


class PaginationControlsGenerator:
    """Generator for pagination controls and navigation."""
    
    def __init__(self):
        pass
    
    def generate_pagination_controls(self, total_items: int, position: str = "top") -> str:
        """Generate pagination controls for top or bottom of table."""
        position_suffix = "-bottom" if position == "bottom" else ""
        
        return f"""
        <!-- Pagination Controls ({position.title()}) -->
        <div class="pagination-controls pagination-{position}">
            <div class="pagination-info">
                <span id="pagination-info-text{position_suffix}">Showing 1-50 of {total_items} items</span>
            </div>
            <div class="pagination-controls-group">
                <label class="page-size-label">
                    Items per page:
                    <select id="page-size-select{position_suffix}" class="page-size-select">
                        <option value="25">25</option>
                        <option value="50" selected>50</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                        <option value="all">All</option>
                    </select>
                </label>
                <div class="pagination-buttons">
                    <button id="first-page-btn{position_suffix}" class="pagination-btn" title="First page" disabled>⏮️</button>
                    <button id="prev-page-btn{position_suffix}" class="pagination-btn" title="Previous page" disabled>⏪</button>
                    <span id="page-indicator{position_suffix}" class="page-indicator">Page 1 of 1</span>
                    <button id="next-page-btn{position_suffix}" class="pagination-btn" title="Next page" disabled>⏩</button>
                    <button id="last-page-btn{position_suffix}" class="pagination-btn" title="Last page" disabled>⏭️</button>
                </div>
            </div>
        </div>
        """
    
    def generate_pagination_styles(self) -> str:
        """Generate CSS styles for pagination controls."""
        return """
        /* Pagination Controls */
        .pagination-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-md);
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            margin: var(--spacing-md) 0;
            flex-wrap: wrap;
            gap: var(--spacing-sm);
        }
        
        .pagination-info {
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            font-weight: 500;
        }
        
        .pagination-controls-group {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
            flex-wrap: wrap;
        }
        
        .page-size-label {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
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
            align-items: center;
            gap: var(--spacing-xs);
        }
        
        .pagination-btn {
            padding: var(--spacing-xs) var(--spacing-sm);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            background: var(--bg-primary);
            color: var(--text-primary);
            cursor: pointer;
            font-size: var(--font-size-sm);
            transition: all 0.2s ease;
            min-width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .pagination-btn:hover:not(:disabled) {
            background: var(--bg-hover);
            border-color: var(--color-primary);
        }
        
        .pagination-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .page-indicator {
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            font-weight: 500;
            padding: 0 var(--spacing-sm);
        }
        
        /* Mobile responsiveness */
        @media (max-width: 768px) {
            .pagination-controls {
                flex-direction: column;
                align-items: stretch;
                gap: var(--spacing-sm);
            }
            
            .pagination-controls-group {
                justify-content: center;
            }
            
            .pagination-info {
                text-align: center;
            }
        }
        
        /* Responsive pagination buttons */
        @media (max-width: 480px) {
            .pagination-btn {
                min-width: 32px;
                height: 32px;
                font-size: var(--font-size-xs);
            }
            
            .page-indicator {
                font-size: var(--font-size-xs);
            }
        }
        """


# Export the generator class
__all__ = ['PaginationControlsGenerator'] 