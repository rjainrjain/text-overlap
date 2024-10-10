const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const url = require('url');

const targetUrl = 'https://penrose.cs.cmu.edu/examples'; // Change this to your home webpage URL
const outputDir = path.join(__dirname, './public/svgs');

// Ensure the output directory exists
fs.ensureDirSync(outputDir);

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(targetUrl);

    // Function to save SVG content to file
    const saveSvg = async (content, filename) => {
        const filePath = path.join(outputDir, filename);
        await fs.writeFile(filePath, content);
    };

    // Function to scrape SVGs from a page
    const scrapePage = async (page) => {
        const svgs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('svg')).map(svg => svg.outerHTML);
        });

        for (let i = 0; i < svgs.length; i++) {
            const svgContent = svgs[i];
            await saveSvg(svgContent, `svg-${Date.now()}-${i}.svg`);
        }
    };

    await scrapePage(page);

    // Get all links from the home page
    const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a')).map(a => a.href);
    });

    const targetOrigin = new URL(targetUrl).origin;

    for (const link of links) {
        const linkOrigin = new URL(link).origin;
        if (link.startsWith('http') && linkOrigin === targetOrigin) {
            try {
                await page.goto(link);
                await scrapePage(page);
            } catch (error) {
                console.error(`Failed to scrape ${link}: ${error}`);
            }
        }
    }

    await browser.close();
})();
