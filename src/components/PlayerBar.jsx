import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Volume2, 
  VolumeX, 
  Volume1, 
  AlignLeft, 
  ListMusic, 
  Maximize2, 
  Heart,
  MoreHorizontal,
  AppWindow,
  Timer
} from 'lucide-react';

export default function PlayerBar({
  activeTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  volume,
  onVolumeChange,
  currentTime,
  duration,
  onSeek,
  isMuted,
  onMuteToggle,
  isShuffle,
  onShuffleToggle,
  isRepeat,
  onRepeatToggle,
  lyricsOpen,
  onLyricsToggle,
  queueOpen,
  onQueueToggle,
  onFullscreenToggle,
  onMiniPlayerToggle,
  sleepTimeLeft,
  onSetSleepTimer
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);

  // Formatting seconds to MM:SS
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Apple Music style: shows remaining time as negative (e.g. -2:45)
  const formatRemainingTime = (current, total) => {
    if (isNaN(total) || isNaN(current)) return '-0:00';
    const remaining = total - current;
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    return `-${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSliderClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const seekTime = percentage * duration;
    onSeek(seekTime);
  };

  const handleVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX size={16} />;
    if (volume < 0.4) return <Volume1 size={16} />;
    return <Volume2 size={16} />;
  };

  if (!activeTrack) {
    return (
      <div className="player-bar" style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
        <span>No song selected. Select a song to start listening.</span>
      </div>
    );
  }

  return (
    <div className="player-bar">
      {/* Left Section: Track Info */}
      <div className="player-info">
        <img 
          src={activeTrack.cover || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&q=80'} 
          alt={activeTrack.title} 
          className="player-artwork"
          onClick={onFullscreenToggle}
          title="Open Fullscreen Player"
        />
        <div className="player-text-details">
          <span className="player-song-title">
            {activeTrack.title}
            {activeTrack.id === '4' && <span className="explicit-tag">E</span>}
            
            {/* Audio Quality Badge */}
            <span className="audio-quality-badge-container">
              <span className="audio-quality-badge">
                {activeTrack.url && (activeTrack.url.includes('youtube.com') || activeTrack.url.includes('youtu.be')) ? 'HQ' : 'Lossless'}
              </span>
              <span className="audio-tooltip">
                <strong>Audio Stream Quality</strong>
                <span style={{ display: 'block', marginTop: 4 }}>
                  {activeTrack.url && (activeTrack.url.includes('youtube.com') || activeTrack.url.includes('youtu.be')) 
                    ? 'Source: YouTube Streaming (AAC 256kbps) optimized for web.' 
                    : 'Source: ALAC Lossless (24-bit/48kHz) high-fidelity audio stream.'}
                </span>
              </span>
            </span>
          </span>
          <span className="player-artist">{activeTrack.artist}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
          <button 
            className="control-btn"
            style={{ color: isFavorite ? 'var(--apple-accent)' : 'var(--text-secondary)' }}
            onClick={() => setIsFavorite(!isFavorite)}
          >
            <Heart size={15} fill={isFavorite ? 'var(--apple-accent)' : 'none'} />
          </button>
          <button className="control-btn" style={{ color: 'var(--text-secondary)' }}>
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* Middle Section: Player Controls & Progress Slider */}
      <div className="player-controls-container">
        <div className="player-buttons">
          <button 
            className={`control-btn ${isShuffle ? 'active' : ''}`} 
            onClick={onShuffleToggle}
            title="Shuffle"
          >
            <Shuffle size={16} />
          </button>
          <button 
            className="control-btn" 
            onClick={onPrev}
            title="Previous"
          >
            <SkipBack size={18} fill="currentColor" />
          </button>
          <button 
            className="control-btn play-pause-btn" 
            onClick={onPlayPause}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" style={{ marginLeft: '2px' }} />
            )}
          </button>
          <button 
            className="control-btn" 
            onClick={onNext}
            title="Next"
          >
            <SkipForward size={18} fill="currentColor" />
          </button>
          <button 
            className={`control-btn ${isRepeat ? 'active' : ''}`} 
            onClick={onRepeatToggle}
            title="Repeat"
          >
            <Repeat size={16} />
          </button>
        </div>

        <div className="progress-bar-wrapper">
          <span>{formatTime(currentTime)}</span>
          <div className="slider-container" onClick={handleSliderClick}>
            <div className="slider-track">
              <div 
                className="slider-fill" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            <div 
              className="slider-thumb" 
              style={{ left: `${progressPercent}%` }} 
            />
          </div>
          <span>{formatRemainingTime(currentTime, duration)}</span>
        </div>
      </div>

      {/* Right Section: Extras (Lyrics, Queue, Volume, Fullscreen) */}
      <div className="player-extras">
        {/* Mobile-only Play Button */}
        <button className="mobile-play-btn" onClick={onPlayPause}>
          {isPlaying ? <Pause size={22} /> : <Play size={22} />}
        </button>

         <button 
          className={`extra-btn lyrics-toggle-btn ${lyricsOpen ? 'active' : ''}`}
          onClick={onLyricsToggle}
          disabled={!activeTrack || !activeTrack.lyrics || activeTrack.lyrics.length === 0}
          title={activeTrack && activeTrack.lyrics && activeTrack.lyrics.length > 0 ? "Lyrics" : "Lyrics Not Available"}
          style={{
            opacity: activeTrack && activeTrack.lyrics && activeTrack.lyrics.length > 0 ? 1 : 0.4,
            cursor: activeTrack && activeTrack.lyrics && activeTrack.lyrics.length > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          <AlignLeft size={18} />
        </button>
        
        <button 
          className={`extra-btn ${queueOpen ? 'active' : ''}`}
          onClick={onQueueToggle}
          title="Queue"
        >
          <ListMusic size={18} />
        </button>

        <div className="volume-container">
          <button 
            className="extra-btn" 
            onClick={onMuteToggle}
            style={{ padding: 0 }}
          >
            {handleVolumeIcon()}
          </button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            style={{
              accentColor: 'var(--text-primary)',
              width: '100%',
              height: '3px',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* Sleep Timer */}
        <div className="sleep-timer-container">
          <button 
            className={`extra-btn ${sleepTimeLeft ? 'active' : ''}`}
            onClick={() => setShowTimerMenu(!showTimerMenu)}
            title="Set Sleep Timer"
            style={{ position: 'relative' }}
          >
            <Timer size={16} />
            {sleepTimeLeft > 0 && (
              <span className="sleep-timer-badge">
                {Math.ceil(sleepTimeLeft / 60)}m
              </span>
            )}
          </button>
          
          {showTimerMenu && (
            <div className="sleep-timer-menu">
              <button 
                className={`sleep-timer-option ${!sleepTimeLeft ? 'active' : ''}`}
                onClick={() => { onSetSleepTimer(null); setShowTimerMenu(false); }}
              >
                Off
              </button>
              <button 
                className={`sleep-timer-option ${sleepTimeLeft === 900 ? 'active' : ''}`}
                onClick={() => { onSetSleepTimer(900); setShowTimerMenu(false); }}
              >
                15 Minutes
              </button>
              <button 
                className={`sleep-timer-option ${sleepTimeLeft === 1800 ? 'active' : ''}`}
                onClick={() => { onSetSleepTimer(1800); setShowTimerMenu(false); }}
              >
                30 Minutes
              </button>
              <button 
                className={`sleep-timer-option ${sleepTimeLeft === 2700 ? 'active' : ''}`}
                onClick={() => { onSetSleepTimer(2700); setShowTimerMenu(false); }}
              >
                45 Minutes
              </button>
              <button 
                className={`sleep-timer-option ${sleepTimeLeft === 3600 ? 'active' : ''}`}
                onClick={() => { onSetSleepTimer(3600); setShowTimerMenu(false); }}
              >
                60 Minutes
              </button>
              <button 
                className={`sleep-timer-option ${sleepTimeLeft === -1 ? 'active' : ''}`}
                onClick={() => { onSetSleepTimer(-1); setShowTimerMenu(false); }}
              >
                End of Song
              </button>
            </div>
          )}
        </div>

        <button 
          className="extra-btn"
          onClick={onMiniPlayerToggle}
          title="Open Mini-Player"
        >
          <AppWindow size={16} />
        </button>

        <button 
          className="extra-btn"
          onClick={onFullscreenToggle}
          title="Fullscreen Player"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
}
