import { motion } from 'motion/react';
import { ArrowUp, Library, Mail, MapPin, Phone } from 'lucide-react';
import { CATEGORIES } from '../types';
import type { Category, View } from '../types';

interface Props {
  onNavigate: (view: View) => void;
  onPickCategory: (category: Category) => void;
}

const SECTIONS = CATEGORIES.slice(1).map((category) => ({ label: category, category }));

const linkClass =
  'inline-block font-sans text-sm text-ink/60 transition-all duration-200 hover:translate-x-1 hover:text-moss';

export default function Footer({ onNavigate, onPickCategory }: Props) {
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="mt-24 border-t border-ink/10 bg-paper-deep/60">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-moss text-white">
              <Library size={18} />
            </span>
            <span className="font-serif text-2xl font-bold tracking-tight">Ziyo Kutubxonasi</span>
          </div>
          <p className="max-w-sm font-sans text-sm leading-relaxed text-ink/60">
            Jahon adabiyoti va ilmiy merosini hamma uchun bepul va qulay qiladigan onlayn kutubxona.
            Kitoblar Project Gutenberg ochiq to'plamidan olingan.
          </p>
        </div>

        <nav className="md:col-span-2" aria-label="Footer: sahifalar">
          <h2 className="mb-4 font-serif text-lg font-semibold">Sahifalar</h2>
          <ul className="space-y-3">
            <li><button type="button" className={linkClass} onClick={() => onNavigate('Home')}>Katalog</button></li>
            <li><button type="button" className={linkClass} onClick={() => onNavigate('Saved')}>Saqlanganlar</button></li>
            <li><button type="button" className={linkClass} onClick={() => onNavigate('About')}>Biz haqimizda</button></li>
          </ul>
        </nav>

        <nav className="md:col-span-3" aria-label="Footer: bo'limlar">
          <h2 className="mb-4 font-serif text-lg font-semibold">Bo'limlar</h2>
          <ul className="space-y-3">
            {SECTIONS.map((s) => (
              <li key={s.category}>
                <button type="button" className={linkClass} onClick={() => onPickCategory(s.category)}>
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-2">
          <h2 className="mb-4 font-serif text-lg font-semibold">Bog'lanish</h2>
          <ul className="space-y-3 font-sans text-sm text-ink/60">
            <li>
              <a href="mailto:gamer20061805@gmail.com" className="flex items-center gap-2.5 transition-colors hover:text-moss">
                <Mail size={15} className="shrink-0" /> gamer20061805@gmail.com
              </a>
            </li>
            <li>
              <a href="tel:+998772754979" className="flex items-center gap-2.5 transition-colors hover:text-moss">
                <Phone size={15} className="shrink-0" /> +998 77 275 49 79
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin size={15} className="shrink-0" /> Yunusobod 7-16, Toshkent
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-5 py-6 sm:flex-row sm:items-center sm:px-6">
          <p className="font-sans text-xs text-ink/50">
            © {new Date().getFullYear()} Ziyo Kutubxonasi. Barcha huquqlar himoyalangan.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="https://www.gutenberg.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-xs text-ink/50 transition-colors hover:text-moss"
            >
              Manba: Project Gutenberg
            </a>
            <motion.button
              type="button"
              onClick={toTop}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Sahifa boshiga qaytish"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 bg-paper text-ink/70 transition-colors hover:border-moss hover:bg-moss hover:text-white"
            >
              <ArrowUp size={17} />
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
}
