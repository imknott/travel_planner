import { chromium } from 'playwright';

/**
 * Scrapes Kiwi.com for flights between two cities on specified dates.
 * @param {string} fromCity - e.g., "raleigh-north-carolina-united-states"
 * @param {string} toCity - e.g., "tokyo-japan"
 * @param {string} departDate - "YYYY-MM-DD"
 * @param {string|null} returnDate - "YYYY-MM-DD"
 * @returns {Promise<Array<{ price, airline, duration, stops, link }>>}
 */
export async function scrapeKiwiFlights(fromCity, toCity, departDate, returnDate = null) {
  const url = new URL('https://www.kiwi.com/en/');
  url.searchParams.set('origin', fromCity);
  url.searchParams.set('destination', toCity);
  url.searchParams.set('outboundDate', departDate);
  if (returnDate) {
    url.searchParams.set('inboundDate', returnDate);
  }

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
  await page.goto(url.toString(), { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-test="ResultCardWrapper"]', { timeout: 15000 });

  const results = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-test="ResultCardWrapper"]'))
      .slice(0, 3)
      .map((card) => {
        const price = card.querySelector('[data-test="Price"]')?.textContent?.trim() || 'N/A';
        const airline = card.querySelector('[data-test="Airline"]')?.textContent?.trim() || 'Unknown';
        const duration = card.querySelector('[data-test="Duration"]')?.textContent?.trim() || null;
        const stops = card.querySelector('[data-test="StopInfo"]')?.textContent?.includes('direct') ? 0 : 1;
        const link = window.location.href;
        return { price, airline, duration, stops, link };
      });
  });

  await browser.close();
  return results;
}
