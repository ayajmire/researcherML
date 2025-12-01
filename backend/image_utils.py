"""
Image Dataset Organization Utilities
Supports multiple organizational patterns for image datasets
"""
import os
import zipfile
import csv
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import pandas as pd
from PIL import Image
import io


def detect_dataset_structure(upload_path: str) -> Dict[str, Any]:
    """
    Detect the organizational structure of an image dataset
    
    Returns structure information including:
    - Pattern type (separate_folders, folder_based, csv_mapping, manual)
    - Images location
    - Labels location (if applicable)
    - Sample structure
    """
    structure_info = {
        "pattern": "unknown",
        "images_path": None,
        "labels_path": None,
        "images_count": 0,
        "labels_count": 0,
        "structure": {}
    }
    
    # Check if it's a ZIP file
    if upload_path.endswith('.zip'):
        return detect_zip_structure(upload_path)
    
    # Check if it's a directory
    if os.path.isdir(upload_path):
        return detect_directory_structure(upload_path)
    
    return structure_info


def detect_zip_structure(zip_path: str) -> Dict[str, Any]:
    """Detect structure of a ZIP file containing image dataset"""
    structure_info = {
        "pattern": "unknown",
        "images_path": None,
        "labels_path": None,
        "images_count": 0,
        "labels_count": 0,
        "structure": {}
    }
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        file_list = zip_ref.namelist()
        
        # Find all images and potential label files
        image_files = [f for f in file_list if is_image_file(f)]
        csv_files = [f for f in file_list if f.endswith('.csv')]
        txt_files = [f for f in file_list if f.endswith('.txt')]
        json_files = [f for f in file_list if f.endswith('.json')]
        
        # Pattern 1: Separate folders (images/ + labels/)
        if any('images' in f.lower() for f in file_list) and \
           (any('labels' in f.lower() for f in file_list) or csv_files or txt_files):
            structure_info["pattern"] = "separate_folders"
            # Find images folder
            images_folders = [f for f in file_list if 'image' in f.lower() and f.endswith('/')]
            labels_folders = [f for f in file_list if 'label' in f.lower() and f.endswith('/')]
            
            if images_folders:
                structure_info["images_path"] = images_folders[0]
            if labels_folders:
                structure_info["labels_path"] = labels_folders[0]
            elif csv_files:
                structure_info["labels_path"] = csv_files[0]
            elif txt_files:
                structure_info["labels_path"] = txt_files[0] if txt_files else None
            
            structure_info["images_count"] = len(image_files)
            structure_info["labels_count"] = len(csv_files) + len(txt_files) + len(json_files)
        
        # Pattern 2: Folder-based labeling (positive/, negative/, class1/, etc.)
        elif len([f for f in file_list if f.count('/') == 2 and is_image_file(f)]) > 0:
            # Images are in subfolders (2 levels: root/folder/image.jpg)
            structure_info["pattern"] = "folder_based"
            # Extract folder names (labels)
            folders = set()
            for f in image_files:
                parts = f.split('/')
                if len(parts) >= 2:
                    folders.add(parts[-2])  # Folder name before image
            
            structure_info["structure"] = {
                "folders": list(folders),
                "folder_counts": {folder: len([f for f in image_files if f'/{folder}/' in f]) 
                                for folder in folders}
            }
            structure_info["images_count"] = len(image_files)
            structure_info["labels_count"] = len(folders)
        
        # Pattern 3: CSV mapping
        elif csv_files and image_files:
            structure_info["pattern"] = "csv_mapping"
            structure_info["images_path"] = "images"  # Assume images in root or images/ folder
            structure_info["labels_path"] = csv_files[0]
            structure_info["images_count"] = len(image_files)
            structure_info["labels_count"] = 1  # One CSV file
        
        # Pattern 4: Manual (just images, no labels)
        elif image_files:
            structure_info["pattern"] = "manual"
            structure_info["images_path"] = "root"
            structure_info["images_count"] = len(image_files)
            structure_info["labels_count"] = 0
    
    return structure_info


