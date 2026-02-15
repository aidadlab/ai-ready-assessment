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
  // ── ART / IMAGE GENERATION ──
  {
    name: "Nano Banana Pro", slug: "nano-banana", category: ["art"],
    minAge: 10, maxAge: 16, pricing: "free", safety: 4, creativity: 5, education: 3,
    supervision: "hands-on", difficulty: "intermediate", sessionTime: "30min",
    description: "Google's AI image generator with stunning photorealism and character consistency — great for art projects and storytelling.",
    whyMatch: {
      create: "Design characters, scenes, and worlds together as a family",
      learn: "Explore how AI interprets language into visuals — fascinating for curious minds",
      together: "Take turns writing prompts and see whose imagination creates the best image",
      confident: "Content-filtered image generation with parent supervision recommended",
    },
    link: "/ai-tools/nano-banana",
  },
  {
    name: "More Graphics", slug: "more-graphics", category: ["art"],
    minAge: 6, maxAge: 16, pricing: "free", safety: 5, creativity: 5, education: 3,
    supervision: "independent", difficulty: "beginner", sessionTime: "15min",
    description: "AI pattern and clipart generator — kids can create seamless designs, graphics, and transparent backgrounds for projects.",
    whyMatch: {
      create: "Design unique patterns, stickers, and graphics for school or craft projects",
      learn: "Understand how AI generates repeating patterns and design elements",
      together: "Create custom wrapping paper or card designs as a family activity",
      confident: "Family-friendly generators with safe, appropriate content throughout",
    },
    link: "/ai-tools/more-graphics",
  },
  {
    name: "Playground AI", slug: "playground-ai", category: ["art"],
    minAge: 13, maxAge: 16, pricing: "free", safety: 4, creativity: 5, education: 3,
    supervision: "nearby", difficulty: "beginner", sessionTime: "30min",
    description: "Free AI image generator offering 50 images per day with multiple AI models and canvas editing.",
    whyMatch: {
      create: "Generate artwork for school presentations, stories, or social media projects",
      learn: "Experiment with different AI models to understand how each interprets prompts differently",
      together: "Compare results across AI models — a fun family experiment in AI creativity",
      confident: "Built-in content filters handle most safety concerns with parental guidance",
    },
    link: "/ai-tools/playground-ai",
  },
  {
    name: "Bing Image Creator", slug: "bing-image-creator", category: ["art"],
    minAge: 13, maxAge: 16, pricing: "free", safety: 4, creativity: 5, education: 3,
    supervision: "nearby", difficulty: "beginner", sessionTime: "15min",
    description: "Microsoft's 100% free AI image generator powered by DALL-E 3 — no subscription required, just a Microsoft account.",
    whyMatch: {
      create: "Create illustrations for school projects, stories, and creative assignments",
      learn: "Learn prompt engineering — how describing things differently changes the output",
      together: "Challenge each other to create the best image from the same prompt",
      confident: "Microsoft's content filters provide strong safety guardrails",
    },
    link: "/ai-tools/bing-image-creator",
  },
  {
    name: "Freepik AI Image Generator", slug: "freepik-ai-image-generator", category: ["art"],
    minAge: 13, maxAge: 16, pricing: "free", safety: 4, creativity: 5, education: 3,
    supervision: "nearby", difficulty: "beginner", sessionTime: "20min",
    description: "Professional AI image generator with unlimited creation, multiple AI models, and sketch-to-image tools.",
    whyMatch: {
      create: "Turn rough sketches into polished artwork — perfect for young designers",
      learn: "Explore professional design workflows used in real creative industries",
      together: "Draw something by hand, then watch AI transform it into different styles",
      confident: "Designed for design projects with appropriate content filtering",
    },
    link: "/ai-tools/freepik-ai-image-generator",
  },
  {
    name: "Leonardo AI", slug: "leonardo-ai", category: ["art"],
    minAge: 13, maxAge: 16, pricing: "free", safety: 4, creativity: 5, education: 3,
    supervision: "hands-on", difficulty: "intermediate", sessionTime: "45min",
    description: "Comprehensive AI creative platform for generating high-quality images and visual content with professional tools.",
    whyMatch: {
      create: "Create professional-grade artwork, game assets, and visual stories",
      learn: "Understand advanced AI image generation techniques used by real artists",
      together: "Design a family comic book or illustrated story using AI-generated art",
      confident: "Parental guidance recommended for advanced features and content review",
    },
    link: "/ai-tools/leonardo-ai",
    affiliate: true,
  },
  {
    name: "Midjourney", slug: "midjourney", category: ["art"],
    minAge: 12, maxAge: 16, pricing: "paid", safety: 4, creativity: 5, education: 3,
    supervision: "hands-on", difficulty: "intermediate", sessionTime: "30min",
    description: "Premium AI image generator creating stunning artwork from text prompts via Discord — the gold standard for AI art.",
    whyMatch: {
      create: "Create breathtaking artwork that rivals professional illustrations",
      learn: "Master prompt crafting — a genuinely valuable skill for the AI age",
      together: "Collaborate on a family art gallery of AI-generated masterpieces",
      confident: "Discord-based platform requires parental supervision and account management",
    },
    link: "/ai-tools/midjourney",
  },
  {
    name: "Quick, Draw!", slug: "quick-draw", category: ["art", "learning"],
    minAge: 5, maxAge: 12, pricing: "free", safety: 5, creativity: 4, education: 5,
    supervision: "independent", difficulty: "beginner", sessionTime: "10min",
    description: "Google's AI drawing game — sketch objects in 20 seconds while a neural network guesses what you're drawing.",
    whyMatch: {
      create: "Race to draw objects before the AI guesses — surprisingly addictive",
      learn: "Understand how AI 'sees' and recognises patterns in a fun, hands-on way",
      together: "Take turns drawing and cheer each other on — great family game night addition",
      confident: "Completely safe, educational, and designed by Google for all ages",
    },
    link: "/ai-tools/quick-draw",
  },
  // ── VIDEO GENERATION ──
  {
    name: "Hedra AI", slug: "hedra-ai", category: ["video", "art"],
    minAge: 8, maxAge: 16, pricing: "free", safety: 5, creativity: 5, education: 3,
    supervision: "independent", difficulty: "beginner", sessionTime: "15min",
    description: "AI character video creator that transforms static images into expressive talking, singing, and rapping characters.",
    whyMatch: {
      create: "Make your drawings or photos come alive — kids absolutely love this",
      learn: "Understand how AI maps speech to facial movements and expressions",
      together: "Turn family photos into hilarious talking characters for birthdays or holidays",
      confident: "Safe and intuitive for independent creative play with content filtering",
    },
    link: "/ai-tools/hedra-ai",
  },
  {
    name: "LeiaPix", slug: "leiapix", category: ["video", "art"],
    minAge: 6, maxAge: 16, pricing: "free", safety: 5, creativity: 5, education: 3,
    supervision: "independent", difficulty: "beginner", sessionTime: "10min",
    description: "AI 3D image converter that transforms any 2D photo into an immersive 3D animation — instant wow factor.",
    whyMatch: {
      create: "Turn any photo into a moving 3D scene — the results are genuinely impressive",
      learn: "Explore how AI understands depth and creates 3D from flat images",
      together: "Transform family holiday photos into 3D memories everyone will want to share",
      confident: "Completely safe for independent use with no content concerns whatsoever",
    },
    link: "/ai-tools/leiapix",
  },
  {
    name: "Pika", slug: "pika", category: ["video"],
    minAge: 8, maxAge: 16, pricing: "free", safety: 4, creativity: 5, education: 3,
    supervision: "nearby", difficulty: "beginner", sessionTime: "20min",
    description: "AI video generator that creates and edits videos from text prompts and images with cinematic quality.",
    whyMatch: {
      create: "Turn text descriptions or photos into short cinematic video clips",
      learn: "Explore how AI generates motion and understands scene composition",
      together: "Create a family mini-movie from a holiday photo — magical results",
      confident: "Content-filtered video generation with parental review recommended",
    },
    link: "/ai-tools/pika",
  },
  {
    name: "Runway", slug: "runway", category: ["video"],
    minAge: 11, maxAge: 16, pricing: "free", safety: 4, creativity: 5, education: 3,
    supervision: "nearby", difficulty: "beginner", sessionTime: "30min",
    description: "AI video platform that creates high-quality videos from text, images, and video inputs with professional editing tools.",
    whyMatch: {
      create: "Generate professional-quality video content from simple text descriptions",
      learn: "Understand how AI creates realistic motion and visual effects",
      together: "Collaborate on a family short film using AI-generated scenes",
      confident: "Parental guidance recommended for content creation and review",
    },
    link: "/ai-tools/runway",
  },
  {
    name: "Kling AI", slug: "kling-ai", category: ["video"],
    minAge: 12, maxAge: 16, pricing: "free", safety: 4, creativity: 5, education: 3,
    supervision: "hands-on", difficulty: "intermediate", sessionTime: "60min",
    description: "Advanced AI video generation platform for professional-grade cinematic video creation from text and images.",
    whyMatch: {
      create: "Create cinematic short films that look genuinely professional",
      learn: "Learn advanced video production concepts through AI-assisted filmmaking",
      together: "Direct a family film project with AI handling the special effects",
      confident: "Complex platform requiring guidance for optimal and responsible use",
    },
    link: "/ai-tools/kling-ai",
  },
  {
    name: "Synthesia", slug: "synthesia", category: ["video"],
    minAge: 10, maxAge: 16, pricing: "paid", safety: 4, creativity: 5, education: 4,
    supervision: "hands-on", difficulty: "intermediate", sessionTime: "30min",
    description: "AI video platform creating professional videos with realistic AI avatars and voiceovers in 140+ languages.",
    whyMatch: {
      create: "Create polished presentation videos with AI avatars — great for school projects",
      learn: "Understand how AI generates realistic human-like video presentations",
      together: "Build multilingual family greeting videos with AI avatars",
      confident: "Professional tool requiring parental guidance for avatar content creation",
    },
    link: "/ai-tools/synthesia",
    affiliate: true,
  },
  {
    name: "Nim Video", slug: "nim-video", category: ["video"],
    minAge: 10, maxAge: 16, pricing: "paid", safety: 4, creativity: 5, education: 3,
    supervision: "hands-on", difficulty: "intermediate", sessionTime: "45min",
    description: "All-in-one AI video app with 25+ leading AI models for professional video creation.",
    whyMatch: {
      create: "Access multiple AI video models in one place — like a video creation studio",
      learn: "Compare how different AI models handle the same creative brief",
      together: "Produce a family movie night intro or holiday video greeting",
      confident: "Advanced platform requiring parental supervision and content guidance",
    },
    link: "/ai-tools/nim-video",
    affiliate: true,
  },
  // ── MUSIC & AUDIO ──
  {
    name: "Suno", slug: "suno", category: ["music"],
    minAge: 8, maxAge: 16, pricing: "free", safety: 4, creativity: 5, education: 3,
    supervision: "nearby", difficulty: "beginner", sessionTime: "15min",
    description: "AI music generator that creates complete songs with vocals and instruments from simple text prompts.",
    whyMatch: {
      create: "Write silly family songs together — our kids' absolute favourite AI tool",
      learn: "Explore music genres, song structure, and how AI interprets musical concepts",
      together: "Create personalised birthday songs, holiday anthems, or bedtime lullabies",
      confident: "Content-filtered music generation with parental lyric review recommended",
    },
    link: "/ai-tools/suno",
  },
  {
    name: "Udio", slug: "udio", category: ["music"],
    minAge: 10, maxAge: 16, pricing: "free", safety: 4, creativity: 5, education: 3,
    supervision: "nearby", difficulty: "beginner", sessionTime: "20min",
    description: "AI music generator creating high-quality songs from text prompts with advanced editing and multiple AI models.",
    whyMatch: {
      create: "Generate professional-sounding music in any genre from a text description",
      learn: "Experiment with different musical styles and understand genre characteristics",
      together: "Create a family soundtrack or theme song that everyone contributes lyrics to",
      confident: "Parental guidance on lyric content recommended for younger users",
    },
    link: "/ai-tools/udio",
  },
  {
    name: "ElevenLabs", slug: "elevenlabs", category: ["music", "video"],
    minAge: 13, maxAge: 16, pricing: "free", safety: 3, creativity: 5, education: 4,
    supervision: "hands-on", difficulty: "intermediate", sessionTime: "30min",
    description: "Advanced AI voice generation creating ultra-realistic text-to-speech in 1000s of voices and 32 languages.",
    whyMatch: {
      create: "Clone voices, create audiobooks, or add narration to video projects",
      learn: "Understand how AI replicates human speech patterns and emotional tones",
      together: "Create a family audiobook or podcast with professional-quality voiceovers",
      confident: "All content must be pre-approved — powerful tool requiring active supervision",
    },
    link: "/ai-tools/elevenlabs",
    affiliate: true,
  },
  {
    name: "Speechace", slug: "speechace", category: ["music", "learning"],
    minAge: 5, maxAge: 16, pricing: "free", safety: 5, creativity: 3, education: 5,
    supervision: "independent", difficulty: "beginner", sessionTime: "15min",
    description: "AI pronunciation and fluency tool designed specifically for kids — perfect for language learning and speech practice.",
    whyMatch: {
      create: "Practice pronunciation and get instant AI feedback on speaking skills",
      learn: "Build language confidence with patient, non-judgmental AI assessment",
      together: "Practice a new language together and compare pronunciation scores",
      confident: "Educational tool designed specifically for children with safe content",
    },
    link: "/ai-tools/speechace",
  },
  // ── WRITING & TEXT ──
  {
    name: "Grammarly", slug: "grammarly", category: ["writing", "learning"],
    minAge: 8, maxAge: 16, pricing: "free", safety: 5, creativity: 4, education: 5,
    supervision: "independent", difficulty: "beginner", sessionTime: "15min",
    description: "AI writing assistant for grammar checking, style suggestions, and writing improvement — safe for independent use.",
    whyMatch: {
      create: "Improve any writing assignment with real-time grammar and style suggestions",
      learn: "Learn from corrections — builds genuine writing skills over time, not just fixes",
      together: "Review writing improvements together and celebrate progress",
      confident: "Completely safe for independent use — one of the lowest-risk AI tools available",
    },
    link: "/ai-tools/grammarly",
  },
  {
    name: "AI Dungeon", slug: "ai-dungeon", category: ["writing"],
    minAge: 10, maxAge: 16, pricing: "free", safety: 4, creativity: 5, education: 4,
    supervision: "hands-on", difficulty: "intermediate", sessionTime: "30min",
    description: "AI text adventure game with infinite storylines — type actions and watch AI narrate what happens next.",
    whyMatch: {
      create: "Build infinite interactive stories where your choices shape the narrative",
      learn: "Develop creative writing skills through collaborative AI storytelling",
      together: "Play through an adventure together — taking turns choosing what happens next",
      confident: "Safe Mode filters available but parental supervision recommended for content",
    },
    link: "/ai-tools/ai-dungeon",
  },
  {
    name: "Character.AI", slug: "character-ai", category: ["writing"],
    minAge: 13, maxAge: 16, pricing: "free", safety: 4, creativity: 5, education: 4,
    supervision: "hands-on", difficulty: "intermediate", sessionTime: "30min",
    description: "Chat with AI versions of fictional characters, historical figures, or custom personalities — popular creative tool for teens.",
    whyMatch: {
      create: "Design and build your own AI characters with unique personalities",
      learn: "Interview historical figures for school projects — surprisingly educational",
      together: "Create a family character and see how each person shapes their personality",
      confident: "Regular check-ins essential as conversations can go in unexpected directions",
    },
    link: "/ai-tools/character-ai",
  },
  {
    name: "Claude", slug: "claude", category: ["writing", "learning"],
    minAge: 10, maxAge: 16, pricing: "free", safety: 4, creativity: 4, education: 5,
    supervision: "hands-on", difficulty: "intermediate", sessionTime: "30min",
    description: "Anthropic's AI assistant focused on helpful, harmless conversations — excellent for writing, research, and learning.",
    whyMatch: {
      create: "Co-write stories, brainstorm ideas, and develop creative projects together",
      learn: "Thoughtful research assistant that explains concepts clearly and honestly",
      together: "Explore questions together — Claude's careful responses spark great discussions",
      confident: "Built-in safety focus with honest, harmless design principles",
    },
    link: "/ai-tools/claude",
  },
  // ── LEARNING & EDUCATION ──
  {
    name: "Synthesis Tutor", slug: "synthesis-tutor", category: ["learning"],
    minAge: 8, maxAge: 14, pricing: "paid", safety: 5, creativity: 2, education: 5,
    supervision: "independent", difficulty: "beginner", sessionTime: "15min",
    description: "AI-powered maths tutor that adapts to your child's level — like having a patient private tutor 24/7.",
    whyMatch: {
      create: "Work through personalised maths challenges that adapt to your child's level",
      learn: "Patient AI tutor that adjusts difficulty in real-time — no judgement, just progress",
      together: "Review progress reports together and celebrate milestones",
      confident: "Designed for independent child use with optional parent monitoring",
    },
    link: "/ai-tools/synthesis-tutor",
    affiliate: true,
  },
  {
    name: "NotebookLM", slug: "notebooklm", category: ["learning"],
    minAge: 8, maxAge: 16, pricing: "free", safety: 5, creativity: 3, education: 5,
    supervision: "hands-on", difficulty: "beginner", sessionTime: "30min",
    description: "Google's AI research assistant that turns documents into podcasts, study guides, and mind maps — completely free.",
    whyMatch: {
      create: "Turn any topic into an engaging AI-generated podcast your child will actually listen to",
      learn: "Transform school materials into interactive study guides and summaries",
      together: "Create a podcast episode together about something your family is learning",
      confident: "Google-backed tool with no content generation concerns — works from your uploaded materials",
    },
    link: "/ai-tools/notebooklm",
  },
  {
    name: "Mindgrasp AI", slug: "mindgrasp-ai", category: ["learning"],
    minAge: 8, maxAge: 16, pricing: "free", safety: 5, creativity: 2, education: 5,
    supervision: "independent", difficulty: "beginner", sessionTime: "20min",
    description: "AI learning assistant that creates study materials, summaries, and flashcards from any content.",
    whyMatch: {
      create: "Turn any lesson or video into instant flashcards and study notes",
      learn: "Personalised study materials that focus on what your child needs to review",
      together: "Quiz each other using AI-generated flashcards from school topics",
      confident: "Designed for independent student use with safe educational content",
    },
    link: "/ai-tools/mindgrasp-ai",
  },
  {
    name: "Quizbot AI", slug: "quizbot-ai", category: ["learning"],
    minAge: 8, maxAge: 16, pricing: "free", safety: 4, creativity: 2, education: 5,
    supervision: "nearby", difficulty: "beginner", sessionTime: "15min",
    description: "AI quiz generator that creates custom tests from any content — makes revision actually fun.",
    whyMatch: {
      create: "Generate quizzes from any topic to make studying interactive and engaging",
      learn: "Test knowledge retention with AI-adapted questions that find gaps",
      together: "Create family quiz nights from topics everyone is learning about",
      confident: "Educational tool with content you control — safe for supervised student use",
    },
    link: "/ai-tools/quizbot-ai",
  },
  {
    name: "Teachable Machine", slug: "teachable-machine", category: ["learning", "coding"],
    minAge: 8, maxAge: 16, pricing: "free", safety: 5, creativity: 4, education: 5,
    supervision: "nearby", difficulty: "beginner", sessionTime: "30min",
    description: "Google's free tool where kids train their own AI to recognise images, sounds, and poses — no coding needed.",
    whyMatch: {
      create: "Train your own AI model — the only tool where kids build AI, not just use it",
      learn: "Understand how machine learning actually works through hands-on experimentation",
      together: "Train an AI to recognise family members, pets, or household objects together",
      confident: "Google-made educational tool — completely safe with no content concerns",
    },
    link: "/ai-tools/teachable-machine",
  },
  {
    name: "Doctrina AI", slug: "doctrina-ai", category: ["learning"],
    minAge: 10, maxAge: 16, pricing: "free", safety: 4, creativity: 2, education: 5,
    supervision: "hands-on", difficulty: "intermediate", sessionTime: "30min",
    description: "AI education platform for class notes, essay help, and interactive quizzes — built for students.",
    whyMatch: {
      create: "Summarise class notes and generate study materials automatically",
      learn: "AI-powered study companion that adapts to your child's curriculum",
      together: "Review AI-generated summaries together to ensure understanding, not copying",
      confident: "Parental guidance recommended to maintain academic integrity",
    },
    link: "/ai-tools/doctrina-ai",
  },
  {
    name: "Gemini Storybook", slug: "gemini-storybook", category: ["learning", "writing"],
    minAge: 5, maxAge: 10, pricing: "free", safety: 4, creativity: 4, education: 5,
    supervision: "nearby", difficulty: "beginner", sessionTime: "15min",
    description: "Free AI tool creating personalised 10-page illustrated storybooks with read-aloud narration in 45+ languages.",
    whyMatch: {
      create: "Create personalised storybooks starring your child in minutes — they love it",
      learn: "Build reading confidence with stories tailored to your child's interests and level",
      together: "Design bedtime stories together featuring family members and favourite things",
      confident: "Parent creates stories and reviews before sharing — content you control",
    },
    link: "/ai-tools/gemini-storybook",
  },
  {
    name: "LittleLit", slug: "littlelit", category: ["learning"],
    minAge: 4, maxAge: 12, pricing: "free", safety: 4, creativity: 3, education: 5,
    supervision: "nearby", difficulty: "beginner", sessionTime: "20min",
    description: "AI creative learning platform with personalised tutoring, storytelling, art, and STEM projects for kids 4-12.",
    whyMatch: {
      create: "Explore AI-powered creative projects across art, music, stories, and STEM",
      learn: "Personalised learning paths that adapt to your child's pace and interests",
      together: "Review AI interactions together and guide creative choices",
      confident: "Designed specifically for children with age-appropriate content and interactions",
    },
    link: "/ai-tools/littlelit",
  },
  {
    name: "Google Gemini", slug: "google-gemini-3-pro", category: ["learning", "coding"],
    minAge: 13, maxAge: 16, pricing: "free", safety: 4, creativity: 4, education: 5,
    supervision: "hands-on", difficulty: "intermediate", sessionTime: "60min",
    description: "Google's most advanced AI — excellent for research, coding help, and building interactive learning tools.",
    whyMatch: {
      create: "Build apps, write code, and create advanced projects with AI assistance",
      learn: "Deep research capabilities for school projects and self-directed learning",
      together: "Explore complex topics together — Gemini excels at breaking down difficult concepts",
      confident: "Requires separate Google account setup for under-18s with parental oversight",
    },
    link: "/ai-tools/google-gemini-3-pro",
  },
  // ── CODING ──
  {
    name: "AI Query", slug: "ai-query", category: ["coding"],
    minAge: 12, maxAge: 16, pricing: "free", safety: 4, creativity: 3, education: 5,
    supervision: "hands-on", difficulty: "intermediate", sessionTime: "45min",
    description: "AI-powered SQL query generator — converts plain English into database queries, making data skills accessible.",
    whyMatch: {
      create: "Write database queries in plain English — no SQL knowledge needed to start",
      learn: "Learn real-world data skills used in every tech company",
      together: "Explore databases together and learn how data powers the apps they use daily",
      confident: "Parental guidance recommended for understanding database concepts",
    },
    link: "/ai-tools/ai-query",
  },
];

