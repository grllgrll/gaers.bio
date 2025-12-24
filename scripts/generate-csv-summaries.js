#!/usr/bin/env node
/**
 * Generate CSV summary files for spatial transcriptomics data
 *
 * Output:
 * 1. spatial-p15-top-degs.csv - Top 50 DEGs (25 up + 25 down) for P15
 * 2. spatial-p30-top-degs.csv - Top 50 DEGs (25 up + 25 down) for P30
 * 3. spatial-summary-statistics.csv - Summary comparison table
 */

const fs = require('fs');
const path = require('path');

// Paths
const P15_DATA = path.join(__dirname, '../assets/data/spatial-p15-degs.json');
const P30_DATA = path.join(__dirname, '../assets/data/spatial-p30-degs.json');
const OUTPUT_DIR = path.join(__dirname, '../downloads/spatial');

console.log('📊 CSV Summary Generator');
console.log('='.repeat(60));

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`✅ Created output directory: ${OUTPUT_DIR}`);
}

/**
 * Load JSON data from file
 */
function loadData(filepath) {
  try {
    const rawData = fs.readFileSync(filepath, 'utf8');
    const data = JSON.parse(rawData);
    console.log(`✅ Loaded ${filepath}`);
    console.log(`   Total genes: ${data.genes.length}`);
    console.log(`   Upregulated: ${data.metadata.upregulated}`);
    console.log(`   Downregulated: ${data.metadata.downregulated}`);
    return data;
  } catch (error) {
    console.error(`❌ Error loading ${filepath}:`, error.message);
    process.exit(1);
  }
}

/**
 * Extract top N DEGs by absolute logFC
 */
function getTopDEGs(genes, n = 25) {
  // Filter upregulated and downregulated
  const upGenes = genes.filter(g => g.regulation === 'up');
  const downGenes = genes.filter(g => g.regulation === 'down');

  // Sort by absolute logFC (descending)
  const topUp = upGenes
    .sort((a, b) => Math.abs(b.logFC) - Math.abs(a.logFC))
    .slice(0, n);

  const topDown = downGenes
    .sort((a, b) => Math.abs(b.logFC) - Math.abs(a.logFC))
    .slice(0, n);

  return [...topUp, ...topDown];
}

/**
 * Convert genes array to CSV format
 */
function genesToCSV(genes) {
  const headers = [
    'Symbol',
    'Gene_Name',
    'logFC',
    'Average_Expression',
    't_Statistic',
    'P_Value',
    'Adjusted_P_Value',
    'Regulation'
  ];

  const rows = genes.map(gene => [
    gene.symbol,
    gene.name,
    gene.logFC.toFixed(4),
    gene.aveExpr.toFixed(4),
    gene.tStat.toFixed(4),
    gene.pvalue.toExponential(4),
    gene.adj_p_val.toExponential(4),
    gene.regulation === 'up' ? 'Up' : 'Down'
  ]);

  // Build CSV
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csv;
}

/**
 * Calculate summary statistics
 */
function calculateSummary(data) {
  const upGenes = data.genes.filter(g => g.regulation === 'up');
  const downGenes = data.genes.filter(g => g.regulation === 'down');

  const meanLogFCUp = upGenes.reduce((sum, g) => sum + g.logFC, 0) / upGenes.length;
  const meanLogFCDown = downGenes.reduce((sum, g) => sum + Math.abs(g.logFC), 0) / downGenes.length;

  return {
    total: data.genes.length,
    up: upGenes.length,
    down: downGenes.length,
    percentUp: ((upGenes.length / data.genes.length) * 100).toFixed(2),
    percentDown: ((downGenes.length / data.genes.length) * 100).toFixed(2),
    meanLogFCUp: meanLogFCUp.toFixed(4),
    meanLogFCDown: meanLogFCDown.toFixed(4)
  };
}

/**
 * Generate summary statistics CSV
 */
