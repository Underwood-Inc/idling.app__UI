/**
 * Filters Component for Documentation Coverage Table
 * 
 * Handles all filter-related functionality including filter tags,
 * filter state management, and filter count updates.
 * 
 * @module components/filters
 * @version 1.0.0
 */

import { getState, updateState, subscribeToState } from '../core/state.js';

/**
 * Filters component class
 */
export class FiltersComponent {
    constructor() {
        this.filterTags = [];
        this.clearAllButton = null;
        this.clearEmptyButton = null;
        this.filteredCountElement = null;
        this.totalCountElement = null;
        this.initialized = false;
        
        // Bind methods to preserve context
        this.handleFilterTag = this.handleFilterTag.bind(this);
        this.handleClearAll = this.handleClearAll.bind(this);
        this.updateFilterCounts = this.updateFilterCounts.bind(this);
    }
    
    /**
     * Initialize the filters component
     * @public
     */
    initialize() {
        if (this.initialized) {
            console.warn('🏷️ Filters component already initialized');
            return;
        }
        
        try {
            this.findElements();
            this.attachEventListeners();
            this.setupStateSubscription();
            this.initialized = true;
            
            console.log('🏷️ Filters component initialized');
        } catch (error) {
            console.error('❌ Failed to initialize filters component:', error);
        }
    }
    
    /**
     * Find DOM elements
     * @private
     */
    findElements() {
        this.filterTags = Array.from(document.querySelectorAll('.filter-tag'));
        this.clearAllButton = document.getElementById('clear-all-filters');
        this.clearEmptyButton = document.getElementById('clear-filters-empty');
        this.filteredCountElement = document.getElementById('filtered-count');
        this.totalCountElement = document.getElementById('total-count');
        
        if (this.filterTags.length === 0) {
            console.warn('⚠️ No filter tags found');
        }
    }
    
    /**
     * Attach event listeners
     * @private
     */
    attachEventListeners() {
        // Filter tag handlers
        this.filterTags.forEach(tag => {
            tag.addEventListener('click', this.handleFilterTag);
        });
        
        // Clear all buttons
        if (this.clearAllButton) {
            this.clearAllButton.addEventListener('click', this.handleClearAll);
        }
        
        if (this.clearEmptyButton) {
            this.clearEmptyButton.addEventListener('click', this.handleClearAll);
        }
        
        console.log(`🏷️ Attached listeners to ${this.filterTags.length} filter tags`);
    }
    
    /**
     * Setup state subscription
     * @private
     */
    setupStateSubscription() {
        // Subscribe to filter changes to update UI
        subscribeToState('filters', (newFilters) => {
            this.updateFilterTagStates(newFilters);
        });
        
        // Subscribe to data changes to update counts
        subscribeToState('data', () => {
            this.updateFilterCounts();
        });
    }
    
    /**
     * Handle filter tag clicks
     * @private
     * @param {Event} event - Click event
     */
    handleFilterTag(event) {
        const tag = event.target;
        const filter = tag.dataset.filter;
        const value = tag.dataset.value;
        
        if (!filter) {
            console.warn('⚠️ Filter tag missing data-filter attribute');
            return;
        }
        
        // Update visual state
        this.updateTagVisualState(filter, value);
        
        // Update application state
        const currentFilters = getState('filters');
        const newFilters = { ...currentFilters, [filter]: value };
        updateState('filters', newFilters);
        
        console.log(`🏷️ Filter applied: ${filter} = "${value}"`);
    }
    
    /**
     * Update visual state of filter tags
     * @private
     * @param {string} filter - Filter type
     * @param {string} value - Filter value
     */
    updateTagVisualState(filter, value) {
        // Remove active state from all tags in this filter group
        this.filterTags
            .filter(tag => tag.dataset.filter === filter)
            .forEach(tag => tag.classList.remove('active'));
        
        // Add active state to the clicked tag
        const activeTag = this.filterTags.find(tag => 
            tag.dataset.filter === filter && tag.dataset.value === value
        );
        
        if (activeTag) {
            activeTag.classList.add('active');
        }
    }
    
