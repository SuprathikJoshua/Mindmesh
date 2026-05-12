# MindMesh

## Backend PRD — Version 1.0

**Product Requirements Document · AI Therapy Engine · Backend Engineering Spec**

> **Author:** Suprathik Joshua · IIIT Lucknow
> **Stack:** Express 5 + TypeScript + Bun + Prisma + Supabase (Postgres) + Supabase Auth + Syntra LLM API
> **Status:** Ready for Development
> **Target:** Ship MVP for Syntra Hackathon Submission

---

## Document Meta

| Field         | Value                                                                                   |
| ------------- | --------------------------------------------------------------------------------------- |
| Document Type | PRD — Backend                                                                           |
| Version       | V1.0 — AI Therapy Chat Engine                                                           |
| Scope         | All API endpoints, business logic, DB schema, session management, and AI integration    |
| Out of Scope  | Frontend UI, components — see Frontend PRD                                              |
| API Contract  | All endpoints conform to this spec. Frontend PRD depends on these contracts.            |
| Runtime       | Bun 1.x — drop-in Node.js replacement, faster startup, built-in TypeScript             |
| Core Rule     | **No LLM prompt or system context is ever accepted from the client. Always server-built.** |

---

## Infrastructure — What Each Service Does

| Service              | What It Does                                                                            | What It Does NOT Do                           |
| -------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Supabase (Postgres)** | Stores ALL data permanently — users, sessions, messages, mood check-ins, summaries   | Nothing else                                  |
| **Prisma ORM**       | Type-safe interface to Supabase Postgres — all DB queries go through Prisma             | Never bypassed with raw SQL                   |
| **Supabase Auth**    | Issues JWTs on Google OAuth login · validates sessions · Row Level Security on tables   | Does NOT store your app data                  |
| **Syntra LLM API**   | Powers AI therapy chat responses and session summary generation                         | Does NOT store conversation history itself    |
| **Express 5**        | Hosts all REST API routes as server functions                                           | Does NOT serve frontend pages                 |

**The flow in plain English:**

> User starts session → Mood check-in logged → User sends message → Express builds context from DB history → Syntra LLM responds → Message saved to DB → On session end → LLM generates summary → Summary saved

---

## System Architecture

```
HTTP Request
    ↓
Express 5 Router (/api/*)
    ↓
Zod validation  →  reject 422 if invalid
    ↓
Supabase Auth   →  reject 401 if no valid JWT
    ↓
Business Logic + Prisma queries
    ↓
Supabase Postgres — persistent storage
    ↓
Syntra LLM API call (on chat/summary routes)
    ↓
Save LLM response to DB
    ↓
200 response to client
```

---

## Database Schema — V1 (4 Models)

> ⚠️ **RULE 1:** All AI responses are stored as-is — never truncated. They are the source of truth for session history rebuilt into LLM context.
>
> ⚠️ **RULE 2:** Session `status` is either `ACTIVE` or `ENDED`. Ended sessions are immutable — no new messages appended.

### What Each Table Stores

| Table          | What It Stores                                                       | One Row =                         |
| -------------- | -------------------------------------------------------------------- | --------------------------------- |
| `User`         | Every registered user, linked to Supabase Auth                       | One person                        |
| `Session`      | Each therapy conversation — has a status, summary, mood context      | One therapy conversation          |
| `Message`      | Every message sent by user or AI inside a session                    | One chat turn                     |
| `MoodCheckin`  | Mood score + optional note logged before each session begins         | One mood entry                    |

### Who Can See What

| Table         | User sees                                           | Other users see |
| ------------- | --------------------------------------------------- | --------------- |
| `User`        | Own profile only                                    | Nothing         |
| `Session`     | Own sessions (list + detail)                        | Nothing         |
| `Message`     | Own messages inside own sessions                    | Nothing         |
| `MoodCheckin` | Own check-ins + mood history                        | Nothing         |

> **Row Level Security (RLS)** enforced at Postgres level via Supabase Auth. All tables have `userId = auth.uid()` policies.

### Full Prisma Schema