const PROJECTS = [
  // Video + Art projects
  { title: "Create a Cinematic Nemo Short Film", age: "8-16", time: "1 hour", interests: ["video", "art"], link: "/projects/nemo-ai-short-film-kling-nano-banana" },
  { title: "Make a Viral AI Celebrity Selfie Video", age: "8-16", time: "1 hour", interests: ["video", "art"], link: "/projects/ai-celebrity-selfie-video-footballers" },
  { title: "Bring a Toy to Life with Cinematic AI Video", age: "5-16", time: "1 hour", interests: ["video", "art"], link: "/projects/kling-robot-toy-cinematic-video-ai" },
  { title: "Turn Yourself Into Movie Characters", age: "8-16", time: "45 min", interests: ["video", "art"], link: "/projects/turn-yourself-into-movie-characters-kling-motion-control" },
  { title: "Create a 20-Second Unicorn Animation", age: "5-10", time: "45 min", interests: ["video", "art"], link: "/projects/midjourney-animation-unicorn-story-kids" },
  { title: "Transform Movie Scenes Across Art Styles", age: "8-16", time: "45 min", interests: ["video", "art"], link: "/projects/transform-movie-scenes-zootopia-ai-project" },
  { title: "Turn Your Child Into a Cartoon Character with AI Voice", age: "5-16", time: "30 min", interests: ["video", "art"], link: "/projects/adobe-animate-audio-kids" },
  { title: "Turn Your Child Into a Plush Toy (and Make It Move!)", age: "5-16", time: "30 min", interests: ["video", "art"], link: "/projects/turn-child-into-plush-toy-move" },
  // Art projects
  { title: "Create Custom Coloring Pages From Any TV Show", age: "5-10", time: "15 min", interests: ["art"], link: "/projects/custom-coloring-pages-ai-nano-banana" },
  { title: "Create Coloring Pages From Your Child's Imagination", age: "5-10", time: "15 min", interests: ["art"], link: "/projects/ai-coloring-pages-higgsfield-nano-banana" },
  { title: "Turn a Photo Into a Pixar-Style Portrait", age: "5-16", time: "15 min", interests: ["art"], link: "/projects/pixar-ai-cartoon-kids" },
  { title: "Turn Your Child Into Their Footballing Hero", age: "8-16", time: "30 min", interests: ["art"], link: "/projects/turn-child-footballing-hero-ai-style" },
  { title: "Turn Your Child Into a Custom Action Figure", age: "5-16", time: "30 min", interests: ["art"], link: "/projects/turn-child-into-action-figure" },
  { title: "Turn Your Child's Drawing Into a 3D Character", age: "5-16", time: "30 min", interests: ["art", "coding"], link: "/projects/turn-kids-drawings-into-3d-characters" },
  // Learning projects
  { title: "Teach History with a NotebookLM Podcast", age: "5-16", time: "30 min", interests: ["learning"], link: "/projects/notebooklm-irish-famine-educational-podcast-kids" },
  { title: "Create Personalised School Stories to Calm First-Day Anxiety", age: "5-10", time: "30 min", interests: ["learning", "writing"], link: "/projects/gemini-storybook-first-day-school-anxiety" },
  { title: "The 5-Minute Spanish Challenge with AI", age: "5-16", time: "15 min", interests: ["learning"], link: "/projects/5-minute-spanish-challenge-bilingual-kids" },
  // Music + Video
  { title: "Make a Talking Baby Podcast of Yourself", age: "8-16", time: "30 min", interests: ["music", "video"], link: "/projects/ai-baby-podcast-guide" },
  // Writing + Learning
  { title: "Reveal a Family Holiday with an AI Treasure Hunt", age: "5-16", time: "1 hour", interests: ["writing", "learning"], link: "/projects/family-holiday-reveal-treasure-hunt-ai" },
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

  // Reward each matching interest (not just any match)
  const matches = (a.interests || []).filter((i) => tool.category.includes(i)).length;
  s += matches * 15;
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
  const scored = TOOLS.map((t) => ({ ...t, score: scoreTool(t, a) }))
    .filter((t) => t.score > 0)
    .sort((x, y) => y.score - x.score);
  // Pick top tools with category diversity (max 2 from same primary category)
  const picks = [];
  const catUsed = {};
  const count = a.experience === "never" ? 2 : 3;
  for (const t of scored) {
    if (picks.length >= count) break;
    const cat = t.category[0];
    if ((catUsed[cat] || 0) < 2) {
      picks.push(t);
      catUsed[cat] = (catUsed[cat] || 0) + 1;
    }
  }
  // If diversity filtering left us short, backfill
  if (picks.length < count) {
    for (const t of scored) {
      if (!picks.includes(t)) { picks.push(t); if (picks.length >= count) break; }
    }
  }
  return picks;
}

