# Smart Resume Screener

An AI-powered resume screening application that helps recruiters analyze,
match, score, and rank candidates against a job description.

The application provides an end-to-end screening workflow where recruiters
can submit a job description and one or more resumes, process them with
Google Gemini, review candidate matches and scores, and inspect persisted
screening results through a recruiter-facing dashboard.

---

## Overview

Smart Resume Screener is designed to reduce the manual effort involved in
initial resume screening.

The system:

1. Accepts a job description from a recruiter.
2. Accepts one or more resume files.
3. Extracts structured information from the job description and resumes.
4. Uses Gemini AI to identify skills, experience, and requirements.
5. Matches candidate information against job requirements.
6. Calculates screening scores and decisions.
7. Ranks candidates based on screening results.
8. Persists screening data for later review.
9. Provides recruiter-facing candidate and dashboard views.

---

## Key Features

### AI-Powered Screening

- Google Gemini integration for job description extraction.
- Google Gemini integration for resume extraction.
- AI-assisted requirement matching.
- Structured LLM responses validated using Zod.
- AI-powered screening workflow with fallback handling.

### Candidate Analysis

- Candidate name and contact information extraction.
- Resume information extraction.
- Required-skill matching.
- Requirement relationship classification.
- Evidence associated with matched requirements.
- Candidate confidence scores.
- Overall candidate score.
- Screening decision.
- Strengths and concerns.
- Candidate ranking.

### Recruiter Dashboard

- Screening dashboard.
- Candidate listing.
- Candidate detail view.
- Screening history.
- Candidate scores and decisions.
- Requirement matching information.

### Persistence

- Prisma ORM.
- SQLite database.
- Persisted job postings.
- Screening runs.
- Candidates.
- Resumes.
- Screening results.
- Requirement matches.

### Reliability

- Input validation.
- File upload limits.
- Structured JSON validation for AI responses.
- LLM error handling.
- Rule-based fallback when AI processing is unavailable.

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite

### Backend

- Node.js
- Express
- TypeScript
- Prisma
- SQLite
- Zod
- Multer

### AI

- Google Gemini
- `@google/genai`

### Development

- npm
- Git
- GitHub

---

## Architecture

