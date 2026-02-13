import { useState, useEffect, useRef, useCallback } from "react";

// ──────────────────────────────────────────────
// CONFIGURATION — Update these values
// ──────────────────────────────────────────────
const CONFIG = {
  // Kit (ConvertKit) — Replace with your actual form ID
  KIT_FORM_ID: "9083818",
  KIT_API_KEY: "7G0d5vNd-Xb_bnsahgxGeA", // Optional: only needed for API approach

  // Your main site URL
  SITE_URL: "https://www.aitoolsforkids.com",

  // Google Analytics — events fire via window.gtag if available
  GA_ENABLED: true,
};

// ──────────────────────────────────────────────
// BRAND TOKENS
// ──────────────────────────────────────────────
const B = {
  navy: "#0B1A2F",
  navyLight: "#132640",
  cream: "#FFF8F0",
  pink: "#FF3B9A",
  pinkLight: "#FFE8F4",
  cyan: "#00C8E0",
  cyanLight: "#E0FAFE",
  gold: "#FFD700",
  text: "#1a1a2e",
  muted: "#6B7280",
  white: "#FFFFFF",
  ok: "#10B981",
  border: "#E5E1DB",
};

// ──────────────────────────────────────────────
// ANALYTICS HELPERS
// ──────────────────────────────────────────────
function track(event, params = {}) {
  if (!CONFIG.GA_ENABLED) return;
  // Fire GA4 event if gtag exists (loaded on parent page or this page)
  if (typeof window.gtag === "function") {
    window.gtag("event", event, params);
  }
  // PostMessage to parent window if embedded in iframe
  try {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "assessment_event", event, params }, "*");
    }
  } catch (e) { /* cross-origin, ignore */ }
}

// ──────────────────────────────────────────────
// QUESTIONS
// ──────────────────────────────────────────────
const QUESTIONS = [
  {
    id: "age",
    question: "How old is your child?",
    subtitle: "This helps us find age-appropriate tools",
    icon: "🎂",
    type: "single",
    options: [
      { id: "5-7", label: "5–7 years old", emoji: "🧒" },
      { id: "8-10", label: "8–10 years old", emoji: "👦" },
      { id: "11-13", label: "11–13 years old", emoji: "🧑" },
      { id: "14-16", label: "14–16 years old", emoji: "🧑‍💻" },
    ],
  },
  {
    id: "interests",
    question: "What does your child love doing most?",
    subtitle: "Pick up to 2 — we'll match tools to their passions",
    icon: "✨",
    type: "multi",
    max: 2,
    options: [
      { id: "art", label: "Drawing & art", emoji: "🎨" },
      { id: "music", label: "Music & sound", emoji: "🎵" },
      { id: "writing", label: "Writing stories", emoji: "✍️" },
      { id: "video", label: "Making videos", emoji: "🎬" },
      { id: "coding", label: "Gaming & coding", emoji: "🎮" },
      { id: "learning", label: "Learning & school", emoji: "📚" },
    ],
  },
  {
    id: "experience",
    question: "Has your child used AI tools before?",
    subtitle: "No wrong answer — we'll match the right starting point",
    icon: "🚀",
    type: "single",
    options: [
      { id: "never", label: "Never — we're completely new", emoji: "🌱" },
      { id: "some", label: "A little — tried ChatGPT or similar", emoji: "🌿" },
      { id: "experienced", label: "Quite a bit — uses AI regularly", emoji: "🌳" },
    ],
  },
  {
    id: "priorities",
    question: "What matters most to you as a parent?",
    subtitle: "Pick up to 2 priorities",
    icon: "🛡️",
    type: "multi",
    max: 2,
    options: [
      { id: "safety", label: "Safety & privacy", emoji: "🔒" },
      { id: "education", label: "Educational value", emoji: "🎓" },
      { id: "creative", label: "Creative freedom", emoji: "🦋" },
      { id: "cost", label: "Free or affordable", emoji: "💰" },
    ],
  },
  {
    id: "session_time",
    question: "How long would your child use AI tools per session?",
    subtitle: "We'll recommend tools that fit your time window",
    icon: "⏱️",
    type: "single",
    options: [
      { id: "15min", label: "15 minutes or less", emoji: "⚡" },
      { id: "30min", label: "About 30 minutes", emoji: "☀️" },
      { id: "60min", label: "An hour or more", emoji: "🌅" },
    ],
  },
  {
    id: "involvement",
    question: "How involved do you want to be?",
    subtitle: "This shapes whether we recommend co-use or independent tools",
    icon: "👨‍👧",
    type: "single",
    options: [
      { id: "hands-on", label: "Very hands-on — doing it together", emoji: "🤝" },
      { id: "nearby", label: "Nearby — supervising but letting them explore", emoji: "👀" },
      { id: "independent", label: "Independent — safe enough to use alone", emoji: "🦅" },
    ],
  },
  {
    id: "budget",
    question: "What's your budget for AI tools?",
    subtitle: "Many great tools are completely free",
    icon: "💳",
    type: "single",
    options: [
      { id: "free", label: "Free only — €0", emoji: "🆓" },
      { id: "low", label: "Up to €10/month", emoji: "💶" },
      { id: "flexible", label: "Flexible — happy to pay for the right tool", emoji: "💎" },
    ],
  },
  {
    id: "goal",
    question: "What would make this a win for you?",
    subtitle: "This shapes how we frame your personalised results",
    icon: "🎯",
    type: "single",
    options: [
      { id: "create", label: "My child creates something they're proud of", emoji: "🏆" },
      { id: "learn", label: "My child learns a new skill", emoji: "🧠" },
      { id: "together", label: "We have fun doing something together", emoji: "❤️" },
      { id: "confident", label: "I feel confident my child is using AI safely", emoji: "✅" },
    ],
  },
];

