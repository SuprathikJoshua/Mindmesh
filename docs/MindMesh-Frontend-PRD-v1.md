# MindMesh

## Frontend PRD — Version 1.0

**Product Requirements Document · AI Therapy Chat · Frontend Engineering Spec**

> **Author:** Suprathik Joshua · IIIT Lucknow
> **Stack:** Next.js 15 + TypeScript + Bun + Tailwind CSS + shadcn/ui
> **Status:** Ready for Development
> **Target:** Ship MVP for Syntra Hackathon Submission

---

## Document Meta

| Field           | Value                                                                              |
| --------------- | ---------------------------------------------------------------------------------- |
| Document Type   | PRD — Frontend                                                                     |
| Version         | V1.0 — AI Therapy Chat                                                             |
| Scope           | All frontend UI, components, screens, and client-side logic for V1                 |
| Out of Scope    | Backend API, database schema — see Backend PRD                                     |
| Dependencies    | Backend V1 API endpoints must be live for integration testing                      |
| Target Devices  | Desktop (1280px+) primary · Tablet (768px+) supported · Mobile in V2              |
| Browser Support | Chrome 120+ · Firefox 120+ · Safari 17+ · Edge 120+                                |
| Accessibility   | WCAG 2.1 AA — keyboard navigable, screen reader labels on all interactive elements |

---

## How the App Works (Frontend Perspective)

Before building any screen, understand the core flow the frontend must support:

1. User lands on `/` → sees landing page → clicks "Get Started"
2. User signs in with Google → redirected to `/dashboard`
3. User clicks "New Session" → **Mood Check-in Modal** appears (score 1–5 + optional note)
4. Mood submitted → new session created → user enters `/session/:id` chat screen
5. User types message → AI responds in real-time → conversation continues
6. User clicks "End Session" → AI generates summary → shown inline
7. User returns to `/dashboard` → sees past sessions list with summaries + mood history

The frontend's job is to make this feel **calm, safe, and frictionless**.

---

## Infrastructure Clarity

| Service             | What the Frontend Uses It For                                              |
| ------------------- | -------------------------------------------------------------------------- |
| **Supabase Auth**   | `signInWithOAuth({ provider: 'google' })`, `getSession()`, `onAuthStateChange()` |
| **Express Backend** | All data fetching via `/api/*` — sessions, messages, mood, auth            |
| **Supabase Postgres** | Never touched directly from frontend                                     |

The frontend **never calls the LLM directly**. All AI interaction flows through the Express backend.

---

## User Stories — V1

| As a...          | I want to...                                              | So that...                                              |
| ---------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| New User         | sign in with Google in one click                          | I don't have to fill a registration form                |
| New User         | log my mood before a session starts                       | The AI understands how I'm feeling from the first reply |
| User             | have a calm, focused chat interface with the AI           | I can express myself without distractions               |
| User             | see a summary of my session after I end it                | I can reflect on what was discussed                     |
| User             | see all my past sessions on my dashboard                  | I can track my emotional journey over time              |
| User             | see my mood history at a glance                           | I understand my emotional patterns                      |
| Returning User   | land on dashboard and continue where I left off           | I don't lose context from past sessions                 |

---

## Screen-by-Screen Requirements

### FE-LAND — Landing Page

> **Route:** `/` — Public. Redirects to `/dashboard` if already authenticated.

| ID   | Feature              | Description                                                                                                              | Acceptance Criteria                                                       | Priority |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------- |
| L-01 | Hero Section         | App name, tagline ("Your AI-powered mental health companion"), and a single "Get Started" CTA button.                    | CTA redirects to Google OAuth. No other links required for MVP.           | P0       |
| L-02 | Feature Highlights   | 3 cards: "AI-powered sessions", "Mood tracking", "Session summaries". Icons + one-line description each.                 | Static. No animations required for MVP.                                   | P1       |
| L-03 | Auth Redirect Guard  | If user already has valid session, redirect from `/` to `/dashboard` immediately.                                        | No flash of landing content for authenticated users.                      | P0       |
| L-04 | Google Sign-In       | "Continue with Google" button triggers Supabase `signInWithOAuth`. Handles redirect flow.                                | On success: redirect to `/dashboard`. On failure: show toast error.       | P0       |

---

### FE-AUTH — Authentication

> **Route:** `/auth/callback` — Supabase OAuth callback handler. Not a visible page.

