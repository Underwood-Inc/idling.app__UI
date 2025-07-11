#!/usr/bin/env python3
"""
Table State Management for HTML Documentation Coverage Report

Handles all state persistence operations including localStorage saving and loading,
state validation, and state reset functionality.
"""

def get_table_state_manager_js() -> str:
    """Generate table state management JavaScript functionality."""
    return """
    // Table State Manager - State Persistence and Loading
    class TableStateManager {
        constructor(tableManager) {
            this.manager = tableManager;
        }
        
        // State management - ultra defensive
        loadPersistedState() {
            try {
                const savedState = localStorage.getItem(this.manager.storageKey);
                if (savedState) {
                    const state = JSON.parse(savedState);
                    
                    this.manager.currentPage = state.currentPage || 1;
                    this.manager.pageSize = state.pageSize || 50;
                    this.manager.currentFilter = state.currentFilter || 'all';
                    this.manager.searchTerm = state.searchTerm || '';
                    this.manager.columnWidths = state.columnWidths || {};
                    this.manager.hiddenColumns = new Set(state.hiddenColumns || ['type']);
                    
                    // Ultra defensive sort state restoration
                    if (state.sortState && typeof state.sortState === 'object') {
                        this.manager.sortState = this.manager.createSafeSortState();
                        
                        // Restore primary sort
                        if (state.sortState.primary && typeof state.sortState.primary === 'object') {
                            this.manager.sortState.primary = {
                                column: state.sortState.primary.column || null,
                                direction: ['asc', 'desc'].includes(state.sortState.primary.direction) ? state.sortState.primary.direction : 'asc'
                            };
                        }
                        
                        // Restore secondary sort
                        if (state.sortState.secondary && typeof state.sortState.secondary === 'object') {
                            this.manager.sortState.secondary = {
                                column: state.sortState.secondary.column || null,
                                direction: ['asc', 'desc'].includes(state.sortState.secondary.direction) ? state.sortState.secondary.direction : 'asc'
                            };
                        }
                    } else {
                        this.manager.sortState = this.manager.createSafeSortState();
                    }
                    
                    console.log('📊 Table state restored from localStorage');
                }
            } catch (e) {
                console.warn('⚠️ Failed to load persisted state:', e);
                // Reset to safe defaults
                this.manager.sortState = this.manager.createSafeSortState();
                this.manager.hiddenColumns = new Set(['type']);
                this.manager.currentFilter = 'all';
                this.manager.searchTerm = '';
                this.manager.currentPage = 1;
            }
        }
        
        saveState() {
            if (this.manager.isDestroyed) return;
            
            try {
                // Validate sort state before saving
                this.manager.validateSortState();
                
                const state = {
                    currentPage: this.manager.currentPage,
                    pageSize: this.manager.pageSize,
                    sortState: this.manager.sortState,
                    currentFilter: this.manager.currentFilter,
                    searchTerm: this.manager.searchTerm,
                    columnWidths: this.manager.columnWidths,
                    hiddenColumns: Array.from(this.manager.hiddenColumns)
                };
                
                localStorage.setItem(this.manager.storageKey, JSON.stringify(state));
            } catch (e) {
                console.warn('⚠️ Failed to save state:', e);
            }
        }
        
        resetState() {
            // Reset to default state
            this.manager.currentPage = 1;
            this.manager.pageSize = 50;
            this.manager.currentFilter = 'all';
            this.manager.searchTerm = '';
            this.manager.columnWidths = {};
            this.manager.hiddenColumns = new Set(['type']);
            this.manager.sortState = this.manager.createSafeSortState();
            
            // Clear from localStorage
            try {
                localStorage.removeItem(this.manager.storageKey);
            } catch (e) {
                console.warn('⚠️ Failed to clear localStorage:', e);
            }
            
            console.log('🔄 Table state reset to defaults');
        }
        
        exportState() {
            // Export current state as JSON for debugging
            const state = {
                currentPage: this.manager.currentPage,
                pageSize: this.manager.pageSize,
                sortState: this.manager.sortState,
                currentFilter: this.manager.currentFilter,
                searchTerm: this.manager.searchTerm,
                columnWidths: this.manager.columnWidths,
                hiddenColumns: Array.from(this.manager.hiddenColumns),
                filteredRowsCount: this.manager.filteredRows.length,
                allRowsCount: this.manager.allRows.length
            };
            
            console.log('📋 Current table state:', state);
            return state;
        }
        
        importState(stateData) {
            // Import state from external source
            try {
                if (typeof stateData === 'string') {
                    stateData = JSON.parse(stateData);
                }
                
                this.manager.currentPage = stateData.currentPage || 1;
                this.manager.pageSize = stateData.pageSize || 50;
                this.manager.currentFilter = stateData.currentFilter || 'all';
                this.manager.searchTerm = stateData.searchTerm || '';
                this.manager.columnWidths = stateData.columnWidths || {};
                this.manager.hiddenColumns = new Set(stateData.hiddenColumns || ['type']);
                
                // Restore sort state safely
                if (stateData.sortState && typeof stateData.sortState === 'object') {
                    this.manager.sortState = this.manager.createSafeSortState();
                    
                    if (stateData.sortState.primary && typeof stateData.sortState.primary === 'object') {
                        this.manager.sortState.primary = {
                            column: stateData.sortState.primary.column || null,
                            direction: ['asc', 'desc'].includes(stateData.sortState.primary.direction) ? stateData.sortState.primary.direction : 'asc'
                        };
                    }
                    
                    if (stateData.sortState.secondary && typeof stateData.sortState.secondary === 'object') {
                        this.manager.sortState.secondary = {
                            column: stateData.sortState.secondary.column || null,
                            direction: ['asc', 'desc'].includes(stateData.sortState.secondary.direction) ? stateData.sortState.secondary.direction : 'asc'
                        };
                    }
                } else {
                    this.manager.sortState = this.manager.createSafeSortState();
                }
                
                // Save to localStorage
                this.saveState();
                
                // Update display
                this.manager.updateDisplay();
                
                console.log('📥 Table state imported successfully');
                return true;
            } catch (e) {
                console.error('❌ Failed to import state:', e);
                return false;
            }
        }
    }
    
    // Export for use by other components
    window.TableStateManager = TableStateManager;
    """ 