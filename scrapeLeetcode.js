import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import path from "path";

puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function scrapeLeetcode() {

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

    const problems = [];

    const folderPath = path.join(process.cwd(), "problem-set");
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }

    const filePath = path.join(folderPath, "leetcode-problems.json");

    for (let i = 0; i < problemList.length; i++) {

        const { title, slug } = problemList[i];

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

            problems.push({
                title,
                url: `https://leetcode.com/problems/${slug}/`,
                description
            });

            console.log(`✅ ${i + 1}/${problemList.length} - ${title}`);

            if ((i + 1) % 10 === 0) {
                fs.writeFileSync(filePath, JSON.stringify(problems, null, 2));
                console.log(`💾 Saved at ${i + 1}`);
            }

            await delay(400);

        } catch (err) {
            console.log("❌ Failed:", slug);
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(problems, null, 2));

    console.log("🎉 Done!");

    await browser.close();
}

scrapeLeetcode();