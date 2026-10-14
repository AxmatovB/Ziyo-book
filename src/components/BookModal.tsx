import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Clock, Download, ExternalLink, Headphones, Heart, X } from 'lucide-react';
import type { Book } from '../types';
import BookCover from './BookCover';

interface Props {
  book: Book;
  saved: boolean;
  onClose: () => void;
  onRead: () => void;
  onToggleSave: () => void;
}

const formatter = new Intl.NumberFormat('uz-UZ');

export default function BookModal({ book, saved, onClose, onRead, onToggleSave }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-modal-title"
        initial={{ y: 40, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-y-auto rounded-t-[28px] bg-paper shadow-2xl sm:rounded-[28px] md:flex-row md:overflow-hidden"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Yopish"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-paper/90 text-ink/70 shadow-sm backdrop-blur transition-all hover:rotate-90 hover:text-ink"
        >
          <X size={20} />
        </button>

        <div className="flex shrink-0 items-center justify-center bg-paper-deep p-8 md:w-[38%] md:p-10">
          <motion.div
            layoutId={`cover-${book.id}`}
            className="aspect-[2/3] w-44 rounded-xl shadow-[0_24px_40px_-16px_rgba(31,33,25,0.6)] md:w-full md:max-w-[250px]"
          >
            <BookCover book={book} eager className="h-full w-full rounded-xl" />
          </motion.div>
        </div>

        <div className="flex flex-1 flex-col p-6 sm:p-9 md:overflow-y-auto">
          <p className="mb-3 font-sans text-sm font-medium text-moss">{book.category}</p>
          <h2 id="book-modal-title" className="mb-2 font-serif text-3xl font-bold leading-tight sm:text-4xl">
            {book.title}
          </h2>
          <p className="mb-6 font-serif text-xl italic text-ink/65">
            {book.author}
            {book.years && <span className="font-sans text-sm not-italic text-ink/45"> ({book.years})</span>}
          </p>

          <dl className="mb-6 flex gap-8 border-y border-ink/10 py-4 font-sans">
            <div>
              <dt className="mb-1 text-xs text-ink/50">Til</dt>
              <dd className="font-semibold">{book.language ?? 'Inglizcha'}</dd>
            </div>
            <div>
              <dt className="mb-1 text-xs text-ink/50">Manba</dt>
              <dd className="font-semibold">{book.source ?? 'Project Gutenberg'}</dd>
            </div>
            {book.downloads > 0 && (
              <div>
                <dt className="mb-1 text-xs text-ink/50">Yuklab olishlar</dt>
                <dd className="flex items-center gap-1.5 font-semibold">
                  <Download size={14} className="text-brass" />
                  {formatter.format(book.downloads)}
                </dd>
              </div>
            )}
            {book.duration && (
              <div>
                <dt className="mb-1 text-xs text-ink/50">Davomiyligi</dt>
                <dd className="flex items-center gap-1.5 font-semibold">
                  <Clock size={14} className="text-brass" />
                  {book.duration}
                </dd>
              </div>
            )}
          </dl>

          <p className="mb-8 font-sans text-[15px] leading-relaxed text-ink/75">
            {book.description || (book.kind === 'audio' ? `${book.author} asarining LibriVox ko'ngillilari o'qigan audio varianti.` : `${book.author} qalamiga mansub asar. To'liq matn bepul o'qiladi.`)}
          </p>

          <div className="mt-auto flex gap-3 max-md:sticky max-md:bottom-0 max-md:-mx-6 max-md:border-t max-md:border-ink/10 max-md:bg-paper max-md:px-6 max-md:pb-5 max-md:pt-3 sm:max-md:-mx-9 sm:max-md:px-9">
            <motion.button
              type="button"
              onClick={onRead}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-moss py-4 font-sans font-semibold text-white shadow-lg shadow-moss/25 transition-colors hover:bg-moss-deep"
            >
              {book.external ? <ExternalLink size={18} /> : book.kind === 'audio' ? <Headphones size={18} /> : <BookOpen size={18} />}
              {book.external ? `${book.source ?? 'Manba'} saytida ochish` : book.kind === 'audio' ? 'Tinglashni boshlash' : "O'qishni boshlash"}
            </motion.button>
            <motion.button
              type="button"
              onClick={onToggleSave}
              whileTap={{ scale: 0.85 }}
              aria-pressed={saved}
              aria-label={saved ? 'Saqlanganlardan olib tashlash' : 'Saqlash'}
              className={`flex h-14 w-14 items-center justify-center rounded-full border transition-colors ${
                saved ? 'border-moss bg-moss text-white' : 'border-ink/15 text-ink/50 hover:border-moss hover:text-moss'
              }`}
            >
              <motion.span
                key={String(saved)}
                initial={{ scale: saved ? 0.4 : 1 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                className="flex"
              >
                <Heart size={20} fill={saved ? 'currentColor' : 'none'} />
              </motion.span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
