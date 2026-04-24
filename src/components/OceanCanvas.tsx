import { useEffect, useRef, useCallback } from 'react';
import p5 from 'p5';
import marVideo from '@/assets/mar.mp4';
import type { OceanVisualParameters } from '@/lib/oceanData';

interface OceanCanvasProps {
  visualParams: OceanVisualParameters;
  isInstallationMode: boolean;
}

export function OceanCanvas({ visualParams, isInstallationMode }: OceanCanvasProps) {
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
      v.src = marVideo;
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
      const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
      canvas.style('display', 'block');
      p.pixelDensity(1);
      p.imageMode(p.CENTER);
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
        p.background(10, 18, 30);
        return;
      }
      
      p.background(10, 18, 30);
      
      // Crossfade loop management
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
      
      const driftX = Math.sin(time * 0.08) * 8 + Math.sin(time * 0.03) * 4;
      const driftY = Math.cos(time * 0.05) * 5;
      
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      
      const brightPercent = Math.max(12, 100 - params.opacityLevel * 70);
      const satPercent = Math.max(5, 100 - params.dissolutionIntensity * 80);
      const contrastPercent = Math.max(35, 100 - params.blurAmount * 55);
      
      ctx.save();
      ctx.translate(driftX, driftY);
      ctx.filter = `saturate(${satPercent}%) brightness(${brightPercent}%) contrast(${contrastPercent}%)`;
      
      if (crossfade < 1 && videoA && videoA.readyState >= 2) {
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
      
      // Chromatic aberration — sonar/satellite distortion
      if (params.overallDecay > 0.1) {
        drawChromaticAberration(p, ctx, activeVideo, drawWidth, drawHeight, params.overallDecay, time);
      }
      
      // Scanlines — submarine/sonar data aesthetic  
      drawScanlines(p, ctx, params.overallDecay, time);
      
      // Data corruption bands
      if (params.dissolutionIntensity > 0.1) {
        drawDataCorruption(p, ctx, activeVideo, drawWidth, drawHeight, params.dissolutionIntensity, time);
      }
      
      // Progressive fade
      if (params.dissolutionIntensity > 0.05) {
        drawProgressiveFade(p, ctx, params.dissolutionIntensity, time);
      }
      
      // Tidal ghosting — intensified
      if (params.latencyEffect > 0.1) {
        drawTidalGhosting(p, params.latencyEffect, time);
      }
      
      // Acid haze
      if (params.blurAmount > 0.1) {
        drawAcidHaze(p, params.blurAmount, time);
      }
      
      // Turbidity particles — more dense
      if (params.opacityLevel > 0.08) {
        drawTurbidityParticles(p, params.opacityLevel, time);
      }
      
      p.pop();
      
      drawOceanVignette(p, params.overallDecay);
      drawHeavyGrain(p, params.overallDecay);
    };

    function drawChromaticAberration(p: p5, ctx: CanvasRenderingContext2D, vid: HTMLVideoElement, w: number, h: number, decay: number, time: number) {
      const offset = decay * 6 + Math.sin(time * 0.4) * 2.5;
      
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.12 + decay * 0.12;
      
      ctx.save();
      ctx.translate(-offset * 0.5, offset);
      ctx.drawImage(vid, -w / 2, -h / 2, w, h);
      ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
      
      ctx.save();
      ctx.translate(offset * 0.7, -offset * 0.4);
      ctx.drawImage(vid, -w / 2, -h / 2, w, h);
      ctx.fillStyle = 'rgba(255, 200, 0, 0.7)';
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
      
      ctx.restore();
    }

    function drawScanlines(p: p5, ctx: CanvasRenderingContext2D, decay: number, time: number) {
      const lineSpacing = 4;
      const alpha = 0.03 + decay * 0.1;
      
      ctx.save();
      ctx.strokeStyle = `rgba(10, 18, 30, ${alpha})`;
      ctx.lineWidth = 1;
      
      for (let y = -p.height / 2; y < p.height / 2; y += lineSpacing) {
        const wobble = Math.sin(y * 0.08 + time * 1.5) * decay * 3;
        ctx.beginPath();
        ctx.moveTo(-p.width / 2 + wobble, y);
        ctx.lineTo(p.width / 2 + wobble, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawDataCorruption(p: p5, ctx: CanvasRenderingContext2D, vid: HTMLVideoElement, w: number, h: number, intensity: number, time: number) {
      const numSlices = Math.floor(intensity * 10);
      const trigger = Math.sin(time * 1.2) + Math.sin(time * 3.1);
      
      if (trigger < 0.6) return;
      
      ctx.save();
      for (let i = 0; i < numSlices; i++) {
        const sliceY = (p.noise(i * 150, time * 0.4) - 0.5) * h;
        const sliceH = 2 + p.noise(i * 250) * intensity * 35;
        const offsetX = (p.noise(i * 350, time * 0.7) - 0.5) * intensity * 100;
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(-w / 2, sliceY, w, sliceH);
        ctx.clip();
        ctx.translate(offsetX, 0);
        ctx.globalAlpha = 0.6 + intensity * 0.4;
        ctx.drawImage(vid, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
      ctx.restore();
    }
    
    function drawProgressiveFade(p: p5, ctx: CanvasRenderingContext2D, intensity: number, time: number) {
      const breathe = Math.sin(time * 0.1) * 0.02 + Math.sin(time * 0.07) * 0.01;
      const fadeAlpha = intensity * 0.4 + breathe;
      
      ctx.save();
      ctx.globalAlpha = Math.min(0.7, fadeAlpha);
      ctx.fillStyle = 'rgb(10, 18, 30)';
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.restore();
      
      const gradient = ctx.createLinearGradient(0, -p.height / 2, 0, p.height / 2);
      gradient.addColorStop(0, `rgba(10, 18, 30, 0)`);
      gradient.addColorStop(0.4, `rgba(10, 18, 30, ${intensity * 0.12})`);
      gradient.addColorStop(0.75, `rgba(10, 18, 30, ${intensity * 0.3})`);
      gradient.addColorStop(1, `rgba(5, 10, 20, ${intensity * 0.5})`);
      
      ctx.save();
      ctx.fillStyle = gradient;
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.restore();
    }
    
    function drawTidalGhosting(p: p5, intensity: number, time: number) {
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      const echoes = Math.floor(intensity * 6);
      
      for (let i = 0; i < echoes; i++) {
        ctx.save();
        ctx.globalAlpha = 0.04 - i * 0.005;
        
        const phaseOffset = i * 0.8;
        ctx.translate(
          Math.sin(time * 0.4 + phaseOffset) * intensity * 45,
          Math.cos(time * 0.25 + phaseOffset) * intensity * 25
        );
        
        ctx.strokeStyle = `hsla(195, 40%, 50%, ${0.06 - i * 0.008})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < p.width; x += 4) {
          const y = p.height * 0.3 + Math.sin(x * 0.008 + time * 0.6 + i * 2) * 80 * intensity
            + Math.sin(x * 0.02 + time * 0.9) * 30 * intensity;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }
    
    function drawAcidHaze(p: p5, amount: number, time: number) {
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      
      for (let layer = 0; layer < 3; layer++) {
        const yShift = Math.sin(time * 0.12 + layer * 1.5) * 25;
        const gradient = ctx.createLinearGradient(0, p.height * 0.4 + yShift, 0, p.height);
        gradient.addColorStop(0, `hsla(185, 15%, 75%, 0)`);
        gradient.addColorStop(0.3, `hsla(185, 10%, 80%, ${amount * 0.05})`);
        gradient.addColorStop(0.7, `hsla(190, 8%, 85%, ${amount * 0.1})`);
        gradient.addColorStop(1, `hsla(195, 5%, 90%, ${amount * 0.15})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, p.width, p.height);
      }
    }
    
    function drawTurbidityParticles(p: p5, opacity: number, time: number) {
      const numParticles = Math.floor(opacity * 40);
      
      for (let i = 0; i < numParticles; i++) {
        const seed = i * 300;
        const x = p.noise(seed, time * 0.025) * p.width - p.width / 2;
        const y = p.noise(seed + 100, time * 0.02) * p.height - p.height / 2;
        const size = 1.5 + p.noise(seed + 200) * opacity * 6;
        const alpha = 15 + opacity * 30;
        
        p.fill(30, 28, 22, alpha);
        p.ellipse(x, y, size, size * 0.7);
      }
    }
    
    function drawOceanVignette(p: p5, decay: number) {
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      const cx = p.width / 2;
      const cy = p.height / 2;
      const radius = Math.max(p.width, p.height) * 0.75;
      
      const radialGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      radialGradient.addColorStop(0, 'rgba(10, 18, 30, 0)');
      radialGradient.addColorStop(0.35 - decay * 0.15, 'rgba(10, 18, 30, 0)');
      radialGradient.addColorStop(0.65 - decay * 0.12, `rgba(8, 14, 25, ${0.35 + decay * 0.45})`);
      radialGradient.addColorStop(1, `rgba(5, 10, 18, ${0.8 + decay * 0.2})`);
      
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, p.width, p.height);
    }
    
    function drawHeavyGrain(p: p5, decay: number) {
      const intensity = 0.06 + decay * 0.12;
      if (intensity <= 0) return;
      
      p.loadPixels();
      for (let i = 0; i < p.pixels.length; i += 8) {
        const noise = (Math.random() - 0.5) * 255 * intensity;
        p.pixels[i] += noise * 0.6;
        p.pixels[i + 1] += noise * 0.7;
        p.pixels[i + 2] += noise * 0.9;
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
      aria-label="Visualização do oceano em degradação"
      role="img"
    />
  );
}
