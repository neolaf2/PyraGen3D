import { GenerationParams, PyramidBase } from "../types";

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 100, g: 100, b: 100 };
};

const shadeColor = (r: number, g: number, b: number, percent: number) => {
  const R = Math.min(255, Math.max(0, Math.floor(r * (1 + percent / 100))));
  const G = Math.min(255, Math.max(0, Math.floor(g * (1 + percent / 100))));
  const B = Math.min(255, Math.max(0, Math.floor(b * (1 + percent / 100))));
  return `rgb(${R},${G},${B})`;
};

export const generateProceduralPyramid = async (params: GenerationParams): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const size = 1024;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve('');
      return;
    }

    // 1. Draw Background
    // Simple gradient based on light settings
    const bgGradient = ctx.createLinearGradient(0, 0, 0, size);
    if (document.documentElement.classList.contains('dark')) {
      bgGradient.addColorStop(0, '#0f172a');
      bgGradient.addColorStop(1, '#1e293b');
    } else {
      bgGradient.addColorStop(0, '#f8fafc');
      bgGradient.addColorStop(1, '#e2e8f0');
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, size, size);

    // 2. Math & Geometry Configuration
    const { levels, baseSize, tileColor, baseType } = params;
    const rgb = hexToRgb(tileColor);
    
    // Isometric constants
    // Scale factor depends on baseSize to fit in canvas
    const scale = Math.min(size / (baseSize * 4), 60); 
    const tileW = scale * 2;
    const tileH = scale; // isometric squash
    const centerX = size / 2;
    const centerY = size / 2 + (baseSize * tileH) / 2; // Offset to center vertically

    // Helper to draw a single cube
    const drawCube = (x: number, y: number, z: number, r: number, g: number, b: number) => {
      // Isometric projection formula
      // x, y are grid coordinates. z is height (up).
      const isoX = (x - y) * tileW * 0.5 + centerX;
      const isoY = (x + y) * tileH * 0.5 - (z * tileH * 0.85) + centerY;

      // Top Face
      ctx.beginPath();
      ctx.moveTo(isoX, isoY - tileH);
      ctx.lineTo(isoX + tileW * 0.5, isoY - tileH * 1.5);
      ctx.lineTo(isoX, isoY - tileH * 2);
      ctx.lineTo(isoX - tileW * 0.5, isoY - tileH * 1.5);
      ctx.closePath();
      // Top is usually lightest
      ctx.fillStyle = shadeColor(r, g, b, 20); 
      ctx.fill();
      ctx.strokeStyle = shadeColor(r, g, b, -10);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Right Face
      ctx.beginPath();
      ctx.moveTo(isoX, isoY - tileH);
      ctx.lineTo(isoX + tileW * 0.5, isoY - tileH * 1.5);
      ctx.lineTo(isoX + tileW * 0.5, isoY - tileH * 0.5);
      ctx.lineTo(isoX, isoY);
      ctx.closePath();
      // Right is medium/dark
      ctx.fillStyle = shadeColor(r, g, b, -15);
      ctx.fill();
      ctx.stroke();

      // Left Face
      ctx.beginPath();
      ctx.moveTo(isoX, isoY - tileH);
      ctx.lineTo(isoX - tileW * 0.5, isoY - tileH * 1.5);
      ctx.lineTo(isoX - tileW * 0.5, isoY - tileH * 0.5);
      ctx.lineTo(isoX, isoY);
      ctx.closePath();
      // Left is usually darkest in this lighting setup
      ctx.fillStyle = shadeColor(r, g, b, -5);
      ctx.fill();
      ctx.stroke();
    };

    // 3. Render Loop (Painter's Algorithm: Back to Front, Bottom to Top)
    // We need to render layers from bottom (z=0) to top.
    // Within a layer, we render from "back" of the screen to "front".
    // In isometric: (0,0) is top center. Max X and Max Y are bottom corners.
    
    // We iterate Z levels
    for (let z = 0; z < levels; z++) {
      // For a step pyramid, the size decreases as Z increases
      // For a simple stack, baseSize decreases by 1 each level (usually)
      // or we just stack 'levels' amount on top of a 'baseSize' foundation.
      // Let's assume a tapering pyramid where top level has size 1 or 2.
      
      // Calculate current layer width based on pyramid logic
      const currentLayerSize = Math.max(1, baseSize - (z * 2)); 
      if (currentLayerSize <= 0 && z > 0) break; // Stop if it tapers to nothing

      const offset = (baseSize - currentLayerSize) / 2;

      // Iterate X and Y for this layer
      for (let x = 0; x < currentLayerSize; x++) {
        for (let y = 0; y < currentLayerSize; y++) {
          
          // Coordinate adjustment to center the layer on the previous one
          const gridX = x + offset;
          const gridY = y + offset;

          // Triangular Base Logic
          if (baseType === PyramidBase.TRIANGULAR) {
             // Simple logic for triangle: strictly x >= y or similar cut
             if (x > y) continue;
          }

          // Coloring Math (Procedural variation)
          // vary color slightly based on height (z) to give depth
          let rV = rgb.r;
          let gV = rgb.g;
          let bV = rgb.b;
          
          if (params.pattern === 'Glowing Neon') {
            rV = Math.min(255, rV + z * 10);
          } else if (params.pattern === 'Rough Stone') {
            // Noise variation
            const noise = (Math.random() - 0.5) * 20;
            rV += noise; gV += noise; bV += noise;
          }

          drawCube(gridX, gridY, z, rV, gV, bV);
        }
      }
    }
    
    resolve(canvas.toDataURL('image/png'));
  });
};