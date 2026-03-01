import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import https from "https";

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const agent = new https.Agent({
    keepAlive: true
});

// Proper formatter for Codeforces
function formatCFStatement(statement, $) {
    // Remove unwanted elements
    statement.find("script, style").remove();

    let output = "";

    // Title
    const title = statement.find(".title").first().text().trim();
    if (title) {
        output += title + "\n\n";
    }

    // Time and memory limits
    const timeLimit = statement.find(".time-limit").text().trim();
    const memoryLimit = statement.find(".memory-limit").text().trim();

    if (timeLimit) output += timeLimit + "\n";
    if (memoryLimit) output += memoryLimit + "\n";
    if (timeLimit || memoryLimit) output += "\n";

    // Main structured content
    statement.find("h1, h2, h3, p, li, pre").each((_, el) => {
        const tag = el.tagName.toLowerCase();

        if (tag === "p") {
            output += $(el).text().trim() + "\n\n";
        }

        else if (tag === "li") {
            output += "- " + $(el).text().trim() + "\n";
        }

        else if (tag === "pre") {
            output += "```\n" + $(el).text().trim() + "\n```\n\n";
        }

        else if (tag === "h1" || tag === "h2" || tag === "h3") {
            output += "\n" + $(el).text().trim().toUpperCase() + "\n\n";
        }
    });

    return output
        .replace(/\$\$\$/g, "")        // remove $$$
        .replace(/\s+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

async function scrape() {
    console.log("📡 Fetching metadata...");

    const apiRes = await fetch(
        "https://codeforces.com/api/problemset.problems"
    );

    const apiData = await apiRes.json();
    const problemsMeta = apiData.result.problems;

    const folder = path.join(process.cwd(), "problem-set");
    if (!fs.existsSync(folder)) fs.mkdirSync(folder);

    const filePath = path.join(folder, "codeforces-problems.json");

    let existing = [];
    if (fs.existsSync(filePath)) {
        existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        console.log(`🔁 Resuming from ${existing.length}`);
    }

    const scraped = new Set(existing.map(p => p.url));
    const output = [...existing];

    for (let problem of problemsMeta) {

        if (!problem.contestId || !problem.index) continue;

        // Skip very recent contests (reduces 403 risk)
        if (problem.contestId > 1900) continue;

        const url = `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}?locale=en`;

        if (scraped.has(url)) continue;

        try {
            const res = await fetch(url, {
                agent,
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                    "Accept-Language": "en-US,en;q=0.9"
                }
            });

            if (!res.ok) {
                console.log("❌ Skip:", url);
                await delay(3000);
                continue;
            }

            const html = await res.text();
            const $ = cheerio.load(html);

            const statement = $(".problem-statement");
            if (!statement.length) {
                console.log("⚠️ No statement:", url);
                continue;
            }

            const description = formatCFStatement(statement, $);

            output.push({
                title: problem.name,
                url,
                description
            });

            console.log(`✅ ${problem.name}`);

            // Save every 20 problems
            if (output.length % 20 === 0) {
                fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
                console.log("💾 Progress saved");
            }

            // Random delay (1.5–2.5s)
            await delay(1500 + Math.random() * 1000);

        } catch (err) {
            console.log("❌ Error:", url);
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
    console.log("🎉 Done!");
}

scrape().catch(err => {
    console.error("❌ Fatal error:", err.message);
});