// ──────────────────────────────────────────────
// TOOLS DATABASE
// ──────────────────────────────────────────────
const TOOLS = [
  {
    name: "ChatGPT", slug: "chatgpt", category: ["learning", "writing"],
    minAge: 8, maxAge: 16, pricing: "free", safety: 4, creativity: 4, education: 5,
    supervision: "nearby", difficulty: "beginner", sessionTime: "30min",
    description: "The world's most popular AI chatbot — perfect for homework help, creative writing, and exploring questions together.",
    whyMatch: {
      create: "Kids can write stories, poems, and creative projects with AI as their co-author",
      learn: "Instant tutor for any subject — from maths to history to science",
      together: "Ask wild questions together and explore AI's answers as a family",
      confident: "Parent-supervised conversations teach responsible AI interaction",
    },
    link: "/ai-tools/chatgpt",
  },
  {
    name: "Suno", slug: "suno", category: ["music"],
    minAge: 5, maxAge: 16, pricing: "free", safety: 5, creativity: 5, education: 3,
    supervision: "independent", difficulty: "beginner", sessionTime: "15min",
    description: "Create full songs with lyrics and music in seconds — just describe what you want to hear.",
    whyMatch: {
      create: "Your child can produce real songs they'll want to share with everyone",
      learn: "Teaches songwriting structure, rhythm, and musical genres",
      together: "Write silly family songs together — our kids' absolute favourite",
      confident: "Family-safe music generation with content filtering built in",
    },
    link: "/ai-tools/suno",
  },
  {
    name: "Nano Banana", slug: "nano-banana", category: ["art", "video"],
    minAge: 6, maxAge: 16, pricing: "free", safety: 5, creativity: 5, education: 3,
    supervision: "nearby", difficulty: "beginner", sessionTime: "30min",
    description: "AI image generator that creates stunning visuals from text descriptions — great for art projects and storytelling.",
    whyMatch: {
      create: "Turn any idea into a beautiful image — instant creative confidence boost",
      learn: "Teaches visual composition, art direction, and descriptive language",
      together: "Design characters, scenes, and worlds together as a family",
      confident: "Content-filtered image generation designed for creative projects",
    },
    link: "/ai-tools/nano-banana",
  },
  {
    name: "Synthesis Tutor", slug: "synthesis-tutor", category: ["learning"],
    minAge: 5, maxAge: 14, pricing: "paid", safety: 5, creativity: 2, education: 5,
    supervision: "independent", difficulty: "beginner", sessionTime: "15min",
    description: "AI-powered maths tutor that adapts to your child's level — like having a patient private tutor 24/7.",
    whyMatch: {
      create: "Kids build mathematical thinking skills through progressive challenges",
      learn: "Personalised learning path that adapts to exactly where your child is",
      together: "Review progress reports together and celebrate milestones",
      confident: "COPPA-compliant, designed specifically for children's independent use",
    },
    link: "/ai-tools/synthesis-tutor", affiliate: true,
  },
  {
    name: "ElevenLabs", slug: "elevenlabs", category: ["music", "writing", "video"],
    minAge: 10, maxAge: 16, pricing: "free", safety: 4, creativity: 5, education: 4,
    supervision: "nearby", difficulty: "intermediate", sessionTime: "30min",
    description: "Create AI voices and sound effects — perfect for podcasts, audiobooks, and video narration.",
    whyMatch: {
      create: "Bring stories to life with professional voice narration and sound effects",
      learn: "Teaches audio production, voice acting concepts, and storytelling",
      together: "Create family podcasts or narrate stories your kids have written",
      confident: "Parent-supervised voice creation with responsible AI audio practices",
    },
    link: "/ai-tools/elevenlabs", affiliate: true,
  },
  {
    name: "Playground AI", slug: "playground-ai", category: ["art"],
    minAge: 8, maxAge: 16, pricing: "free", safety: 4, creativity: 5, education: 3,
    supervision: "nearby", difficulty: "beginner", sessionTime: "30min",
    description: "Free AI image generator with 50 images per day — unlimited creative exploration for budding artists.",
    whyMatch: {
      create: "50 free images daily means endless creative experiments with no cost pressure",
      learn: "Explore different art styles, from photorealism to anime to watercolour",
      together: "Challenge each other to create the best image from the same prompt",
      confident: "Content-safe image generation suitable for creative exploration",
    },
    link: "/ai-tools/playground-ai",
  },
  {
    name: "Google Gemini", slug: "google-gemini-3-pro", category: ["learning", "writing", "coding"],
    minAge: 13, maxAge: 16, pricing: "free", safety: 4, creativity: 4, education: 5,
    supervision: "nearby", difficulty: "intermediate", sessionTime: "60min",
    description: "Google's powerful AI assistant — excellent for research, coding help, and advanced learning projects.",
    whyMatch: {
      create: "Build apps, write code, and create advanced projects with AI assistance",
      learn: "Deep research capabilities for school projects and self-directed learning",
      together: "Explore complex topics together with AI as your research partner",
      confident: "Google's built-in safety systems with family-friendly defaults",
    },
    link: "/ai-tools/google-gemini-3-pro",
  },
  {
    name: "Kling AI", slug: "kling-ai", category: ["video"],
    minAge: 10, maxAge: 16, pricing: "free", safety: 4, creativity: 5, education: 3,
    supervision: "nearby", difficulty: "intermediate", sessionTime: "60min",
    description: "AI video generator that creates cinematic clips from text or images — we used it to make our Nemo short film.",
    whyMatch: {
      create: "Turn drawings and photos into animated videos — pure movie magic",
      learn: "Teaches film concepts like motion, timing, and visual storytelling",
      together: "Create family short films together — our most popular project so far",
      confident: "Content-filtered video generation with parent supervision recommended",
    },
    link: "/ai-tools/kling-ai",
  },
  {
    name: "NotebookLM", slug: "notebooklm", category: ["learning"],
    minAge: 8, maxAge: 16, pricing: "free", safety: 5, creativity: 3, education: 5,
    supervision: "hands-on", difficulty: "beginner", sessionTime: "30min",
    description: "Google's AI notebook that turns any topic into an engaging podcast — how we taught our 8-year-old about the Irish Famine.",
    whyMatch: {
      create: "Generate educational podcasts on any topic your child is curious about",
      learn: "Transforms complex topics into age-appropriate audio learning",
      together: "Listen to AI-generated podcasts together and discuss what you learned",
      confident: "Google-backed tool focused entirely on educational content",
    },
    link: "/ai-tools/notebooklm",
  },
  {
    name: "CapCut", slug: "capcut", category: ["video"],
    minAge: 10, maxAge: 16, pricing: "free", safety: 3, creativity: 5, education: 3,
    supervision: "nearby", difficulty: "beginner", sessionTime: "60min",
    description: "Free video editor with AI-powered effects, auto-captions, and templates — the tool behind most viral videos.",
    whyMatch: {
      create: "Edit videos like a pro with AI effects, transitions, and auto-captions",
      learn: "Teaches video editing, pacing, storytelling, and content creation skills",
      together: "Edit family videos together or help kids create their own content",
      confident: "Free to use with parent supervision for social media features",
    },
    link: "/ai-tools/capcut",
  },
];

