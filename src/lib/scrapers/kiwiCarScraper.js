import { chromium } from 'playwright';

/**
 * Scrapes Kiwi.com for car rentals in a city and date range.
 * @param {string} city - e.g., "Tokyo"
 * @param {string} pickupDate - "YYYY-MM-DD"
 * @param {string} dropoffDate - "YYYY-MM-DD"
 * @returns {Promise<Array<{ company, price, link }>>}
 */
export async function scrapeKiwiCars(city, pickupDate, dropoffDate) {
  const url = `https://www.kiwi.com/en/search/cars/results?location=${encodeURIComponent(city)}&pickup=${pickupDate}&dropoff=${dropoffDate}`;

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--no-zygote'
    ]
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-test="CarResultCard"]', { timeout: 15000 });

  const results = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-test="CarResultCard"]'))
      .slice(0, 3)
      .map((card) => {
        const company = card.querySelector('[data-test="RentalCompany"]')?.textContent?.trim() || 'Unknown';
        const price = card.querySelector('[data-test="Price"]')?.textContent?.trim() || 'N/A';
        const link = window.location.href;
        return { company, price, link };
      });
  });

  await browser.close();
  return results;
}
