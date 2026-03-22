# 🎓 Shiksha AI
### AI-Powered Tutor for Rural India — NCERT Classes 6–12

> **"Quality education shouldn't be a privilege."**
> Shiksha AI brings structured, curriculum-aligned AI tutoring to every student in India — at near-zero cost, on any device, even on slow connections.

---

## 🏆 The Problem We're Solving

| Problem | Reality |
|---|---|
| 💸 Expensive AI tools | ChatGPT costs ₹1,600/month — unaffordable for rural families |
| 📶 Poor connectivity | Heavy AI apps fail on 2G or slow mobile data |
| 📚 Off-curriculum answers | Generic AI ignores NCERT and state board syllabi |
| 👩‍🏫 No teacher oversight | Students need guided, accountable access |

---

## ✨ What Shiksha AI Does

Shiksha AI is a full-stack EdTech platform with two portals — one for **students** and one for **teachers** — built around an AI tutor that answers questions directly from NCERT textbooks.

### For Students
- Ask any question from their textbook in **Hindi or English**
- Get structured answers with **formulas, numbered steps, bullet points**, and a **chapter citation**
- Browse and read **teacher-uploaded PDF textbooks**
- Access is **teacher-gated** — students sign up and wait for approval

### For Teachers
- **Upload PDF textbooks** per class and subject
- **Manage chapters** — define the chapter list that students see
- **Approve or reject** student signup requests
- Full **admin panel** with usage stats and content management

---

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), inline CSS-in-JS |
| Backend | Node.js + Express |
| AI | OpenAI `gpt-4o-mini` via REST API |
| PDF Viewer | PDF.js (CDN) |
| Storage | localStorage (frontend state persistence) |
| Fonts | Sora, DM Serif Display, Noto Sans Devanagari |

---

## 🗂️ Project Structure

```
shiksha-ai/
├── src/
│   └── App.jsx          # Entire React frontend — all components
├── server.js            # Express backend — OpenAI proxy
├── .env                 # API keys (not committed)
├── package.json
└── README.md
```

---

## ⚙️ Setup & Running Locally

### Prerequisites
- Node.js v18+
- An OpenAI API key (`gpt-4o-mini` access)

### 1. Clone and install

```bash
git clone https://github.com/your-username/shiksha-ai.git
cd shiksha-ai
npm install
```

### 2. Create your `.env` file

```bash
# .env
OPENAI_API_KEY=sk-...your-key-here...
PORT=5000
```

### 3. Start the backend

```bash
node server.js
# ✅ Shiksha AI server → http://localhost:5000
```

### 4. Start the frontend (new terminal)

```bash
npm run dev
# → http://localhost:5173
```

### 5. Open in browser

Navigate to `http://localhost:5173`

---

## 🔐 Default Credentials

| Role | Username | Password |
|---|---|---|
| Teacher (root) | `admin` | `shiksha123` |
| Student | Sign up via the app | Teacher must approve |

> Teachers can also create new accounts via the Sign Up tab on the Teacher Portal.

---

## 🧠 How the AI Works

```
Student asks a question
        ↓
Frontend sends: { question, class, subject, language }
        ↓
Express backend receives the request
        ↓
Builds a structured prompt with NCERT system instructions
        ↓
OpenAI gpt-4o-mini generates a formatted answer
        ↓
Response parsed: chapter reference extracted, markdown rendered
        ↓
Student sees: formatted answer + 📖 chapter badge
```

### AI Formatting Rules (enforced via system prompt)
- Begins with a direct one-sentence answer
- `**Bold**` for all key terms
- Numbered steps for processes
- Bullet points for properties/types
- `FORMULA:` prefix for every equation
- Blockquote `>` for definitions
- Ends with `Chapter reference: [chapter name]`
- Real Indian everyday examples included
- Under 300 words per response

---

## 🌐 Bilingual Support

Shiksha AI fully supports **Hindi and English** across the entire interface:

