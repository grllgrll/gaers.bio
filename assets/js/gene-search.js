/**
 * GAERS Research Website - Gene Search Engine
 * Interactive search and filtering across 3,611 genes from all datasets
 */

class GeneSearchEngine {
  constructor() {
    this.allGenes = [];
    this.filteredGenes = [];
    this.currentSearchTerm = '';
    this.filters = {
      regulation: 'all', // 'all', 'up', 'down'
      datasets: {
        bulk_rnaseq: true,
        spatial_p15: true,
        spatial_p30: true,
        seizure_gene: true
      },
      pvalueThreshold: 1.0, // Max adjusted p-value (1.0 = no filter)
      log2fcMin: null, // Min absolute log2 fold change
      log2fcMax: null  // Max absolute log2 fold change
    };
    this.paginator = null;
    this.sorter = null;
    this.isLoading = false;
  }

  /**
   * Normalize gene data structure from JSON format to expected format
   * Handles field name mismatches between data file and code expectations
   */
  normalizeGeneData(gene) {
    return {
      // Primary fields - use fallback for backward compatibility
      symbol: gene.primary_symbol || gene.symbol || 'Unknown',
      name: gene.name || '',
      ensembl_id: gene.ensembl_id || '',

      // Bulk RNA-seq data transformation
      bulk_rnaseq: gene.datasets?.rnaseq ? {
        log2fc: gene.datasets.rnaseq.log2fc,
        adj_p_val: gene.datasets.rnaseq.padj,  // Field name mapping: padj → adj_p_val
        regulation: gene.datasets.rnaseq.regulation,
        baseMean: gene.datasets.rnaseq.baseMean,
        significant: gene.datasets.rnaseq.significant
      } : null,

      // Spatial P15 data transformation
      spatial_p15: gene.datasets?.spatial_p15 ? {
        log2fc: gene.datasets.spatial_p15.logFC,  // Case mapping: logFC → log2fc
        adj_p_val: gene.datasets.spatial_p15.adj_p_val,
        regulation: gene.datasets.spatial_p15.regulation,
        aveExpr: gene.datasets.spatial_p15.aveExpr,
        significant: gene.datasets.spatial_p15.significant
      } : null,

      // Spatial P30 data transformation
      spatial_p30: gene.datasets?.spatial_p30 ? {
        log2fc: gene.datasets.spatial_p30.logFC,  // Case mapping: logFC → log2fc
        adj_p_val: gene.datasets.spatial_p30.adj_p_val,
        regulation: gene.datasets.spatial_p30.regulation,
        aveExpr: gene.datasets.spatial_p30.aveExpr,
        significant: gene.datasets.spatial_p30.significant
      } : null,

      // Seizure gene flag
      seizure_gene: gene.seizure_gene || false
    };
  }

  /**
   * Initialize the search engine
   * Load gene database and set up UI
   */
  async initialize() {
    this.isLoading = true;
    this.updateLoadingStatus('Loading gene database...');

    try {
      // Load gene master index
      const response = await fetch('assets/data/gene-master-index.json');
      const data = await response.json();
      this.allGenes = data.genes.map(gene => this.normalizeGeneData(gene));
      this.filteredGenes = [...this.allGenes];

      console.log(`✅ Loaded ${this.allGenes.length} genes`);
      console.log(`📊 Dataset distribution:`, {
        bulk_rnaseq: this.allGenes.filter(g => g.bulk_rnaseq).length,
        spatial_p15: this.allGenes.filter(g => g.spatial_p15).length,
        spatial_p30: this.allGenes.filter(g => g.spatial_p30).length,
        seizure_genes: this.allGenes.filter(g => g.seizure_gene).length
      });

      // Initialize pagination
      this.paginator = new Paginator('paginationContainer', this.filteredGenes, 25);
      this.paginator.onPageChange((pageData) => {
        this.renderResults(pageData);
      });

      // Initialize table sorter
      this.sorter = new TableSorter('geneTable', this.filteredGenes, (sortedData) => {
        this.paginator.updateData(sortedData);
      });

      // Bind UI event handlers
      this.bindEventHandlers();

      // Initial render
      this.updateResultsCount();
      this.paginator.updateControls();
      this.renderResults(this.paginator.getCurrentPageData());

      this.isLoading = false;
      this.hideLoadingStatus();

    } catch (error) {
      console.error('Error loading gene database:', error);
      this.updateLoadingStatus('Error loading gene database. Please refresh the page.', 'error');
      this.isLoading = false;
    }
  }

