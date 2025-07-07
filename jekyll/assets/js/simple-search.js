/**
 * Simple Client-Side Search
 * Works automatically without rebuilds - perfect for development!
 */

class SimpleSearch {
  constructor(options = {}) {
    this.options = {
      searchInput: options.searchInput || '#search-input',
      searchResults: options.searchResults || '#search-results',
      searchIndex: options.searchIndex || '/search-index.json',
      minQueryLength: options.minQueryLength || 2,
      maxResults: options.maxResults || 10,
      ...options
    };

    this.searchData = null;
    this.init();
  }

  init() {
    this.loadSearchIndex();
    this.bindEvents();
  }

  async loadSearchIndex() {
    try {
      const response = await fetch(this.options.searchIndex);
      this.searchData = await response.json();
      console.log(`🔍 Search index loaded: ${this.searchData.length} documents`);
    } catch (error) {
      console.error('Failed to load search index:', error);
    }
  }

  bindEvents() {
    const searchInput = document.querySelector(this.options.searchInput);
    const searchResults = document.querySelector(this.options.searchResults);

    if (!searchInput || !searchResults) {
      console.warn('Search elements not found');
      return;
    }

    // Search as user types (debounced)
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.performSearch(e.target.value.trim());
      }, 300);
    });

    // Handle URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || urlParams.get('query');
    if (query) {
      searchInput.value = query;
      this.performSearch(query);
    }
  }

  performSearch(query) {
    const searchResults = document.querySelector(this.options.searchResults);
    
    if (!query || query.length < this.options.minQueryLength) {
      searchResults.innerHTML = '';
      searchResults.style.display = 'none';
      return;
    }

    if (!this.searchData) {
      searchResults.innerHTML = '<p>Search index loading...</p>';
      searchResults.style.display = 'block';
      return;
    }

    const results = this.search(query);
    this.displayResults(results, query);
  }

  search(query) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    
    return this.searchData
      .map(doc => {
        let score = 0;
        const titleLower = (doc.title || '').toLowerCase();
        const contentLower = (doc.content || '').toLowerCase();
        const categoryLower = (doc.category || '').toLowerCase();
        const tagsLower = (doc.tags || []).join(' ').toLowerCase();

        // Exact title match gets highest score
        if (titleLower.includes(queryLower)) {
          score += 100;
        }

        // Title word matches
        queryWords.forEach(word => {
          if (titleLower.includes(word)) {
            score += 50;
          }
        });

        // Category matches
        if (categoryLower.includes(queryLower)) {
          score += 30;
        }

        // Tag matches
        queryWords.forEach(word => {
          if (tagsLower.includes(word)) {
            score += 20;
          }
        });

        // Content matches
        queryWords.forEach(word => {
          const regex = new RegExp(word, 'gi');
          const matches = (contentLower.match(regex) || []).length;
          score += matches * 5;
        });

        return score > 0 ? { ...doc, score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.options.maxResults);
  }

  displayResults(results, query) {
    const searchResults = document.querySelector(this.options.searchResults);
    
    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="search-no-results">
          <p>No results found for "${query}"</p>
        </div>
      `;
      searchResults.style.display = 'block';
      return;
    }

    const resultsHtml = results.map(result => `
      <div class="search-result">
        <h3><a href="${result.url}">${this.highlightQuery(result.title, query)}</a></h3>
        ${result.category ? `<span class="search-category">${result.category}</span>` : ''}
        ${result.date ? `<span class="search-date">${result.date}</span>` : ''}
        <p>${this.highlightQuery(result.excerpt, query)}</p>
        ${result.tags && result.tags.length > 0 ? 
          `<div class="search-tags">${result.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : 
          ''
        }
      </div>
    `).join('');

    searchResults.innerHTML = `
      <div class="search-results-header">
        <p>Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"</p>
      </div>
      ${resultsHtml}
    `;
    searchResults.style.display = 'block';
  }

  highlightQuery(text, query) {
    if (!text || !query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if search elements exist
  if (document.querySelector('#search-input') && document.querySelector('#search-results')) {
    new SimpleSearch();
  }
});

// Export for manual initialization
window.SimpleSearch = SimpleSearch; 