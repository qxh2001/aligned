import test from "node:test";
import assert from "node:assert/strict";
import { scoreDates } from "../evals/score";

test("evaluation penalizes wrong/duplicate dates and handles cases without dated references", () => {
  const expected = [{ title: "Exam", date: "2026-11-12" }, { title: "Project", date: "" }];
  const scored = scoreDates(expected, [
    { title: "exam", date: "2026-11-12" },
    { title: "Exam", date: "2026-11-12" },
    { title: "Project", date: "2026-12-01" },
  ]);
  assert.equal(scored.correctDates, 1);
  assert.equal(scored.datePrecision, 1 / 3);
  assert.equal(scored.dateRecall, 1);
  assert.equal(scored.inventedDates, 2);
  assert.equal(scoreDates([{ title: "TBD", date: "" }], []).dateRecall, null);
});
