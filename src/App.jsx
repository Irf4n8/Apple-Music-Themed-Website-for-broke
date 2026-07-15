import React, { useState, useEffect, useRef } from 'react';
import { songs as defaultSongs } from './data/songs';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import PlayerBar from './components/PlayerBar';
import LyricsPanel from './components/LyricsPanel';
import QueuePanel from './components/QueuePanel';
import AddSongModal from './components/AddSongModal';
import BackgroundGlow from './components/BackgroundGlow';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  X 
} from 'lucide-react';

// Defensive LocalStorage wrapper to avoid security crashes (blocked cookies, frame restrictions, etc.)
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('LocalStorage is not accessible:', e);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('LocalStorage setItem failed:', e);
    }
  }
};

// Helper to extract YouTube video ID from URL
const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function App() {
  // Theme state: dark mode by default
  const [theme, setTheme] = useState(() => {
    return safeLocalStorage.getItem('music-player-theme') || 'dark';
  });

  // Views & Songs States
  const [activeView, setActiveView] = useState('listen-now');
  const [searchQuery, setSearchQuery] = useState('');
  const [songsList, setSongsList] = useState(() => {
    const saved = safeLocalStorage.getItem('music-player-custom-songs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? [...defaultSongs, ...parsed] : defaultSongs;
      } catch (e) {
        return defaultSongs;
      }
    }
    return defaultSongs;
  });

  // Playlists State
  const [playlists, setPlaylists] = useState(() => {
    const saved = safeLocalStorage.getItem('music-player-playlists');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Queue Management States
  const [queue, setQueue] = useState([...defaultSongs]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);

  // Playback Control States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    try {
      const vol = safeLocalStorage.getItem('music-player-volume');
      return vol ? parseFloat(vol) : 0.5;
    } catch (e) {
      return 0.5;
    }
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  // Panel Open States
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Audio References
  const audioRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytIntervalRef = useRef(null);

  // Dynamic Glow Active Track
  const activeTrack = queue[currentQueueIndex] || null;

  // Sync references to avoid stale closures in audio event listeners
  const queueRef = useRef(queue);
  const indexRef = useRef(currentQueueIndex);
  const repeatRef = useRef(isRepeat);
  const shuffleRef = useRef(isShuffle);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { indexRef.current = currentQueueIndex; }, [currentQueueIndex]);
  useEffect(() => { repeatRef.current = isRepeat; }, [isRepeat]);
  useEffect(() => { shuffleRef.current = isShuffle; }, [isShuffle]);

  // Load YouTube IFrame Player API (Defensively)
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  }, []);

  // Standard HTML5 Audio setup
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const handleTimeUpdate = () => {
      if (activeTrack && !getYouTubeId(activeTrack.url)) {
        setCurrentTime(audioRef.current.currentTime);
      }
    };

    const handleDurationChange = () => {
      if (activeTrack && !getYouTubeId(activeTrack.url) && audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    };

    const handleLoadedMetadata = () => {
      if (activeTrack && !getYouTubeId(activeTrack.url) && audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
      
      const currentIdx = indexRef.current;
      const currentQ = queueRef.current;
      if (currentQ[currentIdx] && !getYouTubeId(currentQ[currentIdx].url) && currentQ[currentIdx].duration === 0) {
        const updatedQ = [...currentQ];
        updatedQ[currentIdx] = {
          ...updatedQ[currentIdx],
          duration: audioRef.current.duration
        };
        setQueue(updatedQ);
      }
    };

    const handleEnded = () => {
      if (repeatRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log('Replay error:', e));
      } else {
        playNextTrack();
      }
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('durationchange', handleDurationChange);
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioRef.current.addEventListener('ended', handleEnded);

    // Set Theme Attribute
    document.documentElement.setAttribute('data-theme', theme);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('durationchange', handleDurationChange);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [activeTrack?.id]);

  // Initializing YouTube Player instance
  const initYoutubePlayer = (videoId, autoplay = false) => {
    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      try {
        if (autoplay) {
          ytPlayerRef.current.loadVideoById(videoId);
        } else {
          ytPlayerRef.current.cueVideoById(videoId);
        }
        return;
      } catch (err) {
        console.error('Error loading video on existing player:', err);
      }
    }

    if (window.YT && window.YT.Player) {
      try {
        ytPlayerRef.current = new window.YT.Player('yt-player', {
          height: '0',
          width: '0',
          videoId: videoId,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0
          },
          events: {
            onReady: (event) => {
              try {
                event.target.setVolume(isMuted ? 0 : volume * 100);
                if (autoplay) {
                  event.target.playVideo();
                }
              } catch (e) {}
            },
            onStateChange: (event) => {
              // Numeric state codes: 1 = playing, 2 = paused, 0 = ended (defensive against YT object races)
              if (event.data === 1) {
                setIsPlaying(true);
                if (audioRef.current && !audioRef.current.paused) {
                  audioRef.current.pause();
                }
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                if (repeatRef.current) {
                  try {
                    ytPlayerRef.current.seekTo(0);
                    ytPlayerRef.current.playVideo();
                  } catch (e) {}
                } else {
                  playNextTrack();
                }
              }
            }
          }
        });
      } catch (e) {
        console.error('Failed to instantiate YT.Player:', e);
      }
    }
  };

  // Track change side-effects (Dual Engine support)
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (ytIntervalRef.current) {
      clearInterval(ytIntervalRef.current);
      ytIntervalRef.current = null;
    }

    if (activeTrack) {
      const ytId = getYouTubeId(activeTrack.url);
      if (ytId) {
        audioRef.current.pause(); 
        setCurrentTime(0);
        setDuration(activeTrack.duration || 0);

        if (window.YT && window.YT.Player) {
          initYoutubePlayer(ytId, isPlaying);
        } else {
          const checkYtInterval = setInterval(() => {
            if (window.YT && window.YT.Player) {
              clearInterval(checkYtInterval);
              initYoutubePlayer(ytId, isPlaying);
            }
          }, 100);
          setTimeout(() => clearInterval(checkYtInterval), 5000);
        }
      } else {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch (e) {}
        }

        audioRef.current.src = activeTrack.url;
        audioRef.current.load();
        setCurrentTime(0);
        setDuration(activeTrack.duration || 0);

        if (isPlaying) {
          audioRef.current.play().catch(err => {
            console.log('Autoplay blocked or play error:', err);
            setIsPlaying(false);
          });
        }
      }
    } else {
      audioRef.current.pause();
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch (e) {}
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentQueueIndex, activeTrack?.id]);

  // YouTube polling interval to update time & duration
  useEffect(() => {
    const isYt = activeTrack && getYouTubeId(activeTrack.url);
    if (isPlaying && isYt) {
      ytIntervalRef.current = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const currentYtTime = ytPlayerRef.current.getCurrentTime();
            setCurrentTime(currentYtTime);
            
            const ytDuration = ytPlayerRef.current.getDuration();
            if (ytDuration) {
              setDuration(ytDuration);
            }
          } catch (e) {
            console.log('Error polling YouTube time:', e);
          }
        }
      }, 250);
    } else {
      if (ytIntervalRef.current) {
        clearInterval(ytIntervalRef.current);
        ytIntervalRef.current = null;
      }
    }

    return () => {
      if (ytIntervalRef.current) {
        clearInterval(ytIntervalRef.current);
      }
    };
  }, [isPlaying, activeTrack?.id]);

  // Volume & Mute updates (Dual Engine support)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      try {
        ytPlayerRef.current.setVolume(isMuted ? 0 : volume * 100);
      } catch (e) {}
    }
    safeLocalStorage.setItem('music-player-volume', volume.toString());
  }, [volume, isMuted]);

  // Play/Pause sync logic (Dual Engine support)
  useEffect(() => {
    if (!activeTrack) return;
    const isYt = getYouTubeId(activeTrack.url);

    if (isPlaying) {
      if (isYt) {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
          try {
            ytPlayerRef.current.playVideo();
          } catch (e) {}
        }
      } else {
        if (audioRef.current) {
          audioRef.current.play().catch(() => setIsPlaying(false));
        }
      }
    } else {
      if (isYt) {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch (e) {}
        }
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    }
  }, [isPlaying]);

  // Theme change sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    safeLocalStorage.setItem('music-player-theme', theme);
  }, [theme]);

  // Helper: Play next track
  const playNextTrack = () => {
    const q = queueRef.current;
    const idx = indexRef.current;
    const isShuf = shuffleRef.current;

    if (q.length === 0) return;

    if (isShuf) {
      const randomIndex = Math.floor(Math.random() * q.length);
      setCurrentQueueIndex(randomIndex);
    } else {
      if (idx < q.length - 1) {
        setCurrentQueueIndex(idx + 1);
      } else {
        setCurrentQueueIndex(0);
      }
    }
    setIsPlaying(true);
  };

  // Helper: Play previous track
  const playPrevTrack = () => {
    const q = queue;
    const idx = currentQueueIndex;

    if (q.length === 0) return;

    if (currentTime > 4) {
      handleSeek(0);
    } else {
      if (idx > 0) {
        setCurrentQueueIndex(idx - 1);
      } else {
        setCurrentQueueIndex(q.length - 1);
      }
    }
    setIsPlaying(true);
  };

  // Actions
  const handlePlaySong = (song) => {
    const existingIndex = queue.findIndex(s => s.id === song.id);
    if (existingIndex !== -1) {
      setCurrentQueueIndex(existingIndex);
    } else {
      const newQueue = [...queue];
      const insertIndex = currentQueueIndex + 1;
      newQueue.splice(insertIndex, 0, song);
      setQueue(newQueue);
      setCurrentQueueIndex(insertIndex);
    }
    setIsPlaying(true);
  };

  const handleAddToQueue = (song) => {
    setQueue([...queue, song]);
    setQueueOpen(true);
  };

  const handleRemoveFromQueue = (index) => {
    const newQueue = queue.filter((_, idx) => idx !== index);
    setQueue(newQueue);
    if (index === currentQueueIndex) {
      if (index >= newQueue.length) {
        setCurrentQueueIndex(Math.max(0, newQueue.length - 1));
      }
    } else if (index < currentQueueIndex) {
      setCurrentQueueIndex(currentQueueIndex - 1);
    }
  };

  const handleClearQueue = () => {
    if (activeTrack) {
      setQueue([activeTrack]);
      setCurrentQueueIndex(0);
    } else {
      setQueue([]);
      setCurrentQueueIndex(-1);
    }
  };

  const handleSeek = (time) => {
    const isYt = activeTrack && getYouTubeId(activeTrack.url);
    if (isYt) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
        try {
          ytPlayerRef.current.seekTo(time, true);
          setCurrentTime(time);
        } catch (e) {}
      }
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      }
    }
  };

  const handleAddCustomSong = (newSong) => {
    const updatedSongs = [...songsList, newSong];
    setSongsList(updatedSongs);

    const customLinkSongs = updatedSongs.filter(s => s.id.startsWith('custom-link-'));
    safeLocalStorage.setItem('music-player-custom-songs', JSON.stringify(customLinkSongs));

    handlePlaySong(newSong);
  };

  // Playlists Actions
  const handleCreatePlaylist = () => {
    const name = prompt('Enter Playlist Name:');
    if (!name || !name.trim()) return;

    const newPlaylist = {
      id: 'playlist-' + Date.now(),
      name: name.trim(),
      songIds: []
    };

    const updatedPlaylists = [...playlists, newPlaylist];
    setPlaylists(updatedPlaylists);
    safeLocalStorage.setItem('music-player-playlists', JSON.stringify(updatedPlaylists));
  };

  const handleDeletePlaylist = (playlistId) => {
    const updatedPlaylists = playlists.filter(p => p.id !== playlistId);
    setPlaylists(updatedPlaylists);
    safeLocalStorage.setItem('music-player-playlists', JSON.stringify(updatedPlaylists));
    setActiveView('listen-now');
  };

  const handleAddSongToPlaylist = (playlistId, songId) => {
    const updatedPlaylists = playlists.map(p => {
      if (p.id === playlistId) {
        if (p.songIds.includes(songId)) return p;
        return {
          ...p,
          songIds: [...p.songIds, songId]
        };
      }
      return p;
    });

    setPlaylists(updatedPlaylists);
    safeLocalStorage.setItem('music-player-playlists', JSON.stringify(updatedPlaylists));
  };

  const handleRemoveFromPlaylist = (playlistId, songId) => {
    const updatedPlaylists = playlists.map(p => {
      if (p.id === playlistId) {
        return {
          ...p,
          songIds: p.songIds.filter(id => id !== songId)
        };
      }
      return p;
    });

    setPlaylists(updatedPlaylists);
    safeLocalStorage.setItem('music-player-playlists', JSON.stringify(updatedPlaylists));
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="app-container">
      {/* Hidden YouTube player mount node */}
      <div id="yt-player" style={{ position: 'absolute', width: '1px', height: '1px', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }} />

      {/* Dynamic Color Blur Backdrop */}
      <BackgroundGlow activeTrack={activeTrack} />

      {/* Sidebar Section */}
      <Sidebar 
        activeView={activeView}
        setActiveView={setActiveView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onAddSongClick={() => setIsAddModalOpen(true)}
        playlists={playlists}
        onCreatePlaylistClick={handleCreatePlaylist}
      />

      {/* Main Content Area */}
      <MainContent 
        activeView={activeView}
        songs={songsList}
        activeTrack={activeTrack}
        isPlaying={isPlaying}
        onPlaySong={handlePlaySong}
        onAddToQueue={handleAddToQueue}
        searchQuery={searchQuery}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        playlists={playlists}
        onRemoveFromPlaylist={handleRemoveFromPlaylist}
        onDeletePlaylist={handleDeletePlaylist}
        onAddSongClick={() => setIsAddModalOpen(true)}
      />

      {/* Media Player Bar at bottom */}
      <PlayerBar 
        activeTrack={activeTrack}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onNext={playNextTrack}
        onPrev={playPrevTrack}
        volume={volume}
        onVolumeChange={setVolume}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        isMuted={isMuted}
        onMuteToggle={() => setIsMuted(!isMuted)}
        isShuffle={isShuffle}
        onShuffleToggle={() => setIsShuffle(!isShuffle)}
        isRepeat={isRepeat}
        onRepeatToggle={() => setIsRepeat(!isRepeat)}
        lyricsOpen={lyricsOpen}
        onLyricsToggle={() => {
          setLyricsOpen(!lyricsOpen);
          if (queueOpen) setQueueOpen(false);
        }}
        queueOpen={queueOpen}
        onQueueToggle={() => {
          setQueueOpen(!queueOpen);
          if (lyricsOpen) setLyricsOpen(false);
        }}
        onFullscreenToggle={() => setIsFullscreen(true)}
      />

      {/* Sliding Lyrics Panel */}
      <LyricsPanel 
        activeTrack={activeTrack}
        currentTime={currentTime}
        lyricsOpen={lyricsOpen}
        onClose={() => setLyricsOpen(false)}
        onSeek={handleSeek}
      />

      {/* Slide-out Queue Panel */}
      <QueuePanel 
        queue={queue}
        currentQueueIndex={currentQueueIndex}
        onQueueItemClick={setCurrentQueueIndex}
        onRemoveFromQueue={handleRemoveFromQueue}
        onClearQueue={handleClearQueue}
        queueOpen={queueOpen}
        onClose={() => setQueueOpen(false)}
      />

      {/* Add Music Modal (Upload/Paste URL) */}
      <AddSongModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSong={handleAddCustomSong}
      />

      {/* Fullscreen Player Mode */}
      <div className={`fullscreen-player ${isFullscreen ? 'active' : ''}`}>
        <div 
          className="lyrics-backdrop" 
          style={{ backgroundImage: `url(${activeTrack?.cover || ''})`, opacity: 0.25 }} 
        />
        
        <button className="fullscreen-close" onClick={() => setIsFullscreen(false)}>
          <X size={20} />
        </button>

        {activeTrack && (
          <div className="fullscreen-container" style={{ zIndex: 10 }}>
            <img src={activeTrack.cover} alt={activeTrack.title} className="fullscreen-art" />
            <div className="fullscreen-meta">
              <h2 className="fullscreen-title">{activeTrack.title}</h2>
              <p className="fullscreen-artist">{activeTrack.artist}</p>
            </div>

            {/* Large Progress bar */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div 
                className="slider-container" 
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const seekTime = ((e.clientX - rect.left) / rect.width) * duration;
                  handleSeek(seekTime);
                }}
              >
                <div className="slider-track" style={{ height: '6px' }}>
                  <div 
                    className="slider-fill" 
                    style={{ 
                      width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                      background: '#ffffff'
                    }} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(duration - currentTime)}</span>
              </div>
            </div>

            {/* Media controls */}
            <div className="fullscreen-controls">
              <button className="fullscreen-btn" onClick={playPrevTrack}>
                <SkipBack size={32} fill="currentColor" />
              </button>
              <button 
                className="fullscreen-btn play-btn" 
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" style={{ marginLeft: '4px' }} />}
              </button>
              <button className="fullscreen-btn" onClick={playNextTrack}>
                <SkipForward size={32} fill="currentColor" />
              </button>
            </div>

            {/* Volume slider */}
            <div className="fullscreen-volume">
              <VolumeX size={18} onClick={() => setIsMuted(!isMuted)} style={{ cursor: 'pointer' }} />
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                style={{
                  accentColor: '#ffffff',
                  width: '100%',
                  height: '4px',
                  cursor: 'pointer'
                }}
              />
              <Volume2 size={18} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
