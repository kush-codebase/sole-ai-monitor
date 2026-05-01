import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DATA_DIR = os.path.join(_ROOT, "data")
os.makedirs(_DATA_DIR, exist_ok=True)

_DB_PATH = os.environ.get("DATABASE_PATH") or os.path.join(_DATA_DIR, "sole.db")
DATABASE_URL = f"sqlite:///{_DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from db import models  # noqa: F401 — registers all ORM models before create_all
    Base.metadata.create_all(bind=engine)
    _add_missing_columns()


def _add_missing_columns():
    """Add new columns to existing tables without dropping data."""
    new_columns = [
        ("responses", "sentiment_confidence", "REAL"),
        ("responses", "sentiment_reasoning",  "TEXT"),
        ("responses", "embedding",             "TEXT"),
        ("responses", "cluster_id",            "INTEGER"),
    ]
    with engine.connect() as conn:
        for table, col, col_type in new_columns:
            try:
                conn.execute(
                    __import__("sqlalchemy").text(
                        f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"
                    )
                )
                conn.commit()
            except Exception:
                pass  # column already exists — safe to ignore
