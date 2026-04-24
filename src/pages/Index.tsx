import { useState, useEffect, useCallback } from 'react';
import { ForestCanvas } from '@/components/ForestCanvas';
import { DataOverlay } from '@/components/DataOverlay';
import { ParticipationDashboard } from '@/components/ParticipationDashboard';
import { ModeToggle } from '@/components/ModeToggle';
import { EntryExperience } from '@/components/EntryExperience';
import { SeriesNavigation } from '@/components/SeriesNavigation';
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
 
 const Index = () => {
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
  
  // Audio system - activates after user enters the experience
  const isAudioActive = experienceState !== 'entry';
  useForestAudio(visualParams, isAudioActive);
   
   // Fetch real data on mount and periodically
   useEffect(() => {
     const fetchData = async () => {
       const data = await fetchRealEnvironmentalData();
       if (data) {
         setApiData(data);
         setIsLiveData(true);
       }
     };
     
     fetchData();
     
     // Refresh real data every minute
     const fetchInterval = setInterval(fetchData, 60000);
     return () => clearInterval(fetchInterval);
   }, []);
 
   // Update environmental data periodically
   useEffect(() => {
     const interval = setInterval(() => {
       const newData = getEnvironmentalData(apiData);
       setEnvironmentalData(newData);
       setVisualParams(dataToVisualParams(newData, humanLayerData));
     }, 100); // Smooth updates
     
     return () => clearInterval(interval);
   }, [humanLayerData, apiData]);
   
   const handleEntryComplete = useCallback((choice: 'observe' | 'participate') => {
     if (choice === 'participate') {
       setExperienceState('participating');
       setDashboardOpen(true);
     } else {
       setExperienceState('observing');
     }
     
     // Fade in data overlay after a moment
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
      <div className={`min-h-screen ${isInstallationMode ? 'installation-mode' : ''}`}>
        {!isInstallationMode && experienceState !== 'entry' && (
          <SeriesNavigation />
        )}
        
        {/* Forest visualization */}
        <ForestCanvas 
          visualParams={visualParams} 
          isInstallationMode={isInstallationMode}
        />
        
        {/* Grain overlay for organic texture */}
        <div className="grain-overlay" />
       
       {/* Entry experience */}
       {experienceState === 'entry' && (
         <EntryExperience onComplete={handleEntryComplete} />
       )}
       
       {/* Data overlay */}
       <DataOverlay 
         data={environmentalData} 
         isVisible={showData && !isInstallationMode}
         isLiveData={isLiveData}
       />
       
       {/* Participation toggle */}
       {experienceState !== 'entry' && !isInstallationMode && (
         <button
           onClick={toggleDashboard}
           className="ui-element fixed bottom-8 right-8 z-20 text-whisper text-sm text-foreground/70 hover:text-foreground transition-colors duration-700"
         >
           {dashboardOpen ? 'Observar apenas' : 'Participar'}
         </button>
       )}
       
       {/* Participation dashboard */}
       <ParticipationDashboard
         isOpen={dashboardOpen}
         onClose={handleDashboardClose}
         onUpdate={handleHumanLayerUpdate}
       />
       
       {/* Mode toggle */}
       <ModeToggle
         isInstallationMode={isInstallationMode}
         onToggle={toggleInstallationMode}
       />
       
       {/* Conceptual text - subtle, bottom */}
       {showData && !isInstallationMode && !dashboardOpen && (
         <div className="ui-element fixed bottom-8 left-1/2 -translate-x-1/2 z-10 text-center max-w-md animate-fade-in-slow">
            <p className="text-whisper text-sm text-foreground/70">
              A mata não desaparece de uma vez.
              <br />
              Ela perde nitidez, lentamente.
            </p>
            {isLiveData && (
              <p className="text-whisper text-xs text-foreground/70 mt-4">
                Dados em tempo real
              </p>
           )}
         </div>
        )}
      </div>
      </PageTransition>
    );
  };
  
  export default Index;
