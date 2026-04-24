import { useState, useEffect, useCallback } from 'react';
import { ForestCanvas } from '@/components/ForestCanvas';
import { DataOverlay } from '@/components/DataOverlay';
import { ParticipationDashboard } from '@/components/ParticipationDashboard';
import { EntryExperience } from '@/components/EntryExperience';
import { Navbar } from '@/components/Navbar';
import { ProjectFooter } from '@/components/ProjectFooter';
import { PageTransition } from '@/components/PageTransition';
import { useForestAudio } from '@/hooks/useForestAudio';
import { 
  getEnvironmentalData, 
  fetchRealEnvironmentalData,
  getDataSourceStatus,
  dataToVisualParams,
  type EnvironmentalData,
  type HumanLayerData,
  type VisualParameters
} from '@/lib/environmentalData';
 
type ExperienceState = 'entry' | 'observing' | 'participating';

const Mata = () => {
  const [experienceState, setExperienceState] = useState<ExperienceState>('entry');
  const [isInstallationMode, setIsInstallationMode] = useState(false);
  const [showData, setShowData] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  
  const [environmentalData, setEnvironmentalData] = useState<EnvironmentalData>(getEnvironmentalData());
  const [humanLayerData, setHumanLayerData] = useState<HumanLayerData | undefined>(undefined);
  const [visualParams, setVisualParams] = useState<VisualParameters>(
    dataToVisualParams(getEnvironmentalData())
  );
  const [apiData, setApiData] = useState<EnvironmentalData | null>(null);
  const [isLiveData, setIsLiveData] = useState(false);
  
  const isAudioActive = experienceState !== 'entry';
  useForestAudio(visualParams, isAudioActive);
  
  useEffect(() => {
    const status = getDataSourceStatus();
    setIsLiveData(status.isLive);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchRealEnvironmentalData();
      if (data) {
        setApiData(data);
        setIsLiveData(true);
      }
    };
    
    fetchData();
    const fetchInterval = setInterval(fetchData, 60000);
    return () => clearInterval(fetchInterval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newData = getEnvironmentalData(apiData);
      setEnvironmentalData(newData);
      setVisualParams(dataToVisualParams(newData, humanLayerData));
    }, 100);
    
    return () => clearInterval(interval);
  }, [humanLayerData, apiData]);
  
  const handleEntryComplete = useCallback((choice: 'observe' | 'participate') => {
    if (choice === 'participate') {
      setExperienceState('participating');
      setDashboardOpen(true);
    } else {
      setExperienceState('observing');
    }
    
    setTimeout(() => {
      setShowData(true);
    }, 2000);
  }, []);
  
  const handleHumanLayerUpdate = useCallback((data: HumanLayerData) => {
    setHumanLayerData(data);
    setVisualParams(dataToVisualParams(environmentalData, data));
  }, [environmentalData]);
  
  const handleDashboardClose = useCallback(() => {
    setDashboardOpen(false);
    setExperienceState('observing');
  }, []);
  
  const toggleInstallationMode = useCallback(() => {
    setIsInstallationMode(prev => !prev);
  }, []);
  
  const toggleDashboard = useCallback(() => {
    if (dashboardOpen) {
      handleDashboardClose();
    } else {
      setDashboardOpen(true);
      setExperienceState('participating');
    }
  }, [dashboardOpen, handleDashboardClose]);
  
  return (
    <PageTransition>
      <div className={`min-h-screen ${isInstallationMode ? 'installation-mode' : ''}`} role="main" aria-label="Obra: Mata">
        {!isInstallationMode && experienceState !== 'entry' && (
          <Navbar 
            isInstallationMode={isInstallationMode}
            onToggleInstallation={toggleInstallationMode}
          />
        )}
        
        <ForestCanvas 
          visualParams={visualParams} 
          isInstallationMode={isInstallationMode}
        />
        
        <div className="grain-overlay" aria-hidden="true" />
       
        {experienceState === 'entry' && (
          <EntryExperience onComplete={handleEntryComplete} />
        )}
        
        <DataOverlay 
          data={environmentalData} 
          isVisible={showData && !isInstallationMode}
          isLiveData={isLiveData}
        />
        
        {experienceState !== 'entry' && !isInstallationMode && (
          <button
            onClick={toggleDashboard}
            className="ui-element fixed bottom-12 right-4 md:right-8 z-20 text-whisper text-xs md:text-sm text-foreground/70 hover:text-foreground transition-colors duration-700"
            aria-expanded={dashboardOpen}
            aria-controls="participation-dashboard"
          >
            {dashboardOpen ? 'Observar apenas' : 'Participar'}
          </button>
        )}
        
        <ParticipationDashboard
          isOpen={dashboardOpen}
          onClose={handleDashboardClose}
          onUpdate={handleHumanLayerUpdate}
        />
        
        {showData && !isInstallationMode && !dashboardOpen && (
          <div className="ui-element fixed bottom-14 left-1/2 -translate-x-1/2 z-10 text-center max-w-xs md:max-w-md animate-fade-in-slow px-4">
            <p className="text-whisper text-xs md:text-sm text-foreground/70">
              A mata não desaparece de uma vez.
              <br />
              Ela perde nitidez, lentamente.
            </p>
          </div>
        )}
        
        <ProjectFooter isVisible={experienceState !== 'entry' && !isInstallationMode} />
      </div>
    </PageTransition>
  );
};

export default Mata;
