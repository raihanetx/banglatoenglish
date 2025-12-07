import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isActive: boolean;
  volume: number; // 0 to 255
}

export const Visualizer: React.FC<VisualizerProps> = ({ isActive, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const normalizedVolume = volume / 255;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjusted for smaller bar visualization
    const barCount = 4;
    const spacing = 3;
    const barWidth = 4;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxObjHeight = 24;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isActive) {
        return;
      }

      ctx.fillStyle = '#ef4444'; // red-500
      
      for (let i = 0; i < barCount; i++) {
        const heightMultiplier = Math.max(0.2, normalizedVolume * (1 - Math.abs(i - 1.5) * 0.3));
        const h = maxObjHeight * heightMultiplier * 2 + 4; 
        
        const x = centerX + (i - 1.5) * (barWidth + spacing);
        const y = centerY - h / 2;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, h, 4);
        ctx.fill();
      }
    };

    const animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [isActive, normalizedVolume]);

  return (
    <canvas 
      ref={canvasRef} 
      width={60} 
      height={40} 
      className=""
    />
  );
};