const PROJECTS = [
  { title: "Create a Cinematic Nemo Short Film", age: "8-16", time: "1 hour", interests: ["art", "video"], link: "/projects/nemo-ai-short-film-kling-nano-banana" },
  { title: "Make a Viral AI Celebrity Selfie Video", age: "8-16", time: "1 hour", interests: ["video", "art"], link: "/projects/ai-celebrity-selfie-video-footballers" },
  { title: "Teach History with a NotebookLM Podcast", age: "5-16", time: "30 min", interests: ["learning"], link: "/projects/notebooklm-irish-famine-educational-podcast-kids" },
  { title: "Create an AI FC26 Player Card", age: "8-16", time: "30 min", interests: ["art", "coding"], link: "/projects/ai-fc26-player-card" },
];

// ──────────────────────────────────────────────
// SCORING ENGINE
// ──────────────────────────────────────────────
const AGE_MAP = { "5-7": [5, 7], "8-10": [8, 10], "11-13": [11, 13], "14-16": [14, 16] };

function scoreTool(tool, a) {
  let s = 0;
  const [minA, maxA] = AGE_MAP[a.age] || [0, 99];
  if (tool.minAge > maxA || tool.maxAge < minA) return -1;
  s += 10;

  if ((a.interests || []).some((i) => tool.category.includes(i))) s += 20;
  const p = a.priorities || [];
  if (p.includes("safety")) s += tool.safety * 3;
  if (p.includes("education")) s += tool.education * 3;
  if (p.includes("creative")) s += tool.creativity * 3;
  if (p.includes("cost")) s += tool.pricing === "free" ? 15 : -10;
  if (a.experience === "never" && tool.difficulty === "beginner") s += 10;
  if (a.experience === "never" && tool.difficulty === "intermediate") s -= 5;
  if (a.experience === "experienced" && tool.difficulty === "intermediate") s += 5;
  if (a.involvement === "hands-on" && tool.supervision === "hands-on") s += 8;
  if (a.involvement === "independent" && tool.supervision === "independent") s += 8;
  if (a.involvement === "independent" && tool.supervision === "hands-on") s -= 5;
  if (a.budget === "free" && tool.pricing === "paid") s -= 20;
  if (a.budget === "flexible" && tool.affiliate) s += 5;
  return s;
}

