<p align="center">
  <img src="https://img.shields.io/badge/Built%20With-React-61DAFB?logo=react&logoColor=white&style=for-the-badge" alt="React Badge">
  <img src="https://img.shields.io/badge/Framework-Next.js-000000?logo=next.js&logoColor=white&style=for-the-badge" alt="Next.js Badge">
  <img src="https://img.shields.io/badge/Runtime-Node.js-339933?logo=nodedotjs&logoColor=white&style=for-the-badge" alt="Node.js Badge">
  <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwindcss&logoColor=white&style=for-the-badge" alt="Tailwind CSS Badge">
  <img src="https://img.shields.io/badge/Ads-Google%20AdMob-ec0c4d?logo=googleads&logoColor=white&style=for-the-badge" alt="Google AdMob Badge">
</p>

---

#  FlightHacked

FlightHacked is a multilingual travel app that finds the cheapest possible flight combinations using custom layovers, AI-powered search with LLMs, and open-source APIs—all run locally.

---

##  Features

-  **Multilingual Support** via LibreTranslate
-  **LLM Integration** with Ollama (Mistral, LLaMA3, etc.)
-  **Fast Caching** with Redis
-  **Smart Search Bar** powered by natural language processing
-  **Modern UI** using Tailwind CSS
-  **Ad Integration** with Google AdMob
-  **Hot-reloadable Dev Server** using Next.js

---

## 🛠 Installation Guide

### Prerequisites

- Node.js (v18+)
- npm, yarn, pnpm, or bun
- Ollama installed locally
- Redis (optional, for caching)
- LibreTranslate (or access to [libretranslate.de](https://libretranslate.de))

---

###  Ollama Setup

#### Windows

```bash
# Download from https://ollama.com/download
ollama --version      # Confirm installation
ollama run mistral    # Run the Mistral model
```

#### macOS

```bash
brew install ollama
ollama run mistral
```

#### Ubuntu/Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama run mistral
```

> If needed: `sudo systemctl restart ollama`

---

###  Install Dependencies

Clone the repo and install dependencies:

```bash
git clone https://github.com/yourusername/flighthacked.git
cd flighthacked
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

---

###  Run the App Locally

```bash
npm run dev
```

Open your browser to [http://localhost:3000](http://localhost:3000)

---

##  Usage Examples

###  AI-Powered Flight Search

Users can type queries like:

```
"Find me the cheapest way to get from Paris to Bali in July"
```

The app uses Ollama to interpret the intent, then finds optimal layovers by scraping flight data via supported airline endpoints.

---

###  Language Detection & Translation

If a user types in another language, LibreTranslate auto-detects and translates the query before sending it to the LLM.

---

##  API Integration

### /api/search

```http
POST /api/search
```

**Body:**

```json
{
  "origin": "NYC",
  "destination": "TYO",
  "date": "2025-06-20",
  "language": "en"
}
```

**Returns:**

```json
{
  "routes": [
    {
      "segments": [
        { "from": "NYC", "to": "ICN", "airline": "Korean Air" },
        { "from": "ICN", "to": "TYO", "airline": "ANA" }
      ],
      "price": "$488"
    }
  ]
}
```

---

## 🛰 Deployment

### Vercel (Recommended)

1. Push your project to GitHub
2. Go to [https://vercel.com/import](https://vercel.com/import)
3. Link your repository
4. Set environment variables:
   - `OLLAMA_API=http://localhost:11434` *(if self-hosting)*
   - `TRANSLATE_API=https://libretranslate.de/translate` *(or your own instance)*

### Docker (Self-Hosted Stack)

```bash
docker-compose up --build
```

Ensure you have local containers or ports available for:
- Ollama
- LibreTranslate
- Redis (optional)

---

## Tech Stack

- **Next.js** – SSR/ISR React Framework
- **Tailwind CSS** – Utility-first styling
- **Ollama** – Local LLMs (LLaMA3, Mistral)
- **Redis** – Optional fast cache
- **LibreTranslate** – Language support
- **Google AdMob** – Revenue via ads

---

## Acknowledgments

- [Ollama](https://ollama.com)
- [LibreTranslate](https://libretranslate.com)
- [Redis](https://redis.io)
- [Vercel](https://vercel.com)
- [Shields.io](https://shields.io)

---

## License

MIT © Ian Knott