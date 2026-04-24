import { motion, AnimatePresence } from 'framer-motion';
import { dataSources, type EnvironmentalData } from '@/lib/environmentalData';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DataOverlayProps {
  data: EnvironmentalData;
  isVisible: boolean;
  isLiveData?: boolean;
}

const tooltipDescriptions: Record<string, { description: string; impact: string; politics: string }> = {
  deforestation: {
    description: 'Taxa anual de perda de cobertura florestal, medida por satélite via Global Forest Watch e pelo sistema PRODES/INPE — dados que governos frequentemente contestam ou atrasam a publicação.',
    impact: 'Controla a fragmentação radial e a aberração cromática — quanto maior o desmatamento, mais a imagem se fragmenta em blocos de dados corrompidos, como transmissões de satélite interrompidas por interesses econômicos.',
    politics: 'O INPE teve diretores exonerados por divulgar dados inconvenientes. O satélite vê o que o discurso nega.',
  },
  meatConsumption: {
    description: 'Consumo global de carne per capita (FAO Food Balance Sheets) — dado que conecta o prato individual à destruição sistêmica de biomas para pastagem e monocultura de ração.',
    impact: 'Governa o escurecimento e a dessaturação — o consumo drena cor e luz da floresta como a indústria drena vida dos ecossistemas. A imagem se torna espectral.',
    politics: 'O agronegócio subsidia a invisibilidade dessa correlação. O dado existe; a narrativa dominante o sepulta.',
  },
  woodExtraction: {
    description: 'Volume global de extração de madeira (m³/ano) via FAOSTAT — dados que subestimam a extração ilegal, estimada em 50-90% do total em regiões tropicais.',
    impact: 'Intensifica a pixelação e corrupção de dados visuais — como se a própria resolução da imagem fosse sendo extraída, deixando apenas ruído onde havia informação.',
    politics: 'A madeira ilegal financia cadeias que os dados oficiais não capturam. O glitch é o que escapa do registro.',
  },
};

export function DataOverlay({ data, isVisible, isLiveData = false }: DataOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
          className="ui-element fixed bottom-8 left-8 z-20 max-w-sm"
        >
          <TooltipProvider delayDuration={300}>
            <div className="bg-background/60 backdrop-blur-md rounded-lg p-4 border border-border/30 space-y-6">
              {/* Satellite provenance header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="space-y-1"
              >
                <div className="flex items-center gap-2">
                  {isLiveData && (
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  )}
                  <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 font-mono">
                    {isLiveData ? 'Satélite // Tempo real' : 'Satélite // Dados modelados'}
                  </span>
                </div>
                <p className="text-[9px] text-foreground/30 font-mono leading-relaxed">
                  Para quem servem estes dados? Quem decide o que é visível?
                </p>
              </motion.div>

              <DataIndicator
                label={dataSources.deforestation.label}
                value={data.deforestation}
                sources={data.sources?.deforestation ? [data.sources.deforestation] : dataSources.deforestation.sources}
                color="data-deforestation"
                tooltip={tooltipDescriptions.deforestation}
              />
              
              <DataIndicator
                label={dataSources.meatConsumption.label}
                value={data.meatConsumption}
                sources={data.sources?.meatConsumption ? [data.sources.meatConsumption] : dataSources.meatConsumption.sources}
                color="data-consumption"
                tooltip={tooltipDescriptions.meatConsumption}
              />
              
              <DataIndicator
                label={dataSources.woodExtraction.label}
                value={data.woodExtraction}
                sources={data.sources?.woodExtraction ? [data.sources.woodExtraction] : dataSources.woodExtraction.sources}
                color="data-extraction"
                tooltip={tooltipDescriptions.woodExtraction}
              />

              {/* Political provenance footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1.5 }}
                className="pt-2 border-t border-border/20"
              >
                <p className="text-[8px] text-foreground/25 font-mono leading-relaxed tracking-wide">
                  PRODES/INPE · Global Forest Watch · FAO · FAOSTAT
                </p>
                <p className="text-[8px] text-foreground/20 font-mono mt-1 italic">
                  Dados são artefatos políticos — sua existência é uma disputa.
                </p>
              </motion.div>
            </div>
          </TooltipProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface DataIndicatorProps {
  label: string;
  value: number;
  sources: string[];
  color: string;
  tooltip: { description: string; impact: string; politics: string };
}

function DataIndicator({ label, value, sources, color, tooltip }: DataIndicatorProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          className="group cursor-help"
        >
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-sm font-medium tracking-wide uppercase text-foreground">
              {label}
            </span>
            <span className="text-[10px] font-mono text-foreground/40">
              {(value * 100).toFixed(0)}%
            </span>
          </div>
          
          <div className="relative h-1.5 w-full bg-border/30 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${value * 100}%` }}
              transition={{ duration: 2, ease: [0.7, 0, 0.3, 1] }}
              style={{
                backgroundColor: `hsl(var(--${color}))`,
              }}
            />
            {/* Glitch flicker on bar */}
            <motion.div
              className="absolute inset-y-0 rounded-full opacity-30"
              animate={{ 
                left: [`${value * 80}%`, `${value * 100}%`, `${value * 90}%`],
                opacity: [0.3, 0.6, 0.2],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '8%',
                backgroundColor: `hsl(var(--${color}))`,
              }}
            />
          </div>
          
          <div className="text-[10px] mt-1.5 text-foreground/50 group-hover:text-foreground/80 transition-colors duration-300 font-mono">
            {sources.join(' · ')}
          </div>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs space-y-2 p-3">
        <p className="text-xs leading-relaxed text-popover-foreground/90">{tooltip.description}</p>
        <p className="text-xs leading-relaxed text-popover-foreground/70 italic">
          ↳ Efeito na obra: {tooltip.impact}
        </p>
        <p className="text-[10px] leading-relaxed text-popover-foreground/50 border-t border-border/30 pt-2 mt-2">
          ⚡ {tooltip.politics}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
