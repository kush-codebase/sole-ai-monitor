from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import distinct
from sqlalchemy.orm import Session

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from db.database import get_db, init_db
from db.models import Run, Response as Resp, Explanation
from analytics.brand_detector import detect_brands
from config.brands import BRANDS
from cache.store import get_or_compute, invalidate
from config.settings import CACHE_TTL


# ─── Startup ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="SOLE AI Monitor", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ─── Shared helpers ───────────────────────────────────────────────────────────

def _query(db: Session, run_id: Optional[int], stage: Optional[str]) -> list[Resp]:
    q = db.query(Resp)
    if run_id:
        q = q.filter(Resp.run_id == run_id)
    if stage and stage != "All":
        q = q.filter(Resp.stage == stage)
    return q.all()


def _compute(rows: list[Resp]) -> dict:
    total_mentions: dict[str, int] = {}
    first_mentions: dict[str, int] = {}
    stage_mentions: dict[str, dict[str, int]] = {}
    stage_tone:     dict[str, dict[str, int]] = {}

    for row in rows:
        mentioned, first = detect_brands(row.response, BRANDS)

        for brand in mentioned:
            total_mentions[brand] = total_mentions.get(brand, 0) + 1
            sm = stage_mentions.setdefault(row.stage, {})
            sm[brand] = sm.get(brand, 0) + 1

        if first:
            first_mentions[first] = first_mentions.get(first, 0) + 1

        if row.tone:
            st = stage_tone.setdefault(row.stage, {})
            st[row.tone] = st.get(row.tone, 0) + 1

    return {
        "total_mentions": total_mentions,
        "first_mentions": first_mentions,
        "stage_mentions": stage_mentions,
        "stage_tone":     stage_tone,
    }


def _kpis(m: dict, count: int) -> dict:
    tm = m["total_mentions"]
    sm = m["stage_mentions"]
    return {
        "total_responses": count,
        "brands_detected": len(tm),
        "top_brand":       max(tm, key=tm.get) if tm else None,
        "dominant_stage":  max(sm, key=lambda s: sum(sm[s].values())) if sm else None,
    }


def _meta(**kwargs) -> dict:
    return {"generated_at": datetime.utcnow().isoformat() + "Z", **kwargs}


# ─── /api/stages ──────────────────────────────────────────────────────────────