```prisma
// /prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // Supabase connection string
}

enum SessionStatus {
  ACTIVE
  ENDED
}

enum MessageRole {
  USER
  ASSISTANT
}

model User {
  id          String       @id @default(uuid())
  supabaseId  String       @unique  // Supabase Auth user id
  email       String       @unique
  name        String
  avatarUrl   String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  sessions    Session[]
  moodCheckins MoodCheckin[]
}

model Session {
  id          String        @id @default(uuid())
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  title       String?       // Auto-generated from first message
  status      SessionStatus @default(ACTIVE)
  summary     String?       // LLM-generated after session ends
  startedAt   DateTime      @default(now())
  endedAt     DateTime?

  messages    Message[]
  moodCheckin MoodCheckin?
}

model Message {
  id        String      @id @default(uuid())
  sessionId String
  session   Session     @relation(fields: [sessionId], references: [id])
  role      MessageRole
  content   String
  createdAt DateTime    @default(now())
}

model MoodCheckin {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  sessionId String   @unique
  session   Session  @relation(fields: [sessionId], references: [id])
  score     Int      // 1–5 scale
  note      String?  // optional free text
  createdAt DateTime @default(now())
}
```

---

## API Endpoints — V1 (14 Endpoints)

### AUTH — `/api/auth`

#### `GET /api/auth/google`
Redirects user to Google OAuth consent screen via Supabase Auth.

**Response:** `302 Redirect → Google OAuth URL`

---

#### `GET /api/auth/callback`
Supabase OAuth callback. Exchanges code for session. Upserts user in DB. Returns JWT.

**Response:**
```json
{
  "token": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "name": "Suprathik",
    "avatarUrl": "https://..."
  }
}
```

**Logic:**
1. Exchange OAuth code for Supabase session
2. Extract user info from Supabase Auth
3. `upsert` User row by `supabaseId` — safe for new and returning users
4. Return JWT + user object

---

#### `POST /api/auth/logout`
Invalidates Supabase session server-side.

**Auth Required:** Yes

**Response:** `{ "success": true }`

---

#### `GET /api/auth/me`
Returns the currently authenticated user's profile.

**Auth Required:** Yes

**Response:**
```json
{
  "id": "uuid",
  "email": "user@gmail.com",
  "name": "Suprathik",
  "avatarUrl": "https://...",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

### MOOD — `/api/mood`

#### `GET /api/mood/history`
Returns all mood check-ins for the authenticated user, ordered newest first.

**Auth Required:** Yes

**Response:**
```json
{
  "checkins": [
    {
      "id": "uuid",
      "score": 3,
      "note": "Feeling a bit anxious today",
      "createdAt": "2025-01-01T00:00:00Z",
      "sessionId": "uuid"
    }
  ]
}
```

---

### SESSIONS — `/api/sessions`

#### `POST /api/sessions`
Creates a new therapy session. Requires a mood check-in payload.

**Auth Required:** Yes

**Request Body (Zod validated):**
```json
{
  "moodScore": 3,
  "moodNote": "Feeling anxious about exams"
}
```

**Validation Rules:**
- `moodScore` — integer, 1–5 inclusive, required
- `moodNote` — string, max 500 chars, optional

**Response:**
```json
{
  "session": {
    "id": "uuid",
    "status": "ACTIVE",
    "startedAt": "2025-01-01T00:00:00Z",
    "moodCheckin": {
      "score": 3,
      "note": "Feeling anxious about exams"
    }
  }
}
```

**Logic:**
1. Validate body with Zod
2. Create `Session` row with `status: ACTIVE`
3. Create `MoodCheckin` row linked to session
4. Return session object

---

#### `GET /api/sessions`
Lists all sessions for the authenticated user, ordered newest first.

**Auth Required:** Yes

**Response:**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "title": "Dealing with exam stress",
      "status": "ENDED",
      "summary": "User expressed anxiety...",
      "startedAt": "2025-01-01T00:00:00Z",
      "endedAt": "2025-01-01T01:00:00Z",
      "moodCheckin": { "score": 3 },
      "messageCount": 12
    }
  ]
}
```

---

#### `GET /api/sessions/:id`
Returns full session detail including all messages and mood check-in.

**Auth Required:** Yes

**Response:**
```json
{
  "session": {
    "id": "uuid",
    "title": "Dealing with exam stress",
    "status": "ACTIVE",
    "startedAt": "2025-01-01T00:00:00Z",
    "moodCheckin": { "score": 3, "note": "Anxious" },
    "messages": [
      { "id": "uuid", "role": "USER", "content": "I feel overwhelmed", "createdAt": "..." },
      { "id": "uuid", "role": "ASSISTANT", "content": "I hear you...", "createdAt": "..." }
    ],
    "summary": null
  }
}
```

**Guard:** If `session.userId !== auth.userId` → 403 FORBIDDEN

---

#### `POST /api/sessions/:id/end`
Ends an active session and triggers LLM summary generation.

**Auth Required:** Yes

