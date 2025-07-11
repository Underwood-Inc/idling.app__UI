/**
 * Syntax Highlighting Utilities
 * Provides syntax highlighting for source code display in modals
 */

function applySyntaxHighlighting(element, language) {
    if (!element) { return; }
    
    // Strategy 1: Use hljs if available
    if (window.hljs && typeof window.hljs.highlightElement === 'function') {
        try {
            element.className = '';
            if (language) {
                element.classList.add(`language-${language}`);
            }
            window.hljs.highlightElement(element);
            console.log('✨ Syntax highlighting applied with hljs');
            return;
        } catch (e) {
            console.warn('Failed to apply hljs highlighting:', e);
        }
    }
    
    // Strategy 2: Use hljs.highlightBlock (older API)
    if (window.hljs && typeof window.hljs.highlightBlock === 'function') {
        try {
            element.className = language ? `language-${language}` : '';
            window.hljs.highlightBlock(element);
            console.log('✨ Syntax highlighting applied with hljs (legacy)');
            return;
        } catch (e) {
            console.warn('Failed to apply hljs legacy highlighting:', e);
        }
    }
    
    // Strategy 3: Manual highlighting with classes
    try {
        applyManualSyntaxHighlighting(element, language);
        console.log('✨ Manual syntax highlighting applied');
    } catch (e) {
        console.warn('Failed to apply manual highlighting:', e);
    }
}

function applyManualSyntaxHighlighting(element, language) {
    const content = element.textContent;
    element.className = `hljs language-${language || 'javascript'}`;
    
    let html = content;
    
    // Keywords - language specific
    const keywordSets = {
        javascript: [
            'import', 'export', 'from', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 
            'class', 'extends', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 
            'true', 'false', 'null', 'undefined', 'typeof', 'instanceof'
        ],
        typescript: [
            'import', 'export', 'from', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 
            'class', 'interface', 'type', 'enum', 'extends', 'implements', 'public', 'private', 'protected', 
            'static', 'readonly', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 
            'true', 'false', 'null', 'undefined'
        ],
        python: [
            'import', 'from', 'def', 'class', 'return', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 
            'finally', 'raise', 'with', 'as', 'pass', 'break', 'continue', 'True', 'False', 'None'
        ],
        css: [
            'import', 'media', 'keyframes', 'from', 'to', 'important', 'hover', 'active', 'focus', 'visited', 
            'first-child', 'last-child'
        ]
    };
    
    const keywords = keywordSets[language] || keywordSets.javascript;
    
    keywords.forEach(keyword => {
        const regex = new RegExp('\\b' + keyword + '\\b', 'g');
        html = html.replace(regex, `<span class="hljs-keyword">${keyword}</span>`);
    });
    
    // Strings - fixed regex escaping
    html = html.replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="hljs-string">$1$2$1</span>');
    
    // Comments - language specific with proper escaping
    if (language === 'python') {
        html = html.replace(/(#.*$)/gm, '<span class="hljs-comment">$1</span>');
        html = html.replace(/("""[\s\S]*?""")/g, '<span class="hljs-comment">$1</span>');
    } else if (language === 'css') {
        html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hljs-comment">$1</span>');
    } else {
        html = html.replace(/(\/\/.*$)/gm, '<span class="hljs-comment">$1</span>');
        html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hljs-comment">$1</span>');
    }
    
    // Numbers
    html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hljs-number">$1</span>');
    
    // Function names
    html = html.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, '<span class="hljs-function">$1</span>');
    
    // Types and Classes
    html = html.replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span class="hljs-title class_">$1</span>');
    
    element.innerHTML = html;
}

/**
 * Get language-specific highlighting configuration
 * @param {string} language - Programming language
 * @returns {Object} Configuration object for the language
 */
export function getLanguageConfig(language) {
    const configs = {
        javascript: {
            name: 'JavaScript',
            extensions: ['.js', '.jsx', '.mjs'],
            highlightClass: 'language-javascript',
            commentStyle: '//',
            blockComment: ['/*', '*/']
        },
        typescript: {
            name: 'TypeScript',
            extensions: ['.ts', '.tsx'],
            highlightClass: 'language-typescript',
            commentStyle: '//',
            blockComment: ['/*', '*/']
        },
        python: {
            name: 'Python',
            extensions: ['.py', '.pyw'],
            highlightClass: 'language-python',
            commentStyle: '#',
            blockComment: ['"""', '"""']
        },
        css: {
            name: 'CSS',
            extensions: ['.css', '.scss', '.sass', '.less'],
            highlightClass: 'language-css',
            commentStyle: null,
            blockComment: ['/*', '*/']
        },
        html: {
            name: 'HTML',
            extensions: ['.html', '.htm', '.xhtml'],
            highlightClass: 'language-html',
            commentStyle: null,
            blockComment: ['<!--', '-->']
        },
        json: {
            name: 'JSON',
            extensions: ['.json'],
            highlightClass: 'language-json',
            commentStyle: null,
            blockComment: null
        }
    };
    
    return configs[language] || configs.javascript;
}

/**
 * Detect language from file extension
 * @param {string} filename - Name of the file
 * @returns {string} Detected language identifier
 */
export function detectLanguageFromFilename(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    
    const extensionMap = {
        'js': 'javascript',
        'jsx': 'javascript',
        'mjs': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'py': 'python',
        'pyw': 'python',
        'css': 'css',
        'scss': 'css',
        'sass': 'css',
        'less': 'css',
        'html': 'html',
        'htm': 'html',
        'xhtml': 'html',
        'json': 'json',
        'md': 'markdown',
        'markdown': 'markdown'
    };
    
    return extensionMap[ext] || 'text';
} 