function getProfile(a) {
  if ((a.age === "5-7" || a.age === "8-10") && a.experience === "never") {
    return { tier: "AI Explorer", emoji: "🌱", color: B.ok, tagline: "Ready to discover AI with safe, guided first experiences", description: "Your child is at the perfect starting point. We'll recommend simple, safe tools with clear creative outcomes — the kind of \"wow\" moments that spark lasting curiosity." };
  }
  if (a.experience === "experienced" && (a.age === "14-16" || a.age === "11-13")) {
    return { tier: "AI Innovator", emoji: "🚀", color: B.cyan, tagline: "Ready for advanced tools that build real-world skills", description: "Your child already understands AI basics. It's time for tools that challenge them — coding assistants, advanced creative platforms, and production-level software." };
  }
  return { tier: "AI Creator", emoji: "🎨", color: B.pink, tagline: "Ready to start making amazing things with AI", description: "Your child has the right foundation to move beyond exploring into creating. We'll recommend tools that turn ideas into real, shareable projects." };
}

function getRecommendations(a) {
  return TOOLS.map((t) => ({ ...t, score: scoreTool(t, a) }))
    .filter((t) => t.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, a.experience === "never" ? 2 : 3);
}

function getProject(a) {
  return PROJECTS.find((p) => (a.interests || []).some((i) => p.interests.includes(i))) || PROJECTS[0];
}