  /**
   * Bind event handlers to UI controls
   */
  bindEventHandlers() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.currentSearchTerm = e.target.value.trim();
        this.applyFilters();
      }, 300));
    }

    // Clear search button
    const clearSearchBtn = document.getElementById('clearSearch');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        this.currentSearchTerm = '';
        this.applyFilters();
      });
    }

    // Regulation filter
    const regulationFilter = document.getElementById('regulationFilter');
    if (regulationFilter) {
      regulationFilter.addEventListener('change', (e) => {
        this.filters.regulation = e.target.value;
        this.applyFilters();
      });
    }

    // Dataset checkboxes
    ['bulk_rnaseq', 'spatial_p15', 'spatial_p30', 'seizure_gene'].forEach(dataset => {
      const checkbox = document.getElementById(`filter_${dataset}`);
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          this.filters.datasets[dataset] = e.target.checked;
          this.applyFilters();
        });
      }
    });

    // P-value threshold
    const pvalueInput = document.getElementById('pvalueThreshold');
    if (pvalueInput) {
      pvalueInput.addEventListener('input', debounce((e) => {
        const value = parseFloat(e.target.value);
        this.filters.pvalueThreshold = isNaN(value) ? 1.0 : value;
        this.applyFilters();
      }, 500));
    }

    // Log2FC min/max
    const log2fcMin = document.getElementById('log2fcMin');
    const log2fcMax = document.getElementById('log2fcMax');
    if (log2fcMin) {
      log2fcMin.addEventListener('input', debounce((e) => {
        const value = parseFloat(e.target.value);
        this.filters.log2fcMin = isNaN(value) ? null : value;
        this.applyFilters();
      }, 500));
    }
    if (log2fcMax) {
      log2fcMax.addEventListener('input', debounce((e) => {
        const value = parseFloat(e.target.value);
        this.filters.log2fcMax = isNaN(value) ? null : value;
        this.applyFilters();
      }, 500));
    }

    // Reset filters button
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetFilters();
      });
    }

    // Export results button
    const exportBtn = document.getElementById('exportResults');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportResults();
      });
    }

    // Bind sortable table headers
    this.sorter.bindHeaders();

    // Make paginator globally accessible for inline onclick handlers
    window.paginator = this.paginator;
  }

  /**
   * Apply all active filters and update results
   */
  applyFilters() {
    let results = [...this.allGenes];

    // 1. Search term filter (search in symbol, name, ensembl_id)
    if (this.currentSearchTerm) {
      const searchLower = this.currentSearchTerm.toLowerCase();
      results = results.filter(gene => {
        return (
          (gene.symbol && gene.symbol.toLowerCase().includes(searchLower)) ||
          (gene.name && gene.name.toLowerCase().includes(searchLower)) ||
          (gene.ensembl_id && gene.ensembl_id.toLowerCase().includes(searchLower))
        );
      });
    }

    // 2. Regulation filter
    if (this.filters.regulation !== 'all') {
      results = results.filter(gene => {
        // Check if gene has the specified regulation in any active dataset
        const hasRegulation =
          (this.filters.datasets.bulk_rnaseq && gene.bulk_rnaseq?.regulation === this.filters.regulation) ||
          (this.filters.datasets.spatial_p15 && gene.spatial_p15?.regulation === this.filters.regulation) ||
          (this.filters.datasets.spatial_p30 && gene.spatial_p30?.regulation === this.filters.regulation);
        return hasRegulation;
      });
    }

    // 3. Dataset filter
    const activeDatasets = Object.keys(this.filters.datasets).filter(ds => this.filters.datasets[ds]);
    if (activeDatasets.length > 0 && activeDatasets.length < 4) {
      results = results.filter(gene => {
        // Gene must be present in at least one active dataset
        return activeDatasets.some(dataset => {
          if (dataset === 'seizure_gene') {
            return gene.seizure_gene === true;
          }
          return gene[dataset] !== null && gene[dataset] !== undefined;
        });
      });
    }

    // 4. P-value threshold filter
    if (this.filters.pvalueThreshold < 1.0) {
      results = results.filter(gene => {
        const hasSignificantPvalue =
          (this.filters.datasets.bulk_rnaseq && gene.bulk_rnaseq?.adj_p_val <= this.filters.pvalueThreshold) ||
          (this.filters.datasets.spatial_p15 && gene.spatial_p15?.adj_p_val <= this.filters.pvalueThreshold) ||
          (this.filters.datasets.spatial_p30 && gene.spatial_p30?.adj_p_val <= this.filters.pvalueThreshold);
        return hasSignificantPvalue;
      });
    }

    // 5. Log2FC range filter
    if (this.filters.log2fcMin !== null || this.filters.log2fcMax !== null) {
      results = results.filter(gene => {
        const log2fcValues = [
          gene.bulk_rnaseq?.log2fc,
          gene.spatial_p15?.log2fc,
          gene.spatial_p30?.log2fc
        ].filter(v => v !== null && v !== undefined);

        if (log2fcValues.length === 0) return false;

        return log2fcValues.some(fc => {
          const absFc = Math.abs(fc);
          const passesMin = this.filters.log2fcMin === null || absFc >= this.filters.log2fcMin;
          const passesMax = this.filters.log2fcMax === null || absFc <= this.filters.log2fcMax;
          return passesMin && passesMax;
        });
      });
    }

    // Update filtered results
    this.filteredGenes = results;

    // Update UI
    this.updateResultsCount();
    this.paginator.updateData(this.filteredGenes);
    this.sorter.data = this.filteredGenes;
  }

  /**
   * Reset all filters to defaults
   */
  resetFilters() {
    // Reset filter values
    this.currentSearchTerm = '';
    this.filters = {
      regulation: 'all',
      datasets: {
        bulk_rnaseq: true,
        spatial_p15: true,
        spatial_p30: true,
        seizure_gene: true
      },
      pvalueThreshold: 1.0,
      log2fcMin: null,
      log2fcMax: null
    };

    // Reset UI controls
    document.getElementById('searchInput').value = '';
    document.getElementById('regulationFilter').value = 'all';
    document.getElementById('filter_bulk_rnaseq').checked = true;
    document.getElementById('filter_spatial_p15').checked = true;
    document.getElementById('filter_spatial_p30').checked = true;
    document.getElementById('filter_seizure_gene').checked = true;
    document.getElementById('pvalueThreshold').value = '1.0';
    document.getElementById('log2fcMin').value = '';
    document.getElementById('log2fcMax').value = '';

    // Apply filters (will show all genes)
    this.applyFilters();

    showNotification('Filters reset', 'info');
  }

  /**
   * Render results table
   * @param {Array} genes - Array of genes to render
   */
  renderResults(genes) {
    const tbody = document.querySelector('#geneTable tbody');
    if (!tbody) return;

    if (genes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #6c757d;">No genes found matching your criteria</td></tr>';
      return;
    }

    tbody.innerHTML = genes.map(gene => {
      // Determine primary regulation and log2fc
      let primaryRegulation = 'N/A';
      let primaryLog2FC = null;
      let primaryPvalue = null;

      // Priority: bulk_rnaseq > spatial_p30 > spatial_p15
      if (gene.bulk_rnaseq) {
        primaryRegulation = gene.bulk_rnaseq.regulation;
        primaryLog2FC = gene.bulk_rnaseq.log2fc;
        primaryPvalue = gene.bulk_rnaseq.adj_p_val;
      } else if (gene.spatial_p30) {
        primaryRegulation = gene.spatial_p30.regulation;
        primaryLog2FC = gene.spatial_p30.log2fc;
        primaryPvalue = gene.spatial_p30.adj_p_val;
      } else if (gene.spatial_p15) {
        primaryRegulation = gene.spatial_p15.regulation;
        primaryLog2FC = gene.spatial_p15.log2fc;
        primaryPvalue = gene.spatial_p15.adj_p_val;
      }

      // Dataset badges
      const datasets = [];
      if (gene.bulk_rnaseq) datasets.push('<span class="badge badge-info" title="Bulk RNA-seq">Bulk</span>');
      if (gene.spatial_p15) datasets.push('<span class="badge badge-info" title="Spatial P15">P15</span>');
      if (gene.spatial_p30) datasets.push('<span class="badge badge-info" title="Spatial P30">P30</span>');
      if (gene.seizure_gene) datasets.push('<span class="badge badge-warning" title="Seizure Gene">Seizure</span>');

      // Highlight search term
      let displaySymbol = gene.symbol;
      let displayName = gene.name || '';
      if (this.currentSearchTerm) {
        displaySymbol = highlightText(gene.symbol, this.currentSearchTerm);
        displayName = highlightText(displayName, this.currentSearchTerm);
      }

      return `
        <tr>
          <td><code>${displaySymbol}</code></td>
          <td style="max-width: 300px;">${displayName}</td>
          <td><small><code>${gene.ensembl_id}</code></small></td>
          <td>${getRegulationBadge(primaryRegulation)}</td>
          <td>${primaryLog2FC !== null ? formatNumber(primaryLog2FC, 3) : 'N/A'}</td>
          <td>${primaryPvalue !== null ? formatPValue(primaryPvalue) : 'N/A'}</td>
          <td>${datasets.join(' ')}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="showGeneDetails('${gene.symbol}')">
              Details
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Update results count display
   */
  updateResultsCount() {
    const countElement = document.getElementById('resultsCount');
    if (countElement) {
      const total = this.allGenes.length;
      const filtered = this.filteredGenes.length;
      if (filtered === total) {
        countElement.textContent = `Showing all ${total} genes`;
      } else {
        countElement.textContent = `Showing ${filtered} of ${total} genes`;
      }
    }
  }

  /**
   * Show loading status
   * @param {string} message - Loading message
   */
  updateLoadingStatus(message, type = 'info') {
    const statusElement = document.getElementById('loadingStatus');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `alert alert-${type}`;
      statusElement.style.display = 'block';
    }
  }

  /**
   * Hide loading status
   */
  hideLoadingStatus() {
    const statusElement = document.getElementById('loadingStatus');
    if (statusElement) {
      statusElement.style.display = 'none';
    }
  }

  /**
   * Export current results to CSV
   */
  exportResults() {
    if (this.filteredGenes.length === 0) {
      showNotification('No results to export', 'error');
      return;
    }

    // Prepare data for export
    const exportData = this.filteredGenes.map(gene => {
      const row = {
        symbol: gene.symbol,
        name: gene.name || '',
        ensembl_id: gene.ensembl_id,
        chromosome: gene.chromosome || '',
        seizure_gene: gene.seizure_gene ? 'Yes' : 'No'
      };

      // Add bulk RNA-seq data
      if (gene.bulk_rnaseq) {
        row.bulk_regulation = gene.bulk_rnaseq.regulation;
        row.bulk_log2fc = gene.bulk_rnaseq.log2fc;
        row.bulk_adj_pval = gene.bulk_rnaseq.adj_p_val;
      }

      // Add spatial P15 data
      if (gene.spatial_p15) {
        row.p15_regulation = gene.spatial_p15.regulation;
        row.p15_log2fc = gene.spatial_p15.log2fc;
        row.p15_adj_pval = gene.spatial_p15.adj_p_val;
      }

      // Add spatial P30 data
      if (gene.spatial_p30) {
        row.p30_regulation = gene.spatial_p30.regulation;
        row.p30_log2fc = gene.spatial_p30.log2fc;
        row.p30_adj_pval = gene.spatial_p30.adj_p_val;
      }

      return row;
    });

    // Define columns for CSV
    const columns = [
      { key: 'symbol', header: 'Gene Symbol' },
      { key: 'name', header: 'Gene Name' },
      { key: 'ensembl_id', header: 'Ensembl ID' },
      { key: 'chromosome', header: 'Chromosome' },
      { key: 'seizure_gene', header: 'Seizure Gene' },
      { key: 'bulk_regulation', header: 'Bulk Regulation' },
      { key: 'bulk_log2fc', header: 'Bulk Log2FC' },
      { key: 'bulk_adj_pval', header: 'Bulk Adj.P' },
      { key: 'p15_regulation', header: 'P15 Regulation' },
      { key: 'p15_log2fc', header: 'P15 Log2FC' },
      { key: 'p15_adj_pval', header: 'P15 Adj.P' },
      { key: 'p30_regulation', header: 'P30 Regulation' },
      { key: 'p30_log2fc', header: 'P30 Log2FC' },
      { key: 'p30_adj_pval', header: 'P30 Adj.P' }
    ];

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `gaers-gene-search-results-${timestamp}`;

    // Export to CSV
    exportToCSV(exportData, filename, columns);

    showNotification(`Exported ${exportData.length} genes to CSV`, 'success');
  }

  /**
   * Get gene details by symbol
   * @param {string} symbol - Gene symbol
   * @returns {Object} Gene object
   */
  getGeneBySymbol(symbol) {
    return this.allGenes.find(g => g.symbol === symbol);
  }
}

/**
 * Show gene details in modal
 * @param {string} symbol - Gene symbol
 */
function showGeneDetails(symbol) {
  const gene = window.geneSearchEngine.getGeneBySymbol(symbol);
  if (!gene) {
    showNotification('Gene not found', 'error');
    return;
  }

  // Build modal content
  let modalContent = `
    <h3>${gene.symbol}</h3>
    <p><strong>Gene Name:</strong> ${gene.name || 'N/A'}</p>
    <p><strong>Ensembl ID:</strong> <code>${gene.ensembl_id}</code></p>
    <p><strong>Chromosome:</strong> ${gene.chromosome || 'N/A'}</p>
    <p><strong>Seizure Gene:</strong> ${gene.seizure_gene ? 'Yes' : 'No'}</p>

    <h4 class="mt-3">Differential Expression Data</h4>
  `;

  // Bulk RNA-seq data
  if (gene.bulk_rnaseq) {
    modalContent += `
      <div class="card mt-2">
        <div class="card-body">
          <h5>Bulk RNA-seq (Ga30 vs Ga15)</h5>
          <p><strong>Regulation:</strong> ${getRegulationBadge(gene.bulk_rnaseq.regulation)}</p>
          <p><strong>Log2 Fold Change:</strong> ${formatNumber(gene.bulk_rnaseq.log2fc, 3)}</p>
          <p><strong>Adjusted P-value:</strong> ${formatPValue(gene.bulk_rnaseq.adj_p_val)}</p>
        </div>
      </div>
    `;
  }

  // Spatial P15 data
  if (gene.spatial_p15) {
    modalContent += `
      <div class="card mt-2">
        <div class="card-body">
          <h5>Spatial Transcriptomics P15</h5>
          <p><strong>Regulation:</strong> ${getRegulationBadge(gene.spatial_p15.regulation)}</p>
          <p><strong>Log2 Fold Change:</strong> ${formatNumber(gene.spatial_p15.log2fc, 3)}</p>
          <p><strong>Adjusted P-value:</strong> ${formatPValue(gene.spatial_p15.adj_p_val)}</p>
        </div>
      </div>
    `;
  }

  // Spatial P30 data
  if (gene.spatial_p30) {
    modalContent += `
      <div class="card mt-2">
        <div class="card-body">
          <h5>Spatial Transcriptomics P30</h5>
          <p><strong>Regulation:</strong> ${getRegulationBadge(gene.spatial_p30.regulation)}</p>
          <p><strong>Log2 Fold Change:</strong> ${formatNumber(gene.spatial_p30.log2fc, 3)}</p>
          <p><strong>Adjusted P-value:</strong> ${formatPValue(gene.spatial_p30.adj_p_val)}</p>
        </div>
      </div>
    `;
  }

  // External links
  modalContent += `
    <h4 class="mt-3">External Resources</h4>
    <p>
      <a href="https://www.ensembl.org/Rattus_norvegicus/Gene/Summary?g=${gene.ensembl_id}" target="_blank" class="btn btn-sm btn-primary">Ensembl →</a>
      <a href="https://www.ncbi.nlm.nih.gov/gene/?term=${gene.symbol}[Gene%20Name]+AND+Rattus+norvegicus[Organism]" target="_blank" class="btn btn-sm btn-primary">NCBI Gene →</a>
    </p>
  `;

  // Display modal
  showModal('Gene Details', modalContent);
}

/**
 * Show modal dialog
 * @param {string} title - Modal title
 * @param {string} content - Modal HTML content
 */
function showModal(title, content) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('geneDetailsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'geneDetailsModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modalTitle"></h2>
          <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body" id="modalBody"></div>
      </div>
    `;
    document.body.appendChild(modal);

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // Update content
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = content;

  // Show modal
  modal.classList.add('active');
}

/**
 * Close modal dialog
 */
function closeModal() {
  const modal = document.getElementById('geneDetailsModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Make functions globally accessible
window.showGeneDetails = showGeneDetails;
window.showModal = showModal;
window.closeModal = closeModal;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GeneSearchEngine, showGeneDetails };
}
