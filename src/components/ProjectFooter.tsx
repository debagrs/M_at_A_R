import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface ProjectFooterProps {
  isVisible?: boolean;
}

export function ProjectFooter({ isVisible = true }: ProjectFooterProps) {
  if (!isVisible) return null;

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, delay: 2, ease: [0.4, 0, 0.2, 1] }}
      className="ui-element fixed bottom-0 left-0 right-0 z-20 pointer-events-none"
      role="contentinfo"
      aria-label="Informações do projeto"
    >
      <div className="flex items-end justify-between px-4 md:px-10 py-3 md:py-4">
        <div className="pointer-events-auto">
          <Link
            to="/sobre"
            className="text-[10px] md:text-xs tracking-wide text-foreground/80 hover:text-foreground transition-colors duration-700"
          >
            Sobre o projeto →
          </Link>
        </div>
        
        <div className="text-right">
          <p className="text-[9px] md:text-[10px] tracking-[0.15em] uppercase text-foreground/70">
            um projeto de
          </p>
          <p className="text-[10px] md:text-xs tracking-wide text-foreground/80 mt-0.5">
            Débora Aita Gasparetto
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
