/**
 * GAERS Research Website - Chart.js Visualization Library
 * Functions for creating interactive scientific visualizations
 */

// Global chart instances to manage updates
const chartInstances = {};

/**
 * Create an interactive Volcano Plot
 * @param {string} canvasId - ID of the canvas element
 * @param {Array} data - Array of gene objects with log2fc, padj, symbol, regulation
 * @param {Object} options - Optional configuration
 */
function createVolcanoPlot(canvasId, data, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas element '${canvasId}' not found`);
    return null;
  }

  // Destroy existing chart if it exists
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  const ctx = canvas.getContext('2d');

  // Prepare datasets
  const upregulated = data.filter(g => g.regulation === 'up' && g.significant).map(g => ({
    x: g.log2fc || g.logFC,
    y: -Math.log10(g.padj || g.adj_p_val),
    gene: g
  }));

  const downregulated = data.filter(g => g.regulation === 'down' && g.significant).map(g => ({
    x: g.log2fc || g.logFC,
    y: -Math.log10(g.padj || g.adj_p_val),
    gene: g
  }));

  const notSignificant = data.filter(g => !g.significant).map(g => ({
    x: g.log2fc || g.logFC,
    y: -Math.log10(g.padj || g.adj_p_val),
    gene: g
  }));

  // Create chart
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: `Upregulated (${upregulated.length})`,
          data: upregulated,
          backgroundColor: 'rgba(220, 53, 69, 0.6)',
          borderColor: 'rgba(220, 53, 69, 0.8)',
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: `Downregulated (${downregulated.length})`,
          data: downregulated,
          backgroundColor: 'rgba(13, 110, 253, 0.6)',
          borderColor: 'rgba(13, 110, 253, 0.8)',
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: `Not Significant (${notSignificant.length})`,
          data: notSignificant,
          backgroundColor: 'rgba(108, 117, 125, 0.3)',
          borderColor: 'rgba(108, 117, 125, 0.5)',
          pointRadius: 2,
          pointHoverRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: options.title || 'Volcano Plot',
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const gene = context.raw.gene;
              const fc = gene.log2fc || gene.logFC;
              const pval = gene.padj || gene.adj_p_val;
              return [
                `Gene: ${gene.symbol}`,
                `Log2FC: ${fc.toFixed(3)}`,
                `Adj. P-value: ${pval.toExponential(2)}`,
                `-log10(p): ${context.parsed.y.toFixed(2)}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Log2 Fold Change',
            font: { size: 14, weight: 'bold' }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          title: {
            display: true,
            text: '-log10(Adjusted P-value)',
            font: { size: 14, weight: 'bold' }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0 && options.onGeneClick) {
          const gene = elements[0].element.$context.raw.gene;
          options.onGeneClick(gene);
        }
      }
    }
  });

  return chartInstances[canvasId];
}

/**
 * Create a horizontal bar chart for top DEGs
 * @param {string} canvasId - ID of the canvas element
 * @param {Array} data - Array of gene objects
 * @param {Object} options - Configuration (direction: 'up' or 'down', limit: number)
 */
function createTopDEGsBarChart(canvasId, data, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas element '${canvasId}' not found`);
    return null;
  }

  // Destroy existing chart if it exists
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  const ctx = canvas.getContext('2d');
  const direction = options.direction || 'up';
  const limit = options.limit || 20;

  // Filter and sort data
  let filteredData = data.filter(g => g.regulation === direction && g.significant);
  filteredData.sort((a, b) => {
    const fcA = Math.abs(a.log2fc || a.logFC);
    const fcB = Math.abs(b.log2fc || b.logFC);
    return fcB - fcA;
  });
  filteredData = filteredData.slice(0, limit);

  const labels = filteredData.map(g => g.symbol);
  const values = filteredData.map(g => Math.abs(g.log2fc || g.logFC));
  const color = direction === 'up' ? 'rgba(220, 53, 69, 0.7)' : 'rgba(13, 110, 253, 0.7)';

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: `|Log2 Fold Change|`,
        data: values,
        backgroundColor: color,
        borderColor: color.replace('0.7', '1'),
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: options.title || `Top ${limit} ${direction === 'up' ? 'Upregulated' : 'Downregulated'} Genes`,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `|Log2FC|: ${context.parsed.x.toFixed(3)}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: '|Log2 Fold Change|',
            font: { size: 14, weight: 'bold' }
          },
          beginAtZero: true
        },
        y: {
          ticks: {
            autoSkip: false,
            font: { size: 11 }
          }
        }
      }
    }
  });

  return chartInstances[canvasId];
}

/**
 * Create a dot plot for GO enrichment analysis
 * @param {string} canvasId - ID of the canvas element
 * @param {Array} data - Array of enrichment term objects
 * @param {Object} options - Optional configuration
 */
