import { useEffect, useState } from "react";
import { isCalendarDate, type AnalysisDraft } from "@shared/syllabus";

export default function SyllabusReview({ draft, projectId, onSaved, onCancel }: {
  draft: AnalysisDraft; projectId: number; onSaved: () => void; onCancel: () => void;
}) {
  const [rows, setRows] = useState(() => draft.milestones.map(m => ({ ...m, selected: true })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    setRows(draft.milestones.map(m => ({ ...m, selected: true })));
    setConfirmed(false); setError("");
  }, [draft]);
  const selected = rows.filter(m => m.selected);
  const valid = selected.every(m => isCalendarDate(m.date));
  async function save() {
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/deadlines`, {
        method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed, summary: draft.summary, milestones: selected }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Could not save the timeline.");
      onSaved();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save the timeline.");
    } finally { setSaving(false); }
  }
  return (
    <section className="glass-card rounded-2xl p-5 space-y-4" data-testid="syllabus-review">
      <h3 className="font-display text-sm font-semibold">Review your timeline</h3>
      <p className="text-sm text-muted-foreground">Check every date against your syllabus. Dates the syllabus does not specify are left blank. Add the correct date or uncheck the item to leave it out. Saving replaces the current timeline.</p>
      {draft.summary && <p className="text-sm">{draft.summary}</p>}
      {rows.length === 0 && <p className="text-sm">No milestones were found. Cancel and try another syllabus if this looks incorrect.</p>}
      {rows.map((m, index) => (
        <div key={`${m.id}-${index}`} className="rounded-xl border border-border/60 bg-white p-4 space-y-2">
          <label className="flex gap-2 text-sm font-medium">
            <input type="checkbox" checked={m.selected} disabled={saving} onChange={e => { setConfirmed(false); setRows(rows.map((r, i) => i === index ? { ...r, selected: e.target.checked } : r)); }} />
            {m.title}
          </label>
          <p className="text-xs text-muted-foreground">{m.dateStatus === "explicit" ? "Date extracted from the syllabus; please verify." : "The date needs your input."}</p>
          <blockquote className="text-xs text-muted-foreground border-l-2 pl-3">{m.sourceText || "No matching source quote was found. Check the original syllabus."}</blockquote>
          <label className="block text-xs">Date for {m.title}
            <input type="date" value={m.date} disabled={!m.selected || saving} onChange={e => { setConfirmed(false); setRows(rows.map((r, i) => i === index ? { ...r, date: e.target.value } : r)); }} className="block mt-1 rounded-lg border px-3 py-2 text-sm" />
          </label>
        </div>
      ))}
      <label className="flex gap-2 text-sm">
        <input type="checkbox" checked={confirmed} disabled={saving || !valid} onChange={e => setConfirmed(e.target.checked)} />
        I checked the selected dates and want to replace the current timeline with these {selected.length} milestones.
      </label>
      {!valid && <p className="text-sm text-destructive">Add a valid date for each selected item, or uncheck it.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <button disabled={saving || !valid || !confirmed} onClick={save} className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-40">{saving ? "Saving..." : "Save reviewed timeline"}</button>
        <button disabled={saving} onClick={onCancel} className="rounded-xl border px-4 py-2 text-sm">Cancel</button>
      </div>
    </section>
  );
}
