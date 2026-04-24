import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavbarProps {
  isInstallationMode?: boolean;
  onToggleInstallation?: () => void;
}

export const Navbar = ({ isInstallationMode, onToggleInstallation }: NavbarProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const links = [
    { to: '/mata', label: 'Mata' },
    { to: '/mar', label: 'Mar' },
    { to: '/ar', label: 'Ar' },
    { to: '/sobre', label: 'Sobre' },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-10 py-4 pointer-events-none"
      role="navigation"
      aria-label="Navegação principal"
    >
      {/* Left side links */}
      <div className="flex items-center gap-3 md:gap-6 pointer-events-auto">
        {links.slice(0, 2).map((link) => (
          <Link
            key={link.to}
            to={link.to}
            aria-current={currentPath === link.to ? 'page' : undefined}
            className={`text-[10px] md:text-xs tracking-[0.2em] uppercase transition-colors duration-500 ${
              currentPath === link.to
                ? 'text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Center brand - link to home */}
      <Link
        to="/"
        className="pointer-events-auto group"
        aria-label="Página inicial M_at_A_R"
      >
        <span className="text-lg md:text-2xl font-light tracking-[0.3em] text-white/90 hover:text-white transition-colors duration-700">
          <span className="text-white">M</span>
          <span className="text-white/60">_</span>
          <span className="text-white">at</span>
          <span className="text-white/60">_</span>
          <span className="text-white">A</span>
          <span className="text-white/60">_</span>
          <span className="text-white">R</span>
        </span>
      </Link>

      {/* Right side: links + mode toggle */}
      <div className="flex items-center gap-3 md:gap-6 pointer-events-auto">
        {links.slice(2).map((link) => (
          <Link
            key={link.to}
            to={link.to}
            aria-current={currentPath === link.to ? 'page' : undefined}
            className={`text-[10px] md:text-xs tracking-[0.2em] uppercase transition-colors duration-500 ${
              currentPath === link.to
                ? 'text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        ))}

        {/* Mode toggle integrated in navbar */}
        {onToggleInstallation !== undefined && (
          <button
            onClick={onToggleInstallation}
            className="ml-1 md:ml-3 p-1 transition-opacity duration-500 opacity-60 hover:opacity-100 focus:opacity-100"
            aria-label={isInstallationMode ? 'Sair do modo instalação' : 'Entrar no modo instalação'}
            title={isInstallationMode ? 'Sair do modo instalação' : 'Modo instalação'}
          >
            <div className="w-6 h-6 md:w-7 md:h-7 border border-white/30 rounded-sm flex items-center justify-center hover:border-white/50 transition-colors duration-300">
              {isInstallationMode ? (
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-white/70">
                  <rect x="1" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1" />
                  <rect x="8" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1" />
                  <rect x="1" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1" />
                  <rect x="8" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-white/70">
                  <rect x="1" y="1" width="12" height="12" stroke="currentColor" strokeWidth="1" />
                </svg>
              )}
            </div>
          </button>
        )}
      </div>
    </motion.nav>
  );
};
