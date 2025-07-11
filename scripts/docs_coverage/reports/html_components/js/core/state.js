/**
 * State Management for Documentation Coverage Table
 * 
 * Centralized state management following the single responsibility principle.
 * This module provides a clean interface for managing table state across all components.
 * 
 * @module core/state
 * @version 1.0.0
 */

/**
 * Global state object for the documentation coverage table
 * @type {Object}
 */
const DocumentationCoverageState = {
    // Pagination state
    pagination: {
        currentPage: 1,
        itemsPerPage: 50,
        totalPages: 0
    },
    
    // Sorting state
    sorting: {
        column: '',
        direction: '', // 'asc' or 'desc'
        history: [] // For multi-column sorting if needed
    },
    
    // Filter state
    filters: {
        priority: '',
        status: '',
        search: ''
    },
    
    // Data state
    data: {
        allRows: [],
        filteredRows: [],
        initialized: false
    },
    
    // UI state
    ui: {
        theme: 'light',
        visibleColumns: new Set(),
        modalsOpen: new Set()
    }
};

/**
 * State change listeners
 * @private
 */
const stateListeners = {
    pagination: [],
    sorting: [],
    filters: [],
    data: [],
    ui: []
};

/**
 * Get current state (read-only)
 * @param {string} section - State section to get
 * @returns {Object} State section
 */
export function getState(section) {
    if (section && DocumentationCoverageState[section]) {
        return { ...DocumentationCoverageState[section] };
    }
    return { ...DocumentationCoverageState };
}

/**
 * Update state section
 * @param {string} section - State section to update
 * @param {Object} updates - Updates to apply
 */
export function updateState(section, updates) {
    if (!DocumentationCoverageState[section]) {
        console.warn(`Unknown state section: ${section}`);
        return;
    }
    
    const oldState = { ...DocumentationCoverageState[section] };
    Object.assign(DocumentationCoverageState[section], updates);
    
    // Notify listeners
    notifyListeners(section, DocumentationCoverageState[section], oldState);
}

/**
 * Subscribe to state changes
 * @param {string} section - State section to watch
 * @param {Function} listener - Listener function
 * @returns {Function} Unsubscribe function
 */
export function subscribeToState(section, listener) {
    if (!stateListeners[section]) {
        stateListeners[section] = [];
    }
    
    stateListeners[section].push(listener);
    
    // Return unsubscribe function
    return () => {
        const index = stateListeners[section].indexOf(listener);
        if (index > -1) {
            stateListeners[section].splice(index, 1);
        }
    };
}

/**
 * Notify state listeners
 * @private
 * @param {string} section - State section that changed
 * @param {Object} newState - New state
 * @param {Object} oldState - Previous state
 */
function notifyListeners(section, newState, oldState) {
    if (stateListeners[section]) {
        stateListeners[section].forEach(listener => {
            try {
                listener(newState, oldState);
            } catch (error) {
                console.error(`Error in state listener for ${section}:`, error);
            }
        });
    }
}

/**
 * Reset state to initial values
 * @param {string} section - State section to reset (optional)
 */
export function resetState(section) {
    const initialState = {
        pagination: { currentPage: 1, itemsPerPage: 50, totalPages: 0 },
        sorting: { column: '', direction: '', history: [] },
        filters: { priority: '', status: '', search: '' },
        data: { allRows: [], filteredRows: [], initialized: false },
        ui: { theme: 'light', visibleColumns: new Set(), modalsOpen: new Set() }
    };
    
    if (section) {
        updateState(section, initialState[section]);
    } else {
        Object.keys(initialState).forEach(key => {
            updateState(key, initialState[key]);
        });
    }
}

/**
 * Get computed state values
 * @returns {Object} Computed values
 */
export function getComputedState() {
    const state = getState();
    
    return {
        totalRows: state.data.allRows.length,
        filteredRows: state.data.filteredRows.length,
        currentPageRows: Math.min(
            state.pagination.itemsPerPage,
            state.data.filteredRows.length - ((state.pagination.currentPage - 1) * state.pagination.itemsPerPage)
        ),
        hasFilters: Object.values(state.filters).some(filter => filter !== ''),
        canGoNext: state.pagination.currentPage < state.pagination.totalPages,
        canGoPrevious: state.pagination.currentPage > 1,
        isDarkTheme: state.ui.theme === 'dark'
    };
}

// Development helpers
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    window.DocumentationCoverageState = DocumentationCoverageState;
    window.getState = getState;
    window.updateState = updateState;
} 