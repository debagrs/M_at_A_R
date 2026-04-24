import { motion } from 'framer-motion';

interface ModeToggleProps {
  isInstallationMode: boolean;
  onToggle: () => void;
}

export function ModeToggle({ isInstallationMode, onToggle }: ModeToggleProps) {
  return (
    <motion.button
      onClick={onToggle}
      className="mode-toggle top-4 right-4 p-3"
      aria-label={isInstallationMode ? 'Sair do modo instalação' : 'Entrar no modo instalação'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 1 }}
    >
      <motion.div
        className="w-8 h-8 border border-foreground/30 rounded-sm flex items-center justify-center"
        whileHover={{ borderColor: 'hsl(var(--foreground) / 0.5)' }}
      >
        {isInstallationMode ? (
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 14 14" 
            fill="none"
            className="text-foreground/70"
          >
            <rect x="1" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1" />
            <rect x="8" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1" />
            <rect x="1" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1" />
            <rect x="8" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1" />
          </svg>
        ) : (
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 14 14" 
            fill="none"
            className="text-foreground/70"
          >
            <rect x="1" y="1" width="12" height="12" stroke="currentColor" strokeWidth="1" />
          </svg>
        )}
      </motion.div>
    </motion.button>
  );
}
