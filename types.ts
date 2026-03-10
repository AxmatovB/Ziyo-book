import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book as BookIcon, 
  Search, 
  Library, 
  Bookmark, 
  ChevronRight, 
  Star, 
  X, 
  Maximize2, 
  Menu,
  BookOpen,
  Info,
  Heart,
  Code,
  Cpu,
  Palette
} from 'lucide-react';
import { Category, Book } from './types';
import { BOOKS } from './data/books';

const CATEGORIES: Category[] = [
  'Barchasi',
  'Rus adabiyoti',
  'Chet el adabiyoti',
  'O\'Reilly'
];

type View = 'Home' | 'Saved' | 'About';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('Home');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Barchasi');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [savedBookIds, setSavedBookIds] = useState<string[]>([]);

  // Persistence: Load state on mount
  useEffect(() => {
    const saved = localStorage.getItem('ziyo_saved_books');
    if (saved) setSavedBookIds(JSON.parse(saved));

    const lastReadId = localStorage.getItem('ziyo_last_read_id');
    const wasReading = localStorage.getItem('ziyo_is_reading') === 'true';
    
    if (lastReadId) {
      const book = BOOKS.find(b => b.id === lastReadId);
      if (book) {
        setSelectedBook(book);
        if (wasReading) setIsReaderOpen(true);
      }
    }
  }, []);

  // Persistence: Save state on changes
  useEffect(() => {
    localStorage.setItem('ziyo_saved_books', JSON.stringify(savedBookIds));
  }, [savedBookIds]);

  useEffect(() => {
    if (selectedBook) {
      localStorage.setItem('ziyo_last_read_id', selectedBook.id);
    }
    localStorage.setItem('ziyo_is_reading', String(isReaderOpen));
  }, [selectedBook, isReaderOpen]);

  const toggleSaveBook = (id: string) => {
    setSavedBookIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const [displayCount, setDisplayCount] = useState(20);

  const filteredBooks = useMemo(() => {
    let list = currentView === 'Saved' 
      ? BOOKS.filter(b => savedBookIds.includes(b.id))
      : BOOKS;

    return list.filter(book => {
      const matchesCategory = selectedCategory === 'Barchasi' || book.category === selectedCategory;
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           book.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, currentView, savedBookIds]);

  const displayedBooks = useMemo(() => {
    return filteredBooks.slice(0, displayCount);
  }, [filteredBooks, displayCount]);

  // Reset display count when category or search changes
  useEffect(() => {
    setDisplayCount(20);
  }, [selectedCategory, searchQuery, currentView]);

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#1a1a1a] font-serif selection:bg-[#5A5A40] selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-[#f5f5f0]/80 backdrop-blur-md border-b border-[#1a1a1a]/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('Home')}>
            <div className="w-10 h-10 bg-[#5A5A40] rounded-full flex items-center justify-center text-white">
              <Library size={20} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Ziyo Kutubxonasi</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setCurrentView('Home')}
              className={`text-sm uppercase tracking-widest font-sans font-semibold transition-colors ${currentView === 'Home' ? 'text-[#5A5A40]' : 'hover:text-[#5A5A40]'}`}
            >
              Katalog
            </button>
            <button 
              onClick={() => setCurrentView('Saved')}
              className={`text-sm uppercase tracking-widest font-sans font-semibold transition-colors ${currentView === 'Saved' ? 'text-[#5A5A40]' : 'hover:text-[#5A5A40]'}`}
            >
              Saqlanganlar
            </button>
            <button 
              onClick={() => setCurrentView('About')}
              className={`text-sm uppercase tracking-widest font-sans font-semibold transition-colors ${currentView === 'About' ? 'text-[#5A5A40]' : 'hover:text-[#5A5A40]'}`}
            >
              Biz haqimizda
            </button>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a1a1a]/40 group-focus-within:text-[#5A5A40] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Kitob yoki muallif qidirish..."
              className="pl-10 pr-4 py-2 bg-white border border-[#1a1a1a]/10 rounded-full text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] w-64 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {currentView === 'About' ? (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto py-12"
          >
            <h2 className="text-5xl font-light mb-12 italic">Biz haqimizda</h2>
            
            <div className="space-y-12 font-sans text-lg leading-relaxed text-[#1a1a1a]/80">
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-[#1a1a1a]/5">
                <div className="flex items-center gap-4 mb-6 text-[#5A5A40]">
                  <Code size={32} />
                  <h3 className="text-2xl font-bold text-[#1a1a1a]">Loyiha maqsadi</h3>
                </div>
                <p>
                  Ziyo Kutubxonasi - bu zamonaviy texnologiyalar va klassik adabiyotning uyg'unlashuvi. 
                  Bizning maqsadimiz jahon adabiyoti durdonalarini har bir foydalanuvchi uchun ochiq, 
                  bepul va eng asosiysi, qulay interfeys orqali taqdim etishdir. Hozirda bizning bazamizda 
                  minglab kitoblar mavjud va biz doimiy ravishda kolleksiyamizni kengaytirib bormoqdamiz.
                </p>
              </div>

              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-[#1a1a1a]/5">
                <div className="flex items-center gap-4 mb-6 text-[#5A5A40]">
                  <Cpu size={32} />
                  <h3 className="text-2xl font-bold text-[#1a1a1a]">Texnologik asos</h3>
                </div>
                <p className="mb-4">Ushbu platforma eng so'nggi veb-texnologiyalar yordamida yaratilgan:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>React 19:</strong> Interfeysning yuqori tezligi va reaktivligini ta'minlaydi.</li>
                  <li><strong>TypeScript:</strong> Kodning xavfsizligi va mustahkamligini kafolatlaydi.</li>
                  <li><strong>Tailwind CSS:</strong> Zamonaviy va moslashuvchan dizayn tizimi.</li>
                  <li><strong>Framer Motion:</strong> Silliq va tabiiy animatsiyalar uchun.</li>
                  <li><strong>Project Gutenberg API:</strong> 600 dan ortiq ochiq manbali kitoblar bazasi.</li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-[#1a1a1a]/5">
                <div className="flex items-center gap-4 mb-6 text-[#5A5A40]">
                  <Palette size={32} />
                  <h3 className="text-2xl font-bold text-[#1a1a1a]">Dizayn falsafasi</h3>
                </div>
                <p>
                  Biz "Warm Organic" dizayn uslubidan foydalandik. Bu uslub ko'zga yoqimli ranglar palitrasini 
                  va yumshoq shakllarni o'z ichiga oladi, bu esa uzoq vaqt davomida kitob o'qiganda ko'zning 
                  charchashini oldini oladi va mutolaa jarayonini yanada yoqimli qiladi.
                </p>
              </div>
            </div>
          </motion.section>
        ) : (
          <>
            {/* Hero Section */}
            {currentView === 'Home' && searchQuery === '' && (
              <section className="mb-20">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                  >
                    <span className="inline-block px-3 py-1 bg-[#5A5A40]/10 text-[#5A5A40] rounded-full text-xs font-sans font-bold uppercase tracking-widest mb-6">
                      Bilim - bu nur
                    </span>
                    <h2 className="text-6xl font-light leading-tight mb-8">
                      Jahon durdonalarini <br />
                      <span className="italic font-serif">bir joyda</span> o'qing.
                    </h2>
                    <p className="text-lg text-[#1a1a1a]/70 max-w-md mb-10 font-sans leading-relaxed">
                      600 dan ortiq rus va chet el adabiyoti durdonalari. Istalgan vaqtda, istalgan joyda mutolaa qiling.
                    </p>
                    <button 
                      onClick={() => {
                        const el = document.getElementById('book-grid');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-[#5A5A40] text-white px-8 py-4 rounded-full font-sans font-bold hover:bg-[#4a4a34] transition-all shadow-lg shadow-[#5A5A40]/20 flex items-center gap-2 group"
                    >
                      Katalogga o'tish
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                  
                  <div className="relative hidden md:block">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl rotate-3"
                    >
                      <img 
                        src="https://picsum.photos/seed/library-hero-v2/800/1000" 
                        alt="Library" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  </div>
                </div>
              </section>
            )}

            {/* Categories */}
            <section className="mb-12 overflow-x-auto pb-4 scrollbar-hide">
              <div className="flex gap-4 min-w-max">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-2 rounded-full font-sans text-sm font-semibold transition-all border ${
                      selectedCategory === cat 
                        ? 'bg-[#5A5A40] text-white border-[#5A5A40]' 
                        : 'bg-white text-[#1a1a1a]/60 border-[#1a1a1a]/10 hover:border-[#5A5A40] hover:text-[#5A5A40]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            {/* Book Grid */}
            <section id="book-grid">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">
                  {currentView === 'Saved' ? 'Saqlangan kitoblar' : `${selectedCategory} kitoblar`}
                </h3>
                <span className="text-sm text-[#1a1a1a]/40 font-sans">{filteredBooks.length} ta kitob topildi</span>
              </div>

              {filteredBooks.length === 0 ? (
                <div className="py-20 text-center">
                  <BookIcon size={48} className="mx-auto mb-4 text-[#1a1a1a]/10" />
                  <p className="text-[#1a1a1a]/40 font-sans">Hech qanday kitob topilmadi.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                  <AnimatePresence mode="popLayout">
                    {displayedBooks.map((book) => (
                      <motion.div
                        layout
                        key={book.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -10 }}
                        className="group cursor-pointer"
                        onClick={() => setSelectedBook(book)}
                      >
                        <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-all mb-4 relative">
                          <img 
                            src={book.coverImage} 
                            alt={book.title} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <BookOpen className="text-white" size={32} />
                          </div>
                          {savedBookIds.includes(book.id) && (
                            <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-[#5A5A40] shadow-sm">
                              <Heart size={16} fill="currentColor" />
                            </div>
                          )}
                        </div>
                        <h4 className="font-bold text-lg leading-tight mb-1 group-hover:text-[#5A5A40] transition-colors line-clamp-2">{book.title}</h4>
                        <p className="text-sm text-[#1a1a1a]/50 font-sans mb-2">{book.author}</p>
                        <div className="flex items-center gap-1 text-[#5A5A40]">
                          <Star size={14} fill="currentColor" />
                          <span className="text-xs font-bold font-sans">{book.rating.toFixed(1)}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {filteredBooks.length > displayCount && (
                <div className="mt-16 text-center">
                  <button 
                    onClick={() => setDisplayCount(prev => prev + 20)}
                    className="px-10 py-4 border-2 border-[#5A5A40] text-[#5A5A40] rounded-full font-sans font-bold hover:bg-[#5A5A40] hover:text-white transition-all"
                  >
                    Yana ko'proq yuklash
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Book Details Modal */}
      <AnimatePresence>
        {selectedBook && !isReaderOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedBook(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="md:w-2/5 aspect-[3/4] md:aspect-auto relative">
                <img 
                  src={selectedBook.coverImage} 
                  alt={selectedBook.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setSelectedBook(null)}
                  className="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all md:hidden"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="md:w-3/5 p-12 relative">
                <button 
                  onClick={() => setSelectedBook(null)}
                  className="absolute top-8 right-8 text-[#1a1a1a]/20 hover:text-[#1a1a1a] transition-colors hidden md:block"
                >
                  <X size={24} />
                </button>

                <div className="mb-8">
                  <span className="text-[#5A5A40] text-xs font-bold font-sans uppercase tracking-widest mb-2 block">
                    {selectedBook.category}
                  </span>
                  <h3 className="text-4xl font-bold mb-2">{selectedBook.title}</h3>
                  <p className="text-xl text-[#1a1a1a]/60 italic">{selectedBook.author}</p>
                </div>

                <div className="flex gap-8 mb-8 border-y border-[#1a1a1a]/5 py-6">
                  <div>
                    <p className="text-xs text-[#1a1a1a]/40 font-sans uppercase mb-1">Reyting</p>
                    <div className="flex items-center gap-1">
                      <Star size={16} fill="#5A5A40" className="text-[#5A5A40]" />
                      <span className="font-bold">{selectedBook.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[#1a1a1a]/40 font-sans uppercase mb-1">Yil</p>
                    <p className="font-bold">{selectedBook.year}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#1a1a1a]/40 font-sans uppercase mb-1">Til</p>
                    <p className="font-bold">English</p>
                  </div>
                </div>

                <p className="text-[#1a1a1a]/70 leading-relaxed mb-10 font-sans">
                  {selectedBook.description}
                </p>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsReaderOpen(true)}
                    className="flex-1 bg-[#5A5A40] text-white py-4 rounded-full font-sans font-bold hover:bg-[#4a4a34] transition-all flex items-center justify-center gap-2"
                  >
                    <BookOpen size={18} />
                    Hozir o'qish
                  </button>
                  <button 
                    onClick={() => toggleSaveBook(selectedBook.id)}
                    className={`w-14 h-14 border rounded-full flex items-center justify-center transition-all ${
                      savedBookIds.includes(selectedBook.id) 
                        ? 'bg-[#5A5A40] border-[#5A5A40] text-white' 
                        : 'border-[#1a1a1a]/10 text-[#1a1a1a]/40 hover:text-[#5A5A40] hover:border-[#5A5A40]'
                    }`}
                  >
                    <Heart size={20} fill={savedBookIds.includes(selectedBook.id) ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reader View */}
      <AnimatePresence>
        {isReaderOpen && selectedBook && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-white flex flex-col"
          >
            <div className="bg-[#f5f5f0] border-b border-[#1a1a1a]/5 px-6 py-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsReaderOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-[#1a1a1a]"
                >
                  <X size={24} />
                </button>
                <div className="h-8 w-[1px] bg-[#1a1a1a]/10 mx-2 hidden sm:block" />
                <div>
                  <h5 className="font-bold leading-none mb-1 text-lg">{selectedBook.title}</h5>
                  <p className="text-xs text-[#1a1a1a]/40 font-sans tracking-wide uppercase">{selectedBook.author}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const iframe = document.querySelector('iframe');
                    if (iframe) iframe.src = iframe.src;
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-[#1a1a1a]/60"
                  title="Yangilash"
                >
                  <Cpu size={20} />
                </button>
                <a 
                  href={selectedBook.contentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-[#1a1a1a]/60"
                  title="Yangi oynada ochish"
                >
                  <Maximize2 size={20} />
                </a>
                <button 
                  onClick={() => toggleSaveBook(selectedBook.id)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${savedBookIds.includes(selectedBook.id) ? 'text-[#5A5A40]' : 'text-[#1a1a1a]/60 hover:bg-black/5'}`}
                >
                  <Heart size={20} fill={savedBookIds.includes(selectedBook.id) ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-[#e8e8e0] overflow-hidden relative flex flex-col items-center">
              <div className="w-full h-full max-w-5xl bg-white shadow-2xl relative">
                <iframe 
                  src={selectedBook.contentUrl} 
                  className="w-full h-full border-none"
                  title={selectedBook.title}
                  allow="autoplay"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-[#1a1a1a]/5 py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-[#5A5A40] rounded-full flex items-center justify-center text-white">
                <Library size={16} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Ziyo Kutubxonasi</h1>
            </div>
            <p className="text-[#1a1a1a]/50 max-w-md font-sans leading-relaxed">
              Bizning maqsadimiz - har bir inson uchun sifatli va bepul bilim olish imkoniyatini yaratish. 
              Dunyo adabiyoti va ilmiy merosini asrab-avaylash va tarqatish.
            </p>
          </div>
          
          <div>
            <h5 className="font-bold mb-6 font-sans uppercase text-xs tracking-widest">Bo'limlar</h5>
            <ul className="space-y-4 text-sm font-sans text-[#1a1a1a]/60">
              <li><button onClick={() => setCurrentView('Home')} className="hover:text-[#5A5A40] transition-colors">Barcha kitoblar</button></li>
              <li><button onClick={() => setCurrentView('Saved')} className="hover:text-[#5A5A40] transition-colors">Saqlanganlar</button></li>
              <li><button onClick={() => setCurrentView('About')} className="hover:text-[#5A5A40] transition-colors">Biz haqimizda</button></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold mb-6 font-sans uppercase text-xs tracking-widest">Bog'lanish</h5>
            <ul className="space-y-4 text-sm font-sans text-[#1a1a1a]/60">
              <li>gamer20061805@gmail.com</li>
              <li>+998 772754979</li>
              <li>Yunusobod 7-16</li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-[#1a1a1a]/5 flex flex-col md:row items-center justify-between gap-4">
          <p className="text-xs text-[#1a1a1a]/30 font-sans">© 2026 Ziyo Kutubxonasi. Barcha huquqlar himoyalangan.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-[#1a1a1a]/30 hover:text-[#5A5A40] font-sans">Maxfiylik siyosati</a>
            <a href="#" className="text-xs text-[#1a1a1a]/30 hover:text-[#5A5A40] font-sans">Foydalanish shartlari</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

