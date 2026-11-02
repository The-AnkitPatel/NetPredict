'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, X, Plus, Minus, Maximize } from 'lucide-react';
import { useDiagramZoom } from './useDiagramZoom';


/** Outer container for every diagram: bordered card with title, zoom (+/-) controls, and fullscreen mode. */
export function DiagramFrame({
  title,
  caption,
  children,
}: {
  title?: ReactNode;
  caption?: ReactNode;
  children: ReactNode;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
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
  } = useDiagramZoom(isFullscreen);

  // Handle Fullscreen toggle and ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? 'hidden' : '';
    const timer = setTimeout(() => handleSmartFit(), 50);
    return () => clearTimeout(timer);
  }, [isFullscreen, handleSmartFit]);

  const toolbarControls = (
    <div className="flex items-center gap-1">

      <button
        type="button"
        onClick={handleZoomIn}
        title="Zoom In (+)"
        aria-label="Zoom In"
        className="flex size-7 items-center justify-center rounded-none border border-fd-border bg-fd-card text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
      >
        <ZoomIn className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={handleZoomOut}
        title="Zoom Out (-)"
        aria-label="Zoom Out"
        className="flex size-7 items-center justify-center rounded-none border border-fd-border bg-fd-card text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
      >
        <ZoomOut className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={handleSmartFit}
        title="Smart Fit / Reset Zoom"
        aria-label="Smart Fit / Reset Zoom"
        className="flex h-7 items-center gap-1 rounded-none border border-fd-border bg-fd-card px-2 font-mono text-[10px] text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
      >
        <RotateCcw className="size-3" />
        {Math.round(zoomScale * 100)}%
      </button>
      <button
        type="button"
        onClick={() => setIsFullscreen(!isFullscreen)}
        title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand to Fullscreen'}
        aria-label={isFullscreen ? 'Exit Fullscreen' : 'Expand to Fullscreen'}
        className="flex size-7 items-center justify-center rounded-none border border-fd-border bg-fd-card text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
      >
        {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
      </button>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-fd-background/95 p-4 backdrop-blur-md md:p-6">
        <div className="flex items-center justify-between border-b border-fd-border pb-3 mb-3">
          <div>
            {title && (
              <h3 className="text-sm font-semibold uppercase tracking-wider text-fd-foreground">
                {title}
              </h3>
            )}
            {caption && (
              <p className="mt-0.5 text-xs text-fd-muted-foreground">{caption}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {toolbarControls}
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              title="Close Fullscreen (Esc)"
              className="flex size-7 items-center justify-center border border-fd-border bg-fd-card text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative flex-1 w-full overflow-hidden border border-fd-border bg-fd-card select-none flex items-center justify-center"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onWheel={(e) => {
            if (e.ctrlKey || e.metaKey || true) {
              if (e.deltaY < 0) handleZoomIn();
              else if (e.deltaY > 0) handleZoomOut();
            }
          }}
        >
          <div
            ref={contentRef}
            className="w-fit h-fit flex items-center justify-center transition-transform duration-75 ease-out origin-center"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoomScale})`,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  const displayCaption =
    caption ||
    'System workflow execution sequence and component state transitions governed by HimRide platform protocols.';

  return (
    <figure className="not-prose my-6 border border-fd-border bg-fd-card">
      <figcaption className="flex items-center justify-between border-b border-fd-border bg-fd-muted/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-fd-muted-foreground">
        <span>{title || 'System Diagram'}</span>
        {toolbarControls}
      </figcaption>
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative overflow-hidden min-h-[320px] max-h-[75vh] p-4 md:p-6 border-b border-fd-border select-none flex items-center justify-center"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.deltaY < 0) handleZoomIn();
            else if (e.deltaY > 0) handleZoomOut();
          }
        }}
      >
        <div className="absolute bottom-4 left-4 z-10 flex flex-col border border-fd-border bg-fd-card/90 shadow-sm backdrop-blur-xs">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In (+)"
            aria-label="Zoom In"
            className="flex size-7 items-center justify-center border-b border-fd-border text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
          >
            <Plus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out (-)"
            aria-label="Zoom Out"
            className="flex size-7 items-center justify-center border-b border-fd-border text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleSmartFit}
            title="Fit / Reset View"
            aria-label="Fit / Reset View"
            className="flex size-7 items-center justify-center text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
          >
            <Maximize className="size-3.5" />
          </button>
        </div>
        <div
          ref={contentRef}
          className="w-fit h-fit flex items-center justify-center transition-transform duration-75 ease-out origin-center"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoomScale})`,
          }}
        >
          {children}
        </div>
      </div>
      <figcaption className="px-4 py-2.5 text-xs leading-relaxed text-fd-muted-foreground">
        {displayCaption}
      </figcaption>
    </figure>
  );
}


export { DNode, Connector, LayerBox } from './nodes';
export type { NodeVariant, DiagramNode } from './nodes';
