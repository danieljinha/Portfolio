// ============================================================================
// PROJECT DATA — split across two sections of the site:
//
//   `agencyProject`  → the "My Marketing Agency" story section (single
//                      featured piece: the SMMA documentary motion graphic).
//
//   `showcase`       → the "Add Life to Your Products and Ads" carousel
//                      (product ad concepts). Edit this array to add/swap
//                      cards — the carousel adapts to whatever's here.
//
// Shape for both: { title, category, description, media, link }.
// `media.type` is 'image' or 'video'; `media.src` is a root-relative path
// served from /public.
// ============================================================================

export const agencyProject = {
  id: 'bsmma-doc',
  title: 'How to Build an SMMA From Scratch',
  category: 'Motion Graphics · Documentary',
  description:
    'Pre-production motion graphic package for the TMU documentary I directed and produced, leading a four-person crew from pitch to final cut.',
  media: { type: 'video', src: '/work/bsmma-motion-graphic.mp4' },
  link: '#',
};

// Standalone feature for the "Use Motion..." section — a single proof-piece
// demonstrating what motion adds over a static product photo, shown before
// visitors reach the full product-ad carousel below it.
// TODO(Daniel): confirm you hold the rights to publish this exact clip
// before the real launch — flagging since it started life in this project
// as animation-style reference rather than a delivered client asset.
export const motionProject = {
  id: 'keyboard-3d-motion',
  title: 'Product Reveal, in Motion',
  category: 'Motion Graphics · 3D Product Animation',
  media: { type: 'video', src: '/generated/keyboard-3d-motion.mp4' },
  link: '#',
};

// TODO(Daniel): the first entry is your real client work. The rest are
// original concepts commissioned for this build — swap `media`, `title`,
// `category`, `description`, and `link` per entry to add real case studies;
// the carousel layout adapts to whatever's here, no code changes needed.
export const showcase = [
  {
    id: 'padel-plus',
    title: 'What Is Padel?',
    category: 'Social Media · Content Design',
    description:
      'Instagram awareness post produced for Padel Plus, introducing the sport to a cold audience with bold type and high-energy sport photography.',
    media: { type: 'image', src: '/work/padel-plus-post.png' },
    // TODO(Daniel): link to the live Instagram post / client site.
    link: '#',
  },
  {
    id: 'padel-product-ad',
    title: 'Your Padel Gear, All in One Place',
    category: 'Paid Social · Product Ad',
    description:
      'Action-shot product ad for Padel Plus — mid-swing photography with on-court motion blur, built to sell the gear players actually use.',
    media: { type: 'image', src: '/work/padel-product-ad.png' },
    link: '#',
  },
  {
    id: 'padel-instagram-shoe',
    title: 'Padel Gear — Footwear',
    category: 'Social Media · Product Ad',
    description:
      'Close-up footwear ad for Padel Plus, bold color-shifted studio treatment built for the scroll — stops the thumb before the caption loads.',
    media: { type: 'image', src: '/work/padel-instagram-shoe.png' },
    link: '#',
  },
  {
    id: 'grove-animation',
    title: 'Grove — Plant Protein',
    category: 'Motion Graphics · Product Commercial',
    description:
      'Original packaging concept and product commercial — swirling gold liquid orbiting a stand-up pouch, premium supplement studio energy.',
    media: {
      type: 'video',
      src: '/generated/grove-animation.mp4',
      poster: '/generated/grove-product.png',
    },
    link: '#',
    placeholder: true,
  },
  {
    id: 'citra-product',
    title: 'Citra — Sparkling Fruit Tea',
    category: 'Packaging Design · Product Photography',
    description:
      'Original beverage brand and packaging concept — illustrated fruit pattern, bubble-letter wordmark, shot against a sunlit orange grove.',
    media: { type: 'image', src: '/generated/citra-product.png' },
    link: '#',
    placeholder: true,
  },
];
