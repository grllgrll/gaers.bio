# GAERS Website Development Guide

Complete developer documentation for maintaining and extending the gaers.bio research portal.

---

## Table of Contents

1. [Development Environment](#development-environment)
2. [Architecture Overview](#architecture-overview)
3. [File Organization](#file-organization)
4. [Code Conventions](#code-conventions)
5. [Making Changes](#making-changes)
6. [Data Management](#data-management)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [Contributing](#contributing)

---

## Development Environment

### Prerequisites

- **macOS, Linux, or Windows** with modern browser
- **Text Editor:** VS Code, Sublime Text, or similar
- **Web Browser:** Chrome 100+, Firefox 100+, Safari 15+, or Edge 100+
- **Node.js 16+** (for data conversion scripts only)
- **Git** (for version control)
- **Python 3** (built-in on macOS, for local server)

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ritwickdey.LiveServer",
    "ms-vscode.vscode-json-validation"
  ]
}
```

### Setting Up Local Development Server

**Critical:** This website MUST be served via HTTP due to JavaScript Fetch API and CORS restrictions.

#### Quick Start (Recommended)

We provide startup scripts for easy local development:

**On macOS/Linux:**
```bash
chmod +x start.sh  # First time only
./start.sh
```

**On Windows:**
```batch
start.bat
```

**On macOS (via Finder):**
1. First time: Right-click `start.command` → Get Info → Check "Open with Terminal"
2. Double-click `start.command` to start server

The script will:
- ✅ Check Python 3 is installed
- ✅ Check port 8000 is available
- ✅ Start HTTP server
- ✅ Open browser automatically
- ✅ Display helpful URLs

**Custom Port:**
```bash
./start.sh 8080  # Use port 8080 instead
```

#### Manual Start (Alternative)

If you prefer to start the server manually without using the startup scripts:

**Option 1: Python HTTP Server**

```bash
cd /Users/ozkanozdemir/Sandbox/gaers.bio/gaers-website
python3 -m http.server 8000

# Visit: http://localhost:8000
```

#### Option 2: VS Code Live Server

1. Install "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"
3. Automatic reload on file changes

#### Option 3: Node.js http-server

```bash
npm install -g http-server
http-server /path/to/gaers-website -p 8000
```

### Verifying Setup

1. Start local server
2. Navigate to http://localhost:8000
3. Check browser console (F12) for errors
4. Test navigation across all 8 pages
5. Verify data loads in gene-search.html

---

## Architecture Overview

### Technology Stack

- **Frontend:** Pure HTML5, CSS3, JavaScript ES6+
- **No Framework:** Vanilla JavaScript for maximum performance
- **Charts:** Chart.js v4.4.1 for data visualizations
- **Build Process:** None required (static files)

### Design Patterns

**Single Page Components:** Each page is self-contained with inline JavaScript

**Data Loading Pattern:**
```javascript
// Standard pattern used across all pages
async function loadData() {
  try {
    const response = await fetch('assets/data/dataset.json');
    if (!response.ok) throw new Error('HTTP error');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    displayError(error.message);
  }
}
```

**Error Handling:**
- User-friendly error messages
- Fallback UI states
- Console logging for debugging

**Responsive Design:**
- Mobile-first CSS approach
- CSS Grid and Flexbox layouts
- Breakpoints: 768px (tablet), 1024px (desktop)

---

## File Organization

### Directory Structure

```
gaers-website/
├── HTML Pages (8 total)
│   ├── index.html                   # Homepage
│   ├── about.html                   # Research overview
│   ├── bulk-rnaseq.html            # Bulk RNA-seq results
│   ├── spatial-transcriptomics.html # Spatial data + Loupe guide
│   ├── gene-search.html            # Interactive search
│   ├── methods.html                # Protocols
│   ├── publications.html           # Citations
│   └── downloads.html              # Data downloads
│
├── CSS Styling
│   ├── assets/css/main.css         # Design system (700 lines)
│   └── assets/css/components.css   # UI components (300 lines)
│
├── JavaScript
│   ├── assets/js/charts.js         # Chart.js configurations
│   ├── assets/js/utils.js          # Utility functions
│   └── assets/js/gene-search.js    # Search engine logic
│
├── Data Files (JSON + CSV)
│   ├── assets/data/*.json          # Research datasets
│   └── downloads/spatial/*.csv     # CSV summaries
│
├── Loupe Browser Files
│   └── downloads/loupe-browser/*.cloupe  # 10X Genomics files
│
└── Scripts
    └── scripts/*.js                # Data conversion tools
```

### Key Files and Their Roles

| File | Purpose | Lines | Complexity |
|------|---------|-------|------------|
| `main.css` | Design system, layout | 700 | Medium |
| `components.css` | Reusable UI components | 300 | Low |
| `gene-search.js` | Search engine logic | 400 | High |
| `charts.js` | Chart configurations | 200 | Medium |
| `spatial-transcriptomics.html` | Spatial data page | 600 | Medium |
| `gene-master-index.json` | 3,611 genes database | 1MB | Large |

---

## Code Conventions

### HTML Style Guide

**Semantic HTML5:**
```html
<!-- Good -->
<header>
  <nav class="container">
    <ul class="nav-menu">...</ul>
  </nav>
</header>

<!-- Avoid -->
<div class="header">
  <div class="nav">...</div>
</div>
```

**Accessibility:**
- Use semantic tags (`<nav>`, `<main>`, `<section>`)
- Add ARIA labels to interactive elements
- Ensure keyboard navigation works
- Maintain color contrast ratios (WCAG AA)

### CSS Style Guide

**CSS Variables for Consistency:**
```css
:root {
  --primary-color: #0d6efd;
  --secondary-color: #6c757d;
  --success-color: #198754;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  --info-color: #0dcaf0;

  --text-primary: #212529;
  --text-secondary: #6c757d;
  --background: #ffffff;
  --card-background: #f8f9fa;
}
```

**Class Naming Convention:**
- `.btn` - Generic button
- `.btn-primary` - Variant modifier
- `.btn-sm` - Size modifier
- `.card-header` - Component part

**Grid System:**
```css
.grid {
  display: grid;
  gap: 1rem;
}
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }
```

### JavaScript Style Guide

**ES6+ Features:**
```javascript
// Use const/let, not var
const data = await fetchData();
let filteredResults = [];

// Arrow functions
const processGene = (gene) => ({
  ...gene,
  significant: gene.padj < 0.05
});

// Template literals
const message = `Found ${count} genes`;

// Destructuring
const { symbol, log2fc, padj } = gene;
```

**Error Handling:**
```javascript
// Always use try-catch with async/await
async function loadData() {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Load error:', error);
    displayErrorMessage('Failed to load data');
    return null;
  }
}
```

**Code Organization:**
```javascript
// 1. Constants at top
const DATA_URL = 'assets/data/genes.json';
const PAGE_SIZE = 50;

// 2. Utility functions
function formatNumber(n) { ... }

// 3. Data loading functions
async function loadGenes() { ... }

// 4. UI update functions
function displayResults(data) { ... }

// 5. Event handlers
function handleSearch(event) { ... }

// 6. Initialization
document.addEventListener('DOMContentLoaded', init);
```

---

## Making Changes

### Adding a New Page

1. **Create HTML file** following existing template:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Page | gaers.bio</title>
  <link rel="stylesheet" href="assets/css/main.css">
  <link rel="stylesheet" href="assets/css/components.css">
</head>
<body>
  <!-- Copy header/nav from index.html -->
  <header>...</header>

  <!-- Your content -->
  <main>...</main>

  <!-- Copy footer from index.html -->
  <footer>...</footer>
</body>
</html>
```

2. **Update navigation** in ALL 8 existing pages:
```html
<ul class="nav-menu">
  <!-- Add new menu item -->
  <li><a href="new-page.html">New Page</a></li>
</ul>
```

3. **Update footer** if adding to Resources/Data sections

4. **Test** navigation from all pages

### Modifying Navigation

**Current navigation structure (8 items):**
- Home
- About
- Spatial Transcriptomics
- Bulk RNA-seq
- Gene Search
- Methods
- Publications
- Downloads

**To modify:**
1. Edit navigation in all 8 HTML files
2. Update `class="active"` on appropriate page
3. Test mobile menu (hamburger icon)
4. Verify link targets exist

### Updating Data

**JSON Data Files:**
Located in `assets/data/`:
- `rnaseq-degs.json` - Bulk RNA-seq results
- `spatial-p15-degs.json` - Spatial P15 DEGs
- `spatial-p30-degs.json` - Spatial P30 DEGs
- `enrichment-data.json` - GO/Reactome pathways
- `gene-master-index.json` - Integrated database

**To update data:**

1. **Edit source CSV files** in original data directories

2. **Run conversion scripts:**
```bash
cd scripts
npm install
node convert-rnaseq-data.js
node convert-spatial-data.js
node convert-enrichment-data.js
node build-gene-database.js
node generate-csv-summaries.js
```

3. **Verify output:**
```bash
# Check file sizes
ls -lh ../assets/data/*.json
ls -lh ../downloads/spatial/*.csv

# Validate JSON syntax
cat ../assets/data/rnaseq-degs.json | jq '.' > /dev/null
```

4. **Test in browser:**
- Reload affected pages
- Check browser console for errors
- Verify data displays correctly

### Adding New Visualizations

**Using Chart.js:**

1. **Include Chart.js** (already loaded via CDN):
```html
<script src="assets/vendor/chart.min.js"></script>
```

2. **Create canvas element:**
```html
<canvas id="myChart" style="max-height: 400px;"></canvas>
```

3. **Configure chart:**
```javascript
const ctx = document.getElementById('myChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: genes.map(g => g.symbol),
    datasets: [{
      label: 'Log2 Fold Change',
      data: genes.map(g => g.log2fc),
      backgroundColor: genes.map(g =>
        g.log2fc > 0 ? '#198754' : '#dc3545'
      )
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    }
  }
});
```

4. **See `charts.js`** for reusable chart configurations

---

## Data Management

### Data Flow

```
Source CSV Files
    ↓
Node.js Conversion Scripts
    ↓
JSON Files (assets/data/)
    ↓
JavaScript Fetch API
    ↓
DOM Rendering
```

### JSON Data Structure

**Differential Expression Files:**
```json
{
  "genes": [
    {
      "symbol": "Cacna1g",
      "name": "calcium voltage-gated channel subunit alpha1 G",
      "ensembl_id": "ENSRNOG00000018056",
      "log2fc": 1.234,
      "padj": 0.001,
      "regulation": "up",
      "significant": true
    }
  ],
  "metadata": {
    "total_genes": 593,
    "upregulated": 560,
    "downregulated": 33
  }
}
```

### CSV Summary Files

**Generated by:** `scripts/generate-csv-summaries.js`

**Format:**
```csv
Symbol,Gene_Name,logFC,Average_Expression,t_Statistic,P_Value,Adjusted_P_Value,Regulation
Gpx4,glutathione peroxidase 4,4.9595,10.3360,39.3910,4.3659e-8,4.7108e-5,Up
```

**Columns:**
- Symbol: Gene symbol (e.g., Gpx4)
- Gene_Name: Full gene name
- logFC: Log2 fold change
- Average_Expression: Mean expression level
- t_Statistic: Statistical test value
- P_Value: Raw p-value
- Adjusted_P_Value: FDR-corrected p-value
- Regulation: "Up" or "Down"

---

## Testing

### Manual Testing Checklist

**Before committing changes:**

- [ ] All 8 pages load without errors
- [ ] Navigation works from every page
- [ ] Mobile menu (hamburger) functions correctly
- [ ] All data visualizations render
- [ ] Gene search returns results
- [ ] CSV/JSON downloads work
- [ ] .cloupe file downloads work (large files)
- [ ] Footer links are correct
- [ ] No console errors (F12 developer tools)
- [ ] Responsive design works (mobile, tablet, desktop)

### Browser Testing

Test in multiple browsers:
- Chrome (primary)
- Firefox
- Safari
- Edge

**Responsive breakpoints:**
- Mobile: 375px width
- Tablet: 768px width
- Desktop: 1024px+ width

### Data Validation

**Verify JSON files:**
```bash
# Validate syntax
cat assets/data/rnaseq-degs.json | jq '.' > /dev/null
cat assets/data/spatial-p15-degs.json | jq '.' > /dev/null

# Check gene counts
cat assets/data/rnaseq-degs.json | jq '.genes | length'  # Should be 593
cat assets/data/spatial-p15-degs.json | jq '.genes | length'  # Should be 1079
```

**Verify CSV files:**
```bash
# Check row counts (including header)
wc -l downloads/spatial/*.csv
# spatial-p15-top-degs.csv: 51 (header + 50 genes)
# spatial-p30-top-degs.csv: 51
# spatial-summary-statistics.csv: 3 (header + 2 timepoints)
```

### Performance Testing

**Page Load Speed:**
```bash
# Using curl to measure load time
time curl -o /dev/null -s -w '%{time_total}\n' http://localhost:8000/index.html
```

**Large File Downloads:**
```bash
# Verify .cloupe file integrity
md5 downloads/loupe-browser/GAERS_P15_PreSeizure.cloupe
# Should match: 75165a5804a3ccfffa72af6f1232de4f

md5 downloads/loupe-browser/GAERS_P30_SeizureOnset.cloupe
# Should match: 011b9ca08f1b38f4e8bc3b9de6193f03
```

---

## Deployment

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No console errors in any page
- [ ] Data files up to date
- [ ] README.md reflects current state
- [ ] Git LFS tracking .cloupe files
- [ ] .gitignore excludes node_modules, .DS_Store

### GitHub Pages Deployment

**Step-by-Step:**

```bash
# 1. Initialize Git (if not done)
git init

# 2. Install Git LFS
brew install git-lfs
git lfs install

# 3. Track large files
git lfs track "*.cloupe"
git add .gitattributes

# 4. Create .gitignore
cat > .gitignore << 'EOF'
.DS_Store
node_modules/
*.log
.vscode/
EOF

# 5. Add all files
git add .
git commit -m "Initial commit: GAERS research portal"

# 6. Create GitHub repository and push
git remote add origin https://github.com/USERNAME/gaers-website.git
git branch -M main
git push -u origin main

# 7. Enable GitHub Pages
# Go to Settings → Pages → Deploy from branch: main
```

**Verify deployment:**
- URL: https://USERNAME.github.io/gaers-website
- Check Actions tab for build status
- Test all pages and downloads

### Alternative: Netlify

```bash
# Option 1: Drag and drop
# Visit netlify.com, drag gaers-website folder

# Option 2: Netlify CLI
npm install -g netlify-cli
netlify login
netlify deploy --dir=. --prod
```

---

## Troubleshooting

### Common Issues

**Problem: "Failed to load data" errors**

Solution:
```bash
# Must use HTTP server, not file://
python3 -m http.server 8000
# Then visit http://localhost:8000
```

**Problem: Navigation menu doesn't work on mobile**

Solution:
```javascript
// Check mobile nav script is present in <script> tag
document.addEventListener('DOMContentLoaded', function() {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
  }
});
```

**Problem: Charts not rendering**

Solution:
1. Check Chart.js is loaded: `<script src="assets/vendor/chart.min.js"></script>`
2. Verify canvas element exists: `<canvas id="chartId"></canvas>`
3. Check browser console for errors
4. Ensure data is loaded before creating chart

**Problem: Gene search not working**

Solution:
1. Verify `gene-master-index.json` exists and loads
2. Check browser console for fetch errors
3. Ensure search input has correct ID: `id="searchInput"`
4. Verify table body exists: `id="geneTableBody"`

**Problem: .cloupe files won't download**

Solution:
1. Check files exist in `downloads/loupe-browser/`
2. Verify file sizes: P15 (275MB), P30 (328MB)
3. If using GitHub Pages, ensure Git LFS is set up
4. Check download attribute: `<a href="..." download>`

**Problem: Styling broken on some pages**

Solution:
1. Verify CSS files linked: `main.css` and `components.css`
2. Check for CSS syntax errors
3. Ensure CSS variables are defined in `:root`
4. Clear browser cache (Cmd+Shift+R)

---

## Contributing

### Workflow

1. **Create feature branch**
```bash
git checkout -b feature/new-feature
```

2. **Make changes** following code conventions

3. **Test thoroughly**
- Run manual testing checklist
- Test in multiple browsers
- Verify responsive design

4. **Commit with clear message**
```bash
git add .
git commit -m "feat: Add volcano plot to spatial page

- Add new Chart.js volcano plot visualization
- Update spatial-transcriptomics.html layout
- Add volcano plot data processing in charts.js"
```

5. **Push and create pull request**
```bash
git push origin feature/new-feature
```

### Commit Message Format

```
type(scope): Brief description

- Detailed change 1
- Detailed change 2
- Detailed change 3

Closes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: CSS/formatting changes
- `refactor`: Code restructuring
- `test`: Testing additions
- `chore`: Maintenance tasks

### Code Review Checklist

- [ ] Code follows style guide
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Accessible (keyboard nav, ARIA labels)
- [ ] Documentation updated
- [ ] All tests passing
- [ ] No breaking changes (or documented)

---

## Contact & Support

**Principal Investigator:**
Özkan Özdemir, Ph.D.

**Project:**
TÜBİTAK Project 122S431

**Documentation:**
- README.md - User guide and overview
- DEVELOPMENT.md - This file (developer guide)
- TESTING-REPORT.md - Comprehensive testing results

---

*Last Updated: December 2025*
