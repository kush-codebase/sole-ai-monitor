import logging
from pipeline.sentiment import classify_sentiment_full
from db.database import SessionLocal, init_db
from db.models import Response

log = logging.getLogger(__name__)


def add_sentiment_layer(run_id: int | None = None):
    """Classify tone (+ confidence + reasoning) for all unclassified responses."""
    init_db()

    db = SessionLocal()
    try:
        q = db.query(Response).filter(Response.tone.is_(None))
        if run_id:
            q = q.filter(Response.run_id == run_id)
        pending = q.all()
    finally:
        db.close()

    if not pending:
        log.info("[sentiment] Nothing to classify.")
        return

    log.info("[sentiment] Classifying %d responses...", len(pending))

    for i, resp in enumerate(pending, 1):
        result = classify_sentiment_full(resp.response)
        db = SessionLocal()
        try:
            db.query(Response).filter(Response.id == resp.id).update({
                "tone":                 result["tone"],
                "sentiment_confidence": result["confidence"],
                "sentiment_reasoning":  result["reasoning"],
            })
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

        if i % 10 == 0 or i == len(pending):
            log.info("  %d/%d classified", i, len(pending))

    log.info("[sentiment] Done.")
