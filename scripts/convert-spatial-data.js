#!/usr/bin/env node

/**
 * Convert spatial transcriptomics data from CSV to JSON
 * Input: sig_genes_P15_* and sig_genes_P30_*.csv
 * Output: spatial-p15-degs.json and spatial-p30-degs.json
 */

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const P15_INPUT = '/Users/ozkanozdemir/Sandbox/gaers.bio/10XGenomics_Analysis/Output/SSC_DEA/sig_genes_P15_GAERS_vs_P15_Wh_limma_Result_19.csv';
const P30_INPUT = '/Users/ozkanozdemir/Sandbox/gaers.bio/10XGenomics_Analysis/Output/SSC_DEA/sig_genes_P30_GAERS_vs_P30_Wh_limma_Result_21.csv';
const P15_OUTPUT = path.join(__dirname, '../assets/data/spatial-p15-degs.json');
const P30_OUTPUT = path.join(__dirname, '../assets/data/spatial-p30-degs.json');

function convertFile(inputFile, outputFile, comparison) {
  return new Promise((resolve, reject) => {
    const genes = [];
    let stats = {
      total: 0,
      upregulated: 0,
      downregulated: 0
    };

    console.log(`\nConverting ${comparison}...`);

    fs.createReadStream(inputFile)
      .pipe(csv())
      .on('data', (row) => {
        const logFC = parseFloat(row.logFC);
        const adjPVal = parseFloat(row['adj.P.Val']);
        const pValue = parseFloat(row['P.Value']);

        const gene = {
          entrezId: row.EntrezID,
          symbol: row.Symbols || row.EntrezID,
          name: row.Name || '',
          logFC: logFC,
          aveExpr: parseFloat(row.AveExpr),
          tStat: parseFloat(row.t),
          pvalue: pValue,
          adj_p_val: adjPVal,
          b: parseFloat(row.B),
          regulation: logFC > 0 ? 'up' : 'down',
          significant: adjPVal < 0.05 && Math.abs(logFC) > 0.5
        };

        genes.push(gene);
        stats.total++;

        if (logFC > 0) {
          stats.upregulated++;
        } else {
          stats.downregulated++;
        }
      })
      .on('end', () => {
        // Sort by adjusted p-value
        genes.sort((a, b) => a.adj_p_val - b.adj_p_val);

        const output = {
          metadata: {
            source: '10X Genomics Spatial Transcriptomics (Limma)',
            comparison: comparison,
            date_generated: new Date().toISOString(),
            total_genes: stats.total,
            upregulated: stats.upregulated,
            downregulated: stats.downregulated,
            thresholds: {
              adj_p_val: 0.05,
              logFC: 0.5
            }
          },
          genes: genes
        };

        // Write output
        fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

        console.log(`✓ Converted ${stats.total} genes`);
        console.log(`  - Upregulated: ${stats.upregulated}`);
        console.log(`  - Downregulated: ${stats.downregulated}`);
        console.log(`✓ Output: ${outputFile}`);

        resolve(stats);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Convert both files
async function convertAll() {
  try {
    await convertFile(P15_INPUT, P15_OUTPUT, 'P15 GAERS vs P15 Wistar');
    await convertFile(P30_INPUT, P30_OUTPUT, 'P30 GAERS vs P30 Wistar');
    console.log('\n✓ All spatial data converted successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

convertAll();
