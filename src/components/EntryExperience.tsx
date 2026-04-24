import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface EntryExperienceProps {
  onComplete: (choice: 'observe' | 'participate') => void;
  title?: string;
  subtitle?: string;
  silentText?: string;
}

export function EntryExperience({ 
  onComplete, 
  title,
  subtitle,
  silentText = "A mata respira" 
}: EntryExperienceProps) {
  const [phase, setPhase] = useState<'silent' | 'choice' | 'exiting'>('silent');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('choice');
    }, 4000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleChoice = (choice: 'observe' | 'participate') => {
    setPhase('exiting');
    setTimeout(() => {
      onComplete(choice);
    }, 1500);
  };
  
  const displaySilentText = title 
    ? title === 'Mar' ? 'O mar pulsa' : title === 'Ar' ? 'O ar persiste' : silentText
    : silentText;
  
  return (
    <AnimatePresence>
      {phase !== 'exiting' ? (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: [0.7, 0, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
          role="dialog"
          aria-label="Experiência de entrada"
          aria-live="polite"
        >
          {/* Back to home link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1.5 }}
            className="fixed top-4 left-4 md:top-6 md:left-10 z-50"
          >
            <Link
              to="/"
              className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-foreground/50 hover:text-foreground/90 transition-colors duration-500"
              aria-label="Voltar para a página inicial"
            >
              ← Início
            </Link>
          </motion.div>

          <main className="text-center max-w-lg px-6 md:px-8">
            <AnimatePresence mode="wait">
              {phase === 'silent' && (
                <motion.div
                  key="silent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: [0.4, 0, 0.2, 1] }}
                  className="animate-breathe"
                >
                  <p className="text-conceptual text-xl md:text-2xl text-foreground leading-relaxed">
                    {displaySilentText}
                  </p>
                </motion.div>
              )}
              
              {phase === 'choice' && (
                <motion.div
                  key="choice"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
                  className="space-y-10 md:space-y-12"
                >
                  {subtitle ? (
                    <p className="text-conceptual text-base md:text-lg text-foreground/80">
                      {subtitle}
                    </p>
                  ) : (
                    <p className="text-conceptual text-base md:text-lg text-foreground/80">
                      Você pode observar os dados do mundo,
                      <br />
                      ou participar com sua presença.
                    </p>
                  )}
                  
                  <div className="flex flex-col gap-5 md:gap-6 items-center" role="group" aria-label="Escolha seu modo de experiência">
                    <motion.button
                      onClick={() => handleChoice('observe')}
                      className="text-conceptual text-foreground/90 hover:text-foreground transition-colors duration-700 text-sm md:text-base"
                      whileHover={{ x: 8 }}
                      transition={{ duration: 0.4 }}
                    >
                      Observar dados globais →
                    </motion.button>
                    
                    <motion.button
                      onClick={() => handleChoice('participate')}
                      className="text-conceptual text-foreground/80 hover:text-foreground transition-colors duration-700 text-sm md:text-base"
                      whileHover={{ x: 8 }}
                      transition={{ duration: 0.4 }}
                    >
                      Ativar participação →
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'choice' ? 0.3 : 0 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            aria-hidden="true"
          >
            <div className="w-px h-8 bg-gradient-to-b from-transparent to-foreground/30" />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
