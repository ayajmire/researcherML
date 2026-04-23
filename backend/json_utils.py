"""
JSON Utilities for ResearcherML
Handles various JSON formats and converts them to DataFrames
"""

import json
import pandas as pd
from typing import Dict, Any, List


def detect_json_structure(content: str) -> Dict[str, Any]:
    """
    Detect the structure and format of JSON data.
    
    Args:
        content: JSON string
        
    Returns:
        Dictionary with structure metadata
    """
    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        return {
            'type': 'invalid',
            'error': str(e),
            'suggested_format': None
        }
    
    # Detect type
    if isinstance(data, list):
        if len(data) == 0:
            json_type = 'empty_array'
        elif isinstance(data[0], dict):
            json_type = 'array_of_objects'
        else:
            json_type = 'array_of_values'
    elif isinstance(data, dict):
        # Check if it's a time series format
        has_time_columns = any(
            key.lower() in ['time', 'timestamp', 'date', 't', 'datetime']
            for key in data.keys()
        )
        
        # Check if all values are arrays of same length
        if all(isinstance(v, list) for v in data.values()):
            lengths = [len(v) for v in data.values()]
            if len(set(lengths)) == 1:
                json_type = 'columnar_dict'
            else:
                json_type = 'nested_dict'
        else:
            json_type = 'single_object'
    else:
        json_type = 'primitive'
    
    # Calculate nesting depth
    nesting_depth = _calculate_nesting_depth(data)
    
    # Determine suggested format
    if json_type in ['array_of_objects', 'columnar_dict']:
        suggested_format = 'tabular'
    elif json_type == 'single_object' and isinstance(data, dict):
        if any(key.lower() in ['time', 'timestamp', 'date'] for key in data.keys()):
            suggested_format = 'time_series'
        else:
            suggested_format = 'tabular'
    elif nesting_depth > 2:
        suggested_format = 'nested'
    else:
        suggested_format = 'tabular'
    
    return {
        'type': json_type,
        'has_time_columns': has_time_columns if isinstance(data, dict) else False,
        'suggested_format': suggested_format,
        'nesting_depth': nesting_depth,
        'row_count': len(data) if isinstance(data, list) else 1
    }


def parse_json_to_dataframe(content: str) -> pd.DataFrame:
    """
    Parse JSON content and convert to a pandas DataFrame.
    Handles multiple JSON formats intelligently.
    
    Args:
        content: JSON string
        
    Returns:
        pandas DataFrame
        
    Raises:
        ValueError: If JSON format cannot be converted to DataFrame
    """
    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON: {str(e)}")
    
    # Handle different JSON structures
    
    # Case 1: Array of objects (most common for tabular data)
    if isinstance(data, list):
        if len(data) == 0:
            return pd.DataFrame()
        
        if isinstance(data[0], dict):
            # Array of objects - direct conversion
            return pd.DataFrame(data)
        else:
            # Array of primitive values - convert to single column
            return pd.DataFrame({'value': data})
    
    # Case 2: Dictionary (multiple sub-cases)
    elif isinstance(data, dict):
        # Case 2a: Columnar format (all values are arrays of same length)
        if all(isinstance(v, list) for v in data.values()):
            lengths = [len(v) for v in data.values()]
            if len(set(lengths)) == 1:
                # Perfect columnar format
                return pd.DataFrame(data)
        
        # Case 2b: Nested objects - try to flatten
        if _has_nested_structure(data):
            # Flatten nested dictionaries
            flattened = _flatten_dict(data)
            return pd.DataFrame([flattened])
        
        # Case 2c: Single flat object
        return pd.DataFrame([data])
    
    # Case 3: Primitive value
    else:
        return pd.DataFrame({'value': [data]})


def _calculate_nesting_depth(obj: Any, current_depth: int = 0) -> int:
    """Calculate the maximum nesting depth of a JSON structure."""
    if isinstance(obj, dict):
        if not obj:
            return current_depth
        return max(_calculate_nesting_depth(v, current_depth + 1) for v in obj.values())
    elif isinstance(obj, list):
        if not obj:
            return current_depth
        return max(_calculate_nesting_depth(item, current_depth + 1) for item in obj)
    else:
        return current_depth


def _has_nested_structure(obj: Dict) -> bool:
    """Check if a dictionary has nested dictionaries or lists."""
    for value in obj.values():
        if isinstance(value, (dict, list)):
            return True
    return False


def _flatten_dict(d: Dict, parent_key: str = '', sep: str = '_') -> Dict:
    """
    Flatten a nested dictionary.
    
    Example:
        {'a': {'b': 1, 'c': 2}} -> {'a_b': 1, 'a_c': 2}
    """
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        
        if isinstance(v, dict):
            items.extend(_flatten_dict(v, new_key, sep=sep).items())
        elif isinstance(v, list):
            # Convert list to comma-separated string
            items.append((new_key, ', '.join(str(x) for x in v)))
        else:
            items.append((new_key, v))
    
    return dict(items)
