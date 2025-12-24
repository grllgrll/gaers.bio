# gaers.bio - GAERS Research Data Portal

**Spatiotemporal Transcriptomic Analysis of Epileptogenesis in the GAERS Model**

TÜBİTAK Project 122S431 | Principal Investigator: Özkan Özdemir, Ph.D.

---

## Quick Start

**Fastest way to run the website locally:**

**macOS/Linux:**
```bash
./start.sh
```

**Windows:**
```batch
start.bat
```

**macOS (Double-click):**
Double-click `start.command` in Finder

The server will start on http://localhost:8000 and your browser will open automatically.
Press Ctrl+C in the terminal to stop the server.

---

## Overview

gaers.bio is a comprehensive data portal for sharing spatiotemporal transcriptomic research findings from the GAERS (Genetic Absence Epilepsy Rats from Strasbourg) model. The website provides interactive visualizations, gene search capabilities, and complete dataset downloads for the scientific community.

### Key Features

- **Interactive Data Visualizations** - Volcano plots, bar charts, enrichment dot plots
- **Gene Search Engine** - Search 3,611 genes across all datasets with advanced filtering
- **Comprehensive Data Downloads** - JSON and CSV formats
- **Detailed Documentation** - Methods, protocols, and citations
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Accessibility** - WCAG AA compliant

---

## Project Structure

```
gaers-website/
├── index.html                  # Homepage
├── about.html                  # About GAERS research
├── bulk-rnaseq.html           # Bulk RNA-seq analysis page
├── spatial-transcriptomics.html # Spatial transcriptomics page (includes Loupe Browser guide)
├── gene-search.html           # Interactive gene search
├── methods.html               # Methods & protocols
├── publications.html          # Citations & publications
├── downloads.html             # Data downloads
│
├── downloads/
│   ├── loupe-browser/         # 10X Genomics Loupe Browser files
│   │   ├── GAERS_P15_PreSeizure.cloupe     # 275 MB
│   │   ├── GAERS_P30_SeizureOnset.cloupe   # 328 MB
│   │   └── README.txt         # Quick reference guide
│   │
│   └── spatial/               # Spatial transcriptomics CSV summaries
│       ├── spatial-p15-top-degs.csv        # Top 50 P15 DEGs
│       ├── spatial-p30-top-degs.csv        # Top 50 P30 DEGs
│       └── spatial-summary-statistics.csv  # Summary statistics
│
├── assets/
│   ├── css/
│   │   ├── main.css          # Core design system
│   │   └── components.css    # UI components
│   │
│   ├── js/
│   │   ├── charts.js         # Chart.js visualization library
│   │   ├── utils.js          # Utility functions
│   │   └── gene-search.js    # Gene search engine
│   │
│   ├── data/
│   │   ├── rnaseq-degs.json           # 593 bulk RNA-seq DEGs
│   │   ├── spatial-p15-degs.json      # 1,079 spatial P15 DEGs
│   │   ├── spatial-p30-degs.json      # 1,079 spatial P30 DEGs
│   │   ├── enrichment-data.json       # GO/Reactome enrichment
│   │   └── gene-master-index.json     # 3,611 genes database
│   │
│   └── vendor/
│       └── chart.min.js       # Chart.js v4.4.1
│
├── scripts/                   # Data conversion scripts
│   ├── package.json
│   ├── convert-rnaseq-data.js
│   ├── convert-spatial-data.js
│   ├── convert-enrichment-data.js
│   ├── build-gene-database.js
│   └── generate-csv-summaries.js  # Generate CSV summary files
│
├── README.md                  # This file
└── TESTING-REPORT.md         # Comprehensive testing report
```

---

## Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom design system with CSS Grid and Flexbox
- **JavaScript (ES6+)** - Modern JavaScript features
- **Chart.js v4.4.1** - Interactive data visualizations

### Data Processing
- **Node.js** - Data conversion scripts
- **CSV Parser** - CSV file processing

### No Build Process Required
- Pure HTML/CSS/JavaScript
- No frameworks or bundlers needed
- Ready to deploy as static files

---

## Data Sources

### 1. Bulk RNA-seq (LCM-based)
- **Comparison:** Ga30 (P30, seizure-onset) vs Ga15 (P15, pre-seizure)
- **DEGs:** 593 genes (560 upregulated, 33 downregulated)
- **Source:** `/Users/ozkanozdemir/Sandbox/takara_rna_rat/`
- **Analysis:** DESeq2

