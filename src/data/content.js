// ============================================================================
// SITE COPY — bio, stats, services, process, contact
// Sourced directly from Daniel's resume. Edit freely — nothing here touches
// layout or animation code.
// ============================================================================

export const brand = {
  name: 'Daniel Jin-Ha Chun',
  studio: 'Salt & Light Media',
  location: 'Toronto, ON',
  tagline: 'Media Marketing & AI-Driven Web Design',
  valueProp: 'Boutique creative direction for brands who’d rather be seen than blend in.',
  email: 'daniel.jinha4@gmail.com',
  phone: '(647) 409-4646',
  // TODO(Daniel): swap in real profile links when ready — kept as graceful placeholders.
  socials: [
    { label: 'Instagram', href: '#' },
    { label: 'LinkedIn', href: '#' },
    { label: 'TikTok', href: '#' },
  ],
};

export const bio = {
  heading: 'I had nothing but what I’d learned.',
  // First person, on purpose — this is the one section on the site meant to
  // land emotionally rather than sell a service. Keeps close to Daniel's own
  // words rather than smoothing them into agency-speak.
  paragraphs: [
    'I started Salt & Light Media during a hard stretch. My family had left for Korea, and I was here in Canada on my own — broke, with nothing but the skills I’d learned in TMU’s Media Production program, which I still think is the best in the country.',
    'That was the whole starting kit. No investors, no safety net — I planned it, funded it, and executed the creation of Salt & Light Media with my team, who believed in it before there was much reason to.',
    'It’s still the standard I hold client work to: figure it out with what you actually have, not what you wish you had.',
  ],
};

// "My Marketing Agency" section — the origin story behind Salt & Light,
// built around the SMMA documentary. Same facts as `bio`, told at full
// length instead of compressed into a sentence.
export const agency = {
  heading: 'My Marketing Agency',
  paragraphs: [
    'Before Salt & Light Media existed on paper, it existed on camera. My thesis project at TMU — "How to Build an SMMA From Scratch" — followed the real process of starting a social media agency, filmed while I was actually living it.',
    'I directed and produced it myself, running a four-person crew from the first pitch to the final cut. Same instincts I use on client work now: keep the schedule real, keep the budget honest, keep people moving toward a deadline.',
    'I launched the agency in 2025. Everything I actually knew about handling pressure came from six-plus years in hospitality before that — reading a room, adjusting on the fly, not losing it when something breaks. Turns out that’s most of the job.',
  ],
};

export const stats = [
  { value: 50, suffix: '+', label: 'Commercial & independent media projects produced' },
  { value: 1000, suffix: '+', label: 'Organic social followers grown' },
  { value: 1, suffix: '', label: 'Salt & Light Media, founded in 2025', display: 'Co-Founder' },
];

export const services = [
  {
    id: 'media-marketing',
    title: 'Media Marketing',
    summary: 'Campaigns built to be watched, shared, and acted on.',
    description:
      'End-to-end social and paid media for local businesses — strategy, production, and media buying under one roof, so the creative and the targeting are never fighting each other.',
    capabilities: [
      'Meta advertising & campaign management',
      'Social media strategy & content calendars',
      'Video production — concept to delivery',
      'Content campaigns built around real client goals',
    ],
    media: { type: 'video', src: '/work/media-marketing-reel.mp4' },
  },
  {
    id: 'ai-web-design',
    title: 'AI-Optimized Website Creation',
    summary: 'Fast, modern, conversion-first — built with AI-assisted workflows.',
    description:
      'Websites designed to load fast, read clearly, and convert — using AI-assisted workflows to move from concept to production without sacrificing craft.',
    capabilities: [
      'Conversion-focused UX & information architecture',
      'AI-assisted design & development workflow',
      'Fast, modern front-end builds',
      'Ongoing iteration based on real performance data',
    ],
    // Original concept mockup (not a real client) — style-referenced from
    // Daniel's /aiwebsites moodboard, not reproducing any site in it.
    media: { type: 'image', src: '/generated/ai-website-mockup.png' },
  },
];

export const process = [
  {
    step: '01',
    title: 'Discover',
    description: 'Understand the brand, the audience, and what success actually needs to look like.',
  },
  {
    step: '02',
    title: 'Strategy',
    description: 'Turn that understanding into a plan — channels, message, media, timeline.',
  },
  {
    step: '03',
    title: 'Create',
    description: 'Produce the work — shoot, edit, design, build — with craft at every step.',
  },
  {
    step: '04',
    title: 'Launch',
    description: 'Ship it, measure it, and refine based on how it actually performs.',
  },
];
