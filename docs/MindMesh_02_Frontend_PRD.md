# 🧠 MindMesh — Frontend PRD
**Next.js 15 Web Application — Hackathon Edition**  
**Version:** 1.0 · May 2026 · Owner: Suprathik , Sri Charan

---

## 1. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 15 (App Router) | SSR, file-based routing, RSC support |
| Language | TypeScript | Type safety across components and API calls |
| Styling | Tailwind CSS + shadcn/ui | Fast, accessible UI without custom CSS overhead |
| State | Zustand | Lightweight global state for session + user data |
| Server State | TanStack Query v5 | Caching and background refetch for API calls |
| Auth | NextAuth.js v5 (Google) | Managed OAuth; session cookies; zero custom auth code |
| AI Streaming | Vercel AI SDK | Stream Syntra responses token-by-token in chat UI |
| Audio Playback | Web Audio API (native) | Play ElevenLabs audio response in browser |
| Deployment | Vercel | Zero-config Next.js deployment |

---

## 2. Page & Route Architecture

| Route | Page | Auth? | Purpose |
|-------|------|-------|---------|
| `/` | Landing Page | No | First impression, pitch, Get Started CTA |
| `/auth/signin` | Sign In | No | Google OAuth button + disclaimer |
| `/onboarding` | Persona Selection | Yes | Pick therapist persona (one-time) |
| `/dashboard` | Dashboard | Yes | Mood check-in prompt + Start Session CTA |
| `/session` | Chat Session | Yes | Core product — chat + voice playback |
| `/session/[id]` | Session Transcript | Yes | Read past session (if F7 shipped) |
| `/settings` | Settings | Yes | Change persona, sign out |

---

## 3. Screen-by-Screen Breakdown

### 3.1 Landing Page `/`

**Goal:** Judge opens the link and understands the product in 5 seconds.

**Components:**
- `Hero` — headline, subheadline, Get Started button
- `FeatureHighlights` — 3 cards: Voice AI, Therapist Personas, Mood Tracking
- `DemoPreview` — static screenshot or short looping demo gif of the chat screen
- `Footer` — disclaimer: "MindMesh is not a replacement for professional therapy."

**Design notes:**
- Deep navy background, teal accents.
- Single CTA above the fold. Nothing else competes with it.
- Mobile responsive — judges may open on phone.

---

### 3.2 Sign In `/auth/signin`

**Components:**
- `GoogleSignInButton` — "Continue with Google" with Google logo
- `DisclaimerText` — "By signing in you agree MindMesh is an AI tool, not a licensed therapist."

---

### 3.3 Persona Selection `/onboarding`

**Goal:** Feel personalized. User makes their first meaningful choice.

**Components:**
- `PersonaCard` × 3 — each shows: persona name, tone description, example phrase the AI might say
- `SelectButton` — confirms choice, saves to DB, redirects to `/dashboard`

**Personas:**
| Name | Tone | Example Phrase |
|------|------|---------------|
| Calm & Grounded | Slow, reassuring | "Let's take a breath together before we begin." |
| Warm & Encouraging | Uplifting, gentle | "I'm really glad you're here today." |
| Direct & Practical | Clear, action-oriented | "Let's figure out what's weighing on you and tackle it." |

---

### 3.4 Dashboard `/dashboard`

**Components:**
- `MoodCheckIn` — shown if no mood log for today. Slider (1–10) + emotion tag chips. Submit saves to DB.
- `StartSessionButton` — large CTA. Disabled until mood check-in is complete.
- `RecentSessions` — simple list of last 3 sessions (date + persona). Only shown if F7 shipped.

---

### 3.5 Chat Session `/session`

**The most important screen. This is the demo.**

**Components:**
- `SessionHeader` — persona name + avatar icon, session timer, End Session button
- `DisclaimerBanner` — "MindMesh is an AI companion, not a licensed therapist." Persistent.
- `ChatWindow` — scrollable message list, auto-scrolls to latest
- `MessageBubble` — two variants: user (right-aligned, teal) and AI (left-aligned, white). AI bubbles render markdown.
- `StreamingIndicator` — animated dots shown while AI is generating response
- `AudioPlayer` — hidden component that plays ElevenLabs audio after stream completes. Shows waveform animation while playing.
- `VoiceToggle` — on/off switch for audio playback. Default: on.
- `ChatInput` — textarea + Send button. `MicButton` if STT is shipped.

**Chat flow (technical):**
1. User types message → hits Send
2. `POST /api/session/message` called
3. Syntra streams text response → tokens appear in `MessageBubble` in real time
4. On stream complete → `POST /api/session/audio` called with full response text
5. ElevenLabs audio URL returned → `AudioPlayer` plays it
6. Input re-enabled

---

### 3.6 Settings `/settings`

**Components:**
- `PersonaSelector` — same 3 cards from onboarding; user can switch
- `SignOutButton`
- `DeleteAccountButton` (low priority — add if time permits)

---

## 4. Component Hierarchy

```
AppShell
├── Sidebar (Dashboard, New Session, History, Settings)
├── TopBar (User avatar, "Need help?" crisis link)
└── [page content]

/session
├── SessionHeader
├── DisclaimerBanner
├── ChatWindow
│   └── MessageBubble[]
│       └── StreamingIndicator (last bubble only, while streaming)
├── AudioPlayer (hidden, controlled)
├── VoiceToggle
└── ChatInput
    ├── Textarea
    ├── SendButton
    └── MicButton (if STT shipped)
```

---

## 5. Authentication Flow

1. Any protected route → redirect to `/auth/signin`
2. Google OAuth via NextAuth → session cookie set
3. New user (no persona set) → `/onboarding`
4. Returning user → `/dashboard`
5. Session expires after 7 days inactivity

---

## 6. Voice Playback Integration

- After every AI response, frontend calls `POST /api/session/audio` with `{ text, persona }`
- Backend returns `{ audioUrl }` from ElevenLabs
- Frontend `AudioPlayer` component fetches and plays the audio
- While audio plays: waveform animation shown on AI message bubble
- `VoiceToggle` state stored in Zustand — persists across page navigation within session
- If ElevenLabs call fails: silent fallback (text still shown, no audio error shown to user)

---

## 7. Performance Targets

| Metric | Target |
|--------|--------|
| Landing page load | < 1.5s |
| Time from Send → first AI token | < 1.5s |
| Time from stream end → audio starts | < 1s |
| Total response time (text + audio) | < 3s (p50) |
| No layout shift during streaming | CLS < 0.1 |

---

## 8. UI Design Principles

- **Calm palette** — deep navy `#1A1A2E`, teal `#4ECDC4`, soft white `#F1FAEE`. No harsh reds.
- **One primary action per screen** — never make the user think about what to do next.
- **Voice first** — audio playback and waveform animation should feel premium, not bolted on.
- **Always show the disclaimer** — non-negotiable. Judges in mental health categories will look for it.
- **Keyboard accessible** — Enter to send message; all actions reachable without mouse.
