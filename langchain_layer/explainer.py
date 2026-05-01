"""Batch explainability processor — enriches DB rows with brand reasoning."""
import logging
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import Response, Explanation
from config.brands import BRANDS
from .chains import explain_brands

log = logging.getLogger(__name__)


def process_unexplained(run_id: int | None = None, limit: int = 100) -> int:
    """Explain brand mentions for responses that have no Explanation record yet."""
    db: Session = SessionLocal()
    processed = 0
    try:
        explained_ids = db.query(Explanation.response_id).distinct()
        query = db.query(Response).filter(Response.id.notin_(explained_ids))
        if run_id is not None:
            query = query.filter(Response.run_id == run_id)
        rows = query.limit(limit).all()

        for row in rows:
            try:
                result = explain_brands(row.response, BRANDS)
                for bc in result.brands:
                    db.add(Explanation(
                        response_id=row.id,
                        brand=bc.brand,
                        reason=bc.reason,
                        context_sentence=bc.context_sentence,
                        attribute=bc.attribute,
                        overall_theme=result.overall_theme,
                    ))
                db.commit()
                processed += 1
            except Exception as exc:
                db.rollback()
                log.warning("Explainability failed for response %d: %s", row.id, exc)
    finally:
        db.close()

    log.info("Explained %d responses.", processed)
    return processed
