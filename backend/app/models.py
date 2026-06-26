from datetime import datetime, timezone
from sqlalchemy import DateTime, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Word(Base):
    __tablename__ = "words"
    __table_args__ = (UniqueConstraint("owner_id", "normalized_word", name="uq_words_owner_normalized_word"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False, default="local-user")
    word: Mapped[str] = mapped_column(String(160), index=True, nullable=False)
    normalized_word: Mapped[str | None] = mapped_column(String(160), index=True, nullable=True)
    part_of_speech: Mapped[str] = mapped_column(String(40), nullable=False)
    definition: Mapped[str] = mapped_column(Text, nullable=False)
    example_sentence: Mapped[str | None] = mapped_column(Text, nullable=True)
    shown_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    last_shown_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