function generateSummaryCSV(p15Summary, p30Summary) {
  const headers = [
    'Timepoint',
    'Total_DEGs',
    'Upregulated',
    'Downregulated',
    'Percent_Up',
    'Percent_Down',
    'Mean_logFC_Up',
    'Mean_logFC_Down'
  ];

  const p15Row = [
    'P15',
    p15Summary.total,
    p15Summary.up,
    p15Summary.down,
    p15Summary.percentUp,
    p15Summary.percentDown,
    p15Summary.meanLogFCUp,
    p15Summary.meanLogFCDown
  ];

  const p30Row = [
    'P30',
    p30Summary.total,
    p30Summary.up,
    p30Summary.down,
    p30Summary.percentUp,
    p30Summary.percentDown,
    p30Summary.meanLogFCUp,
    p30Summary.meanLogFCDown
  ];

  const csv = [
    headers.join(','),
    p15Row.join(','),
    p30Row.join(',')
  ].join('\n');

  return csv;
}

// Main execution
console.log('\n📥 Loading data...');
const p15Data = loadData(P15_DATA);
const p30Data = loadData(P30_DATA);

console.log('\n🔍 Extracting top DEGs...');
const p15TopGenes = getTopDEGs(p15Data.genes, 25);
const p30TopGenes = getTopDEGs(p30Data.genes, 25);
console.log(`✅ P15: Selected ${p15TopGenes.length} genes (${p15TopGenes.filter(g => g.regulation === 'up').length} up, ${p15TopGenes.filter(g => g.regulation === 'down').length} down)`);
console.log(`✅ P30: Selected ${p30TopGenes.length} genes (${p30TopGenes.filter(g => g.regulation === 'up').length} up, ${p30TopGenes.filter(g => g.regulation === 'down').length} down)`);

console.log('\n📊 Calculating summary statistics...');
const p15Summary = calculateSummary(p15Data);
const p30Summary = calculateSummary(p30Data);
console.log(`✅ P15 summary: ${p15Summary.total} total (${p15Summary.up} up, ${p15Summary.down} down)`);
console.log(`✅ P30 summary: ${p30Summary.total} total (${p30Summary.up} up, ${p30Summary.down} down)`);

console.log('\n💾 Writing CSV files...');

// Write P15 Top DEGs CSV
const p15CSV = genesToCSV(p15TopGenes);
const p15Path = path.join(OUTPUT_DIR, 'spatial-p15-top-degs.csv');
fs.writeFileSync(p15Path, p15CSV);
console.log(`✅ Wrote: ${p15Path}`);
console.log(`   Size: ${(p15CSV.length / 1024).toFixed(2)} KB`);
console.log(`   Rows: ${p15TopGenes.length + 1} (header + ${p15TopGenes.length} genes)`);

// Write P30 Top DEGs CSV
const p30CSV = genesToCSV(p30TopGenes);
const p30Path = path.join(OUTPUT_DIR, 'spatial-p30-top-degs.csv');
fs.writeFileSync(p30Path, p30CSV);
console.log(`✅ Wrote: ${p30Path}`);
console.log(`   Size: ${(p30CSV.length / 1024).toFixed(2)} KB`);
console.log(`   Rows: ${p30TopGenes.length + 1} (header + ${p30TopGenes.length} genes)`);

// Write Summary Statistics CSV
const summaryCSV = generateSummaryCSV(p15Summary, p30Summary);
const summaryPath = path.join(OUTPUT_DIR, 'spatial-summary-statistics.csv');
fs.writeFileSync(summaryPath, summaryCSV);
console.log(`✅ Wrote: ${summaryPath}`);
console.log(`   Size: ${(summaryCSV.length / 1024).toFixed(2)} KB`);
console.log(`   Rows: 3 (header + P15 + P30)`);

console.log('\n' + '='.repeat(60));
console.log('✨ CSV generation complete!');
console.log('\n📁 Output files:');
console.log(`   1. ${path.basename(p15Path)}`);
console.log(`   2. ${path.basename(p30Path)}`);
console.log(`   3. ${path.basename(summaryPath)}`);
console.log('\n🎯 Next step: Run local server and test downloads');
console.log('   cd /path/to/gaers-website');
console.log('   python3 -m http.server 8000');
