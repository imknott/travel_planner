export async function translateUIString(text, lang) {
    if (lang === 'en') return text;
  
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target: lang }),
    });
  
    const data = await res.json();
    return data.translated || text;
  }
  
  export async function autoTranslateToEnglish(text) {
    const res = await fetch('/api/translate/auto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  
    const data = await res.json();
    return data;
  }
  