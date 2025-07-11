#!/usr/bin/env python3
"""
Table Pagination Functionality for HTML Documentation Coverage Report

Handles all pagination operations including page navigation, page size control,
pagination info updates, and pagination button states.
"""

def get_table_pagination_js() -> str:
    """Generate table pagination JavaScript functionality."""
    return """
    // Table Pagination - Page Navigation and Page Size Control
    class TablePagination {
        constructor(tableManager) {
            this.manager = tableManager;
            this.setupPaginationHandlers();
        }
        
        setupPaginationHandlers() {
            // Page size selector - use correct ID from HTML
            const pageSizeSelect = document.getElementById('items-per-page');
            if (pageSizeSelect) {
                pageSizeSelect.addEventListener('change', (e) => {
                    if (this.manager.isDestroyed) return;
                    this.manager.pageSize = e.target.value === 'all' ? this.manager.filteredRows.length : parseInt(e.target.value);
                    this.manager.currentPage = 1;
                    this.manager.updateDisplay();
                    this.manager.saveState();
                    console.log(`📄 Page size changed to: ${this.manager.pageSize}`);
                });
            }
            
            // Pagination buttons - use correct IDs from HTML
            const paginationButtons = [
                { id: 'first-page', action: () => this.goToPage(1) },
                { id: 'prev-page', action: () => this.goToPage(this.manager.currentPage - 1) },
                { id: 'next-page', action: () => this.goToPage(this.manager.currentPage + 1) },
                { id: 'last-page', action: () => this.goToPage(this.manager.totalPages) }
            ];
            
            paginationButtons.forEach(({ id, action }) => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.addEventListener('click', (e) => {
                        if (this.manager.isDestroyed) return;
                        action();
                    });
                }
            });
            
            // Current page input - use correct ID from HTML
            const currentPageInput = document.getElementById('current-page');
            if (currentPageInput) {
                currentPageInput.addEventListener('change', (e) => {
                    if (this.manager.isDestroyed) return;
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= this.manager.totalPages) {
                        this.goToPage(page);
                    }
                });
            }
            
            console.log('📄 Pagination handlers attached');
        }
        
        goToPage(page) {
            if (page < 1 || page > this.manager.totalPages) return;
            
            this.manager.currentPage = page;
            this.manager.updateDisplay();
            this.manager.saveState();
            
            console.log(`📄 Navigated to page ${page}`);
        }
        
        updatePaginationInfo() {
            const startIndex = (this.manager.currentPage - 1) * this.manager.pageSize;
            const endIndex = Math.min(startIndex + this.manager.pageSize, this.manager.filteredRows.length);
            
            // Update showing start/end/total elements
            const showingStart = document.getElementById('showing-start');
            const showingEnd = document.getElementById('showing-end');
            const showingTotal = document.getElementById('showing-total');
            
            if (showingStart) showingStart.textContent = startIndex + 1;
            if (showingEnd) showingEnd.textContent = endIndex;
            if (showingTotal) showingTotal.textContent = this.manager.filteredRows.length;
            
            console.log(`📊 Pagination info updated: ${startIndex + 1}-${endIndex} of ${this.manager.filteredRows.length}`);
        }
        
        updatePaginationButtons() {
            const buttons = [
                { ids: ['first-page'], condition: this.manager.currentPage <= 1 },
                { ids: ['prev-page'], condition: this.manager.currentPage <= 1 },
                { ids: ['next-page'], condition: this.manager.currentPage >= this.manager.totalPages },
                { ids: ['last-page'], condition: this.manager.currentPage >= this.manager.totalPages }
            ];
            
            buttons.forEach(({ ids, condition }) => {
                ids.forEach(id => {
                    const btn = document.getElementById(id);
                    if (btn) {
                        btn.disabled = condition;
                    }
                });
            });
            
            // Update current page input
            const currentPageInput = document.getElementById('current-page');
            if (currentPageInput) {
                currentPageInput.value = this.manager.currentPage;
                currentPageInput.max = this.manager.totalPages;
            }
        }
    }
    
    // Export for use by other components
    window.TablePagination = TablePagination;
    """ 