@app.get("/api/stages")
def get_stages(run_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(distinct(Resp.stage))
    if run_id:
        q = q.filter(Resp.run_id == run_id)
    return {
        "stages": sorted(s[0] for s in q.all()),
        "meta":   _meta(run_id=run_id),
    }


# ─── /api/runs ────────────────────────────────────────────────────────────────

@app.get("/api/runs")
def get_runs(db: Session = Depends(get_db)):
    runs = db.query(Run).order_by(Run.created_at.desc()).all()
    return {
        "data": [
            {
                "id":              r.id,
                "created_at":      r.created_at.isoformat() + "Z",
                "model":           r.model,
                "temperature":     r.temperature,
                "prompts_count":   r.prompts_count,
                "responses_count": r.responses_count,
                "notes":           r.notes,
            }
            for r in runs
        ],
        "meta": _meta(),
    }


# ─── /api/metrics ─────────────────────────────────────────────────────────────

@app.get("/api/metrics")
def get_metrics(
    stage:  str            = "All",
    run_id: Optional[int]  = None,
    db:     Session        = Depends(get_db),
):
    cache_key = f"metrics:{stage}:{run_id}"

    def _compute_metrics():
        rows = _query(db, run_id, stage)
        m = _compute(rows)
        return {
            "kpis":           _kpis(m, len(rows)),
            "total_mentions": m["total_mentions"],
            "first_mentions": m["first_mentions"],
            "stage_mentions": m["stage_mentions"],
            "stage_tone":     m["stage_tone"],
        }

    data = get_or_compute(cache_key, _compute_metrics, ttl=CACHE_TTL)
    return {"data": data, "meta": _meta(stage=stage, run_id=run_id)}


# ─── /api/stage/{stage} ───────────────────────────────────────────────────────

@app.get("/api/stage/{stage}")
def get_stage(
    stage:  str,
    run_id: Optional[int] = None,
    db:     Session       = Depends(get_db),
):
    rows = _query(db, run_id, stage)
    if not rows:
        raise HTTPException(404, f"No responses found for stage '{stage}'")

    m    = _compute(rows)
    tone = m["stage_tone"].get(stage, {})
    tt   = sum(tone.values()) or 1

    return {
        "data": {
            "stage":          stage,
            "response_count": len(rows),
            "brand_mentions": m["total_mentions"],
            "first_mentions": m["first_mentions"],
            "top_brand":      max(m["total_mentions"], key=m["total_mentions"].get) if m["total_mentions"] else None,
            "tone": {
                t: {"count": c, "pct": round(c / tt * 100, 1)}
                for t, c in tone.items()
            },
        },
        "meta": _meta(stage=stage, run_id=run_id),
    }


# ─── /api/brands ──────────────────────────────────────────────────────────────

@app.get("/api/brands")
def get_brands(
    stage:  str           = "All",
    run_id: Optional[int] = None,
    db:     Session       = Depends(get_db),
):
    rows = _query(db, run_id, stage)
    m    = _compute(rows)
    tm   = m["total_mentions"]
    fm   = m["first_mentions"]
    sm   = m["stage_mentions"]
    total_all = sum(tm.values()) or 1

    result = sorted(
        [
            {
                "brand":          brand,
                "total_mentions": tm.get(brand, 0),
                "first_mentions": fm.get(brand, 0),
                "share_pct":      round(tm.get(brand, 0) / total_all * 100, 1),
                "by_stage":       {s: sm[s].get(brand, 0) for s in sm},
            }
            for brand in BRANDS
        ],
        key=lambda b: b["total_mentions"],
        reverse=True,
    )

    return {
        "data": result,
        "meta": _meta(stage=stage, run_id=run_id),
    }


# ─── /api/brands/{brand} ──────────────────────────────────────────────────────

@app.get("/api/brands/{brand}/explain")
def get_brand_explain(
    brand:  str,
    run_id: Optional[int] = None,
    db:     Session       = Depends(get_db),
):
    q = db.query(Explanation).filter(Explanation.brand.ilike(brand))
    if run_id:
        q = q.join(Resp).filter(Resp.run_id == run_id)
    rows = q.all()

    return {
        "data": [
            {
                "response_id":      e.response_id,
                "brand":            e.brand,
                "reason":           e.reason,
                "context_sentence": e.context_sentence,
                "attribute":        e.attribute,
                "overall_theme":    e.overall_theme,
            }
            for e in rows
        ],
        "meta": _meta(brand=brand, run_id=run_id),
    }


@app.get("/api/brands/{brand}")
def get_brand(
    brand:  str,
    run_id: Optional[int] = None,
    db:     Session       = Depends(get_db),
):
    q = db.query(Resp).filter(Resp.response.ilike(f"%{brand}%"))
    if run_id:
        q = q.filter(Resp.run_id == run_id)
    rows = q.all()

    if not rows:
        raise HTTPException(404, f"No responses found mentioning '{brand}'")

    m  = _compute(rows)
    tm = m["total_mentions"]
    sm = m["stage_mentions"]
    total_all = sum(tm.values()) or 1

    return {
        "data": {
            "brand":             brand,
            "total_mentions":    tm.get(brand, 0),
            "first_mentions":    m["first_mentions"].get(brand, 0),
            "share_pct":         round(tm.get(brand, 0) / total_all * 100, 1),
            "by_stage":          {s: {"count": sm[s].get(brand, 0)} for s in sm},
            "co_mentioned_with": {b: c for b, c in sorted(tm.items(), key=lambda x: -x[1]) if b != brand},
        },
        "meta": _meta(brand=brand, run_id=run_id),
    }


# ─── /api/tone ────────────────────────────────────────────────────────────────

@app.get("/api/tone")
def get_tone(
    stage:  str           = "All",
    run_id: Optional[int] = None,
    db:     Session       = Depends(get_db),
):
    rows = _query(db, run_id, stage)
    m    = _compute(rows)
    return {
        "data": {"stage_tone": m["stage_tone"]},
        "meta": _meta(stage=stage, run_id=run_id),
    }


# ─── /api/clusters ────────────────────────────────────────────────────────────

@app.get("/api/clusters")
def get_clusters(
    run_id: Optional[int] = None,
    db:     Session       = Depends(get_db),
):
    from embeddings.patterns import analyze_patterns
    patterns = analyze_patterns(run_id=run_id)
    return {"data": patterns, "meta": _meta(run_id=run_id)}


# ─── /api/patterns ────────────────────────────────────────────────────────────

@app.get("/api/patterns")
def get_patterns(
    run_id: Optional[int] = None,
    db:     Session       = Depends(get_db),
):
    from embeddings.patterns import analyze_patterns
    patterns = analyze_patterns(run_id=run_id)
    return {"data": patterns, "meta": _meta(run_id=run_id)}


# ─── /api/rag/search ──────────────────────────────────────────────────────────

@app.get("/api/rag/search")
def rag_search(
    q:      str                 = Query(..., description="Natural-language search query"),
    n:      int                 = Query(5, ge=1, le=20),
    stage:  Optional[str]       = None,
):
    from embeddings.rag import semantic_search
    results = semantic_search(query=q, n_results=n, stage=stage)
    return {"data": results, "meta": _meta(query=q, stage=stage)}


# ─── /api/debug ───────────────────────────────────────────────────────────────

@app.get("/api/debug")
def debug_info(db: Session = Depends(get_db)):
    import os
    from db.database import _DB_PATH
    return {
        "db_path":    _DB_PATH,
        "db_exists":  os.path.isfile(_DB_PATH),
        "db_size":    os.path.getsize(_DB_PATH) if os.path.isfile(_DB_PATH) else 0,
        "cwd":        os.getcwd(),
        "runs_count": db.query(Run).count(),
    }


# ─── /api/cache/invalidate ────────────────────────────────────────────────────

@app.post("/api/cache/invalidate")
def invalidate_cache(key: Optional[str] = None):
    invalidate(key)
    return {"ok": True, "key": key or "all"}
