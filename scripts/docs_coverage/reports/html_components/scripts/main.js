// Main JavaScript for Documentation Coverage Report
// Enhanced Table Manager with Pagination, Source Code Modals, and Timestamp Tooltips

class EnhancedTableManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 50;
        this.totalRows = 0;
        this.filteredRows = 0;
        this.sortColumns = [];
        this.filterText = '';
        this.statusFilter = 'all';
        this.priorityFilter = 'all';
        this.allRows = [];
        this.filteredData = [];
        this.visibleColumns = new Set();
        this.sourceModal = null;
        this.columnModal = null;
        this.timestampTooltip = null;
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.loadColumnVisibility();
        this.loadData();
        this.setupKeyboardShortcuts();
        this.initializeTheme();
    }
    
    cacheElements() {
        this.table = document.querySelector('.coverage-table tbody');
        this.searchInput = document.querySelector('.search-input');
        this.statusSelect = document.querySelector('.status-filter');
        this.prioritySelect = document.querySelector('.priority-filter');
        this.pageInfo = document.querySelector('.page-info');
        this.pageSizeSelect = document.querySelector('.page-size-select');
        this.paginationContainer = document.querySelector('.pagination-controls');
        this.sourceModal = document.getElementById('source-code-modal');
        this.columnModal = document.getElementById('column-picker-modal');
        this.timestampTooltip = document.getElementById('timestamp-tooltip');
    }
    
    setupEventListeners() {
        // Search and filters
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.handleSearch.bind(this));
        }
        
        if (this.statusSelect) {
            this.statusSelect.addEventListener('change', this.handleStatusFilter.bind(this));
        }
        
        if (this.prioritySelect) {
            this.prioritySelect.addEventListener('change', this.handlePriorityFilter.bind(this));
        }
        
        // Page size
        if (this.pageSizeSelect) {
            this.pageSizeSelect.addEventListener('change', this.handlePageSizeChange.bind(this));
        }
        
        // Table sorting
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', this.handleSort.bind(this));
        });
        
        // Row clicks for source code modal
        if (this.table) {
            this.table.addEventListener('click', this.handleRowClick.bind(this));
        }
        
        // Modal controls
        this.setupModalControls();
        
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle-btn');
        if (themeToggle) {
            themeToggle.addEventListener('click', this.toggleTheme.bind(this));
        }
    }
    
    setupModalControls() {
        // Close modals
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', this.closeModals.bind(this));
        });
        
        // Close on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModals();
                }
            });
        });
        
        // Column picker
        const columnPickerBtn = document.getElementById('column-picker-btn');
        if (columnPickerBtn) {
            columnPickerBtn.addEventListener('click', this.openColumnPicker.bind(this));
        }
        
        // GitHub link
        const githubBtn = document.getElementById('open-github-btn');
        if (githubBtn) {
            githubBtn.addEventListener('click', this.openGitHub.bind(this));
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+F for search
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                if (this.searchInput) {
                    this.searchInput.focus();
                }
            }
            
            // Ctrl+K for column picker
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.openColumnPicker();
            }
            
            // Ctrl+Shift+T for theme toggle
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });
    }
    
    loadData() {
        // Extract data from table
        const rows = Array.from(document.querySelectorAll('.coverage-table tbody tr'));
        this.allRows = rows.map(row => ({
            element: row,
            data: this.extractRowData(row)
        }));
        
        this.totalRows = this.allRows.length;
        this.filteredData = [...this.allRows];
        this.filteredRows = this.totalRows;
        
        this.updateDisplay();
    }
    
    extractRowData(row) {
        const cells = row.querySelectorAll('td');
        return {
            file: cells[0]?.textContent.trim() || '',
            status: cells[1]?.textContent.trim() || '',
            priority: cells[2]?.textContent.trim() || '',
            expected: cells[3]?.textContent.trim() || '',
            effort: cells[4]?.textContent.trim() || '',
            issues: cells[5]?.textContent.trim() || '',
            lastUpdated: cells[6]?.textContent.trim() || ''
        };
    }
    
    handleSearch() {
        this.filterText = this.searchInput.value.toLowerCase();
        this.currentPage = 1;
        this.applyFilters();
    }
    
    handleStatusFilter() {
        this.statusFilter = this.statusSelect.value;
        this.currentPage = 1;
        this.applyFilters();
    }
    
    handlePriorityFilter() {
        this.priorityFilter = this.prioritySelect.value;
        this.currentPage = 1;
        this.applyFilters();
    }
    
    applyFilters() {
        this.filteredData = this.allRows.filter(row => {
            const data = row.data;
            
            // Text search
            if (this.filterText) {
                const searchText = `${data.file} ${data.status} ${data.priority} ${data.expected} ${data.issues}`.toLowerCase();
                if (!searchText.includes(this.filterText)) {
                    return false;
                }
            }
            
            // Status filter
            if (this.statusFilter !== 'all' && data.status.toLowerCase() !== this.statusFilter) {
                return false;
            }
            
            // Priority filter
            if (this.priorityFilter !== 'all' && data.priority.toLowerCase() !== this.priorityFilter) {
                return false;
            }
            
            return true;
        });
        
        this.filteredRows = this.filteredData.length;
        this.updateDisplay();
    }
    
    handleSort(e) {
        const header = e.currentTarget;
        const column = header.dataset.column;
        
        if (!column) return;
        
        // Handle multi-column sorting with Ctrl+click
        if (e.ctrlKey) {
            this.addSortColumn(column);
        } else {
            this.setSingleSort(column);
        }
        
        this.updateSortHeaders();
        this.sortData();
        this.updateDisplay();
    }
    
    setSingleSort(column) {
        const existing = this.sortColumns.find(col => col.column === column);
        if (existing) {
            existing.direction = existing.direction === 'asc' ? 'desc' : 'asc';
            this.sortColumns = [existing];
        } else {
            this.sortColumns = [{ column, direction: 'asc' }];
        }
    }
    
    addSortColumn(column) {
        const existingIndex = this.sortColumns.findIndex(col => col.column === column);
        if (existingIndex >= 0) {
            const existing = this.sortColumns[existingIndex];
            if (existing.direction === 'desc') {
                this.sortColumns.splice(existingIndex, 1);
            } else {
                existing.direction = 'desc';
            }
        } else {
            this.sortColumns.push({ column, direction: 'asc' });
        }
    }
    
    updateSortHeaders() {
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc', 'sort-primary', 'sort-secondary');
        });
        
        this.sortColumns.forEach((sort, index) => {
            const header = document.querySelector(`[data-column="${sort.column}"]`);
            if (header) {
                header.classList.add(`sort-${sort.direction}`);
                if (index === 0) {
                    header.classList.add('sort-primary');
                } else if (index === 1) {
                    header.classList.add('sort-secondary');
                }
            }
        });
    }
    
    sortData() {
        this.filteredData.sort((a, b) => {
            for (const sort of this.sortColumns) {
                const aVal = a.data[sort.column] || '';
                const bVal = b.data[sort.column] || '';
                
                let comparison = 0;
                if (aVal < bVal) comparison = -1;
                else if (aVal > bVal) comparison = 1;
                
                if (comparison !== 0) {
                    return sort.direction === 'asc' ? comparison : -comparison;
                }
            }
            return 0;
        });
    }
    
    handlePageSizeChange() {
        this.pageSize = parseInt(this.pageSizeSelect.value);
        this.currentPage = 1;
        this.updateDisplay();
    }
    
    updateDisplay() {
        this.renderTable();
        this.renderPagination();
        this.updatePageInfo();
    }
    
    renderTable() {
        if (!this.table) return;
        
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageData = this.filteredData.slice(startIndex, endIndex);
        
        // Clear table
        this.table.innerHTML = '';
        
        if (pageData.length === 0) {
            this.table.innerHTML = `
                <tr>
                    <td colspan="100%" class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <div class="empty-state-text">No results found</div>
                        <div class="empty-state-subtext">Try adjusting your search or filters</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        pageData.forEach(row => {
            this.table.appendChild(row.element);
        });
    }
    
    renderPagination() {
        if (!this.paginationContainer) return;
        
        const totalPages = Math.ceil(this.filteredRows / this.pageSize);
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="tableManager.goToPage(${this.currentPage - 1})">
                ← Previous
            </button>
        `;
        
        // Page numbers
        if (startPage > 1) {
            paginationHTML += `
                <button class="pagination-btn" onclick="tableManager.goToPage(1)">1</button>
            `;
            if (startPage > 2) {
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="tableManager.goToPage(${i})">${i}</button>
            `;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
            }
            paginationHTML += `
                <button class="pagination-btn" onclick="tableManager.goToPage(${totalPages})">${totalPages}</button>
            `;
        }
        
        // Next button
        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
                    onclick="tableManager.goToPage(${this.currentPage + 1})">
                Next →
            </button>
        `;
        
        this.paginationContainer.innerHTML = paginationHTML;
    }
    
    updatePageInfo() {
        if (!this.pageInfo) return;
        
        const startIndex = (this.currentPage - 1) * this.pageSize + 1;
        const endIndex = Math.min(this.currentPage * this.pageSize, this.filteredRows);
        
        this.pageInfo.textContent = `Showing ${startIndex}-${endIndex} of ${this.filteredRows} results`;
    }
    
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredRows / this.pageSize);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.updateDisplay();
        }
    }
    
    handleRowClick(e) {
        const row = e.target.closest('tr');
        if (!row) return;
        
        const fileCell = row.querySelector('td:first-child');
        if (!fileCell) return;
        
        const filePath = fileCell.textContent.trim();
        this.openSourceModal(filePath);
    }
    
    openSourceModal(filePath) {
        if (!this.sourceModal) return;
        
        // Show modal
        this.sourceModal.classList.add('show');
        
        // Update title
        const title = document.getElementById('source-modal-title');
        if (title) {
            title.textContent = `📄 ${filePath}`;
        }
        
        // Show loading state
        const loading = document.getElementById('source-loading');
        const error = document.getElementById('source-error');
        const content = document.getElementById('source-code-content');
        
        if (loading) loading.style.display = 'block';
        if (error) error.style.display = 'none';
        if (content) content.style.display = 'none';
        
        // Simulate loading source code
        setTimeout(() => {
            this.loadSourceCode(filePath);
        }, 500);
    }
    
    loadSourceCode(filePath) {
        // In a real implementation, this would fetch from GitHub API
        const mockCode = `// Source code for ${filePath}
// This is a mock implementation
        
class DocumentationGap {
    constructor(filePath, expectedDocs, issues) {
        this.filePath = filePath;
        this.expectedDocs = expectedDocs;
        this.issues = issues;
        this.priority = this.calculatePriority();
    }
    
    calculatePriority() {
        // Priority calculation logic
        if (this.issues.length > 5) return 'Critical';
        if (this.issues.length > 3) return 'High';
        if (this.issues.length > 1) return 'Medium';
        return 'Low';
    }
    
    getRecommendations() {
        return this.issues.map(issue => ({
            type: issue.type,
            description: issue.description,
            effort: issue.estimatedEffort
        }));
    }
}

export default DocumentationGap;`;
        
        const loading = document.getElementById('source-loading');
        const error = document.getElementById('source-error');
        const content = document.getElementById('source-code-content');
        const codeText = document.getElementById('source-code-text');
        
        if (loading) loading.style.display = 'none';
        if (error) error.style.display = 'none';
        if (content) content.style.display = 'block';
        if (codeText) codeText.textContent = mockCode;
    }
    
    openGitHub() {
        const title = document.getElementById('source-modal-title');
        if (title) {
            const filePath = title.textContent.replace('📄 ', '');
            const githubUrl = `https://github.com/your-org/your-repo/blob/main/${filePath}`;
            window.open(githubUrl, '_blank');
        }
    }
    
    openColumnPicker() {
        if (!this.columnModal) return;
        
        this.renderColumnPicker();
        this.columnModal.classList.add('show');
    }
    
    renderColumnPicker() {
        const picker = document.querySelector('.column-picker');
        if (!picker) return;
        
        const columns = [
            { id: 'file', label: 'File Path', essential: true },
            { id: 'status', label: 'Status', essential: false },
            { id: 'priority', label: 'Priority', essential: false },
            { id: 'expected', label: 'Expected Documentation', essential: false },
            { id: 'effort', label: 'Effort', essential: false },
            { id: 'issues', label: 'Quality Issues', essential: false },
            { id: 'lastUpdated', label: 'Last Updated', essential: false }
        ];
        
        picker.innerHTML = columns.map(col => `
            <div class="column-item ${col.essential ? 'essential' : ''}">
                <input type="checkbox" class="column-checkbox" id="col-${col.id}" 
                       ${this.visibleColumns.has(col.id) ? 'checked' : ''} 
                       ${col.essential ? 'disabled' : ''}>
                <label for="col-${col.id}" class="column-label">${col.label}</label>
                ${col.essential ? '<span class="column-essential">Essential</span>' : ''}
            </div>
        `).join('');
    }
    
    loadColumnVisibility() {
        const saved = localStorage.getItem('columnVisibility');
        if (saved) {
            this.visibleColumns = new Set(JSON.parse(saved));
        } else {
            this.visibleColumns = new Set(['file', 'status', 'priority', 'expected']);
        }
    }
    
    saveColumnVisibility() {
        localStorage.setItem('columnVisibility', JSON.stringify([...this.visibleColumns]));
    }
    
    closeModals() {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
    }
    
    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.tableManager = new EnhancedTableManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedTableManager;
} 