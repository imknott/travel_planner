/**
 * translateUIString
 * Translates a single UI string into the target language using your internal API.
 *
 * @param {string} text - The text to translate (e.g., "Search", "Book Now").
 * @param {string} lang - The target language code (e.g., "es", "fr").
 * @returns {Promise<string>} - The translated string, or the original if translation fails or lang is 'en'.
 */
export async function translateUIString(text, lang) {
  // Skip translation if language is English
  if (lang === 'en') return text;

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target: lang }),
    });

    const data = await res.json();

    // Return the translated text, or fallback to original
    return data.translated || text;
  } catch (err) {
    console.error('Translation API error:', err);
    return text; // Fallback to original on error
  }
}

/**
 * autoTranslateToEnglish
 * Detects the input language automatically and translates the text to English.
 * Useful for normalizing user input into a single language before parsing.
 *
 * @param {string} text - The text to auto-translate to English.
 * @returns {Promise<{ translated: string, detectedSourceLanguage: string }>} - Translated result + detected source.
 */
export async function autoTranslateToEnglish(text) {
  try {
    const res = await fetch('/api/translate/auto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();

    return data; // Expected shape: { translated: "English text", detectedSourceLanguage: "es", ... }
  } catch (err) {
    console.error('Auto-translate API error:', err);
    return { translated: text, detectedSourceLanguage: 'unknown' };
  }
}
