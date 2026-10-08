import test from "node:test";
import assert from "node:assert/strict";
import { groundAnalysis, reviewedTimelineSchema } from "../shared/syllabus";
import { analyzeSyllabus, validateSyllabusText, AnalysisError } from "../server/syllabus-analysis";

const source = "Course 2026. Final exam: November 12, 2026. Project due in week 8. ".repeat(4);
function response() {
  return { courseName: "Example", summary: "A synthetic course.", milestones: [
    { id: "exam", title: "Final exam", description: "", date: "2026-11-12", dateStatus: "explicit", sourceText: "Final exam: November 12, 2026.", type: "exam" },
    { id: "project", title: "Project", description: "", date: "2026-12-01", dateStatus: "unresolved", sourceText: "Project due in week 8.", type: "project" },
  ] };
}
test("relative dates stay blank; unsupported source quotes cannot produce dates", () => {
  const raw = response(); raw.milestones[0].sourceText = "A made-up exam date";
  const draft = groundAnalysis(raw, source);
  assert.equal(draft.milestones[0].date, "");
  assert.equal(draft.milestones[0].dateStatus, "unresolved");
  assert.equal(draft.milestones[0].sourceText, "");
  assert.equal(draft.milestones[1].date, "");
});
test("impossible dates are unresolved and leap days are validated", () => {
  const raw = response(); raw.milestones[0].date = "2026-02-30";
  assert.equal(groundAnalysis(raw, source).milestones[0].date, "");
  const item = { ...raw.milestones[0], date: "2024-02-29" };
  assert.equal(reviewedTimelineSchema.safeParse({ confirmed: true, summary: "", milestones: [item] }).success, true);
  assert.equal(reviewedTimelineSchema.safeParse({ confirmed: true, summary: "", milestones: [{ ...item, date: "2026-02-29" }] }).success, false);
});
test("saving requires confirmation, valid dates, and unique IDs", () => {
  const item = response().milestones[0];
  for (const body of [
    { summary: "", milestones: [item] },
    { confirmed: true, summary: "", milestones: [{ ...item, date: "" }] },
    { confirmed: true, summary: "", milestones: [item, item] },
  ]) assert.equal(reviewedTimelineSchema.safeParse(body).success, false);
});
test("oversized and non-text inputs are rejected before a provider call", () => {
  for (const input of [null, {}, "short", "a".repeat(50_001)]) assert.throws(() => validateSyllabusText(input), AnalysisError);
});
test("malformed/schema-invalid output gets one retry and valid quotes survive", async () => {
  const calls: boolean[] = [];
  const draft = await analyzeSyllabus(source, async (_, retry) => { calls.push(retry); return retry ? JSON.stringify(response()) : '{"milestones":[]}'; });
  assert.deepEqual(calls, [false, true]);
  assert.equal(draft.milestones[0].date, "2026-11-12");
  assert.equal(draft.milestones[1].date, "");
});
test("provider failures are sanitized and never retried; malformed JSON is bounded", async () => {
  let calls = 0;
  await assert.rejects(analyzeSyllabus(source, async () => { calls++; throw { status: 401, message: "private provider details" }; }), (e: any) => e.status === 502 && !e.message.includes("private"));
  assert.equal(calls, 1);
  calls = 0;
  await assert.rejects(analyzeSyllabus(source, async () => { calls++; throw new Error("private connection details"); }), (e: any) => e.status === 502 && !e.message.includes("private"));
  assert.equal(calls, 1);
  calls = 0;
  await assert.rejects(analyzeSyllabus(source, async () => { calls++; return "bad json"; }), AnalysisError);
  assert.equal(calls, 2);
});

test("a provider abort becomes a timeout response without another attempt", async () => {
  let calls = 0;
  await assert.rejects(analyzeSyllabus(source, async () => { calls++; throw Object.assign(new Error("aborted"), { name: "AbortError" }); }), (e: any) => e.status === 504);
  assert.equal(calls, 1);
});
