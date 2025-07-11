#!/usr/bin/env python3
"""
Table Column Management for HTML Documentation Coverage Report

Handles column visibility controls, column picker functionality,
and column width management.
"""

def get_table_column_manager_js() -> str:
    """Generate table column management JavaScript functionality."""
    return """
    // Table Column Manager - Column Visibility and Width Management
    class TableColumnManager {
        constructor(tableManager) {
            this.manager = tableManager;
            this.setupColumnHandlers();
        }
        
        setupColumnHandlers() {
            // Column picker button
            const columnPickerBtn = document.getElementById('column-picker-btn');
            if (columnPickerBtn) {
                columnPickerBtn.addEventListener('click', () => {
                    if (this.manager.isDestroyed) return;
                    this.showColumnPicker();
                });
            }
            
            // Apply columns button
            const applyColumnsBtn = document.getElementById('apply-columns-btn');
            if (applyColumnsBtn) {
                applyColumnsBtn.addEventListener('click', () => {
                    if (this.manager.isDestroyed) return;
                    this.applyColumnVisibility();
                });
            }
            
            // Reset columns button
            const resetColumnsBtn = document.getElementById('reset-columns-btn');
            if (resetColumnsBtn) {
                resetColumnsBtn.addEventListener('click', () => {
                    if (this.manager.isDestroyed) return;
                    this.resetColumnVisibility();
                });
            }
            
            console.log('🎛️ Column management handlers attached');
        }
        
        showColumnPicker() {
            // Delegate to modal manager
            if (window.modalManager && window.modalManager.showColumnPicker) {
                window.modalManager.showColumnPicker();
            } else {
                console.warn('⚠️ Modal manager not available');
            }
        }
        
        applyColumnVisibility() {
            // Apply column visibility changes
            Object.keys(this.manager.columnVisibility || {}).forEach(columnId => {
                this.updateColumnVisibility(columnId, this.manager.columnVisibility[columnId]);
            });
            
            this.manager.updateDisplay();
            
            // Close modal
            if (window.modalManager) {
                window.modalManager.closeModal();
            }
        }
        
        resetColumnVisibility() {
            this.manager.hiddenColumns = new Set(['type']);
            this.manager.updateDisplay();
            this.manager.saveState();
        }
        
        updateColumnVisibility(columnId, visible) {
            if (visible) {
                this.manager.hiddenColumns.delete(columnId);
            } else {
                this.manager.hiddenColumns.add(columnId);
            }
            
            // Update column display
            const columnCells = this.manager.table.querySelectorAll(`th[data-column="${columnId}"], td[data-column="${columnId}"]`);
            columnCells.forEach(cell => {
                cell.style.display = visible ? '' : 'none';
            });
        }
        
        getColumnConfiguration() {
            // Return current column configuration
            return {
                visible: this.getVisibleColumns(),
                hidden: Array.from(this.manager.hiddenColumns),
                widths: this.manager.columnWidths
            };
        }
        
        getVisibleColumns() {
            const allColumns = ['file', 'lines', 'status', 'priority', 'doc', 'effort', 'issues'];
            return allColumns.filter(col => !this.manager.hiddenColumns.has(col));
        }
        
        setColumnWidth(columnId, width) {
            this.manager.columnWidths[columnId] = width;
            
            // Apply width to column
            const columnCells = this.manager.table.querySelectorAll(`th[data-column="${columnId}"], td[data-column="${columnId}"]`);
            columnCells.forEach(cell => {
                cell.style.width = width;
            });
            
            this.manager.saveState();
        }
        
        getColumnWidth(columnId) {
            return this.manager.columnWidths[columnId] || 'auto';
        }
        
        resetColumnWidths() {
            this.manager.columnWidths = {};
            
            // Remove all custom widths
            const allCells = this.manager.table.querySelectorAll('th, td');
            allCells.forEach(cell => {
                cell.style.width = '';
            });
            
            this.manager.saveState();
        }
        
        exportColumnConfiguration() {
            // Export column configuration for backup/sharing
            const config = {
                hiddenColumns: Array.from(this.manager.hiddenColumns),
                columnWidths: this.manager.columnWidths,
                timestamp: new Date().toISOString()
            };
            
            console.log('📤 Column configuration exported:', config);
            return config;
        }
        
        importColumnConfiguration(config) {
            // Import column configuration from backup
            try {
                if (typeof config === 'string') {
                    config = JSON.parse(config);
                }
                
                this.manager.hiddenColumns = new Set(config.hiddenColumns || ['type']);
                this.manager.columnWidths = config.columnWidths || {};
                
                // Apply configuration
                this.applyColumnVisibility();
                
                // Apply widths
                Object.keys(this.manager.columnWidths).forEach(columnId => {
                    this.setColumnWidth(columnId, this.manager.columnWidths[columnId]);
                });
                
                this.manager.saveState();
                
                console.log('📥 Column configuration imported successfully');
                return true;
            } catch (e) {
                console.error('❌ Failed to import column configuration:', e);
                return false;
            }
        }
    }
    
    // Export for use by other components
    window.TableColumnManager = TableColumnManager;
    """ 