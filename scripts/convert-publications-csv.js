/**
 * GAERS Publications CSV to JSON Converter
 *
 * Converts the publications CSV file into a structured JSON format
 * for use in the gaers.bio literature database.
 *
 * Input: CSV with 199 GAERS publications (2015-2025)
 * Output: publications.json with metadata and statistics
 */

const fs = require('fs');
const path = require('path');

// File paths
const CSV_INPUT = '/Users/ozkanozdemir/Sandbox/gaers.bio/Publications/Get all the puplications about GAERS rats within 10 years. - Dec 23, 2025.csv';
const JSON_OUTPUT = '/Users/ozkanozdemir/Sandbox/gaers.bio/gaers-website/assets/data/publications.json';

/**
 * Parse CSV with proper quote handling
 * Handles multi-line quoted fields and commas within quotes
 */
function parseCSV(csvText) {
  // Remove BOM if present
  if (csvText.charCodeAt(0) === 0xFEFF) {
    csvText = csvText.slice(1);
  }

  const lines = [];
  let currentField = '';
  let currentRecord = [];
  let insideQuotes = false;
  let i = 0;

  while (i < csvText.length) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote ("")
        currentField += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
        i++;
        continue;
      }
    }

    if (!insideQuotes && char === ',') {
      // End of field
      currentRecord.push(currentField.trim());
      currentField = '';
      i++;
      continue;
    }

    if (!insideQuotes && (char === '\n' || char === '\r')) {
      // End of record
      if (currentField || currentRecord.length > 0) {
        currentRecord.push(currentField.trim());
        if (currentRecord.some(f => f.length > 0)) {
          lines.push(currentRecord);
        }
        currentRecord = [];
        currentField = '';
      }
      // Skip \r\n combo
      if (char === '\r' && nextChar === '\n') {
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    // Regular character
    currentField += char;
    i++;
  }

  // Handle last record
  if (currentField || currentRecord.length > 0) {
    currentRecord.push(currentField.trim());
    if (currentRecord.some(f => f.length > 0)) {
      lines.push(currentRecord);
    }
  }

  return lines;
}

/**
 * Validate and clean data
 */
function validatePublication(pub, rowNum) {
  const errors = [];

  // Validate year
  if (pub.year && (pub.year < 2015 || pub.year > 2025)) {
    errors.push(`Row ${rowNum}: Invalid year ${pub.year}`);
  }

  // Validate citations
  if (pub.citations && pub.citations < 0) {
    errors.push(`Row ${rowNum}: Negative citations`);
  }

  // Validate DOI format (basic check)
  if (pub.doi && !pub.doi.startsWith('10.')) {
    errors.push(`Row ${rowNum}: Invalid DOI format: ${pub.doi}`);
  }

  // Validate Consensus link
  if (pub.consensus_link && !pub.consensus_link.startsWith('http')) {
    errors.push(`Row ${rowNum}: Invalid Consensus link: ${pub.consensus_link}`);
  }

  return errors;
}

/**
 * Generate statistics from publications data
 */
function generateStatistics(publications) {
  const stats = {
    total_citations: 0,
    by_year: {},
    by_quartile: { Q1: 0, Q2: 0, Q3: 0, Q4: 0, Unranked: 0 },
    by_study_type: {},
    avg_citations: 0
  };

  publications.forEach(pub => {
    // Total citations
    stats.total_citations += pub.citations || 0;

    // By year
    const year = pub.year || 'Unknown';
    stats.by_year[year] = (stats.by_year[year] || 0) + 1;

    // By quartile
    const quartile = pub.sjr_quartile;
    if (quartile === '1') stats.by_quartile.Q1++;
    else if (quartile === '2') stats.by_quartile.Q2++;
    else if (quartile === '3') stats.by_quartile.Q3++;
    else if (quartile === '4') stats.by_quartile.Q4++;
    else stats.by_quartile.Unranked++;

    // By study type
    const studyType = pub.study_type || 'Not specified';
    stats.by_study_type[studyType] = (stats.by_study_type[studyType] || 0) + 1;
  });

  stats.avg_citations = publications.length > 0
    ? Math.round(stats.total_citations / publications.length * 10) / 10
    : 0;

  return stats;
}

/**
 * Main conversion function
 */
