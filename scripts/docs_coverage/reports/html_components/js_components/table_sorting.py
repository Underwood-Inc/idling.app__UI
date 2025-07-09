#!/usr/bin/env python3
"""
Table Sorting Functionality for HTML Documentation Coverage Report

Handles all sorting operations including single and multi-column sorting,
sort state management, and sort indicator updates.
"""

def get_table_sorting_js() -> str:
    """Generate table sorting JavaScript functionality."""
    return """
    // Table Sorting - Column Sorting and Sort State Management
    class TableSorting {
        constructor(tableManager) {
            this.manager = tableManager;
            this.setupSortingHandlers();
        }
        
        setupSortingHandlers() {
            // Setup column sorting - headers are now in a separate table
            const headerTable = document.querySelector('.advanced-table-header .advanced-table');
            if (headerTable) {
                headerTable.querySelectorAll('th.sortable').forEach(th => {
                    th.addEventListener('click', (e) => {
                        if (this.manager.isDestroyed) return;
                        this.handleColumnSort(e, th);
                    });
                });
            } else {
                console.warn('⚠️ Header table not found for sorting!');
            }
            
            console.log('🔄 Sorting handlers attached');
        }
        
        handleColumnSort(e, th) {
            const column = th.dataset.column;
            const isMultiSort = e.shiftKey;
            
            console.log(`🔄 Sorting column: ${column}, Multi-sort: ${isMultiSort}`);
            this.toggleSort(column, isMultiSort);
        }
        
        toggleSort(column, isMultiSort) {
            // Validate sort state before making changes
            this.manager.validateSortState();
            
            if (!isMultiSort) {
                // Single column sort - replace primary
                this.manager.sortState.primary = {
                    column: column,
                    direction: this.manager.sortState.primary.column === column && this.manager.sortState.primary.direction === 'asc' ? 'desc' : 'asc'
                };
                this.manager.sortState.secondary = { column: null, direction: 'asc' };
            } else {
                // Multi-column sort
                if (this.manager.sortState.primary.column === column) {
                    this.manager.sortState.primary.direction = this.manager.sortState.primary.direction === 'asc' ? 'desc' : 'asc';
                } else if (this.manager.sortState.secondary.column === column) {
                    this.manager.sortState.secondary.direction = this.manager.sortState.secondary.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    this.manager.sortState.secondary = this.manager.sortState.primary;
                    this.manager.sortState.primary = { column: column, direction: 'asc' };
                }
            }
            
            this.applySorting();
            this.manager.updateDisplay();
            this.manager.saveState();
        }
        
        applySorting() {
            if (!this.manager.filteredRows || this.manager.filteredRows.length === 0) return;
            
            this.manager.filteredRows.sort((a, b) => {
                // Primary sort
                let result = this.compareRows(a, b, this.manager.sortState.primary.column, this.manager.sortState.primary.direction);
                
                // Secondary sort if primary is equal
                if (result === 0 && this.manager.sortState.secondary.column) {
                    result = this.compareRows(a, b, this.manager.sortState.secondary.column, this.manager.sortState.secondary.direction);
                }
                
                return result;
            });
        }
        
        compareRows(a, b, column, direction) {
            if (!column) return 0;
            
            const aVal = this.getCellValue(a, column);
            const bVal = this.getCellValue(b, column);
            
            let result = 0;
            if (aVal < bVal) result = -1;
            else if (aVal > bVal) result = 1;
            
            return direction === 'desc' ? -result : result;
        }
        
        getCellValue(row, column) {
            // Map column names to CSS classes
            const columnClassMap = {
                'file': 'col-file',
                'lines': 'col-lines', 
                'status': 'col-status',
                'priority': 'col-priority',
                'doc': 'col-doc',
                'effort': 'col-effort',
                'issues': 'col-issues'
            };
            
            const cssClass = columnClassMap[column];
            if (!cssClass) return '';
            
            const cell = row.querySelector(`td.${cssClass}`);
            if (!cell) return '';
            
            const cellText = cell.textContent.trim();
            
            // Handle different data types for proper sorting
            switch (column) {
                case 'lines':
                    // Extract numeric value from line count
                    const lineMatch = cellText.match(/[\\d,]+/);
                    return lineMatch ? parseInt(lineMatch[0].replace(/,/g, '')) : 0;
                    
                case 'priority':
                    // Priority order: Critical > High > Medium > Low
                    const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
                    const priority = cellText.toLowerCase().replace(/[^a-z]/g, '');
                    return priorityOrder[priority] || 0;
                    
                case 'effort':
                    // Effort order: High > Medium > Low
                    const effortOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                    const effort = cellText.toLowerCase().replace(/[^a-z]/g, '');
                    return effortOrder[effort] || 0;
                    
                case 'status':
                    // Status order: Missing > Inadequate
                    const statusOrder = { 'missing': 2, 'inadequate': 1 };
                    const status = cellText.toLowerCase().replace(/[^a-z]/g, '');
                    return statusOrder[status] || 0;
                    
                case 'issues':
                    // Count number of issues (extract number from text like "3 issues")
                    const issueMatch = cellText.match(/(\\d+)/);
                    return issueMatch ? parseInt(issueMatch[1]) : 0;
                    
                default:
                    // For file names and docs, use alphabetical sorting
                    return cellText.toLowerCase();
            }
        }
        
        safeUpdateSortIndicators() {
            try {
                this.updateSortIndicators();
            } catch (error) {
                console.error('❌ Error updating sort indicators:', error);
                // Reset sort state and try again
                this.manager.sortState = this.manager.createSafeSortState();
                try {
                    this.updateSortIndicators();
                } catch (secondError) {
                    console.error('❌ Even safe sort indicators failed:', secondError);
                }
            }
        }
        
        updateSortIndicators() {
            // Ultra defensive programming - ensure everything exists
            if (!this.manager.table) return;
            
            // Validate sort state before accessing it
            this.manager.validateSortState();
            
            // Find the header table (headers are now in a separate table)
            const headerTable = document.querySelector('.advanced-table-header .advanced-table');
            if (!headerTable) {
                console.warn('⚠️ Header table not found for sort indicators');
                return;
            }
            
            // Clear all sort indicators
            const sortableHeaders = headerTable.querySelectorAll('th.sortable');
            sortableHeaders.forEach(th => {
                th.classList.remove('sort-asc', 'sort-desc', 'sort-primary', 'sort-secondary');
            });
            
            // Add primary sort indicator
            if (this.manager.sortState.primary && this.manager.sortState.primary.column) {
                const primaryTh = headerTable.querySelector(`th[data-column="${this.manager.sortState.primary.column}"]`);
                if (primaryTh) {
                    primaryTh.classList.add('sort-primary');
                    primaryTh.classList.add(this.manager.sortState.primary.direction === 'asc' ? 'sort-asc' : 'sort-desc');
                }
            }
            
            // Add secondary sort indicator
            if (this.manager.sortState.secondary && this.manager.sortState.secondary.column) {
                const secondaryTh = headerTable.querySelector(`th[data-column="${this.manager.sortState.secondary.column}"]`);
                if (secondaryTh) {
                    secondaryTh.classList.add('sort-secondary');
                    secondaryTh.classList.add(this.manager.sortState.secondary.direction === 'asc' ? 'sort-asc' : 'sort-desc');
                }
            }
        }
    }
    
    // Export for use by other components
    window.TableSorting = TableSorting;
    """ 