**Response:**
```json
{
  "session": {
    "id": "uuid",
    "status": "ENDED",
    "endedAt": "2025-01-01T01:00:00Z",
    "summary": "In this session, the user shared feelings of anxiety..."
  }
}
```

**Logic:**
1. Verify session belongs to user
2. Guard: if `status === ENDED` → 400 SESSION_ALREADY_ENDED
3. Fetch all messages from DB
4. Build summary prompt (see LLM Integration section)
5. Call Syntra LLM API → receive summary text
6. Update session: `status = ENDED`, `endedAt = now()`, `summary = llmResponse`
7. Return updated session

---

### CHAT — `/api/sessions/:id/messages`

#### `GET /api/sessions/:id/messages`
Returns all messages in a session.

**Auth Required:** Yes

**Response:**
```json
{
  "messages": [
    { "id": "uuid", "role": "USER", "content": "...", "createdAt": "..." },
    { "id": "uuid", "role": "ASSISTANT", "content": "...", "createdAt": "..." }
  ]
}
```

---

#### `POST /api/sessions/:id/messages`
Sends a user message and returns the AI response. Core chat endpoint.

**Auth Required:** Yes

**Request Body:**
```json
{
  "content": "I've been feeling really overwhelmed lately"
}
```

**Validation Rules:**
- `content` — string, 1–2000 chars, required, trimmed

**Response:**
```json
{
  "userMessage": {
    "id": "uuid",
    "role": "USER",
    "content": "I've been feeling really overwhelmed lately",
    "createdAt": "..."
  },
  "assistantMessage": {
    "id": "uuid",
    "role": "ASSISTANT",
    "content": "It sounds like you're carrying a lot right now...",
    "createdAt": "..."
  }
}
```

**Logic:**
1. Validate body
2. Verify session belongs to user and `status === ACTIVE` (else 400 SESSION_ENDED)
3. Save user message to DB
4. Fetch full message history from DB (for LLM context)
5. Fetch user mood check-in for this session
6. Build full prompt (see LLM Integration section)
7. Call Syntra LLM API → receive assistant response
8. Save assistant message to DB
9. If this is message #1 from USER: auto-generate session title from content (truncate to 60 chars)
10. Return both messages

---

## LLM Integration — Syntra API

> ⚠️ **CRITICAL:** The system prompt is ALWAYS built server-side. The client never influences the system context.

### System Prompt Template

```
You are MindMesh, a compassionate and evidence-informed AI mental health companion.
Your role is to provide emotional support through empathetic, non-judgmental conversation.

User Context:
- Name: {userName}
- Mood before this session: {moodScore}/5 ({moodLabel})
- Mood note: "{moodNote}"

Guidelines:
- Always validate the user's feelings before offering coping strategies
- Use CBT-informed language — challenge negative thought patterns gently
- Suggest breathing exercises or grounding techniques when appropriate
- If the user expresses crisis-level distress (self-harm, suicidal ideation), immediately provide crisis resources:
  iCall: 9152987821 | Vandrevala Foundation: 1860-2662-345
- Keep responses under 200 words unless depth is clearly needed
- Never diagnose. Never claim to replace professional therapy.
- End each response with a single open-ended follow-up question.
```

### Mood Label Mapping

| Score | Label         |
| ----- | ------------- |
| 1     | Very low      |
| 2     | Low           |
| 3     | Moderate      |
| 4     | Good          |
| 5     | Excellent     |

### Chat Context Construction

```typescript
const messages = [
  { role: "system", content: buildSystemPrompt(user, moodCheckin) },
  ...sessionMessages.map(m => ({
    role: m.role === "USER" ? "user" : "assistant",
    content: m.content
  })),
  { role: "user", content: newUserMessage }
]
```

**Context window rule:** Send last 20 messages maximum. Oldest messages trimmed first. System prompt always included.

### Summary Prompt Template

```
The following is a completed therapy chat session. 
Generate a concise 3–5 sentence session summary that captures:
1. The main emotional themes the user expressed
2. Key coping strategies or insights discussed
3. The user's emotional trajectory through the session

Format: Plain paragraph. No bullet points. Empathetic and clinical tone.
Write from a third-person perspective.

Session transcript:
{formattedTranscript}
```

---

## Middleware Stack

```typescript
// Applied globally on all routes
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
app.use(express.json({ limit: '50kb' }))
app.use(helmet())

// Applied on all /api/* routes except /api/auth/*
app.use('/api', authMiddleware)
```

### `authMiddleware`
1. Extract Bearer token from `Authorization` header
2. Verify JWT with Supabase Auth SDK
3. Attach `req.user = { id, supabaseId, email }` to request
4. On failure → 401 UNAUTHENTICATED

