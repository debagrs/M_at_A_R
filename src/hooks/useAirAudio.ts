import { useEffect, useRef, useCallback } from 'react';
import type { AirVisualParameters } from '@/lib/airData';

interface AudioNodes {
  context: AudioContext;
  oscillator: OscillatorNode | null;
  oscillator2: OscillatorNode | null;
  noiseSource: AudioBufferSourceNode | null;
  gainNode: GainNode;
  noiseGain: GainNode;
  filter: BiquadFilterNode;
  distortion: WaveShaperNode;
  glitchOsc: OscillatorNode | null;
  glitchGain: GainNode;
}

// Generate white noise filtered to sound like wind/air
function createWindNoise(context: AudioContext): AudioBuffer {
  const bufferSize = 2 * context.sampleRate;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // Lighter brown noise — more airy than forest version
    data[i] = (lastOut + 0.03 * white) / 1.03;
    lastOut = data[i];
    data[i] *= 3.0;
  }
  
  return buffer;
}

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

export function useAirAudio(
  visualParams: AirVisualParameters,
  isActive: boolean
) {
  const audioNodesRef = useRef<AudioNodes | null>(null);
  const isInitializedRef = useRef(false);
  
  const initializeAudio = useCallback(async () => {
    if (isInitializedRef.current || !isActive) return;
    
    try {
      const context = new AudioContext();
      
      const gainNode = context.createGain();
      gainNode.gain.value = 0;
      
      const noiseGain = context.createGain();
      noiseGain.gain.value = 0;
      
      // Higher filter for airy, breathy quality
      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.3;
      
      const distortion = context.createWaveShaper();
      distortion.curve = null;
      distortion.oversample = '2x';
      
      // Wind noise
      const noiseBuffer = createWindNoise(context);
      const noiseSource = context.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      
      // High-pitched atmospheric drone (dispersed, ethereal)
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = 220; // Higher than forest (80Hz)
      
      // Second oscillator for harmonic shimmer
      const oscillator2 = context.createOscillator();
      oscillator2.type = 'triangle';
      oscillator2.frequency.value = 333; // Dissonant interval
      
      const osc2Gain = context.createGain();
      osc2Gain.gain.value = 0.04;
      
      // Connect: oscillators + noise -> filter -> distortion -> gain -> output
      oscillator.connect(filter);
      oscillator2.connect(osc2Gain);
      osc2Gain.connect(filter);
      noiseSource.connect(noiseGain);
      noiseGain.connect(filter);
      filter.connect(distortion);
      distortion.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.start();
      oscillator2.start();
      noiseSource.start();
      
      // === Glitch layer ===
      const glitchGain = context.createGain();
      glitchGain.gain.value = 0;
      const glitchOsc = context.createOscillator();
      glitchOsc.type = 'square';
      glitchOsc.frequency.value = 60;
      glitchOsc.connect(glitchGain);
      glitchGain.connect(gainNode);
      glitchOsc.start();
      
      audioNodesRef.current = {
        context,
        oscillator,
        oscillator2,
        noiseSource,
        gainNode,
        noiseGain,
        filter,
        distortion,
        glitchOsc,
        glitchGain,
      };
      
      isInitializedRef.current = true;
      
      // Fade in
      gainNode.gain.setTargetAtTime(0.12, context.currentTime, 2);
      noiseGain.gain.setTargetAtTime(0.25, context.currentTime, 2);
      
    } catch (error) {
      console.log('Air audio initialization failed:', error);
    }
  }, [isActive]);
  
  // Update audio based on visual params (atmospheric degradation)
  useEffect(() => {
    const nodes = audioNodesRef.current;
    if (!nodes || !isInitializedRef.current) return;
    
    const { context, filter, distortion, noiseGain, oscillator, oscillator2 } = nodes;
    const decay = visualParams.overallDecay;
    
    // Narrow the bandpass as decay increases (suffocated air)
    const filterFreq = Math.max(150, 800 - decay * 500);
    const filterQ = 0.3 + decay * 1.5;
    filter.frequency.setTargetAtTime(filterFreq, context.currentTime, 0.5);
    filter.Q.setTargetAtTime(filterQ, context.currentTime, 0.5);
    
    // Increase distortion — polluted, gritty
    const distortionAmount = decay * 60;
    distortion.curve = makeDistortionCurve(distortionAmount);
    
    // More noise as air degrades (particulates → static)
    const noiseLevel = 0.25 + decay * 0.5;
    noiseGain.gain.setTargetAtTime(noiseLevel, context.currentTime, 0.5);
    
    // Detune oscillators — instability, dispersal
    if (oscillator) {
      oscillator.detune.setTargetAtTime(decay * 80, context.currentTime, 0.5);
    }
    if (oscillator2) {
      oscillator2.detune.setTargetAtTime(-decay * 40, context.currentTime, 0.5);
    }
    
    // Glitch bursts
    const { glitchGain: gg, glitchOsc: go } = nodes;
    if (gg && go) {
      const trigger = Math.sin(Date.now() * 0.0013) + Math.sin(Date.now() * 0.003);
      if (trigger > 1.1) {
        const burstLevel = decay * 0.07;
        gg.gain.setTargetAtTime(burstLevel, context.currentTime, 0.02);
        gg.gain.setTargetAtTime(0, context.currentTime + 0.12, 0.03);
        go.frequency.setTargetAtTime(30 + Math.random() * 150 * decay, context.currentTime, 0.01);
      }
    }
    
  }, [visualParams]);
  
  // Handle activation/deactivation
  useEffect(() => {
    const nodes = audioNodesRef.current;
    
    if (isActive && !isInitializedRef.current) {
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
        nodes.gainNode.gain.setTargetAtTime(0.12, nodes.context.currentTime, 1);
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
        nodes.oscillator2?.stop();
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
