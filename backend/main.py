from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import os
import uuid
import pandas as pd
import numpy as np
from typing import List, Optional, Dict, Any
import json
import joblib
from datetime import datetime
import base64
import io
import zipfile
from fastapi import Path

# Import time series utilities
try:
    from backend.time_series_utils import (
        analyze_time_series,
        detect_frequency,
        downsample_time_series,
        validate_frequency_conversion,
        process_audio_file
    )
except ImportError:
    # If time_series_utils is not available, create stub functions
    print("Warning: time_series_utils not available, using stubs")

    def analyze_time_series(df, timestamp_column=None):
        return {"frequency": 1.0, "sample_count": len(df), "signal_columns": [], "timestamp_column": timestamp_column, "duration_seconds": 0}

    def detect_frequency(df, timestamp_column=None):
        return 1.0

    def downsample_time_series(df, target_freq, original_freq, timestamp_column=None, method='average'):
        return df

    def validate_frequency_conversion(original_freq, target_freq):
        return True, ""

    def process_audio_file(audio_data, sample_rate=None):
        raise NotImplementedError(
            "Audio processing not available. Install librosa and soundfile.")

# Import JSON utilities
try:
    from backend.json_utils import parse_json_to_dataframe, detect_json_structure
except ImportError:
    print("Warning: json_utils not available, using stubs")

    def parse_json_to_dataframe(content):
        data = json.loads(content)
        if isinstance(data, list):
            return pd.DataFrame(data)
        elif isinstance(data, dict):
            # Try to convert object with arrays to DataFrame
            if all(isinstance(v, list) for v in data.values()):
                return pd.DataFrame(data)
            return pd.DataFrame([data])
        return pd.DataFrame({'value': [data]})

    def detect_json_structure(content):
        return {'type': 'unknown', 'suggested_format': 'tabular'}

app = FastAPI(title="ResearcherML API",
              description="Machine Learning Research Platform")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for frontend
# Get the project root directory (one level up from backend)
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
frontend_dir = os.path.join(project_root, "frontend")
index_file = os.path.join(project_root, "index.html")

# Mount static directories
if os.path.exists(os.path.join(frontend_dir, "css")):
    app.mount("/css", StaticFiles(directory=os.path.join(frontend_dir, "css")), name="css")
if os.path.exists(os.path.join(frontend_dir, "js")):
    app.mount("/js", StaticFiles(directory=os.path.join(frontend_dir, "js")), name="js")

# Storage for uploaded files
uploaded_data_store = {}

# Models directory
MODELS_DIR = "backend/models"
os.makedirs(MODELS_DIR, exist_ok=True)

# Uploads directory
UPLOADS_DIR = "backend/uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)


def detect_data_type(extension: str, content: bytes) -> str:
    """
    Detect data type from file extension and content
    """
    extension = extension.lower()

    if extension in ['.csv', '.tsv']:
        return "tabular"
    elif extension in ['.txt', '.json']:
        # Check content for time series patterns
        try:
            text_content = content.decode('utf-8')
            # Check for time series indicators
            time_series_keywords = ['timestamp', 'signal', 'frequency',
                                    'time_series', 'time', 'sample', 'hz', 'sampling_rate']
            if any(keyword in text_content.lower() for keyword in time_series_keywords):
                return "time_series"
            # For JSON, check structure
            if extension == '.json':
                try:
                    json_data = json.loads(text_content)
                    # Check if it's object with arrays (time series format)
                    if isinstance(json_data, dict):
                        array_keys = [
                            k for k, v in json_data.items() if isinstance(v, list)]
                        if len(array_keys) > 0:
                            # Check for time-related keys
                            time_keys = [k for k in array_keys if any(
                                kw in k.lower() for kw in ['time', 'timestamp', 'date', 'sample']
                            )]
                            if time_keys:
                                return "time_series"
                except:
                    pass
            return "tabular"
        except:
            return "tabular"
    elif extension in ['.wav', '.mp3', '.flac', '.m4a']:
        return "time_series"  # Audio files are time series signals
    else:
        return "unknown"


