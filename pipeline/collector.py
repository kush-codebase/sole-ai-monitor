import time
from datetime import datetime

import openai

from config.prompts import PROMPTS
from config.settings import RUNS_PER_PROMPT, MODEL_NAME, TEMPERATURE
from langchain_layer.chains import collect_response as lc_collect
from pipeline.storage import store_response_db
from db.database import SessionLocal, init_db
from db.models import Run

MAX_RETRIES = 3
RETRY_BASE_DELAY = 2  # seconds, doubles each attempt


def _create_run(db, notes: str = "") -> Run:
    run = Run(
        model=MODEL_NAME,
        temperature=TEMPERATURE,
        prompts_count=len(PROMPTS),
        responses_count=0,
        notes=notes,
        created_at=datetime.utcnow(),
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def run_collection(notes: str = ""):
    init_db()

    db = SessionLocal()
    try:
        run = _create_run(db, notes)
        run_id = run.id
        print(f"Starting collection — run ID {run_id}")
    finally:
        db.close()

    collected = 0
    skipped   = 0

    for prompt in PROMPTS:
        prompt_id   = prompt["id"]
        prompt_text = prompt["text"]
        stage       = prompt["stage"]

        for run_num in range(1, RUNS_PER_PROMPT + 1):
            print(f"  Prompt {prompt_id:>2} | {stage:<10} | run {run_num}")

            response = None
            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    response = lc_collect(prompt_text)
                    break
                except openai.AuthenticationError as e:
                    print(f"    Auth failed: {e}")
                    raise
                except openai.RateLimitError:
                    wait = RETRY_BASE_DELAY * (2 ** (attempt - 1))
                    print(f"    Rate limited — retry {attempt}/{MAX_RETRIES} in {wait}s")
                    time.sleep(wait)
                except (openai.APIConnectionError, openai.APITimeoutError) as e:
                    wait = RETRY_BASE_DELAY * (2 ** (attempt - 1))
                    print(f"    Transient error: {e} — retry {attempt}/{MAX_RETRIES} in {wait}s")
                    time.sleep(wait)
                except Exception as e:
                    print(f"    Unexpected error on prompt {prompt_id} run {run_num}: {e}")
                    break

            if response:
                store_response_db(run_id, {
                    "prompt_id":   prompt_id,
                    "prompt_text": prompt_text,
                    "stage":       stage,
                    "run":         run_num,
                    "response":    response,
                    "timestamp":   datetime.utcnow().isoformat(),
                })
                collected += 1
            else:
                print(f"    SKIPPED — no response after {MAX_RETRIES} attempts")
                skipped += 1

    # Update final count on the run record
    db = SessionLocal()
    try:
        db.query(Run).filter(Run.id == run_id).update({"responses_count": collected})
        db.commit()
    finally:
        db.close()

    print(f"Collection complete — run {run_id}: {collected} saved, {skipped} skipped.")
    return run_id
