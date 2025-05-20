<p align="center">
  <img src="https://img.shields.io/badge/Built%20With-React-61DAFB?logo=react&logoColor=white&style=for-the-badge" alt="React Badge">
  <img src="https://img.shields.io/badge/Framework-Next.js-000000?logo=next.js&logoColor=white&style=for-the-badge" alt="Next.js Badge">
  <img src="https://img.shields.io/badge/Runtime-Node.js-339933?logo=nodedotjs&logoColor=white&style=for-the-badge" alt="Node.js Badge">
  <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwindcss&logoColor=white&style=for-the-badge" alt="Tailwind CSS Badge">
  <img src="https://img.shields.io/badge/Backend-Google%20Cloud%20Run-4285F4?logo=googlecloud&logoColor=white&style=for-the-badge" alt="Google Cloud Badge">
</p>

---

# FlightHacked

FlightHacked is a modern AI-powered travel planning platform. It helps users find the most affordable and personalized flights, hotels, and experiences using Google Gemini, Google Cloud Run, and Firestore Authentication.

---

## ✨ Features

- ✅ Google Sign-In, SMS, and Email Passwordless Auth (via Firebase)
- ✈️ AI-Powered Flight Search using Amadeus APIs
- 🏨 Hotel + Attraction Discovery using Google Places + Amadeus
- 💡 Natural Language Travel Planning (via Gemini)
- 🌍 Global Airport Auto-Complete
- 💻 Hosted on Google Cloud Run
- 🔐 Firestore-protected profiles and multi-factor auth support
- 🎯 Clean Tailwind UI with profile editor and protected routes

---

## 🚀 Tech Stack

- **Next.js** – React Framework
- **Tailwind CSS** – Styling
- **Firebase Auth + Firestore** – Secure user data & login
- **Google Cloud Run** – Scalable backend hosting
- **Google Places API** – Live destination + image data
- **Amadeus APIs** – Flight + Hotel offers
- **Gemini (Google GenAI)** – Natural language processing and itinerary logic

---

## 🔧 Setup

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/flighthacked.git
cd flighthacked
npm install
```

### 2. Environment Variables

Create a `.env` file with:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
GOOGLE_PLACES_KEY=...
GEMINI_API_KEY=...
AMADEUS_CLIENT_ID=...
AMADEUS_CLIENT_SECRET=...
```

---

## 🧠 Usage

### Example Queries:

> “Find me a flight from Raleigh to Tokyo in November with a hotel and attractions.”  
> “Cheapest round trip to Bali for 10 days in July.”

Your `/api/search` route uses Gemini to parse the query → resolves cities → fetches flights/hotels/attractions → returns packages.

---

## 🛰 Deployment: Google Cloud Run

1. Deploy using `Dockerfile` and Cloud Build
2. Use Application Default Credentials (no need for Firebase API keys)
3. Configure Firestore + Auth in Firebase Console
4. Store user profiles in Firestore on first login

---

## 🔐 Auth & Profile Management

- Uses Firebase Auth with support for:
  - Google sign-in
  - SMS multi-factor
  - Email magic link
- User profile fields:
  - Name, phone, email, home airport, interests (tags), sex, gender identity, countries traveled, bucket list

---

## 🧩 API Highlights

### `/api/search`
- AI-powered package builder (flights + hotels + attractions)
- Uses Google Gemini + Amadeus + Google Places

### `/api/hotels`
- Returns real hotel offers by city/date

### `/api/flights`
- Returns real Amadeus flight offers for any route

---

## 👥 Community & Acknowledgments

- [Gemini](https://deepmind.google/technologies/gemini)
- [Firebase](https://firebase.google.com)
- [Amadeus](https://developers.amadeus.com)
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Shields.io](https://shields.io)

---

## 📄 License

MIT © Ian Knott
