import { chromium } from 'playwright';

/**
 * Scrapes Kiwi.com for hotels in a city and date range.
 * @param {string} city - e.g., "Tokyo"
 * @param {string} checkIn - "YYYY-MM-DD"
 * @param {string} checkOut - "YYYY-MM-DD"
 * @returns {Promise<Array<{ name, price, link }>>}
 */
export async function scrapeKiwiHotels(city, checkIn, checkOut) {
  const url = `https://www.kiwi.com/en/search/hotels/results?destination=${encodeURIComponent(city)}&checkin=${checkIn}&checkout=${checkOut}`;

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
  await page.waitForSelector('[data-test="HotelResultCard"]', { timeout: 15000 });

  const results = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-test="HotelResultCard"]'))
      .slice(0, 3)
      .map((card) => {
        const name = card.querySelector('[data-test="HotelName"]')?.textContent?.trim() || 'Unnamed';
        const price = card.querySelector('[data-test="Price"]')?.textContent?.trim() || 'N/A';
        const link = window.location.href;
        return { name, price, link };
      });
  });

  await browser.close();
  return results;
}
