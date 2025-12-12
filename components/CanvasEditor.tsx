import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AspectRatio } from '../types';

interface CanvasEditorProps {
  originalImageSrc: string | null;
  aspectRatio: AspectRatio;
  scale: number; // 0.2 to 1.0
  onCanvasReady: (dataUrl: string) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ 
  originalImageSrc, 
  aspectRatio, 
  scale,
  onCanvasReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1024, height: 1024 });

  // Helper to get width/height from ratio string
  const getDimensionsFromRatio = (ratio: AspectRatio) => {
    const baseSize = 1024;
    const [w, h] = ratio.split(':').map(Number);
    
    if (w === h) return { width: baseSize, height: baseSize };
    if (w > h) return { width: baseSize, height: Math.round(baseSize * (h/w)) };
    return { width: Math.round(baseSize * (w/h)), height: baseSize };
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageSrc) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = originalImageSrc;
    
    img.onload = () => {
      // 1. Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 2. Fill background with a very light transparency grid or solid color
      // Ideally, for outpainting, we want the AI to see "nothing" or a solid color.
      // A neutral gray often works well for context, but transparency (png) is best if the model supports it.
      // Gemini 2.5 Flash Image supports RGBA.
      // However, to ensure it writes *over* it, let's leave it transparent.
      
      // 3. Draw Image Centered
      // Calculate scaled dimensions
      // We want to fit the image into the canvas based on the 'scale' prop relative to the canvas size
      
      const canvasRatio = canvas.width / canvas.height;
      const imgRatio = img.width / img.height;
      
      let drawWidth, drawHeight;

      // Logic to fit image within the scaled area
      // If scale is 1.0, it touches the edges of the canvas (contain)
      // If scale is 0.5, it takes up 50% of the canvas
      
      const targetAreaWidth = canvas.width * scale;
      const targetAreaHeight = canvas.height * scale;

      if (imgRatio > canvasRatio) {
        // Image is wider than canvas
        drawWidth = targetAreaWidth;
        drawHeight = targetAreaWidth / imgRatio;
      } else {
        // Image is taller than canvas
        drawHeight = targetAreaHeight;
        drawWidth = targetAreaHeight * imgRatio;
      }

      const x = (canvas.width - drawWidth) / 2;
      const y = (canvas.height - drawHeight) / 2;

      ctx.drawImage(img, x, y, drawWidth, drawHeight);

      // Notify parent
      onCanvasReady(canvas.toDataURL('image/png'));
    };
  }, [originalImageSrc, scale, dimensions, onCanvasReady]);

  useEffect(() => {
    const newDims = getDimensionsFromRatio(aspectRatio);
    setDimensions(newDims);
  }, [aspectRatio]);

  useEffect(() => {
    // Redraw whenever dependencies change
    // We use a small timeout to ensure state updates have propagated
    const timeout = setTimeout(() => draw(), 50);
    return () => clearTimeout(timeout);
  }, [draw, dimensions]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-[#0d1117] overflow-hidden rounded-lg border border-gray-800 shadow-inner"
      style={{ minHeight: '400px' }}
    >
      {!originalImageSrc && (
        <div className="text-gray-500 text-sm">Upload an image to start editing</div>
      )}
      
      {/* Visual representation for the user (scaled down to fit container) */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="max-w-full max-h-[500px] object-contain shadow-2xl bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')]" 
        style={{ 
            // Checkerboard pattern for transparency visualization
            backgroundImage: `
              linear-gradient(45deg, #1a202c 25%, transparent 25%), 
              linear-gradient(-45deg, #1a202c 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #1a202c 75%), 
              linear-gradient(-45deg, transparent 75%, #1a202c 75%)
            `,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
      />
    </div>
  );
};
