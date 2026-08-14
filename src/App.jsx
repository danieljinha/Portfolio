// ============================================================================
// Salt & Light Media — single-page portfolio site.
//
// This one file is the entire React app on purpose (see brief: "single-file
// React component ... clearly organized"). It is loaded two ways that both
// resolve to the exact same code, so there is nothing to keep in sync:
//
//   1. Production (Vite):     index.html      -> <script type="module" src="/src/App.jsx">
//   2. Zero-build preview:    preview.html     -> <script type="text/babel" data-type="module" src="/src/App.jsx">
//
// Content lives in ./data/content.js and ./data/projects.js — edit those,
// not this file, to change copy or swap portfolio pieces.
//
// Search this file for "SWAP IN" to find every spot meant for real photos,
// video, or final copy.
// ============================================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  animate,
} from 'framer-motion';

// NOTE: these are root-absolute (/src/...), not relative (./...). Babel
// Standalone's zero-build preview injects this file as a <script> whose
// base URL is the document, not /src/App.jsx, so a relative import like
// './hooks/useLenis.js' would resolve to /hooks/useLenis.js and 404. Vite
// resolves /src/... from the project root just fine too, so one form works
// identically in both environments.
import { useLenis } from '/src/hooks/useLenis.js';
import { useReducedMotion, useIsTouchDevice } from '/src/hooks/useReducedMotion.js';
import { useCountUp } from '/src/hooks/useCountUp.js';
import { useMagnetic } from '/src/hooks/useMagnetic.js';
import { brand, bio, agency, stats, services, process as processSteps } from '/src/data/content.js';
import { agencyProject, motionProject, showcase } from '/src/data/projects.js';

// ---------------------------------------------------------------------------
// Motion tokens — cinematic cubic-beziers, not linear/default ease.
// ---------------------------------------------------------------------------
const EASE = [0.16, 1, 0.3, 1]; // expo-out: fast start, long soft settle
const EASE_SOFT = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 1, ease: EASE } },
};

const staggerParent = (delay = 0.09, start = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: delay, delayChildren: start } },
});

// Lenis owns the scroll position once it's active — a plain
// element.scrollIntoView()/window.scrollTo() moves the native scrollTop,
// but Lenis doesn't know that happened and snaps back to its own tracked
// position on the next frame. Every in-page jump link goes through this
// context so it asks Lenis directly (and falls back to native smooth-scroll
// when Lenis is off, e.g. reduced-motion or touch).
const LenisContext = React.createContext(null);

function useScrollToId() {
  const lenisRef = React.useContext(LenisContext);
  return (id, reduced) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenisRef && lenisRef.current) {
      lenisRef.current.scrollTo(el, { duration: reduced ? 0 : 1.2 });
    } else {
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    }
  };
}

// Order mirrors the page's actual top-to-bottom flow.
const NAV_LINKS = [
  { id: 'motion', label: 'Motion' },
  { id: 'work', label: 'Work' },
  { id: 'agency', label: 'Agency' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'process', label: 'Process' },
  { id: 'contact', label: 'Contact' },
];

