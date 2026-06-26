"use client";

import { FormEvent, useEffect, useState } from "react";
import { addWord, checkWordExists, updateWord, WordInput, WordRecord } from "@/lib/api";

const PARTS_OF_SPEECH = ["Noun", "Verb", "Adjective", "Adverb", "Phrase", "Other"];
type WordCheckState = "empty" | "checking" | "available" | "duplicate" | "error";

type CurationFormProps = {
  count: number;
  editingWord?: WordRecord | null;
  onSaved: (savedWord?: WordRecord) => Promise<void> | void;
  onCancelEdit?: () => void;
};

const EMPTY_FORM: WordInput = {
  word: "",
  part_of_speech: "Noun",
  definition: "",
  example_sentence: "",
};

function normalizeWord(value: string) {
  return value.trim().toLowerCase().split(/\s+/).join(" ");
}

export default function CurationForm({ count, editingWord, onSaved, onCancelEdit }: CurationFormProps) {
  const isEditing = Boolean(editingWord);
  const [form, setForm] = useState<WordInput>(EMPTY_FORM);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [wordCheck, setWordCheck] = useState<WordCheckState>("empty");

  const trimmedWord = form.word.trim();
  const wordMatchesOriginal = Boolean(
    editingWord && normalizeWord(trimmedWord) === normalizeWord(editingWord.word),
  );
  const wordIsUsable = trimmedWord.length > 0 && (wordCheck === "available" || wordMatchesOriginal);

  function updateField(name: keyof WordInput, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setStatus("");
    setError("");
  }

  useEffect(() => {
    if (!editingWord) {
      setForm(EMPTY_FORM);
      setWordCheck("empty");
      setStatus("");
      setError("");
      return;
    }

    setForm({
      word: editingWord.word,
      part_of_speech: editingWord.part_of_speech,
      definition: editingWord.definition,
      example_sentence: editingWord.example_sentence ?? "",
    });
    setWordCheck("available");
    setStatus("");
    setError("");
  }, [editingWord]);

  useEffect(() => {
    if (!trimmedWord) {
      setWordCheck("empty");
      return;
    }

    if (wordMatchesOriginal) {
      setWordCheck("available");
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setWordCheck("checking");
      try {
        const exists = await checkWordExists(trimmedWord);
        setWordCheck(exists ? "duplicate" : "available");
      } catch {
        setWordCheck("error");
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [trimmedWord, wordMatchesOriginal]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setError("");

    const payload: WordInput = {
      word: form.word.trim(),
      part_of_speech: form.part_of_speech.trim(),
      definition: form.definition.trim(),
      example_sentence: form.example_sentence?.trim() ?? "",
    };

    if (!payload.word) {
      setError("Please enter a word first.");
      return;
    }

    if (wordCheck === "duplicate") {
      setError("That word is already in your curated list.");
      return;
    }

    if (!wordIsUsable) {
      setError("Please wait until the word has been checked for duplicates.");
      return;
    }

    if (!payload.part_of_speech || !payload.definition) {
      setError("Please enter a part of speech and definition.");
      return;
    }

    setSaving(true);
    try {
      const savedWord = editingWord ? await updateWord(editingWord.id, payload) : await addWord(payload);

      if (editingWord) {
        setStatus(`Updated “${payload.word}.”`);
      } else {
        setForm(EMPTY_FORM);
        setWordCheck("empty");
        setStatus(`Saved “${payload.word}.”`);
      }

      await onSaved(savedWord);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the word.");
    } finally {
      setSaving(false);
    }
  }

  function wordHelpText() {
    if (wordCheck === "checking") return "Checking your curated list…";
    if (wordCheck === "available" && isEditing) return "You can update this word record.";
    if (wordCheck === "available") return "This word is available. You can now add the details.";
    if (wordCheck === "duplicate") return "This word is already in your curated list. Try a different word.";
    if (wordCheck === "error") return "Could not check duplicates. Make sure the backend is running.";
    return "Enter a word first. The rest of the form unlocks after the app confirms it is not a duplicate.";
  }

  return (
    <section className="panel" aria-labelledby="curation-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{isEditing ? "Revise a drill card" : "Build your personal recall list"}</p>
          <h2 id="curation-title">{isEditing ? "Edit word" : "Curation mode"}</h2>
        </div>
        <div className="count-pill" aria-label={`${count} curated words`}>
          <span>{count}</span>
          <small>{count === 1 ? "word" : "words"}</small>
        </div>
      </div>

      <form className="word-form" onSubmit={handleSubmit}>
        <label>
          Word
          <input
            value={form.word}
            onChange={(event) => updateField("word", event.target.value)}
            placeholder="e.g., lucid"
            autoComplete="off"
            required
            aria-describedby="word-check-message"
            aria-invalid={wordCheck === "duplicate"}
            disabled={saving}
          />
          <span id="word-check-message" className={`field-note ${wordCheck}`}>
            {wordHelpText()}
          </span>
        </label>

        <label className={!wordIsUsable ? "locked-field" : ""}>
          Part of speech
          <select
            value={form.part_of_speech}
            onChange={(event) => updateField("part_of_speech", event.target.value)}
            required
            disabled={!wordIsUsable || saving}
          >
            {PARTS_OF_SPEECH.map((part) => (
              <option key={part} value={part}>
                {part}
              </option>
            ))}
          </select>
        </label>

        <label className={!wordIsUsable ? "locked-field" : ""}>
          Definition
          <textarea
            value={form.definition}
            onChange={(event) => updateField("definition", event.target.value)}
            placeholder="A clear, useful meaning in your own words"
            rows={4}
            required
            disabled={!wordIsUsable || saving}
          />
        </label>

        <label className={!wordIsUsable ? "locked-field" : ""}>
          Example sentence <span className="optional">optional</span>
          <textarea
            value={form.example_sentence}
            onChange={(event) => updateField("example_sentence", event.target.value)}
            placeholder="Use the word in a sentence you might actually say or write"
            rows={3}
            disabled={!wordIsUsable || saving}
          />
        </label>

        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={saving || !wordIsUsable}>
            {saving ? "Saving…" : isEditing ? "Update word" : "Add word"}
          </button>
          {isEditing && onCancelEdit && (
            <button className="secondary-button" type="button" onClick={onCancelEdit} disabled={saving}>
              Cancel edit
            </button>
          )}
        </div>
      </form>

      {status && <p className="success" role="status">{status}</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
