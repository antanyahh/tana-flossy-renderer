import { createReadStream } from "node:fs";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export function createStorage(env = process.env) {
  const jobs = path.resolve(env.RENDER_JOB_DIR || "./jobs");
  const outputs = path.resolve(env.RENDER_OUTPUT_BUCKET || "./outputs");
  const temporary = path.resolve(env.RENDER_TEMP_DIR || "./tmp");
  const baseUrl = (env.RENDER_OUTPUT_BASE_URL || "").replace(/\/$/, "");
  return {
    jobs, outputs, temporary,
    async initialize() { await Promise.all([jobs, outputs, temporary].map(dir => mkdir(dir, { recursive: true }))); },
    async saveJob(job) { const file = path.join(jobs, `${job.id}.json`); const staged = `${file}.tmp`; await writeFile(staged, JSON.stringify(job)); await rename(staged, file); },
    async getJob(id) { try { return JSON.parse(await readFile(path.join(jobs, `${id}.json`), "utf8")); } catch { return null; } },
    outputPath(id, format) { return path.join(outputs, `${id}.${format}`); },
    outputUrl(id, format) { return `${baseUrl || "/outputs"}/${id}.${format}`; },
    async openOutput(id, format) { const file = path.join(outputs, `${id}.${format}`); return { stream: createReadStream(file), size: (await stat(file)).size }; },
    status() { return { configured: Boolean(env.RENDER_OUTPUT_BUCKET), adapter: "filesystem" }; },
  };
}
