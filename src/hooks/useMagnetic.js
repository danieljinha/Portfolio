// Plain JS hook (no JSX). Gives an element a subtle magnetic pull toward the
// cursor when the pointer is within `radius` px, eased with lerp + RAF
// (transform-only, GPU-friendly) rather than snapping straight to the
// pointer position.
import { useEffect, useRef } from 'react';

const lerp = (a, b, n) => a + (b - a) * n;

export function useMagnetic({ radius = 90, strength = 0.35, disabled = false } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return undefined;

    let raf;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < radius) {
        targetX = dx * strength;
        targetY = dy * strength;
      } else {
        targetX = 0;
        targetY = 0;
      }
    }

    function loop() {
      curX = lerp(curX, targetX, 0.15);
      curY = lerp(curY, targetY, 0.15);
      el.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      el.style.transform = '';
    };
  }, [radius, strength, disabled]);

  return ref;
}
