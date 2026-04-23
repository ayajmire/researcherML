"""
Time Series Utilities for ResearcherML
Provides analysis, resampling, and audio processing for time series data
"""

import pandas as pd
import numpy as np
from scipy import signal as scipy_signal
from typing import Dict, Tuple, Optional


def detect_frequency(df: pd.DataFrame, timestamp_column: Optional[str] = None) -> float:
    """
    Detect the sampling frequency of a time series in Hz.
    
    Args:
        df: Time series DataFrame
        timestamp_column: Name of the timestamp column (if exists)
        
    Returns:
        Frequency in Hz (samples per second)
    """
    if timestamp_column and timestamp_column in df.columns:
        try:
            timestamps = pd.to_datetime(df[timestamp_column], errors='coerce').dropna()
            if len(timestamps) < 2:
                return 1.0
            
            intervals = timestamps.diff().dropna().dt.total_seconds()
            median_interval = intervals.median()
            
            if median_interval > 0:
                return round(1.0 / median_interval, 4)
        except Exception as e:
            print(f"Warning: Could not detect frequency from timestamps: {e}")
            return 1.0
    
    return 1.0  # Default: assume 1 sample per unit time


def analyze_time_series(df: pd.DataFrame, timestamp_column: Optional[str] = None) -> Dict:
    """
    Full analysis of a time series DataFrame.
    
    Args:
        df: Time series DataFrame
        timestamp_column: Name of the timestamp column (if exists)
        
    Returns:
        Dictionary containing frequency, sample count, signal columns, and statistics
    """
    frequency = detect_frequency(df, timestamp_column)
    
    # Identify signal columns (numeric, not time-related)
    time_keywords = ['time', 'timestamp', 'date', 'sample', 'index', 't']
    signal_columns = [
        col for col in df.columns
        if pd.api.types.is_numeric_dtype(df[col])
        and not any(kw in col.lower() for kw in time_keywords)
    ]
    
    sample_count = len(df)
    duration_seconds = sample_count / frequency if frequency > 0 else sample_count
    
    # Calculate statistics for each signal column
    stats = {}
    for col in signal_columns[:10]:  # Limit to first 10 for performance
        series = df[col].dropna()
        if len(series) > 0:
            stats[col] = {
                'mean': float(series.mean()),
                'std': float(series.std()),
                'min': float(series.min()),
                'max': float(series.max()),
                'missing_pct': float(df[col].isna().mean() * 100)
            }
    
    return {
        'frequency': frequency,
        'sample_count': sample_count,
        'signal_columns': signal_columns,
        'timestamp_column': timestamp_column,
        'duration_seconds': duration_seconds,
        'column_stats': stats
    }


def downsample_time_series(
    df: pd.DataFrame,
    target_freq: float,
    original_freq: float,
    timestamp_column: Optional[str] = None,
    method: str = 'average'
) -> pd.DataFrame:
    """
    Downsample time series from original_freq to target_freq.
    
    Args:
        df: Time series DataFrame
        target_freq: Target sampling frequency in Hz
        original_freq: Original sampling frequency in Hz
        timestamp_column: Name of timestamp column
        method: Aggregation method ('average', 'max', 'min', 'first', 'last')
        
    Returns:
        Downsampled DataFrame
    """
    if target_freq >= original_freq:
        return df  # No downsampling needed
    
    factor = int(round(original_freq / target_freq))
    
    # Get numeric columns (excluding timestamp)
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if timestamp_column and timestamp_column in numeric_cols:
        numeric_cols.remove(timestamp_column)
    
    # Map method to pandas aggregation function
    agg_funcs = {
        'average': 'mean',
        'max': 'max',
        'min': 'min',
        'first': 'first',
        'last': 'last'
    }
    agg = agg_funcs.get(method, 'mean')
    
    # Create group indices for downsampling
    groups = np.arange(len(df)) // factor
    result = df.groupby(groups)[numeric_cols].agg(agg).reset_index(drop=True)
    
    # Reconstruct timestamp if present
    if timestamp_column and timestamp_column in df.columns:
        ts_groups = df.groupby(groups)[timestamp_column].first().reset_index(drop=True)
        result.insert(0, timestamp_column, ts_groups)
    
    return result


def validate_frequency_conversion(original_freq: float, target_freq: float) -> Tuple[bool, str]:
    """
    Validate if frequency conversion is possible and safe.
    
    Args:
        original_freq: Original sampling frequency in Hz
        target_freq: Target sampling frequency in Hz
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if target_freq <= 0:
        return False, "Target frequency must be greater than 0"
    
    if target_freq > original_freq:
        return False, f"Cannot upsample: target ({target_freq} Hz) > original ({original_freq} Hz)"
    
    if original_freq / target_freq > 1000:
        return False, "Downsampling ratio too large (max 1000x). Choose a higher target frequency."
    
    return True, ""


def process_audio_file(audio_bytes: bytes, sample_rate: Optional[int] = None) -> Dict:
    """
    Process raw audio bytes into a time series DataFrame.
    
    Args:
        audio_bytes: Raw audio file bytes
        sample_rate: Target sample rate (None = use original)
        
    Returns:
        Dictionary containing DataFrame, frequency, and metadata
        
    Raises:
        ImportError: If librosa or soundfile are not installed
    """
    try:
        import librosa
        import soundfile as sf
        import io
    except ImportError:
        raise ImportError(
            "Audio processing requires librosa and soundfile. "
            "Install with: pip install librosa soundfile"
        )
    
    # Load audio from bytes
    audio_buffer = io.BytesIO(audio_bytes)
    audio_array, sr = librosa.load(audio_buffer, sr=sample_rate, mono=True)
    
    duration = len(audio_array) / sr
    timestamps = np.arange(len(audio_array)) / sr
    
    # Create DataFrame
    df = pd.DataFrame({
        'timestamp': timestamps,
        'amplitude': audio_array
    })
    
    return {
        'data': df,
        'frequency': float(sr),
        'sample_rate': sr,
        'duration': duration,
        'sample_count': len(audio_array)
    }
