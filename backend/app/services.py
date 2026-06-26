import random
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Word


def choose_weighted_drill_word(db: Session, owner_id: str, exclude_id: int | None = None) -> Word | None:
    """Choose a drill word and record that it was shown.

    Selection is intentionally simple and transparent for v1:
    each word receives a weight of 1 / (shown_count + 1), so words shown
    fewer times are more likely to appear. When more than one word exists,
    the previous word can be excluded to avoid showing the same card twice
    in a row.
    """

    all_words = list(db.scalars(select(Word).where(Word.owner_id == owner_id)).all())
    if not all_words:
        return None

    candidates = all_words
    if exclude_id is not None and len(all_words) > 1:
        filtered = [word for word in all_words if word.id != exclude_id]
        if filtered:
            candidates = filtered

    weights = [1 / (word.shown_count + 1) for word in candidates]
    selected = random.choices(candidates, weights=weights, k=1)[0]

    selected.shown_count += 1
    selected.last_shown_at = datetime.now(timezone.utc)
    db.add(selected)
    db.commit()
    db.refresh(selected)
    return selected
