# Is Your Child AI-Ready? — Assessment Tool

Production-ready assessment for [AI Tools for Kids](https://www.aitoolsforkids.com).

## Quick Deploy to Vercel

### Option A: Deploy via Vercel CLI (fastest)

```bash
# 1. Install Vercel CLI if you don't have it
npm i -g vercel

# 2. From this project folder, run:
npm install
vercel

# 3. Follow the prompts — it will deploy automatically
```

### Option B: Deploy via GitHub

1. Push this folder to a new GitHub repo (e.g. `ai-ready-assessment`)
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repo
4. Click Deploy — done

### Option C: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Upload this folder directly
3. Click Deploy

---

## Configuration

### 1. Kit (ConvertKit) Email Capture

In `src/App.jsx`, find the `CONFIG` object at the top and update:

```js
const CONFIG = {
  KIT_FORM_ID: "YOUR_KIT_FORM_ID",  // ← Replace with your actual Kit form ID
  KIT_API_KEY: "YOUR_API_KEY",       // ← Your Kit public API key
  SITE_URL: "https://www.aitoolsforkids.com",
};
```

**To get your Kit Form ID:**
1. Log into Kit (app.kit.com)
2. Create a new Form (or use existing)
3. The form ID is in the URL: `app.kit.com/forms/XXXXXXX/edit`
4. Copy that number

**Custom fields to create in Kit:**
- `child_age` (text)
- `interests` (text)
- `experience` (text)
- `priorities` (text)
- `involvement` (text)
- `budget` (text)
- `goal` (text)
- `ai_profile` (text)

### 2. Custom Domain

After deploying to Vercel:
1. Go to your project Settings → Domains
2. Add `assessment.aitoolsforkids.com`
3. Add a CNAME record in your DNS: `assessment` → `cname.vercel-dns.com`

### 3. Google Analytics

The assessment fires GA4 events automatically if `window.gtag` is available.
Either add your GA4 tag to `index.html`, or if embedding via iframe, events
are forwarded to the parent window via `postMessage`.

**Events tracked:**
- `assessment_started` — user clicks "Start the Assessment"
- `question_answered` — each question answered (with question ID and answer)
- `assessment_completed` — results shown (with profile tier, age, interests)
- `tool_clicked` — user clicks a tool recommendation (with tool name, position, affiliate status)
- `project_clicked` — user clicks the starter project
- `email_captured` — email submitted successfully (with profile tier)

---

## Embedding in Webflow

### Option 1: Full-page link (recommended)
Link directly to `assessment.aitoolsforkids.com` from your Webflow site.

### Option 2: Iframe embed
Add this custom embed block in Webflow:

```html
<iframe 
  src="https://assessment.aitoolsforkids.com" 
  width="100%" 
  height="800" 
  frameborder="0"
  style="border: none; border-radius: 16px; max-width: 560px; margin: 0 auto; display: block;"
></iframe>
```

### Option 3: Popup/Modal
Add a button anywhere on your site that opens the assessment:

```html
<button onclick="document.getElementById('assessment-modal').style.display='flex'">
  Take the Free Assessment →
</button>

<div id="assessment-modal" style="display:none; position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.6); align-items:center; justify-content:center;" onclick="if(event.target===this)this.style.display='none'">
  <div style="width:95%; max-width:560px; height:90vh; background:#FFF8F0; border-radius:20px; overflow:hidden; position:relative;">
    <button onclick="this.parentElement.parentElement.style.display='none'" style="position:absolute; top:12px; right:16px; z-index:10; background:none; border:none; font-size:24px; cursor:pointer;">✕</button>
    <iframe src="https://assessment.aitoolsforkids.com" width="100%" height="100%" frameborder="0" style="border:none;"></iframe>
  </div>
</div>
```

---

## Adding More Tools

In `src/App.jsx`, find the `TOOLS` array and add entries following this format:

```js
{
  name: "Tool Name",
  slug: "tool-slug",              // matches your Webflow CMS slug
  category: ["art", "video"],     // art, music, writing, video, coding, learning
  minAge: 8,
  maxAge: 16,
  pricing: "free",                // "free" or "paid"
  safety: 4,                      // 1-5
  creativity: 5,                  // 1-5
  education: 3,                   // 1-5
  supervision: "nearby",          // "hands-on", "nearby", "independent"
  difficulty: "beginner",         // "beginner", "intermediate"
  sessionTime: "30min",           // "15min", "30min", "60min"
  description: "One-liner description.",
  whyMatch: {
    create: "Why this helps kids create...",
    learn: "Why this helps kids learn...",
    together: "Why this is great for families...",
    confident: "Why parents can feel safe...",
  },
  link: "/ai-tools/tool-slug",
  affiliate: false,               // true if you have an affiliate link
}
```

---

## File Structure

```
ai-ready-assessment/
├── index.html          ← Entry point with SEO meta tags
├── package.json        ← Dependencies
├── vercel.json         ← Vercel deployment config (allows iframe embedding)
├── vite.config.js      ← Build config
└── src/
    ├── main.jsx        ← React entry
    └── App.jsx         ← Full assessment app (single file)
```
