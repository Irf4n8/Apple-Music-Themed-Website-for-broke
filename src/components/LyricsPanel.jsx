import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const getTranslation = (lineText) => {
  const dictionary = {
    // Cosmic Drift
    "Cruising through the starry night": "Navegando por la noche estrellada",
    "Nebula colors shining bright": "Colores de nebulosa brillando intensamente",
    "Floating in the gravity stream": "Flotando en la corriente de gravedad",
    "Living inside a cosmic dream": "Viviendo dentro de un sueño cósmico",
    "Starlight guides us on our way": "La luz de las estrellas nos guía en nuestro camino",
    "Into the dark and far away": "Hacia la oscuridad y muy lejos",
    
    // Starboy
    "I'm trying to put you in the worst mood, ah": "Estoy intentando ponerte en el peor humor, ah",
    "P1 cleaner than your church shoes, ah": "P1 más limpio que tus zapatos de iglesia, ah",
    "Milli point two on the hurt loop, ah": "1.2 millones en el bucle del dolor, ah",
    "House so empty, need a centerpiece": "Casa tan vacía, necesita un centro de mesa",
    "🎵 (Streaming Audio Link)": "🎵 (Enlace de transmisión de audio)",
    "Listening to Starboy": "Escuchando a Starboy",
    "by The Weeknd": "por The Weeknd",
    "Enjoy the music!": "¡Disfruta la música!"
  };
  
  if (dictionary[lineText]) return dictionary[lineText];
  
  // Basic mock translation engine for custom pasted lines
  return lineText
    .replace(/\bthe\b/gi, 'el')
    .replace(/\band\b/gi, 'y')
    .replace(/\bin\b/gi, 'en')
    .replace(/\bto\b/gi, 'a')
    .replace(/\bme\b/gi, 'yo')
    .replace(/\byou\b/gi, 'tú')
    .replace(/\blove\b/gi, 'amor')
    .replace(/\blike\b/gi, 'como') + " (Traducido)";
};

export default function LyricsPanel({ 
  activeTrack, 
  currentTime, 
  lyricsOpen, 
  onClose,
  onSeek 
}) {
  const scrollerRef = useRef(null);
  const [showTranslation, setShowTranslation] = useState(false);

  // Parse lyrics. If none are provided, show an empty state.
  const lyrics = activeTrack?.lyrics || [];

  // Find index of the currently active lyric line
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].time <= currentTime) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Calculate sweep progress percent for the active line
  let progressPercent = 0;
  if (activeIndex !== -1) {
    const currentLineTime = lyrics[activeIndex].time;
    const nextLineTime = 
      activeIndex < lyrics.length - 1 
        ? lyrics[activeIndex + 1].time 
        : (activeTrack?.duration || currentLineTime + 8);
    
    const lineDuration = nextLineTime - currentLineTime;
    if (lineDuration > 0) {
      progressPercent = ((currentTime - currentLineTime) / lineDuration) * 100;
      progressPercent = Math.min(100, Math.max(0, progressPercent));
    }
  }

  // Smoothly center the active lyric line in the scroll container
  useEffect(() => {
    if (activeIndex !== -1 && scrollerRef.current) {
      const activeElement = scrollerRef.current.children[activeIndex];
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [activeIndex]);

  const handleLineClick = (time) => {
    onSeek(time);
  };

  return (
    <div className={`lyrics-overlay ${lyricsOpen ? 'open' : ''}`}>
      {/* Blurred Backdrop using current album cover */}
      <div 
        className="lyrics-backdrop" 
        style={{ backgroundImage: `url(${activeTrack?.cover || ''})` }} 
      />

      <div className="lyrics-content-container">
        {/* Left pane: large artwork and metadata */}
        <div className="lyrics-left-art">
          <img 
            src={activeTrack?.cover} 
            alt={activeTrack?.title} 
            className="lyrics-large-artwork" 
          />
          <div className="lyrics-meta-details">
            <h2 className="lyrics-song-name">{activeTrack?.title}</h2>
            <p className="lyrics-song-artist">{activeTrack?.artist}</p>
          </div>
        </div>

        {/* Right pane: scrolling lyrics */}
        <div className="lyrics-scroller" ref={scrollerRef}>
          {lyrics.length > 0 ? (
            lyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={idx}
                  className={`lyrics-line ${isActive ? 'active' : ''}`}
                  onClick={() => handleLineClick(line.time)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                >
                  {isActive ? (
                    <>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <span className="lyrics-line-background">{line.text}</span>
                        <span 
                          className="lyrics-line-fill" 
                          style={{ clipPath: `inset(0 ${100 - progressPercent}% 0 0)` }}
                        >
                          {line.text}
                        </span>
                      </div>
                      {showTranslation && (
                        <span className="lyrics-translation-line">
                          {getTranslation(line.text)}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span>{line.text}</span>
                      {showTranslation && (
                        <span className="lyrics-translation-line" style={{ opacity: 0.5 }}>
                          {getTranslation(line.text)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })
          ) : (
            <div 
              className="lyrics-line" 
              style={{ textAlign: 'center', opacity: 0.5, fontSize: '1.5rem', pointerEvents: 'none' }}
            >
              Lyrics not available for this song.
            </div>
          )}
        </div>
      </div>

      {/* Translation Toggle Button */}
      <button 
        onClick={() => setShowTranslation(!showTranslation)}
        style={{
          position: 'absolute',
          top: '24px',
          right: '80px',
          zIndex: 10,
          background: showTranslation ? 'var(--apple-accent)' : 'rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '18px',
          padding: '8px 16px',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s'
        }}
      >
        <span>🌐 {showTranslation ? 'Show Original' : 'Translate to Spanish'}</span>
      </button>

      {/* Close button at top right */}
      <button 
        className="extra-btn"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
}