// ──────────────────────────────────────────────
// KIT (CONVERTKIT) EMAIL SUBMISSION
// ──────────────────────────────────────────────
async function submitToKit(email, answers, profile) {
  const formId = CONFIG.KIT_FORM_ID;
  if (formId === "YOUR_KIT_FORM_ID") {
    console.warn("Kit form ID not configured");
    return true;
  }

  try {
    const formData = new FormData();
    formData.append("email_address", email);
    formData.append("fields[child_age]", answers.age || "");
    formData.append("fields[interests]", (answers.interests || []).join(", "));
    formData.append("fields[experience]", answers.experience || "");
    formData.append("fields[priorities]", (answers.priorities || []).join(", "));
    formData.append("fields[involvement]", answers.involvement || "");
    formData.append("fields[budget]", answers.budget || "");
    formData.append("fields[goal]", answers.goal || "");
    formData.append("fields[ai_profile]", profile.tier);

    const res = await fetch(`https://app.kit.com/forms/${formId}/subscriptions`, {
      method: "POST",
      body: formData,
    });
    return res.ok;
  } catch (err) {
    console.error("Kit submission error:", err);
    return false;
  }
}

// ──────────────────────────────────────────────
// STYLES (reusable)
// ──────────────────────────────────────────────
const S = {
  label: { fontSize: 13, fontWeight: 600, color: B.muted, textTransform: "uppercase", letterSpacing: 1.5 },
  h2: { fontSize: 26, fontWeight: 700, color: B.navy, lineHeight: 1.2, marginBottom: 8 },
  sub: { fontSize: 15, color: B.muted, margin: 0 },
  btn: (active) => ({
    flex: 1, padding: "14px 24px", border: "none", borderRadius: 12,
    background: active ? `linear-gradient(135deg, ${B.navy}, ${B.navyLight})` : B.border,
    color: active ? B.white : B.muted, fontSize: 16, fontWeight: 700,
    cursor: active ? "pointer" : "not-allowed", transition: "all 0.2s ease",
    boxShadow: active ? `0 4px 15px ${B.navy}40` : "none",
  }),
  backBtn: {
    flex: "0 0 auto", padding: "14px 24px", border: `2px solid ${B.border}`, borderRadius: 12,
    background: B.white, color: B.muted, fontSize: 15, fontWeight: 600, cursor: "pointer",
  },
};

