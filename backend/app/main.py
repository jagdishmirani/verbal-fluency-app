from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app.migrations import apply_local_sqlite_migrations
from app.routers.words import router as words_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # For the local v1 app, create the SQLite schema automatically.
    # Future cloud versions can replace this with Alembic migrations.
    Base.metadata.create_all(bind=engine)
    apply_local_sqlite_migrations(engine)
    yield


app = FastAPI(
    title="Verbal Fluency API",
    description="Local-first API for a personal verbal fluency and word recall app.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


app.include_router(words_router)
