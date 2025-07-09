#!/usr/bin/env python3
"""
Table Management JavaScript for HTML Documentation Coverage Report

Provides table-specific interactive features including sorting, filtering, and pagination.
"""

def get_table_manager_js() -> str:
    """Generate JavaScript for table management functionality."""
    return """
    // Enhanced Table Manager - ULTRA DEFENSIVE VERSION
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
            this.sortState = this.createSafeSortState();
            this.columnWidths = {};
            this.hiddenColumns = new Set();
            this.storageKey = 'docs-coverage-table-state';
            this.isDestroyed = false;
            this.isInitialized = false;
            
            this.init();
        }
        
        createSafeSortState() {
            return {
                primary: { column: null, direction: 'asc' },
                secondary: { column: null, direction: 'asc' }
            };
        }
        
        validateSortState() {
            // Ultra defensive sort state validation
            if (!this.sortState || typeof this.sortState !== 'object') {
                console.warn('⚠️ Sort state is invalid, creating new one');
                this.sortState = this.createSafeSortState();
                return false;
            }
            
            // Validate primary sort
            if (!this.sortState.primary || typeof this.sortState.primary !== 'object') {
                console.warn('⚠️ Primary sort state is invalid, fixing');
                this.sortState.primary = { column: null, direction: 'asc' };
            }
            
            // Validate secondary sort
            if (!this.sortState.secondary || typeof this.sortState.secondary !== 'object') {
                console.warn('⚠️ Secondary sort state is invalid, fixing');
                this.sortState.secondary = { column: null, direction: 'asc' };
            }
            
            // Validate direction values
            if (!['asc', 'desc'].includes(this.sortState.primary.direction)) {
                this.sortState.primary.direction = 'asc';
            }
            if (!['asc', 'desc'].includes(this.sortState.secondary.direction)) {
                this.sortState.secondary.direction = 'asc';
            }
            
            return true;
        }
        
        init() {
            if (this.isDestroyed) return;
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
            } else {
                this.initializeComponents();
            }
        }
        
        initializeComponents() {
            if (this.isDestroyed || this.isInitialized) return;
            
            console.log('🔧 Initializing Enhanced Table Manager...');
            
            // Validate sort state before doing anything
            this.validateSortState();
            
            try {
                this.setupTable();
                this.setupPagination();
                this.setupFilters();
                this.setupColumnManagement();
                this.setupCardFilters();
                this.loadPersistedState();
                this.updateDisplay();
                
                this.isInitialized = true;
                console.log('✅ Enhanced Table Manager initialized successfully!');
            } catch (error) {
                console.error('❌ Failed to initialize table manager:', error);
                // Reset to safe state
                this.sortState = this.createSafeSortState();
                this.currentFilter = 'all';
                this.currentPage = 1;
                this.searchTerm = '';
                
                // Try minimal initialization
                try {
                    this.setupBasicTable();
                    console.log('✅ Basic table functionality initialized');
                } catch (fallbackError) {
                    console.error('❌ Even basic table initialization failed:', fallbackError);
                }
            }
        }
        
        setupBasicTable() {
            this.table = document.getElementById('gaps-table');
            if (this.table) {
                this.allRows = Array.from(this.table.querySelectorAll('tbody tr'));
                this.filteredRows = [...this.allRows];
                console.log(`📊 Found ${this.allRows.length} table rows`);
            }
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
            this.allRows.forEach((row, index) => {
                row.addEventListener('click', (e) => {
                    if (this.isDestroyed) return;
                    this.handleRowClick(e, row);
                });
            });
            
            // Setup filename click handlers for GitHub links
            this.table.querySelectorAll('.clickable-filename').forEach(filename => {
                filename.addEventListener('click', (e) => {
                    if (this.isDestroyed) return;
                    this.handleFilenameClick(e);
                });
            });
            
            // Setup column sorting
            this.table.querySelectorAll('th.sortable').forEach(th => {
                th.addEventListener('click', (e) => {
                    if (this.isDestroyed) return;
                    this.handleColumnSort(e, th);
                });
            });
            
            console.log('🎯 Table event handlers attached');
        }
        
        handleRowClick(e, row) {
            // Don't trigger if clicking on filename (GitHub link)
            if (e.target.classList.contains('clickable-filename')) {
                return;
            }
            
            console.log('🖱️ Row clicked:', row.dataset.fileName);
            
            // Delegate to modal manager
            if (window.modalManager && window.modalManager.showSourceCodeModal) {
                window.modalManager.showSourceCodeModal(row);
            } else {
                console.warn('⚠️ Modal manager not available');
            }
        }
        
        handleFilenameClick(e) {
            e.stopPropagation();
            const githubUrl = e.target.dataset.githubUrl;
            if (githubUrl) {
                console.log('🔗 Opening GitHub URL:', githubUrl);
                window.open(githubUrl, '_blank');
            }
        }
        
        handleColumnSort(e, th) {
            const column = th.dataset.column;
            const isMultiSort = e.shiftKey;
            
            console.log(`🔄 Sorting column: ${column}, Multi-sort: ${isMultiSort}`);
            this.toggleSort(column, isMultiSort);
        }
        
        setupPagination() {
            // Page size selector
            const pageSizeSelect = document.getElementById('page-size-select');
            if (pageSizeSelect) {
                pageSizeSelect.addEventListener('change', (e) => {
                    if (this.isDestroyed) return;
                    this.pageSize = e.target.value === 'all' ? this.filteredRows.length : parseInt(e.target.value);
                    this.currentPage = 1;
                    this.updateDisplay();
                    this.saveState();
                    console.log(`📄 Page size changed to: ${this.pageSize}`);
                });
            }
            
            // Pagination buttons
            const paginationButtons = [
                { id: 'first-page-btn', action: () => this.goToPage(1) },
                { id: 'prev-page-btn', action: () => this.goToPage(this.currentPage - 1) },
                { id: 'next-page-btn', action: () => this.goToPage(this.currentPage + 1) },
                { id: 'last-page-btn', action: () => this.goToPage(this.totalPages) },
                { id: 'first-page-btn-bottom', action: () => this.goToPage(1) },
                { id: 'prev-page-btn-bottom', action: () => this.goToPage(this.currentPage - 1) },
                { id: 'next-page-btn-bottom', action: () => this.goToPage(this.currentPage + 1) },
                { id: 'last-page-btn-bottom', action: () => this.goToPage(this.totalPages) }
            ];
            
            paginationButtons.forEach(({ id, action }) => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.addEventListener('click', (e) => {
                        if (this.isDestroyed) return;
                        action();
                    });
                }
            });
            
            console.log('📄 Pagination handlers attached');
        }
        
        setupFilters() {
            // Search input
            const searchInput = document.getElementById('gap-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    if (this.isDestroyed) return;
                    this.searchTerm = e.target.value.toLowerCase();
                    this.currentPage = 1;
                    this.applyFilters();
                    this.saveState();
                    console.log(`🔍 Search term: ${this.searchTerm}`);
                });
            }
            
            // Filter tags
            document.querySelectorAll('.filter-tag').forEach(tag => {
                tag.addEventListener('click', (e) => {
                    if (this.isDestroyed) return;
                    this.handleFilterTagClick(e);
                });
            });
            
            console.log('🏷️ Filter handlers attached');
        }
        
        setupCardFilters() {
            // Clickable overview cards
            document.querySelectorAll('.clickable-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (this.isDestroyed) return;
                    this.handleCardClick(e);
                });
            });
            
            console.log('📊 Card filter handlers attached');
        }
        
        setupColumnManagement() {
            // Column picker button
            const columnPickerBtn = document.getElementById('column-picker-btn');
            if (columnPickerBtn) {
                columnPickerBtn.addEventListener('click', () => {
                    if (this.isDestroyed) return;
                    this.showColumnPicker();
                });
            }
            
            // Apply columns button
            const applyColumnsBtn = document.getElementById('apply-columns-btn');
            if (applyColumnsBtn) {
                applyColumnsBtn.addEventListener('click', () => {
                    if (this.isDestroyed) return;
                    this.applyColumnVisibility();
                });
            }
            
            // Reset columns button
            const resetColumnsBtn = document.getElementById('reset-columns-btn');
            if (resetColumnsBtn) {
                resetColumnsBtn.addEventListener('click', () => {
                    if (this.isDestroyed) return;
                    this.resetColumnVisibility();
                });
            }
            
            console.log('🎛️ Column management handlers attached');
        }
        
        handleFilterTagClick(e) {
            const tag = e.target;
            const filter = tag.dataset.filter;
            
            console.log(`🏷️ Filter tag clicked: ${filter}`);
            this.currentFilter = filter;
            this.currentPage = 1;
            this.updateFilterTags();
            this.safeApplyFilters();
            this.saveState();
        }
        
        handleCardClick(e) {
            const card = e.target.closest('.clickable-card');
            if (!card) return;
            
            const filter = card.dataset.filter;
            if (filter) {
                console.log(`📊 Card clicked: ${filter}`);
                this.currentFilter = filter;
                this.currentPage = 1;
                this.updateFilterTags();
                this.safeApplyFilters();
                this.scrollToTable();
                this.saveState();
            }
        }
        
        goToPage(page) {
            if (page < 1 || page > this.totalPages) return;
            
            this.currentPage = page;
            this.updateDisplay();
            this.saveState();
            
            console.log(`📄 Navigated to page ${page}`);
        }
        
        toggleSort(column, isMultiSort) {
            // Validate sort state before making changes
            this.validateSortState();
            
            if (!isMultiSort) {
                // Single column sort - replace primary
                this.sortState.primary = {
                    column: column,
                    direction: this.sortState.primary.column === column && this.sortState.primary.direction === 'asc' ? 'desc' : 'asc'
                };
                this.sortState.secondary = { column: null, direction: 'asc' };
            } else {
                // Multi-column sort
                if (this.sortState.primary.column === column) {
                    this.sortState.primary.direction = this.sortState.primary.direction === 'asc' ? 'desc' : 'asc';
                } else if (this.sortState.secondary.column === column) {
                    this.sortState.secondary.direction = this.sortState.secondary.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortState.secondary = this.sortState.primary;
                    this.sortState.primary = { column: column, direction: 'asc' };
                }
            }
            
            this.applySorting();
            this.updateDisplay();
            this.saveState();
        }
        
        applySorting() {
            if (!this.filteredRows || this.filteredRows.length === 0) return;
            
            this.filteredRows.sort((a, b) => {
                // Primary sort
                let result = this.compareRows(a, b, this.sortState.primary.column, this.sortState.primary.direction);
                
                // Secondary sort if primary is equal
                if (result === 0 && this.sortState.secondary.column) {
                    result = this.compareRows(a, b, this.sortState.secondary.column, this.sortState.secondary.direction);
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
            const cell = row.querySelector(`td[data-column="${column}"]`);
            if (!cell) return '';
            
            // Try to get numeric value first
            const numericValue = parseFloat(cell.textContent);
            if (!isNaN(numericValue)) return numericValue;
            
            // Fall back to string value
            return cell.textContent.trim().toLowerCase();
        }
        
        updateDisplay() {
            if (this.isDestroyed) return;
            
            try {
                // Calculate pagination
                this.totalPages = Math.ceil(this.filteredRows.length / this.pageSize);
                if (this.currentPage > this.totalPages) {
                    this.currentPage = Math.max(1, this.totalPages);
                }
                
                // Show/hide rows
                this.allRows.forEach(row => row.style.display = 'none');
                
                const startIndex = (this.currentPage - 1) * this.pageSize;
                const endIndex = startIndex + this.pageSize;
                
                this.filteredRows.slice(startIndex, endIndex).forEach(row => {
                    row.style.display = '';
                });
                
                // Update pagination info
                this.updatePaginationInfo();
                this.updatePaginationButtons();
                this.safeUpdateSortIndicators();
                
                console.log(`📊 Display updated - Page ${this.currentPage}/${this.totalPages}, showing ${Math.min(this.pageSize, this.filteredRows.length - startIndex)} rows`);
            } catch (error) {
                console.error('❌ Error updating display:', error);
            }
        }
        
        updatePaginationInfo() {
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = Math.min(startIndex + this.pageSize, this.filteredRows.length);
            
            const infoText = `Showing ${startIndex + 1}-${endIndex} of ${this.filteredRows.length} entries`;
            
            const infoElements = [
                document.getElementById('table-info'),
                document.getElementById('table-info-bottom')
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
        
        safeUpdateSortIndicators() {
            try {
                this.updateSortIndicators();
            } catch (error) {
                console.error('❌ Error updating sort indicators:', error);
                // Reset sort state and try again
                this.sortState = this.createSafeSortState();
                try {
                    this.updateSortIndicators();
                } catch (secondError) {
                    console.error('❌ Even safe sort indicators failed:', secondError);
                }
            }
        }
        
        updateSortIndicators() {
            // Ultra defensive programming - ensure everything exists
            if (!this.table) return;
            
            // Validate sort state before accessing it
            this.validateSortState();
            
            // Clear all sort indicators
            const sortableHeaders = this.table.querySelectorAll('th.sortable');
            sortableHeaders.forEach(th => {
                th.classList.remove('sort-asc', 'sort-desc', 'sort-primary', 'sort-secondary');
            });
            
            // Add primary sort indicator
            if (this.sortState.primary && this.sortState.primary.column) {
                const primaryTh = this.table.querySelector(`th[data-column="${this.sortState.primary.column}"]`);
                if (primaryTh) {
                    primaryTh.classList.add('sort-primary');
                    primaryTh.classList.add(this.sortState.primary.direction === 'asc' ? 'sort-asc' : 'sort-desc');
                }
            }
            
            // Add secondary sort indicator
            if (this.sortState.secondary && this.sortState.secondary.column) {
                const secondaryTh = this.table.querySelector(`th[data-column="${this.sortState.secondary.column}"]`);
                if (secondaryTh) {
                    secondaryTh.classList.add('sort-secondary');
                    secondaryTh.classList.add(this.sortState.secondary.direction === 'asc' ? 'sort-asc' : 'sort-desc');
                }
            }
        }
        
        showColumnPicker() {
            // Delegate to modal manager
            if (window.modalManager && window.modalManager.showColumnPicker) {
                window.modalManager.showColumnPicker();
            } else {
                console.warn('⚠️ Modal manager not available');
            }
        }
        
        safeApplyFilters() {
            try {
                this.applyFilters();
            } catch (error) {
                console.error('❌ Error applying filters:', error);
                // Reset to safe state
                this.currentFilter = 'all';
                this.searchTerm = '';
                this.filteredRows = [...this.allRows];
                this.updateDisplay();
            }
        }
        
        applyFilters() {
            if (this.isDestroyed) return;
            
            this.filteredRows = this.allRows.filter(row => {
                // Search filter
                if (this.searchTerm) {
                    const searchText = row.textContent.toLowerCase();
                    if (!searchText.includes(this.searchTerm)) {
                        return false;
                    }
                }
                
                // Priority/status filter
                if (this.currentFilter !== 'all') {
                    const priority = row.dataset.priority;
                    const gapType = row.dataset.gapType;
                    
                    if (this.currentFilter === 'missing' && gapType !== 'missing') return false;
                    if (this.currentFilter === 'inadequate' && gapType !== 'inadequate') return false;
                    if (['critical', 'high', 'medium', 'low'].includes(this.currentFilter) && priority !== this.currentFilter) return false;
                }
                
                return true;
            });
            
            this.currentPage = 1;
            this.updateDisplay();
        }
        
        updateFilterTags() {
            document.querySelectorAll('.filter-tag').forEach(tag => {
                tag.classList.toggle('active', tag.dataset.filter === this.currentFilter);
            });
        }
        
        scrollToTable() {
            const tableContainer = document.querySelector('.gaps-analysis-section');
            if (tableContainer) {
                tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        
        // State management - ultra defensive
        loadPersistedState() {
            try {
                const savedState = localStorage.getItem(this.storageKey);
                if (savedState) {
                    const state = JSON.parse(savedState);
                    
                    this.currentPage = state.currentPage || 1;
                    this.pageSize = state.pageSize || 50;
                    this.currentFilter = state.currentFilter || 'all';
                    this.searchTerm = state.searchTerm || '';
                    this.columnWidths = state.columnWidths || {};
                    this.hiddenColumns = new Set(state.hiddenColumns || ['type']);
                    
                    // Ultra defensive sort state restoration
                    if (state.sortState && typeof state.sortState === 'object') {
                        this.sortState = this.createSafeSortState();
                        
                        // Restore primary sort
                        if (state.sortState.primary && typeof state.sortState.primary === 'object') {
                            this.sortState.primary = {
                                column: state.sortState.primary.column || null,
                                direction: ['asc', 'desc'].includes(state.sortState.primary.direction) ? state.sortState.primary.direction : 'asc'
                            };
                        }
                        
                        // Restore secondary sort
                        if (state.sortState.secondary && typeof state.sortState.secondary === 'object') {
                            this.sortState.secondary = {
                                column: state.sortState.secondary.column || null,
                                direction: ['asc', 'desc'].includes(state.sortState.secondary.direction) ? state.sortState.secondary.direction : 'asc'
                            };
                        }
                    } else {
                        this.sortState = this.createSafeSortState();
                    }
                    
                    console.log('📊 Table state restored from localStorage');
                }
            } catch (e) {
                console.warn('⚠️ Failed to load persisted state:', e);
                // Reset to safe defaults
                this.sortState = this.createSafeSortState();
                this.hiddenColumns = new Set(['type']);
                this.currentFilter = 'all';
                this.searchTerm = '';
                this.currentPage = 1;
            }
        }
        
        saveState() {
            if (this.isDestroyed) return;
            
            try {
                // Validate sort state before saving
                this.validateSortState();
                
                const state = {
                    currentPage: this.currentPage,
                    pageSize: this.pageSize,
                    sortState: this.sortState,
                    currentFilter: this.currentFilter,
                    searchTerm: this.searchTerm,
                    columnWidths: this.columnWidths,
                    hiddenColumns: Array.from(this.hiddenColumns)
                };
                
                localStorage.setItem(this.storageKey, JSON.stringify(state));
            } catch (e) {
                console.warn('⚠️ Failed to save state:', e);
            }
        }
        
        applyColumnVisibility() {
            // Apply column visibility changes
            Object.keys(this.columnVisibility || {}).forEach(columnId => {
                this.updateColumnVisibility(columnId, this.columnVisibility[columnId]);
            });
            
            this.updateDisplay();
            
            // Close modal
            if (window.modalManager) {
                window.modalManager.closeModal();
            }
        }
        
        resetColumnVisibility() {
            this.hiddenColumns = new Set(['type']);
            this.updateDisplay();
            this.saveState();
        }
        
        updateColumnVisibility(columnId, visible) {
            if (visible) {
                this.hiddenColumns.delete(columnId);
            } else {
                this.hiddenColumns.add(columnId);
            }
            
            // Update column display
            const columnCells = this.table.querySelectorAll(`th[data-column="${columnId}"], td[data-column="${columnId}"]`);
            columnCells.forEach(cell => {
                cell.style.display = visible ? '' : 'none';
            });
        }
        
        // Cleanup
        destroy() {
            this.isDestroyed = true;
            this.isInitialized = false;
            this.table = null;
            this.allRows = [];
            this.filteredRows = [];
            this.sortState = this.createSafeSortState();
        }
    }
    """


# Export the JavaScript generator function
__all__ = ['get_table_manager_js'] 