// ──────────────────────────────────────────────
// COMPONENTS
// ──────────────────────────────────────────────
function Progress({ current, total }) {
  return (
    <div style={{ width: "100%", height: 6, background: B.border, borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${(current / total) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${B.cyan}, ${B.pink})`, borderRadius: 3, transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)" }} />
    </div>
  );
}

function Option({ option, selected, onSelect, multi }) {
  const on = multi ? selected?.includes(option.id) : selected === option.id;
  return (
    <button onClick={() => onSelect(option.id)} style={{
      display: "flex", alignItems: "center", gap: 14, padding: "16px 20px",
      border: `2px solid ${on ? B.navy : B.border}`, borderRadius: 14,
      background: on ? B.navy : B.white, color: on ? B.white : B.text,
      cursor: "pointer", width: "100%", textAlign: "left", fontSize: 16, fontWeight: 500,
      transition: "all 0.2s ease", transform: on ? "scale(1.02)" : "scale(1)",
      boxShadow: on ? `0 4px 20px ${B.navy}30` : "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <span style={{ fontSize: 24, flexShrink: 0 }}>{option.emoji}</span>
      <span>{option.label}</span>
      {on && <span style={{ marginLeft: "auto", fontSize: 18 }}>✓</span>}
    </button>
  );
}

function Question({ q, answer, onAnswer, onNext, onBack, idx, total }) {
  const ok = q.type === "multi" ? answer?.length > 0 : answer != null;

  const select = (id) => {
    if (q.type === "multi") {
      const c = answer || [];
      onAnswer(c.includes(id) ? c.filter((x) => x !== id) : c.length < q.max ? [...c, id] : c);
    } else {
      onAnswer(id);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={S.label}>Question {idx + 1} of {total}</span>
        {q.type === "multi" && <span style={{ fontSize: 12, color: B.pink, fontWeight: 600 }}>Pick up to {q.max}</span>}
      </div>
      <Progress current={idx + 1} total={total} />
      <div style={{ margin: "32px 0" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>{q.icon}</div>
        <h2 style={S.h2}>{q.question}</h2>
        <p style={S.sub}>{q.subtitle}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
        {q.options.map((o) => <Option key={o.id} option={o} selected={answer} onSelect={select} multi={q.type === "multi"} />)}
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {idx > 0 && <button onClick={onBack} style={S.backBtn}>← Back</button>}
        <button onClick={() => { if (ok) { track("question_answered", { question: q.id, answer: JSON.stringify(answer) }); onNext(); } }} disabled={!ok} style={S.btn(ok)}>
          {idx === total - 1 ? "See My Results →" : "Next →"}
        </button>
      </div>
    </div>
  );
}

function ToolCard({ tool, answers, index }) {
  const goal = answers.goal || "create";
  const why = tool.whyMatch[goal] || tool.whyMatch.create;
  const accents = [B.pink, B.cyan, B.gold];
  const c = accents[index % 3];

  return (
    <div style={{ background: B.white, borderRadius: 16, border: `2px solid ${B.border}`, overflow: "hidden" }}>
      <div style={{ height: 5, background: c }} />
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <span style={{ display: "inline-block", background: `${c}18`, color: c === B.gold ? B.navy : c, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              #{index + 1} Match
            </span>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: B.navy, margin: 0 }}>{tool.name}</h3>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: tool.pricing === "free" ? B.ok : B.muted, background: tool.pricing === "free" ? `${B.ok}15` : `${B.muted}12`, padding: "4px 10px", borderRadius: 6 }}>
            {tool.pricing === "free" ? "Free" : "Paid"}
          </span>
        </div>
        <p style={{ fontSize: 14, color: B.muted, margin: "0 0 16px", lineHeight: 1.6 }}>{tool.description}</p>
        <div style={{ background: B.cream, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: B.navy, margin: "0 0 4px" }}>Why this is perfect for your child:</p>
          <p style={{ fontSize: 14, color: B.text, margin: 0, lineHeight: 1.5 }}>{why}</p>
        </div>
        <a href={`${CONFIG.SITE_URL}${tool.link}`} target="_blank" rel="noopener noreferrer"
          onClick={() => track("tool_clicked", { tool: tool.name, position: index + 1, affiliate: !!tool.affiliate })}
          style={{ display: "block", textAlign: "center", padding: "12px 20px", background: B.navy, color: B.white, textDecoration: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, transition: "opacity 0.2s" }}>
          See Full Review →
        </a>
      </div>
    </div>
  );
}

function Results({ answers, onRestart }) {
  const profile = getProfile(answers);
  const tools = getRecommendations(answers);
  const project = getProject(answers);
  const [emailStep, setEmailStep] = useState("idle"); // idle | input | submitting | done | error
  const [email, setEmail] = useState("");

  useEffect(() => {
    track("assessment_completed", { profile: profile.tier, age: answers.age, interests: (answers.interests || []).join(",") });
  }, []);

  const handleSubmit = async () => {
    if (!email.includes("@")) return;
    setEmailStep("submitting");
    const ok = await submitToKit(email, answers, profile);
    setEmailStep(ok ? "done" : "error");
    if (ok) track("email_captured", { profile: profile.tier });
  };

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      {/* Profile */}
      <div style={{ background: `linear-gradient(135deg, ${B.navy}, ${B.navyLight})`, borderRadius: 20, padding: "32px 28px", marginBottom: 28, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 150, height: 150, borderRadius: "50%", background: `${profile.color}15` }} />
        <div style={{ position: "absolute", bottom: -30, left: -30, width: 100, height: 100, borderRadius: "50%", background: `${B.cyan}10` }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>{profile.emoji}</div>
          <p style={{ fontSize: 12, fontWeight: 700, color: `${B.white}90`, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>Your child is an</p>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: B.white, margin: "0 0 8px" }}>{profile.tier}</h2>
          <p style={{ fontSize: 16, color: profile.color, fontWeight: 600, margin: "0 0 12px" }}>{profile.tagline}</p>
          <p style={{ fontSize: 14, color: `${B.white}80`, margin: 0, lineHeight: 1.6, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>{profile.description}</p>
        </div>
      </div>

      {/* Tools */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: B.navy, marginBottom: 4 }}>Your Top {tools.length} Recommended Tools</h3>
        <p style={{ fontSize: 14, color: B.muted, margin: "0 0 16px" }}>Personalised to your child's age, interests, and your priorities</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {tools.map((t, i) => <ToolCard key={t.slug} tool={t} answers={answers} index={i} />)}
        </div>
      </div>

      {/* Project */}
      <div style={{ background: B.cyanLight, borderRadius: 16, padding: "20px 24px", marginBottom: 28, border: `2px solid ${B.cyan}30` }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: B.cyan, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>🎬 Try This First</p>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: B.navy, margin: "0 0 6px" }}>{project.title}</h4>
        <p style={{ fontSize: 14, color: B.muted, margin: "0 0 14px" }}>Ages {project.age} · {project.time} · Step-by-step family project</p>
        <a href={`${CONFIG.SITE_URL}${project.link}`} target="_blank" rel="noopener noreferrer"
          onClick={() => track("project_clicked", { project: project.title })}
          style={{ display: "inline-block", padding: "10px 20px", background: B.cyan, color: B.white, textDecoration: "none", borderRadius: 10, fontSize: 14, fontWeight: 700 }}>
          See Full Project →
        </a>
      </div>

      {/* Email Capture */}
      {emailStep !== "done" ? (
        <div style={{ background: B.pinkLight, borderRadius: 16, padding: 24, marginBottom: 28, border: `2px solid ${B.pink}25`, textAlign: "center" }}>
          <p style={{ fontSize: 24, margin: "0 0 8px" }}>📧</p>
          <h4 style={{ fontSize: 18, fontWeight: 700, color: B.navy, margin: "0 0 8px" }}>Want 5 more personalised recommendations?</h4>
          <p style={{ fontSize: 14, color: B.muted, margin: "0 0 16px", lineHeight: 1.5 }}>
            Get your full guide plus weekly AI tool discoveries from a dad who tests everything with his own kids first.
          </p>
          {emailStep === "idle" ? (
            <button onClick={() => setEmailStep("input")} style={{ padding: "14px 32px", border: "none", borderRadius: 12, background: B.pink, color: B.white, fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 15px ${B.pink}40` }}>
              Yes, Send My Full Guide →
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8, maxWidth: 400, margin: "0 auto" }}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Your email address" autoFocus
                style={{ flex: 1, padding: "12px 16px", border: `2px solid ${B.border}`, borderRadius: 10, fontSize: 15, outline: "none" }} />
              <button onClick={handleSubmit} disabled={emailStep === "submitting"}
                style={{ padding: "12px 20px", border: "none", borderRadius: 10, background: B.pink, color: B.white, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", opacity: emailStep === "submitting" ? 0.6 : 1 }}>
                {emailStep === "submitting" ? "..." : "Send →"}
              </button>
            </div>
          )}
          {emailStep === "error" && <p style={{ fontSize: 13, color: "#EF4444", marginTop: 8 }}>Something went wrong. Please try again.</p>}
        </div>
      ) : (
        <div style={{ background: `${B.ok}10`, borderRadius: 16, padding: 24, marginBottom: 28, border: `2px solid ${B.ok}30`, textAlign: "center" }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>🎉</p>
          <h4 style={{ fontSize: 18, fontWeight: 700, color: B.navy, margin: "0 0 8px" }}>You're in! Check your inbox.</h4>
          <p style={{ fontSize: 14, color: B.muted, margin: 0 }}>Your full personalised guide is on its way, plus weekly discoveries every Sunday.</p>
        </div>
      )}

      {/* Share + Restart */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={() => { if (navigator.share) navigator.share({ title: "Is Your Child AI-Ready?", text: `I just found out my child is an ${profile.tier}! Take this free 2-minute assessment:`, url: window.location.href }); }}
          style={{ padding: "10px 20px", border: `2px solid ${B.border}`, borderRadius: 10, background: "transparent", color: B.navy, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          📤 Share Results
        </button>
        <button onClick={onRestart} style={{ padding: "10px 20px", border: `2px solid ${B.border}`, borderRadius: 10, background: "transparent", color: B.muted, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          ↻ Take Again
        </button>
      </div>
    </div>
  );
}

function Welcome({ onStart }) {
  return (
    <div style={{ textAlign: "center", animation: "fadeIn 0.4s ease" }}>
      <div style={{ width: 80, height: 80, borderRadius: 20, background: `linear-gradient(135deg, ${B.navy}, ${B.navyLight})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 36 }}>
        🧪
      </div>
      <h1 style={{ fontSize: 30, fontWeight: 800, color: B.navy, lineHeight: 1.15, marginBottom: 12 }}>
        Find the Perfect AI Tools<br /><span style={{ color: B.pink }}>for Your Child</span>
      </h1>
      <p style={{ fontSize: 16, color: B.muted, lineHeight: 1.6, maxWidth: 420, margin: "0 auto 8px" }}>
        Answer 8 quick questions and get personalised recommendations from a dad who's tested 50+ AI tools with his own kids.
      </p>
      <p style={{ fontSize: 13, color: B.muted, margin: "0 auto 28px" }}>
        ⏱️ Takes 2 minutes · 100% free · No signup required
      </p>

      {/* Video placeholder — replace src with your YouTube/Vimeo embed */}
      <div id="video-placeholder"
        style={{ background: B.navy, borderRadius: 16, padding: "48px 24px", marginBottom: 28, cursor: "pointer" }}
        onClick={() => { /* Replace: open video modal or play embed */ }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${B.white}20`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 28 }}>▶️</div>
        <p style={{ fontSize: 14, color: `${B.white}80`, margin: 0 }}>Watch: Why I built this for parents like you (60 sec)</p>
      </div>

      <button onClick={() => { track("assessment_started"); onStart(); }}
        style={{ width: "100%", padding: "18px 32px", border: "none", borderRadius: 14, background: `linear-gradient(135deg, ${B.pink}, #FF6B9D)`, color: B.white, fontSize: 18, fontWeight: 700, cursor: "pointer", boxShadow: `0 6px 25px ${B.pink}50`, transition: "transform 0.15s ease" }}>
        Start the Assessment →
      </button>

      <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 20, flexWrap: "wrap" }}>
        {["500+ families trust us", "50+ tools tested", "Ages 5–16"].map((t) => (
          <span key={t} style={{ fontSize: 12, color: B.muted, fontWeight: 600 }}>✓ {t}</span>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// MAIN APP
// ──────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [qIdx, screen]);

  // Listen for postMessage from parent (for iframe integration)
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "assessment_config") {
        Object.assign(CONFIG, e.data.config);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        * { box-sizing:border-box; margin:0; font-family:'DM Sans',sans-serif }
        button:hover { opacity:0.92 }
        input:focus { border-color:${B.pink}!important }
        ::selection { background:${B.pink}30 }
      `}</style>
      <div ref={ref} style={{ maxWidth: 520, margin: "0 auto", padding: "32px 20px 48px", minHeight: "100vh", background: B.cream }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 32, paddingBottom: 20, borderBottom: `1px solid ${B.border}` }}>
          <a href={CONFIG.SITE_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: B.navy, letterSpacing: 0.5 }}>AI TOOLS FOR KIDS</span>
            <span style={{ color: B.border }}>|</span>
            <span style={{ fontSize: 13, color: B.muted, fontWeight: 500 }}>by AI Dad Lab</span>
          </a>
        </div>

        {screen === "welcome" && <Welcome onStart={() => setScreen("questions")} />}
        {screen === "questions" && (
          <Question
            q={QUESTIONS[qIdx]}
            answer={answers[QUESTIONS[qIdx].id]}
            onAnswer={(v) => setAnswers((p) => ({ ...p, [QUESTIONS[qIdx].id]: v }))}
            onNext={() => qIdx < QUESTIONS.length - 1 ? setQIdx((i) => i + 1) : setScreen("results")}
            onBack={() => setQIdx((i) => i - 1)}
            idx={qIdx}
            total={QUESTIONS.length}
          />
        )}
        {screen === "results" && <Results answers={answers} onRestart={() => { setAnswers({}); setQIdx(0); setScreen("welcome"); }} />}
      </div>
    </>
  );
}
