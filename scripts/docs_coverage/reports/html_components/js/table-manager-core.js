// Core Table Manager - Initialization and Basic Setup
class TableManagerCore {
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
        // Ensure sort state exists and has correct structure
        if (!this.sortState || typeof this.sortState !== 'object') {
            this.sortState = this.createSafeSortState();
            return;
        }
        
        // Validate primary sort state
        if (!this.sortState.primary || typeof this.sortState.primary !== 'object') {
            this.sortState.primary = { column: null, direction: 'asc' };
        }
        
        // Validate secondary sort state
        if (!this.sortState.secondary || typeof this.sortState.secondary !== 'object') {
            this.sortState.secondary = { column: null, direction: 'asc' };
        }
        
        // Validate direction values
        if (this.sortState.primary.direction !== 'asc' && this.sortState.primary.direction !== 'desc') {
            this.sortState.primary.direction = 'asc';
        }
        
        if (this.sortState.secondary.direction !== 'asc' && this.sortState.secondary.direction !== 'desc') {
            this.sortState.secondary.direction = 'asc';
        }
        
        // Ensure column values are either null or strings
        if (this.sortState.primary.column !== null && typeof this.sortState.primary.column !== 'string') {
            this.sortState.primary.column = null;
        }
        
        if (this.sortState.secondary.column !== null && typeof this.sortState.secondary.column !== 'string') {
            this.sortState.secondary.column = null;
        }
    }
    
    init() {
        if (this.isDestroyed) { return; }
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
        } else {
            this.initializeComponents();
        }
    }
    
    initializeComponents() {
        if (this.isDestroyed || this.isInitialized) { return; }
        
        console.log('🔧 Initializing Enhanced Table Manager...');
        
        try {
            this.setupTable();
            this.setupEventHandlers();
            this.loadPersistedState();
            this.updateDisplay();
            
            this.isInitialized = true;
            console.log('✅ Enhanced Table Manager initialized successfully!');
        } catch (error) {
            console.error('❌ Failed to initialize table manager:', error);
            this.setupBasicTable();
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
        
        // Setup scroll sync
        this.setupScrollSync();
        
        console.log(`📊 Found ${this.allRows.length} table rows`);
    }
    
    setupScrollSync() {
        const headerContainer = document.querySelector('.advanced-table-header');
        const bodyContainer = document.querySelector('.advanced-table-body');
        
        if (!headerContainer || !bodyContainer) { return; }
        
        let isHeaderScrolling = false;
        let isBodyScrolling = false;
        
        headerContainer.addEventListener('scroll', () => {
            if (this.isDestroyed || isBodyScrolling) { return; }
            isHeaderScrolling = true;
            bodyContainer.scrollLeft = headerContainer.scrollLeft;
            setTimeout(() => { isHeaderScrolling = false; }, 0);
        });
        
        bodyContainer.addEventListener('scroll', () => {
            if (this.isDestroyed || isHeaderScrolling) { return; }
            isBodyScrolling = true;
            headerContainer.scrollLeft = bodyContainer.scrollLeft;
            setTimeout(() => { isBodyScrolling = false; }, 0);
        });
    }
    
    setupEventHandlers() {
        if (window.TablePagination) {
            this.pagination = new window.TablePagination(this);
        }
        if (window.TableFiltering) {
            this.filtering = new window.TableFiltering(this);
        }
        if (window.TableSorting) {
            this.sorting = new window.TableSorting(this);
        }
        
        // Add row click handler for modal opening
        this.setupRowClickHandler();
        
        // Add modal close handlers for table-specific modals
        this.setupModalCloseHandlers();
        
        // Only table-specific shortcuts should be here
        this.setupTableKeyboardShortcuts();
    }
    
    setupTableKeyboardShortcuts() {
        // Only table-specific keyboard shortcuts go here
        document.addEventListener('keydown', (e) => {
            if (this.isDestroyed) { return; }
            
            // Don't handle shortcuts if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Table-specific shortcuts only
            // Add any table-specific shortcuts here if needed in the future
        });
        
        console.log('⌨️ Table-specific keyboard shortcuts initialized');
    }
    
    // Removed updateKeyboardShortcutDisplay - belongs in global keyboard manager
    
    setupModalCloseHandlers() {
        // Only handle table-specific modal interactions
        // Global ESC key handling is done by the global keyboard manager
        
        // Click on modal backdrop to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') && !this.isDestroyed) {
                this.closeModals();
            }
        });
        
        // Click on close button to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') && !this.isDestroyed) {
                this.closeModals();
            }
        });
        
        console.log('🚪 Table modal close handlers attached');
    }
    
    // Removed all global keyboard shortcuts and functions - they belong in a proper global keyboard manager
    
    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            modal.style.display = 'none';
        });
        
        console.log('🚪 All modals closed');
    }
    
    setupRowClickHandler() {
        if (!this.table) { return; }
        
        this.table.addEventListener('click', (e) => {
            if (this.isDestroyed) { return; }
            
            const row = e.target.closest('tr');
            if (row && row.classList.contains('gap-row')) {
                const filePath = row.dataset.filePath || row.cells[0]?.textContent || '';
                if (filePath) {
                    this.openSourceModal(filePath);
                }
            }
        });
        
        console.log('🖱️ Row click handler attached');
    }
    
    openSourceModal(filePath) {
        console.log(`📄 Opening source code modal for: ${filePath}`);
        
        // Use the modal manager if available
        if (window.modalManager && window.modalManager.showSourceCodeModal) {
            // Find the row with this file path for the modal manager
            const row = Array.from(this.allRows).find(r => 
                r.dataset.filePath === filePath || 
                r.cells[0]?.textContent === filePath
            );
            
            if (row) {
                window.modalManager.showSourceCodeModal(row);
            } else {
                console.warn(`⚠️ Could not find row for file: ${filePath}`);
            }
        } else {
            // Fallback to basic modal opening
            this.openBasicModal(filePath);
        }
    }
    
    openBasicModal(filePath) {
        const modal = document.getElementById('source-code-modal');
        const modalTitle = document.getElementById('source-modal-title');
        const sourceCode = document.getElementById('source-code-content');
        const sourceCodeText = document.getElementById('source-code-text');
        
        if (!modal || !modalTitle || !sourceCode || !sourceCodeText) {
            console.warn('❌ Modal elements missing, cannot open modal');
            return;
        }
        
        modalTitle.textContent = `📄 ${filePath}`;
        sourceCode.innerHTML = '<div class="loading">Loading source code...</div>';
        
        modal.classList.add('show');
        modal.style.display = 'flex';
        
        // Try to load source code if data is available
        this.loadSourceCodeForModal(filePath, sourceCode, sourceCodeText);
    }
    
    loadSourceCodeForModal(filePath, sourceCode, sourceCodeText) {
        // Check if source code data is embedded in the document
        if (window.sourceCodeData && window.sourceCodeData[filePath]) {
            try {
                const encodedContent = window.sourceCodeData[filePath];
                const decodedContent = atob(encodedContent);
                sourceCodeText.textContent = decodedContent;
                
                // Apply syntax highlighting if available
                if (window.Prism) {
                    const language = this.getLanguageFromFilePath(filePath);
                    sourceCode.innerHTML = `<pre class="line-numbers"><code class="language-${language}">${this.escapeHtml(decodedContent)}</code></pre>`;
                    window.Prism.highlightAll();
                } else {
                    sourceCode.innerHTML = `<pre><code>${this.escapeHtml(decodedContent)}</code></pre>`;
                }
            } catch (error) {
                console.error('❌ Error loading source code:', error);
                sourceCode.innerHTML = '<div class="error">Error loading source code</div>';
            }
        } else {
            sourceCode.innerHTML = '<div class="error">Source code not available</div>';
        }
    }
    
    getLanguageFromFilePath(filePath) {
        const extension = filePath.split('.').pop().toLowerCase();
        const languageMap = {
            'ts': 'typescript',
            'tsx': 'typescript',
            'js': 'javascript',
            'jsx': 'javascript',
            'py': 'python',
            'css': 'css',
            'scss': 'scss',
            'html': 'html',
            'md': 'markdown',
            'json': 'json',
            'yaml': 'yaml',
            'yml': 'yaml'
        };
        return languageMap[extension] || 'typescript';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    updateDisplay() {
        if (this.isDestroyed) { return; }
        
        try {
            this.totalPages = Math.ceil(this.filteredRows.length / this.pageSize);
            if (this.currentPage > this.totalPages) {
                this.currentPage = Math.max(1, this.totalPages);
            }
            
            const emptyState = document.getElementById('empty-state');
            const table = document.getElementById('gaps-table');
            const paginationContainer = document.querySelector('.pagination-container');
            
            if (this.filteredRows.length === 0) {
                if (emptyState) { emptyState.style.display = 'block'; }
                if (table) { table.style.display = 'none'; }
                if (paginationContainer) { paginationContainer.style.display = 'none'; }
            } else {
                if (emptyState) { emptyState.style.display = 'none'; }
                if (table) { table.style.display = 'table'; }
                if (paginationContainer) { paginationContainer.style.display = 'flex'; }
                
                this.reorderTableRows();
                
                this.allRows.forEach(row => row.style.display = 'none');
                
                const startIndex = (this.currentPage - 1) * this.pageSize;
                const endIndex = startIndex + this.pageSize;
                
                this.filteredRows.slice(startIndex, endIndex).forEach(row => {
                    row.style.display = '';
                });
            }
            
            if (this.pagination) {
                this.pagination.updatePaginationInfo();
                this.pagination.updatePaginationButtons();
            }
            
            if (this.sorting) {
                this.sorting.safeUpdateSortIndicators();
            }
            
        } catch (error) {
            console.error('❌ Error updating display:', error);
        }
    }
    
    reorderTableRows() {
        if (!this.table || !this.filteredRows.length) { return; }
        
        const tbody = this.table.querySelector('tbody');
        if (!tbody) { return; }
        
        const fragment = document.createDocumentFragment();
        
        this.filteredRows.forEach(row => {
            fragment.appendChild(row);
        });
        
        this.allRows.forEach(row => {
            if (!this.filteredRows.includes(row)) {
                fragment.appendChild(row);
            }
        });
        
        tbody.appendChild(fragment);
    }
    
    loadPersistedState() {
        if (window.TableStateManager) {
            const stateManager = new window.TableStateManager(this);
            stateManager.loadPersistedState();
        }
    }
    
    saveState() {
        if (window.TableStateManager) {
            const stateManager = new window.TableStateManager(this);
            stateManager.saveState();
        }
    }
    
    destroy() {
        this.isDestroyed = true;
        this.isInitialized = false;
        this.table = null;
        this.allRows = [];
        this.filteredRows = [];
        this.sortState = this.createSafeSortState();
    }
}

// Initialize the table manager
let tableManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        tableManager = new TableManagerCore();
        window.tableManager = tableManager;
    });
} else {
    tableManager = new TableManagerCore();
    window.tableManager = tableManager;
}

window.TableManagerCore = TableManagerCore; 