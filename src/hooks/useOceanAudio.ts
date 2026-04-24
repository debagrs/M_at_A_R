import { useEffect, useRef, useCallback } from 'react';
import type { OceanVisualParameters } from '@/lib/oceanData';

interface OceanAudioNodes {
  context: AudioContext;
  // Nature: ocean drone
  oscillator: OscillatorNode | null;
  noiseSource: AudioBufferSourceNode | null;
  gainNode: GainNode;
  noiseGain: GainNode;
  filter: BiquadFilterNode;
  // Glitch layer
  glitchOsc: OscillatorNode | null;
  glitchGain: GainNode;
  glitchDistortion: WaveShaperNode;
}

function createOceanNoise(context: AudioContext): AudioBuffer {
  const bufferSize = 2 * context.sampleRate;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.025 * white) / 1.025;
    lastOut = data[i];
    data[i] *= 3.2;
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

export function useOceanAudio(visualParams: OceanVisualParameters, isActive: boolean) {
  const audioRef = useRef<OceanAudioNodes | null>(null);
  const isInitRef = useRef(false);
  const glitchTimerRef = useRef<number | null>(null);

  const initializeAudio = useCallback(async () => {
    if (isInitRef.current || !isActive) return;
    try {
      const ctx = new AudioContext();
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0;

      // Low-pass for underwater feel
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 1.2;

      // Ocean drone
      const oscillator = ctx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = 60;

      // Noise
      const noiseBuffer = createOceanNoise(ctx);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Glitch layer
      const glitchGain = ctx.createGain();
      glitchGain.gain.value = 0;
      const glitchDistortion = ctx.createWaveShaper();
      glitchDistortion.curve = null;
      glitchDistortion.oversample = '2x';

      const glitchOsc = ctx.createOscillator();
      glitchOsc.type = 'sawtooth';
      glitchOsc.frequency.value = 45;

      // Connect nature: osc + noise -> filter -> gain -> output
      oscillator.connect(filter);
      noiseSource.connect(noiseGain);
      noiseGain.connect(filter);
      filter.connect(gainNode);

      // Connect glitch: glitchOsc -> distortion -> glitchGain -> output
      glitchOsc.connect(glitchDistortion);
      glitchDistortion.connect(glitchGain);
      glitchGain.connect(gainNode);

      gainNode.connect(ctx.destination);

      oscillator.start();
      noiseSource.start();
      glitchOsc.start();

      audioRef.current = {
        context: ctx,
        oscillator, noiseSource, gainNode, noiseGain, filter,
        glitchOsc, glitchGain, glitchDistortion,
      };
      isInitRef.current = true;

      gainNode.gain.setTargetAtTime(0.15, ctx.currentTime, 2);
      noiseGain.gain.setTargetAtTime(0.25, ctx.currentTime, 2);

      // Random glitch bursts driven by decay
      const doGlitch = () => {
        const nodes = audioRef.current;
        if (!nodes) return;
        const now = nodes.context.currentTime;
        const burstLevel = 0.02 + Math.random() * 0.05;
        nodes.glitchGain.gain.setTargetAtTime(burstLevel, now, 0.02);
        nodes.glitchGain.gain.setTargetAtTime(0, now + 0.08 + Math.random() * 0.2, 0.04);
        if (nodes.glitchOsc) {
          nodes.glitchOsc.frequency.setTargetAtTime(20 + Math.random() * 100, now, 0.01);
        }
        glitchTimerRef.current = window.setTimeout(doGlitch, 3000 + Math.random() * 6000);
      };
      glitchTimerRef.current = window.setTimeout(doGlitch, 2000);
    } catch (error) {
      console.log('Ocean audio initialization failed:', error);
    }
  }, [isActive]);

  // Update based on visual params
  useEffect(() => {
    const nodes = audioRef.current;
    if (!nodes || !isInitRef.current) return;
    const { context, filter, glitchDistortion, noiseGain, oscillator } = nodes;
    const decay = visualParams.overallDecay;

    const filterFreq = Math.max(150, 400 - decay * 250);
    filter.frequency.setTargetAtTime(filterFreq, context.currentTime, 0.5);

    const distAmount = decay * 45;
    glitchDistortion.curve = makeDistortionCurve(distAmount);

    const noiseLevel = 0.25 + decay * 0.35;
    noiseGain.gain.setTargetAtTime(noiseLevel, context.currentTime, 0.5);

    if (oscillator) {
      oscillator.detune.setTargetAtTime(decay * 40, context.currentTime, 0.5);
    }
  }, [visualParams]);

  useEffect(() => {
    if (isActive && !isInitRef.current) {
      const h = () => { initializeAudio(); document.removeEventListener('click', h); document.removeEventListener('touchstart', h); };
      document.addEventListener('click', h);
      document.addEventListener('touchstart', h);
      return () => { document.removeEventListener('click', h); document.removeEventListener('touchstart', h); };
    }
    if (audioRef.current) {
      if (isActive) {
        audioRef.current.gainNode.gain.setTargetAtTime(0.15, audioRef.current.context.currentTime, 1);
      } else {
        audioRef.current.gainNode.gain.setTargetAtTime(0, audioRef.current.context.currentTime, 1);
      }
    }
  }, [isActive, initializeAudio]);

  useEffect(() => {
    return () => {
      if (glitchTimerRef.current) clearTimeout(glitchTimerRef.current);
      const nodes = audioRef.current;
      if (nodes) {
        nodes.oscillator?.stop();
        nodes.noiseSource?.stop();
        nodes.glitchOsc?.stop();
        nodes.context.close();
        audioRef.current = null;
        isInitRef.current = false;
      }
    };
  }, []);

  return { initializeAudio };
}
