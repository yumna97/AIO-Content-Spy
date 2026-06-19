# Content Intelligence Engine — AIO

Find what competitors publish. Build what they missed.

---

## What it does

1. Scans competitor websites (Toast, Square, etc.) using AI + web search
2. Maps content gaps against AIO's six product pillars
3. Flags quick wins — low effort, high search volume opportunities
4. Generates full SEO content across 6 channels: Blog, LinkedIn, X, Email, Video Script, Ad Copy
5. Every blog/LinkedIn post searches the web for current data before writing

---

## Deploy to Vercel in ~10 minutes

### Step 1 — Get your Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Click **API Keys** → **Create Key**
3. Copy the key (starts with `sk-ant-...`)
4. Add some credits if your account is new (Settings → Billing)

### Step 2 — Push to GitHub

1. Create a new repo on [github.com](https://github.com) — call it `content-intelligence-engine`
2. Upload this folder's contents to it (drag and drop into the GitHub UI, or use git)

```bash
# Or from terminal:
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/YOUR_USERNAME/content-intelligence-engine.git
git push -u origin main
```

### Step 3 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account
2. Click **Add New Project**
3. Select your `content-intelligence-engine` repo
4. Click **Deploy** — Vercel auto-detects Next.js, no config needed

### Step 4 — Add your API key

1. In Vercel dashboard → your project → **Settings** → **Environment Variables**
2. Add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-your-key-here`
3. Click **Save**
4. Go to **Deployments** → click the three dots on your latest deploy → **Redeploy**

That's it. Your tool is live at `your-project-name.vercel.app`.

---

## Cost estimates

Each full analysis (3 API calls with web search) costs roughly **$0.03–0.08**.
Each content generation call costs roughly **$0.01–0.03**.
A heavy day of use = under $2.

---

## Restrict access (optional)

If you don't want it publicly accessible:

**Option A — Vercel password protection** (easiest)
- Vercel dashboard → Settings → **Password Protection** (requires Pro plan, $20/mo)

**Option B — Add a `.env.local` access code** (free)
Add `ACCESS_CODE=your-secret-word` to environment variables, then add this check to both API routes:

```typescript
const { accessCode } = await req.json();
if (accessCode !== process.env.ACCESS_CODE) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```
And send the code from the frontend in every request body.

---

## Local development

```bash
npm install
cp .env.local.example .env.local
# Add your API key to .env.local
npm run dev
# Open http://localhost:3000
```

---

## Project structure

```
src/
  app/
    api/
      analyze/route.ts   ← Runs the 3-step analysis pipeline (server-side, key is safe)
      generate/route.ts  ← Generates content per channel (server-side, key is safe)
    layout.tsx
    page.tsx
    globals.css
  components/
    ContentEngine.tsx    ← The full UI
```

The key insight: the browser never touches the Anthropic API directly.
All calls go through `/api/analyze` and `/api/generate` on the server,
where `ANTHROPIC_API_KEY` lives in environment variables — never exposed to anyone.