### 2. Spatial Transcriptomics (10X Visium)
- **Platform:** 10X Genomics Visium
- **Timepoints:** P15 (pre-seizure) and P30 (seizure-onset)
- **DEGs:** 1,079 genes per timepoint
- **Samples:** 8 total (4 P15, 4 P30)
- **Source:** `/Users/ozkanozdemir/Sandbox/gaers.bio/10XGenomics_Analysis/`

### 3. Enrichment Analysis
- **GO Terms:** Biological Process, Molecular Function
- **Reactome Pathways:** Curated biological pathways
- **Tool:** clusterProfiler (R)
- **Terms:** 43 significant enriched pathways

### 4. Seizure Genes
- **Source:** Human Phenotype Ontology (HP:0001250)
- **Genes:** 2,007 seizure-related genes
- **Integration:** Cross-referenced with expression data

---

## Local Development

### Important: Use a Local Web Server

The website uses JavaScript Fetch API to load data files, which requires serving via HTTP protocol. **Opening HTML files directly (file://) will not work** due to browser CORS security restrictions.

### Quick Start

**Option 1: Python (Recommended - Built into macOS)**
```bash
cd /Users/ozkanozdemir/Sandbox/gaers.bio/gaers-website
python3 -m http.server 8000
```
Visit: http://localhost:8000

**Option 2: Node.js**
```bash
npx http-server /Users/ozkanozdemir/Sandbox/gaers.bio/gaers-website -p 8000
```
Visit: http://localhost:8000

**Option 3: VS Code Live Server**
Install the "Live Server" extension, then right-click `index.html` → "Open with Live Server"

### Troubleshooting

If you see "Error loading spatial data" or "Error loading data":
- Ensure you're using http://localhost, not file://
- Check that data files exist in `assets/data/`
- View browser console (F12) for detailed error messages

---

## How to Deploy

### Option 1: Local Testing

1. **Open in Browser:**
   ```bash
   cd /Users/ozkanozdemir/Sandbox/gaers.bio/gaers-website
   open index.html  # macOS
   # Or drag index.html to browser
   ```

2. **Using Python HTTP Server:**
   ```bash
   cd /Users/ozkanozdemir/Sandbox/gaers.bio/gaers-website
   python3 -m http.server 8000
   # Visit http://localhost:8000
   ```

3. **Using Node.js HTTP Server:**
   ```bash
   npx http-server /Users/ozkanozdemir/Sandbox/gaers.bio/gaers-website -p 8000
   # Visit http://localhost:8000
   ```

### Option 2: Static Hosting (Recommended)

The website is designed as a static site and can be hosted on:

- **GitHub Pages** (Free, recommended for academic projects)
- **Netlify** (Free tier available, easy deployment)
- **Vercel** (Free tier available)
- **AWS S3 + CloudFront** (Scalable, professional)

#### GitHub Pages Deployment

**Prerequisites:**
- GitHub account
- Git installed on your computer
- Git LFS (Large File Storage) for .cloupe files >100MB

**Step-by-Step Guide:**

1. **Initialize Git repository** (if not already done)
   ```bash
   cd /Users/ozkanozdemir/Sandbox/gaers.bio/gaers-website
   git init
   ```

2. **Install and configure Git LFS** (for .cloupe files)
   ```bash
   # Install Git LFS (macOS with Homebrew)
   brew install git-lfs

   # Initialize Git LFS in repository
   git lfs install

   # Track .cloupe files
   git lfs track "*.cloupe"

   # Add .gitattributes file
   git add .gitattributes
   ```

3. **Create .gitignore file**
   ```bash
   # Create .gitignore to exclude unnecessary files
   cat > .gitignore << 'EOF'
   .DS_Store
   node_modules/
   *.log
   .vscode/
   EOF
   ```

4. **Add all files to Git**
   ```bash
   git add .
   git commit -m "Initial commit: GAERS research data portal"
   ```

5. **Create GitHub repository**
   - Go to https://github.com/new
   - Create repository (e.g., "gaers-website")
   - Do NOT initialize with README (we already have one)

6. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/gaers-website.git
   git branch -M main
   git push -u origin main
   ```

7. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: Deploy from branch
   - Branch: main, folder: / (root)
   - Click Save
   - Wait 1-2 minutes for deployment

8. **Access your site**
   - URL: `https://YOUR_USERNAME.github.io/gaers-website`
   - Check Actions tab for deployment status

**Important Notes:**
- Git LFS is required for .cloupe files (275MB and 328MB)
- First deployment may take 5-10 minutes
- Check repository Actions tab for build errors
- Custom domain can be configured in Settings → Pages

#### Netlify Deployment

1. Create account at netlify.com
2. Drag and drop the `gaers-website` folder
3. Configure custom domain (optional)
4. Site goes live immediately

---

## Data Conversion Scripts

The `scripts/` directory contains Node.js scripts that convert source CSV files to JSON format for web use.

### Running Data Conversion

```bash
cd scripts
npm install
node convert-rnaseq-data.js
node convert-spatial-data.js
node convert-enrichment-data.js
node build-gene-database.js
node generate-csv-summaries.js
```

### Scripts Overview

1. **convert-rnaseq-data.js** - Converts bulk RNA-seq DESeq2 results to JSON
2. **convert-spatial-data.js** - Converts 10X spatial transcriptomics data to JSON
3. **convert-enrichment-data.js** - Converts GO/Reactome enrichment results to JSON
4. **build-gene-database.js** - Builds master gene index from all sources
5. **generate-csv-summaries.js** - Generates CSV summary files (top 50 DEGs per timepoint)

---

## Key Features

### 1. Interactive Gene Search
- Search 3,611 unique genes across all datasets
- Filter by regulation (up/down), datasets, p-value, fold change
- Sortable columns with pagination
- Export filtered results to CSV
- Gene details modal with external links (Ensembl, NCBI)

### 2. Data Visualizations
- **Volcano Plots:** Interactive scatter plots of differential expression
- **Bar Charts:** Top upregulated and downregulated genes
- **Dot Plots:** GO enrichment results with gene ratios
- **Summary Cards:** Key statistics at a glance

### 3. Comprehensive Documentation
- **Methods:** Detailed experimental and computational protocols
- **Publications:** Citation formats (BibTeX, APA, MLA, Chicago)
- **Downloads:** All datasets available in JSON format

### 4. Responsive Design
- Works on all screen sizes (desktop, tablet, mobile)
- Mobile-friendly navigation with hamburger menu
- Touch-optimized interactive elements
- Accessible to users with disabilities

---

## Browser Support

### Fully Supported
- Chrome 100+ ✅
- Firefox 100+ ✅
- Safari 15+ ✅
- Edge 100+ ✅

### Not Supported
- Internet Explorer 11 ❌ (CSS Grid and ES6+ not supported)

---

## Dataset Statistics

| Dataset | Genes | Upregulated | Downregulated | Format |
|---------|-------|-------------|---------------|--------|
| Bulk RNA-seq | 593 | 560 (94.4%) | 33 (5.6%) | JSON |
| Spatial P15 | 1,079 | 509 (47.2%) | 570 (52.8%) | JSON |
| Spatial P30 | 1,079 | 565 (52.4%) | 514 (47.6%) | JSON |
| Enrichment | 43 terms | - | - | JSON |
| Seizure Genes | 2,007 | - | - | Text |
| **Master Index** | **3,611** | - | - | **JSON** |

---

## Performance Metrics

- **Page Load:** < 2 seconds on broadband
- **Data Files:**
  - Largest file: gene-master-index.json (~1 MB)
  - Total assets: ~2.5 MB
- **Interactivity:** Search results render in < 100ms
- **Charts:** Render in < 500ms

---

## Accessibility Features

- **Semantic HTML5** markup
- **ARIA labels** on interactive elements
- **Keyboard navigation** fully supported
- **Color contrast** meets WCAG AA standards
- **Responsive** to screen readers
- **Focus indicators** on all interactive elements

---

## Citation

If you use data from gaers.bio in your research, please cite:

```bibtex
@misc{ozdemir2025gaers,
  author = {Özdemir, Özkan},
  title = {gaers.bio: Spatiotemporal Transcriptomic Analysis of Epileptogenesis in the GAERS Model},
  year = {2025},
  note = {TÜBİTAK Project 122S431},
  url = {https://gaers.bio},
  urldate = {2025-01-01}
}
```

**APA Format:**
Özdemir, Ö. (2025). *gaers.bio: Spatiotemporal transcriptomic analysis of epileptogenesis in the GAERS model* [Dataset]. TÜBİTAK Project 122S431. https://gaers.bio

---

## Development Notes

### Design Principles
- **Modern & Clean** - Professional academic presentation
- **User-Friendly** - Intuitive navigation and search
- **Data-Driven** - Focus on research findings
- **Accessible** - Available to all researchers
- **Responsive** - Works on all devices

### Code Quality
- **Semantic HTML** - Proper document structure
- **Modular CSS** - Design system with CSS variables
- **Clean JavaScript** - Well-documented, maintainable code
- **No Dependencies** - Except Chart.js for visualizations

### Loupe Browser Integration

The website includes comprehensive integration of 10X Genomics Loupe Browser for advanced interactive spatial transcriptomics analysis.

**What's Included:**
- Complete Loupe Browser guide integrated into `spatial-transcriptomics.html`
- 2 .cloupe files (603 MB total):
  - GAERS_P15_PreSeizure.cloupe (275 MB) - Pre-seizure baseline
  - GAERS_P30_SeizureOnset.cloupe (328 MB) - Seizure-onset
- MD5 checksums for file verification
- Download cards and installation instructions
- Example workflows and troubleshooting guide
- Integration across multiple pages:
  - `spatial-transcriptomics.html`: Complete Loupe Browser guide with downloads
  - `downloads.html`: Loupe Browser files section with download cards
  - `index.html`: Loupe Browser overview section

**User Benefits:**
- Query 20,000+ genes interactively
- Overlay gene expression on H&E tissue images
- Draw custom regions and perform differential expression
- Export publication-quality figures
- Hybrid approach: Web visualizations for quick exploration + Loupe for deep analysis

**Files:**
- Downloads: `downloads/loupe-browser/` (2 .cloupe files + README.txt)
- Guide: Integrated into `spatial-transcriptomics.html#loupe-browser-guide`
- Styles: `assets/css/components.css` (Loupe-specific components)

### CSV Summary Files

Quick-access CSV files for researchers who prefer tabular data formats:

**What's Included:**
- **spatial-p15-top-degs.csv** - Top 25 upregulated and 25 downregulated genes at P15
- **spatial-p30-top-degs.csv** - Top 25 upregulated and 25 downregulated genes at P30
- **spatial-summary-statistics.csv** - Overview of DEG counts and statistics

**Use Cases:**
- Quick Excel/R/Python import for downstream analysis
- Publication tables without full dataset complexity
- Teaching and presentation materials
- Fast access to most significant changes

**Generation:**
Run `node scripts/generate-csv-summaries.js` to regenerate from JSON sources

### Future Enhancements
- [ ] Add print stylesheets for methods/publications
- [ ] Implement service worker for offline access
- [ ] Add loading spinners for data-heavy operations
- [ ] Focus trap in modals for better accessibility
- [ ] Progressive image loading for figures
- [ ] Add video tutorials for Loupe Browser workflows
- [ ] Create sample analysis workflows with screenshots

---

## Support & Contact

**Principal Investigator:**
Özkan Özdemir, Ph.D.

**Project:**
TÜBİTAK Project 122S431

**Funding:**
The Scientific and Technological Research Council of Turkey (TÜBİTAK)

**Website:**
https://gaers.bio (when deployed)

---

## License & Terms of Use

- **Academic Use:** Free for non-commercial research and education
- **Attribution:** Please cite this resource appropriately
- **Redistribution:** Permitted with proper attribution
- **Commercial Use:** Contact PI for permission

---

## Testing

A comprehensive testing report is available in `TESTING-REPORT.md` covering:
- Responsive design across breakpoints
- Accessibility compliance (WCAG AA)
- Cross-browser compatibility
- Performance metrics
- Feature testing

**Overall Assessment:** ✅ APPROVED FOR PRODUCTION

---

## Acknowledgments

This research is supported by **The Scientific and Technological Research Council of Turkey (TÜBİTAK)** under Project Number **122S431**.

We thank the open-source community for:
- **Chart.js** - Data visualization library
- **CommonMark** - Markdown specification
- **MDN Web Docs** - Web development documentation

---

## Version History

**v1.0** (December 2025)
- Initial release
- All 8 pages complete
- 3,611 genes database
- Interactive visualizations
- Gene search engine
- Complete documentation
- Loupe Browser integration with .cloupe file downloads
- CSV summary files for quick data access

---

*Built with care for the GAERS research community*
