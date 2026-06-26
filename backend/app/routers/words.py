from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings, Settings
from app.database import get_db
from app.models import Word
from app.schemas import CountOut, DrillWordOut, WordCreate, WordExistsOut, WordOut, normalize_word
from app.services import choose_weighted_drill_word

router = APIRouter(prefix="/api/words", tags=["words"])


def current_owner_id(settings: Settings = Depends(get_settings)) -> str:
    # Future authentication can replace this function and derive the owner_id
    # from the logged-in user instead of the local default.
    return settings.default_owner_id


def find_existing_word(db: Session, owner_id: str, word: str) -> Word | None:
    normalized = normalize_word(word)
    if not normalized:
        return None
    return db.scalar(
        select(Word).where(
            Word.owner_id == owner_id,
            Word.normalized_word == normalized,
        )
    )


@router.get("/exists", response_model=WordExistsOut)
def word_exists(
    word: str = Query(..., min_length=1, max_length=160),
    db: Session = Depends(get_db),
    owner_id: str = Depends(current_owner_id),
):
    return WordExistsOut(exists=find_existing_word(db, owner_id, word) is not None)


@router.post("", response_model=WordOut, status_code=status.HTTP_201_CREATED)
def add_word(payload: WordCreate, db: Session = Depends(get_db), owner_id: str = Depends(current_owner_id)):
    normalized = normalize_word(payload.word)
    if find_existing_word(db, owner_id, payload.word) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This word is already in your curated list.",
        )

    word = Word(
        owner_id=owner_id,
        word=payload.word,
        normalized_word=normalized,
        part_of_speech=payload.part_of_speech,
        definition=payload.definition,
        example_sentence=payload.example_sentence,
    )
    db.add(word)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This word is already in your curated list.",
        )
    db.refresh(word)
    return word


@router.get("/count", response_model=CountOut)
def get_word_count(db: Session = Depends(get_db), owner_id: str = Depends(current_owner_id)):
    count = db.scalar(select(func.count()).select_from(Word).where(Word.owner_id == owner_id)) or 0
    return CountOut(count=count)


@router.get("/drill", response_model=DrillWordOut)
def get_drill_word(
    exclude_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
    owner_id: str = Depends(current_owner_id),
):
    word = choose_weighted_drill_word(db=db, owner_id=owner_id, exclude_id=exclude_id)
    if word is None:
        return DrillWordOut(word=None, message="No words to show.")
    return DrillWordOut(word=word)


@router.get("", response_model=list[WordOut])
def list_words(db: Session = Depends(get_db), owner_id: str = Depends(current_owner_id)):
    words = db.scalars(select(Word).where(Word.owner_id == owner_id).order_by(Word.created_at.desc())).all()
    return list(words)


@router.put("/{word_id}", response_model=WordOut)
def update_word(
    word_id: int,
    payload: WordCreate,
    db: Session = Depends(get_db),
    owner_id: str = Depends(current_owner_id),
):
    word = db.get(Word, word_id)
    if word is None or word.owner_id != owner_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Word not found.")

    normalized = normalize_word(payload.word)
    duplicate = find_existing_word(db, owner_id, payload.word)
    if duplicate is not None and duplicate.id != word_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This word is already in your curated list.",
        )

    word.word = payload.word
    word.normalized_word = normalized
    word.part_of_speech = payload.part_of_speech
    word.definition = payload.definition
    word.example_sentence = payload.example_sentence

    db.add(word)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This word is already in your curated list.",
        )
    db.refresh(word)
    return word


@router.delete("/{word_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_word(word_id: int, db: Session = Depends(get_db), owner_id: str = Depends(current_owner_id)):
    word = db.get(Word, word_id)
    if word is None or word.owner_id != owner_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Word not found.")
    db.delete(word)
    db.commit()
    return None
