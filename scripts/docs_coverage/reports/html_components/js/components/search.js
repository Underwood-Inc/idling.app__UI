/**
 * Search Component for Documentation Coverage Table
 * 
 * Handles all search-related functionality including input handling,
 * search term processing, and search result management.
 * 
 * @module components/search
 * @version 1.0.0
 */

import { getState, updateState, subscribeToState } from '../core/state.js';

/**
 * Search component class
 */
export class SearchComponent {
    constructor() {
        this.searchInput = null;
        this.searchClear = null;
        this.initialized = false;
        this.debounceTimer = null;
        this.debounceDelay = 300; // ms
        
        // Bind methods to preserve context
        this.handleSearch = this.handleSearch.bind(this);
        this.handleClear = this.handleClear.bind(this);
        this.debouncedSearch = this.debouncedSearch.bind(this);
    }
    
    /**
     * Initialize the search component
     * @public
     */
    initialize() {
        if (this.initialized) {
            console.warn('🔍 Search component already initialized');
            return;
        }
        
        try {
            this.findElements();
            this.attachEventListeners();
            this.setupStateSubscription();
            this.initialized = true;
            
            console.log('🔍 Search component initialized');
        } catch (error) {
            console.error('❌ Failed to initialize search component:', error);
        }
    }
    
    /**
     * Find DOM elements
     * @private
     */
    findElements() {
        this.searchInput = document.getElementById('gap-search');
        this.searchClear = document.getElementById('search-clear');
        
        if (!this.searchInput) {
            throw new Error('Search input element not found');
        }
    }
    
    /**
     * Attach event listeners
     * @private
     */
    attachEventListeners() {
        // Search input with debouncing
        this.searchInput.addEventListener('input', this.debouncedSearch);
        
        // Clear button
        if (this.searchClear) {
            this.searchClear.addEventListener('click', this.handleClear);
        }
        
        // Escape key to clear search when focused on search input
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.activeElement === this.searchInput) {
                this.clearSearch();
            }
        });
        
        // Note: Global keyboard shortcuts (Ctrl/Cmd+F) are handled by TableManagerCore
    }
    
    /**
     * Setup state subscription
     * @private
     */
    setupStateSubscription() {
        // Subscribe to filter changes to update UI
        subscribeToState('filters', (newFilters) => {
            if (this.searchInput && this.searchInput.value !== newFilters.search) {
                this.searchInput.value = newFilters.search;
            }
        });
    }
    
    /**
     * Debounced search handler
     * @private
     * @param {Event} event - Input event
     */
    debouncedSearch(event) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.handleSearch(event);
        }, this.debounceDelay);
    }
    
    /**
     * Handle search input changes
     * @private
     * @param {Event} event - Input event
     */
    handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase().trim();
        
        // Update state
        updateState('filters', { search: searchTerm });
        
        // Log search activity
        if (searchTerm) {
            console.log(`🔍 Search: "${searchTerm}"`);
        }
        
        // Analytics/tracking could go here
        this.trackSearch(searchTerm);
    }
    
    /**
     * Handle clear button click
     * @private
     */
    handleClear() {
        this.clearSearch();
    }
    
    /**
     * Clear search input and reset search filter
     * @public
     */
    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
            this.searchInput.focus();
        }
        
        updateState('filters', { search: '' });
        console.log('🔍 Search cleared');
    }
    
    /**
     * Focus the search input
     * @public
     */
    focusSearch() {
        if (this.searchInput) {
            this.searchInput.focus();
            this.searchInput.select();
        }
    }
    
    /**
     * Set search term programmatically
     * @public
     * @param {string} term - Search term
     */
    setSearchTerm(term) {
        if (this.searchInput) {
            this.searchInput.value = term;
            updateState('filters', { search: term.toLowerCase().trim() });
        }
    }
    
    /**
     * Get current search term
     * @public
     * @returns {string} Current search term
     */
    getSearchTerm() {
        return getState('filters').search;
    }
    
    /**
     * Check if search is active
     * @public
     * @returns {boolean} True if search is active
     */
    isSearchActive() {
        return this.getSearchTerm().length > 0;
    }
    
    /**
     * Track search activity (for analytics)
     * @private
     * @param {string} searchTerm - Search term
     */
    trackSearch(searchTerm) {
        // This could be enhanced with actual analytics
        if (searchTerm.length > 0) {
            // Track search events
            console.debug(`🔍 Search tracking: "${searchTerm}"`);
        }
    }
    
    /**
     * Get search statistics
     * @public
     * @returns {Object} Search statistics
     */
    getSearchStats() {
        const searchTerm = this.getSearchTerm();
        const { filteredRows, allRows } = getState('data');
        
        return {
            searchTerm,
            isActive: this.isSearchActive(),
            totalRows: allRows.length,
            filteredRows: filteredRows.length,
            hiddenRows: allRows.length - filteredRows.length
        };
    }
    
    /**
     * Destroy the search component
     * @public
     */
    destroy() {
        if (this.searchInput) {
            this.searchInput.removeEventListener('input', this.debouncedSearch);
        }
        
        if (this.searchClear) {
            this.searchClear.removeEventListener('click', this.handleClear);
        }
        
        clearTimeout(this.debounceTimer);
        this.initialized = false;
        
        console.log('🔍 Search component destroyed');
    }
}

/**
 * Create and export a singleton instance
 */
export const searchComponent = new SearchComponent();

/**
 * Initialize search component when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        searchComponent.initialize();
    });
} else {
    searchComponent.initialize();
} 