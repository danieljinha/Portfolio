// Plain JS hook (no JSX) — sets up Lenis inertia smooth-scroll and drives it
// from requestAnimationFrame. Disabled under prefers-reduced-motion and on
// touch devices, where native scrolling already feels right and fighting it
// with a smoothing layer tends to feel laggy rather than premium.
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export function useLenis({ enabled = true } = {}) {
  const lenisRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    const lenis = new Lenis({
      duration: 1.15,
      // Cinematic-feeling deceleration rather than linear/default ease.
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });
    lenisRef.current = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [enabled]);

  return lenisRef;
}
