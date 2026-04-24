import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X, Menu } from 'lucide-react';

export const SeriesNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isMar = location.pathname === '/mar';
  const isAbout = location.pathname === '/sobre';

  return (
    <>
      {/* Fixed center brand - always visible */}
      <Link
        to="/sobre"
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 group"
        aria-label="Sobre a série M_at_A_R"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
          className="relative"
        >
          <h1 className="text-2xl md:text-3xl font-light tracking-[0.3em] text-foreground hover:text-foreground transition-colors duration-700">
             <span className="text-foreground">M</span>
             <span className="text-foreground/60">_</span>
             <span className="text-foreground">at</span>
             <span className="text-foreground/60">_</span>
             <span className="text-foreground">A</span>
             <span className="text-foreground/60">_</span>
             <span className="text-foreground">R</span>
          </h1>
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[0.65rem] tracking-[0.15em] uppercase text-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500 whitespace-nowrap">
            sobre a série
          </span>
        </motion.div>
      </Link>

      {/* Menu toggle button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed top-6 right-6 z-50 p-2 text-foreground/70 hover:text-foreground transition-colors duration-500"
        aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
      >
        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </motion.button>

      {/* Navigation overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-lg flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex flex-col items-center gap-8 text-center"
            >
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className={`text-xl md:text-2xl font-light tracking-wide transition-colors duration-500 ${
                  isHome ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                Mata
                <span className="block text-xs tracking-[0.2em] uppercase text-foreground/70 mt-1">
                  em desaparecimento
                </span>
              </Link>

              <div className="w-px h-8 bg-border/30" />

              <Link
                to="/sobre"
                onClick={() => setIsMenuOpen(false)}
                className={`text-xl md:text-2xl font-light tracking-wide transition-colors duration-500 ${
                  isAbout ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                Sobre
                <span className="block text-xs tracking-[0.2em] uppercase text-foreground/70 mt-1">
                  a série M_at_A_R
                </span>
              </Link>

              <div className="w-px h-8 bg-border/30" />

              <Link
                to="/mar"
                onClick={() => setIsMenuOpen(false)}
                className={`text-xl md:text-2xl font-light tracking-wide transition-colors duration-500 ${
                  isMar ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                Mar
                <span className="block text-xs tracking-[0.2em] uppercase text-foreground/70 mt-1">
                  em dissolução
                </span>
              </Link>

              <Link
                to="/ar"
                onClick={() => setIsMenuOpen(false)}
                className={`text-xl md:text-2xl font-light tracking-wide transition-colors duration-500 ${
                  location.pathname === '/ar' ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                Ar
                <span className="block text-xs tracking-[0.2em] uppercase text-foreground/70 mt-1">
                  em dispersão
                </span>
              </Link>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
};
