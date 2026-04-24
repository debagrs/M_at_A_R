import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AirHumanLayerData {
  transportUsage: number;       // 0-1
  energyConsumption: number;    // 0-1
  airQualityAwareness: number;  // 0-1
  climatePerception: number;    // 0-1
}

interface AirParticipationDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: AirHumanLayerData) => void;
}

const questions = [
  {
    id: 'transportUsage',
    question: 'Com que frequência você usa transporte individual motorizado?',
    labels: ['Diariamente', 'Nunca'],
  },
  {
    id: 'energyConsumption',
    question: 'Qual seu nível de consumo de energia?',
    labels: ['Muito alto', 'Mínimo'],
  },
  {
    id: 'airQualityAwareness',
    question: 'Você monitora a qualidade do ar onde vive?',
    labels: ['Desconheço', 'Monitoro ativamente'],
  },
  {
    id: 'climatePerception',
    question: 'Você percebe mudanças climáticas no seu cotidiano?',
    labels: ['Não percebo', 'Sinto diretamente'],
  },
];

export function AirParticipationDashboard({ isOpen, onClose, onUpdate }: AirParticipationDashboardProps) {
  const [values, setValues] = useState<AirHumanLayerData>({
    transportUsage: 0.5,
    energyConsumption: 0.5,
    airQualityAwareness: 0.5,
    climatePerception: 0.5,
  });

  const handleChange = useCallback((id: keyof AirHumanLayerData, value: number) => {
    const newValues = { ...values, [id]: value };
    setValues(newValues);
    onUpdate(newValues);
  }, [values, onUpdate]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="ui-element fixed right-0 top-0 bottom-0 w-80 z-30 panel-ethical"
        >
          <div className="h-full flex flex-col p-8 overflow-y-auto">
            <div className="mb-12">
              <h2 className="text-conceptual text-xl text-foreground mb-2">
                Camada humana
              </h2>
              <p className="text-whisper text-sm text-foreground/80">
                Suas respostas alteram temporariamente a visualização.
                Nenhum dado é armazenado.
              </p>
            </div>

            <div className="flex-1 space-y-10">
              {questions.map((q, index) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.15,
                    duration: 0.6,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  <label className="block">
                    <span className="text-conceptual text-sm text-foreground block mb-4">
                      {q.question}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={values[q.id as keyof AirHumanLayerData]}
                      onChange={(e) =>
                        handleChange(q.id as keyof AirHumanLayerData, parseFloat(e.target.value))
                      }
                      className="slider-organic w-full"
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-data text-foreground/70 text-xs">{q.labels[0]}</span>
                      <span className="text-data text-foreground/70 text-xs">{q.labels[1]}</span>
                    </div>
                  </label>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={onClose}
              className="mt-8 text-whisper text-sm text-foreground/70 hover:text-foreground transition-colors duration-500 text-left"
              whileHover={{ x: 4 }}
              transition={{ duration: 0.3 }}
            >
              ← Observar apenas
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
