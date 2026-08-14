/**
 * Tailwind config for the production build (processed via PostCSS by Vite).
 *
 * NOTE: the zero-build preview.html uses the Tailwind CDN's runtime JIT
 * compiler instead of this file (CDN doesn't read local configs), with an
 * inline `tailwind.config = {...}` that mirrors this theme.extend object.
 * If you change a token here, mirror it there too — see preview.html.
 */
export default {
  content: ['./index.html', './preview.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#f4f1ea',
          dim: 'rgba(244,241,234,0.62)',
          faint: 'rgba(244,241,234,0.38)',
        },
        // "Botanical Dark Luxury" — warm near-black + beige/brown accents
        // (see /Styleguide). No green in the accent role.
        graphite: {
          DEFAULT: '#15120e',
          raised: '#1c1712',
          panel: '#241d16',
        },
        khaki: {
          DEFAULT: '#937c5c',
          bright: '#c2b7a1',
          dim: 'rgba(147,124,92,0.5)',
        },
        walnut: {
          DEFAULT: '#5a3f2b',
          bright: '#866246',
          dim: 'rgba(90,63,43,0.55)',
        },
        // Deep, muted forest green — used sparingly (ambient glow, glass
        // tint), never as primary UI/text accent. Not the bright green from
        // the previous pass.
        emerald: {
          DEFAULT: '#293e2f',
          bright: '#3d5d4b',
          dim: 'rgba(41,62,47,0.55)',
        },
        hairline: 'rgba(244,241,234,0.12)',
      },
      fontFamily: {
        sans: ['"General Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.045em',
        tighter: '-0.03em',
      },
      transitionTimingFunction: {
        cinematic: 'cubic-bezier(0.16, 1, 0.3, 1)',
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
