/**
 * Global Keyboard Manager - Application-wide keyboard shortcuts
 * 
 * This manages all global keyboard shortcuts and delegates to appropriate components.
 * It handles OS-specific modifier keys and updates the UI to show the correct shortcuts.
 */

class GlobalKeyboardManager {
    constructor() {
        this.isDestroyed = false;
        this.isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        this.modifierKey = this.isMac ? 'metaKey' : 'ctrlKey';
        this.modifierName = this.isMac ? 'Cmd' : 'Ctrl';
        
        this.init();
    }
    
    init() {
        this.setupGlobalKeyboardShortcuts();
        this.updateKeyboardShortcutDisplay();
        
        console.log(`⌨️ Global keyboard manager initialized (${this.modifierName} mode)`);
    }
    
    setupGlobalKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (this.isDestroyed) { return; }
            
            // ESC to close modals (global)
            if (e.key === 'Escape') {
                this.closeAllModals();
                return;
            }
            
            // Don't handle shortcuts if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                // Exception: ESC and modifier+shortcuts are allowed
                if (e.key !== 'Escape' && !e[this.modifierKey]) {
                    return;
                }
            }
            
            // Cmd/Ctrl + F: Focus search with smooth scroll
            if (e[this.modifierKey] && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                this.focusSearchWithSmoothScroll();
                return;
            }
            
            // Cmd/Ctrl + K: Open column picker
            if (e[this.modifierKey] && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                this.openColumnPicker();
                return;
            }
            
            // Cmd/Ctrl + Shift + D: Toggle theme
            if (e[this.modifierKey] && e.shiftKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                this.toggleTheme();
                return;
            }
            
            // F1: Show help modal
            if (e.key === 'F1') {
                e.preventDefault();
                this.showHelpModal();
                return;
            }
        });
    }
    
    // Global application functions
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            modal.style.display = 'none';
        });
        
        console.log('🚪 All modals closed (global)');
    }
    
    // Search functionality - delegates to search component
    focusSearchWithSmoothScroll() {
        const searchInput = document.getElementById('gap-search');
        if (searchInput) {
            // First scroll to the search input smoothly
            searchInput.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Then focus after a short delay to ensure scroll completes
            setTimeout(() => {
                searchInput.focus();
                searchInput.select();
            }, 300);
            
            console.log('🔍 Search focused with smooth scroll');
        }
    }
    
    // Column picker functionality - delegates to modal manager
    openColumnPicker() {
        // Use modal manager if available
        if (window.modalManager && window.modalManager.showColumnPicker) {
            window.modalManager.showColumnPicker();
        } else {
            // Fallback to basic column picker
            const columnModal = document.getElementById('column-picker-modal');
            if (columnModal) {
                columnModal.classList.add('show');
                columnModal.style.display = 'flex';
            }
        }
        
        console.log('⚙️ Column picker opened (global shortcut)');
    }
    
    // Theme functionality - global application feature
    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Also update data-theme attribute if present
        const htmlElement = document.documentElement;
        if (htmlElement.hasAttribute('data-theme')) {
            htmlElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        }
        
        console.log(`🌓 Theme toggled to: ${isDark ? 'dark' : 'light'} (global shortcut)`);
    }
    
    // Help modal functionality - global application feature
    showHelpModal() {
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            helpModal.classList.add('show');
            helpModal.style.display = 'flex';
            console.log('❓ Help modal opened (global shortcut)');
        }
    }
    
    // Update the displayed keyboard shortcuts based on OS
    updateKeyboardShortcutDisplay() {
        // Update footer shortcuts
        const footerShortcuts = document.querySelectorAll('.footer-kbd');
        footerShortcuts.forEach(kbd => {
            const text = kbd.textContent;
            if (text.includes('Ctrl+')) {
                kbd.textContent = text.replace('Ctrl+', `${this.modifierName}+`);
            }
        });
        
        // Update help modal shortcuts
        const helpShortcuts = document.querySelectorAll('#help-modal kbd');
        helpShortcuts.forEach(kbd => {
            const text = kbd.textContent;
            if (text.includes('Ctrl+')) {
                kbd.textContent = text.replace('Ctrl+', `${this.modifierName}+`);
            }
        });
        
        // Update tooltip text that might contain shortcuts
        const tooltipElements = document.querySelectorAll('[title*="Ctrl+"]');
        tooltipElements.forEach(element => {
            const title = element.title;
            element.title = title.replace('Ctrl+', `${this.modifierName}+`);
        });
        
        // Update any other elements that might contain keyboard shortcuts
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            // Check text content for shortcuts
            if (element.textContent && element.textContent.includes('Ctrl+')) {
                // Only update if this element doesn't have children (to avoid updating parent elements)
                if (element.children.length === 0) {
                    element.textContent = element.textContent.replace('Ctrl+', `${this.modifierName}+`);
                }
            }
        });
        
        console.log(`⌨️ Keyboard shortcut display updated for ${this.isMac ? 'Mac' : 'Windows/Linux'}`);
    }
    
    // Utility method to get the current OS info
    getOSInfo() {
        return {
            isMac: this.isMac,
            modifierKey: this.modifierKey,
            modifierName: this.modifierName
        };
    }
    
    // Destroy the keyboard manager
    destroy() {
        this.isDestroyed = true;
        console.log('🗑️ Global keyboard manager destroyed');
    }
}

// Create and initialize the global keyboard manager
let globalKeyboardManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        globalKeyboardManager = new GlobalKeyboardManager();
        window.globalKeyboardManager = globalKeyboardManager;
    });
} else {
    globalKeyboardManager = new GlobalKeyboardManager();
    window.globalKeyboardManager = globalKeyboardManager;
}

window.GlobalKeyboardManager = GlobalKeyboardManager; 