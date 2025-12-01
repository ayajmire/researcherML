# Image Dataset Organization Patterns

This document describes the supported organizational patterns for image datasets in ResearcherML.

## Supported Patterns

### 1. **Separate Folders Pattern** (Recommended for your use case)
```
dataset/
  images/
    image1.jpg
    image2.jpg
    image3.jpg
  labels/
    labels.csv          # CSV with image_path, label columns
    # OR
    image1.txt          # Individual label files
    image2.txt
```

**CSV Format:**
```csv
image_path,label
images/image1.jpg,0
images/image2.jpg,1
images/image3.jpg,0
```

**Benefits:**
- Clear separation of images and labels
- Easy to manage and update labels
- Supports both CSV and individual label files
- Works well for large datasets

---

### 2. **Folder-Based Labeling Pattern**
```
dataset/
  positive/
    img1.jpg
    img2.jpg
  negative/
    img3.jpg
    img4.jpg
  class1/
    img5.jpg
  class2/
    img6.jpg
```

**Benefits:**
- Intuitive organization
- Automatic label extraction from folder names
- No separate label files needed
- Good for classification tasks

**Limitations:**
- Doesn't work well for regression (continuous values)
- Requires reorganizing files if labels change

---

### 3. **CSV Mapping Pattern**
```
dataset/
  images/
    img1.jpg
    img2.jpg
  labels.csv            # Single CSV file with all labels
```

**CSV Format:**
```csv
image_path,label
images/img1.jpg,positive
images/img2.jpg,negative
```

**For Regression:**
```csv
image_path,label
images/img1.jpg,12.5
images/img2.jpg,8.3
```

**Benefits:**
- Single source of truth for labels
- Easy to edit labels
- Supports both classification and regression
- Can include multiple label columns

---

### 4. **Manual Labeling Pattern**
```
dataset/
  image1.jpg
  image2.jpg
  image3.jpg
  # Labels assigned through UI
```

**Benefits:**
- Maximum flexibility
- No pre-existing labels required
- Good for annotation workflows

---

## Recommended Organization for Your Use Case

Based on your description (separate folders for images and labels), I recommend:

### **Option A: CSV-Based Labels (Best for Classification & Regression)**
```
my_dataset/
  images/
    patient_001_scan1.jpg
    patient_001_scan2.jpg
    patient_002_scan1.jpg
  labels/
    labels.csv
```

**labels.csv:**
```csv
image_path,label
images/patient_001_scan1.jpg,0
images/patient_001_scan2.jpg,1
images/patient_002_scan1.jpg,0
```

### **Option B: Individual Label Files**
```
my_dataset/
  images/
    patient_001_scan1.jpg
    patient_001_scan2.jpg
  labels/
    patient_001_scan1.txt    # Contains: "0" or "1" or "12.5"
    patient_001_scan2.txt
```

---

## Implementation Features

### Auto-Detection
The system will automatically detect your organizational pattern:
- Scans folder structure
- Identifies images and label files
- Detects pattern type
- Suggests label mapping

### Flexible Label Formats
- **Classification**: Binary (0/1), Multi-class (class1, class2, ...)
- **Regression**: Continuous values (12.5, 8.3, ...)
- **CSV columns**: Custom column names supported
- **File naming**: Flexible image-to-label mapping

### Upload Options
1. **ZIP upload**: Upload entire dataset as ZIP file
2. **Folder upload**: Select folder from file system
3. **Individual files**: Upload images and labels separately

---

## Example Workflows

### Workflow 1: CSV Labels (Recommended)
1. Organize images in `images/` folder
2. Create `labels.csv` with image paths and labels
3. Upload ZIP file or folder
4. System auto-detects structure
5. Labels automatically loaded

### Workflow 2: Folder-Based
1. Organize images in folders named by class
2. Upload ZIP file or folder
3. System extracts labels from folder names
4. Labels automatically assigned

### Workflow 3: Manual Labeling
1. Upload images (any structure)
2. Browse images in UI
3. Assign labels manually
4. Labels saved automatically

---

## Next Steps

The system will support all these patterns. When you upload your dataset:
1. Select organization pattern (or let system auto-detect)
2. Specify images folder location
3. Specify labels location (CSV file or labels folder)
4. Verify label mapping
5. Start training!

Would you like me to implement support for a specific pattern first, or should I implement all patterns?

