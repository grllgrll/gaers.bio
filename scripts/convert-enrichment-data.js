#!/usr/bin/env node

/**
 * Convert enrichment analysis results from CSV to JSON
 * Input: GO_BP, GO_CC, GO_MF, Reactome CSV files
 * Output: enrichment-data.json
 */

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const BASE_DIR = '/Users/ozkanozdemir/Sandbox/takara_rna_rat/analysis_output/enrichment/clusterProfiler';
const OUTPUT_FILE = path.join(__dirname, '../assets/data/enrichment-data.json');

const files = {
  GO_BP: path.join(BASE_DIR, 'GO_BP_all.csv'),
  GO_CC: path.join(BASE_DIR, 'GO_CC_all.csv'),
  GO_MF: path.join(BASE_DIR, 'GO_MF_all.csv'),
  Reactome: path.join(BASE_DIR, 'Reactome_all.csv')
};

function parseFile(filepath, category) {
  return new Promise((resolve, reject) => {
    const terms = [];

    if (!fs.existsSync(filepath)) {
      console.log(`⚠ File not found: ${filepath}, skipping...`);
      resolve([]);
      return;
    }

    console.log(`Processing ${category}...`);

    fs.createReadStream(filepath)
      .pipe(csv())
      .on('data', (row) => {
        const pAdjust = parseFloat(row['p.adjust']);
        const pValue = parseFloat(row.pvalue);

        const term = {
          id: row.ID,
          description: row.Description,
          gene_ratio: row.GeneRatio,
          bg_ratio: row.BgRatio,
          rich_factor: parseFloat(row.RichFactor),
          fold_enrichment: parseFloat(row.FoldEnrichment),
          z_score: parseFloat(row.zScore || 0),
          pvalue: pValue,
          p_adjust: pAdjust,
          qvalue: parseFloat(row.qvalue),
          gene_id: row.geneID,
          gene_count: parseInt(row.Count),
          category: category
        };

        // Only include significant terms (p.adjust < 0.05)
        if (pAdjust < 0.05) {
          terms.push(term);
        }
      })
      .on('end', () => {
        // Sort by p.adjust and take top 50
        terms.sort((a, b) => a.p_adjust - b.p_adjust);
        const topTerms = terms.slice(0, 50);

        console.log(`✓ ${category}: ${topTerms.length} significant terms (top 50)`);
        resolve(topTerms);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

async function convertAll() {
  try {
    console.log('Converting enrichment data...\n');

    const results = await Promise.all([
      parseFile(files.GO_BP, 'Biological Process'),
      parseFile(files.GO_CC, 'Cellular Component'),
      parseFile(files.GO_MF, 'Molecular Function'),
      parseFile(files.Reactome, 'Reactome Pathway')
    ]);

    const [go_bp, go_cc, go_mf, reactome] = results;

    const output = {
      metadata: {
        source: 'clusterProfiler enrichment analysis',
        date_generated: new Date().toISOString(),
        threshold: 'p.adjust < 0.05',
        top_n: 50
      },
      enrichment: {
        biological_process: go_bp,
        cellular_component: go_cc,
        molecular_function: go_mf,
        reactome_pathways: reactome
      },
      summary: {
        total_bp_terms: go_bp.length,
        total_cc_terms: go_cc.length,
        total_mf_terms: go_mf.length,
        total_reactome: reactome.length
      }
    };

    // Write output
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

    console.log(`\n✓ Enrichment data converted successfully!`);
    console.log(`✓ Output: ${OUTPUT_FILE}`);
    console.log(`\nSummary:`);
    console.log(`  - GO Biological Process: ${go_bp.length} terms`);
    console.log(`  - GO Cellular Component: ${go_cc.length} terms`);
    console.log(`  - GO Molecular Function: ${go_mf.length} terms`);
    console.log(`  - Reactome Pathways: ${reactome.length} pathways`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

convertAll();
