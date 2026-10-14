import { useState } from 'react';
import type { Book } from '../types';

const TINTS = ['#4b5233', '#6b4f3a', '#3d4a52', '#5c3d4a', '#4a4a3a', '#35493f'];

function tintFor(id: string) {
  let sum = 0;
  for (const ch of id) sum += ch.charCodeAt(0);
  return TINTS[sum % TINTS.length];
}

interface Props {
  book: Book;
  className?: string;
  eager?: boolean;
}

/** Cover image with a loading shimmer and a typographic fallback if the image fails. */
export default function BookCover({ book, className = '', eager = false }: Props) {
  // Books without a cover image (e.g. PDFs from Ziyouz.com) go straight to the typographic cover
  const [state, setState] = useState<'loading' | 'ready' | 'error'>(book.coverImage ? 'loading' : 'error');

  return (
    <div className={`relative overflow-hidden bg-paper-deep ${className}`}>
      {state === 'loading' && <div className="shimmer absolute inset-0" aria-hidden="true" />}

      {state === 'error' ? (
        <div
          className="absolute inset-0 flex flex-col justify-between p-4 text-white/90"
          style={{ background: tintFor(book.id) }}
          role="img"
          aria-label={book.title}
        >
          <span className="font-serif text-xl font-semibold leading-tight line-clamp-5">{book.title}</span>
          <span className="font-sans text-xs opacity-70 line-clamp-2">{book.author}</span>
        </div>
      ) : (
        <img
          src={book.coverImage}
          alt={`${book.title} muqovasi`}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
          className={`h-full w-full object-cover transition-opacity duration-500 ${state === 'ready' ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      {/* spine highlight so flat images read as bound books */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}
