import { motion, AnimatePresence } from 'framer-motion';
import { oceanDataSources, type OceanData } from '@/lib/oceanData';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface OceanDataOverlayProps {
  data: OceanData;
  isVisible: boolean;
  isLiveData?: boolean;
}

const tooltipDescriptions: Record<string, { description: string; impact: string; politics: string }> = {
  temperature: {
    description: 'Anomalia da temperatura superficial do oceano via Copernicus Marine Service e NOAA OISST — as medições revelam um aquecimento acelerado que ultrapassa os piores cenários previstos.',
    impact: 'Controla a opacidade e a perda de clareza — temperaturas altas tornam a imagem turva e corrompida, como transmissões de satélite degradadas pela própria atmosfera que medem.',
    politics: 'Os dados de temperatura são os mais disputados politicamente. Cada fração de grau determina bilhões em políticas climáticas.',
  },
  pollution: {
    description: 'Concentração de detritos e microplásticos (partículas/km²) via Ocean Conservancy e NOAA Marine Debris — dados que subestimam o problema: só 1% do plástico oceânico é visível na superfície.',
    impact: 'Intensifica a dissolução e fragmentação cromática — a poluição corrói a integridade visual como microplásticos corroem tecidos marinhos invisíveis ao olho.',
    politics: 'A indústria petroquímica financia estudos que minimizam o impacto. Os dados oficiais capturam menos de 5% do total real.',
  },
  fishing: {
    description: 'Intensidade da pesca industrial (horas) rastreada por AIS via Global Fishing Watch e FAO — embarcações frequentemente desligam transponders para escapar do monitoramento.',
    impact: 'Introduz latência e rastros fantasmagóricos — a pesca excessiva cria ecos visuais de vida que já não existe, vestígios espectrais no dado.',
    politics: 'Frotas inteiras operam "no escuro" — sem sinal de satélite. O que o dado não captura é tão político quanto o que revela.',
  },
  acidification: {
    description: 'Declínio do pH oceânico via NOAA PMEL e Copernicus — os oceanos absorveram 30% do CO₂ emitido desde a revolução industrial, alterando quimicamente a água.',
    impact: 'Governa o embaçamento e a névoa — a acidificação dissolve os contornos como dissolve as conchas dos organismos marinhos. O visual se desfaz quimicamente.',
    politics: 'A acidificação é o "outro problema do CO₂" — invisível à superfície, devastador nas profundezas. Menos de 2% dos oceanos são monitorados em profundidade.',
  },
};

export function OceanDataOverlay({ data, isVisible, isLiveData = false }: OceanDataOverlayProps) {
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
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="space-y-1"
              >
                <div className="flex items-center gap-2">
                  {isLiveData && (
                    <span className="w-2 h-2 rounded-full bg-data-ocean animate-pulse" />
                  )}
                  <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 font-mono">
                    {isLiveData ? 'Sonar // Tempo real' : 'Sonar // Dados modelados'}
                  </span>
                </div>
                <p className="text-[9px] text-foreground/30 font-mono leading-relaxed">
                  O que o satélite não vê, o oceano absorve em silêncio.
                </p>
              </motion.div>

              <OceanDataIndicator
                label={oceanDataSources.temperature.label}
                value={data.temperature}
                sources={data.sources?.temperature ? [data.sources.temperature] : oceanDataSources.temperature.sources}
                color="data-ocean"
                tooltip={tooltipDescriptions.temperature}
              />
              
              <OceanDataIndicator
                label={oceanDataSources.pollution.label}
                value={data.pollution}
                sources={data.sources?.pollution ? [data.sources.pollution] : oceanDataSources.pollution.sources}
                color="data-pollution"
                tooltip={tooltipDescriptions.pollution}
              />
              
              <OceanDataIndicator
                label={oceanDataSources.fishing.label}
                value={data.fishing}
                sources={data.sources?.fishing ? [data.sources.fishing] : oceanDataSources.fishing.sources}
                color="data-fishing"
                tooltip={tooltipDescriptions.fishing}
              />
              
              <OceanDataIndicator
                label={oceanDataSources.acidification.label}
                value={data.acidification}
                sources={data.sources?.acidification ? [data.sources.acidification] : oceanDataSources.acidification.sources}
                color="data-acidification"
                tooltip={tooltipDescriptions.acidification}
              />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1.5 }}
                className="pt-2 border-t border-border/20"
              >
                <p className="text-[8px] text-foreground/25 font-mono leading-relaxed tracking-wide">
                  Copernicus Marine · NOAA OISST · Global Fishing Watch · NOAA PMEL
                </p>
                <p className="text-[8px] text-foreground/20 font-mono mt-1 italic">
                  95% do oceano profundo permanece sem monitoramento.
                </p>
              </motion.div>
            </div>
          </TooltipProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface OceanDataIndicatorProps {
  label: string;
  value: number;
  sources: string[];
  color: string;
  tooltip: { description: string; impact: string; politics: string };
}

function OceanDataIndicator({ label, value, sources, color, tooltip }: OceanDataIndicatorProps) {
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
            <motion.div
              className="absolute inset-y-0 rounded-full opacity-30"
              animate={{ 
                left: [`${value * 80}%`, `${value * 100}%`, `${value * 90}%`],
                opacity: [0.3, 0.5, 0.2],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '6%',
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