| ID   | Feature              | Description                                                                                                              | Acceptance Criteria                                                       | Priority |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------- |
| A-01 | OAuth Callback       | Next.js route that exchanges Supabase code for session. Calls `POST /api/auth/callback` equivalent. Redirects to `/dashboard`. | Works on first login (user created) and return login (user exists).  | P0       |
| A-02 | Protected Route Guard | Next.js middleware redirects unauthenticated users from `/dashboard/*` and `/session/*` to `/`.                         | Direct URL access `/dashboard` → redirect to `/`.                         | P0       |
| A-03 | Auth Loading State   | Full-screen centered spinner shown while auth state is being determined on first load.                                   | No flash of unauthenticated content.                                      | P0       |

---

### FE-DASH — Dashboard

> **Route:** `/dashboard` — First screen after login. Shows session history and mood overview.

| ID   | Feature              | Description                                                                                                              | Acceptance Criteria                                                       | Priority |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------- |
| D-01 | Header               | App logo + user avatar (from Google) + name + "Sign Out" button.                                                        | Avatar loads from Google URL. Sign out calls logout API + redirects to `/`. | P0     |
| D-02 | New Session Button   | Prominent "Start New Session" button. Opens Mood Check-in Modal.                                                         | Keyboard accessible. Disabled state shown while modal is loading.         | P0       |
| D-03 | Mood History Strip   | Horizontal row of last 7 mood check-in scores as colored circles (1=red → 5=green). Hover shows date + note.            | Renders correctly with 0, 1, or 7+ check-ins. Graceful empty state.      | P1       |
| D-04 | Sessions List        | List of all past sessions, newest first. Each row: title, date, mood score chip, status badge, summary preview (2 lines). | Shows "No sessions yet" empty state with CTA. Skeleton on load.          | P0       |
| D-05 | Session Row Click    | Clicking a session row navigates to `/session/:id`.                                                                      | Works for both ACTIVE and ENDED sessions.                                 | P0       |
| D-06 | Active Session Badge | If an ACTIVE session exists, show a persistent banner: "You have an ongoing session — Continue".                         | Banner links directly to the active session. One active session max.      | P1       |
| D-07 | Skeleton Loading     | Sessions list and mood strip show pulsing skeletons while data loads.                                                    | No layout shift when data replaces skeletons.                             | P1       |

---

### FE-MOOD — Mood Check-in Modal

> **Triggered from:** "Start New Session" button on Dashboard. Not a separate route — rendered as a modal overlay.

| ID   | Feature              | Description                                                                                                              | Acceptance Criteria                                                       | Priority |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------- |
| M-01 | Mood Score Selector  | 5 large emoji/icon buttons representing mood 1–5. Selected state highlighted. Labels: "Very Low", "Low", "Moderate", "Good", "Excellent". | One selection required before submit. Cannot submit unselected. | P0       |
| M-02 | Optional Note Input  | Textarea — "Anything you'd like to share before we begin?" Max 500 chars. Character counter shown.                       | Optional — submit works without note. Trims whitespace.                   | P0       |
| M-03 | Submit Button        | "Begin Session" button. Calls `POST /api/sessions`. On success: navigate to `/session/:id`.                              | Shows spinner while loading. Disabled on submit. Error toast on failure.  | P0       |
| M-04 | Close / Cancel       | X button or Escape key closes modal without creating a session.                                                          | Focus returns to "New Session" button after close.                        | P1       |

---

### FE-CHAT — Session Chat Screen

> **Route:** `/session/:id` — The core therapy interaction screen.

