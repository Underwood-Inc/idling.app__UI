#!/usr/bin/env python3
"""
Table Filtering Functionality for HTML Documentation Coverage Report

Handles all filtering operations including search, filter tags, card filters,
and filter state management.
"""

def get_table_filtering_js() -> str:
    """Generate table filtering JavaScript functionality."""
    return """
    // Table Filtering - Search, Filter Tags, and Card Filters
    class TableFiltering {
        constructor(tableManager) {
            this.manager = tableManager;
            this.setupFilterHandlers();
        }
        
        setupFilterHandlers() {
            // Search input
            const searchInput = document.getElementById('gap-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    if (this.manager.isDestroyed) return;
                    this.manager.searchTerm = e.target.value.toLowerCase();
                    this.manager.currentPage = 1;
                    this.applyFilters();
                    this.manager.saveState();
                    console.log(`🔍 Search term: ${this.manager.searchTerm}`);
                });
            }
            
            // Filter tags
            document.querySelectorAll('.filter-tag').forEach(tag => {
                tag.addEventListener('click', (e) => {
                    if (this.manager.isDestroyed) return;
                    this.handleFilterTagClick(e);
                });
            });
            
            // Clear all filters button - main one
            const clearAllFiltersBtn = document.getElementById('clear-all-filters');
            if (clearAllFiltersBtn) {
                clearAllFiltersBtn.addEventListener('click', (e) => {
                    if (this.manager.isDestroyed) return;
                    this.clearAllFilters();
                });
            }
            
            // Clear filters from empty state
            const clearFiltersEmptyBtn = document.getElementById('clear-filters-empty');
            if (clearFiltersEmptyBtn) {
                clearFiltersEmptyBtn.addEventListener('click', (e) => {
                    if (this.manager.isDestroyed) return;
                    this.clearAllFilters();
                });
            }
            
            // Clickable overview cards
            document.querySelectorAll('.clickable-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (this.manager.isDestroyed) return;
                    this.handleCardClick(e);
                });
            });
            
            console.log('🏷️ Filter handlers attached');
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
            
            this.manager.currentFilter = actualFilter === '' ? 'all' : actualFilter;
            this.manager.currentPage = 1;
            this.safeApplyFilters();
            this.manager.saveState();
        }
        
        handleCardClick(e) {
            const card = e.target.closest('.clickable-card');
            if (!card) return;
            
            const filter = card.dataset.filter;
            if (filter) {
                console.log(`📊 Card clicked: ${filter}`);
                this.manager.currentFilter = filter;
                this.manager.currentPage = 1;
                this.updateFilterTags();
                this.safeApplyFilters();
                this.scrollToTable();
                this.manager.saveState();
            }
        }
        
        safeApplyFilters() {
            try {
                this.applyFilters();
            } catch (error) {
                console.error('❌ Error applying filters:', error);
                // Reset to safe state
                this.manager.currentFilter = 'all';
                this.manager.searchTerm = '';
                this.manager.filteredRows = [...this.manager.allRows];
                this.manager.updateDisplay();
            }
        }
        
        applyFilters() {
            if (this.manager.isDestroyed) return;
            
            this.manager.filteredRows = this.manager.allRows.filter(row => {
                // Search filter
                if (this.manager.searchTerm) {
                    const searchText = row.textContent.toLowerCase();
                    if (!searchText.includes(this.manager.searchTerm)) {
                        return false;
                    }
                }
                
                // Priority/status filter
                if (this.manager.currentFilter !== 'all') {
                    const priority = row.dataset.priority;
                    const status = row.dataset.status; // Using data-status instead of data-gap-type
                    
                    if (this.manager.currentFilter === 'missing' && status !== 'missing') return false;
                    if (this.manager.currentFilter === 'inadequate' && status !== 'inadequate') return false;
                    if (['critical', 'high', 'medium', 'low'].includes(this.manager.currentFilter) && priority !== this.manager.currentFilter) return false;
                }
                
                return true;
            });
            
            this.manager.currentPage = 1;
            this.manager.updateDisplay();
        }
        
        clearAllFilters() {
            if (this.manager.isDestroyed) return;
            
            console.log('🧹 Clearing all filters');
            
            // Reset filter state
            this.manager.currentFilter = 'all';
            this.manager.searchTerm = '';
            this.manager.currentPage = 1;
            
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
            this.manager.saveState();
            
            console.log('✨ All filters cleared successfully');
        }
        
        updateFilterTags() {
            document.querySelectorAll('.filter-tag').forEach(tag => {
                tag.classList.toggle('active', tag.dataset.filter === this.manager.currentFilter);
            });
        }
        
        scrollToTable() {
            const tableContainer = document.querySelector('.gaps-analysis-section');
            if (tableContainer) {
                tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }
    
    // Export for use by other components
    window.TableFiltering = TableFiltering;
    """ 