/**
 * Main JavaScript functionality for Documentation Coverage Report
 * Handles table interaction, modals, theming, and pagination
 */

// Global debug function (works even without test page)
window.debugLog = function(message) {
    const timestamp = new Date().toLocaleTimeString();
    
    // Only log to console in development mode
    if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
        // eslint-disable-next-line no-console
        console.log(`[${timestamp}] ${message}`);
    }
    
    // Also log to DOM if debug element exists
    const debugElement = document.getElementById('debug-log');
    if (debugElement) {
        debugElement.innerHTML += `<div>[${timestamp}] ${message}</div>`;
        debugElement.scrollTop = debugElement.scrollHeight;
    }
};

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
            'file': true,
            'status': true,
            'priority': true,
            'size': true,
            'expected': true,
            'effort': false,
            'issues': false,
            'type': false
        };
        
        this.init();
    }

    init() {
        this.initializeEventListeners();
        this.initializeTableData();
        this.updateTableInfo();
        this.applyFilters();
        this.initializeTheme();
        
        // Make sure tableManager is available globally
        window.tableManager = this;
    }

    initializeTableData() {
        // Get all table rows using correct table body ID
        const rows = document.querySelectorAll('#gaps-table-body tr');
        
        if (typeof window.debugLog === 'function') {
            window.debugLog(`🔍 Looking for table rows with selector '#gaps-table-body tr'`);
            window.debugLog(`📊 Found ${rows.length} table rows`);
        }
        
        this.allItems = Array.from(rows).map((row, index) => {
            const fileCell = row.querySelector('td');
            const statusCell = row.querySelector('td:nth-child(2)');
            const priorityCell = row.querySelector('td:nth-child(3)');
            
            const item = {
                element: row,
                file: fileCell ? fileCell.textContent.trim() : '',
                status: statusCell ? statusCell.textContent.trim() : '',
                priority: priorityCell ? priorityCell.textContent.trim() : '',
                visible: true
            };
            
            if (typeof window.debugLog === 'function' && index < 3) {
                window.debugLog(`📋 Item ${index}: file="${item.file}", status="${item.status}", priority="${item.priority}"`);
            }
            
            return item;
        });
        
        // Initialize filteredItems
        this.filteredItems = [...this.allItems];
        
        if (typeof window.debugLog === 'function') {
            window.debugLog(`✅ Initialized ${this.allItems.length} items total`);
        }
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

        // Clickable metric cards for filtering
        const clickableCards = document.querySelectorAll('.clickable-card[data-filter]');
        clickableCards.forEach(card => {
            card.addEventListener('click', this.handleFilterCard.bind(this));
        });

        // Page size selector - using correct ID
        this.pageSizeSelect = document.getElementById('items-per-page');
        if (this.pageSizeSelect) {
            this.pageSizeSelect.addEventListener('change', this.handlePageSizeChange.bind(this));
        }

        // Pagination buttons - matching the correct HTML IDs
        const firstPageBtn = document.getElementById('first-page');
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        const lastPageBtn = document.getElementById('last-page');

        if (firstPageBtn) firstPageBtn.addEventListener('click', () => this.goToPage(1));
        if (prevPageBtn) prevPageBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        if (nextPageBtn) nextPageBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        if (lastPageBtn) lastPageBtn.addEventListener('click', () => this.goToPage(this.getTotalPages()));

        // Current page input navigation
        const currentPageInput = document.getElementById('current-page');
        if (currentPageInput) {
            currentPageInput.addEventListener('change', (e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= this.getTotalPages()) {
                    this.goToPage(page);
                }
            });
        }

        // Table headers for sorting - use data-column instead of data-sort
        const headers = document.querySelectorAll('th[data-column]');
        headers.forEach(header => {
            header.addEventListener('click', this.handleSort.bind(this));
        });

        // Table rows for clicking - using correct table body ID
        this.table = document.querySelector('#gaps-table-body');
        if (this.table) {
            this.table.addEventListener('click', this.handleRowClick.bind(this));
        }

        // Theme toggle - DON'T bind event listener since HTML uses onclick
        // The global toggleTheme() function will handle this

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
        const filterType = e.target.dataset.filter;
        const filterValue = e.target.dataset.value;
        
        // Remove active class from all tags in the same group
        const filterGroup = e.target.closest('.filter-group');
        if (filterGroup) {
            filterGroup.querySelectorAll('.filter-tag').forEach(tag => {
                tag.classList.remove('active');
            });
        }
        
        // Add active class to clicked tag
        e.target.classList.add('active');
        
        // Apply filter based on type
        if (filterType === 'priority') {
            this.filters.priority = filterValue === '' ? '' : filterValue;
        } else if (filterType === 'status') {
            this.filters.status = filterValue === '' ? '' : filterValue;
        }
        
        this.applyFilters();
        
        // Smooth scroll to table
        this.smoothScrollToTable();
    }

    handleFilterCard(e) {
        // Handle clickable metric card clicks
        const filterValue = e.currentTarget.dataset.filter;
        
        // Remove active class from all filter tags
        document.querySelectorAll('.filter-tag').forEach(tag => {
            tag.classList.remove('active');
        });
        
        // Add active class to corresponding filter tag
        const correspondingTag = document.querySelector(`.filter-tag[data-filter="${filterValue}"]`);
        if (correspondingTag) {
            correspondingTag.classList.add('active');
        }
        
        // Apply filter
        this.filters.status = filterValue === 'all' ? '' : filterValue;
        this.applyFilters();
        
        // Smooth scroll to table
        this.smoothScrollToTable();
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
        const value = e.target.value;
        if (value === 'all') {
            this.pageSize = this.filteredItems.length || 9999;
        } else {
            this.pageSize = parseInt(value);
        }
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
        if (typeof window.debugLog === 'function') {
            window.debugLog(`🎯 Applying filters - search: "${this.filters.search}", status: "${this.filters.status}"`);
            window.debugLog(`📊 Starting with ${this.allItems.length} total items`);
        }
        
        this.filteredItems = this.allItems.filter(item => {
            const matchesSearch = !this.filters.search || 
                item.file.toLowerCase().includes(this.filters.search);
            
            // Handle filter tag values
            let matchesStatus = true;
            if (this.filters.status && this.filters.status !== 'all') {
                switch (this.filters.status) {
                    case 'critical':
                        matchesStatus = item.priority.toLowerCase() === 'critical';
                        break;
                    case 'high':
                        matchesStatus = item.priority.toLowerCase() === 'high';
                        break;
                    case 'medium':
                        matchesStatus = item.priority.toLowerCase() === 'medium';
                        break;
                    case 'low':
                        matchesStatus = item.priority.toLowerCase() === 'low';
                        break;
                    case 'missing':
                        matchesStatus = item.status.toLowerCase() === 'missing';
                        break;
                    case 'inadequate':
                        matchesStatus = item.status.toLowerCase() === 'inadequate';
                        break;
                    default:
                        matchesStatus = true;
                }
            }
            
            const passes = matchesSearch && matchesStatus;
            
            if (typeof window.debugLog === 'function' && this.allItems.indexOf(item) < 3) {
                window.debugLog(`🔍 Item "${item.file}": search=${matchesSearch}, status=${matchesStatus}, passes=${passes}`);
            }
            
            return passes;
        });
        
        if (typeof window.debugLog === 'function') {
            window.debugLog(`✅ Filter complete: ${this.filteredItems.length} items match criteria`);
        }
        
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
            const aValue = a.file || '';
            const bValue = b.file || '';
            
            let comparison = 0;
            if (aValue < bValue) comparison = -1;
            if (aValue > bValue) comparison = 1;
            
            return this.sortDirection === 'desc' ? -comparison : comparison;
        });
        
        this.updateDisplay();
    }

    updateDisplay() {
        this.updateTableVisibility();
        this.updatePaginationControls();
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
        // Update the total items display using correct element ID
        const totalElement = document.getElementById('showing-total');
        if (totalElement) {
            totalElement.textContent = this.filteredItems.length;
        }
    }

    goToPage(page) {
        const totalPages = this.getTotalPages();
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.updateDisplay();
        }
    }

    openSourceModal(filePath) {
        const modal = document.getElementById('source-code-modal');
        const modalTitle = document.getElementById('source-modal-title');
        const sourceCode = document.getElementById('source-code-content');
        const sourceCodeText = document.getElementById('source-code-text');
        
        // Debug logging
        if (typeof window.debugLog === 'function') {
            window.debugLog('🔍 Modal elements found:');
            window.debugLog(`  - modal: ${modal ? 'found' : 'NOT found'}`);
            window.debugLog(`  - modalTitle: ${modalTitle ? 'found' : 'NOT found'}`);
            window.debugLog(`  - sourceCode: ${sourceCode ? 'found' : 'NOT found'}`);
            window.debugLog(`  - sourceCodeText: ${sourceCodeText ? 'found' : 'NOT found'}`);
        }
        
        if (!modal || !modalTitle || !sourceCode || !sourceCodeText) {
            if (typeof window.debugLog === 'function') {
                window.debugLog('❌ Some modal elements missing, aborting');
            }
            return;
        }
        
        modalTitle.textContent = `📄 ${filePath}`;
        
        // Show loading state
        sourceCodeText.textContent = 'Loading source code...';
        sourceCode.style.display = 'block';
        
        modal.classList.add('show');
        
        if (typeof window.debugLog === 'function') {
            window.debugLog('✅ Modal opened, starting setTimeout...');
        }
        
        // Load source code with syntax highlighting
        setTimeout(() => {
            if (typeof window.debugLog === 'function') {
                window.debugLog('⏰ setTimeout executed, loading code...');
            }
            
            const codeContent = `// Source code for ${filePath}
// This would typically load from the actual file

import React from 'react';
import { useState, useEffect } from 'react';

/**
 * Example component for ${filePath}
 */
interface UserProfileProps {
    userId: string;
    showDetails?: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, showDetails = false }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUserData(userId)
            .then(userData => {
                setUser(userData);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [userId]);

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">Error: {error}</div>;
    if (!user) return <div className="no-user">User not found</div>;

    return (
        <div className="user-profile">
            <h2>{user.name}</h2>
            <p>Email: {user.email}</p>
            {showDetails && (
                <div className="details">
                    <p>ID: {user.id}</p>
                    <p>Created: {user.createdAt}</p>
                    <p>Last Login: {user.lastLoginAt}</p>
                </div>
            )}
        </div>
    );
};

export default UserProfile;`;

            sourceCodeText.textContent = codeContent;
            
            if (typeof window.debugLog === 'function') {
                window.debugLog('📝 Code content set, applying syntax highlighting...');
            }
            
            // Add syntax highlighting classes manually
            this.applySyntaxHighlighting(sourceCodeText);
            
            if (typeof window.debugLog === 'function') {
                window.debugLog('✅ Syntax highlighting applied');
            }
        }, 500);
    }

    applySyntaxHighlighting(element) {
        if (!element) {
            if (typeof window.debugLog === 'function') {
                window.debugLog('❌ No element provided to applySyntaxHighlighting');
            }
            return;
        }
        
        if (typeof window.debugLog === 'function') {
            window.debugLog('🎨 Starting syntax highlighting...');
        }
        
        // Get the text content
        const codeContent = element.textContent || element.innerText;
        
        if (typeof window.debugLog === 'function') {
            window.debugLog(`📝 Processing ${codeContent.length} characters of code`);
        }
        
        try {
            // Use highlight.js if available
            if (typeof hljs !== 'undefined') {
                // Clear existing content
                element.innerHTML = '';
                element.textContent = codeContent;
                
                // Apply highlight.js
                // eslint-disable-next-line no-undef
                hljs.highlightElement(element);
                
                // Add additional CSS classes for our custom styling
                element.classList.add('hljs', 'language-typescript');
                
                if (typeof window.debugLog === 'function') {
                    window.debugLog('✅ Syntax highlighting applied using highlight.js');
                }
            } else {
                // Fallback to basic regex highlighting
                if (typeof window.debugLog === 'function') {
                    window.debugLog('⚠️ highlight.js not available, using basic highlighting');
                }
                
                let html = codeContent;
                
                // Add hljs class for styling
                element.className = 'hljs language-typescript';
                
                // Basic regex highlighting
                const keywords = [
                    'import', 'export', 'from', 'const', 'let', 'var', 'function', 'return',
                    'if', 'else', 'for', 'while', 'class', 'interface', 'type', 'enum',
                    'async', 'await', 'try', 'catch', 'finally', 'throw', 'new', 'this',
                    'super', 'extends', 'implements', 'public', 'private', 'protected',
                    'static', 'readonly', 'default'
                ].join('|');
                html = html.replace(new RegExp(`\\b(${keywords})\\b`, 'g'), '<span class="hljs-keyword">$1</span>');
                
                // Strings
                html = html.replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="hljs-string">$1$2$1</span>');
                
                // Comments
                html = html.replace(/(\/\/.*$)/gm, '<span class="hljs-comment">$1</span>');
                html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hljs-comment">$1</span>');
                
                // Numbers
                html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hljs-number">$1</span>');
                
                // Function names
                html = html.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, '<span class="hljs-function">$1</span>');
                
                // Types (capitalized words)
                html = html.replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span class="hljs-title class_">$1</span>');
                
                // Properties
                html = html.replace(/\.([a-zA-Z_][a-zA-Z0-9_]*)/g, '.<span class="hljs-property">$1</span>');
                
                // JSX tags
                html = html.replace(/(<\/?[a-zA-Z][a-zA-Z0-9]*)/g, '<span class="hljs-tag">$1</span>');
                html = html.replace(/(<span class="hljs-tag"><\/?[a-zA-Z][a-zA-Z0-9]*)(>)/g, '$1<span class="hljs-name">$2</span>');
                
                element.innerHTML = html;
                
                if (typeof window.debugLog === 'function') {
                    window.debugLog('✅ Basic syntax highlighting applied');
                }
            }
        } catch (error) {
            if (typeof window.debugLog === 'function') {
                window.debugLog(`❌ Error in syntax highlighting: ${error.message}`);
            }
            // Fallback - just show the plain text
            element.innerHTML = codeContent;
        }
    }

    openColumnPicker() {
        const modal = document.getElementById('column-picker-modal');
        if (modal) {
            this.generateColumnPickerContent();
            modal.classList.add('show');
        }
    }

    generateColumnPickerContent() {
        const picker = document.querySelector('.column-picker');
        if (!picker) return;

        // Define available columns based on actual table structure
        const columns = [
            { id: 'file', label: 'File Path', essential: true },
            { id: 'status', label: 'Status', essential: false },
            { id: 'priority', label: 'Priority', essential: false },
            { id: 'size', label: 'Size', essential: false },
            { id: 'expected', label: 'Expected Documentation', essential: false },
            { id: 'effort', label: 'Effort', essential: false },
            { id: 'issues', label: 'Quality Issues', essential: false },
            { id: 'type', label: 'Type', essential: false }
        ];

        picker.innerHTML = columns.map(col => `
            <div class="column-item ${col.essential ? 'essential' : ''}">
                <input type="checkbox" 
                       class="column-checkbox" 
                       id="col-${col.id}" 
                       data-column="${col.id}"
                       ${this.columnVisibility[col.id] !== false ? 'checked' : ''} 
                       ${col.essential ? 'disabled' : ''}>
                <label for="col-${col.id}" class="column-label">${col.label}</label>
                ${col.essential ? '<span class="column-essential">Essential</span>' : ''}
            </div>
        `).join('');

        // Add event listeners to checkboxes
        picker.querySelectorAll('.column-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const columnId = e.target.dataset.column;
                this.columnVisibility[columnId] = e.target.checked;
                this.updateColumnVisibility(columnId, e.target.checked);
            });
        });
    }

    updateColumnVisibility(columnId, visible) {
        // Find the column index by class name
        const table = document.querySelector('#gaps-table');
        if (!table) return;

        const columnClass = `col-${columnId}`;
        
        // Hide/show header
        const headerCell = table.querySelector(`th.${columnClass}`);
        if (headerCell) {
            headerCell.style.display = visible ? '' : 'none';
        }
        
        // Hide/show data cells
        const dataCells = table.querySelectorAll(`td.${columnClass}`);
        dataCells.forEach(cell => {
            cell.style.display = visible ? '' : 'none';
        });
    }

    openGitHub() {
        // Would open GitHub file in new tab
        // Implementation would go here
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            // Set display to none after animation completes
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
        // Restore body scroll
        document.body.style.overflow = '';
    }

    toggleTheme() {
        if (typeof window.debugLog === 'function') {
            window.debugLog('🌙 Instance toggleTheme() called');
        }
        
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        if (typeof window.debugLog === 'function') {
            window.debugLog(`🎨 Changing theme from ${currentTheme} to ${newTheme}`);
        }
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        if (typeof window.debugLog === 'function') {
            window.debugLog('✅ Theme changed successfully');
        }
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
            'file': 0,
            'status': 1,
            'priority': 2,
            'size': 3,
            'expected': 4,
            'effort': 5,
            'issues': 6,
            'type': 7
        };
        return columnMap[columnName] || -1;
    }

    focusSearch() {
        if (this.searchInput) {
            this.searchInput.focus();
        }
    }

    applyColumnVisibility() {
        // Apply all column visibility changes
        Object.keys(this.columnVisibility).forEach(columnId => {
            this.updateColumnVisibility(columnId, this.columnVisibility[columnId]);
        });
        
        // Update table info
        this.updateTableInfo();
        
        // Close modal
        this.closeModals();
    }

    resetColumnVisibility() {
        this.columnVisibility = {
            'file': true,
            'status': true,
            'priority': true,
            'size': true,
            'expected': true,
            'effort': false,
            'issues': false,
            'type': false
        };
        
        // Regenerate column picker content
        this.generateColumnPickerContent();
        
        // Apply changes
        this.applyColumnVisibility();
    }

    updateTableInfo() {
        const visibleColumns = Object.values(this.columnVisibility).filter(visible => visible).length;
        const totalColumns = Object.keys(this.columnVisibility).length;
        
        const tableInfo = document.getElementById('table-info');
        if (tableInfo) {
            tableInfo.textContent = `${visibleColumns}/${totalColumns} columns visible • Sorted by ${this.sortColumn || 'file'}. Hold Shift to multi-sort.`;
        }
    }

    smoothScrollToTable() {
        const tableContainer = document.querySelector('.advanced-table-container');
        if (tableContainer) {
            tableContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }

    getTotalPages() {
        return Math.ceil(this.filteredItems.length / this.pageSize);
    }

    updatePaginationControls() {
        const totalPages = this.getTotalPages();
        
        // Update pagination controls using correct IDs
        const firstPageBtn = document.getElementById('first-page');
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        const lastPageBtn = document.getElementById('last-page');
        const currentPageInput = document.getElementById('current-page');
        
        // Update pagination info elements
        const showingStart = document.getElementById('showing-start');
        const showingEnd = document.getElementById('showing-end');
        const showingTotal = document.getElementById('showing-total');

        // Update button states
        const isFirstPage = this.currentPage === 1;
        const isLastPage = this.currentPage === totalPages || totalPages === 0;

        // Enable/disable buttons
        if (firstPageBtn) firstPageBtn.disabled = isFirstPage;
        if (prevPageBtn) prevPageBtn.disabled = isFirstPage;
        if (nextPageBtn) nextPageBtn.disabled = isLastPage;
        if (lastPageBtn) lastPageBtn.disabled = isLastPage;

        // Update current page input
        if (currentPageInput) {
            currentPageInput.value = this.currentPage;
            currentPageInput.max = totalPages;
        }

        // Update showing info
        if (showingStart && showingEnd && showingTotal) {
            const startItem = totalPages > 0 ? ((this.currentPage - 1) * this.pageSize) + 1 : 0;
            const endItem = Math.min(this.currentPage * this.pageSize, this.filteredItems.length);
            
            showingStart.textContent = startItem;
            showingEnd.textContent = endItem;
            showingTotal.textContent = this.filteredItems.length;
        }
    }
}

// Global functions for inline event handlers
function toggleTheme() {
    if (typeof window.debugLog === 'function') {
        window.debugLog('🌍 Global toggleTheme() called');
    }
    
    if (window.tableManager) {
        if (typeof window.debugLog === 'function') {
            window.debugLog('✅ TableManager found, calling instance method');
        }
        window.tableManager.toggleTheme();
    } else {
        if (typeof window.debugLog === 'function') {
            window.debugLog('❌ TableManager not found!');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tableManager = new TableManager();
}); 