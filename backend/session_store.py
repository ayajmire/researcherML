"""
Session Storage for ResearcherML
File-system based session persistence to survive server restarts
"""

import json
import pathlib
from typing import Dict, Any, Optional


# Sessions directory
SESSIONS_DIR = pathlib.Path("sessions")
SESSIONS_DIR.mkdir(exist_ok=True)


def save_session(file_id: str, data: Dict[str, Any]) -> None:
    """
    Save session data to disk.
    
    Args:
        file_id: Unique file identifier
        data: Session data dictionary
    """
    # Save metadata (everything except large content)
    metadata = {k: v for k, v in data.items() if k not in ['content', 'data']}
    metadata_path = SESSIONS_DIR / f"{file_id}.json"
    metadata_path.write_text(json.dumps(metadata, indent=2, default=str))
    
    # Save content separately as raw file (if exists)
    if 'content' in data:
        content_path = SESSIONS_DIR / f"{file_id}.data"
        content_path.write_text(data['content'])
    
    # Save processed data separately (if exists)
    if 'data' in data and isinstance(data['data'], list):
        data_path = SESSIONS_DIR / f"{file_id}.jsonl"
        with open(data_path, 'w') as f:
            for row in data['data']:
                f.write(json.dumps(row, default=str) + '\n')


def load_session(file_id: str) -> Optional[Dict[str, Any]]:
    """
    Load session data from disk.
    
    Args:
        file_id: Unique file identifier
        
    Returns:
        Session data dictionary or None if not found
    """
    metadata_path = SESSIONS_DIR / f"{file_id}.json"
    if not metadata_path.exists():
        return None
    
    # Load metadata
    try:
        data = json.loads(metadata_path.read_text())
    except (json.JSONDecodeError, IOError):
        return None
    
    # Load content if exists
    content_path = SESSIONS_DIR / f"{file_id}.data"
    if content_path.exists():
        try:
            data['content'] = content_path.read_text()
        except IOError:
            pass
    
    # Load processed data if exists
    data_path = SESSIONS_DIR / f"{file_id}.jsonl"
    if data_path.exists():
        try:
            data['data'] = []
            with open(data_path, 'r') as f:
                for line in f:
                    if line.strip():
                        data['data'].append(json.loads(line))
        except (json.JSONDecodeError, IOError):
            pass
    
    return data


def delete_session(file_id: str) -> None:
    """
    Delete session data from disk.
    
    Args:
        file_id: Unique file identifier
    """
    for suffix in ['.json', '.data', '.jsonl']:
        path = SESSIONS_DIR / f"{file_id}{suffix}"
        if path.exists():
            path.unlink()


def list_sessions() -> list:
    """
    List all session IDs.
    
    Returns:
        List of session file IDs
    """
    return [p.stem for p in SESSIONS_DIR.glob("*.json")]


def cleanup_old_sessions(max_age_days: int = 7) -> int:
    """
    Delete sessions older than max_age_days.
    
    Args:
        max_age_days: Maximum age in days
        
    Returns:
        Number of sessions deleted
    """
    import time
    current_time = time.time()
    max_age_seconds = max_age_days * 24 * 60 * 60
    deleted_count = 0
    
    for metadata_file in SESSIONS_DIR.glob("*.json"):
        file_age = current_time - metadata_file.stat().st_mtime
        if file_age > max_age_seconds:
            file_id = metadata_file.stem
            delete_session(file_id)
            deleted_count += 1
    
    return deleted_count
