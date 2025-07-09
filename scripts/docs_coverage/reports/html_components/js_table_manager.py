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
                
                // Setup scroll sync even in basic mode
                this.setupScrollSync();
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
            
            // Setup column sorting - headers are now in a separate table
            const headerTable = document.querySelector('.advanced-table-header .advanced-table');
            if (headerTable) {
                headerTable.querySelectorAll('th.sortable').forEach(th => {
                    th.addEventListener('click', (e) => {
                        if (this.isDestroyed) return;
                        this.handleColumnSort(e, th);
                    });
                });
            } else {
                console.warn('⚠️ Header table not found!');
            }
            
            // Setup horizontal scroll synchronization
            this.setupScrollSync();
            
            console.log('🎯 Table event handlers attached');
        }
        
        setupScrollSync() {
            // Get header and body containers
            const headerContainer = document.querySelector('.advanced-table-header');
            const bodyContainer = document.querySelector('.advanced-table-body');
            
            if (!headerContainer || !bodyContainer) {
                console.warn('⚠️ Could not find header or body containers for scroll sync');
                return;
            }
            
            // Prevent infinite loop with flags
            let isHeaderScrolling = false;
            let isBodyScrolling = false;
            
            // Sync header scroll to body scroll
            headerContainer.addEventListener('scroll', () => {
                if (this.isDestroyed || isBodyScrolling) return;
                isHeaderScrolling = true;
                bodyContainer.scrollLeft = headerContainer.scrollLeft;
                setTimeout(() => { isHeaderScrolling = false; }, 0);
            });
            
            // Sync body scroll to header scroll
            bodyContainer.addEventListener('scroll', () => {
                if (this.isDestroyed || isHeaderScrolling) return;
                isBodyScrolling = true;
                headerContainer.scrollLeft = bodyContainer.scrollLeft;
                setTimeout(() => { isBodyScrolling = false; }, 0);
            });
            
            console.log('🔄 Horizontal scroll synchronization setup completed');
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
            // Page size selector - use correct ID from HTML
            const pageSizeSelect = document.getElementById('items-per-page');
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
            
            // Pagination buttons - use correct IDs from HTML
            const paginationButtons = [
                { id: 'first-page', action: () => this.goToPage(1) },
                { id: 'prev-page', action: () => this.goToPage(this.currentPage - 1) },
                { id: 'next-page', action: () => this.goToPage(this.currentPage + 1) },
                { id: 'last-page', action: () => this.goToPage(this.totalPages) }
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
            
            // Current page input - use correct ID from HTML
            const currentPageInput = document.getElementById('current-page');
            if (currentPageInput) {
                currentPageInput.addEventListener('change', (e) => {
                    if (this.isDestroyed) return;
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= this.totalPages) {
                        this.goToPage(page);
                    }
                });
            }
            
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
            
            // Clear all filters button - main one
            const clearAllFiltersBtn = document.getElementById('clear-all-filters');
            if (clearAllFiltersBtn) {
                clearAllFiltersBtn.addEventListener('click', (e) => {
                    if (this.isDestroyed) return;
                    this.clearAllFilters();
                });
            }
            
            // Clear filters from empty state
            const clearFiltersEmptyBtn = document.getElementById('clear-filters-empty');
            if (clearFiltersEmptyBtn) {
                clearFiltersEmptyBtn.addEventListener('click', (e) => {
                    if (this.isDestroyed) return;
                    this.clearAllFilters();
                });
            }
            
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
            const filterType = tag.dataset.filter;
            const filterValue = tag.dataset.value;
            
            console.log(`🏷️ Filter tag clicked: ${filterType}=${filterValue}`);
            
            // Handle grouped filters (priority, status) or direct filters
            const actualFilter = filterValue !== undefined ? filterValue : filterType;
            
            // Remove active class from tags in the same group
            const filterGroup = tag.closest('.filter-group');
            if (filterGroup) {
                filterGroup.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
            } else {
                // Fallback: remove from all filter tags
                document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
            }
            
            // Add active class to clicked tag
            tag.classList.add('active');
            
            this.currentFilter = actualFilter === '' ? 'all' : actualFilter;
            this.currentPage = 1;
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
        
        updateDisplay() {
            if (this.isDestroyed) return;
            
            try {
                // Calculate pagination
                this.totalPages = Math.ceil(this.filteredRows.length / this.pageSize);
                if (this.currentPage > this.totalPages) {
                    this.currentPage = Math.max(1, this.totalPages);
                }
                
                // Check if we need to show empty state
                const emptyState = document.getElementById('empty-state');
                const table = document.getElementById('gaps-table');
                const paginationContainer = document.querySelector('.pagination-container');
                
                if (this.filteredRows.length === 0) {
                    // Show empty state, hide table and pagination
                    if (emptyState) emptyState.style.display = 'block';
                    if (table) table.style.display = 'none';
                    if (paginationContainer) paginationContainer.style.display = 'none';
                    
                    console.log('📭 No records found - showing empty state');
                } else {
                    // Show table and pagination, hide empty state
                    if (emptyState) emptyState.style.display = 'none';
                    if (table) table.style.display = 'table';
                    if (paginationContainer) paginationContainer.style.display = 'flex';
                    
                    // First, reorder the DOM to match the sorted filteredRows
                    this.reorderTableRows();
                    
                    // Then show/hide rows based on pagination
                    this.allRows.forEach(row => row.style.display = 'none');
                    
                    const startIndex = (this.currentPage - 1) * this.pageSize;
                    const endIndex = startIndex + this.pageSize;
                    
                    this.filteredRows.slice(startIndex, endIndex).forEach(row => {
                        row.style.display = '';
                    });
                    
                    console.log(`📊 Display updated - Page ${this.currentPage}/${this.totalPages}, showing ${Math.min(this.pageSize, this.filteredRows.length - startIndex)} rows`);
                }
                
                // Update pagination info
                this.updatePaginationInfo();
                this.updatePaginationButtons();
                this.safeUpdateSortIndicators();
                
            } catch (error) {
                console.error('❌ Error updating display:', error);
            }
        }
        
        updatePaginationInfo() {
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = Math.min(startIndex + this.pageSize, this.filteredRows.length);
            
            // Update showing start/end/total elements
            const showingStart = document.getElementById('showing-start');
            const showingEnd = document.getElementById('showing-end');
            const showingTotal = document.getElementById('showing-total');
            
            if (showingStart) showingStart.textContent = startIndex + 1;
            if (showingEnd) showingEnd.textContent = endIndex;
            if (showingTotal) showingTotal.textContent = this.filteredRows.length;
            
            console.log(`📊 Pagination info updated: ${startIndex + 1}-${endIndex} of ${this.filteredRows.length}`);
        }
        
        updatePaginationButtons() {
            const buttons = [
                { ids: ['first-page'], condition: this.currentPage <= 1 },
                { ids: ['prev-page'], condition: this.currentPage <= 1 },
                { ids: ['next-page'], condition: this.currentPage >= this.totalPages },
                { ids: ['last-page'], condition: this.currentPage >= this.totalPages }
            ];
            
            buttons.forEach(({ ids, condition }) => {
                ids.forEach(id => {
                    const btn = document.getElementById(id);
                    if (btn) {
                        btn.disabled = condition;
                    }
                });
            });
            
            // Update current page input
            const currentPageInput = document.getElementById('current-page');
            if (currentPageInput) {
                currentPageInput.value = this.currentPage;
                currentPageInput.max = this.totalPages;
            }
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
            if (this.sortState.primary && this.sortState.primary.column) {
                const primaryTh = headerTable.querySelector(`th[data-column="${this.sortState.primary.column}"]`);
                if (primaryTh) {
                    primaryTh.classList.add('sort-primary');
                    primaryTh.classList.add(this.sortState.primary.direction === 'asc' ? 'sort-asc' : 'sort-desc');
                }
            }
            
            // Add secondary sort indicator
            if (this.sortState.secondary && this.sortState.secondary.column) {
                const secondaryTh = headerTable.querySelector(`th[data-column="${this.sortState.secondary.column}"]`);
                if (secondaryTh) {
                    secondaryTh.classList.add('sort-secondary');
                    secondaryTh.classList.add(this.sortState.secondary.direction === 'asc' ? 'sort-asc' : 'sort-desc');
                }
            }
        }
        
        reorderTableRows() {
            if (!this.table || !this.filteredRows.length) return;
            
            const tbody = this.table.querySelector('tbody');
            if (!tbody) return;
            
            // Create a document fragment to efficiently reorder the DOM
            const fragment = document.createDocumentFragment();
            
            // Add filtered rows to fragment in sorted order
            this.filteredRows.forEach(row => {
                fragment.appendChild(row);
            });
            
            // Add any non-filtered rows (hidden) to the end
            this.allRows.forEach(row => {
                if (!this.filteredRows.includes(row)) {
                    fragment.appendChild(row);
                }
            });
            
            // Replace tbody content with reordered rows
            tbody.appendChild(fragment);
            
            console.log(`🔄 Table rows reordered - ${this.filteredRows.length} filtered rows in sorted order`);
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
                    const status = row.dataset.status; // Using data-status instead of data-gap-type
                    
                    if (this.currentFilter === 'missing' && status !== 'missing') return false;
                    if (this.currentFilter === 'inadequate' && status !== 'inadequate') return false;
                    if (['critical', 'high', 'medium', 'low'].includes(this.currentFilter) && priority !== this.currentFilter) return false;
                }
                
                return true;
            });
            
            this.currentPage = 1;
            this.updateDisplay();
        }
        
        clearAllFilters() {
            if (this.isDestroyed) return;
            
            console.log('🧹 Clearing all filters');
            
            // Reset filter state
            this.currentFilter = 'all';
            this.searchTerm = '';
            this.currentPage = 1;
            
            // Reset search input
            const searchInput = document.getElementById('gap-search');
            if (searchInput) {
                searchInput.value = '';
            }
            
            // Reset filter tags - be more specific about which tags to activate
            document.querySelectorAll('.filter-tag').forEach(tag => {
                tag.classList.remove('active');
            });
            
            // Activate "All" filter tags (the ones with empty data-value or data-filter="all")
            document.querySelectorAll('.filter-tag[data-value=""], .filter-tag[data-filter="all"]').forEach(tag => {
                tag.classList.add('active');
            });
            
            // Apply filters (will show all items)
            this.safeApplyFilters();
            this.saveState();
            
            console.log('✨ All filters cleared successfully');
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
            
            // Clean up scroll event listeners
            const headerContainer = document.querySelector('.advanced-table-header');
            const bodyContainer = document.querySelector('.advanced-table-body');
            if (headerContainer && bodyContainer) {
                // Remove event listeners by cloning and replacing nodes
                const newHeaderContainer = headerContainer.cloneNode(true);
                const newBodyContainer = bodyContainer.cloneNode(true);
                headerContainer.parentNode.replaceChild(newHeaderContainer, headerContainer);
                bodyContainer.parentNode.replaceChild(newBodyContainer, bodyContainer);
                console.log('🧹 Scroll event listeners cleaned up');
            }
            
            this.table = null;
            this.allRows = [];
            this.filteredRows = [];
            this.sortState = this.createSafeSortState();
        }
    }
    """


# Export the JavaScript generator function
__all__ = ['get_table_manager_js'] 