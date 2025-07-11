/**
 * Modal Manager Component
 * Handles modal display, keyboard events, and source code loading
 */

class ModalManager {
    constructor() {
        this.activeModal = null;
        this.fileMetadata = {};
        this.currentFilePath = null;
        this.isDestroyed = false;
        this.originalBodyOverflow = '';
        this.initializeModalSystem();
    }
    
    initializeModalSystem() {
        if (this.isDestroyed) { return; }
        
        this.originalBodyOverflow = document.body.style.overflow || '';
        this.loadEmbeddedSourceCode();
        this.setupModalEventHandlers();
        
        console.log('🎭 Modal system initialized successfully');
    }
    
    loadEmbeddedSourceCode() {
        try {
            const sourceCodeScript = document.querySelector('script[data-source-code="true"]');
            
            if (sourceCodeScript) {
                try {
                    this.fileMetadata = JSON.parse(sourceCodeScript.textContent);
                    console.log(`📄 Loaded source code for ${Object.keys(this.fileMetadata).length} files`);
                } catch (e) {
                    console.warn('Failed to parse source code data:', e);
                    this.fileMetadata = {};
                }
            } else {
                console.warn('No source code data found');
                this.fileMetadata = {};
            }
        } catch (e) {
            console.warn('Failed to load source code data:', e);
            this.fileMetadata = {};
        }
    }
    
    setupModalEventHandlers() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal && !this.isDestroyed) {
                e.preventDefault();
                e.stopPropagation();
                this.closeModal();
            }
        });
        
        document.addEventListener('click', (e) => {
            if (this.isDestroyed) { return; }
            
            if (e.target.classList.contains('modal') && this.activeModal) {
                e.preventDefault();
                e.stopPropagation();
                this.closeModal();
            }
            
            if (e.target.classList.contains('modal-close') && this.activeModal) {
                e.preventDefault();
                e.stopPropagation();
                this.closeModal();
            }
            
            if (e.target.id === 'open-github-btn' || e.target.closest('#open-github-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const githubBtn = e.target.id === 'open-github-btn' ? e.target : e.target.closest('#open-github-btn');
                const githubUrl = githubBtn.dataset.githubUrl;
                if (githubUrl) {
                    window.open(githubUrl, '_blank');
                }
            }
        });
    }
    
    showModal(modal) {
        if (this.isDestroyed) { return; }
        
        if (this.activeModal && this.activeModal !== modal) {
            this.closeModal();
        }
        
        if (!this.originalBodyOverflow) {
            this.originalBodyOverflow = document.body.style.overflow || '';
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        requestAnimationFrame(() => {
            if (!this.isDestroyed) {
                modal.classList.add('show');
            }
        });
        
        this.activeModal = modal;
        console.log('🎭 Modal opened successfully');
    }
    
    closeModal() {
        if (!this.activeModal || this.isDestroyed) { return; }
        
        console.log('🎭 Closing modal...');
        
        const modalToClose = this.activeModal;
        modalToClose.classList.remove('show');
        this.activeModal = null;
        document.body.style.overflow = this.originalBodyOverflow;
        
        setTimeout(() => {
            if (!this.isDestroyed && modalToClose) {
                modalToClose.style.display = 'none';
            }
        }, 300);
        
        console.log('🎭 Modal closed successfully');
    }
    
    showLoadingState(loading, error, content) {
        if (loading) { loading.style.display = 'flex'; }
        if (error) { error.style.display = 'none'; }
        if (content) { content.style.display = 'none'; }
    }
    
    showColumnPicker() {
        const modal = document.getElementById('column-picker-modal');
        if (modal) {
            this.showModal(modal);
        }
    }
    
    showHelpModal() {
        const modal = document.getElementById('help-modal');
        if (modal) {
            this.showModal(modal);
        }
    }
    
    destroy() {
        if (this.activeModal) {
            this.closeModal();
        }
        this.isDestroyed = true;
        this.activeModal = null;
        this.fileMetadata = {};
        this.currentFilePath = null;
        document.body.style.overflow = this.originalBodyOverflow;
    }
}

/**
 * Initialize the modal manager
 */
export function initializeModalManager() {
    if (window.modalManager) {
        window.modalManager.destroy();
    }
    
    window.modalManager = new ModalManager();
    console.log('✅ Modal manager initialized');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModalManager);
} else {
    initializeModalManager();
} 