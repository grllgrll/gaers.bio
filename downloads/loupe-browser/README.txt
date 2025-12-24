==============================================================================
GAERS.BIO - 10X GENOMICS LOUPE BROWSER FILES
==============================================================================

This directory contains spatial transcriptomics data files in .cloupe format
for interactive analysis with 10X Genomics Loupe Browser.

==============================================================================
INCLUDED FILES
==============================================================================

1. GAERS_P15_PreSeizure.cloupe (275 MB)
   - Sample ID: ga2p15_2
   - Timepoint: Postnatal day 15 (before seizure onset)
   - Platform: 10X Genomics Visium Spatial Gene Expression
   - Spots: ~5,000 spatial barcodes
   - Genes: ~20,000 detected
   - MD5: 75165a5804a3ccfffa72af6f1232de4f

2. GAERS_P30_SeizureOnset.cloupe (328 MB)
   - Sample ID: ga1p30_2
   - Timepoint: Postnatal day 30 (at seizure onset)
   - Platform: 10X Genomics Visium Spatial Gene Expression
   - Spots: ~5,000 spatial barcodes
   - Genes: ~20,000 detected
   - MD5: 011b9ca08f1b38f4e8bc3b9de6193f03

==============================================================================
WHAT'S INCLUDED IN .CLOUPE FILES
==============================================================================

Each .cloupe file contains:
  - Full spatial transcriptome data (~20,000 genes)
  - H&E tissue images with spatial coordinates
  - Gene expression matrices
  - Clustering and annotation data
  - Spatial analysis metadata

==============================================================================
REQUIREMENTS
==============================================================================

Software:
  - 10X Genomics Loupe Browser (free download)
  - Download from: https://www.10xgenomics.com/support/software/loupe-browser/downloads
  - Available for Windows, macOS, and Linux

System Requirements:
  - RAM: 8 GB minimum, 16 GB recommended
  - Disk Space: ~1 GB for both files
  - Display: 1280x720 minimum, 1920x1080 recommended

==============================================================================
QUICK START GUIDE
==============================================================================

1. Download Loupe Browser
   - Visit: https://www.10xgenomics.com/support/software/loupe-browser/downloads
   - Select your operating system (Windows, macOS, or Linux)
   - Download and install the application

2. Open .cloupe Files
   - Launch Loupe Browser
   - Click "Open" or drag .cloupe file into the window
   - Wait ~30 seconds for data to load

3. Explore Your Data
   - Query any gene's spatial expression pattern
   - Overlay expression on tissue histology images
   - Draw custom regions and compare expression
   - Perform differential expression analysis
   - Export high-resolution figures

==============================================================================
FILE VERIFICATION
==============================================================================

To verify file integrity after download, calculate MD5 checksums:

macOS/Linux:
  md5 GAERS_P15_PreSeizure.cloupe
  md5 GAERS_P30_SeizureOnset.cloupe

Windows (PowerShell):
  Get-FileHash GAERS_P15_PreSeizure.cloupe -Algorithm MD5
  Get-FileHash GAERS_P30_SeizureOnset.cloupe -Algorithm MD5

Compare output with MD5 values listed above.

==============================================================================
ADDITIONAL RESOURCES
==============================================================================

Website:
  - Complete Guide: https://gaers.bio/loupe-browser.html
  - Interactive Tutorials: https://gaers.bio/loupe-browser.html#tutorial
  - Download Other Data: https://gaers.bio/downloads.html

Official Documentation:
  - Loupe Browser User Guide:
    https://www.10xgenomics.com/support/software/loupe-browser/latest

  - Video Tutorials:
    https://www.10xgenomics.com/support/software/loupe-browser/latest/tutorials

  - Analysis Guides:
    https://www.10xgenomics.com/support/software/loupe-browser/latest/analysis

==============================================================================
TROUBLESHOOTING
==============================================================================

File won't open:
  - Ensure you're using the latest version of Loupe Browser
  - Verify file downloaded completely (check file size)
  - Verify file integrity using MD5 checksum

Application is slow:
  - Close other memory-intensive applications
  - Ensure you meet system requirements (8 GB RAM minimum)
  - Reduce number of genes displayed simultaneously

Can't find a gene:
  - Try alternative gene symbols (uppercase/lowercase)
  - Search using Ensembl ID instead
  - Use our gene search tool: https://gaers.bio/gene-search.html

==============================================================================
CITATION
==============================================================================

If you use this data in your research, please cite:

Özdemir, Ö. (2025). gaers.bio: Spatiotemporal transcriptomic analysis
of epileptogenesis in the GAERS model [Dataset]. TÜBİTAK Project 122S431.
https://gaers.bio

BibTeX:
@misc{ozdemir2025gaers,
  author = {Özdemir, Özkan},
  title = {gaers.bio: Spatiotemporal Transcriptomic Analysis of
           Epileptogenesis in the GAERS Model},
  year = {2025},
  note = {TÜBİTAK Project 122S431},
  url = {https://gaers.bio},
  urldate = {2025-01-01}
}

==============================================================================
CONTACT & SUPPORT
==============================================================================

Principal Investigator: Özkan Özdemir, Ph.D.
Project: TÜBİTAK 122S431
Website: https://gaers.bio

For questions about:
  - Loupe Browser software: Contact 10X Genomics support
  - GAERS data: Visit https://gaers.bio or check gaers.bio/methods.html
  - File issues: Verify checksums and re-download if needed

==============================================================================
LICENSE & TERMS
==============================================================================

Data Usage:
  - Academic Use: Free for non-commercial research and education
  - Attribution: Please cite appropriately (see CITATION section)
  - Redistribution: Permitted with proper attribution
  - Commercial Use: Contact PI for permission

==============================================================================
VERSION INFORMATION
==============================================================================

Files Generated: December 2025
Data Collection Period: 2023-2025
Loupe Browser Compatibility: v6.0+
Last Updated: December 2025

==============================================================================
Built with care for the GAERS research community
==============================================================================