@app.get("/")
async def root():
    """Serve the frontend index.html"""
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "ResearcherML API", "status": "running"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    model_type: str = None,
    model_action: str = None
):
    """
    Upload files and detect data type
    """
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="No files provided")

    file_ids = []
    detected_types = []
    warning_message = None

    for file in files:
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1].lower()

        file_size_mb = file.size / (1024 * 1024) if hasattr(file, 'size') and file.size else 0
        print(f"📤 Receiving file: {file.filename}, size: {file_size_mb:.2f}MB, extension: {file_extension}")

        # Read file content
        try:
            import time
            start_read = time.time()
            content = await file.read()
            read_time = time.time() - start_read
            print(f"✅ File read complete in {read_time:.2f}s, content size: {len(content) / (1024 * 1024):.2f}MB")

            # Decode content - this should be fast
            start_decode = time.time()
            content_str = content.decode('utf-8') if isinstance(content, bytes) else str(content)
            decode_time = time.time() - start_decode
            print(f"✅ File decoded in {decode_time:.2f}s, string length: {len(content_str) / (1024 * 1024):.2f}MB")
        except Exception as e:
            print(f"❌ Error reading file {file.filename}: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Error reading file {file.filename}: {str(e)}")

        # Detect data type (fast - just checks extension and content)
        try:
            detected_type = detect_data_type(file_extension, content)
            detected_types.append(detected_type)
            print(f"✅ Detected type: {detected_type}")
        except Exception as e:
            print(f"⚠️ Error detecting data type: {str(e)}")
            detected_types.append('unknown')

        # Store file data (fast - just stores in memory)
        try:
            uploaded_data_store[file_id] = {
                'filename': file.filename,
                'extension': file_extension,
                'content': content_str,
                'size': len(content),
                'detected_type': detected_type,
                'uploaded_at': datetime.now().isoformat()
            }
            print(f"✅ File stored with ID: {file_id}")
            file_ids.append(file_id)
        except Exception as e:
            print(f"❌ Error storing file data: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Error storing file data: {str(e)}")

    # Determine primary type
    primary_type = detected_types[0] if detected_types else 'unknown'

    # Check if model type matches detected type
    if model_type and model_type != primary_type:
        type_mapping = {
            'ehr': ['tabular'],
            'time_series': ['time_series', 'signal']
        }
        expected_types = type_mapping.get(model_type, [])
        if primary_type not in expected_types:
            warning_message = f"Warning: You selected '{model_type}' model but detected '{primary_type}' data. This might not be optimal."

    return {
        "message": f"Successfully uploaded {len(files)} file(s). Detected type: {primary_type}",
        "file_ids": file_ids,
        "detected_type": primary_type,
        "selected_model_type": model_type or primary_type,
        "selected_model_action": model_action or "classification",
        "warning": warning_message
    }


