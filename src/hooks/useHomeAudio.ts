import { useEffect, useRef, useCallback } from 'react';

interface HomeAudioNodes {
  context: AudioContext;
  // Nature layer
  noiseSource: AudioBufferSourceNode | null;
  noiseGain: GainNode;
  natureFilter: BiquadFilterNode;
  // Glitch layer
  glitchOsc: OscillatorNode | null;
  glitchOsc2: OscillatorNode | null;
  glitchGain: GainNode;
  glitchDistortion: WaveShaperNode;
  // Master
  masterGain: GainNode;
}

function createForestNoise(context: AudioContext): AudioBuffer {
  const bufferSize = 2 * context.sampleRate;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
  }
  return buffer;
}

function makeGlitchCurve(amount: number): Float32Array<ArrayBuffer> {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve as Float32Array<ArrayBuffer>;
}

export function useHomeAudio(isActive: boolean) {
  const audioRef = useRef<HomeAudioNodes | null>(null);
  const isInitRef = useRef(false);
  const glitchIntervalRef = useRef<number | null>(null);

  const initializeAudio = useCallback(async () => {
    if (isInitRef.current || !isActive) return;

    try {
      const ctx = new AudioContext();
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(ctx.destination);

      // === Nature layer: brown noise through warm filter ===
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0;
      const natureFilter = ctx.createBiquadFilter();
      natureFilter.type = 'lowpass';
      natureFilter.frequency.value = 600;
      natureFilter.Q.value = 0.3;

      const noiseBuffer = createForestNoise(ctx);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      noiseSource.connect(noiseGain);
      noiseGain.connect(natureFilter);
      natureFilter.connect(masterGain);
      noiseSource.start();

      // === Glitch layer: distorted oscillators with random bursts ===
      const glitchGain = ctx.createGain();
      glitchGain.gain.value = 0;
      const glitchDistortion = ctx.createWaveShaper();
      glitchDistortion.curve = makeGlitchCurve(30);
      glitchDistortion.oversample = '2x';

      const glitchOsc = ctx.createOscillator();
      glitchOsc.type = 'sawtooth';
      glitchOsc.frequency.value = 55;

      const glitchOsc2 = ctx.createOscillator();
      glitchOsc2.type = 'square';
      glitchOsc2.frequency.value = 87;

      const osc2Gain = ctx.createGain();
      osc2Gain.gain.value = 0.3;

      glitchOsc.connect(glitchDistortion);
      glitchOsc2.connect(osc2Gain);
      osc2Gain.connect(glitchDistortion);
      glitchDistortion.connect(glitchGain);
      glitchGain.connect(masterGain);

      glitchOsc.start();
      glitchOsc2.start();

      audioRef.current = {
        context: ctx,
        noiseSource, noiseGain, natureFilter,
        glitchOsc, glitchOsc2, glitchGain, glitchDistortion,
        masterGain,
      };

      isInitRef.current = true;

      // Fade in nature
      masterGain.gain.setTargetAtTime(1, ctx.currentTime, 1);
      noiseGain.gain.setTargetAtTime(0.12, ctx.currentTime, 2);

      // Random glitch bursts
      const doGlitch = () => {
        const nodes = audioRef.current;
        if (!nodes) return;
        const { context, glitchGain: gg, glitchOsc: go, glitchOsc2: go2 } = nodes;
        const now = context.currentTime;

        // Random burst
        const burstLevel = 0.03 + Math.random() * 0.06;
        gg.gain.setTargetAtTime(burstLevel, now, 0.02);
        gg.gain.setTargetAtTime(0, now + 0.1 + Math.random() * 0.3, 0.05);

        // Random freq shifts
        if (go) go.frequency.setTargetAtTime(30 + Math.random() * 120, now, 0.01);
        if (go2) go2.frequency.setTargetAtTime(50 + Math.random() * 200, now, 0.01);

        // Schedule next burst
        const nextDelay = 2000 + Math.random() * 5000;
        glitchIntervalRef.current = window.setTimeout(doGlitch, nextDelay);
      };

      glitchIntervalRef.current = window.setTimeout(doGlitch, 1500);
    } catch (error) {
      console.log('Home audio initialization failed:', error);
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive && !isInitRef.current) {
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

    if (audioRef.current) {
      if (isActive) {
        audioRef.current.masterGain.gain.setTargetAtTime(1, audioRef.current.context.currentTime, 1);
      } else {
        audioRef.current.masterGain.gain.setTargetAtTime(0, audioRef.current.context.currentTime, 1);
      }
    }
  }, [isActive, initializeAudio]);

  useEffect(() => {
    return () => {
      if (glitchIntervalRef.current) clearTimeout(glitchIntervalRef.current);
      const nodes = audioRef.current;
      if (nodes) {
        nodes.glitchOsc?.stop();
        nodes.glitchOsc2?.stop();
        nodes.noiseSource?.stop();
        nodes.context.close();
        audioRef.current = null;
        isInitRef.current = false;
      }
    };
  }, []);

  return { initializeAudio };
}
