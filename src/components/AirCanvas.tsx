import { useEffect, useRef, useCallback } from 'react';
import p5 from 'p5';
import arVideo from '@/assets/ar.mp4';
import type { AirVisualParameters } from '@/lib/airData';

interface AirCanvasProps {
  visualParams: AirVisualParameters;
  isInstallationMode: boolean;
}

export function AirCanvas({ visualParams, isInstallationMode }: AirCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoB_Ref = useRef<HTMLVideoElement | null>(null);
  const crossfadeRef = useRef(0);
  const paramsRef = useRef(visualParams);
  const CROSSFADE_DURATION = 2.0;
  
  useEffect(() => {
    paramsRef.current = visualParams;
  }, [visualParams]);
  
  const sketch = useCallback((p: p5) => {
    let videoA: HTMLVideoElement | null = null;
    let videoB: HTMLVideoElement | null = null;
    
    function createVideo(): HTMLVideoElement {
      const v = document.createElement('video');
      v.src = arVideo;
      v.muted = true;
      v.playsInline = true;
      v.autoplay = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('muted', '');
      v.style.display = 'none';
      v.preload = 'auto';
      document.body.appendChild(v);
      return v;
    }
    
    function safePlay(v: HTMLVideoElement | null) {
      if (!v) return;
      const pr = v.play();
      if (pr) pr.catch(() => {});
    }
    
    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight);
      p.pixelDensity(1);
      p.noStroke();
      
      videoA = createVideo();
      videoA.loop = false;
      videoA.addEventListener('loadeddata', () => safePlay(videoA), { once: true });
      safePlay(videoA);
      videoRef.current = videoA;
      
      videoB = createVideo();
      videoB.loop = false;
      videoB_Ref.current = videoB;
    };
    
    p.draw = () => {
      const params = paramsRef.current;
      videoA = videoRef.current;
      videoB = videoB_Ref.current;
      
      if (!videoA || videoA.readyState < 2) {
        p.background(18, 18, 22);
        return;
      }
      
      p.background(18, 18, 22);
      
      const duration = videoA.duration || 10;
      const timeLeft = duration - videoA.currentTime;
      
      if (timeLeft <= CROSSFADE_DURATION && videoB && videoB.paused) {
        videoB.currentTime = 0;
        videoB.play().catch(() => {});
      }
      
      let crossfade = 0;
      if (timeLeft <= CROSSFADE_DURATION) {
        crossfade = 1 - (timeLeft / CROSSFADE_DURATION);
      }
      
      if (videoA.ended || videoA.currentTime >= duration - 0.05) {
        const oldA = videoA;
        videoRef.current = videoB;
        videoA = videoB;
        oldA.currentTime = 0;
        oldA.pause();
        videoB_Ref.current = oldA;
        videoB = oldA;
        crossfade = 0;
      }
      
      crossfadeRef.current = crossfade;
      
      p.push();
      p.translate(p.width / 2, p.height / 2);
      
      const activeVideo = crossfade < 1 ? videoA : (videoB && videoB.readyState >= 2 ? videoB : videoA);
      const videoAspect = activeVideo.videoWidth / activeVideo.videoHeight;
      const canvasAspect = p.width / p.height;
      let drawWidth: number, drawHeight: number;
      
      if (canvasAspect > videoAspect) {
        drawWidth = p.width;
        drawHeight = p.width / videoAspect;
      } else {
        drawHeight = p.height;
        drawWidth = p.height * videoAspect;
      }
      
      const time = p.millis() / 1000;
      
      const driftX = Math.sin(time * 0.04) * 6 + Math.sin(time * 0.015) * 3;
      const driftY = Math.cos(time * 0.03) * 4;
      
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      
      const brightPercent = Math.max(15, 100 - params.noiseIntensity * 65);
      const satPercent = Math.max(0, 100 - params.particleDensity * 85);
      const contrastPercent = Math.max(30, 100 - params.formOpacity * 60);
      
      ctx.save();
      ctx.translate(driftX, driftY);
      ctx.filter = `saturate(${satPercent}%) brightness(${brightPercent}%) contrast(${contrastPercent}%)`;
      
      if (crossfade < 1) {
        ctx.globalAlpha = 1 - crossfade;
        ctx.drawImage(videoA, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      }
      
      if (crossfade > 0 && videoB && videoB.readyState >= 2) {
        ctx.globalAlpha = crossfade;
        ctx.drawImage(videoB, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      }
      
      ctx.globalAlpha = 1;
      ctx.filter = 'none';
      ctx.restore();
      
      // Chromatic aberration — atmospheric refraction distortion
      if (params.overallDecay > 0.1) {
        drawChromaticAberration(p, ctx, activeVideo, drawWidth, drawHeight, params.overallDecay, time);
      }
      
      // Scanlines — atmospheric sensor data
      drawScanlines(p, ctx, params.overallDecay, time);
      
      // Data corruption — signal interference
      if (params.noiseIntensity > 0.1) {
        drawDataCorruption(p, ctx, activeVideo, drawWidth, drawHeight, params.noiseIntensity, time);
      }
      
      // Progressive fade
      drawProgressiveFade(p, ctx, params.overallDecay, params.noiseIntensity, time);
      
      // Particulates — intensified
      if (params.particleDensity > 0.05) {
        drawParticulateCloud(p, params.particleDensity, time);
      }
      
      // Form dissolution — intensified
      if (params.formOpacity > 0.1) {
        drawFormDissolution(p, params.formOpacity, time);
      }
      
      // Atmospheric haze — intensified
      if (params.hazeDepth > 0.05) {
        drawAtmosphericHaze(p, params.hazeDepth, time);
      }
      
      p.pop();
      
      drawAtmosphericVignette(p, params.overallDecay);
      drawHeavyGrain(p, params.overallDecay);
    };

    function drawChromaticAberration(p: p5, ctx: CanvasRenderingContext2D, vid: HTMLVideoElement, w: number, h: number, decay: number, time: number) {
      const offset = decay * 10 + Math.sin(time * 0.25) * 4;
      
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.1 + decay * 0.15;
      
      ctx.save();
      ctx.translate(-offset, -offset * 0.3);
      ctx.drawImage(vid, -w / 2, -h / 2, w, h);
      ctx.fillStyle = 'rgba(0, 255, 200, 0.6)';
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
      
      ctx.save();
      ctx.translate(offset * 0.6, offset * 0.8);
      ctx.drawImage(vid, -w / 2, -h / 2, w, h);
      ctx.fillStyle = 'rgba(255, 180, 255, 0.6)';
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
      
      ctx.restore();
    }

    function drawScanlines(p: p5, ctx: CanvasRenderingContext2D, decay: number, time: number) {
      const lineSpacing = 3;
      const alpha = 0.03 + decay * 0.1;
      
      ctx.save();
      ctx.strokeStyle = `rgba(18, 18, 22, ${alpha})`;
      ctx.lineWidth = 1;
      
      for (let y = -p.height / 2; y < p.height / 2; y += lineSpacing) {
        const wobble = Math.sin(y * 0.12 + time * 2.5) * decay * 2.5;
        ctx.beginPath();
        ctx.moveTo(-p.width / 2 + wobble, y);
        ctx.lineTo(p.width / 2 + wobble, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawDataCorruption(p: p5, ctx: CanvasRenderingContext2D, vid: HTMLVideoElement, w: number, h: number, intensity: number, time: number) {
      const numSlices = Math.floor(intensity * 14);
      const trigger = Math.sin(time * 0.8) + Math.sin(time * 2.3);
      
      if (trigger < 0.5) return;
      
      ctx.save();
      for (let i = 0; i < numSlices; i++) {
        const sliceY = (p.noise(i * 120, time * 0.6) - 0.5) * h;
        const sliceH = 1 + p.noise(i * 220) * intensity * 30;
        const offsetX = (p.noise(i * 320, time * 0.9) - 0.5) * intensity * 150;
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(-w / 2, sliceY, w, sliceH);
        ctx.clip();
        ctx.translate(offsetX, 0);
        ctx.globalAlpha = 0.5 + intensity * 0.5;
        ctx.drawImage(vid, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
      ctx.restore();
    }
    
    function drawProgressiveFade(p: p5, ctx: CanvasRenderingContext2D, decay: number, noise: number, time: number) {
      const breathe = Math.sin(time * 0.06) * 0.02 + Math.sin(time * 0.04) * 0.01;
      const fadeAlpha = (decay * 0.3 + noise * 0.15) + breathe;
      
      ctx.save();
      ctx.globalAlpha = Math.min(0.6, Math.max(0, fadeAlpha));
      ctx.fillStyle = 'rgb(18, 18, 22)';
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.restore();
      
      const gradient = ctx.createLinearGradient(0, -p.height / 2, 0, p.height / 2);
      gradient.addColorStop(0, `rgba(18, 18, 22, ${decay * 0.3})`);
      gradient.addColorStop(0.4, `rgba(18, 18, 22, ${decay * 0.1})`);
      gradient.addColorStop(0.7, `rgba(18, 18, 22, 0)`);
      gradient.addColorStop(1, `rgba(15, 15, 20, ${decay * 0.2})`);
      
      ctx.save();
      ctx.fillStyle = gradient;
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.restore();
    }
    
    function drawParticulateCloud(p: p5, density: number, time: number) {
      const numParticles = Math.floor(density * 60);
      
      for (let i = 0; i < numParticles; i++) {
        const seed = i * 400;
        const windPhase = time * 0.025 + seed * 0.001;
        const x = (p.noise(seed, windPhase) * p.width * 1.4) - p.width * 0.7;
        const y = (p.noise(seed + 100, windPhase * 0.8) * p.height * 1.4) - p.height * 0.7;
        const size = 1.5 + p.noise(seed + 200) * density * 5;
        const alpha = 15 + density * 30;
        
        const brightness = 50 + p.noise(seed + 300) * 50;
        p.fill(brightness, brightness, brightness + 8, alpha);
        p.ellipse(x, y, size, size);
      }
    }
    
    function drawFormDissolution(p: p5, opacity: number, time: number) {
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      const echoes = Math.floor(opacity * 5);
      
      for (let i = 0; i < echoes; i++) {
        ctx.save();
        ctx.globalAlpha = 0.035 - i * 0.005;
        
        const riseOffset = i * 1.2;
        ctx.translate(
          Math.sin(time * 0.2 + riseOffset) * opacity * 25,
          -Math.abs(Math.sin(time * 0.15 + riseOffset)) * opacity * 35
        );
        
        ctx.strokeStyle = `hsla(0, 0%, 40%, ${0.05 - i * 0.008})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let y = -p.height / 2; y < p.height / 2; y += 4) {
          const x = Math.sin(y * 0.005 + time * 0.3 + i) * 60 * opacity;
          if (y === -p.height / 2) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }
    
    function drawAtmosphericHaze(p: p5, depth: number, time: number) {
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      
      for (let layer = 0; layer < 3; layer++) {
        const yShift = Math.sin(time * 0.08 + layer * 2) * 20;
        const gradient = ctx.createLinearGradient(0, -p.height / 2 + yShift, 0, p.height / 2);
        gradient.addColorStop(0, `hsla(260, 10%, 65%, ${depth * 0.04})`);
        gradient.addColorStop(0.3, `hsla(240, 8%, 60%, ${depth * 0.05})`);
        gradient.addColorStop(0.6, `hsla(220, 5%, 55%, ${depth * 0.04})`);
        gradient.addColorStop(1, `hsla(200, 3%, 50%, ${depth * 0.06})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      }
    }
    
    function drawAtmosphericVignette(p: p5, decay: number) {
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      const cx = p.width / 2;
      const cy = p.height / 2;
      const radius = Math.max(p.width, p.height) * 0.75;
      
      const radialGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      radialGradient.addColorStop(0, 'rgba(18, 18, 22, 0)');
      radialGradient.addColorStop(0.35 - decay * 0.12, 'rgba(18, 18, 22, 0)');
      radialGradient.addColorStop(0.65 - decay * 0.1, `rgba(15, 15, 20, ${0.35 + decay * 0.45})`);
      radialGradient.addColorStop(1, `rgba(10, 10, 15, ${0.8 + decay * 0.2})`);
      
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, p.width, p.height);
    }
    
    function drawHeavyGrain(p: p5, decay: number) {
      const intensity = 0.06 + decay * 0.12;
      if (intensity <= 0) return;
      
      p.loadPixels();
      for (let i = 0; i < p.pixels.length; i += 8) {
        const noise = (Math.random() - 0.5) * 255 * intensity;
        p.pixels[i] += noise;
        p.pixels[i + 1] += noise;
        p.pixels[i + 2] += noise * 1.1;
      }
      p.updatePixels();
    }
    
    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
  }, [isInstallationMode]);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const safeCleanupVideo = (v: HTMLVideoElement | null) => {
      if (!v) return;
      setTimeout(() => {
        try { v.pause(); } catch {}
        try { v.removeAttribute('src'); v.load(); } catch {}
        try { v.remove(); } catch {}
      }, 0);
    };
    
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
      p5InstanceRef.current = null;
    }
    safeCleanupVideo(videoRef.current);
    safeCleanupVideo(videoB_Ref.current);
    videoRef.current = null;
    videoB_Ref.current = null;
    
    p5InstanceRef.current = new p5(sketch, containerRef.current);
    
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
      safeCleanupVideo(videoRef.current);
      safeCleanupVideo(videoB_Ref.current);
      videoRef.current = null;
      videoB_Ref.current = null;
    };
  }, [sketch]);
  
  return (
    <div 
      ref={containerRef} 
      className="canvas-container"
      aria-label="Visualização do ar em degradação"
      role="img"
    />
  );
}