@app.get("/api/data/{file_id}")
async def get_data_preview(file_id: str, full: bool = False):
    """
    Get data preview for a specific file
    full: If True, return full dataset instead of preview
    """
    try:
        if file_id not in uploaded_data_store:
            raise HTTPException(status_code=404, detail="File not found")

        file_data = uploaded_data_store[file_id]
        file_extension = file_data.get('extension', '')
        content = file_data.get('content', '')

        # Handle JSON files
        if file_extension == '.json':
            try:
                # Parse JSON to DataFrame
                df = parse_json_to_dataframe(content)

                # Detect if it's time series based on structure
                json_structure = detect_json_structure(content)
                is_time_series = json_structure.get(
                    'suggested_format') == 'time_series' or json_structure.get('has_time_columns', False)

                # Check for time-related columns
                time_cols = [col for col in df.columns if any(
                    kw in col.lower() for kw in ['time', 'timestamp', 'date', 'sample']
                )]

                if is_time_series or len(time_cols) > 0:
                    # Process as time series
                    analysis = analyze_time_series(df)
                    preview_size = 100 if not full else len(df)
                    return {
                        "type": "time_series",
                        "frequency": analysis['frequency'],
                        "sample_count": analysis['sample_count'],
                        "signal_columns": analysis['signal_columns'],
                        "preview_data": df.head(preview_size).to_dict('records') if not full else None,
                        "data": df.to_dict('records') if full else None,
                        "columns": list(df.columns),
                        "shape": df.shape
                    }
                else:
                    # Process as tabular data
                    print(f"📊 JSON file loaded: {len(df)} rows, {len(df.columns)} columns")
                    if full:
                        print(f"✅ Returning FULL dataset: {len(df)} rows")
                        df_preview = df
                    else:
                        preview_size = 1000
                        print(f"📋 Returning preview: {preview_size} rows (out of {len(df)} total)")
                        df_preview = df.head(preview_size)
                    return {
                        "type": "tabular",
                        "columns": list(df.columns),
                        "data": df_preview.fillna('').to_dict('records'),
                        "shape": df.shape,
                        "dtypes": {col: str(df[col].dtype) for col in df.columns}
                    }
            except Exception as e:
                raise HTTPException(
                    status_code=500, detail=f"Error parsing JSON file: {str(e)}")

        # Handle CSV/TSV files
        elif file_extension in ['.csv', '.tsv']:
            import io
            # For large files, optimize reading
            if full:
                # Read full dataset - use chunks for very large files to avoid memory issues
                file_size_mb = len(content) / (1024 * 1024)
                if file_size_mb > 50:  # For files larger than 50MB
                    print(f"📊 Large file detected ({file_size_mb:.2f}MB), reading in chunks...")
                    # Read in chunks and concatenate
                    chunk_list = []
                    chunk_size = 100000  # Read 100k rows at a time
                    for chunk in pd.read_csv(io.StringIO(content), dtype=str, chunksize=chunk_size, low_memory=False):
                        chunk_list.append(chunk)
                    df = pd.concat(chunk_list, ignore_index=True)
                    print(f"✅ Full dataset loaded: {len(df)} rows, {len(df.columns)} columns")
                else:
                    df = pd.read_csv(io.StringIO(content), dtype=str, low_memory=False)
                    print(f"📊 CSV file loaded: {len(df)} rows, {len(df.columns)} columns")
                print(f"✅ Returning FULL dataset: {len(df)} rows")
                df_preview = df
                df_shape = df.shape
            else:
                # For preview, only read first 1000 rows to save memory and time
                # This is MUCH faster for large files (61MB CSV = instant preview)
                df = pd.read_csv(io.StringIO(content), dtype=str, nrows=1000, low_memory=False)
                # Get total row count by counting newlines (fast approximation)
                total_rows_approx = content.count('\n')
                # Adjust for header row - if we read 1000 rows, there's at least 1000 total
                if total_rows_approx > 0:
                    total_rows_approx = max(total_rows_approx - 1, len(df))
                else:
                    total_rows_approx = len(df)
                
                print(f"📊 CSV preview: {len(df)} rows read (fast mode), ~{total_rows_approx} total rows estimated, {len(df.columns)} columns")
                print(f"📋 Returning preview: {len(df)} rows")
                df_preview = df
                # Set shape with approximate total (will be accurate when full=true is called)
                df_shape = (total_rows_approx, len(df.columns))
            return {
                "type": "tabular",
                "columns": list(df_preview.columns),
                "data": df_preview.fillna('').to_dict('records'),
                "shape": df_shape,
                "dtypes": {col: "string" for col in df_preview.columns}
            }

        # Handle TXT files (could be CSV-like or time series)
        elif file_extension == '.txt':
            detected_type = file_data.get('detected_type', 'tabular')
            if detected_type == 'time_series':
                try:
                    import io
                    # Always read full file for time series, then limit preview if needed
                    df = pd.read_csv(io.StringIO(content))
                    print(f"📊 TXT time series file loaded: {len(df)} rows, {len(df.columns)} columns")
                    analysis = analyze_time_series(df)
                    if full:
                        print(f"✅ Returning FULL time series dataset: {len(df)} rows")
                        return {
                            "type": "time_series",
                            "frequency": analysis['frequency'],
                            "sample_count": analysis['sample_count'],
                            "signal_columns": analysis['signal_columns'],
                            "preview_data": None,
                            "data": df.to_dict('records'),
                            "columns": list(df.columns),
                            "shape": df.shape
                        }
                    else:
                        preview_size = 100
                        print(f"📋 Returning time series preview: {preview_size} rows (out of {len(df)} total)")
                        return {
                            "type": "time_series",
                            "frequency": analysis['frequency'],
                            "sample_count": analysis['sample_count'],
                            "signal_columns": analysis['signal_columns'],
                            "preview_data": df.head(preview_size).to_dict('records'),
                            "data": None,
                            "columns": list(df.columns),
                            "shape": df.shape
                        }
                except Exception as e:
                    return {
                        "type": "text",
                        "content": content,
                        "preview": content[:500] + "..." if len(content) > 500 else content
                    }
            else:
                # Try to parse as CSV
                try:
                    import io
                    df = pd.read_csv(io.StringIO(content), dtype=str)
                    print(f"📊 TXT file loaded: {len(df)} rows, {len(df.columns)} columns")
                    if full:
                        print(f"✅ Returning FULL dataset: {len(df)} rows")
                        df_preview = df
                    else:
                        preview_size = 1000
                        print(f"📋 Returning preview: {preview_size} rows (out of {len(df)} total)")
                        df_preview = df.head(preview_size)
                    return {
                        "type": "tabular",
                        "columns": list(df.columns),
                        "data": df_preview.fillna('').to_dict('records'),
                        "shape": df.shape,
                        "dtypes": {col: "string" for col in df.columns}
                    }
                except:
                    return {
                        "type": "text",
                        "content": content,
                        "preview": content[:500] + "..." if len(content) > 500 else content
                    }

        # Handle audio files
        elif file_extension in ['.wav', '.mp3', '.flac', '.m4a']:
            try:
                audio_info = process_audio_file(content)
                audio_df = audio_info['data']
                if full:
                    data_records = audio_df.to_dict('records')
                else:
                    data_records = audio_df.head(100).to_dict('records')

                return {
                    "type": "time_series",
                    "frequency": audio_info['frequency'],
                    "sample_rate": audio_info['sample_rate'],
                    "duration": audio_info['duration'],
                    "sample_count": len(audio_df),
                    "signal_columns": ['amplitude'],
                    "audio_data": True,
                    "preview_data": data_records,
                    "data": audio_df.to_dict('records') if full else None,
                    "columns": list(audio_df.columns)
                }
            except Exception as e:
                return {
                    "type": "time_series",
                    "message": f"Audio file detected but processing failed: {str(e)}",
                    "extension": file_extension
                }
        else:
            return {"type": "unknown", "message": "Unsupported file type"}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error reading file: {str(e)}")


