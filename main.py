from db.database import SessionLocal, init_db
from db.models import Run, Response
from analytics.aggregator import aggregate_tone_by_stage

if __name__ == "__main__":
    init_db()

    db = SessionLocal()
    try:
        runs = db.query(Run).order_by(Run.created_at.desc()).all()
        if not runs:
            print("No runs in database. Run the collection pipeline first.")
        else:
            latest = runs[0]
            print(f"Latest run: ID {latest.id} | {latest.created_at} | {latest.responses_count} responses")
            rows = db.query(Response).filter(Response.run_id == latest.id).all()
            data = [{"stage": r.stage, "tone": r.tone} for r in rows if r.tone]
            stage_tone = aggregate_tone_by_stage(data)
            print("\n===== TONE DISTRIBUTION BY STAGE =====")
            for stage, tones in stage_tone.items():
                print(f"  {stage}: {dict(tones)}")
    finally:
        db.close()
