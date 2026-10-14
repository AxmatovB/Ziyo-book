import { motion } from 'motion/react';
import { BookOpen, Headphones, Heart } from 'lucide-react';
import type { Book } from '../types';
import BookCover from './BookCover';

interface Props {
  book: Book;
  index: number;
  saved: boolean;
  onOpen: (book: Book) => void;
  onToggleSave: (book: Book) => void;
}

export default function BookCard({ book, index, saved, onOpen, onToggleSave }: Props) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index % 24, 12) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <motion.button
        type="button"
        onClick={() => onOpen(book)}
        whileHover={{ y: -8 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        className="block w-full text-left"
        aria-label={`${book.title}, ${book.author}. Batafsil ochish`}
      >
        <motion.div layoutId={`cover-${book.id}`} className="relative mb-4 aspect-[2/3] rounded-xl shadow-[0_6px_18px_-6px_rgba(31,33,25,0.35)] transition-shadow duration-300 group-hover:shadow-[0_22px_34px_-12px_rgba(31,33,25,0.5)]">
          <BookCover book={book} className="h-full w-full rounded-xl" />
          {book.kind === 'audio' && (
            <span className="absolute bottom-2.5 left-4 flex items-center gap-1.5 rounded-full bg-ink/80 px-2.5 py-1 font-sans text-[11px] font-medium text-white backdrop-blur">
              <Headphones size={12} />
              Audio
            </span>
          )}
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-ink/45 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
            <span className="flex items-center gap-2 rounded-full bg-paper px-4 py-2 font-sans text-xs font-semibold text-ink">
              {book.kind === 'audio' ? <Headphones size={14} /> : <BookOpen size={14} />}
              {book.kind === 'audio' ? 'Tinglash' : 'Ochish'}
            </span>
          </div>
        </motion.div>
        <h3 className="mb-1 line-clamp-2 font-serif text-xl font-semibold leading-tight transition-colors group-hover:text-moss">
          {book.title}
        </h3>
        <p className="font-sans text-sm text-ink/55 line-clamp-1">{book.author}</p>
      </motion.button>

      <motion.button
        type="button"
        onClick={() => onToggleSave(book)}
        whileTap={{ scale: 0.8 }}
        aria-pressed={saved}
        aria-label={saved ? `${book.title} — saqlanganlardan olib tashlash` : `${book.title} — saqlash`}
        className={`absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full shadow-sm backdrop-blur transition-all duration-200 ${
          saved
            ? 'bg-moss text-white opacity-100'
            : 'bg-paper/90 text-ink/70 opacity-100 hover:text-moss sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100'
        }`}
      >
        <motion.span
          key={String(saved)}
          initial={{ scale: saved ? 0.4 : 1 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 14 }}
          className="flex"
        >
          <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
        </motion.span>
      </motion.button>
    </motion.article>
  );
}
