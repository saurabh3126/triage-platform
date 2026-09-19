# FactTriage

**Hackathon ID:** AZIS-UUP4SQ  
**Track:** Misinformation / Content Triage  
**Live Deployed App:** https://azisly-hackathon-frontend.onrender.com/  
**Demo Video:** [Watch the 3-Minute Walkthrough Video](PASTE_YOUR_DEMO_VIDEO_LINK_HERE)  
**Repository:** https://github.com/saurabh3126/triage-platform  
**Grading Mode:** Browser agent driving UI  

---

## Overview

FactTriage is a lightweight, real-time misinformation triage platform built to handle viral social media claims quickly. When posts start blowing up on apps like WhatsApp, X, or Instagram, misinformation moves faster than newsrooms can publish formal debunkings. This app lets anyone submit a suspicious claim, calculates an automated heuristic risk score right away, makes the feed public for crowd review, and gives reviewers a clean interface to submit verdicts or initiate community dispute votes.

---

## Five Required Features

1. **Submit a Claim**
   - Submit viral post text along with the source platform (`WhatsApp`, `X`, `Instagram`, `Reddit`, `Other`) and primary category (`Politics`, `Health`, `Finance`, `Other`).
   - Includes optional link auto-extraction and screenshot attachment with OCR text extraction.
2. **Risk Flags**
   - Automatically scans input for sensational keywords (`"breaking"`, `"shocking"`, `"share before deleted"`, etc.).
   - Detects shouting posts where uppercase characters make up over 50% of the text.
   - Flags unsourced claims that do not contain a verifiable URL link.
   - Any claim triggering **2 or more flags** is automatically flagged as **High Risk** with an elevated threat severity score.
3. **Review Workflow**
   - Reviewers can evaluate any unverified post and apply an initial verdict: **Verified True**, **Verified False**, or **Misleading**.
   - Every review requires a brief note explaining the context or evidence, which is logged to the claim's permanent audit trail.
4. **Public Feed**
   - A live feed showing all claims badged by status and threat level.
   - Real-time dropdown filters for category and status, plus a text search box and sort controls.
5. **Detail View**
   - Clicking any claim opens a dedicated detail drawer displaying the complete text, triggered flags, risk meter, reviewer notes, and timestamped audit history.
   - Allows users to dispute a verdict and participate in a 12-hour community vote with real-time percentage meters.

---

## Decision Points Summary

Our full rationale for the three core product decisions is documented in [`DECISIONS.md`](./DECISIONS.md):

- **DP1 (Feed Order):** We sort by **Highest Risk First** by default so that explosive, high-severity claims get eyes on them immediately before causing real-world damage. Users can toggle to **Most Recent First** anytime.
- **DP2 (Visibility):** Unverified claims are **immediately visible** with an `Unverified` status badge. Holding them back creates a dangerous information vacuum during breaking events.
- **DP3 (Editing):** Claim text is **immutable after submission**. To prevent bait-and-switch manipulation, all corrections and context must be added through reviewer notes, dispute voting, and the audit trail.

---

## Evaluation & Access (No Login Required)

- **Authentication:** In accordance with the hackathon rules, all authentication and login walls have been completely removed.
- **Test Credentials:** None needed. Graders and evaluation scripts can access all five features, submit claims, review claims, and cast votes without creating an account or signing in.

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router v6, React Hot Toast
- **Backend:** Node.js, Express.js, Mongoose
- **Database:** MongoDB Atlas
- **AI / OCR:** Google Generative AI SDK (Gemini 2.5 Flash for image OCR and link analysis)

---

## Running Locally

### 1. Clone the repository
```bash
git clone https://github.com/saurabh3126/triage-platform.git
cd triage-platform
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
In a new terminal:
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 3–4 Minute Demo Video Guide

Here is a recommended script for recording the walkthrough:

1. **Submit a Claim (0:00 – 0:45):** Go to `/submit`, enter a suspicious message with all-caps and keywords (e.g. `"BREAKING: SHOCKING TRUTH THEY DON'T WANT YOU TO KNOW share before deleted"`), choose `WhatsApp` and `Health`, then hit submit.
2. **Risk Flags (0:45 – 1:15):** Show that the claim immediately received all three flags (Sensational, Shouting, Unsourced) and automatically qualified as **High Risk**.
3. **Review Workflow (1:15 – 1:50):** Click on the submitted claim to open the drawer. Click "Add Initial Verdict", pick `Verified False` or `Misleading`, write a quick explanation note, and save it. Show how the badge updates and the note appears in the audit log.
4. **Public Feed & Filters (1:50 – 2:30):** Head back to `/`. Show the feed sorting by Highest Risk by default, switch to Most Recent, and filter by category (`Health`) and status (`Verified False`).
5. **Detail View & Community Dispute (2:30 – 3:15):** Open the drawer again. Click "Dispute this Verdict" to start community voting. Cast a vote and point out the live true/false percentage meter.
6. **Decision Points (3:15 – 3:45):** Briefly explain why we chose risk-first ordering (DP1), immediate public visibility (DP2), and immutable text with an audit trail (DP3).
