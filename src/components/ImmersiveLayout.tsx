import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';

interface ImmersiveLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
}

export const ImmersiveLayout = ({
  children,
  showSidebar = false,
  onToggleSidebar
}: ImmersiveLayoutProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleImmersive = () => {
    setIsImmersive(!isImmersive);
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Left sidebar */}
      <AnimatePresence>
        {(showSidebar || isImmersive) && (
          <motion.div
            initial={{ x: -120 }}
            animate={{ x: 0 }}
            exit={{ x: -120 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 w-[120px] bg-black/95 backdrop-blur-sm z-40 border-r border-white/10"
          >
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <button
                onClick={onToggleSidebar}
                className="p-3 text-white/70 hover:text-white transition-colors duration-300"
                aria-label="Fechar painel lateral"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="text-center">
                <div className="text-xs text-white/60 tracking-widest uppercase mb-2">
                  Navegação
                </div>
                <div className="space-y-3 text-sm">
                  <div className="text-white/40">• Mata</div>
                  <div className="text-white/40">• Mar</div>
                  <div className="text-white/40">• Ar</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right sidebar */}
      <AnimatePresence>
        {isImmersive && (
          <motion.div
            initial={{ x: 120 }}
            animate={{ x: 0 }}
            exit={{ x: 120 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-[120px] bg-black/95 backdrop-blur-sm z-40 border-l border-white/10"
          >
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <button
                onClick={toggleImmersive}
                className="p-3 text-white/70 hover:text-white transition-colors duration-300"
                aria-label="Sair do modo imersivo"
              >
                <Minimize size={24} />
              </button>

              <div className="text-center">
                <div className="text-xs text-white/60 tracking-widest uppercase mb-2">
                  Controles
                </div>
                <div className="space-y-3 text-sm">
                  <div className="text-white/40">• Zoom</div>
                  <div className="text-white/40">• Áudio</div>
                  <div className="text-white/40">• Dados</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content with responsive padding */}
      <motion.div
        animate={{
          marginLeft: (showSidebar || isImmersive) ? '120px' : '0px',
          marginRight: isImmersive ? '120px' : '0px',
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-30"
      >
        {children}
      </motion.div>

      {/* Mobile immersive toggle */}
      {isMobile && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          onClick={toggleImmersive}
          className="fixed bottom-6 right-6 z-50 p-4 bg-black/80 backdrop-blur-sm border border-white/20 rounded-full text-white/70 hover:text-white hover:border-white/40 transition-all duration-300"
          aria-label="Alternar modo imersivo"
        >
          <Maximize size={20} />
        </motion.button>
      )}

      {/* Immersive mode indicator */}
      <AnimatePresence>
        {isImmersive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 bg-black/80 backdrop-blur-sm border border-white/20 rounded-full"
          >
            <span className="text-xs text-white/60 tracking-widest uppercase">
              Modo Imersivo
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};