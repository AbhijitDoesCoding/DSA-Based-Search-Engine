import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const BASE = "https://atcoder.jp";

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64)",
    "Accept-Language": "en-US,en;q=0.9"
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));

/* ---------------- FETCH ABC CONTESTS ---------------- */
async function getContests() {
    console.log("📡 Fetching contest archive...");

    const res = await fetch(`${BASE}/contests/archive`, {
        headers: HEADERS
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    const contests = [];

    $("a[href^='/contests/abc']").each((_, el) => {
        const href = $(el).attr("href");

        if (href && !href.includes("/tasks")) {
            contests.push(BASE + href);
        }
    });

    const unique = [...new Set(contests)];

    console.log(`📚 Found ${unique.length} ABC contests`);
    return unique;
}

/* ---------------- FETCH TASKS FROM CONTEST ---------------- */
async function getTasks(contestUrl) {
    try {
        const res = await fetch(contestUrl + "/tasks", {
            headers: HEADERS
        });

        const html = await res.text();
        const $ = cheerio.load(html);

        const tasks = [];

        $("a[href*='/tasks/']").each((_, el) => {
            const href = $(el).attr("href");

            if (href && href.includes("/tasks/")) {
                tasks.push(BASE + href);
            }
        });

        return [...new Set(tasks)];

    } catch {
        return [];
    }
}

/* ---------------- FORMAT PROBLEM STATEMENT ---------------- */
function formatStatement($) {
    const statement = $("#task-statement .lang-en");

    if (!statement.length) return null;

    statement.find("script, style").remove();

    let output = "";

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
        else if (tag.startsWith("h")) {
            output += "\n" + $(el).text().trim().toUpperCase() + "\n\n";
        }
    });

    return output
        .replace(/\s+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/* ---------------- MAIN SCRAPER ---------------- */
async function scrapeAtCoder() {
    try {
        const contests = await getContests();

        const folder = path.join(process.cwd(), "problem-set");
        if (!fs.existsSync(folder)) fs.mkdirSync(folder);

        const filePath = path.join(folder, "atcoder-problems.json");

        // 🔁 Resume support
        let existing = [];
        if (fs.existsSync(filePath)) {
            existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            console.log(`🔁 Resuming from ${existing.length} problems`);
        }

        const scraped = new Set(existing.map(p => p.url));
        const output = [...existing];

        for (const contest of contests) {

            const tasks = await getTasks(contest);

            for (const taskUrl of tasks) {

                if (scraped.has(taskUrl)) continue;

                try {
                    const res = await fetch(taskUrl, {
                        headers: HEADERS
                    });

                    if (!res.ok) continue;

                    const html = await res.text();
                    const $ = cheerio.load(html);

                    const title = $("span.h2").first().text().trim();
                    const description = formatStatement($);

                    if (!description) continue;

                    output.push({
                        title,
                        url: taskUrl,
                        description
                    });

                    scraped.add(taskUrl);

                    console.log("✅", title);

                    // 💾 Save every 10 problems
                    if (output.length % 10 === 0) {
                        fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
                        console.log("💾 Progress saved");
                    }

                    await delay(1000);

                } catch {
                    console.log("❌ Failed:", taskUrl);
                }
            }
        }

        // Final save
        fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
        console.log("🎉 Done! Saved to atcoder-problems.json");

    } catch (err) {
        console.error("❌ Fatal error:", err.message);
    }
}

scrapeAtCoder();