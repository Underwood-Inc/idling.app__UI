#!/usr/bin/env python3
"""
Table Management JavaScript for HTML Documentation Coverage Report

Provides table-specific interactive features including sorting, filtering, and pagination.
"""

def get_table_manager_js() -> str:
    """Generate JavaScript for table management functionality."""
    return """
    // Enhanced Table Manager with Fixed Event Handling
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
            this.sortState = { 
                primary: { column: null, direction: 'asc' },
                secondary: { column: null, direction: 'asc' }
            };
            this.columnWidths = {};
            this.hiddenColumns = new Set();
            this.storageKey = 'docs-coverage-table-state';
            
            // Bind methods to preserve context
            this.handleRowClick = this.handleRowClick.bind(this);
            this.handleFilenameClick = this.handleFilenameClick.bind(this);
            this.handleColumnSort = this.handleColumnSort.bind(this);
            this.handleFilterTagClick = this.handleFilterTagClick.bind(this);
            this.handleCardClick = this.handleCardClick.bind(this);
            
            this.init();
        }
        
        init() {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
            } else {
                this.initializeComponents();
            }
        }
        
        initializeComponents() {
            console.log('🔧 Initializing Enhanced Table Manager...');
            
            this.setupTable();
            this.setupPagination();
            this.setupFilters();
            this.setupColumnManagement();
            this.loadPersistedState();
            this.updateDisplay();
            
            console.log('✅ Enhanced Table Manager initialized successfully!');
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
                row.addEventListener('click', (e) => this.handleRowClick(e, row));
            });
            
            // Setup filename click handlers for GitHub links
            this.table.querySelectorAll('.clickable-filename').forEach(filename => {
                filename.addEventListener('click', this.handleFilenameClick);
            });
            
            // Setup column sorting
            this.table.querySelectorAll('th.sortable').forEach(th => {
                th.addEventListener('click', (e) => this.handleColumnSort(e, th));
            });
            
            // Setup column resizing
            this.setupColumnResizing();
            
            console.log('🎯 Table event handlers attached');
        }
        
        handleRowClick(e, row) {
            // Don't trigger if clicking on filename (GitHub link)
            if (e.target.classList.contains('clickable-filename')) {
                return;
            }
            
            console.log('🖱️ Row clicked:', row.dataset.fileName);
            this.showSourceCodeModal(row);
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
        
        handleFilterTagClick(e) {
            const tag = e.target;
            const filter = tag.dataset.filter;
            
            console.log(`🏷️ Filter tag clicked: ${filter}`);
            this.currentFilter = filter;
            this.currentPage = 1;
            this.updateFilterTags();
            this.applyFilters();
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
                this.applyFilters();
                this.scrollToTable();
                this.saveState();
            }
        }
        
        setupPagination() {
            // Page size selector
            const pageSizeSelect = document.getElementById('page-size-select');
            if (pageSizeSelect) {
                pageSizeSelect.addEventListener('change', (e) => {
                    this.pageSize = e.target.value === 'all' ? this.filteredRows.length : parseInt(e.target.value);
                    this.currentPage = 1;
                    this.updateDisplay();
                    this.saveState();
                    console.log(`📄 Page size changed to: ${this.pageSize}`);
                });
            }
            
            // Pagination buttons with proper event handling
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
                    btn.addEventListener('click', action);
                }
            });
            
            console.log('📄 Pagination handlers attached');
        }
        
        setupFilters() {
            // Search input
            const searchInput = document.getElementById('gap-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.searchTerm = e.target.value.toLowerCase();
                    this.currentPage = 1;
                    this.applyFilters();
                    this.saveState();
                    console.log(`🔍 Search term: ${this.searchTerm}`);
                });
            }
            
            // Filter tags
            document.querySelectorAll('.filter-tag').forEach(tag => {
                tag.addEventListener('click', this.handleFilterTagClick);
            });
            
            // Clickable cards for filtering
            document.querySelectorAll('.clickable-card').forEach(card => {
                card.addEventListener('click', this.handleCardClick);
            });
            
            // Clear filters button
            const clearFiltersBtn = document.getElementById('clear-filters');
            if (clearFiltersBtn) {
                clearFiltersBtn.addEventListener('click', () => {
                    this.clearAllFilters();
                    console.log('🧹 All filters cleared');
                });
            }
            
            console.log('🏷️ Filter handlers attached');
        }
        
        setupColumnManagement() {
            // Column picker button
            const columnPickerBtn = document.getElementById('column-picker-btn');
            if (columnPickerBtn) {
                columnPickerBtn.addEventListener('click', () => {
                    this.showColumnPicker();
                });
            }
            
            // Reset table button
            const resetTableBtn = document.getElementById('reset-table-btn');
            if (resetTableBtn) {
                resetTableBtn.addEventListener('click', () => {
                    this.resetTableSettings();
                });
            }
            
            console.log('⚙️ Column management handlers attached');
        }
        
        setupColumnResizing() {
            if (!this.table) return;
            
            const headers = this.table.querySelectorAll('th');
            headers.forEach(th => {
                const resizer = th.querySelector('.resize-handle');
                if (resizer) {
                    let isResizing = false;
                    let startX = 0;
                    let startWidth = 0;
                    
                    resizer.addEventListener('mousedown', (e) => {
                        isResizing = true;
                        startX = e.clientX;
                        startWidth = parseInt(window.getComputedStyle(th).width, 10);
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                        e.preventDefault();
                    });
                    
                    const handleMouseMove = (e) => {
                        if (!isResizing) return;
                        const width = startWidth + e.clientX - startX;
                        th.style.width = Math.max(50, width) + 'px';
                        this.columnWidths[th.dataset.column] = Math.max(50, width);
                    };
                    
                    const handleMouseUp = () => {
                        isResizing = false;
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                        this.saveState();
                    };
                }
            });
        }
        
        toggleSort(column, isMultiSort) {
            if (!isMultiSort) {
                // Single column sort - replace primary sort
                if (this.sortState.primary.column === column) {
                    this.sortState.primary.direction = this.sortState.primary.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortState.primary = { column, direction: 'asc' };
                    this.sortState.secondary = { column: null, direction: 'asc' };
                }
            } else {
                // Multi-column sort
                if (this.sortState.primary.column === column) {
                    this.sortState.primary.direction = this.sortState.primary.direction === 'asc' ? 'desc' : 'asc';
                } else if (this.sortState.secondary.column === column) {
                    this.sortState.secondary.direction = this.sortState.secondary.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    // Move primary to secondary, set new primary
                    this.sortState.secondary = { ...this.sortState.primary };
                    this.sortState.primary = { column, direction: 'asc' };
                }
            }
            
            this.applySort();
            this.updateSortIndicators();
            this.updateDisplay();
            this.saveState();
        }
        
        applySort() {
            if (!this.sortState.primary.column) return;
            
            this.filteredRows.sort((a, b) => {
                const primaryResult = this.compareRows(a, b, this.sortState.primary.column, this.sortState.primary.direction);
                
                if (primaryResult !== 0 || !this.sortState.secondary.column) {
                    return primaryResult;
                }
                
                return this.compareRows(a, b, this.sortState.secondary.column, this.sortState.secondary.direction);
            });
        }
        
        compareRows(rowA, rowB, column, direction) {
            const cellA = rowA.querySelector(`td.col-${column}`);
            const cellB = rowB.querySelector(`td.col-${column}`);
            
            if (!cellA || !cellB) return 0;
            
            const valueA = cellA.dataset.sort || cellA.textContent.trim();
            const valueB = cellB.dataset.sort || cellB.textContent.trim();
            
            let result = 0;
            
            // Handle numeric values
            if (!isNaN(valueA) && !isNaN(valueB)) {
                result = parseFloat(valueA) - parseFloat(valueB);
            } else {
                result = valueA.localeCompare(valueB);
            }
            
            return direction === 'desc' ? -result : result;
        }
        
        updateSortIndicators() {
            // Clear all indicators
            this.table.querySelectorAll('.sort-indicators').forEach(indicator => {
                indicator.innerHTML = '';
            });
            
            // Add primary sort indicator
            if (this.sortState.primary.column) {
                const primaryTh = this.table.querySelector(`th[data-column="${this.sortState.primary.column}"]`);
                if (primaryTh) {
                    const indicator = primaryTh.querySelector('.sort-indicators');
                    if (indicator) {
                        const arrow = this.sortState.primary.direction === 'asc' ? '↑' : '↓';
                        indicator.innerHTML = `<span class="sort-primary">${arrow}1</span>`;
                    }
                }
            }
            
            // Add secondary sort indicator
            if (this.sortState.secondary.column) {
                const secondaryTh = this.table.querySelector(`th[data-column="${this.sortState.secondary.column}"]`);
                if (secondaryTh) {
                    const indicator = secondaryTh.querySelector('.sort-indicators');
                    if (indicator) {
                        const arrow = this.sortState.secondary.direction === 'asc' ? '↑' : '↓';
                        indicator.innerHTML += `<span class="sort-secondary">${arrow}2</span>`;
                    }
                }
            }
        }
        
        goToPage(page) {
            if (page < 1 || page > this.totalPages) return;
            
            this.currentPage = page;
            this.updateDisplay();
            this.saveState();
            
            // Scroll to table
            this.scrollToTable();
        }
        
        scrollToTable() {
            const tableContainer = document.querySelector('.gaps-analysis-section');
            if (tableContainer) {
                tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        
        updateDisplay() {
            this.updateTableRows();
            this.updatePaginationInfo();
            this.updatePaginationButtons();
        }
        
        updateTableRows() {
            // Calculate pagination
            this.totalPages = Math.ceil(this.filteredRows.length / this.pageSize);
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = Math.min(startIndex + this.pageSize, this.filteredRows.length);
            
            // Hide all rows
            this.allRows.forEach(row => {
                row.style.display = 'none';
            });
            
            // Show current page rows
            for (let i = startIndex; i < endIndex; i++) {
                if (this.filteredRows[i]) {
                    this.filteredRows[i].style.display = '';
                }
            }
        }
        
        updatePaginationInfo() {
            const startIndex = (this.currentPage - 1) * this.pageSize + 1;
            const endIndex = Math.min(this.currentPage * this.pageSize, this.filteredRows.length);
            
            const infoText = `Showing ${startIndex}-${endIndex} of ${this.filteredRows.length} items`;
            
            // Update both top and bottom pagination info
            const infoElements = [
                document.getElementById('pagination-info-text'),
                document.getElementById('pagination-info-text-bottom')
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
    }
    """


# Export the JavaScript generator function
__all__ = ['get_table_manager_js'] 