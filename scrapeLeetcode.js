import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import path from "path";

puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function scrapeLeetcode() {

    const folderPath = path.join(process.cwd(), "problem-set");
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }

    const filePath = path.join(folderPath, "leetcode-problems.json");

    // ----------------------------
    // 🔁 RESUME SUPPORT
    // ----------------------------
    let problems = [];
    let scrapedSlugs = new Set();

    if (fs.existsSync(filePath)) {
        console.log("🔄 Existing file found. Loading for resume...");

        const existingData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        problems = existingData;

        for (const p of existingData) {
            const slug = p.url.split("/problems/")[1].replace("/", "");
            scrapedSlugs.add(slug);
        }

        console.log(`📂 Already scraped: ${scrapedSlugs.size}`);
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    console.log("🌐 Opening LeetCode...");

    await page.goto("https://leetcode.com/problemset/", {
        waitUntil: "domcontentloaded"
    });

    // Get FREE problems only
    const problemList = await page.evaluate(async () => {
        const res = await fetch("https://leetcode.com/api/problems/all/");
        const data = await res.json();

        return data.stat_status_pairs
            .filter(p => !p.paid_only)
            .map(p => ({
                title: p.stat.question__title,
                slug: p.stat.question__title_slug
            }));
    });

    console.log("📦 Free problems:", problemList.length);

    for (let i = 0; i < problemList.length; i++) {

        const { title, slug } = problemList[i];

        // 🔁 Skip already scraped
        if (scrapedSlugs.has(slug)) {
            console.log(`⏭️ Skipping (already scraped): ${title}`);
            continue;
        }

        try {

            const description = await page.evaluate(async (slug) => {
                const res = await fetch("https://leetcode.com/graphql", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        query: `
                            query getQuestion($titleSlug: String!) {
                                question(titleSlug: $titleSlug) {
                                    content
                                }
                            }
                        `,
                        variables: { titleSlug: slug }
                    })
                });

                const data = await res.json();
                return data.data?.question?.content || "";
            }, slug);

            if (!description) {
                console.log("⚠️ Skipped:", title);
                continue;
            }

            const problemData = {
                title,
                url: `https://leetcode.com/problems/${slug}/`,
                description
            };

            problems.push(problemData);
            scrapedSlugs.add(slug);

            console.log(`✅ Scraped: ${title} (${problems.length} total)`);

            // 💾 Save every 10 new problems
            if (problems.length % 10 === 0) {
                fs.writeFileSync(filePath, JSON.stringify(problems, null, 2));
                console.log("💾 Progress saved");
            }

            await delay(400);

        } catch (err) {
            console.log("❌ Failed:", slug);
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(problems, null, 2));

    console.log("🎉 Scraping Complete!");

    await browser.close();
}

scrapeLeetcode();