@app.post("/api/train")
async def train_models(request: Request):
    """
    Train machine learning models on provided data
    """
    try:
        body = await request.json()

        # Extract request parameters
        data = body.get('data', [])
        features = body.get('features', [])
        label = body.get('label')
        model_ids = body.get('model_ids', [])
        task = body.get('task', 'classification')
        train_split_percentage = body.get('train_split_percentage', 80)
        test_split_percentage = body.get('test_split_percentage', 20)
        null_handling_method = body.get('null_handling_method', 'impute')
        use_optuna = body.get('use_optuna', False)
        n_trials = body.get('n_trials', 20)
        save_models = body.get('save_models', True)
        hyperparameter_configs = body.get('hyperparameter_configs', {})

        if not data or len(data) == 0:
            raise HTTPException(status_code=400, detail="No data provided")
        if not features or len(features) == 0:
            raise HTTPException(status_code=400, detail="No features provided")
        if not label:
            raise HTTPException(status_code=400, detail="No label provided")
        if not model_ids or len(model_ids) == 0:
            raise HTTPException(status_code=400, detail="No models specified")

        # Convert data to DataFrame
        try:
            df = pd.DataFrame(data)
            if df.empty:
                raise ValueError("DataFrame is empty after conversion")
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error converting data to DataFrame: {str(e)}"
            )

        # Validate that all features and label exist in the DataFrame
        missing_features = [f for f in features if f not in df.columns]
        if missing_features:
            raise HTTPException(
                status_code=400,
                detail=f"Features not found in data: {', '.join(missing_features)}"
            )
        if label not in df.columns:
            raise HTTPException(
                status_code=400,
                detail=f"Label '{label}' not found in data columns"
            )

        # Handle null values
        try:
            if null_handling_method == 'remove':
                df = df.dropna(subset=features + [label])
                if df.empty:
                    raise ValueError(
                        "DataFrame is empty after removing null values")
            elif null_handling_method == 'impute':
                from sklearn.impute import SimpleImputer
                imputer = SimpleImputer(strategy='mean')
                numeric_features = [
                    f for f in features if df[f].dtype in ['int64', 'float64']]
                if len(numeric_features) > 0:
                    df[numeric_features] = imputer.fit_transform(
                        df[numeric_features])
                # For categorical, use mode
                categorical_features = [
                    f for f in features if f not in numeric_features]
                if len(categorical_features) > 0:
                    cat_imputer = SimpleImputer(strategy='most_frequent')
                    df[categorical_features] = cat_imputer.fit_transform(
                        df[categorical_features])
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error handling null values: {str(e)}"
            )

        # Prepare features and label
        try:
            X = df[features].copy()
            y = df[label].copy()
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error extracting features and label: {str(e)}"
            )

        # Convert categorical features to numeric if needed
        try:
            from sklearn.preprocessing import LabelEncoder

            # Encode categorical features - create a separate encoder for each column
            encoders = {}
            for col in X.columns:
                if X[col].dtype == 'object' or not pd.api.types.is_numeric_dtype(X[col]):
                    # Handle NaN/None values before encoding
                    X[col] = X[col].fillna('__MISSING__')
                    # Create a new encoder for this column
                    encoder = LabelEncoder()
                    X[col] = encoder.fit_transform(X[col].astype(str))
                    encoders[col] = encoder

            # Encode label for classification
            if task == 'classification':
                # Check if label is already numeric
                if y.dtype == 'object' or not pd.api.types.is_numeric_dtype(y):
                    # Handle NaN/None values before encoding
                    y = y.fillna('__MISSING__')
                    label_encoder = LabelEncoder()
                    y = label_encoder.fit_transform(y.astype(str))

                # Ensure binary classification uses 0 and 1
                unique_labels = np.unique(y)
                if len(unique_labels) < 2:
                    raise ValueError(
                        f"Classification requires at least 2 classes, but found {len(unique_labels)}: {unique_labels}. Please check your label column."
                    )
                # Check that each class has at least 2 samples
                label_counts = pd.Series(y).value_counts()
                classes_with_insufficient_samples = label_counts[label_counts < 2].index.tolist(
                )
                if len(classes_with_insufficient_samples) > 0:
                    raise ValueError(
                        f"Classification requires at least 2 samples per class, but found classes with insufficient samples: {classes_with_insufficient_samples}. Please check your label distribution."
                    )
                if len(unique_labels) == 2:
                    y = np.where(y == unique_labels[0], 0, 1)

            # Validate that we have enough samples
            if len(X) < 2:
                raise ValueError(
                    "Not enough samples for training (need at least 2)")

            # Handle any remaining NaN values by filling with 0
            X = X.fillna(0)
            y = y.fillna(0) if isinstance(
                y, pd.Series) else np.nan_to_num(y, nan=0.0)

            # Convert to numeric, handling any remaining non-numeric values
            for col in X.columns:
                X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0)
            X = X.astype(float)

            # Convert y to numeric
            if isinstance(y, pd.Series):
                y = pd.to_numeric(y, errors='coerce').fillna(0)
            y = np.array(y, dtype=float)
            y = np.nan_to_num(y, nan=0.0)

            # Final validation - check for infinite values
            if np.any(np.isinf(X.values)):
                X = X.replace([np.inf, -np.inf], 0)
            if np.any(np.isinf(y)):
                y = np.nan_to_num(y, nan=0.0, posinf=0.0, neginf=0.0)

        except Exception as e:
            import traceback
            error_detail = f"Error preprocessing data: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
            print(error_detail)
            raise HTTPException(
                status_code=400,
                detail=f"Error preprocessing data: {str(e)}"
            )

        # Split data
        try:
            from sklearn.model_selection import train_test_split
            test_size = test_split_percentage / 100.0
            # Validate test size
            if test_size <= 0 or test_size >= 1:
                raise ValueError(
                    f"Invalid test_split_percentage: {test_split_percentage}. Must be between 1 and 99.")

            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42,
                stratify=y if task == 'classification' and len(
                    np.unique(y)) > 1 else None
            )

            # Validate split results
            if len(X_train) == 0 or len(X_test) == 0:
                raise ValueError("Train-test split resulted in empty datasets")
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error splitting data: {str(e)}"
            )

        # Import models
        from sklearn.linear_model import LogisticRegression, LinearRegression, Lasso, Ridge, ElasticNet
        from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor, AdaBoostClassifier, AdaBoostRegressor, ExtraTreesClassifier, ExtraTreesRegressor
        from sklearn.svm import SVC, SVR
        from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
        from sklearn.naive_bayes import GaussianNB
        from sklearn.neural_network import MLPClassifier, MLPRegressor
        
        # Import XGBoost with error handling
        try:
            import xgboost as xgb
        except ImportError:
            xgb = None
        
        # Import LightGBM with error handling
        try:
            import lightgbm as lgb
        except ImportError:
            lgb = None
        
        # Import CatBoost with error handling
        try:
            from catboost import CatBoostClassifier, CatBoostRegressor
        except ImportError:
            CatBoostClassifier = None
            CatBoostRegressor = None

        # Import Optuna if needed
        if use_optuna:
            try:
                import optuna
            except ImportError:
                use_optuna = False

        results = []
        saved_models_manifest = []

        for model_id in model_ids:
            try:
                # Get hyperparameter config for this model
                model_config = hyperparameter_configs.get(model_id, {})

                # Create model based on ID
                if model_id == 'logreg':
                    model = LogisticRegression(random_state=42, max_iter=1000)
                elif model_id == 'rf':
                    model = RandomForestClassifier(random_state=42)
                elif model_id == 'xgb':
                    if xgb is None:
                        results.append({
                            'model_id': model_id,
                            'error': 'XGBoost not installed. Please install it with: pip install xgboost'
                        })
                        continue
                    model = xgb.XGBClassifier(
                        random_state=42, eval_metric='logloss')
                elif model_id == 'lgbm':
                    if lgb is None:
                        results.append({
                            'model_id': model_id,
                            'error': 'LightGBM not installed. Please install it with: pip install lightgbm'
                        })
                        continue
                    model = lgb.LGBMClassifier(random_state=42, verbose=-1)
                elif model_id == 'catboost':
                    if CatBoostClassifier is None:
                        results.append({
                            'model_id': model_id,
                            'error': 'CatBoost not installed. Please install it with: pip install catboost'
                        })
                        continue
                    model = CatBoostClassifier(random_state=42, verbose=False)
                elif model_id == 'gbm':
                    model = GradientBoostingClassifier(random_state=42)
                elif model_id == 'adaboost':
                    model = AdaBoostClassifier(random_state=42)
                elif model_id == 'svm':
                    model = SVC(random_state=42, probability=True)
                elif model_id == 'knn':
                    model = KNeighborsClassifier()
                elif model_id == 'nb':
                    model = GaussianNB()
                elif model_id == 'mlp':
                    model = MLPClassifier(random_state=42, max_iter=500)
                elif model_id == 'et':
                    model = ExtraTreesClassifier(random_state=42)
                elif model_id == 'linreg':
                    model = LinearRegression()  # Note: normalize parameter deprecated, use StandardScaler if needed
                elif model_id == 'lasso':
                    model = Lasso(random_state=42)
                elif model_id == 'ridge':
                    model = Ridge(random_state=42)
                elif model_id == 'elastic':
                    model = ElasticNet(random_state=42)
                elif model_id == 'rf_reg':
                    model = RandomForestRegressor(random_state=42)
                elif model_id == 'xgb_reg':
                    if xgb is None:
                        results.append({
                            'model_id': model_id,
                            'error': 'XGBoost not installed. Please install it with: pip install xgboost'
                        })
                        continue
                    model = xgb.XGBRegressor(random_state=42)
                elif model_id == 'lgbm_reg':
                    if lgb is None:
                        results.append({
                            'model_id': model_id,
                            'error': 'LightGBM not installed. Please install it with: pip install lightgbm'
                        })
                        continue
                    model = lgb.LGBMRegressor(random_state=42, verbose=-1)
                elif model_id == 'catboost_reg':
                    if CatBoostRegressor is None:
                        results.append({
                            'model_id': model_id,
                            'error': 'CatBoost not installed. Please install it with: pip install catboost'
                        })
                        continue
                    model = CatBoostRegressor(random_state=42, verbose=False)
                elif model_id == 'gbm_reg':
                    model = GradientBoostingRegressor(random_state=42)
                elif model_id == 'adaboost_reg':
                    model = AdaBoostRegressor(random_state=42)
                elif model_id == 'svr':
                    model = SVR()
                elif model_id == 'knn_reg':
                    model = KNeighborsRegressor()
                elif model_id == 'mlp_reg':
                    model = MLPRegressor(random_state=42, max_iter=500)
                elif model_id == 'et_reg':
                    model = ExtraTreesRegressor(random_state=42)
                else:
                    results.append({
                        'model_id': model_id,
                        'error': f'Unknown model: {model_id}'
                    })
                    continue

                # Train model
                # Track if we should use Optuna (might be disabled if config is invalid)
                use_optuna_for_this_model = use_optuna

                if use_optuna_for_this_model and model_config and len(model_config) > 0:
                    # Validate that we have at least one enabled parameter with valid config
                    has_valid_config = False
                    for param_name, param_config in model_config.items():
                        if param_config.get('enabled', False):
                            param_type = param_config.get('type', 'float')
                            if param_type == 'categorical':
                                options = param_config.get('options', [])
                                if options and len(options) > 0:
                                    has_valid_config = True
                                    break
                            elif param_type == 'tuple':
                                options = param_config.get(
                                    'default_options', [])
                                if options and len(options) > 0:
                                    has_valid_config = True
                                    break
                            else:
                                # For int/float, check that min and max are valid
                                min_val = param_config.get(
                                    'min') or param_config.get('default_min')
                                max_val = param_config.get(
                                    'max') or param_config.get('default_max')
                                if min_val is not None and max_val is not None and min_val < max_val:
                                    has_valid_config = True
                                    break

                    if not has_valid_config:
                        # No valid hyperparameters configured, train with defaults
                        print(
                            f"Warning: No valid hyperparameters configured for {model_id}, using default parameters")
                        use_optuna_for_this_model = False

                if use_optuna_for_this_model and model_config and len(model_config) > 0:
                    # Use Optuna for hyperparameter tuning
                    def objective(trial):
                        # Create model with trial hyperparameters
                        model_params = {}

                        # Models that don't accept random_state
                        models_without_random_state = [
                            'knn', 'knn_reg', 'nb', 'svr']

                        for param_name, param_config in model_config.items():
                            if not param_config.get('enabled', False):
                                continue

                            # Get parameter type - this should come from frontend config
                            param_type = param_config.get('type', 'float')

                            # Skip if type is not recognized
                            if param_type not in ['float', 'int', 'categorical', 'tuple']:
                                continue

                            if param_type == 'float':
                                min_val = float(param_config.get(
                                    'min', param_config.get('default_min', 0.001)))
                                max_val = float(param_config.get(
                                    'max', param_config.get('default_max', 100)))
                                if min_val >= max_val:
                                    max_val = min_val + 1.0
                                if param_config.get('scale') == 'log':
                                    model_params[param_name] = trial.suggest_float(
                                        param_name, min_val, max_val, log=True
                                    )
                                else:
                                    model_params[param_name] = trial.suggest_float(
                                        param_name, min_val, max_val
                                    )

                            elif param_type == 'int':
                                min_val = int(float(param_config.get(
                                    'min', param_config.get('default_min', 1))))
                                max_val = int(float(param_config.get(
                                    'max', param_config.get('default_max', 100))))
                                if min_val >= max_val:
                                    max_val = min_val + 1
                                # Use suggest_int which guarantees integer return
                                model_params[param_name] = trial.suggest_int(
                                    param_name, min_val, max_val
                                )

                            elif param_type == 'categorical':
                                options = param_config.get('options', [])
                                if not options or len(options) == 0:
                                    continue  # Skip if no options provided

                                # Handle boolean options (convert to proper booleans)
                                # Check if options are booleans or string representations
                                option_set = set(options)
                                if option_set == {True, False} or option_set == {False, True}:
                                    model_params[param_name] = trial.suggest_categorical(
                                        param_name, [True, False]
                                    )
                                elif option_set == {'True', 'False'}:
                                    # Handle string booleans from JSON
                                    selected = trial.suggest_categorical(
                                        param_name, ['True', 'False'])
                                    model_params[param_name] = selected == 'True'
                                else:
                                    # Regular categorical - ensure all options are valid
                                    # Filter out None/null values and ensure we have valid options
                                    valid_options = [
                                        opt for opt in options if opt is not None]
                                    if not valid_options:
                                        continue
                                    # Use suggest_categorical which returns one of the options
                                    model_params[param_name] = trial.suggest_categorical(
                                        param_name, valid_options
                                    )

                            elif param_type == 'tuple':
                                # For MLP hidden_layer_sizes
                                options = param_config.get(
                                    'default_options', ['(100,)'])
                                if not options or len(options) == 0:
                                    options = ['(100,)']
                                # Suggest from the tuple string options
                                selected_tuple_str = trial.suggest_categorical(
                                    param_name, options
                                )
                                # Parse the selected tuple string to actual tuple
                                selected_clean = selected_tuple_str.strip('()')
                                model_params[param_name] = tuple(
                                    map(int, selected_clean.split(',')))

                        # Create model with hyperparameters
                        model_class = type(model)

                        # Only add random_state if model supports it
                        if model_id not in models_without_random_state:
                            model_params['random_state'] = 42

                        # Handle special cases for specific models
                        if model_id == 'xgb' or model_id == 'xgb_reg':
                            model_params['eval_metric'] = 'logloss' if task == 'classification' else None
                        elif model_id == 'lgbm' or model_id == 'lgbm_reg':
                            model_params['verbose'] = -1
                        elif model_id == 'catboost' or model_id == 'catboost_reg':
                            model_params['verbose'] = False
                        elif model_id == 'svm' or model_id == 'svr':
                            if task == 'classification':
                                model_params['probability'] = True

                        try:
                            model_with_params = model_class(**model_params)
                            model_with_params.fit(X_train, y_train)

                            # Evaluate
                            if task == 'classification':
                                score = model_with_params.score(X_test, y_test)
                            else:
                                from sklearn.metrics import mean_squared_error
                                y_pred = model_with_params.predict(X_test)
                                # Negative because Optuna minimizes
                                score = -mean_squared_error(y_test, y_pred)

                            return score
                        except Exception as e:
                            # If model creation or training fails, return a very poor score
                            # This will cause Optuna to skip this trial
                            print(
                                f"Optuna trial failed for {model_id}: {str(e)}")
                            return float('-inf') if task == 'classification' else float('inf')

                    study = optuna.create_study(
                        direction='maximize' if task == 'classification' else 'minimize')
                    study.optimize(objective, n_trials=n_trials,
                                   show_progress_bar=False)

                    # Check if study has any successful trials
                    successful_trials = [
                        t for t in study.trials if t.state == optuna.trial.TrialState.COMPLETE]
                    if len(successful_trials) == 0:
                        # All trials failed - fall back to default parameters
                        print(
                            f"Warning: All {n_trials} Optuna trials failed for {model_id}. Falling back to default parameters. This may be due to invalid hyperparameter ranges or data issues.")
                        use_optuna_for_this_model = False
                    elif study.best_trial is None:
                        # No best trial found - fall back to default parameters
                        print(
                            f"Warning: No best trial found for {model_id} despite {len(successful_trials)} successful trials. Falling back to default parameters.")
                        use_optuna_for_this_model = False
                    else:
                        # Get best hyperparameters and retrain
                        best_params = study.best_params.copy()

                        # Handle tuple parameters - convert string back to tuple
                        for param_name, param_config in model_config.items():
                            if param_config.get('type') == 'tuple' and param_name in best_params:
                                tuple_str = best_params[param_name]
                                tuple_clean = tuple_str.strip('()')
                                best_params[param_name] = tuple(
                                    map(int, tuple_clean.split(',')))

                        # Handle None string conversion for max_features
                        if 'max_features' in best_params and best_params['max_features'] == 'None':
                            best_params['max_features'] = None

                        # Only add random_state if model supports it
                        if model_id not in ['knn', 'knn_reg', 'nb', 'svr']:
                            best_params['random_state'] = 42

                        # Handle special cases
                        if model_id == 'xgb' or model_id == 'xgb_reg':
                            best_params['eval_metric'] = 'logloss' if task == 'classification' else None
                        elif model_id == 'lgbm' or model_id == 'lgbm_reg':
                            best_params['verbose'] = -1
                        elif model_id == 'catboost' or model_id == 'catboost_reg':
                            best_params['verbose'] = False
                        elif model_id == 'svm':
                            best_params['probability'] = True

                        model_class = type(model)
                        model = model_class(**best_params)

                # If Optuna was disabled or failed, use default model (already created above)
                # The model variable already has the default model from the if/elif chain above

                model.fit(X_train, y_train)

                # Calculate metrics
                from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, mean_absolute_error, r2_score

                y_train_pred = model.predict(X_train)
                y_test_pred = model.predict(X_test)

                metrics = {}
                if task == 'classification':
                    metrics['train_accuracy'] = float(
                        accuracy_score(y_train, y_train_pred))
                    metrics['test_accuracy'] = float(
                        accuracy_score(y_test, y_test_pred))
                    metrics['test_precision'] = float(precision_score(
                        y_test, y_test_pred, average='weighted', zero_division=0))
                    metrics['test_recall'] = float(recall_score(
                        y_test, y_test_pred, average='weighted', zero_division=0))
                    metrics['test_f1'] = float(
                        f1_score(y_test, y_test_pred, average='weighted', zero_division=0))
                else:
                    metrics['train_mse'] = float(
                        mean_squared_error(y_train, y_train_pred))
                    metrics['test_mse'] = float(
                        mean_squared_error(y_test, y_test_pred))
                    metrics['train_mae'] = float(
                        mean_absolute_error(y_train, y_train_pred))
                    metrics['test_mae'] = float(
                        mean_absolute_error(y_test, y_test_pred))
                    metrics['train_r2'] = float(
                        r2_score(y_train, y_train_pred))
                    metrics['test_r2'] = float(r2_score(y_test, y_test_pred))

                # Save model if requested
                model_path = None
                if save_models:
                    model_filename = f"{model_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl"
                    model_path = os.path.join(MODELS_DIR, model_filename)
                    joblib.dump(model, model_path)
                    # Track in manifest for download links
                    saved_models_manifest.append({
                        "model_id": model_id,
                        "filename": model_filename
                    })

                # Get model parameters (state dict equivalent)
                model_params = {}
                if hasattr(model, 'get_params'):
                    try:
                        raw_params = model.get_params(deep=True)
                        # Convert any non-serializable values to strings or lists
                        # Note: np is already imported at the top of the file
                        for key, value in raw_params.items():
                            if value is None:
                                model_params[key] = None
                            elif isinstance(value, (str, int, float, bool)):
                                model_params[key] = value
                            elif isinstance(value, (list, tuple)):
                                # Convert lists/tuples to lists, handling numpy types
                                try:
                                    model_params[key] = [float(v) if isinstance(v, (np.integer, np.floating)) else (str(v) if not isinstance(v, (str, int, float, bool)) else v) for v in value]
                                except (TypeError, ValueError):
                                    model_params[key] = [str(v) for v in value]
                            elif isinstance(value, np.integer):
                                model_params[key] = int(value)
                            elif isinstance(value, np.floating):
                                model_params[key] = float(value)
                            elif isinstance(value, np.ndarray):
                                # Convert numpy arrays to lists
                                try:
                                    model_params[key] = value.tolist()
                                except (AttributeError, ValueError):
                                    model_params[key] = str(value)
                            else:
                                # For other types, try JSON serialization first
                                try:
                                    json.dumps(value)
                                    model_params[key] = value
                                except (TypeError, ValueError):
                                    # Fall back to string representation
                                    model_params[key] = str(value)
                    except Exception as e:
                        print(f"Warning: Could not extract model parameters for {model_id}: {str(e)}")
                        model_params = {}

                results.append({
                    'model_id': model_id,
                    'metrics': metrics,
                    'model_path': model_path,
                    'model_filename': os.path.basename(model_path) if model_path else None,
                    'train_size': int(X_train.shape[0]),
                    'test_size': int(X_test.shape[0]),
                    'feature_count': int(X_train.shape[1]),
                    'model_params': model_params
                })

            except Exception as e:
                import traceback
                error_msg = str(e)
                # Get more detailed error information
                error_type = type(e).__name__
                full_traceback = traceback.format_exc()

                # Create a more user-friendly error message
                if "ValueError" in error_type:
                    user_error = f"Data validation error: {error_msg}"
                elif "TypeError" in error_type:
                    user_error = f"Type error: {error_msg}"
                elif "KeyError" in error_type:
                    user_error = f"Missing parameter: {error_msg}"
                else:
                    user_error = f"Training error: {error_msg}"

                print(f"Training error for {model_id}: {user_error}")
                print(f"Full traceback:\n{full_traceback}")

                results.append({
                    'model_id': model_id,
                    'error': user_error
                })

        # Return results even if some models failed
        # At least return the structure so frontend can display errors
        if len(results) == 0:
            # If no results at all, something went wrong before any model was processed
            raise HTTPException(
                status_code=500,
                detail="No models were processed. Please check the backend logs for errors."
            )

        return {
            'success': True,
            'results': results,
            'saved_models': saved_models_manifest
        }

    except HTTPException:
        # Re-raise HTTPExceptions as-is
        raise
    except Exception as e:
        import traceback
        error_msg = f"Error training model: {str(e)}"
        print(f"Training endpoint error: {error_msg}")
        print(traceback.format_exc())
        # Return error in a format the frontend can handle
        return {
            'success': False,
            'error': error_msg,
            'results': []
        }


