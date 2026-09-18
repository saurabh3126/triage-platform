# FactTriage® — Real-Time Misinformation Triage Platform

> A modern, public-facing viral claims triage and community-driven fact-checking network with automated Gemini AI analysis, heuristic risk scoring, and decentralized dispute voting.

---

## 📌 Overview

**FactTriage®** is an end-to-end platform engineered to combat the velocity of viral social media misinformation. By combining immediate client/server heuristic screening with Google's multimodal Gemini 2.5 AI, the platform auto-extracts text, computes a calibrated misinformation risk score, detects duplicates across the network, and exposes a transparent, immutable audit trail for every verdict and dispute.

---

## 🚀 Key Features

- **⚡ Gemini AI Multimodal Analysis & OCR**: Extract text directly from screenshots, parse viral links, and generate automated risk reasoning with platform and category auto-detection.
- **🛡️ Multi-Tier Risk Scoring**: 
  - Real-time heuristic detection for **Sensationalism**, **ALL-CAPS Shouting**, and **Missing Sources**.
  - Duplicate detection engine preventing spam and repeat submissions (>40% similarity matching).
- **🗳️ Decentralized Community Dispute & Voting Protocol**:
  - Any user can dispute an initial verdict to trigger a 12-hour community voting window.
  - IP-restricted one-vote-per-user enforcement with live vote distribution meters and auto-resolution after threshold.
- **📊 Platform Triage Intelligence Dashboard**:
  - Live KPIs tracking total claims, critical threats, pending reviews, and verified verdicts.
  - Threat severity distribution meters, category distributions, and real-time audit event streams.
- **📜 Immutable Audit Trail**:
  - Every action (`submitted`, `reviewed`, `disputed`, `voted`, `resolved`) is recorded with timestamp, note, and actor identity.
- **🎨 Neo-Brutalist High-Contrast Design**:
  - High-visibility aesthetic with bold borders, distinct shadows, responsive layouts, and zero auth barriers for public accessibility.

---

## 🏗️ Architecture & Tech Stack

```
[ Social Media Link / Screenshot / Post ]
                 │
                 ▼
      [ React 18 + Vite Frontend ]
                 │ (REST API)
                 ▼
      [ Express.js + Node.js API ]
        ├── Heuristic Analyzer (Regex / NLP checks)
        ├── Similarity Matching (Jaccard / Levenshtein duplicate check)
        ├── Gemini 2.5 Flash (OCR + Multimodal Reasoning)
        └── Mongoose ODM ──▶ [ MongoDB Atlas ]
```

- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, Lucide Icons, React Hot Toast.
- **Backend**: Node.js, Express.js, Mongoose, Axios, dotenv, cors.
- **AI & Processing**: `@google/generative-ai` (Gemini 2.5 Flash), Cheerio/Meta extractors.
- **Database**: MongoDB (Atlas/Local) with indexing on status, riskLevel, and text embeddings.

---

## 💡 Architectural Decision Points (DPs)

### Decision Point 1: Hybrid Heuristic + Multimodal LLM Triage vs. Pure LLM Analysis
- **Context**: Social media claims arrive in high volume with varied modalities (raw text, screenshots, news links). Relying solely on external LLM calls causes latency spikes, rate-limit bottlenecks, and higher operational costs.
- **Decision**: Implemented a hybrid two-stage pipeline:
  1. *Deterministic Heuristic Engine*: Immediately executes regex-based keyword detection (sensationalist words, shouting caps ratios, unsourced triggers) and duplicate cross-matching on the server.
  2. *Multimodal Gemini 2.5 Flash Engine*: Triggered on-demand to perform OCR on attached screenshots and deep contextual reasoning.
- **Outcome**: Near-instant feedback for end users while preserving deep multimodal comprehension when required.

### Decision Point 2: Public Community Dispute Protocol vs. Closed Moderator Gatekeeping
- **Context**: Centralized fact-checking platforms often suffer from reviewer backlog and user distrust over single-party verdicts.
- **Decision**: Designed an open dispute workflow where any community member can challenge an initial verdict. Challenging moves the claim into `Disputed` status and opens a time-locked 12-hour voting window requiring $\ge 3$ community votes to automatically reconcile.
- **Outcome**: Democratized verification with transparent accountability and verifiable consensus without requiring mandatory user signups or logins.

### Decision Point 3: Safe Unicode Aggregation (`$substrCP`) vs. Naive String Truncation
- **Context**: Viral claims contain emojis, non-Latin scripts, and special Unicode characters (e.g., 🍵, 🚨, Hindi/Arabic text). Using MongoDB's standard `$substr` during analytics aggregation crashes the pipeline if a multi-byte UTF-8 character is sliced mid-boundary.
- **Decision**: Migrated database aggregation pipelines to `$substrCP` (Code Point calculation) for all text projections and preview generation.
- **Outcome**: 100% crash resilience across global, multi-lingual social media text with zero UTF-8 slice errors.

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI
- Google Gemini API Key

### 1. Environment Setup

Create `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/fact-triage?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Install & Run Server
```bash
cd server
npm install
npm run dev
# Server runs on http://localhost:5000
```

### 3. Install & Run Client
```bash
cd client
npm install
npm run dev
# Client runs on http://localhost:5173
```

---

## 📡 API Reference Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/claims` | Fetch all claims with query filters (`category`, `status`, `sort`, `search`) |
| `POST` | `/api/claims` | Submit a new claim with duplicate checks and flag analysis |
| `GET` | `/api/claims/stats` | Aggregated dashboard metrics, severity counts, and audit stream |
| `GET` | `/api/claims/trending`| Highest risk claims within the last 24 hours |
| `GET` | `/api/claims/:id` | Retrieve single claim by MongoDB ID |
| `PATCH` | `/api/claims/:id/review` | Submit reviewer verdict with note |
| `PATCH` | `/api/claims/:id/dispute` | Transition claim to Disputed and launch 12h voting |
| `POST` | `/api/claims/:id/vote` | Cast community vote (`true` / `false`) |
| `POST` | `/api/claims/:id/resolve`| Finalize dispute decision based on vote outcome |
| `POST` | `/api/claims/extract-link`| Auto-extract preview and text from article or Reddit URL |
| `POST` | `/api/claims/gemini-analyze`| Multimodal AI analysis + OCR screenshot processing |

---

## 📄 License
MIT License. Created for the FactTriage Misinformation Verification Challenge.
