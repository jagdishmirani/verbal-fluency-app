export type Mode = "curation" | "drill";

type ModeTabsProps = {
  mode: Mode;
  onChange: (mode: Mode) => void;
};

export default function ModeTabs({ mode, onChange }: ModeTabsProps) {
  return (
    <nav className="mode-tabs" aria-label="App modes">
      <button
        type="button"
        className={mode === "curation" ? "active" : ""}
        onClick={() => onChange("curation")}
        aria-pressed={mode === "curation"}
      >
        Curation mode
      </button>
      <button
        type="button"
        className={mode === "drill" ? "active" : ""}
        onClick={() => onChange("drill")}
        aria-pressed={mode === "drill"}
      >
        Drill mode
      </button>
    </nav>
  );
}
