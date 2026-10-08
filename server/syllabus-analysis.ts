import { groundAnalysis } from "../shared/syllabus";
import { ZodError } from "zod";

export const MAX_SYLLABUS_CHARS = 50_000;
export class AnalysisError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function validateSyllabusText(text: unknown): string {
  if (typeof text !== "string") throw new AnalysisError(400, "Upload a PDF or paste syllabus text.");
  if (text.length > MAX_SYLLABUS_CHARS) throw new AnalysisError(413, "Syllabus text exceeds 50,000 characters. Use a shorter document.");
  if (text.trim().length < 200) throw new AnalysisError(422, "The extracted text is too short. Try pasting the syllabus text directly.");
  return text;
}
export async function analyzeSyllabus(text: string, call: (text: string, retry: boolean, signal: AbortSignal) => Promise<string>) {
  const source = validateSyllabusText(text);
  // One overall deadline covers both attempts; provider SDK retries are disabled.
  const signal = AbortSignal.timeout(45_000);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const output = await call(source, attempt === 1, signal);
      const cleaned = output.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      return groundAnalysis(JSON.parse(cleaned), source);
    } catch (error: any) {
      if (signal.aborted || error?.name === "AbortError" || error?.name === "TimeoutError") {
        throw new AnalysisError(504, "Analysis timed out. Try a shorter syllabus.");
      }
      if (!(error instanceof SyntaxError || error instanceof ZodError)) {
        throw new AnalysisError(502, "The AI service is temporarily unavailable.");
      }
      if (attempt === 1) throw new AnalysisError(502, "The AI response could not be read. Please try again.");
    }
  }
  throw new AnalysisError(502, "Analysis failed.");
}
