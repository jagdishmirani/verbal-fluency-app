"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteWord, getDrillWord, WordRecord } from "@/lib/api";

export type AutoPlaySpeed = "slow" | "medium" | "fast" | null;

type DrillCardProps = {
  refreshSignal: number;
  onDeleted: () => Promise<void> | void;
  onEdit: (word: WordRecord) => void;
  preferredWord?: WordRecord | null;
  onAdvanced?: () => void;
  autoPlaySpeed: AutoPlaySpeed;
  autoPlayPaused: boolean;
  onAutoPlaySpeedChange: (speed: AutoPlaySpeed) => void;
  onAutoPlayPausedChange: (paused: boolean) => void;
};

const AUTO_PLAY_INTERVALS: Record<Exclude<AutoPlaySpeed, null>, number> = {
  slow: 20000,
  medium: 9000,
  fast: 4000,
};

const AUTO_PLAY_LABELS: Record<Exclude<AutoPlaySpeed, null>, string> = {
  slow: "Slow",
  medium: "Medium",
  fast: "Fast",
};

export default function DrillCard({
  refreshSignal,
  onDeleted,
  onEdit,
  preferredWord,
  onAdvanced,
  autoPlaySpeed,
  autoPlayPaused,
  onAutoPlaySpeedChange,
  onAutoPlayPausedChange,
}: DrillCardProps) {
  const [currentWord, setCurrentWord] = useState<WordRecord | null>(null);
  const [message, setMessage] = useState("No words to show.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadWord = useCallback(async (excludeId?: number) => {
    setLoading(true);
    setError("");
    try {
      const result = await getDrillWord(excludeId);
      setCurrentWord(result.word);
      setMessage(result.message ?? "No words to show.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load a drill word.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (preferredWord) {
      setCurrentWord(preferredWord);
      setMessage("");
      setError("");
      return;
    }

    void loadWord();
  }, [loadWord, refreshSignal, preferredWord]);

  useEffect(() => {
    if (!currentWord || !autoPlaySpeed || autoPlayPaused) return;

    const timer = window.setInterval(() => {
      onAdvanced?.();
      void loadWord(currentWord.id);
    }, AUTO_PLAY_INTERVALS[autoPlaySpeed]);

    return () => window.clearInterval(timer);
  }, [autoPlayPaused, autoPlaySpeed, currentWord, loadWord, onAdvanced]);

  async function handleNext() {
    onAdvanced?.();
    await loadWord(currentWord?.id);
  }

  function handleAutoPlay(speed: Exclude<AutoPlaySpeed, null>) {
    onAutoPlaySpeedChange(speed);
    onAutoPlayPausedChange(false);
  }

  function handlePause() {
    onAutoPlayPausedChange(true);
  }

  async function handleDelete() {
    if (!currentWord) return;

    const deletedId = currentWord.id;
    setLoading(true);
    setError("");
    onAutoPlayPausedChange(true);
    try {
      await deleteWord(deletedId);
      await onDeleted();
      await loadWord(deletedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the word.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel drill-panel" aria-labelledby="drill-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Practice useful words</p>
          <h2 id="drill-title">Drill mode</h2>
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {!currentWord && !loading && (
        <div className="empty-state" role="status">
          {message}
        </div>
      )}

      {currentWord && (
        <article className="drill-card">
          <div className="card-topline">
            <span className="part-badge">{currentWord.part_of_speech}</span>
            <span className="shown-count">Shown {currentWord.shown_count} {currentWord.shown_count === 1 ? "time" : "times"}</span>
          </div>

          <h3>{currentWord.word}</h3>

          <div className="definition-block">
            <span>Definition</span>
            <p>{currentWord.definition}</p>
          </div>

          {currentWord.example_sentence && (
            <div className="example-block">
              <span>Example</span>
              <p>“{currentWord.example_sentence}”</p>
            </div>
          )}

          <div className="auto-player" aria-label="Auto-player controls">
            <div>
              <span className="auto-player-label">Auto-player</span>
              <small>
                {autoPlaySpeed && !autoPlayPaused
                  ? `${AUTO_PLAY_LABELS[autoPlaySpeed]} speed is running.`
                  : autoPlaySpeed
                    ? `${AUTO_PLAY_LABELS[autoPlaySpeed]} speed is paused.`
                    : "Choose a speed to start."}
              </small>
            </div>
            <div className="auto-player-buttons">
              <button
                type="button"
                className={autoPlaySpeed === "slow" && !autoPlayPaused ? "speed-button active" : "speed-button"}
                onClick={() => handleAutoPlay("slow")}
                disabled={loading}
              >
                Slow
              </button>
              <button
                type="button"
                className={autoPlaySpeed === "medium" && !autoPlayPaused ? "speed-button active" : "speed-button"}
                onClick={() => handleAutoPlay("medium")}
                disabled={loading}
              >
                Medium
              </button>
              <button
                type="button"
                className={autoPlaySpeed === "fast" && !autoPlayPaused ? "speed-button active" : "speed-button"}
                onClick={() => handleAutoPlay("fast")}
                disabled={loading}
              >
                Fast
              </button>
              <button
                type="button"
                className="pause-button"
                onClick={handlePause}
                disabled={loading || autoPlayPaused}
              >
                Pause
              </button>
            </div>
          </div>

          <div className="card-actions">
            <button className="primary-button" type="button" onClick={handleNext} disabled={loading}>
              {loading ? "Loading…" : "Next"}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => onEdit(currentWord)}
              disabled={loading}
            >
              Edit
            </button>
            <button
              className="trash-button"
              type="button"
              onClick={handleDelete}
              disabled={loading}
              aria-label={`Delete ${currentWord.word}`}
              title="Delete this word"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">
                <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2l1 11h4l1-11h2l-1.2 13H8.2L7 9Z" />
              </svg>
            </button>
          </div>
        </article>
      )}

      {loading && !currentWord && <div className="empty-state">Loading…</div>}
    </section>
  );
}
