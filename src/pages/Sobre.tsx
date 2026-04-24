import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { PageTransition } from '@/components/PageTransition';
import { ProjectFooter } from '@/components/ProjectFooter';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Sobre = () => {
  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <Navbar />
      

      <main className="relative z-10 max-w-3xl mx-auto px-4 md:px-8 py-20 md:py-32">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          className="space-y-8"
        >
          {/* Title */}
          <header className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl md:text-5xl font-light tracking-[0.2em] mb-4">
              <span className="text-foreground">M</span>
              <span className="text-foreground/60">_</span>
              <span className="text-foreground">at</span>
              <span className="text-foreground/60">_</span>
              <span className="text-foreground">A</span>
              <span className="text-foreground/60">_</span>
              <span className="text-foreground">R</span>
            </h1>
            <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-foreground/70">
              Tríptico Ambiental
            </p>
          </header>

          {/* Introduction */}
          <section className="space-y-6 text-base md:text-xl leading-relaxed text-foreground/90" aria-label="Introdução">
            <p className="text-conceptual">
              <strong className="text-foreground">M_at_A_R</strong> parte da compreensão de que mar, mata e ar constituem sistemas interdependentes, atravessados simultaneamente por processos naturais, ações humanas e mediações tecnológicas. A série estrutura-se como um <em>tríptico ambiental</em> no qual cada obra ativa conjuntos específicos de dados públicos abertos, provenientes de instituições científicas e sistemas de monitoramento ambiental de diferentes países e blocos geopolíticos.
            </p>

            <p className="text-conceptual">
              Ao cruzar dados oriundos de contextos políticos e institucionais distintos, o trabalho não busca uma verdade unificada ou estável, mas evidencia disputas, assimetrias e silenciamentos que atravessam a própria produção do conhecimento ambiental. Os dados não são tratados como registros neutros, mas como <em>artefatos políticos</em>, produzidos por infraestruturas técnicas que respondem a interesses econômicos, estratégicos e ideológicos.
            </p>

            <p className="text-conceptual">
               Nesse sentido, M_at_A_R investiga não apenas o que os dados mostram, mas a quem servem, quem os coleta, quem os interpreta e quais realidades tornam visíveis ou invisíveis.
            </p>
          </section>

          {/* Divider */}
          <div className="flex items-center justify-center py-6 md:py-8" aria-hidden="true">
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* Mar */}
          <section className="space-y-4" aria-label="Sobre a obra Mar">
            <h2 className="text-xl md:text-3xl font-light tracking-wide text-foreground">
              Mar
            </h2>
            <p className="text-sm md:text-lg leading-relaxed text-foreground/85 text-conceptual">
              No trabalho dedicado ao mar, dados relacionados à poluição marinha, temperatura da superfície oceânica, pesca industrial e acidificação — provenientes de programas de observação por satélite e sistemas internacionais de rastreamento da pesca — modulam camadas de opacidade, dissolução e latência da imagem. Fontes como o <em>Copernicus Marine Service</em> (União Europeia), a <em>NOAA</em> (Estados Unidos) e bases vinculadas à <em>FAO</em> evidenciam como diferentes regimes de monitoramento constroem narrativas divergentes sobre aquecimento, exploração e colapso marinho, tornando as incongruências entre essas bases perceptíveis na instabilidade visual.
            </p>
            <Link
              to="/mar"
              className="inline-flex items-center gap-2 text-xs md:text-sm tracking-[0.15em] uppercase text-foreground/80 hover:text-foreground transition-colors duration-500 group"
            >
              <span>Entrar na obra</span>
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
            </Link>
          </section>

          {/* Mata */}
          <section className="space-y-4" aria-label="Sobre a obra Mata">
            <h2 className="text-xl md:text-3xl font-light tracking-wide text-foreground">
              Mata
            </h2>
            <p className="text-sm md:text-lg leading-relaxed text-foreground/85 text-conceptual">
              Na obra dedicada à mata, dados sobre desmatamento, queimadas, extração de madeira e padrões de consumo associados à produção de carne acionam fragmentações abruptas, rupturas e apagamentos da imagem. As informações são extraídas de sistemas como o <em>INPE</em> (Brasil), por meio dos programas <em>PRODES</em> e <em>DETER</em>, da plataforma <em>Global Forest Watch</em> e de bases internacionais da <em>FAO</em>. A justaposição entre dados nacionais e globais evidencia tensões entre soberania, interesses econômicos, políticas ambientais e pressões internacionais, revelando como a floresta é simultaneamente monitorada, explorada e disputada em múltiplas escalas.
            </p>
            <Link
              to="/mata"
              className="inline-flex items-center gap-2 text-xs md:text-sm tracking-[0.15em] uppercase text-foreground/80 hover:text-foreground transition-colors duration-500 group"
            >
              <span>Entrar na obra</span>
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
            </Link>
          </section>

          {/* Ar */}
          <section className="space-y-4" aria-label="Sobre a obra Ar">
            <h2 className="text-xl md:text-3xl font-light tracking-wide text-foreground">
              Ar
            </h2>
            <p className="text-sm md:text-lg leading-relaxed text-foreground/85 text-conceptual">
              Já no trabalho dedicado ao ar, índices de emissões de CO₂, concentração de material particulado e qualidade do ar — provenientes de redes globais de monitoramento atmosférico como a <em>NOAA</em>, o <em>Copernicus Atmosphere Monitoring Service (CAMS)</em> e outras plataformas públicas — interferem na densidade do ruído, na instabilidade do movimento e na quase invisibilidade das formas. A dificuldade histórica e política de visualizar o ar em degradação é traduzida em imagens que oscilam entre presença e desaparecimento, refletindo o caráter difuso, distribuído e frequentemente diluído da poluição atmosférica.
            </p>
            <Link
              to="/ar"
              className="inline-flex items-center gap-2 text-xs md:text-sm tracking-[0.15em] uppercase text-foreground/80 hover:text-foreground transition-colors duration-500 group"
            >
              <span>Entrar na obra</span>
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
            </Link>
          </section>

          {/* Divider */}
          <div className="flex items-center justify-center py-6 md:py-8" aria-hidden="true">
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* Glitch as Language */}
          <section className="space-y-6 text-sm md:text-lg leading-relaxed text-foreground/85 text-conceptual" aria-label="Sobre a linguagem visual">
            <p>
              Em todas as obras, o <em>glitch</em> opera como linguagem crítica — não como efeito estético decorativo, mas como sintoma visual da fricção entre dados científicos, interesses políticos, ecossistemas e ação humana. Falhas, atrasos, ruídos e inconsistências tornam-se estratégias visuais para revelar os limites, as disputas e os conflitos inscritos nas infraestruturas de dados.
            </p>

            <p>
              A série é sustentada por um <em>miolo técnico comum</em>, uma arquitetura compartilhada que se atualiza de forma distinta em cada obra. Esse princípio dialoga com a noção de <em>individuação técnica</em> de Gilbert Simondon, segundo a qual um mesmo núcleo operativo se concretiza em variações singulares conforme o meio, os dados e as relações que o atravessam. Assim, mar, mata e ar não são imagens isoladas, mas atualizações de um mesmo sistema em tensão contínua.
            </p>

            <p>
               Inspirada pelo pensamento sistêmico de Edgar Morin e pela teoria ator-rede de Bruno Latour, M_at_A_R propõe que dados, algoritmos, sensores, plataformas, imagens e decisões humanas atuam como <em>agentes co-constitutivos</em> das realidades ambientais. A poética do trabalho emerge da instabilidade e do colapso parcial: imagens que falham, se desfazem ou se tornam quase imperceptíveis à medida que práticas de consumo, exploração e controle se intensificam.
            </p>

            <p>
              Ao assumir suas próprias contradições — inclusive o uso de tecnologias que também participam de lógicas extrativistas — a série incorpora esse paradoxo como matéria poética, posicionando a arte e o design como campos de mediação bioética, política e educativa, capazes de tornar visíveis tensões que operam muito além da superfície da tela.
            </p>
          </section>

          {/* Footer */}
          <footer className="pt-12 md:pt-16 pb-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs md:text-sm tracking-[0.2em] uppercase text-foreground/80 hover:text-foreground transition-colors duration-500"
            >
              <ArrowLeft className="w-4 h-4" />
              Entrar na experiência
            </Link>
          </footer>
        </motion.article>
      </main>

      {/* Subtle background gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-background via-background to-card/50" aria-hidden="true" />
      <ProjectFooter />
    </div>
    </PageTransition>
  );
};

export default Sobre;
