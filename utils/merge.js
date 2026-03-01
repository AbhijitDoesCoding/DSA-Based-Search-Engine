import fs from "fs";
import path from "path";

const folderPath = path.join(process.cwd(), "problem-set");
const corpusPath = path.join(process.cwd(), "corpus");

const cfPath = path.join(folderPath, "codeforces-problems.json");
const lcPath = path.join(folderPath, "leetcode-problems.json");
const outputPath = path.join(corpusPath, "all-problems.json");

function readJSON(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ File not found: ${filePath}`);
        return [];
    }
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function mergeProblems() {
    console.log("📦 Reading files...");

    const codeforces = readJSON(cfPath);
    const leetcode = readJSON(lcPath);

    console.log(`Codeforces: ${codeforces.length}`);
    console.log(`LeetCode: ${leetcode.length}`);

    const combined = [...codeforces, ...leetcode];

    const uniqueMap = new Map();

    for (const problem of combined) {
        uniqueMap.set(problem.url, problem);
    }

    const finalProblems = Array.from(uniqueMap.values());

    // ✅ Ensure corpus directory exists
    if (!fs.existsSync(corpusPath)) {
        fs.mkdirSync(corpusPath, { recursive: true });
    }

    console.log(`📝 Writing to: ${outputPath}`);

    fs.writeFileSync(
        outputPath,
        JSON.stringify(finalProblems, null, 2)
    );

    console.log("✅ Merged successfully!");
    console.log(`🎯 Final count: ${finalProblems.length}`);
}

mergeProblems();