#!/usr/bin/env node

/**
 * Build unified gene database/index from all sources
 * Combines: RNA-seq DEGs, Spatial P15/P30 DEGs, Seizure genes
 * Output: gene-master-index.json + seizure-genes.json
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../assets/data');
const SEIZURE_INPUT = '/Users/ozkanozdemir/Sandbox/gaers.bio/10XGenomics_Analysis/ExpressionMarkers/Seizure_Genes/genes_for_HP_0001250_Seizure.txt';
const SEIZURE_OUTPUT = path.join(DATA_DIR, 'seizure-genes.json');
const MASTER_OUTPUT = path.join(DATA_DIR, 'gene-master-index.json');

console.log('Building gene master index...\n');

// Load all data files
function loadJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`⚠ File not found: ${filepath}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

// Load seizure genes
function loadSeizureGenes() {
  if (!fs.existsSync(SEIZURE_INPUT)) {
    console.log(`⚠ Seizure genes file not found`);
    return [];
  }

  const content = fs.readFileSync(SEIZURE_INPUT, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());

  // Skip header line
  const genes = lines.slice(1).map(line => line.trim()).filter(g => g);

  console.log(`✓ Loaded ${genes.length} seizure genes`);

  // Save seizure genes as JSON
  fs.writeFileSync(SEIZURE_OUTPUT, JSON.stringify({
    metadata: {
      source: 'Human Phenotype Ontology (HP:0001250)',
      description: 'Genes associated with seizures',
      total: genes.length,
      date_generated: new Date().toISOString()
    },
    genes: genes
  }, null, 2));

  console.log(`✓ Saved: ${SEIZURE_OUTPUT}\n`);

  return genes;
}

// Build master index
async function buildMasterIndex() {
  try {
    // Load all data
    const rnaseqData = loadJSON('rnaseq-degs.json');
    const spatialP15Data = loadJSON('spatial-p15-degs.json');
    const spatialP30Data = loadJSON('spatial-p30-degs.json');
    const seizureGenes = loadSeizureGenes();

    const geneMap = new Map();

    // Process RNA-seq data
    if (rnaseqData) {
      console.log('Processing RNA-seq DEGs...');
      rnaseqData.genes.forEach(gene => {
        const key = gene.symbol.toUpperCase();
        if (!geneMap.has(key)) {
          geneMap.set(key, {
            primary_symbol: gene.symbol,
            ensembl_id: gene.id,
            name: gene.name,
            datasets: {}
          });
        }

        geneMap.get(key).datasets.rnaseq = {
          log2fc: gene.log2fc,
          padj: gene.padj,
          baseMean: gene.baseMean,
          regulation: gene.regulation,
          significant: gene.significant
        };
      });
      console.log(`  Added ${rnaseqData.genes.length} genes from RNA-seq`);
    }

    // Process Spatial P15 data
    if (spatialP15Data) {
      console.log('Processing Spatial P15 DEGs...');
      spatialP15Data.genes.forEach(gene => {
        const key = gene.symbol.toUpperCase();
        if (!geneMap.has(key)) {
          geneMap.set(key, {
            primary_symbol: gene.symbol,
            entrez_id: gene.entrezId,
            name: gene.name,
            datasets: {}
          });
        }

        const entry = geneMap.get(key);
        if (!entry.entrez_id) entry.entrez_id = gene.entrezId;
        if (!entry.name || entry.name.startsWith('ENS')) entry.name = gene.name;

        entry.datasets.spatial_p15 = {
          logFC: gene.logFC,
          adj_p_val: gene.adj_p_val,
          aveExpr: gene.aveExpr,
          regulation: gene.regulation,
          significant: gene.significant
        };
      });
      console.log(`  Added ${spatialP15Data.genes.length} genes from Spatial P15`);
    }

    // Process Spatial P30 data
    if (spatialP30Data) {
      console.log('Processing Spatial P30 DEGs...');
      spatialP30Data.genes.forEach(gene => {
        const key = gene.symbol.toUpperCase();
        if (!geneMap.has(key)) {
          geneMap.set(key, {
            primary_symbol: gene.symbol,
            entrez_id: gene.entrezId,
            name: gene.name,
            datasets: {}
          });
        }

        const entry = geneMap.get(key);
        if (!entry.entrez_id) entry.entrez_id = gene.entrezId;
        if (!entry.name || entry.name.startsWith('ENS')) entry.name = gene.name;

        entry.datasets.spatial_p30 = {
          logFC: gene.logFC,
          adj_p_val: gene.adj_p_val,
          aveExpr: gene.aveExpr,
          regulation: gene.regulation,
          significant: gene.significant
        };
      });
      console.log(`  Added ${spatialP30Data.genes.length} genes from Spatial P30`);
    }

    // Mark seizure genes
    console.log('Marking seizure genes...');
    let seizureCount = 0;
    seizureGenes.forEach(gene => {
      const key = gene.toUpperCase();
      if (geneMap.has(key)) {
        geneMap.get(key).is_seizure_gene = true;
        seizureCount++;
      } else {
        // Add seizure gene even if not in DEG lists
        geneMap.set(key, {
          primary_symbol: gene,
          name: '',
          datasets: {},
          is_seizure_gene: true
        });
      }
    });
    console.log(`  Marked ${seizureCount} overlapping seizure genes\n`);

    // Convert to array and sort
    const genesArray = Array.from(geneMap.values());
    genesArray.sort((a, b) => a.primary_symbol.localeCompare(b.primary_symbol));

    // Calculate statistics
    const stats = {
      total_genes: genesArray.length,
      with_rnaseq: genesArray.filter(g => g.datasets.rnaseq).length,
      with_spatial_p15: genesArray.filter(g => g.datasets.spatial_p15).length,
      with_spatial_p30: genesArray.filter(g => g.datasets.spatial_p30).length,
      seizure_genes: genesArray.filter(g => g.is_seizure_gene).length,
      multi_dataset: genesArray.filter(g => Object.keys(g.datasets).length > 1).length
    };

    const output = {
      metadata: {
        date_generated: new Date().toISOString(),
        description: 'Unified gene index from all GAERS datasets',
        statistics: stats
      },
      genes: genesArray
    };

    // Write output
    fs.writeFileSync(MASTER_OUTPUT, JSON.stringify(output, null, 2));

    console.log('✓ Gene master index built successfully!');
    console.log(`✓ Output: ${MASTER_OUTPUT}`);
    console.log(`\nStatistics:`);
    console.log(`  Total genes: ${stats.total_genes}`);
    console.log(`  - With RNA-seq data: ${stats.with_rnaseq}`);
    console.log(`  - With Spatial P15 data: ${stats.with_spatial_p15}`);
    console.log(`  - With Spatial P30 data: ${stats.with_spatial_p30}`);
    console.log(`  - Seizure-related genes: ${stats.seizure_genes}`);
    console.log(`  - In multiple datasets: ${stats.multi_dataset}`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

buildMasterIndex();
