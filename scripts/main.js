/**
 * Main JavaScript functionality for Documentation Coverage Report
 * Handles table interaction, modals, theming, and pagination
 */

class TableManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 50;
        this.totalItems = 0;
        this.filteredItems = [];
        this.allItems = [];
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.filters = {
            search: '',
            status: '',
            priority: ''
        };
        this.columnVisibility = {
            'file-path': true,
            'status': true,
            'priority': true,
            'expected-docs': true,
            'effort': false,
            'quality-issues': false,
            'last-updated': false
        };
        
        this.init();
    }

    init() {
        // Initialize table data
        this.extractTableData();
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Initialize pagination
        this.updatePagination();
        
        // Initialize theme
        this.initializeTheme();
        
        // Initialize column visibility
        this.initializeColumnVisibility();
    }

    extractTableData() {
        const tableRows = document.querySelectorAll('#table-tbody tr.gap-row');
        this.allItems = Array.from(tableRows).map((row, index) => ({
            index,
            element: row,
            data: {
                filePath: row.dataset.filePath || row.cells[0]?.textContent || '',
                status: row.dataset.gapType || row.cells[1]?.textContent || '',
                priority: row.dataset.priority || row.cells[2]?.textContent || '',
                expectedDocs: row.dataset.expectedDoc || row.cells[4]?.textContent || '',
                effort: row.dataset.effort || row.cells[5]?.textContent || '',
                qualityIssues: row.dataset.issuesCount || row.cells[6]?.textContent || '',
                lastUpdated: row.cells[7]?.textContent || ''
            }
        }));
        this.filteredItems = [...this.allItems];
        this.totalItems = this.allItems.length;
    }

    initializeEventListeners() {
        // Search input - use actual ID from HTML
        this.searchInput = document.getElementById('gap-search');
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.handleSearch.bind(this));
        }

        // Filter tags instead of dropdowns
        const filterTags = document.querySelectorAll('.filter-tag');
        filterTags.forEach(tag => {
            tag.addEventListener('click', this.handleFilterTag.bind(this));
        });

        // Page size - this one exists
        this.pageSizeSelect = document.getElementById('page-size-select');
        if (this.pageSizeSelect) {
            this.pageSizeSelect.addEventListener('change', this.handlePageSizeChange.bind(this));
        }

        // Table headers for sorting - use data-column instead of data-sort
        const headers = document.querySelectorAll('th[data-column]');
        headers.forEach(header => {
            header.addEventListener('click', this.handleSort.bind(this));
        });

        // Table rows for clicking - target the actual table body
        this.table = document.querySelector('#table-tbody');
        if (this.table) {
            this.table.addEventListener('click', this.handleRowClick.bind(this));
        }

        // Theme toggle
        const themeToggle = document.querySelector('.theme-toggle-btn');
        if (themeToggle) {
            themeToggle.addEventListener('click', this.toggleTheme.bind(this));
        }

        // Modal close buttons
        const closeButtons = document.querySelectorAll('.modal-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', this.closeModals.bind(this));
        });

        // Modal overlay clicks
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModals();
                }
            });
        });

        // Column picker button
        const columnPickerBtn = document.getElementById('column-picker-btn');
        if (columnPickerBtn) {
            columnPickerBtn.addEventListener('click', this.openColumnPicker.bind(this));
        }

        // GitHub button
        const githubBtn = document.getElementById('open-github-btn');
        if (githubBtn) {
            githubBtn.addEventListener('click', this.openGitHub.bind(this));
        }

        // Column picker buttons
        const resetColumnsBtn = document.getElementById('reset-columns-btn');
        if (resetColumnsBtn) {
            resetColumnsBtn.addEventListener('click', this.resetColumnVisibility.bind(this));
        }

        const applyColumnsBtn = document.getElementById('apply-columns-btn');
        if (applyColumnsBtn) {
            applyColumnsBtn.addEventListener('click', this.applyColumnVisibility.bind(this));
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                this.focusSearch();
            }
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.openColumnPicker();
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });
    }

    handleSearch(e) {
        this.filters.search = e.target.value.toLowerCase();
        this.applyFilters();
    }

    handleFilterTag(e) {
        // Handle filter tag clicks
        const filterValue = e.target.dataset.filter;
        
        // Remove active class from all tags
        document.querySelectorAll('.filter-tag').forEach(tag => {
            tag.classList.remove('active');
        });
        
        // Add active class to clicked tag
        e.target.classList.add('active');
        
        // Apply filter
        this.filters.status = filterValue === 'all' ? '' : filterValue;
        this.applyFilters();
    }

    handleStatusFilter(e) {
        this.filters.status = e.target.value;
        this.applyFilters();
    }

    handlePriorityFilter(e) {
        this.filters.priority = e.target.value;
        this.applyFilters();
    }

    handlePageSizeChange(e) {
        this.pageSize = parseInt(e.target.value);
        this.currentPage = 1;
        this.updateDisplay();
    }

    handleSort(e) {
        const column = e.target.closest('th').dataset.column;
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        this.applySorting();
    }

    handleRowClick(e) {
        const row = e.target.closest('tr');
        if (row && row.classList.contains('gap-row')) {
            const filePath = row.dataset.filePath || row.cells[0]?.textContent || '';
            this.openSourceModal(filePath);
        }
    }

    applyFilters() {
        this.filteredItems = this.allItems.filter(item => {
            const matchesSearch = !this.filters.search || 
                item.data.filePath.toLowerCase().includes(this.filters.search);
            
            // Handle filter tag values
            let matchesStatus = true;
            if (this.filters.status && this.filters.status !== 'all') {
                switch (this.filters.status) {
                    case 'critical':
                        matchesStatus = item.data.priority === 'critical';
                        break;
                    case 'high':
                        matchesStatus = item.data.priority === 'high';
                        break;
                    case 'medium':
                        matchesStatus = item.data.priority === 'medium';
                        break;
                    case 'low':
                        matchesStatus = item.data.priority === 'low';
                        break;
                    case 'missing':
                        matchesStatus = item.data.status === 'missing';
                        break;
                    case 'inadequate':
                        matchesStatus = item.data.status === 'inadequate';
                        break;
                    default:
                        matchesStatus = true;
                }
            }
            
            return matchesSearch && matchesStatus;
        });
        
        this.currentPage = 1;
        this.updateDisplay();
        this.updateFilterStatus();
    }

    updateFilterStatus() {
        const filterStatus = document.getElementById('filter-status');
        if (filterStatus) {
            const total = this.filteredItems.length;
            const totalAll = this.allItems.length;
            
            if (total === totalAll) {
                filterStatus.textContent = `Showing all ${total} items`;
            } else {
                filterStatus.textContent = `Showing ${total} of ${totalAll} items`;
            }
        }
    }

    applySorting() {
        if (!this.sortColumn) return;
        
        this.filteredItems.sort((a, b) => {
            const aValue = a.data[this.sortColumn] || '';
            const bValue = b.data[this.sortColumn] || '';
            
            let comparison = 0;
            if (aValue < bValue) comparison = -1;
            if (aValue > bValue) comparison = 1;
            
            return this.sortDirection === 'desc' ? -comparison : comparison;
        });
        
        this.updateDisplay();
    }

    updateDisplay() {
        this.updateTableVisibility();
        this.updatePagination();
        this.updateItemCount();
    }

    updateTableVisibility() {
        // Hide all rows first
        this.allItems.forEach(item => {
            item.element.style.display = 'none';
        });
        
        // Show filtered and paginated rows
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageItems = this.filteredItems.slice(startIndex, endIndex);
        
        pageItems.forEach(item => {
            item.element.style.display = '';
        });
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredItems.length / this.pageSize);
        const paginationContainer = document.querySelector('.pagination-container');
        
        if (!paginationContainer) return;
        
        // Update pagination HTML
        paginationContainer.innerHTML = this.generatePaginationHTML(totalPages);
    }

    generatePaginationHTML(totalPages) {
        if (totalPages <= 1) return '';
        
        let html = '<div class="pagination-controls">';
        
        // Previous button
        if (this.currentPage > 1) {
            html += `<button class="pagination-btn" onclick="tableManager.goToPage(${this.currentPage - 1})">‹</button>`;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                html += `<button class="pagination-btn active">${i}</button>`;
            } else {
                html += `<button class="pagination-btn" onclick="tableManager.goToPage(${i})">${i}</button>`;
            }
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            html += `<button class="pagination-btn" onclick="tableManager.goToPage(${this.currentPage + 1})">›</button>`;
        }
        
        html += '</div>';
        return html;
    }

    updateItemCount() {
        const totalElement = document.querySelector('.total-items');
        if (totalElement) {
            totalElement.textContent = `Total: ${this.filteredItems.length} items`;
        }
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredItems.length / this.pageSize);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.updateDisplay();
        }
    }

    openSourceModal(filePath) {
        const modal = document.getElementById('source-code-modal');
        const modalTitle = document.getElementById('source-modal-title');
        const sourceCode = document.getElementById('source-code-content');
        
        if (!modal || !modalTitle || !sourceCode) return;
        
        modalTitle.textContent = `📄 ${filePath}`;
        sourceCode.innerHTML = '<div class="source-loading">Loading source code...</div>';
        
        modal.classList.add('show');
        
        // Simulate loading source code
        setTimeout(() => {
            sourceCode.innerHTML = `<code>// Source code for ${filePath}
// This would typically load from the actual file
console.log('File: ${filePath}');

// Example content
function example() {
    return "This is example source code";
}

export default example;</code>`;
        }, 500);
    }

    openColumnPicker() {
        const modal = document.getElementById('column-picker-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    openGitHub() {
        // Would open GitHub file in new tab
        // Implementation would go here
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    initializeColumnVisibility() {
        const checkboxes = document.querySelectorAll('.column-checkbox');
        checkboxes.forEach(checkbox => {
            const columnName = checkbox.dataset.column;
            if (this.columnVisibility[columnName] !== undefined) {
                checkbox.checked = this.columnVisibility[columnName];
            }
            
            checkbox.addEventListener('change', (e) => {
                this.toggleColumnVisibility(columnName, e.target.checked);
            });
        });
    }

    toggleColumnVisibility(columnName, visible) {
        this.columnVisibility[columnName] = visible;
        
        // Update table column visibility
        const table = document.querySelector('table');
        if (!table) return;
        
        const columnIndex = this.getColumnIndex(columnName);
        if (columnIndex === -1) return;
        
        // Hide/show header
        const headerCells = table.querySelectorAll('th');
        if (headerCells[columnIndex]) {
            headerCells[columnIndex].style.display = visible ? '' : 'none';
        }
        
        // Hide/show data cells
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            if (row.cells[columnIndex]) {
                row.cells[columnIndex].style.display = visible ? '' : 'none';
            }
        });
    }

    getColumnIndex(columnName) {
        const columnMap = {
            'file-path': 0,
            'status': 1,
            'priority': 2,
            'expected-docs': 3,
            'effort': 4,
            'quality-issues': 5,
            'last-updated': 6
        };
        return columnMap[columnName] || -1;
    }

    focusSearch() {
        if (this.searchInput) {
            this.searchInput.focus();
        }
    }

    applyColumnVisibility() {
        const modal = document.getElementById('column-picker-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    resetColumnVisibility() {
        this.columnVisibility = {
            'file-path': true,
            'status': true,
            'priority': true,
            'expected-docs': true,
            'effort': false,
            'quality-issues': false,
            'last-updated': false
        };
        
        const checkboxes = document.querySelectorAll('.column-checkbox');
        checkboxes.forEach(checkbox => {
            const columnName = checkbox.dataset.column;
            if (this.columnVisibility[columnName] !== undefined) {
                checkbox.checked = this.columnVisibility[columnName];
                this.toggleColumnVisibility(columnName, this.columnVisibility[columnName]);
            }
        });
    }
}

// Global functions for inline event handlers
function toggleTheme() {
    if (window.tableManager) {
        window.tableManager.toggleTheme();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tableManager = new TableManager();
}); 