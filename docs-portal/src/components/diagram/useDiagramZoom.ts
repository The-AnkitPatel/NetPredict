'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export function useDiagramZoom(isFullscreen: boolean) {
  const [zoomScale, setZoomScale] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const hasUserAdjustedRef = useRef(false);
  const zoomScaleRef = useRef(zoomScale);

  useEffect(() => {
    zoomScaleRef.current = zoomScale;
  }, [zoomScale]);

  const handleSmartFit = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;

    const containerBox = containerRef.current.getBoundingClientRect();
    const contentBox = contentRef.current.getBoundingClientRect();

    if (containerBox.width <= 0 || containerBox.height <= 0) return;

    const currentScale = zoomScaleRef.current || 1.0;
    const unscaledW = contentBox.width / currentScale;
    const unscaledH = contentBox.height / currentScale;

    if (unscaledW > 10 && unscaledH > 10) {
      const scaleX = (containerBox.width * 0.94) / unscaledW;
      const scaleY = (containerBox.height * 0.90) / unscaledH;
      let targetScale = Math.min(scaleX, scaleY);

      const maxScale = isFullscreen ? 3.0 : 2.0;
      if (targetScale > maxScale) targetScale = maxScale;
      if (targetScale < 0.1) targetScale = 0.1;

      targetScale = Number(targetScale.toFixed(2));

      if (Math.abs(targetScale - zoomScaleRef.current) > 0.01) {
        setZoomScale(targetScale);
        setPan({ x: 0, y: 0 });
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    handleSmartFit();
    const t1 = setTimeout(handleSmartFit, 60);
    const t2 = setTimeout(handleSmartFit, 200);
    const t3 = setTimeout(handleSmartFit, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [handleSmartFit]);

  useEffect(() => {
    if (!contentRef.current) return;

    const observer = new ResizeObserver(() => {
      if (!hasUserAdjustedRef.current) {
        handleSmartFit();
      }
    });

    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [handleSmartFit]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    hasUserAdjustedRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1 || !dragStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.x;
    const dy = touch.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleZoomIn = () =>
    setZoomScale((z) => Math.min(Number((z + (z >= 2 ? 0.5 : 0.25)).toFixed(2)), 10.0));
  const handleZoomOut = () =>
    setZoomScale((z) => Math.max(Number((z - (z > 2 ? 0.5 : 0.25)).toFixed(2)), 0.2));

  return {
    zoomScale,
    pan,
    isDragging,
    containerRef,
    contentRef,
    handleSmartFit,
    handleMouseDown,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleZoomIn,
    handleZoomOut,
    hasUserAdjustedRef,
  };
}
