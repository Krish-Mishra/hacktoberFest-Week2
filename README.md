# LocalJourney AI 🧭✨
### Private, Local-First AI Trip Planner for Boutique Travel Agencies

![LocalJourney AI Preview](/hero.jpg)

**LocalJourney AI** is a complete, local-first B2B web application engineered specifically for luxury travel advisors, boutique concierges, and bespoke travel designers.

Traditional AI travel tools route high-net-worth traveler names, private flight numbers, vacation dates, and confidential dietary preferences through centralized commercial APIs (e.g. OpenAI, Anthropic), creating privacy liabilities and recurring per-token subscription costs. **LocalJourney AI runs 100% locally on the agent's laptop**: client profiles and itineraries are stored in a local SQLite database, and itineraries are generated via a local **Ollama** instance running open-weight models (`llama3`, `mistral`, `llama3.2`).

---

## ⚡ Core Value Proposition for Travel Agencies

1. **🔒 Absolute Client Confidentiality**: VIP schedules, passport names, and travel dates never leave the advisor's laptop. 100% GDPR, CCPA, and NDA compliant.
2. **💰 Zero Recurring Cloud API Costs**: Run hundreds of multi-day itineraries for $0.00 in API fees with zero vendor lock-in.
3. **✈️ Works Completely Offline**: Draft, curate, and review itineraries at 35,000 feet on long-haul flights or in remote safari lodges with zero internet connectivity.
4. **🎩 Concierge-Grade Prompt Specialization**: Custom system prompt tailored for Relais & Châteaux / Virtuoso-style standards—focusing on private museum access, signature suites, and sommelier reservations rather than generic tourist traps.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend & API Routes** | [Astro 5](https://astro.build/) (SSR Mode via Node Adapter) | High-performance server rendering with zero client-side JavaScript bloat |
| **Interactivity & Streams**| [HTMX](https://htmx.org/) + Server-Sent Events (SSE) | Real-time token streaming and dynamic partial swaps without heavy SPA frameworks |
| **Styling & Design** | [Tailwind CSS](https://tailwindcss.com/) + `@tailwindcss/typography` | Dark luxury aesthetic with champagne gold accents, glassmorphic cards, and print styles |
| **Local Database** | [SQLite](https://www.sqlite.org/) via `better-sqlite3` | Zero-config, ACID-compliant local storage with WAL mode in `data/localjourney.db` |
| **Local AI Engine** | [Ollama](https://ollama.ai/) (`http://localhost:11434`) | Open-weight model inference (`llama3`, `mistral`, `gemma2`) with built-in fallback simulator |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher (Node 20+ recommended)
- **Ollama** (optional for local LLM inference): [Download Ollama](https://ollama.ai/)

### 2. Install Dependencies
```bash
git clone https://github.com/Krish-Mishra/hacktoberFest-Week2.git
cd hacktoberFest-Week2
npm install
```

### 3. Start Local AI Model
In your terminal, pull and run any open-weight model:
```bash
ollama run llama3
# Or mistral:
# ollama run mistral
```
*(Note: If Ollama is not running, LocalJourney AI automatically activates its high-fidelity local streaming simulator so you can test and demonstrate the application with zero blockers).*

### 4. Launch Application
```bash
npm run dev
```
Open **[http://localhost:4321](http://localhost:4321)** in your browser.

---

## 🧭 Application Walkthrough

### 1. Dashboard (`/`)
- Real-time agency metrics: Total itineraries, secured client profiles, and 100% privacy score.
- Dynamic search and filter bar for existing itineraries.
- Delete and review actions connected seamlessly via HTMX.

### 2. Client Intake Studio (`/new`)
- Form capturing destination, calendar dates (with auto duration calculation), party size, budget, and travel pacing (**Relaxed**, **Balanced**, **Intensive**).
- Multi-select chips for curated passions (Culinary & Michelin, Historic Palazzos, Private Yacht Charters, Grand Crus, Hidden Speakeasies).
- Live Ollama streaming viewer displaying tokens in real time with typing cursor and instant markdown rendering.
- Automatic SQLite database persistence upon completion.

### 3. Client Presentation Dossier (`/itinerary/[id]`)
- Editorial layout ready for client presentation.
- One-click **Print / Export PDF** with dedicated `@media print` styling (removes UI navigation, optimizes typography).
- One-click **Copy Markdown** for email proposals.
- Interactive status toggle between `draft` and `finalized`.

### 4. VIP Client Directory (`/clients`)
- Local registry of private travelers, VIP tier classifications (Ultra-VIP Black Card, Gold Private Client), and linked itineraries.

---

## 📁 Project Structure

```text
├── data/
│   └── localjourney.db      # Local SQLite database (auto-created)
├── public/
│   ├── vendor/              # Offline local copies of HTMX, SSE, and Marked
│   └── hero.jpg             # Interface visual preview
├── src/
│   ├── layouts/
│   │   └── Layout.astro     # Master layout with luxury navigation & Ollama indicator
│   ├── lib/
│   │   ├── db.ts            # better-sqlite3 schema, queries, and sample seeds
│   │   ├── ollama.ts        # Ollama REST connector & streaming token generator
│   │   └── prompt.ts        # Boutique concierge prompt engineering
│   └── pages/
│       ├── index.astro      # Dashboard & itinerary repository
│       ├── new.astro        # Client Intake Studio & live streaming viewer
│       ├── clients.astro    # VIP Clients directory
│       ├── itinerary/
│       │   └── [id].astro   # Client presentation & print view
│       └── api/
│           ├── status.ts    # Live Ollama & SQLite health check
│           ├── generate.ts  # HTMX POST generation endpoint
│           ├── generate-sse.ts # Server-Sent Events real-time streaming endpoint
│           ├── clients.ts   # Client CRUD endpoint
│           └── itineraries/
│               └── [id].ts  # Itinerary deletion and status updates
├── astro.config.mjs         # Astro 5 SSR configuration with Node adapter
└── tailwind.config.mjs      # Tailwind configuration with luxury color tokens
```

---

## 🏆 Hacktoberfest 2026 Submission

- **Challenge**: Hacktoberfest Open-Source AI Challenge: Week 2 ("Side Hustle")
- **Tag**: `#hf26challenge`
- **Theme**: Building something with open-weight models that solves a real-world business need—enabling boutique travel agencies to automate bespoke itinerary creation while guaranteeing 100% privacy for VIP clients without recurring cloud API fees.
