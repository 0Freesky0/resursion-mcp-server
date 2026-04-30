#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = resolve(__dirname, "../assets/report-template.html");

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || !value) {
      throw new Error("Usage: render-report.mjs --data result.json --analysis analysis.txt --out report.html");
    }
    args.set(key.slice(2), value);
  }
  return args;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeJsonForScript(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dataPath = args.get("data");
  const analysisPath = args.get("analysis");
  const outPath = args.get("out");

  const [template, dataText, analysisText] = await Promise.all([
    readFile(templatePath, "utf8"),
    readFile(dataPath, "utf8"),
    readFile(analysisPath, "utf8")
  ]);

  const data = JSON.parse(dataText);
  const appData = {
    result: data,
    analysis: analysisText.trim(),
    generatedAt: new Date().toLocaleString("zh-CN", { hour12: false })
  };

  const html = template
    .replaceAll("{{title}}", escapeHtml(`Handle Viewer - ${data.handle ?? "unknown"}`))
    .replaceAll("{{appDataJson}}", safeJsonForScript(appData));

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, html, "utf8");
  console.log(outPath);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
