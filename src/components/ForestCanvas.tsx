import { useEffect, useRef, useCallback } from 'react';
import p5 from 'p5';
import mataVideo from '@/assets/mata.mp4';
import type { VisualParameters } from '@/lib/environmentalData';

interface ForestCanvasProps {
  visualParams: VisualParameters;
  isInstallationMode: boolean;
}

export function ForestCanvas({ visualParams, isInstallationMode }: ForestCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const paramsRef = useRef(visualParams);
  
  useEffect(() => {
    paramsRef.current = visualParams;
  }, [visualParams]);
  
  const sketch = useCallback((p: p5) => {
    let canvas: p5.Renderer;
    let video: HTMLVideoElement | null = null;
    
    p.setup = () => {
      canvas = p.createCanvas(p.windowWidth, p.windowHeight);
      canvas.style('display', 'block');
      p.pixelDensity(1);
      p.imageMode(p.CENTER);
      p.noStroke();
      
      video = document.createElement('video');
      video.src = mataVideo;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');
      video.style.display = 'none';
      video.preload = 'auto';
      document.body.appendChild(video);
      videoRef.current = video;
      
      const tryPlay = () => {
        const pr = video?.play();
        if (pr) pr.catch(e => console.log('Video autoplay (will retry on user gesture):', e?.message || e));
      };
      video.addEventListener('loadeddata', tryPlay, { once: true });
      tryPlay();
    };
    
    p.draw = () => {
      const params = paramsRef.current;
      video = videoRef.current;
      
      if (!video || video.readyState < 2) {
        p.background(15, 25, 15);
        return;
      }
      
      p.background(15, 25, 15);
      
      p.push();
      p.translate(p.width / 2, p.height / 2);
      
      const videoAspect = video.videoWidth / video.videoHeight;
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
      const driftX = Math.sin(time * 0.05) * 5;
      const driftY = Math.cos(time * 0.03) * 3;
      
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      
      ctx.save();
      ctx.translate(driftX, driftY);
      
      const satPercent = Math.max(0, 100 - params.saturationLoss * 90);
      const brightPercent = Math.max(10, 100 - params.darknessLevel * 75);
      const contrastPercent = Math.max(30, 100 - params.contrastReduction * 60);
      
      ctx.filter = `saturate(${satPercent}%) brightness(${brightPercent}%) contrast(${contrastPercent}%)`;
      ctx.drawImage(video, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.filter = 'none';
      ctx.restore();
      
      // Chromatic aberration — RGB channel displacement
      if (params.overallDecay > 0.15) {
        drawChromaticAberration(p, ctx, video, drawWidth, drawHeight, params.overallDecay, time);
      }
      
      // Horizontal scanlines — satellite data artifact
      drawScanlines(p, ctx, params.overallDecay, time);
      
      // Fragmentation overlay removed — no floating particles
      
      // Data corruption bands — horizontal glitch slices
      if (params.overallDecay > 0.1) {
        drawDataCorruption(p, ctx, video, drawWidth, drawHeight, params.overallDecay, time);
      }
      
      // Progressive fade-to-dark
      drawProgressiveFade(p, ctx, params.overallDecay, params.darknessLevel, time);
      
      // Pixelation at edges — intensified
      if (params.pixelationLevel > 0.1) {
        drawPixelatedEdges(p, params.pixelationLevel * 1.6, time);
      }
      
      p.pop();
      
      // Enhanced vignette
      drawVignette(p, params.overallDecay);
      
      // Heavy grain noise
      drawHeavyGrain(p, params.overallDecay);
    };

    // Chromatic aberration — RGB separation like corrupted satellite imagery
    function drawChromaticAberration(p: p5, ctx: CanvasRenderingContext2D, vid: HTMLVideoElement, w: number, h: number, decay: number, time: number) {
      const offset = decay * 8 + Math.sin(time * 0.3) * 3;
      
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.15 + decay * 0.15;
      
      // Red channel shift
      ctx.save();
      ctx.translate(-offset, offset * 0.5);
      ctx.drawImage(vid, -w / 2, -h / 2, w, h);
      ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
      
      // Blue channel shift
      ctx.save();
      ctx.translate(offset, -offset * 0.3);
      ctx.drawImage(vid, -w / 2, -h / 2, w, h);
      ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
      
      ctx.restore();
    }

    // Satellite scanlines — horizontal interference bands
    function drawScanlines(p: p5, ctx: CanvasRenderingContext2D, decay: number, time: number) {
      const lineSpacing = 3;
      const alpha = 0.04 + decay * 0.12;
      
      ctx.save();
      ctx.strokeStyle = `rgba(15, 25, 15, ${alpha})`;
      ctx.lineWidth = 1;
      
      for (let y = -p.height / 2; y < p.height / 2; y += lineSpacing) {
        const wobble = Math.sin(y * 0.1 + time * 2) * decay * 2;
        ctx.beginPath();
        ctx.moveTo(-p.width / 2 + wobble, y);
        ctx.lineTo(p.width / 2 + wobble, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Data corruption — horizontal glitch slices displaced
    function drawDataCorruption(p: p5, ctx: CanvasRenderingContext2D, vid: HTMLVideoElement, w: number, h: number, decay: number, time: number) {
      const numSlices = Math.floor(decay * 12);
      const trigger = Math.sin(time * 1.5) + Math.sin(time * 2.7);
      
      if (trigger < 0.8) return; // intermittent bursts
      
      ctx.save();
      for (let i = 0; i < numSlices; i++) {
        const sliceY = (p.noise(i * 100, time * 0.5) - 0.5) * h;
        const sliceH = 2 + p.noise(i * 200) * decay * 40;
        const offsetX = (p.noise(i * 300, time * 0.8) - 0.5) * decay * 120;
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(-w / 2, sliceY, w, sliceH);
        ctx.clip();
        ctx.translate(offsetX, 0);
        ctx.globalAlpha = 0.7 + decay * 0.3;
        ctx.drawImage(vid, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
      ctx.restore();
    }
    
    function drawProgressiveFade(p: p5, ctx: CanvasRenderingContext2D, decay: number, darkness: number, time: number) {
      const breathe = Math.sin(time * 0.08) * 0.015 + Math.sin(time * 0.05) * 0.01;
      const fadeAlpha = (decay * 0.35 + darkness * 0.2) + breathe;
      
      ctx.save();
      ctx.globalAlpha = Math.min(0.65, Math.max(0, fadeAlpha));
      ctx.fillStyle = 'rgb(15, 25, 15)';
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.restore();
      
      const gradient = ctx.createRadialGradient(0, 0, p.width * 0.1, 0, 0, p.width * 0.55);
      gradient.addColorStop(0, `rgba(15, 25, 15, 0)`);
      gradient.addColorStop(0.4, `rgba(15, 25, 15, ${decay * 0.15})`);
      gradient.addColorStop(1, `rgba(10, 15, 10, ${decay * 0.4})`);
      
      ctx.save();
      ctx.fillStyle = gradient;
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.restore();
    }
    
    
    function drawPixelatedEdges(p: p5, intensity: number, time: number) {
      const blockSize = Math.floor(8 + intensity * 30);
      const edgeWidth = intensity * 250;
      
      p.noStroke();
      
      for (let y = -p.height / 2; y < p.height / 2; y += blockSize) {
        const leftNoise = p.noise(y * 0.01, time * 0.025);
        if (leftNoise > 0.4) {
          const w = leftNoise * edgeWidth;
          p.fill(15, 25, 15, 180);
          p.rect(-p.width / 2, y, w, blockSize);
        }
        
        const rightNoise = p.noise(y * 0.01 + 500, time * 0.025);
        if (rightNoise > 0.4) {
          const w = rightNoise * edgeWidth;
          p.fill(15, 25, 15, 180);
          p.rect(p.width / 2 - w, y, w, blockSize);
        }
      }
    }
    
    function drawVignette(p: p5, decay: number) {
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      const cx = p.width / 2;
      const cy = p.height / 2;
      const radius = Math.max(p.width, p.height) * 0.75;
      
      const radialGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      radialGradient.addColorStop(0, 'rgba(15, 25, 15, 0)');
      radialGradient.addColorStop(0.35 - decay * 0.15, 'rgba(15, 25, 15, 0)');
      radialGradient.addColorStop(0.65 - decay * 0.12, `rgba(15, 25, 15, ${0.35 + decay * 0.5})`);
      radialGradient.addColorStop(1, `rgba(10, 15, 10, ${0.8 + decay * 0.2})`);
      
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, p.width, p.height);
    }
    
    function drawHeavyGrain(p: p5, decay: number) {
      const intensity = 0.06 + decay * 0.14;
      if (intensity <= 0) return;
      
      p.loadPixels();
      for (let i = 0; i < p.pixels.length; i += 8) {
        const noise = (Math.random() - 0.5) * 255 * intensity;
        p.pixels[i] += noise * 0.8;
        p.pixels[i + 1] += noise * 0.9;
        p.pixels[i + 2] += noise * 0.7;
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
    videoRef.current = null;
    
    p5InstanceRef.current = new p5(sketch, containerRef.current);
    
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
      safeCleanupVideo(videoRef.current);
      videoRef.current = null;
    };
  }, [sketch]);
  
  return (
    <div 
      ref={containerRef} 
      className="canvas-container"
      aria-label="Visualização da floresta em degradação"
      role="img"
    />
  );
}