```text
                    ┌──────────────────────┐
                    │      Recruiter       │
                    │    React Frontend    │
                    └──────────┬───────────┘
                               │
                               │ HTTP / REST API
                               ▼
                    ┌──────────────────────┐
                    │    Express Backend   │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       Job Description      Resume Files      Database
         Processing         Processing        Prisma/SQLite
              │                │
              ▼                ▼
                    ┌──────────────────────┐
                    │     Gemini AI        │
                    │ Extraction +         │
                    │ Requirement Matching │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Screening / Scoring  │
                    │      / Ranking       │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Candidate Results    │
                    │ Dashboard / Details  │
                    └──────────────────────┘
Project Structure
smart-resume-screener/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── index.ts
│   │   │   └── scoring.config.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── candidate.controller.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── health.controller.ts
│   │   │   └── screening.controller.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── candidate.route.ts
│   │   │   ├── dashboard.route.ts
│   │   │   └── screening.route.ts
│   │   │
│   │   ├── services/
│   │   │   ├── jdExtraction.service.ts
│   │   │   ├── llm.service.ts
│   │   │   ├── pdfExtraction.service.ts
│   │   │   ├── resumeExtraction.service.ts
│   │   │   ├── screeningPersistence.service.ts
│   │   │   ├── scoring.service.ts
│   │   │   └── semanticMatching.service.ts
│   │   │
│   │   └── utils/
│   │
│   └── .env.example
│
├── frontend/
│   └── src/
│       ├── components/
│       │   └── layout/
│       ├── pages/
│       │   ├── CandidateDetail.tsx
│       │   ├── Candidates.tsx
│       │   ├── Dashboard.tsx
│       │   └── ScreenCandidates.tsx
│       └── App.tsx
│
└── README.md

## Getting Started
Prerequisites

Make sure the following are installed:

Node.js
npm
Git

A Google Gemini API key is required for live AI-powered screening.

1. Clone the Repository
git clone <repository-url>
cd smart-resume-screener
Backend Setup
2. Install Backend Dependencies
cd backend
npm install
3. Configure Environment Variables

Create a .env file inside the backend directory.

You can copy the example file:

Windows PowerShell
Copy-Item .env.example .env
macOS / Linux
cp .env.example .env

Then open:

backend/.env

Configure the environment variables:

PORT=4000
NODE_ENV=development

DATABASE_URL="file:./dev.db"

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash

MAX_UPLOAD_FILE_SIZE_MB=8
MAX_RESUMES_PER_REQUEST=20
Important

Never commit your real API key to Git.

The .env file is intentionally excluded from version control.

Use .env.example as the safe template.

4. Generate Prisma Client

From the backend directory:

npx prisma generate
5. Apply Database Migrations
npx prisma migrate dev

This creates/updates the SQLite database according to the Prisma schema.

6. Start the Backend
npm run dev

The backend runs on:

http://localhost:4000
7. Verify Backend Health

Open:

http://localhost:4000/api/health

Or use PowerShell:

Invoke-RestMethod http://localhost:4000/api/health

A successful live configuration reports:

live (Gemini)
Frontend Setup

Open a second terminal.

From the project root:

cd frontend
npm install
npm run dev

The frontend is available at:

http://localhost:5173

Open that address in your browser.

Using the Application
Step 1 — Create a Screening

Open:

http://localhost:5173/screen

Create a new screening.

Step 2 — Enter a Job Description

Paste the job description into the screening form.

The system processes the job description and extracts relevant requirements.

Step 3 — Upload Resumes

Upload one or more supported resume files.

The application extracts resume text and processes candidate information.

Step 4 — Run Screening

Start the screening process.

The system performs:

Job Description
       ↓
Requirement Extraction
       ↓
Resume Extraction
       ↓
Requirement Matching
       ↓
Candidate Scoring
       ↓
Candidate Ranking
       ↓
Persist Results
Step 5 — Review Results

The results page provides:

Candidate score
Screening decision
Confidence
Matched requirements
Partial/related requirements
Missing requirements
Evidence
Strengths
Concerns
Candidate ranking
Step 6 — Candidate Details

Recruiters can open individual candidates to inspect their screening results
and requirement-level matching information.

Step 7 — Dashboard

The dashboard provides an overview of screening activity and persisted
candidate results.

AI Processing

The application uses Google Gemini through the backend.

The Gemini API is accessed only from the backend so that the API key does
not need to be exposed to the frontend.

The AI service provides structured JSON responses which are validated using
Zod before the application uses the data.

The LLM service is centralized so resume extraction, job description
extraction, and semantic matching can use the same controlled AI interface.

AI Response Validation

AI responses are not trusted blindly.

The backend:

Sends a structured request to Gemini.
Receives the response.
Parses the JSON response.
Validates it against the expected Zod schema.
Retries when validation fails.
Uses fallback processing when the AI request cannot be completed.

This helps prevent malformed AI responses from breaking the screening pipeline.

Fallback Processing

The application includes deterministic rule-based fallback behavior.

If Gemini is unavailable or an AI request fails, the affected extraction
or processing step can fall back to rule-based logic.

This allows the core application workflow to remain demonstrable even when
the external AI service is temporarily unavailable.

The UI indicates when AI-powered processing is being used.

Data Persistence

The application uses Prisma with SQLite for local persistence.

The main persisted entities include:

Job postings
Screening runs
Candidates
Resumes
Screening results
Requirement matches

Prisma migrations are stored under:

backend/prisma/migrations/

The local SQLite database is configured through:

DATABASE_URL="file:./dev.db"
API

The backend exposes REST endpoints for the application.

Health
GET /api/health

Returns backend and AI configuration status.

Screening

The screening API accepts a job description and resume files and returns
processed candidate results.

Candidates

Candidate endpoints provide access to persisted candidate information and
screening results.

Dashboard

Dashboard endpoints provide persisted screening and candidate information
for the recruiter interface.

Security

The application follows several basic security practices:

API keys are stored in environment variables.
.env is excluded from Git.
The frontend never directly receives the Gemini API key.
Uploaded file size is limited.
The number of resumes per request is limited.
AI output is schema validated before being trusted.
API failures are handled without exposing the API key.

Never commit a real Gemini API key to the repository.

Development Commands
Backend

Install dependencies:

npm install

Run development server:

npm run dev

Build:

npm run build

Run tests:

npm test

Generate Prisma client:

npx prisma generate

Run migrations:

npx prisma migrate dev
Frontend

Install dependencies:

npm install

Run development server:

npm run dev

Build:

npm run build
Demo

A typical demonstration flow is:

1. Open the Smart Resume Screener
2. Create a new screening
3. Paste a job description
4. Upload a resume
5. Run the screening
6. Show AI-powered processing
7. Review candidate score and decision
8. Inspect requirement matches
9. Open candidate details
10. Show persisted dashboard information

The application interface identifies the AI-powered workflow using Gemini.

Example Job Description

Example role:

Software Engineer — Full Stack

We are looking for a Software Engineer to build scalable web applications.

Required Skills:
- JavaScript / TypeScript
- React
- Node.js
- Express
- REST APIs
- SQL
- Git
- HTML and CSS

Preferred:
- PostgreSQL
- Docker
- AWS
- CI/CD
- Automated testing
- System design

This can be used to demonstrate candidate matching and scoring.

Project Status

The project currently includes the end-to-end screening workflow:

 Backend foundation
 Resume text extraction
 Job description extraction
 Gemini AI integration
 Structured AI response validation
 Requirement matching
 Candidate scoring
 Candidate ranking
 REST API
 Prisma database persistence
 Screening history
 Candidate detail pages
 Recruiter dashboard
 React frontend
 AI-powered screening workflow
 Rule-based fallback handling
Future Improvements

Potential future improvements include:

Authentication and recruiter accounts
Role-based access control
PostgreSQL production deployment
Cloud file storage
Advanced analytics
Recruiter feedback loops
Configurable scoring weights
More advanced candidate comparison
Automated email workflows
Production deployment and monitoring
License

This project is intended as an academic/project demonstration application.


## 2. Save it

In VS Code:

**Ctrl + A → Delete → paste the README above → Ctrl + S**

Then return to PowerShell.

### 3. Check it

```powershell
Get-Content README.md