### `validateBody(schema: ZodSchema)`
Route-level middleware. Validates `req.body` against schema. On failure → 422 with field errors.

---

## Environment Variables

```env
# .env.example

DATABASE_URL=                  # Supabase Postgres connection string
SUPABASE_URL=                  # Supabase project URL
SUPABASE_ANON_KEY=             # Supabase anon key (public)
SUPABASE_SERVICE_ROLE_KEY=     # Supabase service role key (private — server only)
SYNTRA_API_KEY=                # Syntra LLM API key
SYNTRA_API_BASE_URL=           # Syntra LLM API base URL
SYNTRA_MODEL=                  # Model identifier from Syntra
FRONTEND_URL=                  # e.g. http://localhost:3000
PORT=8080
```

---

## API Error Codes

| HTTP  | Code                    | Meaning                                              | What Client Should Do                  |
| ----- | ----------------------- | ---------------------------------------------------- | -------------------------------------- |
| `400` | `SESSION_ENDED`         | Cannot send message to an ended session              | Redirect to session history            |
| `400` | `SESSION_ALREADY_ENDED` | Session already ended — cannot end again             | Show toast, refresh session state      |
| `400` | `INVALID_MOOD_SCORE`    | Score not between 1 and 5                            | Show inline form error                 |
| `400` | `MESSAGE_TOO_LONG`      | Message exceeds 2000 chars                           | Show character counter error           |
| `401` | `UNAUTHENTICATED`       | Missing or invalid JWT                               | Redirect to `/login`                   |
| `403` | `FORBIDDEN`             | Session belongs to another user                      | Redirect to `/sessions`                |
| `404` | `SESSION_NOT_FOUND`     | Session ID does not exist                            | Redirect to `/sessions`                |
| `422` | `VALIDATION_ERROR`      | Zod schema failed — details in `errors` field        | Show which fields failed               |
| `502` | `LLM_ERROR`             | Syntra LLM API failed or timed out                   | Show "AI is unavailable" toast, retry  |
| `500` | `INTERNAL_ERROR`        | Unexpected server error                              | Show generic error toast               |

---

## V1 Acceptance Criteria

### Functional Test Cases

| Test                                                     | Expected                                           | Type        |
| -------------------------------------------------------- | -------------------------------------------------- | ----------- |
| Google OAuth flow completes and returns JWT              | User upserted in DB, token returned                | Integration |
| New session created with mood score 3                    | Session + MoodCheckin rows in DB                   | Integration |
| Send message to ACTIVE session                           | User + assistant messages saved, AI response returned | Integration |
| Send message to ENDED session                            | Returns 400 SESSION_ENDED                          | Integration |
| End session with 5 messages                             | Status = ENDED, summary generated and stored       | Integration |
| Access session belonging to another user                 | Returns 403 FORBIDDEN                              | Integration |
| `moodScore = 6` on session creation                      | Returns 422 VALIDATION_ERROR                       | Unit        |
| Message body over 2000 chars                            | Returns 422 with MESSAGE_TOO_LONG                  | Unit        |
| Context window with 25 messages                         | Only last 20 sent to LLM                           | Unit        |
| System prompt never contains client-injected content     | No `req.body` fields appear in system prompt       | Unit        |
| GET /api/mood/history returns only own check-ins         | No cross-user data leakage                         | Integration |
| First user message auto-sets session title               | Title = first 60 chars of message                  | Integration |

### Performance Targets

| Endpoint                        | Target (p99)              |
| ------------------------------- | ------------------------- |
| `POST /api/sessions/:id/messages` | < 5s (LLM-bound)        |
| `POST /api/sessions/:id/end`    | < 8s (summary LLM call)  |
| `GET /api/sessions`             | < 150ms                   |
| `GET /api/sessions/:id`         | < 200ms                   |
| `GET /api/mood/history`         | < 100ms                   |

### Infrastructure Checklist

- [ ] All Prisma migrations apply cleanly on a fresh Supabase project
- [ ] `.env.example` documents all required variables
- [ ] `GET /api/health` returns `{ db: 'ok', llm: 'ok' }`
- [ ] No API keys committed to source
- [ ] `tsc --noEmit` passes with zero errors
- [ ] RLS policies enabled on all Supabase tables
- [ ] CORS restricted to `FRONTEND_URL` only
- [ ] Crisis resource strings are hardcoded in system prompt — not from DB

---

_Backend V1 PRD · 14 endpoints · 4 DB models · Syntra LLM integration · Persistent session memory · Crisis detection guardrails_
