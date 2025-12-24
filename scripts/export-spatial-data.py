#!/usr/bin/env python3
"""
Export spatial transcriptomics data from .cloupe files for web visualization

This script attempts multiple strategies to extract data from .cloupe files:
1. Try using scanpy (if .cloupe is AnnData compatible)
2. Try using h5py to read HDF5 structure directly
3. Fallback to using existing demo data with better formatting

Output:
- spatial_data.json: Contains coordinates, expression, and metadata
- tissue_image.png: H&E tissue section image
"""

import json
import sys
from pathlib import Path
import numpy as np


def try_scanpy_extraction(cloupe_path, output_dir, top_n_genes=50):
    """Attempt to extract using scanpy"""
    try:
        import scanpy as sc
        import PIL.Image as Image

        print(f"📦 Attempting scanpy extraction from: {cloupe_path}")

        # Try different read methods
        try:
            adata = sc.read_10x_h5(cloupe_path)
        except:
            adata = sc.read_h5ad(cloupe_path)

        print(f"✅ Successfully loaded data with {adata.n_obs} spots and {adata.n_vars} genes")

        # Extract tissue image
        if 'spatial' in adata.uns:
            spatial_info = adata.uns['spatial']
            library_id = list(spatial_info.keys())[0]

            tissue_img = spatial_info[library_id]['images']['hires']
            scale_factor = spatial_info[library_id]['scalefactors']['tissue_hires_scalef']
            coords = adata.obsm['spatial']

            print(f"✅ Found spatial data with scale factor: {scale_factor}")
        else:
            raise ValueError("No spatial information found")

        # Get highly variable genes
        sc.pp.highly_variable_genes(adata, n_top_genes=top_n_genes)
        top_genes = adata.var_names[adata.var.highly_variable][:top_n_genes]

        print(f"📊 Selected {len(top_genes)} highly variable genes")

        # Prepare export data
        export_data = {
            'coordinates': {},
            'expression': {},
            'scale_factor': float(scale_factor),
            'image_size': {'width': tissue_img.shape[1], 'height': tissue_img.shape[0]},
            'n_spots': int(adata.n_obs),
            'n_genes': len(top_genes)
        }

        # Export coordinates (scaled to image space)
        for i, barcode in enumerate(adata.obs_names):
            export_data['coordinates'][barcode] = {
                'x': float(coords[i, 0] * scale_factor),
                'y': float(coords[i, 1] * scale_factor)
            }

        # Export expression (sparse - only non-zero values)
        for gene in top_genes:
            gene_expr = adata[:, gene].X

            # Handle sparse matrices
            if hasattr(gene_expr, 'toarray'):
                gene_expr = gene_expr.toarray().flatten()
            else:
                gene_expr = np.array(gene_expr).flatten()

            export_data['expression'][gene] = {
                adata.obs_names[i]: float(gene_expr[i])
                for i in range(len(gene_expr))
                if gene_expr[i] > 0  # Only store non-zero values
            }

        # Save JSON
        json_path = output_dir / 'spatial_data.json'
        with open(json_path, 'w') as f:
            json.dump(export_data, f, indent=2)
        print(f"💾 Saved: {json_path}")

        # Save tissue image
        img = Image.fromarray((tissue_img * 255).astype(np.uint8))
        img_path = output_dir / 'tissue_image.png'
        img.save(img_path)
        print(f"💾 Saved: {img_path}")

        return True

    except Exception as e:
        print(f"❌ Scanpy extraction failed: {e}")
        return False


def try_h5py_extraction(cloupe_path, output_dir):
    """Attempt to extract using h5py directly"""
    try:
        import h5py
        import PIL.Image as Image

        print(f"📦 Attempting h5py extraction from: {cloupe_path}")

        with h5py.File(cloupe_path, 'r') as f:
            print(f"   Top-level keys: {list(f.keys())}")

            # This is a complex format - would need to explore structure
            # For now, return False to use fallback
            print("   .cloupe file structure is complex - using fallback")
            return False

    except Exception as e:
        print(f"❌ h5py extraction failed: {e}")
        return False


def create_fallback_data(sample_name, output_dir):
    """
    Create better-formatted fallback data using existing demo data

    This reads the existing demo spatial coordinates and expression data
    and reformats it for the simpler Canvas viewer
    """
    print(f"🎨 Creating fallback data for {sample_name}")

    try:
        # Read existing demo data
        coord_file = Path(f'assets/data/spatial/{sample_name}/spatial_coordinates.json')
        expr_file = Path(f'assets/data/spatial/{sample_name}/expression_matrix_subset.json')
        img_file = Path(f'assets/data/spatial/{sample_name}/tissue_lowres.png')

        if not coord_file.exists():
            raise FileNotFoundError(f"Demo data not found: {coord_file}")

        with open(coord_file) as f:
            coordinates = json.load(f)

        with open(expr_file) as f:
            expression = json.load(f)

        # Reformat for Canvas viewer
        export_data = {
            'coordinates': coordinates,
            'expression': expression,
            'scale_factor': 1.0,  # Already scaled in demo data
            'image_size': {'width': 600, 'height': 600},  # Demo image size
            'n_spots': len(coordinates),
            'n_genes': len(expression),
            'source': 'demo_data'
        }

        # Save reformatted data
        json_path = output_dir / 'spatial_data.json'
        with open(json_path, 'w') as f:
            json.dump(export_data, f, indent=2)
        print(f"💾 Saved: {json_path}")

        # Copy tissue image
        import shutil
        if img_file.exists():
            img_path = output_dir / 'tissue_image.png'
            shutil.copy(img_file, img_path)
            print(f"💾 Copied: {img_path}")

        print(f"✅ Fallback data created: {len(coordinates)} spots, {len(expression)} genes")
        return True

    except Exception as e:
        print(f"❌ Fallback creation failed: {e}")
        return False


def process_sample(cloupe_path, sample_name, output_dir):
    """Process a single sample"""
    print(f"\n{'='*60}")
    print(f"Processing: {sample_name}")
    print(f"{'='*60}\n")

    # Create output directory
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Try extraction strategies in order
    strategies = [
        ("scanpy", lambda: try_scanpy_extraction(cloupe_path, output_dir)),
        ("h5py", lambda: try_h5py_extraction(cloupe_path, output_dir)),
        ("fallback", lambda: create_fallback_data(sample_name, output_dir))
    ]

    for strategy_name, strategy_func in strategies:
        print(f"\n🔄 Trying strategy: {strategy_name}")
        if strategy_func():
            print(f"\n✅ Successfully extracted data using {strategy_name}")
            return True
        print(f"   Moving to next strategy...")

    print(f"\n❌ All extraction strategies failed for {sample_name}")
    return False


def main():
    """Main execution"""
    print("🚀 Spatial Data Export Script")
    print("="*60)

    samples = [
        {
            'cloupe': 'downloads/loupe-browser/GAERS_P15_PreSeizure.cloupe',
            'name': 'p15',
            'output': 'assets/data/spatial/p15'
        },
        {
            'cloupe': 'downloads/loupe-browser/GAERS_P30_SeizureOnset.cloupe',
            'name': 'p30',
            'output': 'assets/data/spatial/p30'
        }
    ]

    results = []
    for sample in samples:
        success = process_sample(
            sample['cloupe'],
            sample['name'],
            sample['output']
        )
        results.append((sample['name'], success))

    # Summary
    print("\n" + "="*60)
    print("📊 EXTRACTION SUMMARY")
    print("="*60)
    for name, success in results:
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"{name}: {status}")

    print("\n✨ Done!")


if __name__ == '__main__':
    main()