@app.get("/api/download-model/{filename}")
async def download_model(filename: str = Path(..., description="Model filename (PKL) to download")):
    """
    Download a saved model (*.pkl) by filename.
    """
    # Security: prevent path traversal
    if ".." in filename or filename.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid filename")
    model_path = os.path.join(MODELS_DIR, filename)
    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail="Model file not found")
    return FileResponse(model_path, media_type="application/octet-stream", filename=filename)

@app.post("/api/time-series/resample")
async def resample_time_series(request: Request):
    """
    Resample time series data to a target frequency
    """
    try:
        body = await request.json()
        file_id = body.get('file_id')
        target_frequency = body.get('target_frequency')
        original_frequency = body.get('original_frequency')
        method = body.get('method', 'average')

        if not file_id or file_id not in uploaded_data_store:
            raise HTTPException(status_code=404, detail="File not found")

        file_data = uploaded_data_store[file_id]
        content = file_data.get('content', '')
        file_extension = file_data.get('extension', '')

        # Validate frequency conversion
        is_valid, error_msg = validate_frequency_conversion(
            original_frequency, target_frequency)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)

        # Read time series data - handle both CSV and JSON
        import io
        if file_extension == '.json':
            df = parse_json_to_dataframe(content)
        else:
            df = pd.read_csv(io.StringIO(content))

        # Detect timestamp column
        timestamp_column = None
        for col in df.columns:
            if any(kw in col.lower() for kw in ['time', 'timestamp', 'date']):
                timestamp_column = col
                break

        # Perform resampling
        resampled_df = downsample_time_series(
            df,
            target_frequency,
            original_frequency,
            timestamp_column,
            method
        )

        return {
            "success": True,
            "data": resampled_df.to_dict('records'),
            "frequency": target_frequency,
            "sample_count": len(resampled_df),
            "columns": list(resampled_df.columns)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error resampling time series: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
