# AI Travel Planner ✈️

A full-stack web app that uses Claude AI to generate personalized travel itineraries, budget estimates, hotel suggestions, and offers a conversational AI trip assistant.

## Live Demo
- **Frontend:** https://ai-travel-planner-dihxg37t8-prajwalbm0305-6093s-projects.vercel.app/
- **Backend:** https://ai-travel-planner-0vd6.onrender.com

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 + TypeScript | SSR, App Router, type safety |
| Styling | Tailwind CSS | Rapid responsive UI with design tokens |
| Backend | Node.js + Express | Fast REST API, great ecosystem |
| Database | MongoDB + Mongoose | Flexible schema for nested itinerary data |
| Auth | JWT + bcryptjs | Stateless, secure, scalable |
| AI | Google Gemini | Best-in-class instruction following and JSON output |

---

## Features

- **Multi-user auth** — JWT-based register/login with bcrypt password hashing
- **AI itinerary generator** — Day-by-day plan with specific times, locations, costs
- **Budget estimator** — Realistic breakdown by flights, accommodation, food, activities
- **Hotel suggestions** — Budget/mid-range/luxury picks per destination
- **Editable itinerary** — Add/remove activities per day
- **Day regeneration** — Regenerate any day with custom preferences
- **AI Trip Chat Assistant** — Conversational AI embedded in each trip
- **Smart Weather Advice** ⭐ — AI-powered day-by-day weather forecasts with packing tips and activity impact alerts

### Creative Feature: Smart Weather Advice

**Problem it solves:** Travellers often under-pack, wear the wrong clothes, or plan outdoor activities on bad weather days because generic forecasts don't connect to their specific itinerary. A tourist planning a hike on Day 3 of a trip to Kyoto in June has no idea if that day is the rainy season peak or a clear window.

**Solution:** A dedicated Weather tab on every trip that generates AI-powered, destination-aware day-by-day forecasts covering:
- Temperature highs/lows, humidity, precipitation chance, UV index, wind
- A per-day packing tip list (e.g. "bring a compact umbrella", "sunscreen SPF50+")
- An **Activity Impact** alert — directly tells the user how the weather affects the activities planned that day (e.g. "The temple garden walk on Day 2 may be slippery — wear non-slip shoes")
- A general packing list, clothing recommendations, and health tips for the destination in that travel month
- "Best time of day" guidance for outdoor activities

**Engineering:** The weather endpoint calls Claude with a compact prompt asking for structured JSON weather data per day. It takes the trip's `startDate` to derive the travel month, making forecasts seasonally accurate. The data is persisted to MongoDB so it loads instantly on repeat visits. Users can refresh it anytime. The feature works without a live weather API — Claude's training includes reliable seasonal climate knowledge for major destinations, making it accurate enough for trip planning purposes.

**Why it's genuinely useful:** It's the missing link between "I have an itinerary" and "I know what to pack and when to go outside." No other travel planner connects weather context directly to planned activities.

---

## Architecture

```
Frontend (Next.js)
  ├── AuthContext — JWT storage + global auth state
  ├── /dashboard — Trip list with stats
  ├── /trips/new — 3-step trip creation form
  └── /trips/[id] — Itinerary, budget, hotels, AI chat tabs

Backend (Express)
  ├── /api/auth — register, login, me
  └── /api/trips
        ├── CRUD (protected, user-scoped)
        ├── POST /:id/generate — parallel AI calls
        ├── PUT /:id/days/:n/regenerate
        ├── POST/DELETE /:id/days/:n/activities
        └── POST /:id/chat

AI Service (aiService.js)
  ├── generateItinerary() — structured JSON day plan
  ├── estimateBudget() — cost breakdown
  ├── suggestHotels() — 6 hotels across budget tiers
  ├── regenerateDay() — replace one day's activities
  └── chatWithAssistant() — conversational context-aware replies

MongoDB
  ├── Users — hashed passwords, preferences
  └── Trips — embedded itinerary, budget, hotels, chatHistory
```

---

## Authentication & Authorization

- Passwords hashed with bcrypt (12 salt rounds)
- JWT signed with a secret, 7-day expiry
- `protect` middleware on all `/api/trips/*` routes
- **Data isolation enforced at query level:** every DB query includes `{ user: req.user._id }` — a user cannot read, modify, or delete another user's trips even if they guess the trip ID

---

## AI Agent Design

The AI agent is called via the Google Gemini Messages API. Key design decisions:

1. **Parallel generation** — itinerary, budget, and hotels are generated in `Promise.all()` for 3× speed
2. **Strict JSON prompting** — system prompt says "respond only with valid JSON, no markdown", and the output is cleaned before `JSON.parse()`
3. **Context compression for chat** — only a compact summary is passed as system context, not the full trip JSON, reducing token cost
4. **Seasonal weather intelligence** — weather advice uses the trip's `startDate` to derive the travel month, giving seasonally accurate forecasts without a paid weather API
5. **Error resilience** — JSON parse failures return a 500 with a clear message; AI key errors return 500 with "Invalid API key"

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Anthropic API key

### Backend
```bash
cd backend
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, ANTHROPIC_API_KEY
npm install
npm run dev
# Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## Deployment

### Backend → Render
1. Push to GitHub
2. New Web Service on render.com → connect repo → set root dir to `backend`
3. Build: `npm install`, Start: `npm start`
4. Add env vars: `MONGO_URI`, `JWT_SECRET`, `ANTHROPIC_API_KEY`, `FRONTEND_URL`

### Frontend → Vercel
1. Import repo on vercel.com → set root dir to `frontend`
2. Add env var: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api`
3. Deploy

---

## Key Design Decisions & Trade-offs

| Decision | Reasoning |
|----------|-----------|
| Embedded itinerary in Trip document | Simpler queries, no joins; trips are always loaded with their itinerary |
| JWT in localStorage | Simpler for SPA; trade-off is XSS risk — mitigated by input sanitization |
| `Promise.all` for generation | 3× faster than sequential; if one fails, all fail — acceptable for this use case |
| Chat history capped at 50 messages | Prevents MongoDB document bloat; recent context is most relevant |
| No streaming AI response | Simpler implementation; streaming adds complexity for marginal UX gain here |

---

## Known Limitations

- No real hotel booking integration (suggestions are AI-generated, not live data)
- AI-generated costs are estimates and vary from real prices
- No image upload or map integration
- Chat doesn't auto-apply itinerary changes — user must manually edit
- No email verification flow

---

## Commit History

The repo follows conventional commits:
- `feat:` new features
- `fix:` bug fixes  
- `refactor:` code restructuring
- `docs:` documentation
