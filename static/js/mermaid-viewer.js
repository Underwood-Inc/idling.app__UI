/**
 * Enhanced Mermaid Diagram Viewer
 * Adds interactive controls for better diagram viewing experience
 */

class MermaidViewer {
  constructor() {
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.enhanceAllDiagrams());
    } else {
      this.enhanceAllDiagrams();
    }

    // Also handle dynamic content
    this.observeDynamicContent();
  }

  enhanceAllDiagrams() {
    const diagrams = document.querySelectorAll('.mermaid');
    diagrams.forEach(diagram => this.enhanceDiagram(diagram));
  }

  enhanceDiagram(diagram) {
    // Skip if already enhanced
    if (diagram.hasAttribute('data-enhanced')) return;
    
    // Mark as enhanced
    diagram.setAttribute('data-enhanced', 'true');

    // Create container wrapper if needed
    let container = diagram.closest('.mermaid-container');
    if (!container) {
      container = this.createContainer(diagram);
    }

    // Add controls
    this.addControls(container, diagram);
    
    // Add info overlay
    this.addInfoOverlay(container, diagram);
    
    // Add keyboard shortcuts
    this.addKeyboardShortcuts(container, diagram);
    
    // Enhance pan and zoom
    this.enhancePanZoom(diagram);
  }

  createContainer(diagram) {
    const container = document.createElement('div');
    container.className = 'mermaid-container';
    
    // Detect diagram type
    const diagramType = this.detectDiagramType(diagram);
    if (diagramType) {
      container.setAttribute('data-diagram-type', diagramType);
    }
    
    diagram.parentNode.insertBefore(container, diagram);
    container.appendChild(diagram);
    
    return container;
  }

  detectDiagramType(diagram) {
    const content = diagram.textContent || diagram.innerHTML;
    
    if (content.includes('graph') || content.includes('flowchart')) return 'flowchart';
    if (content.includes('sequenceDiagram')) return 'sequence';
    if (content.includes('classDiagram')) return 'class';
    if (content.includes('stateDiagram')) return 'state';
    if (content.includes('erDiagram')) return 'er';
    if (content.includes('gantt')) return 'gantt';
    if (content.includes('journey')) return 'journey';
    if (content.includes('gitGraph')) return 'git';
    if (content.includes('C4Context')) return 'c4';
    
    return 'diagram';
  }

  addControls(container, diagram) {
    const controls = document.createElement('div');
    controls.className = 'mermaid-controls';
    
    // Create control buttons
    const buttons = [
      { icon: '+', title: 'Zoom In', action: () => this.zoomIn(diagram) },
      { icon: '-', title: 'Zoom Out', action: () => this.zoomOut(diagram) },
      { icon: '⌂', title: 'Reset View', action: () => this.resetView(diagram) },
      { icon: '⛶', title: 'Fullscreen', action: () => this.toggleFullscreen(container, diagram) },
      { icon: '📋', title: 'Copy SVG', action: () => this.copySVG(diagram) }
    ];

    buttons.forEach(({ icon, title, action }) => {
      const button = document.createElement('button');
      button.className = 'mermaid-control-btn';
      button.innerHTML = icon;
      button.title = title;
      button.onclick = action;
      controls.appendChild(button);
    });

    container.appendChild(controls);
  }

  addInfoOverlay(container, diagram) {
    const info = document.createElement('div');
    info.className = 'mermaid-info';
    
    // Get diagram stats
    const svg = diagram.querySelector('svg');
    if (svg) {
      const bbox = svg.getBBox();
      const nodes = svg.querySelectorAll('.node, .actor, .state, .class').length;
      const edges = svg.querySelectorAll('.edgePath, .messageLine, .transition').length;
      
      info.innerHTML = `
        Nodes: ${nodes} • Edges: ${edges} • 
        Size: ${Math.round(bbox.width)}×${Math.round(bbox.height)}px<br>
        Scroll to zoom • Drag to pan • Press F for fullscreen
      `;
    } else {
      info.innerHTML = 'Scroll to zoom • Drag to pan • Press F for fullscreen';
    }

    container.appendChild(info);
  }

  addKeyboardShortcuts(container, diagram) {
    container.addEventListener('keydown', (e) => {
      if (e.target === container || container.contains(e.target)) {
        switch (e.key.toLowerCase()) {
          case 'f':
            e.preventDefault();
            this.toggleFullscreen(container, diagram);
            break;
          case '+':
          case '=':
            e.preventDefault();
            this.zoomIn(diagram);
            break;
          case '-':
            e.preventDefault();
            this.zoomOut(diagram);
            break;
          case '0':
            e.preventDefault();
            this.resetView(diagram);
            break;
          case 'escape':
            if (container.classList.contains('mermaid-fullscreen')) {
              this.exitFullscreen(container);
            }
            break;
        }
      }
    });

    // Make container focusable
    container.setAttribute('tabindex', '0');
  }

  enhancePanZoom(diagram) {
    const svg = diagram.querySelector('svg');
    if (!svg) return;

    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let startX, startY;

    // Store initial state
    diagram._viewerState = { scale, translateX, translateY };

    // Apply transform
    const applyTransform = () => {
      const g = svg.querySelector('g');
      if (g) {
        g.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        g.style.transformOrigin = '0 0';
      }
    };

    // Zoom with mouse wheel
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(5, scale * scaleFactor));
      
      if (newScale !== scale) {
        translateX -= (x * (newScale - scale)) / scale;
        translateY -= (y * (newScale - scale)) / scale;
        scale = newScale;
        applyTransform();
        
        // Update stored state
        diagram._viewerState = { scale, translateX, translateY };
      }
    });

    // Pan with mouse drag
    svg.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left click only
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        svg.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        applyTransform();
        diagram._viewerState = { scale, translateX, translateY };
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        svg.style.cursor = 'grab';
      }
    });

    // Initial setup
    svg.style.cursor = 'grab';
    applyTransform();
  }

  zoomIn(diagram) {
    const state = diagram._viewerState || { scale: 1, translateX: 0, translateY: 0 };
    state.scale = Math.min(5, state.scale * 1.2);
    this.updateTransform(diagram, state);
  }

  zoomOut(diagram) {
    const state = diagram._viewerState || { scale: 1, translateX: 0, translateY: 0 };
    state.scale = Math.max(0.1, state.scale / 1.2);
    this.updateTransform(diagram, state);
  }

  resetView(diagram) {
    const state = { scale: 1, translateX: 0, translateY: 0 };
    this.updateTransform(diagram, state);
  }

  updateTransform(diagram, state) {
    diagram._viewerState = state;
    const svg = diagram.querySelector('svg');
    const g = svg?.querySelector('g');
    
    if (g) {
      g.style.transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
      g.style.transformOrigin = '0 0';
      g.style.transition = 'transform 0.3s ease';
      
      // Remove transition after animation
      setTimeout(() => {
        g.style.transition = '';
      }, 300);
    }
  }

  toggleFullscreen(container, diagram) {
    if (container.classList.contains('mermaid-fullscreen')) {
      this.exitFullscreen(container);
    } else {
      this.enterFullscreen(container);
    }
  }

  enterFullscreen(container) {
    container.classList.add('mermaid-fullscreen');
    document.body.style.overflow = 'hidden';
    container.focus();
    
    // Add escape listener
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.exitFullscreen(container);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  exitFullscreen(container) {
    container.classList.remove('mermaid-fullscreen');
    document.body.style.overflow = '';
  }

  async copySVG(diagram) {
    const svg = diagram.querySelector('svg');
    if (!svg) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      await navigator.clipboard.writeText(svgData);
      
      // Show feedback
      this.showToast('SVG copied to clipboard!', 'success');
    } catch (error) {
      this.showToast('Failed to copy SVG', 'error');
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `mermaid-toast mermaid-toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ea2b1f' : '#edae49'};
      color: #1a1611;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: "Fira Code", monospace;
      font-size: 14px;
      font-weight: 600;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  observeDynamicContent() {
    // Watch for dynamically added mermaid diagrams
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const diagrams = node.querySelectorAll ? node.querySelectorAll('.mermaid') : [];
            diagrams.forEach(diagram => this.enhanceDiagram(diagram));
            
            if (node.classList && node.classList.contains('mermaid')) {
              this.enhanceDiagram(node);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Add slide animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize the viewer
new MermaidViewer(); 