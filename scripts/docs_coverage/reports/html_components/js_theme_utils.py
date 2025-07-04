#!/usr/bin/env python3
"""
Theme Management and Utility JavaScript for HTML Documentation Coverage Report

Provides theme switching, timestamp handling, and other utility functions.
"""

def get_theme_manager_js() -> str:
    """Generate JavaScript for theme management functionality."""
    return """
    // Theme Manager for dark/light mode switching
    class ThemeManager {
        constructor() {
            this.currentTheme = this.getStoredTheme() || this.getPreferredTheme();
            this.init();
        }
        
        init() {
            this.applyTheme(this.currentTheme);
            this.setupThemeToggle();
            this.setupMediaQuery();
            
            console.log(`🎨 Theme initialized: ${this.currentTheme}`);
        }
        
        getStoredTheme() {
            return localStorage.getItem('docs-coverage-theme');
        }
        
        getPreferredTheme() {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('docs-coverage-theme', theme);
            this.currentTheme = theme;
            this.updateThemeToggle();
            
            console.log(`🎨 Theme applied: ${theme}`);
        }
        
        setupThemeToggle() {
            const toggle = document.getElementById('theme-toggle-btn');
            if (toggle) {
                toggle.addEventListener('click', () => {
                    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
                    this.applyTheme(newTheme);
                });
            }
        }
        
        setupMediaQuery() {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (!this.getStoredTheme()) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
        
        updateThemeToggle() {
            const toggle = document.getElementById('theme-toggle-btn');
            if (toggle) {
                toggle.setAttribute('aria-label', `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} theme`);
            }
        }
    }
    """


def get_timestamp_manager_js() -> str:
    """Generate JavaScript for timestamp tooltip functionality."""
    return """
    // Timestamp Tooltip Manager
    class TimestampManager {
        constructor() {
            this.tooltip = null;
            this.setupTimestampTooltips();
        }
        
        setupTimestampTooltips() {
            // Create tooltip element if it doesn't exist
            this.tooltip = document.getElementById('timestamp-tooltip');
            if (!this.tooltip) {
                console.warn('⚠️ Timestamp tooltip element not found');
                return;
            }
            
            // Setup timestamp hover handlers
            document.querySelectorAll('.timestamp-with-tooltip').forEach(element => {
                element.addEventListener('mouseenter', (e) => {
                    this.showTooltip(e.target);
                });
                
                element.addEventListener('mouseleave', () => {
                    this.hideTooltip();
                });
                
                element.addEventListener('mousemove', (e) => {
                    this.updateTooltipPosition(e);
                });
            });
            
            // Update relative times periodically
            this.updateRelativeTimes();
            setInterval(() => {
                this.updateRelativeTimes();
            }, 60000); // Update every minute
            
            console.log('🕒 Timestamp tooltips initialized');
        }
        
        showTooltip(element) {
            const timestamp = element.dataset.timestamp;
            if (!timestamp) return;
            
            const date = new Date(timestamp);
            const now = new Date();
            
            // Update tooltip content
            const relativeTimeElement = this.tooltip.querySelector('.tooltip-relative-time');
            const utcTimeElement = this.tooltip.querySelector('.tooltip-utc-time');
            const localTimeElement = this.tooltip.querySelector('.tooltip-local-time');
            
            if (relativeTimeElement) {
                relativeTimeElement.textContent = this.getRelativeTime(date, now);
            }
            
            if (utcTimeElement) {
                utcTimeElement.textContent = date.toISOString();
            }
            
            if (localTimeElement) {
                localTimeElement.textContent = date.toLocaleString();
            }
            
            // Show tooltip
            this.tooltip.style.display = 'block';
            this.tooltip.style.opacity = '1';
        }
        
        hideTooltip() {
            this.tooltip.style.opacity = '0';
            setTimeout(() => {
                this.tooltip.style.display = 'none';
            }, 200);
        }
        
        updateTooltipPosition(e) {
            const tooltipRect = this.tooltip.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            let left = e.clientX + 10;
            let top = e.clientY + 10;
            
            // Adjust position if tooltip would go off-screen
            if (left + tooltipRect.width > viewportWidth) {
                left = e.clientX - tooltipRect.width - 10;
            }
            
            if (top + tooltipRect.height > viewportHeight) {
                top = e.clientY - tooltipRect.height - 10;
            }
            
            this.tooltip.style.left = left + 'px';
            this.tooltip.style.top = top + 'px';
        }
        
        updateRelativeTimes() {
            const now = new Date();
            
            document.querySelectorAll('.timestamp-with-tooltip').forEach(element => {
                const timestamp = element.dataset.timestamp;
                if (!timestamp) return;
                
                const date = new Date(timestamp);
                const relativeTimeElement = element.querySelector('.relative-time');
                
                if (relativeTimeElement) {
                    relativeTimeElement.textContent = this.getRelativeTime(date, now);
                }
            });
        }
        
        getRelativeTime(date, now) {
            const diffMs = now - date;
            const diffSeconds = Math.floor(diffMs / 1000);
            const diffMinutes = Math.floor(diffSeconds / 60);
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffSeconds < 60) {
                return 'Just now';
            } else if (diffMinutes < 60) {
                return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
            } else if (diffHours < 24) {
                return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            } else if (diffDays < 30) {
                return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            } else {
                return date.toLocaleDateString();
            }
        }
    }
    """


