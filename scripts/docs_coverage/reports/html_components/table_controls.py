#!/usr/bin/env python3
"""
Table Controls for HTML Documentation Coverage Report

Generates table control buttons for expanding/collapsing rows and export functionality.
"""


class TableControlsGenerator:
    """Generator for table control buttons and export options."""
    
    def __init__(self):
        pass
    
    def generate_table_controls(self) -> str:
        """Generate table control buttons and options."""
        return """
        <!-- Table Controls -->
        <div class="table-controls-section">
            <div class="control-group">
                <label class="control-label">
                    <span class="label-text">Display Options:</span>
                </label>
                <div class="control-buttons">
                    <button id="expand-all-btn" class="control-btn" title="Expand all rows">
                        <span class="btn-icon">📖</span>
                        <span class="btn-text">Expand All</span>
                    </button>
                    <button id="collapse-all-btn" class="control-btn" title="Collapse all rows">
                        <span class="btn-icon">📕</span>
                        <span class="btn-text">Collapse All</span>
                    </button>
                </div>
            </div>
            
            <div class="control-group">
                <label class="control-label">
                    <span class="label-text">Export Options:</span>
                </label>
                <div class="control-buttons">
                    <button id="export-csv-btn" class="control-btn" title="Export to CSV">
                        <span class="btn-icon">💾</span>
                        <span class="btn-text">Export CSV</span>
                    </button>
                    <button id="export-json-btn" class="control-btn" title="Export to JSON">
                        <span class="btn-icon">📄</span>
                        <span class="btn-text">Export JSON</span>
                    </button>
                </div>
            </div>
        </div>
        """
    
    def generate_table_controls_styles(self) -> str:
        """Generate CSS styles for table controls."""
        return """
        /* Table Controls Section */
        .table-controls-section {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: var(--spacing-md);
            margin-bottom: var(--spacing-md);
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-lg);
            align-items: center;
        }
        
        .control-group {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
            flex-wrap: wrap;
        }
        
        .control-label {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .label-text {
            font-size: var(--font-size-sm);
            white-space: nowrap;
        }
        
        .control-buttons {
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
            font-weight: 500;
        }
        
        .control-btn:hover {
            background: var(--bg-hover);
            border-color: var(--color-primary);
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .control-btn:active {
            transform: translateY(0);
            box-shadow: none;
        }
        
        .btn-icon {
            font-size: var(--font-size-md);
        }
        
        .btn-text {
            font-weight: 500;
        }
        
        /* Export button specific styles */
        .control-btn[id*="export"] {
            background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
            color: white;
            border-color: var(--color-primary);
        }
        
        .control-btn[id*="export"]:hover {
            background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
            border-color: var(--color-secondary);
        }
        
        /* Expand/Collapse button specific styles */
        .control-btn[id*="expand"],
        .control-btn[id*="collapse"] {
            background: var(--bg-primary);
            border-color: var(--color-accent);
        }
        
        .control-btn[id*="expand"]:hover,
        .control-btn[id*="collapse"]:hover {
            background: var(--color-accent);
            color: white;
            border-color: var(--color-accent);
        }
        
        /* Mobile responsiveness */
        @media (max-width: 768px) {
            .table-controls-section {
                flex-direction: column;
                align-items: stretch;
                gap: var(--spacing-md);
            }
            
            .control-group {
                flex-direction: column;
                align-items: stretch;
                gap: var(--spacing-sm);
            }
            
            .control-buttons {
                justify-content: center;
            }
            
            .control-btn {
                flex: 1;
                justify-content: center;
            }
        }
        
        @media (max-width: 480px) {
            .control-btn {
                padding: var(--spacing-xs) var(--spacing-sm);
                font-size: var(--font-size-xs);
            }
            
            .btn-icon {
                font-size: var(--font-size-sm);
            }
        }
        """


# Export the generator class
__all__ = ['TableControlsGenerator'] 