- UI toggles between Hindi (Devanagari) and English at any point
- AI responses switch language automatically based on user preference
- Hindi subjects (Hindi, Sanskrit) always respond in Hindi/Devanagari
- Subject-specific welcome messages are personalised per subject in both languages
- Noto Sans Devanagari font loaded for proper Hindi rendering

---

## 🔑 Key Features

### Student Portal
- ✅ Signup with name, username, password, class selection
- ✅ Approval-gated access (pending → approved → active)
- ✅ Two modes: **Ask Questions** (AI chat) and **View PDFs** (textbook library)
- ✅ AI chat with subject-aware suggestions, history sidebar, in-memory cache
- ✅ Answer cache — repeated questions are answered instantly

### Teacher Portal
- ✅ Login or Sign Up
- ✅ **Students tab** — view pending requests, approve/reject, manage roster
- ✅ **Chapters tab** — define chapter list per class & subject
- ✅ **Upload PDF tab** — upload textbook PDFs chapter by chapter
- ✅ **Textbooks tab** — view all uploaded books, delete entries
- ✅ **Usage Stats tab** — books by subject/class breakdown
- ✅ **Manage Admins tab** — add/remove teacher accounts

### Error Handling
- Backend offline → `⚡ Backend offline — run node server.js`
- Server HTTP error → `🔴 Server error — check OpenAI key or restart`
- Empty response → `⚠️ No response — server returned empty answer`
- All errors show in a toast notification (bottom-right) and in the chat

---

## 📱 Design Principles

- **Mobile-first** — works on small screens and slow connections
- **Low data** — responses under 50KB, smart caching reduces repeat API calls
- **Accessible** — high contrast, readable fonts, keyboard navigation
- **Bilingual by default** — not an afterthought, built into every component
- **Teacher-controlled** — no anonymous access; all students are known and approved

---

## 🗺️ Pages & Flow

```
Landing Page (Role Selection)
├── Student →  Login / Sign Up
│              ├── Pending Approval Screen (if new)
│              └── Student Home
│                  ├── Ask Questions  →  AI Chat Dashboard
│                  └── View PDFs      →  Textbook Library
│
└── Teacher →  Login / Sign Up
               └── Admin Panel
                   ├── Students   (approve/reject)
                   ├── Textbooks  (uploaded books)
                   ├── Chapters   (chapter manager)
                   ├── Upload PDF
                   ├── Usage Stats
                   └── Manage Admins
```

---

## 💡 What Makes This Different

| Feature | Generic AI (ChatGPT etc.) | Shiksha AI |
|---|---|---|
| Curriculum alignment | ❌ Generic answers | ✅ NCERT-specific |
| Cost | ❌ ₹1,600/month | ✅ ~₹0.01 per query |
| Hindi support | ⚠️ Partial | ✅ Full bilingual |
| Teacher oversight | ❌ None | ✅ Approval + management |
| Formula rendering | ❌ Plain text | ✅ Styled formula blocks |
| Chapter citation | ❌ No source | ✅ Every answer cites chapter |
| Offline-resilient | ❌ Fails silently | ✅ Clear error messages |
| Data usage | ❌ Heavy | ✅ Minimal, cached |

---

## 🚀 Future Scope

- [ ] PostgreSQL / MongoDB backend for multi-device persistence
- [ ] Vector database (Pinecone / FAISS) for true RAG over uploaded PDFs
- [ ] Voice input support for students with low literacy
- [ ] SMS-based query support for feature phones (no smartphone needed)
- [ ] School/institution multi-tenancy
- [ ] Performance analytics dashboard for teachers
- [ ] Offline PWA mode with service workers

---

## 👨‍💻 Built With

- [React](https://react.dev/) — UI framework
- [Vite](https://vitejs.dev/) — build tool
- [Express](https://expressjs.com/) — backend server
- [OpenAI API](https://platform.openai.com/) — AI responses
- [PDF.js](https://mozilla.github.io/pdf.js/) — in-browser PDF rendering
- [Google Fonts](https://fonts.google.com/) — Sora, DM Serif Display, Noto Sans Devanagari

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

*Built with ❤️ for rural India · Shiksha AI © 2025*
