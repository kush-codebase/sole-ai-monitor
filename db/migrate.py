"""
One-time migration: import responses_with_sentiment.json → SQLite.
Run from the project root:  python db/migrate.py
"""
import json
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal, init_db
from db.models import Run, Response


def migrate():
    init_db()

    json_file = os.path.join("data", "responses_with_sentiment.json")
    if not os.path.exists(json_file):
        print(f"[migrate] {json_file} not found — nothing to import.")
        return

    with open(json_file) as f:
        data = json.load(f)

    if not data:
        print("[migrate] JSON file is empty.")
        return

    db = SessionLocal()
    try:
        if db.query(Run).count() > 0:
            print("[migrate] Database already populated — skipping. Delete data/sole.db to re-run.")
            return

        run = Run(
            model="gpt-4o-mini",
            temperature=0.7,
            prompts_count=len({r["prompt_id"] for r in data}),
            responses_count=len(data),
            notes="Imported from responses_with_sentiment.json",
            created_at=datetime.utcnow(),
        )
        db.add(run)
        db.flush()

        for record in data:
            ts = None
            if record.get("timestamp"):
                try:
                    ts = datetime.fromisoformat(record["timestamp"])
                except ValueError:
                    pass

            db.add(Response(
                run_id=run.id,
                prompt_id=record["prompt_id"],
                prompt_text=record["prompt_text"],
                stage=record["stage"],
                run_number=record["run"],
                response=record["response"],
                tone=record.get("tone"),
                timestamp=ts,
            ))

        db.commit()
        print(f"[migrate] Done — {len(data)} responses imported as run ID {run.id}.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