// ============================================================================
// CURSOR — small dot + trailing ring, lerped toward the pointer every frame.
// Morphs (scales up + shows a label) when hovering anything with a
// data-cursor="Label" attribute. Never rendered on touch devices or under
// prefers-reduced-motion (App gates that).
// ============================================================================
function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [hovering, setHovering] = useState(false);
  const [label, setLabel] = useState('');

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf;

    function onMove(e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%,-50%)`;
    }
    function onOver(e) {
      const t = e.target.closest && e.target.closest('[data-cursor]');
      if (t) {
        setHovering(true);
        setLabel(t.getAttribute('data-cursor') || '');
      }
    }
    function onOut(e) {
      const t = e.target.closest && e.target.closest('[data-cursor]');
      if (t) {
        setHovering(false);
        setLabel('');
      }
    }
    function loop() {
      // Lerp, not a straight snap — the ring visibly trails the dot.
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      if (ring) ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    document.documentElement.classList.add('has-custom-cursor');

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      document.documentElement.classList.remove('has-custom-cursor');
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" style={{ opacity: hovering ? 0 : 1 }} />
      <div
        ref={ringRef}
        className="cursor-ring"
        style={{ width: hovering ? 74 : 40, height: hovering ? 74 : 40 }}
      >
        {label}
      </div>
    </>
  );
}

// ============================================================================
// PRELOADER — brief name-assembly animation. Skippable via click/keydown.
// Total time-to-dismiss stays under ~1.3s even if the visitor never touches
// anything; reduced-motion gets a fast plain fade instead.
// ============================================================================
function Preloader({ onDone, reduced }) {
  const [visible, setVisible] = useState(true);

  // Long enough to feel like a deliberate signature-reveal, not a spinner —
  // ~3.7s total (reveal + hold + exit) at full motion, much shorter and
  // simpler under reduced-motion.
  const DISPLAY_MS = reduced ? 500 : 3200;
  const EXIT_MS = reduced ? 300 : 550;

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), DISPLAY_MS);
    const skip = () => setVisible(false);
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, [reduced, DISPLAY_MS]);

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(onDone, EXIT_MS);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [visible, onDone, EXIT_MS]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-graphite px-6"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: EXIT_MS / 1000, ease: EASE } }}
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0.3 : 0.7, ease: EASE }}
            className="text-xs font-medium uppercase tracking-[0.35em] text-khaki"
          >
            {brand.studio}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduced ? { duration: 0.35 } : { duration: 1.1, delay: 0.35, ease: EASE }}
            className="preloader-display text-center leading-[0.94] text-ink text-[15vw] sm:text-7xl md:text-8xl lg:text-[7.2rem]"
          >
            <span className="italic">Daniel</span>
            <br />
            <span>Jin-Ha Chun</span>
          </motion.h1>

          <motion.span
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={
              reduced
                ? { duration: 0.3, delay: 0.15 }
                : { duration: 0.7, delay: 1.6, ease: EASE }
            }
            className="h-px w-16 origin-center bg-khaki-bright/70"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// GRAIN — fixed, ~4.5% opacity film-grain overlay. Pure CSS, no image asset.
// ============================================================================
function Grain() {
  return <div className="grain-overlay" aria-hidden="true" />;
}

// ============================================================================
// NAV — floating frosted-glass pill, styleboard-referenced. Emerald underline
// tracks scroll progress.
// ============================================================================
function Nav({ reduced }) {
  const { scrollYProgress } = useScroll();
  const width = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const magRef = useMagnetic({ radius: 70, strength: 0.3, disabled: reduced });
  const scrollToId = useScrollToId();
  const [menuOpen, setMenuOpen] = useState(false);
  const go = (id) => {
    setMenuOpen(false);
    scrollToId(id, reduced);
  };

  // Lock background scroll while the mobile menu overlay is open.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <>
      {/* Centering (-translate-x-1/2) lives on this static wrapper, separate
          from the motion.div below — Framer Motion writes its own inline
          `transform` for the y/opacity entrance, which would otherwise
          clobber a Tailwind transform utility on the same element (inline
          style always wins over a class, regardless of specificity). */}
      <header className="fixed top-5 left-1/2 z-50 -translate-x-1/2 w-[min(94%,880px)]">
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1, ease: EASE }}
        >
        <div className="glass-panel relative flex items-center justify-between rounded-full px-5 py-2.5 md:px-7 md:py-3 overflow-hidden">
          <motion.div
            className="pointer-events-none absolute bottom-0 left-0 h-[1.5px] bg-khaki-bright"
            style={{ width }}
          />
          <a
            href="#top"
            onClick={(e) => { e.preventDefault(); go('top'); }}
            data-cursor="Home"
            className="font-medium tracking-tight text-sm md:text-[15px] whitespace-nowrap"
          >
            Salt &amp; Light
          </a>
          <nav className="hidden md:flex items-center gap-6 text-[13px] text-ink-dim">
            {NAV_LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => go(l.id)}
                data-cursor="Go"
                className="transition-colors duration-300 hover:text-ink"
              >
                {l.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle — the nav list above is desktop-only
                (hidden md:flex); below that breakpoint this is the only way
                to reach any section besides scrolling by hand. */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              data-cursor={menuOpen ? 'Close' : 'Menu'}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="relative flex h-8 w-8 flex-col items-center justify-center gap-[5px] md:hidden"
            >
              <motion.span
                animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 5.5 : 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="h-px w-5 bg-ink"
              />
              <motion.span
                animate={{ opacity: menuOpen ? 0 : 1 }}
                transition={{ duration: 0.2 }}
                className="h-px w-5 bg-ink"
              />
              <motion.span
                animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -5.5 : 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="h-px w-5 bg-ink"
              />
            </button>
            <a
              ref={magRef}
              href={`mailto:${brand.email}`}
              data-cursor="Say hi"
              className="rounded-full bg-khaki px-4 py-1.5 text-[13px] font-medium text-graphite transition-colors duration-300 hover:bg-khaki-bright whitespace-nowrap"
            >
              Let&rsquo;s talk
            </a>
          </div>
        </div>
        </motion.div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-0 z-40 bg-graphite/98 backdrop-blur-md md:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.nav
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.4, delay: 0.05, ease: EASE }}
              className="flex h-full flex-col items-center justify-center gap-1"
            >
              {NAV_LINKS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => go(l.id)}
                  data-cursor="Go"
                  className="py-3 font-serif text-4xl italic text-ink transition-colors duration-300 hover:text-khaki-bright"
                >
                  {l.label}
                </button>
              ))}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// HERO
// ============================================================================
function Hero({ reduced }) {
  // Full-bleed reel: muted autoplay + loop as soon as the hero exists on
  // screen — no scroll-jacking, no hover gating, no player chrome. It's
  // ambient footage behind the headline, not an interactive video player.
  const videoRef = useRef(null);
  const magRef = useMagnetic({ radius: 110, strength: 0.25, disabled: reduced });
  const scrollToId = useScrollToId();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

  return (
    <section
      id="top"
      className="relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 pt-32 pb-10 md:px-10"
    >
      {/* Hero video — autoplays muted/looped on load. SWAP IN:
          /public/hero/hero-video.mp4 is the color-graded, dolly-zoom edit of
          HeroSectionVideo.mp4 — replace the file to change the shot, no code
          change needed. */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="atmo-grid absolute inset-0 z-10" />
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src="/hero/hero-video.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className="animate-drift-a absolute -top-1/4 left-[8%] h-[55vh] w-[55vh] rounded-full bg-emerald/[0.10] blur-[110px] mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-graphite/80 via-graphite/20 to-graphite" />
        <div className="absolute inset-0 bg-gradient-to-r from-graphite/70 via-transparent to-graphite/40" />
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <motion.div initial="hidden" animate="show" variants={staggerParent(0.12, 1.35)} className="max-w-5xl">
          <motion.h1
            variants={fadeUp}
            className="font-serif text-[15vw] leading-[0.94] tracking-tight sm:text-7xl md:text-8xl lg:text-[7.2rem]"
          >
            <span className="italic font-normal">Daniel</span>
            <br />
            <span className="font-medium">Jin-Ha Chun</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-8 max-w-xl text-lg font-light text-ink-dim md:text-xl"
          >
            <span className="font-serif italic text-ink">Media Marketing</span> &amp; AI-Driven Web
            Design.
          </motion.p>

          <motion.p variants={fadeUp} className="mt-3 max-w-md text-sm text-ink-faint md:text-base">
            {brand.valueProp}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-4">
            <a
              ref={magRef}
              href="#work"
              onClick={(e) => { e.preventDefault(); scrollToId('work', reduced); }}
              data-cursor="View"
              className="rounded-full bg-khaki px-7 py-3.5 text-sm font-medium text-graphite transition-colors duration-300 hover:bg-khaki-bright"
            >
              View Selected Work
            </a>
            <a
              href="#contact"
              onClick={(e) => { e.preventDefault(); scrollToId('contact', reduced); }}
              data-cursor="Go"
              className="rounded-full border border-hairline px-7 py-3.5 text-sm font-medium text-ink transition-colors duration-300 hover:border-khaki-dim hover:text-khaki-bright"
            >
              Start a Project
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// MOTION — single-piece proof section, right after the Hero: header first,
// then the reel underneath it. What motion adds over a static product
// photo, made concrete in one clip before the full product-ad carousel.
// ============================================================================
// Signature reveal — an opaque shutter panel that slides off, not another
// fadeUp. Used sparingly (Motion's video, About's portrait) so it reads as
// an authored moment rather than the page's default motion. Content beneath
// is always mounted at full opacity; only the cover panel animates (a plain
// x-transform, not a clip-path string) — the reliable route in this stack.
function ClipReveal({ children, className = '', from = 'left' }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <motion.div
        initial={{ x: '0%' }}
        whileInView={{ x: from === 'left' ? '101%' : '-101%' }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.9, ease: EASE }}
        className="pointer-events-none absolute inset-0 bg-graphite"
      />
    </div>
  );
}

function Motion() {
  // Asymmetric split instead of the centered heading-then-content stack
  // used elsewhere: heading and reel sit in unbalanced columns (5/7), heading
  // resting on the reel's baseline rather than stacked above it.
  return (
    <section id="motion" className="px-6 py-32 md:px-10 md:py-44">
      <div className="mx-auto max-w-6xl md:grid md:grid-cols-12 md:items-end md:gap-8 lg:gap-12">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          className="text-4xl leading-[1.05] tracking-tighter font-bold md:col-span-5 md:text-5xl lg:text-6xl"
        >
          Use <span className="font-serif italic text-khaki-bright">motion</span> to make your
          products feel premium and high-quality.
        </motion.h2>

        <ClipReveal from="left" className="mt-14 md:col-span-7 md:mt-0">
          <a
            href={motionProject.link}
            data-cursor="View"
            className="glass-panel group relative block aspect-video overflow-hidden rounded-2xl"
          >
            <ProjectMedia media={motionProject.media} title={motionProject.title} lazyAutoPlay />
            <div className="absolute inset-0 bg-gradient-to-t from-graphite/80 via-transparent to-transparent" />
            <div className="absolute inset-x-4 bottom-4 md:inset-x-6 md:bottom-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-khaki-bright">
                {motionProject.category}
              </p>
              <p className="mt-1 text-sm font-medium text-ink md:text-base">{motionProject.title}</p>
            </div>
          </a>
        </ClipReveal>
      </div>
    </section>
  );
}

// ============================================================================
// ABOUT
// ============================================================================
function StatCounter({ stat, reduced }) {
  const [ref, value] = useCountUp({ target: stat.value, reduced });
  return (
    <div ref={ref} className="border-t border-hairline py-8 first:border-t-0 md:border-t-0 md:border-l md:py-0 md:pl-8 md:first:border-l-0 md:first:pl-0">
      <div className="font-serif text-5xl italic text-khaki-bright md:text-6xl">
        {stat.display || value.toLocaleString()}
        <span className="text-3xl md:text-4xl">{stat.suffix}</span>
      </div>
      <p className="mt-3 max-w-[22ch] text-sm text-ink-dim">{stat.label}</p>
    </div>
  );
}

function About() {
  return (
    <section id="about" className="relative px-6 py-32 md:px-10 md:py-44">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          className="max-w-3xl text-4xl leading-[1.05] tracking-tighter font-bold md:text-6xl"
        >
          I had nothing
          <br />
          but what I’d <span className="font-serif italic text-khaki-bright">learned.</span>
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerParent(0.12)}
          className="mt-14 grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-16"
        >
          <div className="space-y-6">
            {bio.paragraphs.map((p, i) => (
              <motion.p key={i} variants={fadeUp} className="text-base font-light leading-relaxed text-ink-dim md:text-lg">
                {p}
              </motion.p>
            ))}
          </div>

          <ClipReveal from="right" className="glass-panel relative aspect-[4/5] overflow-hidden rounded-2xl md:justify-self-end md:w-full">
            <img
              src="/about/portrait.png"
              alt="Me at my Toronto Metropolitan University graduation"
              className="h-full w-full object-cover"
              style={{ objectPosition: 'center 15%' }}
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-graphite/40 via-transparent to-transparent" />
          </ClipReveal>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerParent(0.1)}
          className="mt-20 grid gap-8 border-t border-hairline pt-14 md:grid-cols-3 md:gap-12"
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp}>
              <StatCounter stat={s} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// SERVICES
// ============================================================================
function ServiceCard({ service, reduced }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      variants={fadeUp}
      onHoverStart={() => setOpen(true)}
      onHoverEnd={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
      data-cursor="Explore"
      className="glass-panel group relative isolate flex min-h-[420px] cursor-pointer flex-col overflow-hidden rounded-3xl p-8 transition-colors duration-500 md:min-h-[520px] md:p-12"
    >
      {/* A real demo of what this service produces, not an empty glass box —
          a still for the AI-website concept, actual reel footage for media
          marketing. Gradient protects both the title (top) and the
          hover-revealed copy (bottom) while still letting the work show. */}
      <div className="absolute inset-0 -z-10">
        <ProjectMedia media={service.media} title={service.title} lazyAutoPlay />
        <div className="absolute inset-0 bg-gradient-to-b from-graphite/90 via-graphite/50 to-graphite/90" />
      </div>
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-khaki/10 blur-[80px] transition-opacity duration-500"
        style={{ opacity: open ? 1 : 0.3 }}
      />
      {/* No 01/02 numeral here on purpose — these two services run in
          parallel, not in sequence, so a number would imply an order that
          doesn't exist. */}
      <div className="flex items-start justify-end">
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-2xl text-ink-faint"
        >
          +
        </motion.span>
      </div>

      <div className="mt-6 md:mt-8">
        <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">{service.title}</h3>
        <p className="mt-4 text-lg font-light text-ink-dim md:text-xl">{service.summary}</p>

        <motion.div
          animate={{ height: open || reduced ? 'auto' : 0, opacity: open || reduced ? 1 : 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="overflow-hidden"
        >
          <p className="mt-6 max-w-md text-sm font-light leading-relaxed text-ink-dim">{service.description}</p>
          <ul className="mt-6 space-y-3">
            {service.capabilities.map((c) => (
              <li key={c} className="flex items-center gap-3 text-sm text-ink">
                <span className="h-px w-5 bg-khaki-bright" />
                {c}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
}

function Services({ reduced }) {
  return (
    <section id="services" className="relative isolate px-6 py-32 md:px-10 md:py-44">
      {!reduced && <MoodBackdrop src="/mood/desk-camera.jpg" objectPosition="center 30%" />}
      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            className="max-w-xl text-4xl leading-[1.05] tracking-tighter font-bold md:text-6xl"
          >
            Two crafts, <span className="font-serif italic text-khaki-bright">one</span> studio.
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="max-w-xs text-sm text-ink-faint"
          >
            Pick one, or run both together — most clients do.
          </motion.p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-120px' }}
          variants={staggerParent(0.15)}
          className="mt-16 grid gap-6 md:grid-cols-2 md:gap-8"
        >
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} reduced={reduced} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// MOOD BACKDROP — ambient, heavily-blurred, darkened photography behind
// otherwise-empty section backgrounds (from /Styleguide's mood references).
// Deliberately understated: low opacity, blurred, a dark gradient sits on
// top of it, and it drifts very slowly via the same keyframes the hero's
// ambient blobs use — texture and depth, not a second visual subject
// competing with the real content in front of it.
// ============================================================================
function MoodBackdrop({ src, objectPosition = 'center' }) {
  // Full-bleed, not a small corner blob — at low opacity a small shape reads
  // as a smudge; the full frame at ~25% is what actually registers as "a
  // photo living behind the content" instead of just extra graphite.
  // One settle-in on scroll, not an infinite loop (see note below on why
  // this project keeps continuous ambient motion to just Hero + About).
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.img
        src={src}
        alt=""
        initial={{ opacity: 0, scale: 1.12 }}
        whileInView={{ opacity: 0.26, scale: 1.04 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 1.8, ease: EASE }}
        style={{ objectPosition }}
        className="h-full w-full object-cover blur-[5px] grayscale-[10%] saturate-[85%]"
      />
      {/* One soft gradient, not a stack — enough to protect text contrast
          top/bottom without crushing the image back to invisible. */}
      <div className="absolute inset-0 bg-gradient-to-b from-graphite/50 via-transparent to-graphite/80" />
    </div>
  );
}

// ============================================================================
// SELECTED WORK — fully data-driven from ./data/projects.js.
// ============================================================================
function ProjectMedia({ media, title, videoRef, lazyAutoPlay, ...videoProps }) {
  // `lazyAutoPlay`: play once the clip is actually on screen, pause once it
  // isn't — NOT the native <video autoplay> attribute fired blindly at
  // mount, which made every ambient clip (Motion, both Services cards,
  // Agency) start buffering the instant the page loaded, all at once,
  // regardless of scroll position (~50MB of simultaneous requests before a
  // visitor has scrolled a single section). ShowcaseCard drives its own
  // video externally (via videoRef) and never passes this, so it's
  // untouched.
  //
  // The `autoplay` HTML attribute is still kept ON the element (just with
  // no `src` until it's actually in view) rather than relying purely on a
  // scripted `.play()` call. That matters for one specific real case: under
  // iOS Low Power Mode (or any autoplay-blocking situation), a scripted
  // `.play()` with no declarative `autoplay` attribute just fails silently
  // — the video sits there looking broken with no way to start it. With
  // the attribute present, the browser instead falls back to its own
  // native tap-to-play button, same as Hero already gets. Confirmed via a
  // real device screen recording: Hero (has the attribute) showed a play
  // button under Low Power Mode; these (didn't have it) showed nothing.
  const internalRef = useRef(null);

  useEffect(() => {
    if (!lazyAutoPlay || media.type !== 'video') return undefined;
    const video = internalRef.current;
    if (!video || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!video.src) video.src = media.src;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [lazyAutoPlay, media.src, media.type]);

  if (media.type === 'video') {
    return (
      <video
        ref={(el) => {
          internalRef.current = el;
          if (typeof videoRef === 'function') videoRef(el);
          else if (videoRef) videoRef.current = el;
        }}
        className="h-full w-full object-cover"
        src={lazyAutoPlay ? undefined : media.src}
        poster={media.poster}
        autoPlay={lazyAutoPlay ? true : undefined}
        muted
        loop
        playsInline
        preload={lazyAutoPlay ? 'none' : 'metadata'}
        {...videoProps}
      />
    );
  }
  return <img className="h-full w-full object-cover" src={media.src} alt={title} loading="lazy" />;
}

// ============================================================================
// AGENCY — "My Marketing Agency" story section. The SMMA documentary lives
// here on its own, separate from the product-ad showcase below, since it's
// a different kind of work (a personal story, not a client commission).
// ============================================================================
function Agency() {
  // Video leads, then the title and story follow underneath — a premiere,
  // not a two-column feature block. Watch first, then read what it was.
  return (
    <section id="agency" className="px-6 py-32 md:px-10 md:py-44">
      <div className="mx-auto max-w-6xl">
        <motion.a
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          href={agencyProject.link}
          data-cursor="View"
          className="glass-panel group relative block aspect-video overflow-hidden rounded-2xl"
        >
          <ProjectMedia media={agencyProject.media} title={agencyProject.title} lazyAutoPlay />
          <div className="absolute inset-0 bg-gradient-to-t from-graphite/85 via-transparent to-transparent" />
          <div className="absolute inset-x-4 bottom-4 md:inset-x-6 md:bottom-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-khaki-bright">
              {agencyProject.category}
            </p>
            <p className="mt-1 text-sm font-medium text-ink md:text-base">{agencyProject.title}</p>
          </div>
        </motion.a>

        {/* Magazine-style split instead of a stacked column: heading and
            story sit in unbalanced facing columns, not one above the other. */}
        <div className="mt-16 md:grid md:grid-cols-12 md:gap-8 lg:gap-16">
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            className="text-4xl leading-[1.05] tracking-tighter font-bold md:col-span-4 md:text-5xl"
          >
            My Marketing <span className="font-serif italic text-khaki-bright">Agency.</span>
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="mt-8 space-y-6 md:col-span-7 md:col-start-6 md:mt-2"
          >
            {agency.paragraphs.map((p, i) => (
              <p key={i} className="text-base font-light leading-relaxed text-ink-dim md:text-lg">
                {p}
              </p>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SHOWCASE — "Add Life to Your Products and Ads" carousel.
//
// Stacked drag carousel adapted from a shadcn-style "carousel-07" component
// the brief referenced. This project isn't a shadcn/TypeScript codebase (see
// note in data/projects.js and the conversation this was requested in) —
// framer-motion (already a dependency; "motion/react" is the same library
// under its newer package name) supplies the exact primitives the original
// used, so the drag physics and stacked-card math below are a direct port,
// not a reimplementation. The only real addition is video-on-hover: the
// active (centered) card plays its clip while the cursor is over the
// carousel and pauses when it leaves.
// ============================================================================
function getCarouselConfig(width) {
  if (width < 640) {
    return { distanceDivisor: 120, velocityDivisor: 500, sensitivity: 180, xMultiplier: 90, yMultiplier: 20, rotationMultiplier: 8, scaleReduction: 0.06 };
  }
  if (width < 1024) {
    return { distanceDivisor: 160, velocityDivisor: 650, sensitivity: 220, xMultiplier: 130, yMultiplier: 30, rotationMultiplier: 10, scaleReduction: 0.09 };
  }
  return { distanceDivisor: 200, velocityDivisor: 800, sensitivity: 250, xMultiplier: 170, yMultiplier: 40, rotationMultiplier: 12, scaleReduction: 0.12 };
}

function ShowcaseCard({ project, index, total, progress, config, videoRefs }) {
  const offset = useTransform(progress, (p) => {
    let diff = (index - p) % total;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  });

  const x = useTransform(offset, (o) => o * config.xMultiplier);
  const rotate = useTransform(offset, (o) => (Math.abs(o) < 0.05 ? 0 : o * config.rotationMultiplier));
  const y = useTransform(offset, (o) => (Math.abs(o) < 0.05 ? 0 : Math.abs(o) * config.yMultiplier));
  const scale = useTransform(offset, (o) => 1 - Math.abs(o) * config.scaleReduction);
  const opacity = useTransform(
    offset,
    [-total / 2, -total / 2 + 0.5, 0, total / 2 - 0.5, total / 2],
    [0, 1, 1, 1, 0]
  );
  const zIndex = useTransform(offset, (o) => Math.round(100 - Math.abs(o) * 10));
  const dimOpacity = useTransform(offset, [-2, -0.5, 0, 0.5, 2], [0.5, 0.2, 0, 0.2, 0.5]);
  const textOpacity = useTransform(offset, [-0.5, 0, 0.5], [0, 1, 0]);
  // Quiet glow that breathes in only on the centered card — a subtle reward
  // for whichever one currently has focus, not a constant effect.
  const glowOpacity = useTransform(offset, [-1, 0, 1], [0, 1, 0]);

  return (
    <motion.div
      style={{ x, rotate, y, scale, opacity, zIndex }}
      className="glass-panel absolute h-72 w-56 overflow-hidden rounded-2xl p-2 pointer-events-none sm:h-96 sm:w-72 sm:p-2.5 lg:h-[26rem] lg:w-80"
    >
      {/* Liquid-glass frame: a real gap between the card's glass edge and
          the media inside it, so the backdrop-blur has something of its own
          to show (the work backdrop + neighboring cards behind it) instead
          of being fully covered edge-to-edge by opaque media. */}
      <motion.div
        style={{ opacity: glowOpacity }}
        className="pointer-events-none absolute -inset-px z-10 rounded-2xl ring-1 ring-khaki-bright/50 shadow-[0_0_45px_rgba(194,183,161,0.3)]"
      />
      <div className="relative h-full w-full overflow-hidden rounded-xl">
        <ProjectMedia
          media={project.media}
          title={project.title}
          videoRef={(el) => {
            videoRefs.current[index] = el;
          }}
          // Plain native attribute (not lazyAutoPlay — this card's play/pause
          // is driven by which one is active in the carousel, not by
          // scrolling). It's here purely so Low Power Mode gets a real
          // tap-to-play fallback instead of a video that looks broken;
          // Showcase pauses it back down on mount if it isn't the active
          // card, so it doesn't just play in the background regardless.
          autoPlay
        />

        <motion.div style={{ opacity: dimOpacity }} className="absolute inset-0 bg-graphite" />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite/85 via-graphite/10 to-transparent" />

        <span
          className={`absolute top-3 right-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] backdrop-blur-md ${
            project.placeholder ? 'bg-ink/90 text-graphite' : 'bg-khaki text-graphite'
          }`}
        >
          {project.placeholder ? 'Concept' : 'Client Work'}
        </span>

        <div className="absolute inset-x-4 bottom-5 sm:bottom-6">
          <motion.p
            style={{ opacity: textOpacity }}
            className="text-[10px] uppercase tracking-[0.2em] text-khaki-bright"
          >
            {project.category}
          </motion.p>
          <motion.p
            style={{ opacity: textOpacity }}
            className="mt-1 text-base font-medium tracking-tight text-ink sm:text-lg"
          >
            {project.title}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

function Showcase({ reduced }) {
  const scrollProgress = useMotionValue(0);
  const startProgress = useRef(0);
  const videoRefs = useRef({});
  const activeIndexRef = useRef(0);
  const hoveringRef = useRef(false);
  // Hover-to-preview (the desktop interaction this carousel was built
  // around) has no touch equivalent — mouseenter/mouseleave never fire on a
  // phone, so every clip sat on its first frame forever with no way to
  // trigger playback. On touch, skip the hover gate entirely: the centered
  // card just plays, like the ambient video everywhere else on the site.
  const isTouch = useIsTouchDevice();
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  const total = showcase.length;

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const config = useMemo(() => getCarouselConfig(windowWidth), [windowWidth]);

  const playActive = () => {
    if (reduced) return;
    const el = videoRefs.current[activeIndexRef.current];
    if (el) el.play().catch(() => {});
  };
  const pauseAll = () => {
    Object.values(videoRefs.current).forEach((el) => el && el.pause());
  };

  // Keep the playing card in sync with whichever one is centered, including
  // while the visitor is mid-drag (not just on enter/leave).
  useEffect(() => {
    // The showcase video now carries a native `autoplay` attribute (see
    // ProjectMedia) so Low Power Mode gets a real tap-to-play fallback
    // instead of a silently-broken clip — but that means the browser may
    // try to play it the moment it can, regardless of which card is
    // actually centered. Pause anything not active before anything else,
    // so autoplay only ever "wins" for the card that's supposed to play.
    Object.entries(videoRefs.current).forEach(([idx, el]) => {
      if (el && Number(idx) !== activeIndexRef.current) el.pause();
    });
    if (isTouch) playActive(); // no hover on touch — start the first card itself
    const unsubscribe = scrollProgress.on('change', (p) => {
      const normalized = ((Math.round(p) % total) + total) % total;
      if (normalized !== activeIndexRef.current) {
        const prevEl = videoRefs.current[activeIndexRef.current];
        if (prevEl) prevEl.pause();
        activeIndexRef.current = normalized;
        if (hoveringRef.current || isTouch) playActive();
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollProgress, total, isTouch]);

  const handleDragStart = () => {
    startProgress.current = scrollProgress.get();
  };
  const handleDragEnd = (_, info) => {
    const distanceShift = -info.offset.x / config.distanceDivisor;
    const velocityShift = -info.velocity.x / config.velocityDivisor;
    let totalShift = Math.round(distanceShift + velocityShift);
    totalShift = Math.max(-3, Math.min(3, totalShift));
    const target = Math.round(startProgress.current) + totalShift;
    animate(scrollProgress, target, reduced
      ? { duration: 0 }
      : { type: 'spring', stiffness: 200, damping: 30, mass: 1 });
  };

  return (
    <section id="work" className="relative isolate px-6 py-32 md:px-10 md:py-44">
      {!reduced && <MoodBackdrop src="/mood/work-backdrop.jpeg" objectPosition="center 35%" />}
      <div className="relative mx-auto max-w-7xl">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          className="max-w-xl text-4xl leading-[1.05] tracking-tighter font-bold md:text-6xl"
        >
          Add life to your <span className="font-serif italic text-khaki-bright">products</span> and ads.
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          data-cursor="Drag"
          onMouseEnter={() => {
            hoveringRef.current = true;
            playActive();
          }}
          onMouseLeave={() => {
            hoveringRef.current = false;
            pauseAll();
          }}
          className="relative mt-16 flex h-80 select-none items-center justify-center overflow-hidden sm:h-[28rem] lg:h-[32rem]"
        >
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragStart={handleDragStart}
            onDrag={(_, info) => {
              scrollProgress.set(scrollProgress.get() - info.delta.x / config.sensitivity);
            }}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 z-40 cursor-grab active:cursor-grabbing"
          />
          {showcase.map((p, i) => (
            <ShowcaseCard
              key={p.id}
              project={p}
              index={i}
              total={total}
              progress={scrollProgress}
              config={config}
              videoRefs={videoRefs}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// PROCESS
// ============================================================================
function Process({ reduced }) {
  return (
    <section id="process" className="relative isolate px-6 py-32 md:px-10 md:py-44">
      {!reduced && <MoodBackdrop src="/mood/desk-night.jpg" objectPosition="center 40%" />}
      <div className="relative mx-auto max-w-5xl">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          className="max-w-xl text-4xl leading-[1.05] tracking-tighter font-bold md:text-6xl"
        >
          How we&rsquo;ll <span className="font-serif italic text-khaki-bright">work</span> together.
        </motion.h2>

        <motion.ol
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerParent(0.15)}
          className="mt-16 divide-y divide-hairline border-t border-hairline"
        >
          {processSteps.map((step) => (
            <motion.li
              key={step.step}
              variants={fadeUp}
              className="group grid grid-cols-[auto_1fr] items-baseline gap-4 py-8 transition-colors duration-500 hover:bg-white/[0.02] md:grid-cols-[80px_200px_1fr] md:gap-8 md:py-10"
            >
              <span className="font-serif text-xl italic text-walnut-bright">{step.step}</span>
              <h3 className="text-2xl font-medium tracking-tight md:text-3xl">{step.title}</h3>
              <p className="col-span-2 mt-2 max-w-md text-sm font-light text-ink-dim md:col-span-1 md:mt-0 md:text-base">
                {step.description}
              </p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

// ============================================================================
// CONTACT — front-end only for now. Captures state and shows a real success
// state locally; not wired to an email-delivery service yet.
// TODO(Daniel): wire handleSubmit to Formspree / EmailJS / your backend of
// choice when you're ready — the UI and validation are already done.
// ============================================================================
function Contact({ reduced }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const magRef = useMagnetic({ radius: 100, strength: 0.3, disabled: reduced });

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus('sending');
    // SWAP IN: replace this simulated delay with a real submit call.
    setTimeout(() => setStatus('sent'), 700);
  }

  return (
    <section id="contact" className="relative isolate px-6 py-32 md:px-10 md:py-44">
      {!reduced && <MoodBackdrop src="/mood/desk-flatlay.jpg" objectPosition="60% center" />}
      <div className="relative mx-auto max-w-6xl">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          className="max-w-2xl text-4xl leading-[1.05] tracking-tighter font-bold md:text-6xl"
        >
          Let&rsquo;s make something <span className="font-serif italic text-khaki-bright">worth</span> showing.
        </motion.h2>

        <div className="mt-16 grid gap-14 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerParent(0.1)}
            className="space-y-8"
          >
            <motion.a
              variants={fadeUp}
              ref={magRef}
              href={`mailto:${brand.email}`}
              data-cursor="Email"
              className="block text-2xl font-medium tracking-tight text-ink transition-colors duration-300 hover:text-khaki-bright md:text-3xl"
            >
              {brand.email}
            </motion.a>
            <motion.a
              variants={fadeUp}
              href={`tel:${brand.phone.replace(/[^\d+]/g, '')}`}
              data-cursor="Call"
              className="block text-lg text-ink-dim transition-colors duration-300 hover:text-khaki-bright"
            >
              {brand.phone}
            </motion.a>
            <motion.p variants={fadeUp} className="text-sm uppercase tracking-[0.2em] text-ink-faint">
              {brand.location}
            </motion.p>

            <motion.div variants={fadeUp} className="flex gap-5 border-t border-hairline pt-8">
              {/* SWAP IN: replace with real social/LinkedIn URLs. */}
              {brand.socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  data-cursor="Open"
                  className="text-sm text-ink-faint transition-colors duration-300 hover:text-khaki-bright"
                >
                  {s.label}
                </a>
              ))}
            </motion.div>
          </motion.div>

          <motion.form
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            onSubmit={handleSubmit}
            className="glass-panel relative overflow-hidden rounded-2xl p-8 md:p-10"
          >
            <AnimatePresence mode="wait">
              {status === 'sent' ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="flex min-h-[280px] flex-col items-center justify-center text-center"
                >
                  <span className="font-serif text-4xl italic text-khaki-bright">Thank you.</span>
                  <p className="mt-3 max-w-xs text-sm text-ink-dim">
                    Message received — I’ll get back to you shortly.
                  </p>
                </motion.div>
              ) : (
                <motion.div key="form" exit={{ opacity: 0 }} className="space-y-6">
                  <Field label="Name" value={form.name} onChange={update('name')} type="text" />
                  <Field label="Email" value={form.email} onChange={update('email')} type="email" />
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-ink-faint">
                      Message
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={update('message')}
                      className="w-full resize-none border-b border-hairline bg-transparent pb-3 text-ink outline-none transition-colors duration-300 placeholder:text-ink-faint focus:border-khaki-bright"
                      placeholder="Tell me about the project..."
                    />
                  </div>
                  <button
                    type="submit"
                    data-cursor="Send"
                    disabled={status === 'sending'}
                    className="mt-2 w-full rounded-full bg-khaki py-4 text-sm font-medium text-graphite transition-colors duration-300 hover:bg-khaki-bright disabled:opacity-60"
                  >
                    {status === 'sending' ? 'Sending…' : 'Send Message'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, type }) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-ink-faint">{label}</label>
      <input
        required
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border-b border-hairline bg-transparent pb-3 text-ink outline-none transition-colors duration-300 placeholder:text-ink-faint focus:border-khaki-bright"
        placeholder={type === 'email' ? 'you@company.com' : 'Jane Doe'}
      />
    </div>
  );
}

// ============================================================================
// FOOTER
// ============================================================================
function Footer({ reduced }) {
  const magRef = useMagnetic({ radius: 70, strength: 0.35, disabled: reduced });
  const scrollToId = useScrollToId();
  return (
    <footer className="border-t border-hairline px-6 py-10 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-ink-faint md:flex-row">
        <p>© {new Date().getFullYear()} {brand.studio}. All rights reserved.</p>
        <button
          ref={magRef}
          data-cursor="Top"
          onClick={() => scrollToId('top', reduced)}
          className="uppercase tracking-[0.2em] transition-colors duration-300 hover:text-khaki-bright"
        >
          Back to top ↑
        </button>
      </div>
    </footer>
  );
}

// ============================================================================
// ROOT APP
// ============================================================================
function App() {
  const [loading, setLoading] = useState(true);
  const reduced = useReducedMotion();
  const isTouch = useIsTouchDevice();
  const lenisRef = useLenis({ enabled: !loading && !reduced && !isTouch });

  useEffect(() => {
    document.body.style.overflow = loading ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [loading]);

  return (
    <LenisContext.Provider value={lenisRef}>
      <Preloader onDone={() => setLoading(false)} reduced={reduced} />
      <Grain />
      {!isTouch && !reduced && <Cursor />}
      <Nav reduced={reduced} />
      <main>
        <Hero reduced={reduced} />
        <Motion />
        <Showcase reduced={reduced} />
        <Agency />
        <About />
        <Services reduced={reduced} />
        <Process reduced={reduced} />
        <Contact reduced={reduced} />
      </main>
      <Footer reduced={reduced} />
    </LenisContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Mount. Self-contained so this file works as a direct HTML entry point in
// both Vite (prod) and the Babel-standalone zero-build preview — no separate
// main.jsx needed. Guarded so it only ever mounts once.
// ---------------------------------------------------------------------------
const rootEl = typeof document !== 'undefined' ? document.getElementById('root') : null;
if (rootEl && !rootEl.dataset.mounted) {
  rootEl.dataset.mounted = 'true';
  createRoot(rootEl).render(<App />);
}

export default App;
