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
  const url = `https://www.kiwi.com/en/search/results/${fromCity}/${toCity}/${departDate}/${returnDate}`;
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

  const page = await browser.newPage(); // ✅ this was missing

  try {
    await page.goto(url.toString(), { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    await page.waitForSelector('[data-test="ResultCardWrapper"]', { timeout: 30000 });

    const results = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-test="ResultCardWrapper"]'))
        .slice(0, 3)
        .map(card => {
          const price = card.querySelector('[data-test="ResultCardPrice"]')?.innerText.trim() || 'N/A';
          const airline = card.querySelector('[data-test="ResultCardCarrierLogo"] img')?.alt || 'Unknown';
          const duration = card.querySelector('[data-test="TripTimestamp"]')?.textContent?.trim() || '';
          const stopsText = card.querySelector('[data-test^="StopCountBadge"]')?.textContent || '';
          const stops = stopsText.toLowerCase().includes('direct') ? 0 : 1;
          return {
            price,
            airline,
            duration,
            stops,
            link: window.location.href
          };
        });
    });

    return results;
  } catch (err) {
    console.error(`❌ Scraping failed for ${toCity} on ${departDate}:`, err);
    return [];
  } finally {
    await browser.close();
  }
}
