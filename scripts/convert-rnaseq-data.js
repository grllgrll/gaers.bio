#!/usr/bin/env node

/**
 * Convert bulk RNA-seq DESeq2 results from CSV to JSON
 * Input: significant_genes_with_symbols.csv
 * Output: rnaseq-degs.json
 */

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const INPUT_FILE = '/Users/ozkanozdemir/Sandbox/takara_rna_rat/analysis_output/deseq2/significant_genes_with_symbols.csv';
const OUTPUT_FILE = path.join(__dirname, '../assets/data/rnaseq-degs.json');

const genes = [];
let stats = {
  total: 0,
  upregulated: 0,
  downregulated: 0
};

console.log('Converting bulk RNA-seq data...');

fs.createReadStream(INPUT_FILE)
  .pipe(csv())
  .on('data', (row) => {
    const log2fc = parseFloat(row.log2FoldChange);
    const padj = parseFloat(row.padj);
    const baseMean = parseFloat(row.baseMean);

    const gene = {
      id: row.gene_id,
      symbol: row.gene_symbol || row.gene_id,
      name: row.gene_label || row.gene_symbol || '',
      baseMean: baseMean,
      log2fc: log2fc,
      lfcSE: parseFloat(row.lfcSE),
      stat: parseFloat(row.stat),
      pvalue: parseFloat(row.pvalue),
      padj: padj,
      regulation: log2fc > 0 ? 'up' : 'down',
      significant: padj < 0.1 && Math.abs(log2fc) > 0.5
    };

    genes.push(gene);
    stats.total++;

    if (log2fc > 0) {
      stats.upregulated++;
    } else {
      stats.downregulated++;
    }
  })
  .on('end', () => {
    // Sort by adjusted p-value
    genes.sort((a, b) => a.padj - b.padj);

    const output = {
      metadata: {
        source: 'LCM/Bulk RNA-seq (DESeq2)',
        comparison: 'Ga30 (P30) vs Ga15 (P15)',
        date_generated: new Date().toISOString(),
        total_genes: stats.total,
        upregulated: stats.upregulated,
        downregulated: stats.downregulated,
        thresholds: {
          padj: 0.1,
          log2fc: 0.5
        }
      },
      genes: genes
    };

    // Write output
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

    console.log(`✓ Converted ${stats.total} genes`);
    console.log(`  - Upregulated: ${stats.upregulated}`);
    console.log(`  - Downregulated: ${stats.downregulated}`);
    console.log(`✓ Output: ${OUTPUT_FILE}`);
  })
  .on('error', (error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
