import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  children: ReactNode;
  className?: string;
  /** Changes whenever the selected chip changes, so the row can scroll it into view. */
  activeKey?: string;
  label: string;
}

/**
 * Horizontally scrollable row of chips:
 *  - mouse wheel scrolls it sideways while the cursor is over it (the page scrolls normally at the ends),
 *  - drag with the mouse, swipe on touch screens,
 *  - fades and arrow buttons show when more chips are hidden; arrows reveal whole chips, never half ones.
 */
export default function ScrollRow({ children, className = '', activeKey, label }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [update]);

  // wheel -> horizontal scroll. Registered natively because React's onWheel is passive and can't preventDefault.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const atStart = el.scrollLeft <= 0 && delta < 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && delta > 0;
      if (atStart || atEnd) return; // let the page scroll
      e.preventDefault();
      el.scrollBy({ left: delta, behavior: 'auto' });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // keep the selected chip visible
  useEffect(() => {
    const active = ref.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    active?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
  }, [activeKey]);

  // drag to scroll (mouse only; touch already scrolls natively)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    drag.current = { active: true, startX: e.clientX, startScroll: ref.current.scrollLeft, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active || !ref.current) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 5) d.moved = true;
    if (d.moved) ref.current.scrollLeft = d.startScroll - dx;
  };
  const endDrag = () => {
    drag.current.active = false;
  };
  // a drag must not count as a click on the chip under the cursor
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.stopPropagation();
      e.preventDefault();
      drag.current.moved = false;
    }
  };

  /** Scroll so the first partly hidden chip on that side becomes fully visible. */
  const page = (direction: 1 | -1) => {
    const el = ref.current;
    const track = el?.firstElementChild;
    if (!el || !track) return;
    const box = el.getBoundingClientRect();
    const chips = Array.from(track.children) as HTMLElement[];
    if (direction === 1) {
      const hidden = chips.find((c) => c.getBoundingClientRect().right > box.right + 1);
      if (hidden) el.scrollBy({ left: hidden.getBoundingClientRect().right - box.right + 12, behavior: 'smooth' });
    } else {
      const hidden = [...chips].reverse().find((c) => c.getBoundingClientRect().left < box.left - 1);
      if (hidden) el.scrollBy({ left: hidden.getBoundingClientRect().left - box.left - 12, behavior: 'smooth' });
    }
  };

  const arrow = (direction: 1 | -1, visible: boolean) => (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => page(direction)}
          aria-label={direction === 1 ? 'Keyingi bo\'limlar' : 'Oldingi bo\'limlar'}
          className={`absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white text-ink/70 shadow-md transition-colors hover:border-moss hover:text-moss sm:flex ${
            direction === 1 ? 'right-0' : 'left-0'
          }`}
        >
          {direction === 1 ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </motion.button>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`relative ${className}`}>
      <div
        ref={ref}
        role="tablist"
        aria-label={label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
        className="scrollbar-hide flex snap-x snap-proximity overflow-x-auto scroll-px-10 px-0.5 py-1 [-webkit-overflow-scrolling:touch] select-none"
      >
        {children}
      </div>

      {/* edge fades tell the user there is more to scroll to */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-paper to-transparent transition-opacity duration-200 ${canLeft ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-paper to-transparent transition-opacity duration-200 ${canRight ? 'opacity-100' : 'opacity-0'}`}
      />
      {arrow(-1, canLeft)}
      {arrow(1, canRight)}
    </div>
  );
}
