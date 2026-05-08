# 🧠 MindMesh — Backend PRD
**API & Data Layer — Hackathon Edition**  
**Version:** 1.0 · May 2026 · Owner: Suprathik (routes/DB) + AI Engineer (Syntra/ElevenLabs)

---

## 1. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Runtime | Node.js 20 + TypeScript | Consistency with frontend |
| Framework | Express 5 | Minimal, API-first, familiar |
| ORM | Prisma | Type-safe queries; fast schema iteration |
| Database | PostgreSQL (Neon) | Managed serverless Postgres; free tier |
| Auth | NextAuth.js (shared secret) | JWT verification; no custom auth logic |
| AI | Syntra API | Therapy conversation engine (AI Engineer owns) |
| TTS | ElevenLabs API | Voice output — warm, persona-matched voices |
| STT | OpenAI Whisper (if shipped) | Speech-to-text for voice input |
| Deployment | Render | Free tier; env var management |
| Logging | Pino | Structured JSON logs |

---

## 2. Database Schema

### Users

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | Auto-generated |
| googleId | VARCHAR UNIQUE | From Google OAuth |
| email | VARCHAR UNIQUE | |
| name | VARCHAR | |
| avatarUrl | VARCHAR | Google profile photo |
| persona | ENUM | CALM \| WARM \| DIRECT |
| createdAt | TIMESTAMP | |

### Sessions

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| userId | UUID FK → Users | |
| persona | ENUM | Persona used in this session |
| moodScore | INT | 1–10 from check-in |
| moodTags | TEXT[] | Emotion tags from check-in |
| startedAt | TIMESTAMP | |
| endedAt | TIMESTAMP NULL | NULL if in progress |

### Messages

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| sessionId | UUID FK → Sessions | |
| role | ENUM | USER \| ASSISTANT |
| content | TEXT | Plain text — no encryption in hackathon scope |
| createdAt | TIMESTAMP | |

> **Note:** Encryption is cut for hackathon scope. Add AES-256-GCM post-hackathon before any real user data is stored.

---

## 3. API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Returns current user profile |
| PATCH | `/api/auth/persona` | Update user's selected persona |

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/session/start` | Creates session with moodScore + moodTags; returns sessionId |
| POST | `/api/session/message` | Sends user message; streams Syntra response back |
| POST | `/api/session/audio` | Sends AI response text; returns ElevenLabs audio URL |
| POST | `/api/session/:id/end` | Closes session; sets endedAt |
| GET | `/api/session` | Lists all sessions for current user |
| GET | `/api/session/:id/messages` | Returns full message transcript |

### Mood

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mood` | Save mood check-in (score + tags) for today |
| GET | `/api/mood/today` | Check if today's check-in exists |

### Voice (STT — only if shipped)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/voice/transcribe` | Accepts audio blob; returns transcribed text via Whisper |

---

## 4. API Contract (Frontend ↔ Backend ↔ AI)

This is the agreed shape of data at every boundary. Both sides build to this independently.

### Start Session
```
POST /api/session/start
Body:  { moodScore: number, moodTags: string[] }
Returns: { sessionId: string }
```

### Send Message (Streaming)
```
POST /api/session/message
Body:  { sessionId: string, message: string, persona: "CALM" | "WARM" | "DIRECT" }
Returns: text/event-stream
  → stream of tokens ending with [DONE]
```

### Get Audio
```
POST /api/session/audio
Body:  { text: string, persona: "CALM" | "WARM" | "DIRECT" }
Returns: { audioUrl: string }
```

### Transcribe Voice (if shipped)
```
POST /api/voice/transcribe
Body:  FormData { audio: Blob }
Returns: { transcript: string }
```

---

## 5. Syntra API Integration (AI Engineer owns)

- All Syntra calls proxied through backend — API key never touches the client.
- System prompt built dynamically per request:
  - Persona tone instructions
  - Safety guardrails (no diagnosis, no medication advice, encourage professional help)
  - Session history (last 10 messages for context)
  - Mood context from check-in ("User is feeling a 3/10, tags: Anxious, Sad")
- Response streamed back to frontend via SSE.
- Retry: 2 attempts on 429/503 with 500ms backoff.

### Persona System Prompts

| Persona | System Prompt Tone Instruction |
|---------|-------------------------------|
| CALM | "Speak slowly and gently. Use short sentences. Prioritize validation over advice. Begin with reflection before offering any coping suggestions." |
| WARM | "Be warm, encouraging, and celebratory of small wins. Use affirming language. Balance emotional support with gentle forward momentum." |
| DIRECT | "Be clear and concise. Skip extended reflection. Offer concrete coping steps quickly. Respect the user's time and intelligence." |

### Safety Guardrails (injected into every prompt)
```
You are an AI mental health companion, not a licensed therapist.
Never diagnose a condition. Never recommend or discuss medication.
Never discourage professional therapy.
If the user expresses suicidal ideation or self-harm intent, immediately respond with:
"I hear you. Please reach out to iCall India at 9152987821 or the Vandrevala Foundation at 1860-2662-345. You don't have to face this alone."
Then gently continue the conversation.
```

---

## 6. ElevenLabs TTS Integration (AI Engineer owns)

- Called after every complete AI response (not during streaming).
- Voice model selected per persona for tone matching:

| Persona | ElevenLabs Voice | Character |
|---------|-----------------|-----------|
| CALM | `Rachel` or equivalent | Soft, slow, meditative |
| WARM | `Bella` or equivalent | Warm, friendly, gentle |
| DIRECT | `Adam` or equivalent | Clear, confident, measured |

- Audio URL returned to frontend; frontend handles playback.
- If ElevenLabs fails: return `{ audioUrl: null }` — frontend silently skips audio.
- Cache audio for identical responses (Redis optional — only if latency is a problem).

---

## 7. Error Handling

| Error | HTTP Status | Behaviour |
|-------|------------|-----------|
| Unauthenticated | 401 | Redirect to `/auth/signin` |
| Invalid sessionId | 404 | Return error; frontend shows toast |
| Syntra timeout | 504 | Return error; frontend shows retry button |
| ElevenLabs failure | 200 with `audioUrl: null` | Silent fallback — text still shown |
| Rate limit | 429 | Return error with `retryAfter` seconds |

---

## 8. Folder Structure

### `apps/api` (Express)
```
src/
  routes/
    auth.ts          # /api/auth/*
    session.ts       # /api/session/*
    mood.ts          # /api/mood/*
    voice.ts         # /api/voice/* (if STT shipped)
  services/
    SyntraService.ts     # AI Engineer owns
    ElevenLabsService.ts # AI Engineer owns
    WhisperService.ts    # AI Engineer owns (if shipped)
  middleware/
    authGuard.ts     # JWT validation
    errorHandler.ts  # Global error handler
  lib/
    prisma.ts        # Prisma client singleton
    logger.ts        # Pino logger
  index.ts           # Express app entry point
```
