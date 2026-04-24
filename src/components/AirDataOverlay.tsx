import { motion, AnimatePresence } from 'framer-motion';
import { airDataSources, type AirData } from '@/lib/airData';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AirDataOverlayProps {
  data: AirData;
  isVisible: boolean;
  isLiveData?: boolean;
}

const tooltipDescriptions: Record<string, { description: string; impact: string; politics: string }> = {
  co2: {
    description: 'Concentração atmosférica de CO₂ (ppm) via NOAA Global Monitoring Laboratory e Copernicus CAMS — ultrapassamos 424ppm em 2024, o nível mais alto em 4 milhões de anos.',
    impact: 'Controla a densidade do ruído visual e a aberração cromática — níveis maiores adensam a textura granulada e deslocam canais de cor, como interferência em dados de satélite sobrecarregados.',
    politics: 'A curva de Keeling não mente, mas as metas de emissão se movem a cada COP. O dado permanece; as promessas evaporam.',
  },
  particulates: {
    description: 'Material particulado PM2.5 (µg/m³) via Copernicus CAMS e OMS — partículas invisíveis que causam 4.2 milhões de mortes prematuras por ano segundo a OMS.',
    impact: 'Governa a quantidade de partículas flutuantes e a corrupção de bandas horizontais — quanto mais poluição, mais pontos erráticos e mais dados se fragmentam na tela.',
    politics: 'Os limites "seguros" da OMS foram reduzidos em 2021, tornando 99% da população mundial exposta. Os padrões nacionais permanecem mais frouxos.',
  },
  methane: {
    description: 'Metano atmosférico CH₄ (ppb) via NOAA GML e Copernicus CAMS — gás 80x mais potente que CO₂ no curto prazo, com emissões acelerando desde 2020.',
    impact: 'Dissolve as formas visuais em fantasmas translúcidos — o metano torna as estruturas da imagem espectrais, como se o próprio ar perdesse materialidade.',
    politics: 'Vazamentos de metano da indústria fóssil são sistematicamente subreportados. Satélites recentes revelam emissões 70% maiores que as declaradas.',
  },
  ozone: {
    description: 'Camada de ozônio (Unidades Dobson) via Copernicus CAMS e NOAA — exemplo raro de sucesso: o Protocolo de Montreal reduziu a destruição, mas a recuperação total levará até 2066.',
    impact: 'Intensifica a névoa atmosférica e o embaçamento — a depleção cria uma bruma que apaga a profundidade, como radiação UV que o olho não vê mas o corpo absorve.',
    politics: 'O ozônio é o único caso em que dados levaram a ação global efetiva. A pergunta que resta: por que só nesse caso?',
  },
};

export function AirDataOverlay({ data, isVisible, isLiveData = false }: AirDataOverlayProps) {
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
                    <span className="w-2 h-2 rounded-full bg-data-air animate-pulse" />
                  )}
                  <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 font-mono">
                    {isLiveData ? 'Atmosfera // Tempo real' : 'Atmosfera // Dados modelados'}
                  </span>
                </div>
                <p className="text-[9px] text-foreground/30 font-mono leading-relaxed">
                  O ar que respiramos carrega os dados que escolhemos ignorar.
                </p>
              </motion.div>

              <AirDataIndicator
                label={airDataSources.co2.label}
                value={data.co2}
                sources={data.sources?.co2 ? [data.sources.co2] : airDataSources.co2.sources}
                color="data-air"
                tooltip={tooltipDescriptions.co2}
              />
              
              <AirDataIndicator
                label={airDataSources.particulates.label}
                value={data.particulates}
                sources={data.sources?.particulates ? [data.sources.particulates] : airDataSources.particulates.sources}
                color="data-particulates"
                tooltip={tooltipDescriptions.particulates}
              />
              
              <AirDataIndicator
                label={airDataSources.methane.label}
                value={data.methane}
                sources={data.sources?.methane ? [data.sources.methane] : airDataSources.methane.sources}
                color="data-methane"
                tooltip={tooltipDescriptions.methane}
              />
              
              <AirDataIndicator
                label={airDataSources.ozone.label}
                value={data.ozone}
                sources={data.sources?.ozone ? [data.sources.ozone] : airDataSources.ozone.sources}
                color="data-ozone"
                tooltip={tooltipDescriptions.ozone}
              />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1.5 }}
                className="pt-2 border-t border-border/20"
              >
                <p className="text-[8px] text-foreground/25 font-mono leading-relaxed tracking-wide">
                  NOAA GML · Copernicus CAMS · OMS · Keeling Curve
                </p>
                <p className="text-[8px] text-foreground/20 font-mono mt-1 italic">
                  O dado não respira por nós — mas conta o que estamos respirando.
                </p>
              </motion.div>
            </div>
          </TooltipProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface AirDataIndicatorProps {
  label: string;
  value: number;
  sources: string[];
  color: string;
  tooltip: { description: string; impact: string; politics: string };
}

function AirDataIndicator({ label, value, sources, color, tooltip }: AirDataIndicatorProps) {
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
                left: [`${value * 80}%`, `${value * 100}%`, `${value * 85}%`],
                opacity: [0.2, 0.5, 0.15],
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '7%',
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
