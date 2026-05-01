import json
import os
import tempfile
from datetime import datetime


def append_to_json(file_path, record):
    """Atomically append a record to a JSON array file (legacy backup path)."""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                data = []
    else:
        data = []

    data.append(record)

    dir_name = os.path.dirname(file_path) or "."
    with tempfile.NamedTemporaryFile("w", dir=dir_name, delete=False, suffix=".tmp") as tmp:
        json.dump(data, tmp, indent=4)
        tmp_path = tmp.name

    os.replace(tmp_path, file_path)


def store_response_db(run_id: int, record: dict):
    """Persist a single response to SQLite."""
    from db.database import SessionLocal
    from db.models import Response

    ts = None
    if record.get("timestamp"):
        try:
            ts = datetime.fromisoformat(record["timestamp"])
        except ValueError:
            pass

    db = SessionLocal()
    try:
        db.add(Response(
            run_id=run_id,
            prompt_id=record["prompt_id"],
            prompt_text=record["prompt_text"],
            stage=record["stage"],
            run_number=record["run"],
            response=record["response"],
            tone=record.get("tone"),
            timestamp=ts,
        ))
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