def detect_directory_structure(dir_path: str) -> Dict[str, Any]:
    """Detect structure of a directory containing image dataset"""
    structure_info = {
        "pattern": "unknown",
        "images_path": None,
        "labels_path": None,
        "images_count": 0,
        "labels_count": 0,
        "structure": {}
    }
    
    # Find all images and potential label files
    image_files = []
    csv_files = []
    txt_files = []
    json_files = []
    folders = []
    
    for root, dirs, files in os.walk(dir_path):
        for file in files:
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, dir_path)
            
            if is_image_file(file):
                image_files.append(rel_path)
            elif file.endswith('.csv'):
                csv_files.append(rel_path)
            elif file.endswith('.txt'):
                txt_files.append(rel_path)
            elif file.endswith('.json'):
                json_files.append(rel_path)
        
        # Check for folders at first level
        if root == dir_path:
            folders = dirs
    
    # Pattern detection (same logic as ZIP)
    if any('image' in f.lower() for f in os.listdir(dir_path)) and \
       (any('label' in f.lower() for f in os.listdir(dir_path)) or csv_files):
        structure_info["pattern"] = "separate_folders"
        # Find images and labels folders
        for item in os.listdir(dir_path):
            item_path = os.path.join(dir_path, item)
            if os.path.isdir(item_path):
                if 'image' in item.lower():
                    structure_info["images_path"] = item
                elif 'label' in item.lower():
                    structure_info["labels_path"] = item
            elif item.endswith('.csv'):
                structure_info["labels_path"] = item
        
        structure_info["images_count"] = len(image_files)
        structure_info["labels_count"] = len(csv_files) + len(txt_files)
    
    elif folders and any(os.path.isdir(os.path.join(dir_path, f)) for f in folders):
        # Check if folders contain images (folder-based labeling)
        folder_image_counts = {}
        for folder in folders:
            folder_path = os.path.join(dir_path, folder)
            folder_images = [f for f in os.listdir(folder_path) 
                           if is_image_file(f) and os.path.isfile(os.path.join(folder_path, f))]
            if folder_images:
                folder_image_counts[folder] = len(folder_images)
        
        if folder_image_counts:
            structure_info["pattern"] = "folder_based"
            structure_info["structure"] = {
                "folders": list(folder_image_counts.keys()),
                "folder_counts": folder_image_counts
            }
            structure_info["images_count"] = len(image_files)
            structure_info["labels_count"] = len(folder_image_counts)
    
    elif csv_files and image_files:
        structure_info["pattern"] = "csv_mapping"
        structure_info["images_path"] = dir_path
        structure_info["labels_path"] = csv_files[0]
        structure_info["images_count"] = len(image_files)
        structure_info["labels_count"] = 1
    
    elif image_files:
        structure_info["pattern"] = "manual"
        structure_info["images_path"] = dir_path
        structure_info["images_count"] = len(image_files)
        structure_info["labels_count"] = 0
    
    return structure_info


def is_image_file(filename: str) -> bool:
    """Check if file is an image based on extension"""
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.tif']
    return any(filename.lower().endswith(ext) for ext in image_extensions)


def extract_folder_structure(upload_path: str, upload_id: str) -> Dict[str, Any]:
    """
    Extract folder structure from uploaded dataset
    Returns tree structure of folders and images
    """
    structure = {
        "folders": [],
        "total_images": 0,
        "images_by_folder": {}
    }
    
    # Implementation depends on whether it's ZIP or directory
    # This is a placeholder - will be implemented based on storage method
    
    return structure


def load_labels_from_csv(csv_path: str, image_column: str = "image_path", 
                         label_column: str = "label") -> Dict[str, Any]:
    """
    Load labels from CSV file
    Returns dict mapping image paths to labels
    """
    labels = {}
    
    if not os.path.exists(csv_path):
        return labels
    
    try:
        df = pd.read_csv(csv_path)
        
        # Try to find image and label columns
        if image_column not in df.columns:
            # Try common variations
            image_col = None
            for col in df.columns:
                if 'image' in col.lower() or 'path' in col.lower() or 'file' in col.lower():
                    image_col = col
                    break
            if image_col:
                image_column = image_col
            else:
                image_column = df.columns[0]  # Use first column
        
        if label_column not in df.columns:
            # Try common variations
            label_col = None
            for col in df.columns:
                if 'label' in col.lower() or 'class' in col.lower() or 'target' in col.lower():
                    label_col = col
                    break
            if label_col:
                label_column = label_col
            else:
                label_column = df.columns[1] if len(df.columns) > 1 else df.columns[0]
        
        # Create mapping
        for _, row in df.iterrows():
            image_path = str(row[image_column])
            label = row[label_column]
            labels[image_path] = label
        
    except Exception as e:
        print(f"Error loading labels from CSV: {e}")
    
    return labels


def load_labels_from_folders(root_path: str) -> Dict[str, Any]:
    """
    Load labels from folder structure (folder name = label)
    Returns dict mapping image paths to folder names (labels)
    """
    labels = {}
    
    if not os.path.exists(root_path):
        return labels
    
    for folder_name in os.listdir(root_path):
        folder_path = os.path.join(root_path, folder_name)
        if os.path.isdir(folder_path):
            # Label is the folder name
            for filename in os.listdir(folder_path):
                if is_image_file(filename):
                    image_path = os.path.join(folder_name, filename)
                    labels[image_path] = folder_name
    
    return labels


def get_image_metadata(image_path: str) -> Dict[str, Any]:
    """Get metadata for an image (dimensions, size, etc.)"""
    metadata = {
        "path": image_path,
        "width": None,
        "height": None,
        "size": None,
        "format": None
    }
    
    try:
        if os.path.exists(image_path):
            # Get file size
            metadata["size"] = os.path.getsize(image_path)
            
            # Get image dimensions
            with Image.open(image_path) as img:
                metadata["width"], metadata["height"] = img.size
                metadata["format"] = img.format
            
    except Exception as e:
        print(f"Error getting image metadata: {e}")
    
    return metadata

