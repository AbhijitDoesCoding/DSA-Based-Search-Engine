import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "natural";
import preprocess from "./utils/preprocess.js";

const { TfIdf } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generatePrebuiltIndex() {
  console.log("\n--- Generating Pre-built Search Index ---\n");

  try {
    const dataPath = path.join(__dirname, "corpus", "all-problems.json");
    const indexPath = path.join(__dirname, "corpus", "prebuilt-index.json");

    const data = await fs.readFile(dataPath, "utf-8");
    const problems = JSON.parse(data);

    console.log(`Processing ${problems.length} problems...`);

    const tfidf = new TfIdf();

    // 1. Add documents to TF-IDF (Matching index.js weighting: title title description)
    for (let idx = 0; idx < problems.length; idx++) {
      const problem = problems[idx];
      const text = preprocess(
        `${problem.title} ${problem.title} ${problem.description || ""}`
      );
      tfidf.addDocument(text, idx.toString());

      if ((idx + 1) % 5000 === 0) {
        console.log(`Indexed ${idx + 1}...`);
      }
    }

    console.log("Building cosine vectors and magnitudes...");

    // 2. Generate Vectors and Magnitudes
    const docVectors = new Array(problems.length);
    const docMagnitudes = new Array(problems.length);

    for (let idx = 0; idx < problems.length; idx++) {
      const vector = {};
      let sumSquares = 0;

      tfidf.listTerms(idx).forEach(({ term, tfidf: weight }) => {
        vector[term] = weight;
        sumSquares += weight * weight;
      });

      docVectors[idx] = vector;
      docMagnitudes[idx] = Math.sqrt(sumSquares);

      if ((idx + 1) % 5000 === 0) {
        console.log(`Processed ${idx + 1} vectors...`);
      }
    }

    // 3. Save to a single index file
    const output = {
      docVectors,
      docMagnitudes,
      // Save documents for rehydrating TfIdf instance
      tfidfData: { documents: tfidf.documents }
    };

    await fs.writeFile(indexPath, JSON.stringify(output));

    console.log(`\n✅ Pre-built index saved to: ${indexPath}\n`);
  } catch (error) {
    console.error("❌ Indexing failed:", error);
    process.exit(1);
  }
}

generatePrebuiltIndex();
