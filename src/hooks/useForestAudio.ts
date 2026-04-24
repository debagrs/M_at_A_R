import { useEffect, useRef, useCallback } from 'react';
import type { VisualParameters } from '@/lib/environmentalData';

interface AudioNodes {
  context: AudioContext;
  oscillator: OscillatorNode | null;
  noiseSource: AudioBufferSourceNode | null;
  gainNode: GainNode;
  noiseGain: GainNode;
  filter: BiquadFilterNode;
  distortion: WaveShaperNode;
  // Glitch layer
  glitchOsc: OscillatorNode | null;
  glitchGain: GainNode;
}

// Generate brown noise for forest ambience
function createBrownNoise(context: AudioContext): AudioBuffer {
  const bufferSize = 2 * context.sampleRate;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5; // Normalize
  }
  
  return buffer;
}

// Create distortion curve for degradation effect
function makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> | null {
  if (amount <= 0) return null;
  
  const samples = 44100;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  
  return curve as Float32Array<ArrayBuffer>;
}

export function useForestAudio(
  visualParams: VisualParameters,
  isActive: boolean
) {
  const audioNodesRef = useRef<AudioNodes | null>(null);
  const isInitializedRef = useRef(false);
  
  // Initialize audio context on first interaction
  const initializeAudio = useCallback(async () => {
    if (isInitializedRef.current || !isActive) return;
    
    try {
      const context = new AudioContext();
      
      // Create main gain node
      const gainNode = context.createGain();
      gainNode.gain.value = 0;
      
      // Create noise gain for static effect
      const noiseGain = context.createGain();
      noiseGain.gain.value = 0;
      
      // Create lowpass filter for muffled degradation
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      filter.Q.value = 0.5;
      
      // Create distortion for degradation
      const distortion = context.createWaveShaper();
      distortion.curve = null;
      distortion.oversample = '2x';
      
      // Create brown noise for forest ambience
      const noiseBuffer = createBrownNoise(context);
      const noiseSource = context.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      
      // Create oscillator for subtle wind drone
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = 80; // Low drone
      
      // Connect nodes: oscillator + noise -> filter -> distortion -> gain -> output
      oscillator.connect(filter);
      noiseSource.connect(noiseGain);
      noiseGain.connect(filter);
      filter.connect(distortion);
      distortion.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Start sources
      oscillator.start();
      noiseSource.start();
      
      // === Glitch layer ===
      const glitchGain = context.createGain();
      glitchGain.gain.value = 0;
      
      const glitchOsc = context.createOscillator();
      glitchOsc.type = 'sawtooth';
      glitchOsc.frequency.value = 40;
      glitchOsc.connect(glitchGain);
      glitchGain.connect(gainNode);
      glitchOsc.start();
      
      audioNodesRef.current = {
        context,
        oscillator,
        noiseSource,
        gainNode,
        noiseGain,
        filter,
        distortion,
        glitchOsc,
        glitchGain,
      };
      
      isInitializedRef.current = true;
      
      // Fade in smoothly
      gainNode.gain.setTargetAtTime(0.15, context.currentTime, 2);
      noiseGain.gain.setTargetAtTime(0.3, context.currentTime, 2);
      
    } catch (error) {
      console.log('Audio initialization failed:', error);
    }
  }, [isActive]);
  
  // Update audio based on visual parameters (degradation)
  useEffect(() => {
    const nodes = audioNodesRef.current;
    if (!nodes || !isInitializedRef.current) return;
    
    const { context, filter, distortion, noiseGain, oscillator } = nodes;
    const decay = visualParams.overallDecay;
    
    // Lower the filter frequency as decay increases (muffled sound)
    const filterFreq = Math.max(200, 2000 - decay * 1500);
    filter.frequency.setTargetAtTime(filterFreq, context.currentTime, 0.5);
    
    // Increase distortion as decay increases
    const distortionAmount = decay * 50;
    distortion.curve = makeDistortionCurve(distortionAmount);
    
    // Increase noise (static) as decay increases
    const noiseLevel = 0.3 + decay * 0.4;
    noiseGain.gain.setTargetAtTime(noiseLevel, context.currentTime, 0.5);
    
    // Detune oscillator slightly for unsettling effect
    if (oscillator) {
      oscillator.detune.setTargetAtTime(decay * 50, context.currentTime, 0.5);
    }
    
    // Glitch bursts proportional to decay
    const { glitchGain: gg, glitchOsc: go } = nodes;
    if (gg && go) {
      // Random intermittent glitch
      const trigger = Math.sin(Date.now() * 0.001) + Math.sin(Date.now() * 0.0027);
      if (trigger > 1.2) {
        const burstLevel = decay * 0.06;
        gg.gain.setTargetAtTime(burstLevel, context.currentTime, 0.02);
        gg.gain.setTargetAtTime(0, context.currentTime + 0.15, 0.04);
        go.frequency.setTargetAtTime(20 + Math.random() * 80 * decay, context.currentTime, 0.01);
      }
    }
    
  }, [visualParams]);
  
  // Handle activation/deactivation
  useEffect(() => {
    const nodes = audioNodesRef.current;
    
    if (isActive && !isInitializedRef.current) {
      // Wait for user interaction to initialize
      const handleInteraction = () => {
        initializeAudio();
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
      };
      
      document.addEventListener('click', handleInteraction);
      document.addEventListener('touchstart', handleInteraction);
      
      return () => {
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
      };
    }
    
    if (nodes) {
      if (isActive) {
        nodes.gainNode.gain.setTargetAtTime(0.15, nodes.context.currentTime, 1);
      } else {
        nodes.gainNode.gain.setTargetAtTime(0, nodes.context.currentTime, 1);
      }
    }
  }, [isActive, initializeAudio]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      const nodes = audioNodesRef.current;
      if (nodes) {
        nodes.oscillator?.stop();
        nodes.noiseSource?.stop();
        nodes.glitchOsc?.stop();
        nodes.context.close();
        audioNodesRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []);
  
  return { initializeAudio };
}
