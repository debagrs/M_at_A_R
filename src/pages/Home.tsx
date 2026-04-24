import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { PageTransition } from '@/components/PageTransition';
import { ProjectFooter } from '@/components/ProjectFooter';
import { useHomeAudio } from '@/hooks/useHomeAudio';
import mataVideo from '@/assets/mata.mp4';
import marVideo from '@/assets/mar.mp4';
import arVideo from '@/assets/ar.mp4';

interface Fragment {
  id: number;
  // source position (% of card)
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  // screen start position (px)
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  // explosion target (px)
  tx: number;
  ty: number;
  rotate: number;
  delay: number;
}

interface FullscreenShatterProps {
  videoSrc: string;
  fragments: Fragment[];
  cardRect: DOMRect;
  onComplete: () => void;
}

const COLS = 8;
const ROWS = 6;

const FullscreenShatter = ({ videoSrc, fragments, cardRect, onComplete }: FullscreenShatterProps) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[9999] pointer-events-none"
      initial={{ opacity: 1 }}
      aria-hidden="true"
    >
      {/* Black backdrop that fades in */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3, ease: 'easeIn' }}
      />

      {/* Fragments */}
      {fragments.map((frag) => (
        <motion.div
          key={frag.id}
          className="absolute overflow-hidden"
          style={{
            left: frag.startX,
            top: frag.startY,
            width: frag.startW,
            height: frag.startH,
          }}
          initial={{ 
            opacity: 1, 
            x: 0, 
            y: 0, 
            rotate: 0, 
            scale: 1,
          }}
          animate={{
            x: frag.tx,
            y: frag.ty,
            opacity: [1, 1, 0.8, 0],
            rotate: frag.rotate,
            scale: [1, 1.3, 1.1, 0.4],
          }}
          transition={{ 
            duration: 1.2, 
            delay: frag.delay,
            ease: [0.2, 0, 0.6, 1],
            opacity: { duration: 1.2, delay: frag.delay, times: [0, 0.3, 0.7, 1] },
            scale: { duration: 1.2, delay: frag.delay, times: [0, 0.2, 0.5, 1] },
          }}
        >
          <video
            src={videoSrc}
            muted
            loop
            playsInline
            autoPlay
            className="object-cover"
            style={{
              position: 'absolute',
              left: `-${(frag.sx / frag.sw) * 100}%`,
              top: `-${(frag.sy / frag.sh) * 100}%`,
              width: `${100 / frag.sw * 100}%`,
              height: `${100 / frag.sh * 100}%`,
            }}
          />
          {/* Glitch tint per fragment */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.6, delay: frag.delay + 0.1 }}
            style={{
              background: frag.id % 3 === 0 
                ? 'rgba(255,0,0,0.3)' 
                : frag.id % 3 === 1 
                  ? 'rgba(0,255,0,0.2)' 
                  : 'rgba(0,0,255,0.3)',
              mixBlendMode: 'screen',
            }}
          />
        </motion.div>
      ))}

      {/* Scanline overlay during explosion */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0.2, 0] }}
        transition={{ duration: 1.0, delay: 0.1, times: [0, 0.2, 0.5, 1] }}
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
        }}
      />
    </motion.div>,
    document.body
  );
};

interface ArtworkCardProps {
  title: string;
  videoSrc: string;
  route: string;
  index: number;
  onShatter: (videoSrc: string, fragments: Fragment[], cardRect: DOMRect) => void;
}

