# Syllabus extraction starter evaluation

The four synthetic cases cover explicit dates, missing years, relative deadlines, and embedded instructions. They contain no real student or course records. They are a small regression set, not an accuracy benchmark.

After deliberately running these inputs through an isolated development instance, record the returned drafts in a JSON array:

```json
[{ "caseId": "explicit-date", "milestones": [{ "title": "Final exam", "date": "2026-11-12" }] }]
```

```bash
npm run eval:score -- predictions.json
```

The scorer makes no API calls. It reports date precision/recall for each case and flags dated predictions for undated references or unmatched milestones. It uses exact titles after case/whitespace normalization; manually inspect paraphrases, duplicates, and source quotes before interpreting metrics. An incorrect date on a known milestone reduces precision/recall even if it is not counted as an invented milestone. Missing predictions are reported explicitly.

Record the model, prompt commit, inputs, output, and latency when collecting predictions. Assess both the raw model output and the grounded draft, and check that human review preserves existing timelines until save. Use annotated real syllabi only with permission and remove identifying information. Expand the set before reporting general accuracy. This repository claims no live-model evaluation scores.
