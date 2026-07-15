import React, { useEffect, useState } from 'react';

// Hardcoded colors for demo tracks (Color 1, Color 2, Color 3)
const trackColorMap = {
  '1': ['#fa243c', '#7d1b82', '#160a2b'], // Cosmic Drift
  '2': ['#2c3e50', '#2980b9', '#1a252f'], // Overdrive
  '3': ['#e67e22', '#d35400', '#2c1a0c'], // Sunsets & Shadows
  '4': ['#8e44ad', '#3498db', '#140a1d'], // Tokyo Rain
  '5': ['#e91e63', '#9c27b0', '#21092e'], // Arcade Dreams
  '6': ['#1abc9c', '#16a085', '#082c24'], // Deep Blue
  '7': ['#9b59b6', '#8e44ad', '#1c0a2b'], // Atmosphere
  '8': ['#e74c3c', '#c0392b', '#2c0c0c']  // Visions
};

export default function BackgroundGlow({ activeTrack }) {
  const [colors, setColors] = useState(['#fa243c', '#7d1b82', '#160a2b']);

  useEffect(() => {
    if (!activeTrack) return;

    // 1. If it's a default song, use the predefined color map
    if (trackColorMap[activeTrack.id]) {
      setColors(trackColorMap[activeTrack.id]);
      return;
    }

    // 2. Dynamic color extraction for custom added songs using HTML Canvas
    if (activeTrack.cover && activeTrack.cover.startsWith('http')) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = activeTrack.cover;
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 10;
          canvas.height = 10;
          ctx.drawImage(img, 0, 0, 10, 10);
          
          // Get middle pixel color
          const p1 = ctx.getImageData(3, 3, 1, 1).data;
          const p2 = ctx.getImageData(7, 7, 1, 1).data;
          
          const col1 = `rgb(${p1[0]}, ${p1[1]}, ${p1[2]})`;
          const col2 = `rgb(${p2[0]}, ${p2[1]}, ${p2[2]})`;
          const col3 = `rgb(${Math.max(0, p1[0] - 80)}, ${Math.max(0, p1[1] - 80)}, ${Math.max(0, p1[2] - 80)})`;
          
          setColors([col1, col2, col3]);
        } catch (e) {
          // Fallback to title hashing if canvas tainted (CORS)
          generateFallbackColors(activeTrack.title);
        }
      };
      img.onerror = () => {
        generateFallbackColors(activeTrack.title);
      };
    } else {
      generateFallbackColors(activeTrack.title || 'Apple Music');
    }
  }, [activeTrack]);

  // Generate pleasant procedural colors based on song title (avoids CORS failures)
  const generateFallbackColors = (seed) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h1 = Math.abs(hash % 360);
    const h2 = (h1 + 60) % 360;
    
    // Saturation 65%, Lightness 45% for color 1, 35% for color 2, 10% for base
    const col1 = `hsl(${h1}, 65%, 45%)`;
    const col2 = `hsl(${h2}, 60%, 35%)`;
    const col3 = `hsl(${h1}, 70%, 10%)`;
    setColors([col1, col2, col3]);
  };

  return (
    <div className="bg-glow-container">
      <div 
        className="glow-circle glow-circle-1" 
        style={{ backgroundColor: colors[0] }} 
      />
      <div 
        className="glow-circle glow-circle-2" 
        style={{ backgroundColor: colors[1] }} 
      />
      <div 
        className="glow-circle glow-circle-3" 
        style={{ backgroundColor: colors[2] }} 
      />
    </div>
  );
}