const ArtworkCard = ({ title, videoSrc, route, index, onShatter }: ArtworkCardProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFragmenting, setIsFragmenting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const handleClick = () => {
    if (isFragmenting) return;
    setIsFragmenting(true);

    const cardEl = cardRef.current;
    if (!cardEl) return;

    const rect = cardEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const newFragments: Fragment[] = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const id = r * COLS + c;
        const sw = 100 / COLS;
        const sh = 100 / ROWS;
        const sx = c * sw;
        const sy = r * sh;

        // Fragment start position in screen pixels
        const startX = rect.left + (sx / 100) * rect.width;
        const startY = rect.top + (sy / 100) * rect.height;
        const startW = (sw / 100) * rect.width;
        const startH = (sh / 100) * rect.height;

        // Calculate explosion vector from card center
        const fragCenterX = startX + startW / 2;
        const fragCenterY = startY + startH / 2;
        const angle = Math.atan2(fragCenterY - centerY, fragCenterX - centerX);
        const dist = Math.max(vw, vh) * (0.5 + Math.random() * 0.7);

        newFragments.push({
          id, sx, sy, sw, sh,
          startX, startY, startW, startH,
          tx: Math.cos(angle) * dist * (0.8 + Math.random() * 0.5),
          ty: Math.sin(angle) * dist * (0.8 + Math.random() * 0.5),
          rotate: (Math.random() - 0.5) * 360,
          delay: Math.random() * 0.15,
        });
      }
    }

    onShatter(videoSrc, newFragments, rect);

    setTimeout(() => {
      navigate(route);
    }, 1300);
  };

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: isFragmenting ? 0 : 1, y: 0 }}
      transition={{ 
        duration: isFragmenting ? 0.3 : 1, 
        delay: isFragmenting ? 0 : 0.8 + index * 0.2, 
        ease: [0.4, 0, 0.2, 1] 
      }}
      className="relative flex flex-col items-center group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      role="link"
      tabIndex={0}
      aria-label={`Entrar na obra ${title}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
    >
      <div className="relative w-full aspect-[4/3] overflow-hidden border border-foreground/30 rounded-sm">
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          loop
          playsInline
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <motion.div
          className="absolute inset-0 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          style={{
            background: 'radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
          }}
          aria-hidden="true"
        />

        <motion.div
          className="absolute inset-0 flex items-center justify-center z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          aria-hidden="true"
        >
          <span className="text-conceptual text-xs md:text-sm tracking-[0.2em] uppercase text-white/90">
            entrar →
          </span>
        </motion.div>

        <motion.div
          className="absolute inset-0 border border-foreground/0 rounded-sm pointer-events-none"
          animate={{
            borderColor: isHovered 
              ? 'hsla(0, 0%, 80%, 0.5)' 
              : 'hsla(0, 0%, 80%, 0)',
          }}
          transition={{ duration: 0.6 }}
          aria-hidden="true"
        />
      </div>

      <div className="w-full border border-t-0 border-foreground/30 rounded-b-sm bg-black/30 backdrop-blur-sm py-2 md:py-3 px-3 md:px-4 text-center">
        <h2 className="text-base md:text-xl font-light tracking-[0.25em] uppercase text-white group-hover:text-white transition-colors duration-700">
          {title}
        </h2>
      </div>
    </motion.article>
  );
};

const Home = () => {
  const [shatter, setShatter] = useState<{
    videoSrc: string;
    fragments: Fragment[];
    cardRect: DOMRect;
  } | null>(null);

  // Audio: ambient nature mixed with glitch
  useHomeAudio(true);

  const handleShatter = useCallback((videoSrc: string, fragments: Fragment[], cardRect: DOMRect) => {
    setShatter({ videoSrc, fragments, cardRect });
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 md:px-12 py-12 md:py-16 relative overflow-hidden" role="main" aria-label="Página inicial M_at_A_R">
        {/* Logo */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: shatter ? 0 : 1, y: 0 }}
          transition={{ duration: shatter ? 0.3 : 1.5, ease: [0.4, 0, 0.2, 1] }}
          className="mb-8 md:mb-16 text-center"
        >
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-light tracking-[0.3em]">
            <span className="text-white">M</span>
            <span className="text-white/60">_</span>
            <span className="text-white">at</span>
            <span className="text-white/60">_</span>
            <span className="text-white">A</span>
            <span className="text-white/60">_</span>
            <span className="text-white">R</span>
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1.5 }}
            className="mt-3 md:mt-4 text-[10px] md:text-xs tracking-[0.3em] uppercase text-white/80"
          >
            Tríptico Ambiental
          </motion.p>
        </motion.header>

        {/* Triptych grid */}
        <section className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8" aria-label="Obras do tríptico">
          <ArtworkCard title="Mata" videoSrc={mataVideo} route="/mata" index={0} onShatter={handleShatter} />
          <ArtworkCard title="Mar" videoSrc={marVideo} route="/mar" index={1} onShatter={handleShatter} />
          <ArtworkCard title="Ar" videoSrc={arVideo} route="/ar" index={2} onShatter={handleShatter} />
        </section>

        {/* Subtle bottom text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: shatter ? 0 : 1 }}
          transition={{ delay: shatter ? 0 : 2, duration: shatter ? 0.3 : 2 }}
          className="mt-8 md:mt-16 text-conceptual text-[10px] md:text-xs text-foreground/80 text-center tracking-wide px-4"
        >
          Dados ambientais em tempo real modulam a degradação da imagem
        </motion.p>
      </div>
      <ProjectFooter />

      {/* Fullscreen shatter portal */}
      {shatter && (
        <FullscreenShatter
          videoSrc={shatter.videoSrc}
          fragments={shatter.fragments}
          cardRect={shatter.cardRect}
          onComplete={() => setShatter(null)}
        />
      )}
    </PageTransition>
  );
};

export default Home;
