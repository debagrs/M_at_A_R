import { useState, useEffect, useCallback } from 'react';
import { OceanCanvas } from '@/components/OceanCanvas';
import { OceanDataOverlay } from '@/components/OceanDataOverlay';
import { OceanParticipationDashboard, type OceanHumanLayerData } from '@/components/OceanParticipationDashboard';
import { EntryExperience } from '@/components/EntryExperience';
import { Navbar } from '@/components/Navbar';
import { ProjectFooter } from '@/components/ProjectFooter';
import { PageTransition } from '@/components/PageTransition';
import { useOceanAudio } from '@/hooks/useOceanAudio';
import { 
  getOceanData, 
  fetchOceanData,
  oceanDataToVisualParams,
  getOceanDataStatus,
  type OceanData,
  type OceanVisualParameters 
} from '@/lib/oceanData';

type ExperienceState = 'entry' | 'observing' | 'participating';

const Mar = () => {
  const [experienceState, setExperienceState] = useState<ExperienceState>('entry');
  const [isInstallationMode, setIsInstallationMode] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [oceanData, setOceanData] = useState<OceanData>(getOceanData());
  const [humanLayerData, setHumanLayerData] = useState<OceanHumanLayerData | undefined>(undefined);
  const [visualParams, setVisualParams] = useState<OceanVisualParameters>(
    oceanDataToVisualParams(getOceanData())
  );
  const [isLiveData, setIsLiveData] = useState(false);
  
  // Audio: ocean ambience mixed with glitch
  const isAudioActive = experienceState !== 'entry';
  useOceanAudio(visualParams, isAudioActive);
  
  useEffect(() => {
    const loadRealData = async () => {
      const apiData = await fetchOceanData();
      if (apiData) {
        setIsLiveData(true);
      }
    };
    loadRealData();
    const interval = setInterval(loadRealData, 60000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const status = getOceanDataStatus();
      const currentData = getOceanData(status.sources ? { 
        ...oceanData, 
        sources: status.sources 
      } : undefined);
      setOceanData(currentData);
      setVisualParams(oceanDataToVisualParams(currentData, humanLayerData));
      setIsLiveData(status.isLive);
    }, 100);
    
    return () => clearInterval(interval);
  }, [oceanData, humanLayerData]);
  
  const handleEntryComplete = useCallback((choice: 'observe' | 'participate') => {
    if (choice === 'participate') {
      setExperienceState('participating');
      setDashboardOpen(true);
    } else {
      setExperienceState('observing');
    }
  }, []);
  
  const handleHumanLayerUpdate = useCallback((data: OceanHumanLayerData) => {
    setHumanLayerData(data);
  }, []);

  const handleDashboardClose = useCallback(() => {
    setDashboardOpen(false);
    setExperienceState('observing');
  }, []);

  const toggleDashboard = useCallback(() => {
    if (dashboardOpen) {
      handleDashboardClose();
    } else {
      setDashboardOpen(true);
      setExperienceState('participating');
    }
  }, [dashboardOpen, handleDashboardClose]);
  
  const handleInstallationToggle = useCallback(() => {
    setIsInstallationMode(prev => !prev);
    if (!isInstallationMode) {
      setShowUI(false);
    } else {
      setShowUI(true);
    }
  }, [isInstallationMode]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isInstallationMode) {
        setIsInstallationMode(false);
        setShowUI(true);
      }
      if (e.key === 'h' || e.key === 'H') {
        setShowUI(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInstallationMode]);
  
  return (
    <PageTransition>
      <div className={`min-h-screen ${isInstallationMode ? 'installation-mode' : ''}`} role="main" aria-label="Obra: Mar">
        {!isInstallationMode && experienceState !== 'entry' && (
          <Navbar 
            isInstallationMode={isInstallationMode}
            onToggleInstallation={handleInstallationToggle}
          />
        )}
        
        {/* Canvas always rendered so the video buffers during the entry screen */}
        <OceanCanvas 
          visualParams={visualParams} 
          isInstallationMode={isInstallationMode}
        />
        
        {experienceState === 'entry' && (
          <EntryExperience 
            onComplete={handleEntryComplete}
            silentText="O mar pulsa"
            subtitle="Você pode observar os dados do mundo, ou participar com sua presença."
          />
        )}
        
        {experienceState !== 'entry' && (
          <OceanDataOverlay 
            data={oceanData} 
            isVisible={showUI && !isInstallationMode}
            isLiveData={isLiveData}
          />
        )}
        
        {experienceState !== 'entry' && !isInstallationMode && showUI && (
          <button
            onClick={toggleDashboard}
            className="ui-element fixed bottom-12 right-4 md:right-8 z-20 text-whisper text-xs md:text-sm text-foreground/70 hover:text-foreground transition-colors duration-700"
            aria-expanded={dashboardOpen}
          >
            {dashboardOpen ? 'Observar apenas' : 'Participar'}
          </button>
        )}

        <OceanParticipationDashboard
          isOpen={dashboardOpen}
          onClose={handleDashboardClose}
          onUpdate={handleHumanLayerUpdate}
        />
        
        {experienceState !== 'entry' && !isInstallationMode && showUI && (
          <div className="ui-element fixed bottom-14 right-4 md:right-8 z-20 text-[10px] md:text-xs text-foreground/80" aria-live="polite">
            <p>Pressione H para ocultar a interface</p>
            {isLiveData && (
              <p className="text-foreground/70 mt-1">
                Dados atualizados a cada 60s
              </p>
            )}
          </div>
        )}
        
        <ProjectFooter isVisible={experienceState !== 'entry' && !isInstallationMode} />
      </div>
    </PageTransition>
  );
};

export default Mar;
