/**
 * Main Documentation Coverage Table Application
 * 
 * This is the main orchestrator that initializes all components and provides
 * a clean interface for the Python-generated HTML to use.
 * 
 * @module main
 * @version 1.0.0
 */

import { getState, updateState, resetState } from './core/state.js';
import { searchComponent } from './components/search.js';
import { filtersComponent } from './components/filters.js';

/**
 * Main application class
 */
class DocumentationCoverageApp {
    constructor() {
        this.initialized = false;
        this.components = new Map();
        this.version = '1.0.0';
        
        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.initializeTable = this.initializeTable.bind(this);
        this.applyFilters = this.applyFilters.bind(this);
        this.updateTable = this.updateTable.bind(this);
    }
    
    /**
     * Initialize the complete application
     * @public
     */
    async initialize() {
        if (this.initialized) {
            console.warn('📚 Documentation coverage app already initialized');
            return;
        }
        
        try {
            console.log('📚 Initializing documentation coverage application...');
            
            // Initialize data layer
            await this.initializeTable();
            
            // Initialize components
            this.initializeComponents();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Apply initial state
            this.applyInitialSettings();
            
            // Setup filter processing
            this.setupFilterProcessing();
            
            this.initialized = true;
            console.log('✅ Documentation coverage application initialized successfully');
            
            // Make available globally for debugging
            if (typeof window !== 'undefined') {
                window.DocumentationCoverageApp = this;
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize documentation coverage application:', error);
            throw error;
        }
    }
    
    /**
     * Initialize table data
     * @private
     */
    async initializeTable() {
        const tableBody = document.getElementById('gaps-table-body');
        if (!tableBody) {
            throw new Error('Table body element not found');
        }
        
        const allRows = Array.from(tableBody.querySelectorAll('tr'));
        const filteredRows = [...allRows];
        
        // Update state
        updateState('data', {
            allRows,
            filteredRows,
            initialized: true
        });
        
        // Initialize pagination
        updateState('pagination', {
            totalPages: Math.ceil(filteredRows.length / 50)
        });
        
        console.log(`📊 Initialized table with ${allRows.length} rows`);
        
        // Initial table update
        this.updateTable();
    }
    
    /**
     * Initialize all components
     * @private
     */
    initializeComponents() {
        // Register components
        this.components.set('search', searchComponent);
        this.components.set('filters', filtersComponent);
        
        // Initialize each component
        this.components.forEach((component, name) => {
            try {
                if (typeof component.initialize === 'function') {
                    component.initialize();
                    console.log(`✅ ${name} component initialized`);
                }
            } catch (error) {
                console.error(`❌ Failed to initialize ${name} component:`, error);
            }
        });
    }
    
    /**
     * Setup global event listeners
     * @private
     */
    setupGlobalEventListeners() {
        // Theme initialization
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
        
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle-btn');
        if (themeToggle) {
            themeToggle.addEventListener('click', this.toggleTheme);
        }
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', this.handleGlobalKeyboardShortcuts);
        
        console.log('⌨️ Global event listeners attached');
    }
    
    /**
     * Setup filter processing
     * @private
     */
    setupFilterProcessing() {
        // Subscribe to filter changes to trigger filtering
        import('./core/state.js').then(({ subscribeToState }) => {
            subscribeToState('filters', () => {
                this.applyFilters();
            });
        });
    }
    
    /**
     * Apply current filters to the data
     * @private
     */
    applyFilters() {
        const { allRows } = getState('data');
        const filters = getState('filters');
        
        const filteredRows = allRows.filter(row => {
            // Priority filter
            if (filters.priority && row.dataset.priority !== filters.priority) {
                return false;
            }
            
            // Status filter
            if (filters.status && row.dataset.status !== filters.status) {
                return false;
            }
            
            // Search filter
            if (filters.search) {
                const searchText = row.textContent.toLowerCase();
                if (!searchText.includes(filters.search)) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Update state
        updateState('data', { filteredRows });
        updateState('pagination', { 
            currentPage: 1,
            totalPages: Math.ceil(filteredRows.length / getState('pagination').itemsPerPage)
        });
        
        // Update table display
        this.updateTable();
        
        console.log(`🔍 Applied filters - ${filteredRows.length} of ${allRows.length} rows shown`);
    }
    
    /**
     * Update table display
     * @private
     */
    updateTable() {
        const tableBody = document.getElementById('gaps-table-body');
        if (!tableBody) {
            return;
        }
        
        const { filteredRows } = getState('data');
        const { currentPage, itemsPerPage } = getState('pagination');
        
        // Clear table
        tableBody.innerHTML = '';
        
        // Handle empty state
        if (filteredRows.length === 0) {
            this.showEmptyState();
            return;
        } else {
            this.hideEmptyState();
        }
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageRows = filteredRows.slice(startIndex, endIndex);
        
        // Add rows to table
        pageRows.forEach(row => tableBody.appendChild(row));
        
        console.log(`📊 Table updated - showing ${pageRows.length} of ${filteredRows.length} rows`);
    }
    
    /**
     * Show empty state
     * @private
     */
    showEmptyState() {
        const emptyState = document.getElementById('empty-state');
        const table = document.getElementById('gaps-table');
        const paginationContainer = document.querySelector('.pagination-container');
        
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        if (table) {
            table.style.display = 'none';
        }
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
    }
    
    /**
     * Hide empty state
     * @private
     */
    hideEmptyState() {
        const emptyState = document.getElementById('empty-state');
        const table = document.getElementById('gaps-table');
        const paginationContainer = document.querySelector('.pagination-container');
        
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        if (table) {
            table.style.display = 'table';
        }
        if (paginationContainer) {
            paginationContainer.style.display = 'flex';
        }
    }
    
    /**
     * Apply initial settings
     * @private
     */
    applyInitialSettings() {
        // Apply saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            updateState('ui', { theme: 'dark' });
        }
        
        console.log('⚙️ Initial settings applied');
    }
    
    /**
     * Toggle theme
     * @private
     */
    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateState('ui', { theme: isDark ? 'dark' : 'light' });
        
        console.log(`🌓 Theme switched to: ${isDark ? 'dark' : 'light'}`);
    }
    
    /**
     * Handle global keyboard shortcuts
     * @private
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleGlobalKeyboardShortcuts(e) {
        // Ctrl+Shift+D for theme toggle
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            this.toggleTheme();
        }
        
        // F1 for help
        if (e.key === 'F1') {
            e.preventDefault();
            const helpModal = document.getElementById('help-modal');
            if (helpModal) {
                helpModal.style.display = 'block';
            }
        }
        
        // Escape to close all modals
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
    }
    
    /**
     * Close all modals
     * @private
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
    
    /**
     * Get application statistics
     * @public
     * @returns {Object} Application statistics
     */
    getStats() {
        const data = getState('data');
        const filters = getState('filters');
        const pagination = getState('pagination');
        
        return {
            version: this.version,
            initialized: this.initialized,
            totalRows: data.allRows.length,
            filteredRows: data.filteredRows.length,
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            activeFilters: Object.keys(filters).filter(key => filters[key] !== '').length,
            components: Array.from(this.components.keys())
        };
    }
    
    /**
     * Reset application to initial state
     * @public
     */
    reset() {
        resetState();
        this.applyInitialSettings();
        this.initializeTable();
        
        console.log('🔄 Application reset to initial state');
    }
    
    /**
     * Destroy the application
     * @public
     */
    destroy() {
        // Destroy all components
        this.components.forEach((component, name) => {
            if (typeof component.destroy === 'function') {
                component.destroy();
                console.log(`🗑️ ${name} component destroyed`);
            }
        });
        
        this.components.clear();
        this.initialized = false;
        
        console.log('🗑️ Documentation coverage application destroyed');
    }
}

/**
 * Create and export application instance
 */
export const documentationCoverageApp = new DocumentationCoverageApp();

/**
 * Initialize application when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        documentationCoverageApp.initialize();
    });
} else {
    documentationCoverageApp.initialize();
}

/**
 * Export for backward compatibility with existing Python code
 */
export function initializeDocumentationCoverageTable() {
    return documentationCoverageApp.initialize();
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.initializeDocumentationCoverageTable = initializeDocumentationCoverageTable;
    window.documentationCoverageApp = documentationCoverageApp;
} 