| ID   | Feature              | Description                                                                                                              | Acceptance Criteria                                                       | Priority |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------- |
| C-01 | Chat Header          | Session title (or "New Session" until AI generates one) + mood chip (score + label) + "End Session" button.             | Title updates after first message exchange without page refresh.          | P0       |
| C-02 | Message Thread       | Scrollable list of messages. USER messages right-aligned, ASSISTANT messages left-aligned. Each shows timestamp.        | Auto-scrolls to newest message. Max visible messages before scroll: natural. | P0    |
| C-03 | AI Message Bubble    | Distinct styling — soft background, avatar icon (MindMesh logo). Markdown rendering for bold/italic/lists.               | No raw markdown shown. Renders `**bold**`, `- list`, etc. correctly.     | P0       |
| C-04 | User Message Bubble  | Right-aligned, user's Google avatar thumbnail. Plain text (no markdown).                                                 | Avatar matches header avatar.                                             | P0       |
| C-05 | Typing Indicator     | Animated "..." bubble shown while AI response is loading.                                                                | Appears immediately after user sends. Disappears when response arrives.   | P0       |
| C-06 | Message Input        | Textarea at bottom. Enter sends (Shift+Enter for newline). Send button. Max 2000 chars with counter.                     | Disabled while AI is responding. Clears after send.                       | P0       |
| C-07 | End Session Button   | Calls `POST /api/sessions/:id/end`. Shows loading state. On success: transitions to Summary View below.                  | Confirmation prompt before ending: "Are you sure you want to end this session?" | P0  |
| C-08 | Ended Session State  | If `session.status === ENDED`: input disabled, "Session Ended" chip, summary shown below messages.                      | Clearly communicates session is read-only.                                | P0       |
| C-09 | Session Summary      | After ending, summary card appears below the chat thread. Title: "Session Summary". Full summary text. Subtle card style. | Fades in after summary is received from API.                             | P0       |
| C-10 | Crisis Resources     | If AI response contains crisis hotline numbers (parsed by keyword), render them in a highlighted callout box.            | Never hidden. High contrast. Accessible via screen reader.                | P0       |
| C-11 | Back to Dashboard    | Arrow/back link in header → navigates to `/dashboard`.                                                                   | Works at all times, including mid-session.                                | P1       |
| C-12 | Load Existing Session | On mount: `GET /api/sessions/:id` to hydrate all existing messages. Scroll to bottom after load.                        | Past messages visible immediately. No blank flash.                        | P0       |

---

## Component Architecture

| Component            | File Path                          | Key Props           | Local State           | API Dependency                      |
| -------------------- | ---------------------------------- | ------------------- | --------------------- | ----------------------------------- |
| `LandingPage`        | `/app/page.tsx`                    | —                   | —                     | Supabase Auth (session check)       |
| `GoogleSignInBtn`    | `/components/auth/GoogleSignIn.tsx`| —                   | loading               | `supabase.auth.signInWithOAuth`     |
| `Dashboard`          | `/app/dashboard/page.tsx`          | —                   | —                     | `GET /api/sessions`, `GET /api/mood/history` |
| `SessionCard`        | `/dashboard/SessionCard.tsx`       | session             | —                     | none                                |
| `MoodStrip`          | `/dashboard/MoodStrip.tsx`         | checkins[]          | hoveredId             | none                                |
| `MoodCheckinModal`   | `/components/MoodCheckinModal.tsx` | onSuccess, onClose  | score, note, loading  | `POST /api/sessions`                |
| `MoodScoreSelector`  | `/components/MoodScoreSelector.tsx`| value, onChange     | —                     | none                                |
| `SessionPage`        | `/app/session/[id]/page.tsx`       | params.id           | —                     | `GET /api/sessions/:id`             |
| `ChatThread`         | `/session/ChatThread.tsx`          | messages[]          | —                     | none                                |
| `MessageBubble`      | `/session/MessageBubble.tsx`       | message, role       | —                     | none                                |
| `TypingIndicator`    | `/session/TypingIndicator.tsx`     | visible             | —                     | none                                |
| `MessageInput`       | `/session/MessageInput.tsx`        | sessionId, disabled | content, loading      | `POST /api/sessions/:id/messages`   |
| `SessionSummary`     | `/session/SessionSummary.tsx`      | summary             | —                     | none                                |
| `CrisisCallout`      | `/session/CrisisCallout.tsx`       | resources[]         | —                     | none                                |

---

## State Management & Data Flow

### React Query — Server State

| Query Key                    | Stale Time | Invalidated After          |
| ---------------------------- | ---------- | -------------------------- |
| `['sessions']`               | 60s        | New session created, session ended |
| `['session', id]`            | 30s        | New message sent, session ended |
| `['mood', 'history']`        | 5min       | New session created        |

### Client State — `useState`

- **Mood modal** — `score`, `note`, `isOpen`, `loading` — local to modal component
- **Message input** — `content`, `isSending` — local to `MessageInput`
- **Typing indicator** — `isTyping` — local to `SessionPage`, set true on send, false on response
- **End session confirm** — `showConfirm` — local to `SessionPage`

### Auth State — Supabase

