import React, { useEffect } from 'react';

export const CustomCursor: React.FC = () => {
  useEffect(() => {
    const dot = document.getElementById('custom-cursor-dot');
    const ring = document.getElementById('custom-cursor-ring');
    const canUse =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
        : false;

    if (!dot || !ring || !canUse) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let frameId = 0;

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      dot.style.left = `${targetX}px`;
      dot.style.top = `${targetY}px`;
    };

    const animateRing = () => {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      frameId = requestAnimationFrame(animateRing);
    };

    const interactiveSelectors = 'a, button, input, select, .btn, .card, [role="button"]';

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest(interactiveSelectors)) {
        ring.style.width = '42px';
        ring.style.height = '42px';
        ring.style.borderColor = 'var(--chili)';
        dot.style.transform = 'translate(-50%, -50%) scale(1.4)';
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest(interactiveSelectors)) {
        ring.style.width = '28px';
        ring.style.height = '28px';
        ring.style.borderColor = 'var(--cursor-ring-color)';
        dot.style.transform = 'translate(-50%, -50%) scale(1)';
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseover', onMouseOver, { passive: true });
    document.addEventListener('mouseout', onMouseOut, { passive: true });
    frameId = requestAnimationFrame(animateRing);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <>
      <div id="custom-cursor-dot" />
      <div id="custom-cursor-ring" />
    </>
  );
};
