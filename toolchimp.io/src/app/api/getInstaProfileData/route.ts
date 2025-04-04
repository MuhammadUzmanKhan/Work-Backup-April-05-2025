import { NextResponse, NextRequest } from "next/server";
import puppeteer from "puppeteer-extra";
import { executablePath } from "puppeteer";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const profileLink = url.searchParams.get("profileLink");

  if (!profileLink) {
    return NextResponse.json(
      { error: "Profile link is required" },
      { status: 400 },
    );
  }

  let browser = null;

  try {
    console.log("Launching Puppeteer browser");
    browser = await puppeteer.launch({
      args: [
        "--disable-features=site-per-process",
        "--disable-web-security",
        "--window-size=1300,800",
      ],
      headless: false,
      executablePath: executablePath(),
    });

    console.log("Browser Launched!");
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    );
    await page.setJavaScriptEnabled(true);

    await page.goto(profileLink, { waitUntil: "networkidle2" });

    const targetSelector = 'img[alt*="Profile photo"]';

    await page.waitForSelector(targetSelector, { timeout: 10000 });

    const imgSrc = await page.evaluate((selector: string) => {
      const imgElement = document.querySelector(selector) as HTMLImageElement;
      return imgElement ? imgElement.src : null;
    }, targetSelector);

    if (!imgSrc) {
      throw new Error("Image source not found");
    }

    return NextResponse.json({ success: true, imgSrc }, { status: 200 });
  } catch (error) {
    console.error("Error downloading profile picture:", error);
    return NextResponse.json(
      { error: "Failed to download profile picture" },
      { status: 500 },
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