def get_keyboard_manager_js() -> str:
    """Generate JavaScript for keyboard shortcuts and accessibility."""
    return """
    // Keyboard Shortcuts Manager
    class KeyboardManager {
        constructor() {
            this.setupKeyboardShortcuts();
        }
        
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                this.handleKeyboardShortcut(e);
            });
            
            console.log('⌨️ Keyboard shortcuts initialized');
        }
        
        handleKeyboardShortcut(e) {
            // Theme toggle: Ctrl+Shift+D
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                const themeToggle = document.getElementById('theme-toggle-btn');
                if (themeToggle) {
                    themeToggle.click();
                }
                return;
            }
            
            // Search focus: Ctrl+F
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                const searchInput = document.getElementById('gap-search');
                if (searchInput) {
                    e.preventDefault();
                    searchInput.focus();
                    searchInput.select();
                }
                return;
            }
            
            // Column picker: Ctrl+K
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const columnPickerBtn = document.getElementById('column-picker-btn');
                if (columnPickerBtn) {
                    columnPickerBtn.click();
                }
                return;
            }
            
            // Help modal: F1 or Ctrl+?
            if (e.key === 'F1' || ((e.ctrlKey || e.metaKey) && e.key === '?')) {
                e.preventDefault();
                const helpBtn = document.getElementById('help-btn');
                if (helpBtn) {
                    helpBtn.click();
                }
                return;
            }
            
            // Escape key handling is done in ModalManager
        }
    }
    """


def get_utility_functions_js() -> str:
    """Generate JavaScript utility functions."""
    return """
    // Utility Functions
    class UtilityManager {
        constructor() {
            this.setupUtilityFunctions();
        }
        
        setupUtilityFunctions() {
            // Add utility methods to window for global access
            window.docsCoverageUtils = {
                formatBytes: this.formatBytes,
                formatNumber: this.formatNumber,
                debounce: this.debounce,
                throttle: this.throttle,
                sanitizeHtml: this.sanitizeHtml,
                copyToClipboard: this.copyToClipboard,
                downloadText: this.downloadText,
                showNotification: this.showNotification
            };
            
            console.log('🔧 Utility functions initialized');
        }
        
        formatBytes(bytes, decimals = 2) {
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }
        
        formatNumber(num, decimals = 0) {
            if (num === null || num === undefined) return '0';
            
            return num.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        }
        
        debounce(func, wait, immediate) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    timeout = null;
                    if (!immediate) func(...args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func(...args);
            };
        }
        
        throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
        
        sanitizeHtml(str) {
            const temp = document.createElement('div');
            temp.textContent = str;
            return temp.innerHTML;
        }
        
        async copyToClipboard(text) {
            try {
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(text);
                    return true;
                } else {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    return successful;
                }
            } catch (err) {
                console.error('Failed to copy text:', err);
                return false;
            }
        }
        
        downloadText(text, filename) {
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
        }
        
        showNotification(message, type = 'info', duration = 3000) {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            
            // Style the notification
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 24px;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                box-shadow: var(--shadow-lg);
                z-index: 9999;
                transition: all 0.3s ease;
                max-width: 300px;
                word-wrap: break-word;
            `;
            
            // Add type-specific styling
            if (type === 'success') {
                notification.style.borderColor = 'var(--color-success)';
                notification.style.backgroundColor = 'var(--color-success)';
                notification.style.color = 'white';
            } else if (type === 'error') {
                notification.style.borderColor = 'var(--color-error)';
                notification.style.backgroundColor = 'var(--color-error)';
                notification.style.color = 'white';
            } else if (type === 'warning') {
                notification.style.borderColor = 'var(--color-warning)';
                notification.style.backgroundColor = 'var(--color-warning)';
                notification.style.color = 'white';
            }
            
            // Add to document
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateY(0)';
            }, 10);
            
            // Remove after duration
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, duration);
        }
    }
    """


# Export the JavaScript generator functions
__all__ = [
    'get_theme_manager_js',
    'get_timestamp_manager_js',
    'get_keyboard_manager_js',
    'get_utility_functions_js'
] 