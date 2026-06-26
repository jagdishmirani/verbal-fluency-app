from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


ALLOWED_PARTS_OF_SPEECH = {"Noun", "Verb", "Adjective", "Adverb", "Phrase", "Other"}


def normalize_word(value: str) -> str:
    """Normalize a word for duplicate checks.

    The display word keeps the user's capitalization, but duplicate detection
    should treat "Lucid", "lucid", and "  lucid  " as the same curated word.
    Collapsing internal whitespace also prevents duplicates such as
    "turn of phrase" and "turn   of   phrase".
    """

    return " ".join(value.strip().lower().split())


class WordCreate(BaseModel):
    word: str = Field(..., min_length=1, max_length=160)
    part_of_speech: str = Field(..., min_length=1, max_length=40)
    definition: str = Field(..., min_length=1)
    example_sentence: Optional[str] = None

    @field_validator("word", "part_of_speech", "definition")
    @classmethod
    def required_text_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank.")
        return value

    @field_validator("part_of_speech")
    @classmethod
    def part_of_speech_must_be_supported(cls, value: str) -> str:
        if value not in ALLOWED_PARTS_OF_SPEECH:
            raise ValueError(f"Part of speech must be one of: {', '.join(sorted(ALLOWED_PARTS_OF_SPEECH))}.")
        return value

    @field_validator("example_sentence")
    @classmethod
    def normalize_optional_example(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        return value or None


class WordOut(BaseModel):
    id: int
    owner_id: str
    word: str
    part_of_speech: str
    definition: str
    example_sentence: Optional[str]
    shown_count: int
    created_at: datetime
    last_shown_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class CountOut(BaseModel):
    count: int


class WordExistsOut(BaseModel):
    exists: bool


class DrillWordOut(BaseModel):
    word: Optional[WordOut] = None
    message: Optional[str] = None
