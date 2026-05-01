"""Cluster pattern analysis — brand affinity, tone distribution, stage spread."""
from collections import Counter
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import Response
from analytics.brand_detector import detect_brands
from config.brands import BRANDS


def analyze_patterns(run_id: int | None = None) -> list[dict]:
    """Return per-cluster summary: dominant tone, top brands, top stages."""
    db: Session = SessionLocal()
    try:
        query = db.query(Response).filter(Response.cluster_id.isnot(None))
        if run_id is not None:
            query = query.filter(Response.run_id == run_id)
        rows = query.all()

        clusters: dict[int, list] = {}
        for row in rows:
            clusters.setdefault(row.cluster_id, []).append(row)

        result = []
        for cid in sorted(clusters):
            group = clusters[cid]
            tone_count: Counter = Counter()
            brand_count: Counter = Counter()
            stage_count: Counter = Counter()

            for row in group:
                if row.tone:
                    tone_count[row.tone] += 1
                if row.stage:
                    stage_count[row.stage] += 1
                mentioned, _ = detect_brands(row.response, BRANDS)
                for b in mentioned:
                    brand_count[b] += 1

            result.append({
                "cluster_id": cid,
                "size": len(group),
                "dominant_tone": tone_count.most_common(1)[0][0] if tone_count else None,
                "tone_distribution": dict(tone_count),
                "top_brands": [b for b, _ in brand_count.most_common(3)],
                "brand_counts": dict(brand_count),
                "stage_distribution": dict(stage_count),
            })
        return result
    finally:
        db.close()