function createEnrichmentDotPlot(canvasId, data, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas element '${canvasId}' not found`);
    return null;
  }

  // Destroy existing chart if it exists
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  const ctx = canvas.getContext('2d');
  const limit = options.limit || 20;

  // Sort by p-value and take top terms
  let sortedData = [...data].sort((a, b) => a.p_adjust - b.p_adjust).slice(0, limit);

  // Prepare data
  const labels = sortedData.map(t => {
    const desc = t.description;
    return desc.length > 50 ? desc.substring(0, 47) + '...' : desc;
  });

  const geneRatios = sortedData.map(t => {
    const [numerator, denominator] = t.gene_ratio.split('/');
    return (parseInt(numerator) / parseInt(denominator)) * 100;
  });

  const pvalues = sortedData.map(t => -Math.log10(t.p_adjust));
  const geneCounts = sortedData.map(t => t.gene_count);

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bubble',
    data: {
      datasets: [{
        label: 'Enriched Terms',
        data: sortedData.map((t, i) => ({
          x: geneRatios[i],
          y: i,
          r: Math.sqrt(geneCounts[i]) * 2,
          pvalue: t.p_adjust,
          term: t.description,
          geneCount: geneCounts[i],
          geneRatio: t.gene_ratio
        })),
        backgroundColor: pvalues.map(p => {
          // Color gradient based on -log10(p-value)
          const intensity = Math.min(p / 10, 1);
          return `rgba(220, 53, 69, ${0.3 + intensity * 0.5})`;
        }),
        borderColor: 'rgba(220, 53, 69, 0.8)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: options.title || 'GO Enrichment Analysis',
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const point = context.raw;
              return [
                `Term: ${point.term}`,
                `Gene Ratio: ${point.geneRatio} (${point.x.toFixed(1)}%)`,
                `Gene Count: ${point.geneCount}`,
                `Adj. P-value: ${point.pvalue.toExponential(2)}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Gene Ratio (%)',
            font: { size: 14, weight: 'bold' }
          },
          beginAtZero: true
        },
        y: {
          type: 'category',
          labels: labels,
          ticks: {
            autoSkip: false,
            font: { size: 10 }
          }
        }
      }
    }
  });

  return chartInstances[canvasId];
}

/**
 * Create a combined up/down bar chart
 * @param {string} canvasId - ID of the canvas element
 * @param {Array} upData - Array of upregulated genes
 * @param {Array} downData - Array of downregulated genes
 * @param {Object} options - Optional configuration
 */
function createCombinedDEGsChart(canvasId, upData, downData, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas element '${canvasId}' not found`);
    return null;
  }

  // Destroy existing chart if it exists
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  const ctx = canvas.getContext('2d');
  const limit = options.limit || 10;

  // Get top genes from each direction
  const topUp = upData
    .filter(g => g.significant)
    .sort((a, b) => Math.abs(b.log2fc || b.logFC) - Math.abs(a.log2fc || a.logFC))
    .slice(0, limit);

  const topDown = downData
    .filter(g => g.significant)
    .sort((a, b) => Math.abs(b.log2fc || b.logFC) - Math.abs(a.log2fc || a.logFC))
    .slice(0, limit);

  const labels = [
    ...topUp.map(g => g.symbol),
    ...topDown.map(g => g.symbol)
  ];

  const values = [
    ...topUp.map(g => g.log2fc || g.logFC),
    ...topDown.map(g => g.log2fc || g.logFC)
  ];

  const colors = [
    ...topUp.map(() => 'rgba(220, 53, 69, 0.7)'),
    ...topDown.map(() => 'rgba(13, 110, 253, 0.7)')
  ];

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Log2 Fold Change',
        data: values,
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.7', '1')),
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: options.title || `Top ${limit} Up/Down Regulated Genes`,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Log2 Fold Change',
            font: { size: 14, weight: 'bold' }
          }
        },
        y: {
          ticks: {
            autoSkip: false,
            font: { size: 11 }
          }
        }
      }
    }
  });

  return chartInstances[canvasId];
}

/**
 * Create a simple stats card chart (for dashboard)
 * @param {string} canvasId - ID of the canvas element
 * @param {Object} stats - Statistics object {up, down, total}
 */
function createStatsDonutChart(canvasId, stats) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas element '${canvasId}' not found`);
    return null;
  }

  // Destroy existing chart if it exists
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  const ctx = canvas.getContext('2d');

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Upregulated', 'Downregulated'],
      datasets: [{
        data: [stats.up, stats.down],
        backgroundColor: [
          'rgba(220, 53, 69, 0.7)',
          'rgba(13, 110, 253, 0.7)'
        ],
        borderColor: [
          'rgba(220, 53, 69, 1)',
          'rgba(13, 110, 253, 1)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed;
              const total = stats.total;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });

  return chartInstances[canvasId];
}

/**
 * Destroy a chart instance
 * @param {string} canvasId - ID of the canvas element
 */
function destroyChart(canvasId) {
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
    delete chartInstances[canvasId];
  }
}

/**
 * Destroy all chart instances
 */
function destroyAllCharts() {
  Object.keys(chartInstances).forEach(canvasId => {
    chartInstances[canvasId].destroy();
  });
  chartInstances = {};
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createVolcanoPlot,
    createTopDEGsBarChart,
    createEnrichmentDotPlot,
    createCombinedDEGsChart,
    createStatsDonutChart,
    destroyChart,
    destroyAllCharts
  };
}
