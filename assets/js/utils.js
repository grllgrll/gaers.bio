/**
 * GAERS Research Website - Utility Functions
 * Reusable helper functions for data manipulation, export, and UI controls
 */

/**
 * Export data to CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the CSV file (without extension)
 * @param {Array} columns - Optional array of column definitions [{key, header}]
 */
function exportToCSV(data, filename, columns = null) {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  // If columns not specified, use all keys from first object
  let cols = columns;
  if (!cols) {
    const keys = Object.keys(data[0]);
    cols = keys.map(key => ({ key: key, header: key }));
  }

  // Build CSV header
  const headers = cols.map(col => col.header).join(',');

  // Build CSV rows
  const rows = data.map(row => {
    return cols.map(col => {
      const value = row[col.key];
      // Handle values that might contain commas or quotes
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  // Combine header and rows
  const csv = [headers, ...rows].join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Table sorting manager
 * Handles sorting of table columns with visual indicators
 */
class TableSorter {
  constructor(tableId, data, renderCallback) {
    this.tableId = tableId;
    this.data = data;
    this.renderCallback = renderCallback;
    this.sortColumn = null;
    this.sortDirection = 'asc'; // 'asc' or 'desc'
  }

  /**
   * Sort data by column
   * @param {string} column - Column key to sort by
   * @param {string} type - Data type: 'string', 'number', or 'auto'
   */
  sort(column, type = 'auto') {
    // Toggle direction if same column, otherwise reset to ascending
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // Determine data type if auto
    if (type === 'auto' && this.data.length > 0) {
      const sampleValue = this.data[0][column];
      type = typeof sampleValue === 'number' ? 'number' : 'string';
    }

    // Sort the data
    this.data.sort((a, b) => {
      let valueA = a[column];
      let valueB = b[column];

      // Handle null/undefined
      if (valueA === null || valueA === undefined) return 1;
      if (valueB === null || valueB === undefined) return -1;

      // Type-specific comparison
      if (type === 'number') {
        valueA = parseFloat(valueA);
        valueB = parseFloat(valueB);
        return this.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      } else {
        valueA = String(valueA).toLowerCase();
        valueB = String(valueB).toLowerCase();
        if (this.sortDirection === 'asc') {
          return valueA.localeCompare(valueB);
        } else {
          return valueB.localeCompare(valueA);
        }
      }
    });

    // Update UI
    this.updateSortIndicators();

    // Re-render table
    if (this.renderCallback) {
      this.renderCallback(this.data);
    }

    return this.data;
  }

  /**
   * Update visual sort indicators in table headers
   */
  updateSortIndicators() {
    const table = document.getElementById(this.tableId);
    if (!table) return;

    const headers = table.querySelectorAll('th[data-sortable]');
    headers.forEach(header => {
      const column = header.getAttribute('data-column');

      // Remove existing indicators
      header.classList.remove('sort-asc', 'sort-desc');

      // Add current indicator
      if (column === this.sortColumn) {
        header.classList.add(`sort-${this.sortDirection}`);
      }
    });
  }

  /**
   * Bind click handlers to sortable headers
   */
  bindHeaders() {
    const table = document.getElementById(this.tableId);
    if (!table) return;

    const headers = table.querySelectorAll('th[data-sortable]');
    headers.forEach(header => {
      header.style.cursor = 'pointer';
      header.addEventListener('click', () => {
        const column = header.getAttribute('data-column');
        const type = header.getAttribute('data-type') || 'auto';
        this.sort(column, type);
      });
    });
  }
}

/**
 * Pagination manager
 * Handles pagination for large datasets
 */
class Paginator {
  constructor(containerId, data, itemsPerPage = 25) {
    this.containerId = containerId;
    this.allData = data;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
    this.renderCallback = null;
  }

  /**
   * Get total number of pages
   */
  getTotalPages() {
    return Math.ceil(this.allData.length / this.itemsPerPage);
  }

  /**
   * Get data for current page
   */
  getCurrentPageData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.allData.slice(startIndex, endIndex);
  }

  /**
   * Go to specific page
   * @param {number} page - Page number (1-indexed)
   */
  goToPage(page) {
    const totalPages = this.getTotalPages();
    if (page < 1 || page > totalPages) {
      console.warn(`Invalid page number: ${page}`);
      return;
    }

    this.currentPage = page;
    this.updateControls();

    if (this.renderCallback) {
      this.renderCallback(this.getCurrentPageData());
    }
  }

  /**
   * Go to next page
   */
  nextPage() {
    if (this.currentPage < this.getTotalPages()) {
      this.goToPage(this.currentPage + 1);
    }
  }

  /**
   * Go to previous page
   */
  prevPage() {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  /**
   * Update data and reset to page 1
   * @param {Array} data - New dataset
   */
  updateData(data) {
    this.allData = data;
    this.currentPage = 1;
    this.updateControls();

    if (this.renderCallback) {
      this.renderCallback(this.getCurrentPageData());
    }
  }

  /**
   * Update pagination controls UI
   */
  updateControls() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const totalPages = this.getTotalPages();
    const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endItem = Math.min(this.currentPage * this.itemsPerPage, this.allData.length);

    container.innerHTML = `
      <div class="pagination-controls">
        <div class="pagination-info">
          Showing ${startItem}-${endItem} of ${this.allData.length} results
        </div>
        <div class="pagination-buttons">
          <button
            class="btn btn-secondary btn-sm"
            onclick="window.paginator.prevPage()"
            ${this.currentPage === 1 ? 'disabled' : ''}>
            ← Previous
          </button>
          <span class="pagination-page-info">
            Page ${this.currentPage} of ${totalPages}
          </span>
          <button
            class="btn btn-secondary btn-sm"
            onclick="window.paginator.nextPage()"
            ${this.currentPage === totalPages ? 'disabled' : ''}>
            Next →
          </button>
        </div>
        <div class="pagination-per-page">
          <label for="itemsPerPage">Results per page:</label>
          <select id="itemsPerPage" onchange="window.paginator.changeItemsPerPage(this.value)">
            <option value="25" ${this.itemsPerPage === 25 ? 'selected' : ''}>25</option>
            <option value="50" ${this.itemsPerPage === 50 ? 'selected' : ''}>50</option>
            <option value="100" ${this.itemsPerPage === 100 ? 'selected' : ''}>100</option>
            <option value="250" ${this.itemsPerPage === 250 ? 'selected' : ''}>250</option>
          </select>
        </div>
      </div>
    `;
  }

  /**
   * Change items per page
   * @param {number} itemsPerPage - New items per page value
   */
  changeItemsPerPage(itemsPerPage) {
    this.itemsPerPage = parseInt(itemsPerPage);
    this.currentPage = 1;
    this.updateControls();

    if (this.renderCallback) {
      this.renderCallback(this.getCurrentPageData());
    }
  }

  /**
   * Set render callback function
   * @param {Function} callback - Function to call when page changes
   */
  onPageChange(callback) {
    this.renderCallback = callback;
  }
}

/**
 * Format number with specified decimal places
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return Number(value).toFixed(decimals);
}

/**
 * Format scientific notation for p-values
 * @param {number} value - P-value to format
 * @returns {string} Formatted p-value
 */
function formatPValue(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  if (value < 0.001) {
    return value.toExponential(2);
  }
  return value.toFixed(4);
}

/**
 * Debounce function to limit rate of function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Highlight search terms in text
 * @param {string} text - Text to highlight in
 * @param {string} searchTerm - Term to highlight
 * @returns {string} HTML with highlighted terms
 */
function highlightText(text, searchTerm) {
  if (!searchTerm || !text) return text;

  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Get regulation badge HTML
 * @param {string} regulation - 'up', 'down', or other value
 * @returns {string} Badge HTML
 */
function getRegulationBadge(regulation) {
  if (!regulation) return '<span class="badge">N/A</span>';

  const badgeClass = regulation === 'up' ? 'badge-up' :
                     regulation === 'down' ? 'badge-down' : 'badge';

  return `<span class="badge ${badgeClass}">${regulation}</span>`;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => {
        showNotification('Copied to clipboard!', 'success');
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        showNotification('Failed to copy to clipboard', 'error');
      });
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showNotification('Copied to clipboard!', 'success');
    } catch (err) {
      console.error('Failed to copy:', err);
      showNotification('Failed to copy to clipboard', 'error');
    }
    document.body.removeChild(textarea);
  }
}

/**
 * Show notification message
 * @param {string} message - Message to display
 * @param {string} type - Notification type: 'success', 'error', 'info'
 */
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Style the notification
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '1rem 1.5rem',
    borderRadius: '4px',
    backgroundColor: type === 'success' ? '#198754' :
                     type === 'error' ? '#dc3545' : '#0066cc',
    color: 'white',
    fontWeight: '500',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    zIndex: '10000',
    animation: 'slideIn 0.3s ease-out'
  });

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Add CSS animations for notifications
if (!document.getElementById('utils-styles')) {
  const style = document.createElement('style');
  style.id = 'utils-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    th[data-sortable] {
      cursor: pointer;
      user-select: none;
      position: relative;
      padding-right: 24px !important;
    }

    th[data-sortable]:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }

    th[data-sortable]::after {
      content: '⇅';
      position: absolute;
      right: 8px;
      opacity: 0.3;
    }

    th.sort-asc::after {
      content: '↑';
      opacity: 1;
    }

    th.sort-desc::after {
      content: '↓';
      opacity: 1;
    }

    mark {
      background-color: #ffc107;
      padding: 0 2px;
      border-radius: 2px;
    }

    .pagination-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 4px;
      margin-top: 1rem;
    }

    .pagination-info {
      font-size: 0.9rem;
      color: #495057;
    }

    .pagination-buttons {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .pagination-page-info {
      font-weight: 500;
      color: #212529;
    }

    .pagination-per-page {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .pagination-per-page select {
      padding: 0.25rem 0.5rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .pagination-controls {
        flex-direction: column;
        gap: 0.75rem;
      }

      .pagination-buttons {
        width: 100%;
        justify-content: space-between;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Format journal quartile as colored badge
 * @param {string} quartile - Quartile value ('1', '2', '3', '4', or empty)
 * @returns {string} Badge HTML
 */
function formatQuartile(quartile) {
  if (!quartile || quartile === '') {
    return '<span class="badge badge-quartile-na">N/A</span>';
  }

  const quartileMap = {
    '1': { label: 'Q1', class: 'badge-quartile-q1' },
    '2': { label: 'Q2', class: 'badge-quartile-q2' },
    '3': { label: 'Q3', class: 'badge-quartile-q3' },
    '4': { label: 'Q4', class: 'badge-quartile-q4' }
  };

  const q = quartileMap[quartile];
  if (!q) {
    return '<span class="badge badge-quartile-na">N/A</span>';
  }

  return `<span class="badge ${q.class}">${q.label}</span>`;
}

/**
 * Format study type as badge
 * @param {string} studyType - Study type string
 * @returns {string} Badge HTML
 */
function formatStudyType(studyType) {
  if (!studyType || studyType === '') {
    return '<span class="badge badge-info">Not specified</span>';
  }

  const typeMap = {
    'non-rct experimental': { label: 'Experimental', class: 'badge-primary' },
    'systematic review': { label: 'Review', class: 'badge-success' },
    'non-rct observational study': { label: 'Observational', class: 'badge-warning' }
  };

  const normalized = studyType.toLowerCase();
  const type = typeMap[normalized];

  if (type) {
    return `<span class="badge ${type.class}">${type.label}</span>`;
  }

  // For other types, truncate and use info badge
  const truncated = studyType.length > 15 ? studyType.substring(0, 15) + '...' : studyType;
  return `<span class="badge badge-info">${truncated}</span>`;
}

/**
 * Truncate author list to show first N authors + "et al."
 * @param {string} authors - Comma-separated author list
 * @param {number} maxCount - Maximum number of authors to show
 * @returns {string} Truncated author list
 */
function truncateAuthors(authors, maxCount = 3) {
  if (!authors) return 'Not specified';

  const authorList = authors.split(',').map(a => a.trim());

  if (authorList.length <= maxCount) {
    return authors;
  }

  const displayed = authorList.slice(0, maxCount).join(', ');
  return `${displayed}, et al.`;
}

/**
 * Truncate text to maximum length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength) + '...';
}

/**
 * Generate BibTeX citation entry for a publication
 * @param {Object} publication - Publication object
 * @returns {string} BibTeX entry
 */
function generateBibTeXEntry(publication) {
  // Extract first author's last name
  let firstAuthorLastName = 'Unknown';
  if (publication.authors) {
    const authors = publication.authors.split(',');
    if (authors.length > 0) {
      const firstAuthor = authors[0].trim();
      // Get last word (last name)
      const parts = firstAuthor.split(' ');
      firstAuthorLastName = parts[parts.length - 1].replace(/[^a-zA-Z]/g, '');
    }
  }

  // Extract first significant word from title (for citation key)
  let titleWord = '';
  if (publication.title) {
    const words = publication.title.split(' ').filter(w => w.length > 4);
    if (words.length > 0) {
      titleWord = words[0].replace(/[^a-zA-Z]/g, '');
    }
  }

  // Generate unique citation key
  const year = publication.year || 'n.d.';
  const citationKey = `${firstAuthorLastName}${year}${titleWord}`.replace(/\s+/g, '');

  // Build BibTeX entry
  let bibtex = `@article{${citationKey},\n`;
  bibtex += `  title = {${publication.title || 'Untitled'}},\n`;

  if (publication.authors) {
    bibtex += `  author = {${publication.authors}},\n`;
  }

  if (publication.journal) {
    bibtex += `  journal = {${publication.journal}},\n`;
  }

  if (publication.year) {
    bibtex += `  year = {${publication.year}},\n`;
  }

  if (publication.doi) {
    bibtex += `  doi = {${publication.doi}},\n`;
  }

  if (publication.abstract) {
    // Clean abstract for BibTeX (escape special characters)
    const cleanAbstract = publication.abstract.replace(/[{}]/g, '');
    bibtex += `  abstract = {${cleanAbstract}},\n`;
  }

  // Remove trailing comma and close
  bibtex = bibtex.replace(/,\n$/, '\n');
  bibtex += `}\n`;

  return bibtex;
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    exportToCSV,
    TableSorter,
    Paginator,
    formatNumber,
    formatPValue,
    debounce,
    highlightText,
    getRegulationBadge,
    copyToClipboard,
    showNotification,
    formatQuartile,
    formatStudyType,
    truncateAuthors,
    truncateText,
    generateBibTeXEntry
  };
}
