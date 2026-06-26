"use client";

import { CSSProperties, useEffect, useState } from "react";
import CurationForm from "@/components/CurationForm";
import DrillCard, { AutoPlaySpeed } from "@/components/DrillCard";
import ModeTabs, { Mode } from "@/components/ModeTabs";
import { getWordCount, WordRecord } from "@/lib/api";

const ZEN_BACKGROUNDS = [
  "/backgrounds/zen-mist.svg",
  "/backgrounds/zen-stones.svg",
  "/backgrounds/zen-bamboo.svg",
  "/backgrounds/zen-ripple.svg",
  "/backgrounds/zen-moon.svg",
  "/backgrounds/zen-ink.svg",
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("curation");
  const [count, setCount] = useState(0);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [countError, setCountError] = useState("");
  const [background, setBackground] = useState(ZEN_BACKGROUNDS[0]);
  const [editingWord, setEditingWord] = useState<WordRecord | null>(null);
  const [preferredDrillWord, setPreferredDrillWord] = useState<WordRecord | null>(null);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState<AutoPlaySpeed>(null);
  const [autoPlayPaused, setAutoPlayPaused] = useState(true);

  async function refreshCount() {
    try {
      const nextCount = await getWordCount();
      setCount(nextCount);
      setCountError("");
      setRefreshSignal((value) => value + 1);
    } catch (err) {
      setCountError(err instanceof Error ? err.message : "Could not load word count.");
    }
  }

  async function handleSaved(savedWord?: WordRecord) {
    await refreshCount();
    if (editingWord && savedWord) {
      setEditingWord(null);
      setPreferredDrillWord(savedWord);
      setMode("drill");
    }
  }

  function handleEditFromDrill(word: WordRecord) {
    setEditingWord(word);
    setPreferredDrillWord(null);
    setMode("curation");
  }

  async function handleDeleted() {
    setPreferredDrillWord(null);
    await refreshCount();
  }

  function handleModeChange(nextMode: Mode) {
    setMode(nextMode);
    if (nextMode !== "curation") {
      setEditingWord(null);
    }
    if (nextMode !== "drill") {
      setPreferredDrillWord(null);
    }
  }

  useEffect(() => {
    void refreshCount();
  }, []);

  useEffect(() => {
    const nextBackground = ZEN_BACKGROUNDS[Math.floor(Math.random() * ZEN_BACKGROUNDS.length)];
    setBackground(nextBackground);
  }, []);

  return (
    <div
      className="zen-background"
      style={{ "--zen-background-image": `url(${background})` } as CSSProperties}
    >
      <main className="app-shell">
        <section className="hero" aria-labelledby="app-title">
          <div>
            <p className="eyebrow">Local-first recall practice</p>
            <h1 id="app-title">Verbal Fluency</h1>
            <p>
              Curate useful words you already know, then bring them back into working memory through simple weighted drills.
            </p>
          </div>
          <div className="hero-card" aria-label="Current curated word count">
            <span>{count}</span>
            <small>{count === 1 ? "curated word" : "curated words"}</small>
          </div>
        </section>

        <ModeTabs mode={mode} onChange={handleModeChange} />

        {countError && <p className="error" role="alert">{countError}</p>}

        {mode === "curation" ? (
          <CurationForm
            count={count}
            editingWord={editingWord}
            onSaved={handleSaved}
            onCancelEdit={() => {
              setEditingWord(null);
              setMode("drill");
            }}
          />
        ) : (
          <DrillCard
            refreshSignal={refreshSignal}
            onDeleted={handleDeleted}
            onEdit={handleEditFromDrill}
            preferredWord={preferredDrillWord}
            onAdvanced={() => setPreferredDrillWord(null)}
            autoPlaySpeed={autoPlaySpeed}
            autoPlayPaused={autoPlayPaused}
            onAutoPlaySpeedChange={setAutoPlaySpeed}
            onAutoPlayPausedChange={setAutoPlayPaused}
          />
        )}
      </main>
    </div>
  );
}