function getProject(a) {
  const [minA, maxA] = AGE_MAP[a.age] || [0, 99];
  const scored = PROJECTS.map((p) => {
    let s = 0;
    const [pMin, pMax] = p.age.split("-").map(Number);
    if (pMin > maxA || pMax < minA) return { ...p, score: -1 }; // age mismatch
    s += 10;
    const matches = (a.interests || []).filter((i) => p.interests.includes(i)).length;
    s += matches * 15;
    // Prefer quicker projects for younger/newer users
    if (a.experience === "never" && p.time === "15 min") s += 5;
    return { ...p, score: s };
  }).filter((p) => p.score > 0).sort((x, y) => y.score - x.score);
  // Pick randomly from top-scoring ties for variety
  if (scored.length === 0) return PROJECTS[0];
  const topScore = scored[0].score;
  const topTier = scored.filter((p) => p.score === topScore);
  return topTier[Math.floor(Math.random() * topTier.length)];
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
        <a href={`${CONFIG.SITE_URL}${tool.link}`}
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

      {/* Email Capture — positioned at peak engagement right after profile reveal */}
      {emailStep !== "done" ? (
        <div style={{ background: B.pinkLight, borderRadius: 16, padding: 24, marginBottom: 28, border: `2px solid ${B.pink}25`, textAlign: "center" }}>
          <p style={{ fontSize: 24, margin: "0 0 8px" }}>📧</p>
          <h4 style={{ fontSize: 18, fontWeight: 700, color: B.navy, margin: "0 0 8px" }}>Get your full personalised guide</h4>
          <p style={{ fontSize: 14, color: B.muted, margin: "0 0 16px", lineHeight: 1.5 }}>
            We'll send 8 tailored recommendations for your {profile.tier}, plus weekly discoveries from a dad who tests everything with his own kids first.
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

      {/* Project — highest value content first */}
      <div style={{ background: B.cyanLight, borderRadius: 16, padding: "20px 24px", marginBottom: 28, border: `2px solid ${B.cyan}30` }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: B.cyan, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>🎬 Try This First</p>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: B.navy, margin: "0 0 6px" }}>{project.title}</h4>
        <p style={{ fontSize: 14, color: B.muted, margin: "0 0 14px" }}>Ages {project.age} · {project.time} · Step-by-step family project</p>
        <a href={`${CONFIG.SITE_URL}${project.link}`}
          onClick={() => track("project_clicked", { project: project.title })}
          style={{ display: "inline-block", padding: "10px 20px", background: B.cyan, color: B.white, textDecoration: "none", borderRadius: 10, fontSize: 14, fontWeight: 700 }}>
          See Full Project →
        </a>
      </div>

      {/* Tools */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: B.navy, marginBottom: 4 }}>Your Top {tools.length} Recommended Tools</h3>
        <p style={{ fontSize: 14, color: B.muted, margin: "0 0 16px" }}>Personalised to your child's age, interests, and your priorities</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {tools.map((t, i) => <ToolCard key={t.slug} tool={t} answers={answers} index={i} />)}
        </div>
      </div>

      {/* Back to site CTA + Share + Restart */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <a href={CONFIG.SITE_URL + "/ai-tools"} style={{ display: "block", flex: 1, padding: "14px 20px", background: B.navy, color: "#fff", borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none", textAlign: "center", transition: "opacity 0.15s" }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 0.9}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 1}>
            Explore All 50+ Tools →
          </a>
        </div>
        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <button onClick={() => { if (navigator.share) navigator.share({ title: "Is Your Child AI-Ready?", text: `I just found out my child is an ${profile.tier}! Take this free 2-minute assessment:`, url: window.location.href }); }}
            style={{ flex: 1, padding: "10px 20px", border: `2px solid ${B.border}`, borderRadius: 10, background: "transparent", color: B.navy, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            📤 Share Results
          </button>
          <button onClick={onRestart} style={{ flex: 1, padding: "10px 20px", border: `2px solid ${B.border}`, borderRadius: 10, background: "transparent", color: B.muted, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            ↻ Take Again
          </button>
        </div>
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, paddingBottom: 20, borderBottom: `1px solid ${B.border}` }}>
          <a href={CONFIG.SITE_URL} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <img src="https://cdn.prod.website-files.com/685c147bf76d5fad7df51614/691f05b17d8c606fdded223d_ai-tools-for-kids-logo-webclip.png" alt="AI Tools for Kids" style={{ height: 28, borderRadius: 6 }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: B.navy, letterSpacing: 0.3 }}>AI Tools for Kids</span>
          </a>
          <a href={CONFIG.SITE_URL} style={{ textDecoration: "none", fontSize: 13, color: B.muted, fontWeight: 500, display: "flex", alignItems: "center", gap: 4, transition: "color 0.15s" }}
            onMouseEnter={(e) => e.currentTarget.style.color = B.navy}
            onMouseLeave={(e) => e.currentTarget.style.color = B.muted}>
            ← Back to site
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
