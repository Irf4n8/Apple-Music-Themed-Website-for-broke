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
  Volume1, 
  X, 
  Heart, 
  MoreHorizontal, 
  Plus 
} from 'lucide-react';

export default function App() {
  // Theme state: dark mode by default
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('apple-music-theme') || 'dark';
  });

  // Views & Songs States
  const [activeView, setActiveView] = useState('listen-now');
  const [searchQuery, setSearchQuery] = useState('');
  const [songsList, setSongsList] = useState(() => {
    const saved = localStorage.getItem('apple-music-custom-songs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...defaultSongs, ...parsed];
      } catch (e) {
        return defaultSongs;
      }
    }
    return defaultSongs;
  });

  // Playlists State
  const [playlists, setPlaylists] = useState(() => {
    const saved = localStorage.getItem('apple-music-playlists');
    if (saved) {
      try {
        return JSON.parse(saved);
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
    return parseFloat(localStorage.getItem('apple-music-volume') || '0.5');
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  // Panel Open States
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Song Action Dropdowns
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Audio Reference
  const audioRef = useRef(null);

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

  // Audio setup
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const handleTimeUpdate = () => {
      setCurrentTime(audioRef.current.currentTime);
    };

    const handleDurationChange = () => {
      if (audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    };

    const handleLoadedMetadata = () => {
      if (audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
      // Once metadata loaded, update the duration in the song object if it was 0
      const currentIdx = indexRef.current;
      const currentQ = queueRef.current;
      if (currentQ[currentIdx] && currentQ[currentIdx].duration === 0) {
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
  }, []);

  // Track change side-effects
  useEffect(() => {
    if (!audioRef.current) return;

    if (activeTrack) {
      audioRef.current.src = activeTrack.url;
      audioRef.current.load();
      setCurrentTime(0);
      
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.log('Autoplay blocked or play error:', err);
          setIsPlaying(false);
        });
      }
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentQueueIndex, activeTrack?.id]);

  // Volume & Mute updates
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
    localStorage.setItem('apple-music-volume', volume.toString());
  }, [volume, isMuted]);

  // Play/Pause state sync
  useEffect(() => {
    if (!audioRef.current || !activeTrack) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Theme change sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('apple-music-theme', theme);
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
        // Loop back to start
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
      // Restart current song if played past 4 seconds
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    } else {
      if (idx > 0) {
        setCurrentQueueIndex(idx - 1);
      } else {
        // Go to end of queue
        setCurrentQueueIndex(q.length - 1);
      }
    }
    setIsPlaying(true);
  };

  // Actions
  const handlePlaySong = (song) => {
    // If the song is already in the queue, switch index to it
    const existingIndex = queue.findIndex(s => s.id === song.id);
    if (existingIndex !== -1) {
      setCurrentQueueIndex(existingIndex);
    } else {
      // Otherwise insert song right after current index and play it
      const newQueue = [...queue];
      const insertIndex = currentQueueIndex + 1;
      newQueue.splice(insertIndex, 0, song);
      setQueue(newQueue);
      setCurrentQueueIndex(insertIndex);
    }
    setIsPlaying(true);
  };

  const handleAddToQueue = (song) => {
    // Add to next up (end of queue)
    setQueue([...queue, song]);
    // Notify user with simple visual cue or just add it
    setQueueOpen(true);
  };

  const handleRemoveFromQueue = (index) => {
    const newQueue = queue.filter((_, idx) => idx !== index);
    setQueue(newQueue);
    if (index === currentQueueIndex) {
      // If we deleted the active track, play the new track at that index
      if (index >= newQueue.length) {
        setCurrentQueueIndex(Math.max(0, newQueue.length - 1));
      }
    } else if (index < currentQueueIndex) {
      // Shift index back since an earlier item was deleted
      setCurrentQueueIndex(currentQueueIndex - 1);
    }
  };

  const handleClearQueue = () => {
    // Clear queue except for currently playing track
    if (activeTrack) {
      setQueue([activeTrack]);
      setCurrentQueueIndex(0);
    } else {
      setQueue([]);
      setCurrentQueueIndex(-1);
    }
  };

  const handleSeek = (time) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleAddCustomSong = (newSong) => {
    // Update songs list
    const updatedSongs = [...songsList, newSong];
    setSongsList(updatedSongs);

    // Save custom link songs only (since blob URLs expire on page reload)
    const customLinkSongs = updatedSongs.filter(s => s.id.startsWith('custom-link-'));
    localStorage.setItem('apple-music-custom-songs', JSON.stringify(customLinkSongs));

    // Automatically play the newly added song
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
    localStorage.setItem('apple-music-playlists', JSON.stringify(updatedPlaylists));
  };

  const handleDeletePlaylist = (playlistId) => {
    const updatedPlaylists = playlists.filter(p => p.id !== playlistId);
    setPlaylists(updatedPlaylists);
    localStorage.setItem('apple-music-playlists', JSON.stringify(updatedPlaylists));
    setActiveView('listen-now');
  };

  const handleAddSongToPlaylist = (playlistId, songId) => {
    const updatedPlaylists = playlists.map(p => {
      if (p.id === playlistId) {
        if (p.songIds.includes(songId)) return p; // already added
        return {
          ...p,
          songIds: [...p.songIds, songId]
        };
      }
      return p;
    });

    setPlaylists(updatedPlaylists);
    localStorage.setItem('apple-music-playlists', JSON.stringify(updatedPlaylists));
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
    localStorage.setItem('apple-music-playlists', JSON.stringify(updatedPlaylists));
  };

  // Format Time for Fullscreen
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="app-container">
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

      {/* Fullscreen Apple Style Player */}
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
