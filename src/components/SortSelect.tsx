import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';

interface Option<T extends string> {
  key: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  label: string;
}

/** Custom dropdown so the open list matches the site (native <select> lists can't be styled). */
export default function SortSelect<T extends string>({ value, options, onChange, label }: Props<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // which edge of the button the list lines up with, chosen on open so it never leaves the screen
  const [align, setAlign] = useState<'left' | 'right'>('right');
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const selectedIndex = Math.max(0, options.findIndex((o) => o.key === value));
  const selected = options[selectedIndex];

  const openList = () => {
    setActive(selectedIndex);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = Math.max(220, rect.width);
      const fitsRight = rect.right - menuWidth >= 12; // list ending at the button's right edge stays on screen
      const fitsLeft = rect.left + menuWidth <= window.innerWidth - 12;
      setAlign(fitsRight || !fitsLeft ? 'right' : 'left');
    }
    setOpen(true);
  };

  const choose = (index: number) => {
    onChange(options[index].key);
    setOpen(false);
    buttonRef.current?.focus();
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative flex items-center gap-2 font-sans text-sm" onKeyDown={onKeyDown}>
      <span className="hidden text-ink/55 sm:inline" id={`${listId}-label`}>{label}</span>

      <motion.button
        ref={buttonRef}
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => (open ? setOpen(false) : openList())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${listId}-label`}
        className={`flex items-center gap-2 rounded-full border bg-white py-2 pl-4 pr-3 font-medium text-ink transition-all duration-200 ${
          open ? 'border-moss ring-4 ring-moss/10' : 'border-ink/10 hover:border-moss'
        }`}
      >
        {selected.label}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex text-ink/50">
          <ChevronDown size={16} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-labelledby={`${listId}-label`}
            aria-activedescendant={`${listId}-opt-${active}`}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: align === 'right' ? 'top right' : 'top left' }}
            className={`absolute top-full z-30 mt-2 max-h-[min(60vh,420px)] w-max min-w-[220px] max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain rounded-2xl border border-ink/10 bg-paper p-1.5 shadow-[0_18px_40px_-14px_rgba(31,33,25,0.45)] ${align === 'right' ? 'right-0' : 'left-0'}`}
          >
            {options.map((option, i) => {
              const isSelected = option.key === value;
              const isActive = i === active;
              return (
                <li
                  key={option.key}
                  id={`${listId}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl px-3.5 py-2.5 transition-colors ${
                    isActive ? 'bg-moss/10 text-moss' : 'text-ink/80'
                  } ${isSelected ? 'font-semibold' : ''}`}
                >
                  {option.label}
                  {isSelected && <Check size={15} className="shrink-0 text-moss" />}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
