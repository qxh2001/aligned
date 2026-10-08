import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function scoreDates(expected: { title: string; date: string }[], predicted: { title: string; date: string }[]) {
  const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();
  const remaining = [...expected];
  let correctDates = 0;
  let inventedDates = 0;
  for (const p of predicted) {
    const index = remaining.findIndex(e => normalize(e.title) === normalize(p.title));
    if (index === -1) { if (p.date) inventedDates++; continue; }
    const [reference] = remaining.splice(index, 1);
    if (p.date && p.date === reference.date) correctDates++;
    if (p.date && !reference.date) inventedDates++;
  }
  const datedPredictions = predicted.filter(p => p.date).length;
  const datedReferences = expected.filter(e => e.date).length;
  return { correctDates, datedPredictions, datedReferences, inventedDates,
    datePrecision: datedPredictions ? correctDates / datedPredictions : null,
    dateRecall: datedReferences ? correctDates / datedReferences : null };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const predictionsFile = process.argv[2];
  if (!predictionsFile) throw new Error("Usage: npm run eval:score -- predictions.json (does not call an AI API)");
  const cases = JSON.parse(readFileSync(new URL("./cases.json", import.meta.url), "utf8"));
  const predictions = JSON.parse(readFileSync(predictionsFile, "utf8"));
  const results = cases.map((c: any) => {
    const p = predictions.find((item: any) => item.caseId === c.id);
    return { caseId: c.id, ...(p ? scoreDates(c.expected, p.milestones) : { missingPrediction: true }) };
  });
  console.log(JSON.stringify({ titleMatching: "exact after case/whitespace normalization; review paraphrases manually", results }, null, 2));
}
