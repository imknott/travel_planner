/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  // Optional: Add this to completely disable static generation attempts
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['firebase', '@firebase/auth'] // Add any Firebase packages
  }
}