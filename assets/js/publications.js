/**
 * GAERS Publications Database Engine
 *
 * Handles search, filter, sort, pagination, and export functionality
 * for the GAERS literature database.
 */

class PublicationsEngine {
  constructor() {
    this.allPublications = [];
    this.filteredPublications = [];
    this.currentSearchTerm = '';
    this.filters = {
      yearMin: null,
      yearMax: null,
      quartile: 'all',
      studyType: 'all',
      citationMin: null,
      journal: ''
    };
    this.paginator = null;
    this.sorter = null;
    this.metadata = null;
  }

  /**
   * Initialize the publications engine
   */
  async initialize() {
    try {
      // Show loading indicator
      this.showLoading();

      // Fetch publications data with detailed error tracking
      const response = await fetch('assets/data/publications.json');

      if (!response.ok) {
        console.error('HTTP Error Details:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse JSON with error handling
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON Parse Error:', jsonError);
        console.error('Response URL:', response.url);
        throw new Error(`Invalid JSON in publications.json: ${jsonError.message}`);
      }

      // Validate data structure
      if (!data || !data.publications) {
        console.error('Invalid data structure:', data);
        throw new Error('Publications data is missing required "publications" field');
      }

      if (!Array.isArray(data.publications)) {
        console.error('Publications is not an array:', typeof data.publications);
        throw new Error('Publications data must be an array');
      }

      this.allPublications = data.publications;
      this.filteredPublications = [...this.allPublications];
      this.metadata = data.metadata;

      console.log(`✅ Successfully loaded ${this.allPublications.length} publications`);

      // Initialize paginator
      this.paginator = new Paginator('paginationControls', this.filteredPublications, 25);
      this.paginator.onPageChange((pageData) => this.renderResults(pageData));
      window.paginator = this.paginator; // Expose for pagination controls

      // Initialize table sorter
      this.sorter = new TableSorter('publicationsTable', this.filteredPublications,
        (sortedData) => {
          this.filteredPublications = sortedData;
          this.paginator.updateData(sortedData);
        });
      this.sorter.bindHeaders();

      // Bind event handlers
      this.bindEventHandlers();

      // Initial render
      this.updateResultsCount();
      this.paginator.goToPage(1);

      // Hide loading, show content
      this.hideLoading();

      console.log(`✅ Loaded ${this.allPublications.length} publications`);

    } catch (error) {
      // Enhanced error reporting with detailed diagnostics
      console.error('=== PUBLICATION LOADING ERROR ===');
      console.error('Error Type:', error.name || 'Unknown');
      console.error('Error Message:', error.message || 'Unknown error');
      console.error('Full Error:', error);
      console.error('Stack Trace:', error.stack);

      // User-friendly error message with actionable info
      let userMessage = 'Failed to load publications database.<br><br>';

      if (error.message.includes('HTTP 404')) {
        userMessage += '<strong>Issue:</strong> Publications data file not found<br>';
        userMessage += '<strong>Expected location:</strong> assets/data/publications.json<br>';
        userMessage += '<strong>Solution:</strong> Verify the file exists at this location';
      } else if (error.message.includes('Invalid JSON')) {
        userMessage += '<strong>Issue:</strong> Publications file is corrupted or has invalid JSON format<br>';
        userMessage += `<strong>Details:</strong> ${error.message}<br>`;
        userMessage += '<strong>Solution:</strong> Check the JSON file for syntax errors';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        userMessage += '<strong>Issue:</strong> Network error or CORS policy blocking the request<br>';
        userMessage += '<strong>Solution:</strong> Use a local web server:<br>';
        userMessage += '<code>python3 -m http.server 8000</code><br>';
        userMessage += 'Then open: <code>http://localhost:8000/publications.html</code>';
      } else if (error.message.includes('missing') || error.message.includes('array')) {
        userMessage += '<strong>Issue:</strong> Data structure problem in publications.json<br>';
        userMessage += `<strong>Details:</strong> ${error.message}<br>`;
        userMessage += '<strong>Solution:</strong> Verify the JSON file has correct structure';
      } else {
        userMessage += `<strong>Error:</strong> ${error.message}<br><br>`;
        userMessage += '<strong>Please check the browser console (F12) for detailed error information.</strong>';
      }

      this.showError(userMessage);
    }
  }

  /**
   * Bind all event handlers
   */
  bindEventHandlers() {
    // Search input (debounced)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.currentSearchTerm = e.target.value;
          this.applyFilters();
        }, 300);
      });
    }

    // Clear search
    document.getElementById('clearSearch')?.addEventListener('click', () => {
      document.getElementById('searchInput').value = '';
      this.currentSearchTerm = '';
      this.applyFilters();
    });

    // Filter inputs
    document.getElementById('yearMin')?.addEventListener('change', (e) => {
      this.filters.yearMin = e.target.value ? parseInt(e.target.value) : null;
      this.applyFilters();
    });

    document.getElementById('yearMax')?.addEventListener('change', (e) => {
      this.filters.yearMax = e.target.value ? parseInt(e.target.value) : null;
      this.applyFilters();
    });

    document.getElementById('quartileFilter')?.addEventListener('change', (e) => {
      this.filters.quartile = e.target.value;
      this.applyFilters();
    });

    document.getElementById('studyTypeFilter')?.addEventListener('change', (e) => {
      this.filters.studyType = e.target.value;
      this.applyFilters();
    });

    document.getElementById('citationMin')?.addEventListener('change', (e) => {
      this.filters.citationMin = e.target.value ? parseInt(e.target.value) : null;
      this.applyFilters();
    });

    // Journal filter (debounced)
    const journalInput = document.getElementById('journalFilter');
    let journalTimeout;
    journalInput?.addEventListener('input', (e) => {
      clearTimeout(journalTimeout);
      journalTimeout = setTimeout(() => {
        this.filters.journal = e.target.value;
        this.applyFilters();
      }, 300);
    });

    // Reset filters
    document.getElementById('resetFilters')?.addEventListener('click', () => {
      this.resetFilters();
    });

    // Export buttons
    document.getElementById('exportCSV')?.addEventListener('click', () => {
      this.exportToCSV();
    });

    document.getElementById('exportBibTeX')?.addEventListener('click', () => {
      this.exportToBibTeX();
    });

    // Filter toggle
    document.getElementById('toggleFilters')?.addEventListener('click', () => {
      const filterBody = document.getElementById('filterBody');
      const toggleIcon = document.getElementById('filterToggleIcon');
      filterBody.classList.toggle('hidden');
      toggleIcon.textContent = filterBody.classList.contains('hidden') ? '▼' : '▲';
    });

    // Modal close handlers
    document.getElementById('closeModal')?.addEventListener('click', () => {
      this.closePublicationModal();
    });

    document.getElementById('publicationModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'publicationModal') {
        this.closePublicationModal();
      }
    });

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closePublicationModal();
      }
    });
  }

  /**
   * Apply all filters and update display
   */
  applyFilters() {
    let filtered = [...this.allPublications];

    // Text search (case-insensitive, multiple fields)
    if (this.currentSearchTerm) {
      const term = this.currentSearchTerm.toLowerCase();
      filtered = filtered.filter(pub => {
        return (pub.title && pub.title.toLowerCase().includes(term)) ||
               (pub.authors && pub.authors.toLowerCase().includes(term)) ||
               (pub.abstract && pub.abstract.toLowerCase().includes(term)) ||
               (pub.journal && pub.journal.toLowerCase().includes(term)) ||
               (pub.takeaway && pub.takeaway.toLowerCase().includes(term));
      });
    }

    // Year range filter
    if (this.filters.yearMin !== null) {
      filtered = filtered.filter(pub => pub.year >= this.filters.yearMin);
    }
    if (this.filters.yearMax !== null) {
      filtered = filtered.filter(pub => pub.year <= this.filters.yearMax);
    }

    // Quartile filter
    if (this.filters.quartile !== 'all') {
      if (this.filters.quartile === 'unranked') {
        filtered = filtered.filter(pub => !pub.sjr_quartile || pub.sjr_quartile === '');
      } else {
        filtered = filtered.filter(pub => pub.sjr_quartile === this.filters.quartile);
      }
    }

    // Study type filter
    if (this.filters.studyType !== 'all') {
      if (this.filters.studyType === 'other') {
        const knownTypes = ['non-rct experimental', 'systematic review', 'non-rct observational study'];
        filtered = filtered.filter(pub =>
          !pub.study_type || !knownTypes.includes(pub.study_type.toLowerCase())
        );
      } else {
        filtered = filtered.filter(pub =>
          pub.study_type && pub.study_type.toLowerCase() === this.filters.studyType.toLowerCase()
        );
      }
    }

    // Citation minimum filter
    if (this.filters.citationMin !== null) {
      filtered = filtered.filter(pub => pub.citations >= this.filters.citationMin);
    }

    // Journal filter
    if (this.filters.journal) {
      const journalTerm = this.filters.journal.toLowerCase();
      filtered = filtered.filter(pub =>
        pub.journal && pub.journal.toLowerCase().includes(journalTerm)
      );
    }

    // Update filtered publications
    this.filteredPublications = filtered;

    // Update results count
    this.updateResultsCount();

    // Reset to page 1 and update paginator
    this.paginator.updateData(filtered);
  }

  /**
   * Render results table
   */
  renderResults(pageData) {
    const tbody = document.querySelector('#publicationsTable tbody');
    if (!tbody) return;

    if (pageData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center" style="padding: 3rem;">
            <p style="font-size: 1.1rem; color: var(--text-secondary);">
              No publications found matching your criteria.
            </p>
            <button class="btn btn-secondary mt-2" onclick="publicationsEngine.resetFilters()">
              Reset Filters
            </button>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = pageData.map(pub => `
      <tr>
        <td class="pub-title" data-label="Title">
          <strong>${this.highlightSearchTerm(pub.title)}</strong>
          ${pub.takeaway ? `<br><small class="pub-takeaway">${truncateText(pub.takeaway, 100)}</small>` : ''}
        </td>
        <td class="pub-authors" data-label="Authors">${truncateAuthors(pub.authors, 3)}</td>
        <td data-label="Year">${pub.year || 'N/A'}</td>
        <td data-label="Journal">${truncateText(pub.journal, 30)}</td>
        <td data-label="Q">${formatQuartile(pub.sjr_quartile)}</td>
        <td data-label="Citations">${pub.citations || 0}</td>
        <td data-label="Type">${formatStudyType(pub.study_type)}</td>
        <td data-label="Actions">
          <button class="btn btn-sm btn-secondary" onclick="publicationsEngine.showPublicationDetails(${pub.id})">
            View
          </button>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Highlight search term in text
   */
  highlightSearchTerm(text) {
    if (!this.currentSearchTerm || !text) return text;

    const term = this.currentSearchTerm;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Show publication details modal
   */
  showPublicationDetails(id) {
    const pub = this.allPublications.find(p => p.id === id);
    if (!pub) return;

    const modal = document.getElementById('publicationModal');
    const content = document.getElementById('modalContent');

    // Build DOI link
    const doiLink = pub.doi ? `https://doi.org/${pub.doi}` : null;

    content.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title">${pub.title}</h2>
        <button class="modal-close" id="closeModal">&times;</button>
      </div>

      <div class="modal-meta">
        <span><strong>Authors:</strong> ${pub.authors || 'Not specified'}</span>
        <span><strong>Year:</strong> ${pub.year || 'N/A'}</span>
        <span><strong>Journal:</strong> ${pub.journal || 'Not specified'}</span>
        <span>${formatQuartile(pub.sjr_quartile)}</span>
        <span><strong>Citations:</strong> ${pub.citations || 0}</span>
        <span>${formatStudyType(pub.study_type)}</span>
      </div>

      ${pub.takeaway ? `
        <div class="modal-section">
          <h3>Key Takeaway</h3>
          <div class="modal-takeaway">${pub.takeaway}</div>
        </div>
      ` : ''}

      ${pub.abstract ? `
        <div class="modal-section">
          <h3>Abstract</h3>
          <div class="modal-abstract">${pub.abstract}</div>
        </div>
      ` : ''}

      <div class="modal-section">
        <h3>Links & Citation</h3>
        <div class="modal-links">
          ${doiLink ? `<a href="${doiLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">View Paper (DOI)</a>` : ''}
          ${pub.consensus_link ? `<a href="${pub.consensus_link}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Consensus.app</a>` : ''}
          <button class="btn btn-secondary" onclick="publicationsEngine.copyBibTeX(${pub.id})">Copy BibTeX</button>
        </div>
      </div>
    `;

    modal.classList.add('active');
    modal.style.display = 'flex';

    // Re-bind close button
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        this.closePublicationModal();
      });
    }
  }

  /**
   * Close publication modal
   */
  closePublicationModal() {
    const modal = document.getElementById('publicationModal');
    modal.classList.remove('active');
    modal.style.display = 'none';
  }

  /**
   * Copy BibTeX to clipboard
   */
  async copyBibTeX(id) {
    const pub = this.allPublications.find(p => p.id === id);
    if (!pub) return;

    const bibtex = generateBibTeXEntry(pub);

    try {
      await navigator.clipboard.writeText(bibtex);
      alert('BibTeX citation copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback: show in alert
      prompt('Copy this BibTeX citation:', bibtex);
    }
  }

  /**
   * Export filtered results to CSV
   */
  exportToCSV() {
    const headers = [
      'Title', 'Authors', 'Year', 'Journal', 'Journal SJR Quartile',
      'Citations', 'Study Type', 'Takeaway', 'Abstract', 'DOI', 'Consensus Link'
    ];

    const rows = this.filteredPublications.map(pub => [
      pub.title,
      pub.authors,
      pub.year,
      pub.journal,
      pub.sjr_quartile,
      pub.citations,
      pub.study_type,
      pub.takeaway,
      pub.abstract,
      pub.doi,
      pub.consensus_link
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const str = String(cell || '');
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      }).join(','))
    ].join('\n');

    const date = new Date().toISOString().split('T')[0];
    const filename = `gaers-publications-${date}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    console.log(`✅ Exported ${this.filteredPublications.length} publications to ${filename}`);
  }

  /**
   * Export filtered results to BibTeX
   */
  exportToBibTeX() {
    const bibtexEntries = this.filteredPublications.map(pub =>
      generateBibTeXEntry(pub)
    ).join('\n\n');

    const date = new Date().toISOString().split('T')[0];
    const filename = `gaers-publications-${date}.bib`;

    const blob = new Blob([bibtexEntries], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    console.log(`✅ Exported ${this.filteredPublications.length} publications to ${filename}`);
  }

  /**
   * Reset all filters
   */
  resetFilters() {
    // Reset filter state
    this.currentSearchTerm = '';
    this.filters = {
      yearMin: null,
      yearMax: null,
      quartile: 'all',
      studyType: 'all',
      citationMin: null,
      journal: ''
    };

    // Reset UI inputs
    document.getElementById('searchInput').value = '';
    document.getElementById('yearMin').value = '';
    document.getElementById('yearMax').value = '';
    document.getElementById('quartileFilter').value = 'all';
    document.getElementById('studyTypeFilter').value = 'all';
    document.getElementById('citationMin').value = '';
    document.getElementById('journalFilter').value = '';

    // Reapply filters (shows all)
    this.applyFilters();
  }

  /**
   * Update results count display
   */
  updateResultsCount() {
    const countEl = document.getElementById('resultsCount');
    if (!countEl) return;

    const filtered = this.filteredPublications.length;
    const total = this.allPublications.length;

    if (filtered === total) {
      countEl.textContent = `Showing all ${total} publications`;
    } else {
      countEl.textContent = `Showing ${filtered} of ${total} publications`;
    }
  }

  /**
   * Show loading indicator
   */
  showLoading() {
    // The HTML already has a loading state in the table tbody
    // No need to replace the entire container
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
      resultsCount.textContent = 'Loading publications...';
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    // Loading state will be replaced by renderResults
    // Nothing to do here as the table content will be updated
  }

  /**
   * Show error message
   */
  showError(message) {
    const main = document.querySelector('main .container');
    if (main) {
      main.innerHTML = `
        <div class="alert alert-danger">
          <h3>⚠️ Error</h3>
          <p>${message}</p>
        </div>
      `;
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.publicationsEngine = new PublicationsEngine();
  window.publicationsEngine.initialize();
});
