"""
Questionnaire Handler for ResearcherML
Processes questionnaire answers and generates cleaning transformations
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime


def analyze_column(df: pd.DataFrame, column_name: str) -> Dict[str, Any]:
    """
    Analyze a column and return context for questionnaire.
    
    Args:
        df: DataFrame containing the column
        column_name: Name of the column to analyze
        
    Returns:
        Dictionary with column analysis
    """
    if column_name not in df.columns:
        raise ValueError(f"Column '{column_name}' not found in DataFrame")
    
    column = df[column_name]
    
    # Basic info
    total_rows = len(df)
    missing_count = column.isna().sum()
    missing_pct = (missing_count / total_rows * 100) if total_rows > 0 else 0
    
    # Get sample values (non-null) - prioritize diverse values
    non_null_values = column.dropna()
    unique_values = non_null_values.unique()
    
    if len(unique_values) <= 8:
        # If 8 or fewer unique values, show all unique values
        sample_values = unique_values[:8].tolist()
    else:
        # Otherwise, sample randomly from unique values to ensure diversity
        sample_size = min(8, len(unique_values))
        sample_values = pd.Series(unique_values).sample(sample_size).tolist()
    
    # Get sample rows (for data table display)
    sample_row_count = min(100, len(df))
    sample_rows = df[[column_name]].head(sample_row_count).to_dict('records')
    
    # Detect data type
    detected_type, type_details = detect_column_type(column)
    
    # Type-specific analysis
    analysis = {
        'column_name': column_name,
        'detected_type': detected_type,
        'total_rows': total_rows,
        'missing_count': int(missing_count),
        'missing_pct': round(missing_pct, 2),
        'sample_values': sample_values,
        'sample_rows': sample_rows,  # Add sample rows for table display
        'unique_count': int(column.nunique()),
        'type_details': type_details
    }
    
    # Add type-specific metadata
    if detected_type == 'numeric':
        non_null_numeric = pd.to_numeric(column, errors='coerce').dropna()
        if len(non_null_numeric) > 0:
            analysis['min'] = float(non_null_numeric.min())
            analysis['max'] = float(non_null_numeric.max())
            analysis['mean'] = float(non_null_numeric.mean())
            analysis['median'] = float(non_null_numeric.median())
            
            # Detect potential outliers (values beyond 3 std devs)
            mean = non_null_numeric.mean()
            std = non_null_numeric.std()
            if std > 0:
                outliers = non_null_numeric[(non_null_numeric < mean - 3*std) | (non_null_numeric > mean + 3*std)]
                analysis['potential_outliers'] = int(len(outliers))
                if len(outliers) > 0:
                    analysis['outlier_examples'] = outliers.head(5).tolist()
    
    elif detected_type in ['text', 'categorical']:
        value_counts = column.value_counts()
        analysis['unique_values'] = value_counts.index.tolist()[:50]  # Limit to 50
        analysis['value_counts'] = {str(k): int(v) for k, v in value_counts.head(20).items()}
        analysis['most_common'] = str(value_counts.index[0]) if len(value_counts) > 0 else None
        
    elif detected_type == 'date':
        try:
            dates = pd.to_datetime(column, errors='coerce').dropna()
            if len(dates) > 0:
                analysis['min_date'] = dates.min().isoformat()
                analysis['max_date'] = dates.max().isoformat()
                analysis['date_range_days'] = (dates.max() - dates.min()).days
        except:
            pass
    
    # Suggest branch
    analysis['suggested_branch'] = suggest_question_branch(column, detected_type, analysis)
    
    return analysis


def detect_column_type(column: pd.Series) -> Tuple[str, Dict]:
    """
    Detect the type of a column.
    
    Returns:
        Tuple of (type_name, details_dict)
    """
    non_null = column.dropna()
    
    if len(non_null) == 0:
        return 'unknown', {'reason': 'all_missing'}
    
    # Try numeric
    numeric_converted = pd.to_numeric(non_null, errors='coerce')
    numeric_success_rate = numeric_converted.notna().sum() / len(non_null)
    
    if numeric_success_rate > 0.9:  # 90% can be converted to numeric
        return 'numeric', {'conversion_rate': numeric_success_rate}
    
    # Try datetime
    try:
        date_converted = pd.to_datetime(non_null, errors='coerce')
        date_success_rate = date_converted.notna().sum() / len(non_null)
        if date_success_rate > 0.8:  # 80% can be converted to datetime
            return 'date', {'conversion_rate': date_success_rate}
    except:
        pass
    
    # Check if mixed (some numeric, some text)
    if 0.1 < numeric_success_rate < 0.9:
        return 'mixed', {
            'numeric_portion': numeric_success_rate,
            'text_portion': 1 - numeric_success_rate
        }
    
    # Otherwise it's text/categorical
    unique_ratio = non_null.nunique() / len(non_null)
    if unique_ratio < 0.5:  # Less than 50% unique values
        return 'categorical', {'unique_ratio': unique_ratio}
    else:
        return 'text', {'unique_ratio': unique_ratio}


def suggest_question_branch(column: pd.Series, detected_type: str, analysis: Dict) -> str:
    """Suggest which question branch to use."""
    
    if detected_type == 'numeric':
        # Check if it looks like an ID (sequential integers)
        if analysis.get('unique_count', 0) == analysis.get('total_rows', 0):
            return 'numeric_id'
        # Check if it has very few unique values (might be categorical)
        elif analysis.get('unique_count', 0) < 10:
            return 'numeric_few_values'
        else:
            return 'numeric_standard'
    
    elif detected_type == 'categorical':
        if analysis.get('unique_count', 0) <= 2:
            return 'categorical_binary'
        elif analysis.get('unique_count', 0) <= 10:
            return 'categorical_small'
        else:
            return 'categorical_many'
    
    elif detected_type == 'text':
        # Free text is usually not useful for ML
        return 'text_freeform'
    
    elif detected_type == 'date':
        return 'date_standard'
    
    elif detected_type == 'mixed':
        return 'mixed_standard'
    
    return 'unknown'


def apply_cleaning_transformation(
    df: pd.DataFrame,
    column_name: str,
    answers: Dict[str, str],
    branch: str
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Apply cleaning transformation based on questionnaire answers.
    
    Args:
        df: DataFrame to clean
        column_name: Column to clean
        answers: Dictionary of question answers
        branch: Question branch used
        
    Returns:
        Tuple of (cleaned_df, transformation_summary)
    """
    df_cleaned = df.copy()
    summary = {
        'column': column_name,
        'branch': branch,
        'transformations': [],
        'new_columns': [],
        'excluded': False
    }
    
    # Check if column should be excluded
    if answers.get('q1') in ['id_code', 'free_text'] or answers.get('exclude'):
        summary['excluded'] = True
        summary['transformations'].append(f"Column '{column_name}' marked for exclusion")
        return df_cleaned, summary
    
    # Handle missing values
    if 'missing_strategy' in answers:
        strategy = answers['missing_strategy']
        original_missing = df_cleaned[column_name].isna().sum()
        
        if strategy == 'fill_median' and original_missing > 0:
            median_val = df_cleaned[column_name].median()
            df_cleaned[column_name].fillna(median_val, inplace=True)
            summary['transformations'].append(f"Filled {original_missing} missing values with median ({median_val:.2f})")
        
        elif strategy == 'fill_mean' and original_missing > 0:
            mean_val = df_cleaned[column_name].mean()
            df_cleaned[column_name].fillna(mean_val, inplace=True)
            summary['transformations'].append(f"Filled {original_missing} missing values with mean ({mean_val:.2f})")
        
        elif strategy == 'fill_mode' and original_missing > 0:
            mode_val = df_cleaned[column_name].mode()[0] if len(df_cleaned[column_name].mode()) > 0 else None
            if mode_val is not None:
                df_cleaned[column_name].fillna(mode_val, inplace=True)
                summary['transformations'].append(f"Filled {original_missing} missing values with most common value ({mode_val})")
        
        elif strategy == 'fill_unknown' and original_missing > 0:
            df_cleaned[column_name].fillna('Unknown', inplace=True)
            summary['transformations'].append(f"Filled {original_missing} missing values with 'Unknown'")
        
        elif strategy == 'remove_rows' and original_missing > 0:
            df_cleaned = df_cleaned.dropna(subset=[column_name])
            summary['transformations'].append(f"Removed {original_missing} rows with missing values")
    
    # Handle outliers
    if 'outlier_min' in answers or 'outlier_max' in answers:
        try:
            col = df_cleaned[column_name]
            min_val = float(answers.get('outlier_min', col.min()))
            max_val = float(answers.get('outlier_max', col.max()))
            
            outliers_found = ((col < min_val) | (col > max_val)).sum()
            if outliers_found > 0:
                # Treat outliers as missing, then fill
                df_cleaned.loc[(col < min_val) | (col > max_val), column_name] = np.nan
                summary['transformations'].append(f"Marked {outliers_found} outlier values as missing (outside range [{min_val}, {max_val}])")
        except (ValueError, TypeError):
            pass
    
    # Handle encoding
    if 'encoding' in answers:
        encoding = answers['encoding']
        
        if encoding == 'onehot':
            # One-hot encoding
            dummies = pd.get_dummies(df_cleaned[column_name], prefix=column_name, dtype=int)
            df_cleaned = pd.concat([df_cleaned, dummies], axis=1)
            summary['new_columns'] = dummies.columns.tolist()
            summary['transformations'].append(f"Created {len(dummies.columns)} one-hot encoded columns")
            # Drop original
            df_cleaned = df_cleaned.drop(columns=[column_name])
        
        elif encoding == 'label':
            # Label encoding
            unique_values = df_cleaned[column_name].dropna().unique()
            mapping = {val: idx for idx, val in enumerate(unique_values)}
            df_cleaned[column_name] = df_cleaned[column_name].map(mapping)
            summary['transformations'].append(f"Label encoded with mapping: {mapping}")
        
        elif encoding == 'binary':
            # Binary encoding (Yes/No, True/False, etc.)
            yes_values = answers.get('yes_values', ['yes', 'true', '1', 'y', 't'])
            df_cleaned[column_name] = df_cleaned[column_name].astype(str).str.lower().isin(yes_values).astype(int)
            summary['transformations'].append("Converted to binary (0/1)")
    
    # Handle categorical cleanup (merge typos)
    if 'merge_values' in answers:
        merges = answers['merge_values']  # Dict of {old_value: new_value}
        if merges:
            df_cleaned[column_name] = df_cleaned[column_name].replace(merges)
            summary['transformations'].append(f"Merged {len(merges)} duplicate/typo values")
    
    # Handle date transformations
    if 'date_transform' in answers:
        transform = answers['date_transform']
        
        if transform == 'extract_year':
            df_cleaned[f'{column_name}_year'] = pd.to_datetime(df_cleaned[column_name], errors='coerce').dt.year
            summary['new_columns'].append(f'{column_name}_year')
            summary['transformations'].append("Extracted year as new column")
            df_cleaned = df_cleaned.drop(columns=[column_name])
        
        elif transform == 'days_elapsed':
            reference_date = answers.get('reference_date', datetime.now().isoformat())
            ref_dt = pd.to_datetime(reference_date)
            dates = pd.to_datetime(df_cleaned[column_name], errors='coerce')
            df_cleaned[f'{column_name}_days_elapsed'] = (ref_dt - dates).dt.days
            summary['new_columns'].append(f'{column_name}_days_elapsed')
            summary['transformations'].append(f"Calculated days elapsed from {reference_date}")
            df_cleaned = df_cleaned.drop(columns=[column_name])
    
    # Handle numeric to categorical conversion
    if answers.get('treat_as') == 'categorical':
        df_cleaned[column_name] = df_cleaned[column_name].astype(str)
        summary['transformations'].append("Converted to categorical (string type)")
    
    return df_cleaned, summary


def get_cleaning_summary(transformations: List[Dict]) -> Dict[str, Any]:
    """
    Generate a summary of all cleaning transformations.
    
    Args:
        transformations: List of transformation summaries
        
    Returns:
        Overall cleaning summary
    """
    ready_columns = []
    excluded_columns = []
    new_columns = []
    total_transformations = 0
    
    for trans in transformations:
        if trans.get('excluded'):
            excluded_columns.append(trans['column'])
        else:
            ready_columns.append(trans['column'])
        
        new_columns.extend(trans.get('new_columns', []))
        total_transformations += len(trans.get('transformations', []))
    
    return {
        'ready_columns': ready_columns,
        'excluded_columns': excluded_columns,
        'new_columns': new_columns,
        'total_transformations': total_transformations,
        'summary_text': f"✅ {len(ready_columns)} columns ready, 🚫 {len(excluded_columns)} excluded, ➕ {len(new_columns)} new columns created"
    }