function convertCSVToJSON() {
  console.log('🔄 Starting CSV to JSON conversion...\n');
  console.log(`📂 Input:  ${CSV_INPUT}`);
  console.log(`📂 Output: ${JSON_OUTPUT}\n`);

  // Read CSV file
  const csvText = fs.readFileSync(CSV_INPUT, 'utf-8');
  console.log(`✅ Read CSV file (${csvText.length} characters)`);

  // Parse CSV
  const rows = parseCSV(csvText);
  console.log(`✅ Parsed ${rows.length} rows`);

  if (rows.length === 0) {
    throw new Error('No data found in CSV file');
  }

  // Get header row
  const headers = rows[0];
  console.log(`📋 Headers: ${headers.join(', ')}\n`);

  // Expected headers
  const expectedHeaders = [
    'Title', 'Takeaway', 'Authors', 'Year', 'Citations',
    'Abstract', 'Study Type', 'Journal', 'Journal SJR Quartile',
    'DOI', 'Consensus Link'
  ];

  // Validate headers
  if (headers.length !== expectedHeaders.length) {
    console.warn(`⚠️  Warning: Expected ${expectedHeaders.length} columns, found ${headers.length}`);
  }

  // Convert data rows
  const publications = [];
  const allErrors = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Skip empty rows
    if (row.every(field => !field || field.trim() === '')) {
      continue;
    }

    const pub = {
      id: i,
      title: row[0] || '',
      takeaway: row[1] || '',
      authors: row[2] || '',
      year: parseInt(row[3]) || null,
      citations: parseInt(row[4]) || 0,
      abstract: row[5] || '',
      study_type: row[6] || '',
      journal: row[7] || '',
      sjr_quartile: row[8] || '',
      doi: row[9] || '',
      consensus_link: row[10] || ''
    };

    // Validate
    const errors = validatePublication(pub, i + 1);
    if (errors.length > 0) {
      allErrors.push(...errors);
    }

    publications.push(pub);
  }

  console.log(`✅ Converted ${publications.length} publications\n`);

  // Show validation errors
  if (allErrors.length > 0) {
    console.log(`⚠️  ${allErrors.length} validation warnings:`);
    allErrors.slice(0, 10).forEach(err => console.log(`   ${err}`));
    if (allErrors.length > 10) {
      console.log(`   ... and ${allErrors.length - 10} more\n`);
    }
  } else {
    console.log(`✅ No validation errors\n`);
  }

  // Generate statistics
  const statistics = generateStatistics(publications);
  console.log('📊 Statistics:');
  console.log(`   Total publications: ${publications.length}`);
  console.log(`   Total citations: ${statistics.total_citations}`);
  console.log(`   Average citations: ${statistics.avg_citations}`);
  console.log(`   Year range: ${Math.min(...publications.map(p => p.year || 9999))} - ${Math.max(...publications.map(p => p.year || 0))}`);
  console.log(`   By quartile: Q1=${statistics.by_quartile.Q1}, Q2=${statistics.by_quartile.Q2}, Q3=${statistics.by_quartile.Q3}, Q4=${statistics.by_quartile.Q4}, Unranked=${statistics.by_quartile.Unranked}\n`);

  // Create output object
  const output = {
    metadata: {
      date_generated: new Date().toISOString(),
      source_file: path.basename(CSV_INPUT),
      description: 'GAERS Literature Database - Publications 2015-2025',
      total_publications: publications.length,
      date_range: {
        start: Math.min(...publications.map(p => p.year || 9999)),
        end: Math.max(...publications.map(p => p.year || 0))
      },
      statistics: statistics
    },
    publications: publications
  };

  // Write JSON file
  const jsonString = JSON.stringify(output, null, 2);
  fs.writeFileSync(JSON_OUTPUT, jsonString, 'utf-8');
  console.log(`✅ Wrote JSON file (${jsonString.length} characters, ${Math.round(jsonString.length / 1024)} KB)`);

  console.log('\n✨ Conversion complete!\n');
  console.log(`📄 Output file: ${JSON_OUTPUT}`);
  console.log(`📊 ${publications.length} publications ready for web display\n`);

  return output;
}

// Run conversion
try {
  convertCSVToJSON();
  process.exit(0);
} catch (error) {
  console.error('\n❌ Error during conversion:');
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
}
