import puppeteer from "puppeteer";

async function scrapeQuotes(){
    const browser = await puppeteer.launch({ headless: true, defaultViewport: null });
    const page = await browser.newPage();
    await page.goto("https://quotes.toscrape.com/", { waitUntil: "domcontentloaded" });
    const quotes = await page.evaluate(() => {
        const quoteElements = document.querySelectorAll(".quote");
        const quotes = [];
        quoteElements.forEach((quoteElement) => {
            const quoteText = quoteElement.querySelector(".text").textContent;
            const author = quoteElement.querySelector(".author").textContent;
            quotes.push({ quote: quoteText, author: author });
        });
        return quotes;
    });

    console.log(quotes);
    await browser.close();
}

scrapeQuotes();