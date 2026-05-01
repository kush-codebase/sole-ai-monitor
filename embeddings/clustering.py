"""K-means clustering on response embeddings."""
import json
import logging
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import Response
from config.settings import N_CLUSTERS

log = logging.getLogger(__name__)


def _load_embeddings(db: Session, run_id: int | None = None):
    query = db.query(Response).filter(Response.embedding.isnot(None))
    if run_id is not None:
        query = query.filter(Response.run_id == run_id)
    rows = query.all()
    ids = [r.id for r in rows]
    matrix = np.array([json.loads(r.embedding) for r in rows], dtype=np.float32)
    return ids, matrix


def find_optimal_clusters(matrix: np.ndarray, max_k: int = 8) -> int:
    """Return k with best silhouette score in range [2, max_k]."""
    best_k, best_score = 2, -1.0
    for k in range(2, min(max_k + 1, len(matrix))):
        labels = KMeans(n_clusters=k, random_state=42, n_init=10).fit_predict(matrix)
        score = silhouette_score(matrix, labels)
        if score > best_score:
            best_k, best_score = k, score
    log.info("Optimal k=%d (silhouette=%.3f)", best_k, best_score)
    return best_k


def cluster_responses(run_id: int | None = None, auto_k: bool = False) -> dict:
    """Assign cluster_id to each embedded response and return cluster summary."""
    db: Session = SessionLocal()
    try:
        ids, matrix = _load_embeddings(db, run_id)
        if len(ids) < 2:
            return {"clusters": 0, "assigned": 0}

        k = find_optimal_clusters(matrix) if auto_k else min(N_CLUSTERS, len(ids))
        km = KMeans(n_clusters=k, random_state=42, n_init=10).fit(matrix)

        for row_id, label in zip(ids, km.labels_):
            db.query(Response).filter(Response.id == row_id).update(
                {"cluster_id": int(label)}
            )
        db.commit()
        return {"clusters": k, "assigned": len(ids)}
    finally:
        db.close()
