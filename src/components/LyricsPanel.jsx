import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function LyricsPanel({ 
  activeTrack, 
  currentTime, 
  lyricsOpen, 
  onClose,
  onSeek 
}) {
  const scrollerRef = useRef(null);
  const activeLineRef = useRef(null);

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
            lyrics.map((line, idx) => (
              <div
                key={idx}
                className={`lyrics-line ${idx === activeIndex ? 'active' : ''}`}
                onClick={() => handleLineClick(line.time)}
              >
                {line.text}
              </div>
            ))
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