    /**
     * Update filter tag states based on current filters
     * @private
     * @param {Object} filters - Current filter state
     */
    updateFilterTagStates(filters) {
        this.filterTags.forEach(tag => {
            const filter = tag.dataset.filter;
            const value = tag.dataset.value;
            
            if (filter && filters[filter] !== undefined) {
                const isActive = filters[filter] === value;
                tag.classList.toggle('active', isActive);
            }
        });
    }
    
    /**
     * Handle clear all filters
     * @private
     */
    handleClearAll() {
        const clearedFilters = {
            priority: '',
            status: '',
            search: ''
        };
        
        updateState('filters', clearedFilters);
        
        // Reset search input
        const searchInput = document.getElementById('gap-search');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Reset filter tags visual state
        this.filterTags.forEach(tag => {
            tag.classList.remove('active');
        });
        
        // Activate "all" filter tags
        this.filterTags
            .filter(tag => tag.dataset.value === '')
            .forEach(tag => tag.classList.add('active'));
        
        console.log('🏷️ All filters cleared');
    }
    
    /**
     * Update filter count displays
     * @private
     */
    updateFilterCounts() {
        const { filteredRows, allRows } = getState('data');
        
        if (this.filteredCountElement) {
            this.filteredCountElement.textContent = filteredRows.length;
        }
        
        if (this.totalCountElement) {
            this.totalCountElement.textContent = allRows.length;
        }
    }
    
    /**
     * Get active filters
     * @public
     * @returns {Object} Active filters
     */
    getActiveFilters() {
        return getState('filters');
    }
    
    /**
     * Set filter programmatically
     * @public
     * @param {string} filterType - Filter type (priority, status, search)
     * @param {string} value - Filter value
     */
    setFilter(filterType, value) {
        const currentFilters = getState('filters');
        const newFilters = { ...currentFilters, [filterType]: value };
        updateState('filters', newFilters);
    }
    
    /**
     * Clear specific filter
     * @public
     * @param {string} filterType - Filter type to clear
     */
    clearFilter(filterType) {
        this.setFilter(filterType, '');
    }
    
    /**
     * Check if any filters are active
     * @public
     * @returns {boolean} True if any filters are active
     */
    hasActiveFilters() {
        const filters = getState('filters');
        return Object.values(filters).some(value => value !== '');
    }
    
    /**
     * Get filter statistics
     * @public
     * @returns {Object} Filter statistics
     */
    getFilterStats() {
        const filters = getState('filters');
        const { filteredRows, allRows } = getState('data');
        
        return {
            activeFilters: Object.keys(filters).filter(key => filters[key] !== ''),
            totalFilters: Object.keys(filters).length,
            filteredRows: filteredRows.length,
            totalRows: allRows.length,
            hiddenRows: allRows.length - filteredRows.length,
            filterEfficiency: allRows.length > 0 ? (filteredRows.length / allRows.length) * 100 : 0
        };
    }
    
    /**
     * Get available filter options
     * @public
     * @returns {Object} Available filter options
     */
    getAvailableFilters() {
        const filterGroups = {};
        
        this.filterTags.forEach(tag => {
            const filter = tag.dataset.filter;
            const value = tag.dataset.value;
            const label = tag.textContent.trim();
            
            if (!filterGroups[filter]) {
                filterGroups[filter] = [];
            }
            
            filterGroups[filter].push({
                value,
                label,
                element: tag
            });
        });
        
        return filterGroups;
    }
    
    /**
     * Destroy the filters component
     * @public
     */
    destroy() {
        this.filterTags.forEach(tag => {
            tag.removeEventListener('click', this.handleFilterTag);
        });
        
        if (this.clearAllButton) {
            this.clearAllButton.removeEventListener('click', this.handleClearAll);
        }
        
        if (this.clearEmptyButton) {
            this.clearEmptyButton.removeEventListener('click', this.handleClearAll);
        }
        
        this.initialized = false;
        console.log('🏷️ Filters component destroyed');
    }
}

/**
 * Create and export a singleton instance
 */
export const filtersComponent = new FiltersComponent();

/**
 * Initialize filters component when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        filtersComponent.initialize();
    });
} else {
    filtersComponent.initialize();
} 