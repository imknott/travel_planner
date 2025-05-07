/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  i18n: {
    locales: ['en', 'es', 'fr', 'zh', 'hi', 'ar', 'pt', 'ru', 'ja', 'de'],
    defaultLocale: 'en',
  }
};