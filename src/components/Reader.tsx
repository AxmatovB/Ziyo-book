import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ExternalLink, Heart, Loader2, RefreshCw } from 'lucide-react';
import type { Book } from '../types';

interface Props {
  book: Book;
  saved: boolean;
  onClose: () => void;
  onToggleSave: () => void;
}

const iconButton =
  'flex h-10 w-10 items-center justify-center rounded-full text-ink/65 transition-colors hover:bg-ink/5 hover:text-ink';

export default function Reader({ book, saved, onClose, onToggleSave }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoaded(false);
    setSlow(false);
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, [book.id, reloadKey]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${book.title} — o'qish`}
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 240 }}
      className="fixed inset-0 z-[60] flex flex-col bg-paper"
    >
      <div className="flex items-center justify-between gap-3 border-b border-ink/10 bg-paper px-3 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <motion.button
            type="button"
            onClick={onClose}
            whileTap={{ scale: 0.9 }}
            whileHover={{ x: -2 }}
            className={iconButton}
            aria-label="Kutubxonaga qaytish"
          >
            <ArrowLeft size={22} />
          </motion.button>
          <div className="min-w-0">
            <h2 className="truncate font-serif text-lg font-semibold leading-tight sm:text-xl">{book.title}</h2>
            <p className="truncate font-sans text-xs text-ink/55">{book.author}{book.source && book.source !== 'Project Gutenberg' ? ` — ${book.source}` : ''}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <motion.button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            whileTap={{ rotate: 180, scale: 0.9 }}
            className={iconButton}
            title="Qayta yuklash"
            aria-label="Qayta yuklash"
          >
            <RefreshCw size={19} />
          </motion.button>
          <a
            href={book.contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={iconButton}
            title="Yangi oynada ochish"
            aria-label="Yangi oynada ochish"
          >
            <ExternalLink size={19} />
          </a>
          <motion.button
            type="button"
            onClick={onToggleSave}
            whileTap={{ scale: 0.8 }}
            aria-pressed={saved}
            aria-label={saved ? 'Saqlanganlardan olib tashlash' : 'Saqlash'}
            className={`${iconButton} ${saved ? 'text-moss' : ''}`}
          >
            <Heart size={20} fill={saved ? 'currentColor' : 'none'} />
          </motion.button>
        </div>
      </div>

      <div className="relative flex-1 bg-paper-deep">
        <div className="relative mx-auto h-full max-w-5xl bg-white shadow-xl">
          <iframe
            key={reloadKey}
            src={book.contentUrl}
            title={book.title}
            onLoad={() => setLoaded(true)}
            className="h-full w-full border-0"
          />

          <AnimatePresence>
            {!loaded && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-paper px-6 text-center"
              >
                <Loader2 size={30} className="animate-spin text-moss motion-reduce:animate-none" />
                <p className="font-serif text-xl">{book.kind === 'audio' ? 'Audio yuklanmoqda…' : 'Kitob yuklanmoqda…'}</p>
                <AnimatePresence>
                  {slow && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-sm font-sans text-sm text-ink/60"
                    >
                      Katta kitoblar sekin ochilishi mumkin. Agar ochilmasa,{' '}
                      <a href={book.contentUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-moss underline underline-offset-2">
                        yangi oynada oching
                      </a>
                      .
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
