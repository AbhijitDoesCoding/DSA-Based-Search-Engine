import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "natural";
import preprocess from "./utils/preprocess.js";
import "dotenv/config";

const { TfIdf } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

let isReady = false;
let problems = [];
let tfidf = new TfIdf();
let docVectors = [];
let docMagnitudes = [];

/* ---------------------- */
/* GLOBAL ERROR HANDLING  */
/* ---------------------- */

process.on("unhandledRejection", (err) => {
  console.error("🔥 UNHANDLED REJECTION:", err);
});

process.on("uncaughtException", (err) => {
  console.error("🔥 UNCAUGHT EXCEPTION:", err);
});

/* ---------------------- */
/* Middleware */
/* ---------------------- */

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(express.static("."));

app.use((req, res, next) => {
  if (!isReady && req.path === "/search" && req.method === "POST") {
    return res.status(503).json({
      error: "Server is initializing",
      message: "Building search index... Please wait a few seconds."
    });
  }
  next();
});

/* ---------------------- */
/* Index Builder */
/* ---------------------- */

async function loadProblemsAndBuildIndex() {
  console.log("\n--- Loading Pre-built Search Index ---\n");

  try {
    const dataPath = path.join(__dirname, "corpus", "all-problems.json");
    const indexPath = path.join(__dirname, "corpus", "prebuilt-index.json");

    // Simultaneously load problems and pre-built index
    const [problemsData, indexData] = await Promise.all([
      fs.readFile(dataPath, "utf-8"),
      fs.readFile(indexPath, "utf-8")
    ]);

    problems = JSON.parse(problemsData);
    const parsedIndex = JSON.parse(indexData);

    docVectors = parsedIndex.docVectors;
    docMagnitudes = parsedIndex.docMagnitudes;

    // Restore TF-IDF state via constructor
    tfidf = new TfIdf(parsedIndex.tfidfData);

    isReady = true;
    console.log(`✅ Loaded ${problems.length} problems and index. Server Ready.\n`);
  } catch (error) {
    console.error("❌ ERROR loading pre-built index:", error.message);
    console.log("👉 Please run 'npm run build-index' to generate it.");
    process.exit(1);
  }
}

/* ---------------------- */
/* Routes */
/* ---------------------- */

app.get("/status", (req, res) => {
  res.json({
    ready: isReady,
    problemCount: problems.length,
    timestamp: new Date().toISOString()
  });
});

app.get("/search", (req, res) => {
  res.status(405).json({
    error: "Method Not Allowed",
    message: "Use POST with { \"query\": \"your search term\" }"
  });
});

app.post("/search", (req, res) => {
  try {
    const { query: rawQuery } = req.body;

    if (!rawQuery || typeof rawQuery !== "string") {
      return res.status(400).json({
        error: "Query must be a non-empty string"
      });
    }

    const query = preprocess(rawQuery);
    const tokens = query.split(" ").filter(Boolean);

    if (!tokens.length) {
      return res.json({ results: [] });
    }

    const termFreq = {};
    tokens.forEach(t => termFreq[t] = (termFreq[t] || 0) + 1);

    const queryVector = {};
    let sumSqQ = 0;
    const N = tokens.length;

    Object.entries(termFreq).forEach(([term, count]) => {
      const tf = count / N;
      const idf = tfidf.idf(term);
      const w = tf * idf;
      queryVector[term] = w;
      sumSqQ += w * w;
    });

    const queryMag = Math.sqrt(sumSqQ) || 1;

    const scores = problems.map((_, idx) => {
      const docVec = docVectors[idx];
      const docMag = docMagnitudes[idx] || 1;
      let dot = 0;

      for (const [term, wq] of Object.entries(queryVector)) {
        if (docVec?.[term]) {
          dot += wq * docVec[term];
        }
      }

      return { idx, score: dot / (queryMag * docMag) };
    });

    const top = scores
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 60)
      .map(({ idx, score }) => {
        const p = problems[idx];
        const platform =
          p.url.includes("leetcode.com") ? "LeetCode" :
          p.url.includes("codeforces.com") ? "Codeforces" :
          p.url.includes("atcoder.jp") ? "AtCoder" :
          p.url.includes("cses.fi") ? "CSES" : "Other";

        return { ...p, platform, score: score.toFixed(4) };
      });

    res.json({ results: top });

  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

/* ---------------------- */
/* Start Server */
/* ---------------------- */

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  loadProblemsAndBuildIndex().catch(err => {
    console.error("Index startup failure:", err);
  });
});