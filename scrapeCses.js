import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const BASE = "https://cses.fi";

/* -------------------- GET PROBLEM LIST -------------------- */
async function getProblemList() {
    console.log("📡 Fetching CSES problem list...");

    const res = await fetch(`${BASE}/problemset/`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const problems = [];

    $(".task a").each((_, el) => {
        const title = $(el).text().trim();
        const url = BASE + $(el).attr("href");

        const idMatch = url.match(/task\/(\d+)/);
        const id = idMatch ? idMatch[1] : null;

        if (id) {
            problems.push({ id, title, url });
        }
    });

    console.log(`📚 Found ${problems.length} problems`);
    return problems;
}

/* -------------------- FORMAT STATEMENT -------------------- */
function formatStatement($) {
    const content = $(".content");

    content.find("script, style").remove();

    let output = "";

    content.find("h1, h2, h3, p, li, pre").each((_, el) => {
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

        else if (tag.startsWith("h")) {
            output += "\n" + $(el).text().trim().toUpperCase() + "\n\n";
        }
    });

    return output
        .replace(/\s+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/* -------------------- MAIN SCRAPER -------------------- */
async function scrapeCSES() {
    try {
        const problems = await getProblemList();

        const folder = path.join(process.cwd(), "problem-set");
        if (!fs.existsSync(folder)) fs.mkdirSync(folder);

        const filePath = path.join(folder, "cses-problems.json");

        // Resume support
        let existing = [];
        if (fs.existsSync(filePath)) {
            existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            console.log(`🔁 Resuming from ${existing.length} problems`);
        }

        const scraped = new Set(existing.map(p => p.url));
        const output = [...existing];

        for (const problem of problems) {

            if (scraped.has(problem.url)) continue;

            try {
                const res = await fetch(problem.url);

                if (!res.ok) {
                    console.log("❌ Skipped:", problem.url);
                    continue;
                }

                const html = await res.text();
                const $ = cheerio.load(html);

                const description = formatStatement($);

                output.push({
                    title: problem.title,
                    url: problem.url,
                    description
                });

                console.log("✅", problem.title);

                // Save every 10 problems
                if (output.length % 10 === 0) {
                    fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
                    console.log("💾 Progress saved");
                }

                await delay(1000); // polite delay

            } catch (err) {
                console.log("❌ Error:", problem.url);
            }
        }

        // Final save
        fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
        console.log("🎉 Done! Saved to cses-problems.json");

    } catch (err) {
        console.error("❌ Fatal error:", err.message);
    }
}

/* -------------------- RUN -------------------- */
scrapeCSES();