- `useSession()` custom hook wraps `supabase.auth.getSession()` + `onAuthStateChange()`
- Session token stored in Supabase's own storage — never manually managed
- All API calls include `Authorization: Bearer {token}` header automatically via Axios interceptor

### Data Flow — Sending a Message

```
User types → clicks Send
    ↓
MessageInput sets isSending = true
    ↓
POST /api/sessions/:id/messages { content }
    ↓
TypingIndicator shown (isTyping = true)
    ↓
Response received → { userMessage, assistantMessage }
    ↓
React Query cache for ['session', id] updated directly (no refetch)
    ↓
isTyping = false, isSending = false
    ↓
ChatThread auto-scrolls to bottom
```

---

## Design Tokens

```css
:root {
  --color-bg: #0f1117;              /* deep dark background */
  --color-surface: #1a1d27;         /* cards, panels, modals */
  --color-surface-raised: #222636;  /* elevated elements */
  --color-border: #2e3347;          /* borders and dividers */
  --color-primary: #6c8ef7;         /* primary blue — calm, trustworthy */
  --color-primary-hover: #5a7af5;
  --color-success: #4ade80;         /* mood 5, positive indicators */
  --color-warning: #facc15;         /* mood 3, neutral */
  --color-danger: #f87171;          /* mood 1, low mood, errors */
  --color-text-primary: #e8eaf0;    /* headings, body text */
  --color-text-muted: #6b7280;      /* timestamps, secondary */
  --color-user-bubble: #2d3a5e;     /* user chat bubble */
  --color-ai-bubble: #1e2535;       /* AI chat bubble */
  --font-sans: "Inter";             /* all UI text */
  --radius-card: 12px;
  --radius-btn: 8px;
  --radius-bubble: 16px;
  --transition-base: 200ms ease;
}
```

### Mood Score Color Map

| Score | Color                  | Hex       |
| ----- | ---------------------- | --------- |
| 1     | Danger red             | `#f87171` |
| 2     | Soft orange            | `#fb923c` |
| 3     | Neutral yellow         | `#facc15` |
| 4     | Calm teal              | `#34d399` |
| 5     | Success green          | `#4ade80` |

---

## Error Handling Standards

| Error                  | Where It Shows               | Message Copy                                              |
| ---------------------- | ---------------------------- | --------------------------------------------------------- |
| Google OAuth failure   | Toast — top right            | "Sign-in failed. Please try again."                       |
| Network error          | Toast — top right            | "Connection issue. Please try again."                     |
| Session not found      | Full-page error state        | "This session doesn't exist."                             |
| AI response failure    | Inline below input           | "MindMesh is unavailable right now. Try again in a moment." |
| Session already ended  | Inline in chat header        | "This session has ended. Start a new one from dashboard." |
| Message too long       | Inline below input           | "Message too long. Keep it under 2000 characters."        |
| Mood score required    | Inline below mood selector   | "Please select how you're feeling."                       |
| Session expired        | Redirect to `/` + toast      | "Session expired. Please sign in again."                  |

---

## V1 Acceptance Criteria

### Functional — all P0 must pass before V1 ships

- [ ] New user can complete Google sign-in and reach dashboard in under 30 seconds
- [ ] Mood check-in modal submits and navigates to session without page reload
- [ ] AI responds to every user message within 10 seconds
- [ ] Typing indicator shows while AI is responding
- [ ] Ending a session generates and displays summary inline
- [ ] Past sessions are visible on dashboard with title, date, and mood score
- [ ] Returning to an ended session shows full message history + summary (read-only)
- [ ] Crisis hotline numbers render in highlighted callout when present in AI response
- [ ] All error messages are human-readable — no raw API errors ever shown
- [ ] Sign-out clears auth state and redirects to landing page

### Non-Functional

- [ ] Lighthouse Performance ≥ 80 on `/dashboard`
- [ ] Time to Interactive < 3s on simulated 4G
- [ ] `tsc --noEmit` passes with zero errors
- [ ] No console errors in Chrome DevTools on any screen
- [ ] All interactive elements reachable by Tab key
- [ ] No layout overflow at 1280px, 1024px, 768px
- [ ] Chat screen does not cause layout shift on message receive

---

_Frontend V1 PRD · 5 screens · 34 requirements · 14 components · Next.js 15 + TypeScript + Tailwind + shadcn/ui_
