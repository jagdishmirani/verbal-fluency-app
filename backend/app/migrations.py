from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


_NORMALIZE_SQL = "lower(trim(word))"


def apply_local_sqlite_migrations(engine: Engine) -> None:
    """Apply small local-only SQLite migrations.

    This project intentionally avoids a full migration framework for v1. These
    checks keep existing local databases usable when the app gains small schema
    enhancements. Future cloud versions should replace this with Alembic.
    """

    if not engine.url.get_backend_name().startswith("sqlite"):
        return

    inspector = inspect(engine)
    if "words" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("words")}

    with engine.begin() as connection:
        if "normalized_word" not in columns:
            connection.execute(text("ALTER TABLE words ADD COLUMN normalized_word VARCHAR(160)"))

        # Backfill older rows. SQLite does not have a portable regexp replace,
        # so SQL backfill trims and lowercases; new app writes use Python's
        # whitespace-collapsing normalize_word helper.
        connection.execute(
            text(f"UPDATE words SET normalized_word = {_NORMALIZE_SQL} WHERE normalized_word IS NULL OR normalized_word = ''")
        )

        # Enforce duplicate prevention at the database layer too. If an older
        # database already contains duplicates, this index may fail; the app's
        # API-level check will still block new duplicates. In that rare case,
        # remove or rename older duplicate records and restart the backend.
        try:
            connection.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS "
                    "ix_words_owner_normalized_word_unique "
                    "ON words(owner_id, normalized_word)"
                )
            )
        except Exception:
            # Keep startup usable for existing local databases that may already
            # contain duplicate words from older versions.
            pass
