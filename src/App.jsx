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

  // Mini Player & Install App States
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [miniPlayerPos, setMiniPlayerPos] = useState({ x: window.innerWidth - 320, y: window.innerHeight - 380 });
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Sleep Timer, Shortcuts, & Visualizer States
  const [sleepTimeLeft, setSleepTimeLeft] = useState(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Visualizer References
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const sleepTimeRef = useRef(null);

  useEffect(() => { sleepTimeRef.current = sleepTimeLeft; }, [sleepTimeLeft]);

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
      if (sleepTimeRef.current === -1) {
        setIsPlaying(false);
        setSleepTimeLeft(null);
        return;
      }
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
                if (sleepTimeRef.current === -1) {
                  setIsPlaying(false);
                  setSleepTimeLeft(null);
                  return;
                }
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

  // Web Audio Context initializer
  const initWebAudio = () => {
    if (!audioRef.current || audioContextRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64; // compact fftSize for elegant bar rendering
      
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    } catch (e) {
      console.log('Web Audio initialization blocked or failed:', e);
    }
  };

  // Keyboard Shortcuts system-wide listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (key === 'm') {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      } else if (key === 'l') {
        e.preventDefault();
        setLyricsOpen((prev) => !prev);
        setQueueOpen(false);
      } else if (key === 'q') {
        e.preventDefault();
        setQueueOpen((prev) => !prev);
        setLyricsOpen(false);
      } else if (key === 'f') {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
      } else if (key === 'arrowright') {
        e.preventDefault();
        handleSeek(Math.min(duration, currentTime + 5));
      } else if (key === 'arrowleft') {
        e.preventDefault();
        handleSeek(Math.max(0, currentTime - 5));
      } else if (key === 'arrowup') {
        e.preventDefault();
        setVolume((prev) => Math.min(1, prev + 0.05));
      } else if (key === 'arrowdown') {
        e.preventDefault();
        setVolume((prev) => Math.max(0, prev - 0.05));
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration, currentTime]);

  // Sleep Timer Countdown Tick effect
  useEffect(() => {
    if (sleepTimeLeft === null || sleepTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setSleepTimeLeft((prev) => {
        if (prev === -1) return -1;
        if (prev <= 1) {
          setIsPlaying(false);
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimeLeft, isPlaying]);

  // Visualizer Canvas render loop
  useEffect(() => {
    if (!isFullscreen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const isYt = activeTrack && getYouTubeId(activeTrack.url);
    if (!isYt && isPlaying) {
      initWebAudio();
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    }

    const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const renderVisualizer = () => {
      animationFrameId = requestAnimationFrame(renderVisualizer);

      // Semi-transparent overlay to create premium trace trail motion blur
      ctx.fillStyle = 'rgba(8, 8, 10, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;

      if (!isYt && isPlaying && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else if (isPlaying) {
        // Realistic procedural fallback frequency bars for YouTube streams
        const time = Date.now() * 0.003;
        for (let i = 0; i < bufferLength; i++) {
          const frequency = Math.sin(time + i * 0.15) * Math.cos(time * 0.7 + i * 0.05);
          dataArray[i] = Math.abs(frequency) * 160 + Math.random() * 20;
        }
      } else {
        // Flatline idle wave
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = 5 + Math.sin(i * 0.5) * 3;
        }
      }

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

        const grad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        grad.addColorStop(0, '#7d1b82');
        grad.addColorStop(1, '#fa243c');

        ctx.fillStyle = grad;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#fa243c';

        ctx.beginPath();
        ctx.roundRect(x, canvas.height - barHeight, barWidth - 4, barHeight, [4, 4, 0, 0]);
        ctx.fill();

        x += barWidth;
      }
      ctx.shadowBlur = 0;
    };

    renderVisualizer();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isFullscreen, isPlaying, activeTrack?.id]);

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
    <div className={`app-container ${isMiniPlayer ? 'mini-player-layout' : ''}`}>
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
        onInstallClick={() => setIsInstallModalOpen(true)}
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
        onMiniPlayerToggle={() => setIsMiniPlayer(!isMiniPlayer)}
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

            {/* Audio Visualizer Canvas */}
            <canvas 
              ref={canvasRef} 
              className="visualizer-canvas" 
              width={500} 
              height={80} 
            />

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

      {/* Draggable Mini-Player Widget Overlay */}
      {isMiniPlayer && activeTrack && (
        <div 
          className="mini-player-card"
          style={{ 
            left: `${miniPlayerPos.x}px`, 
            top: `${miniPlayerPos.y}px` 
          }}
        >
          {/* Drag Handle */}
          <div 
            className="mini-player-drag-handle"
            onPointerDown={(e) => {
              dragStartRef.current = { 
                x: e.clientX - miniPlayerPos.x, 
                y: e.clientY - miniPlayerPos.y 
              };
              setIsDragging(true);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!isDragging) return;
              const newX = Math.min(window.innerWidth - 300, Math.max(10, e.clientX - dragStartRef.current.x));
              const newY = Math.min(window.innerHeight - 340, Math.max(10, e.clientY - dragStartRef.current.y));
              setMiniPlayerPos({ x: newX, y: newY });
            }}
            onPointerUp={(e) => {
              setIsDragging(false);
              e.currentTarget.releasePointerCapture(e.pointerId);
            }}
          >
            <div className="mini-player-drag-bar" />
            <button 
              className="mini-player-close" 
              onClick={() => setIsMiniPlayer(false)}
              title="Restore Player"
            >
              <X size={15} />
            </button>
          </div>

          {/* Album Cover */}
          <div className="mini-player-art-container">
            <img 
              src={activeTrack.cover} 
              alt="" 
              className={`mini-player-art ${isPlaying ? 'mini-player-spinning' : ''}`} 
            />
          </div>

          {/* Song Meta */}
          <div className="mini-player-details">
            <div className="mini-player-title">{activeTrack.title}</div>
            <div className="mini-player-artist">{activeTrack.artist}</div>
          </div>

          {/* Controls */}
          <div className="mini-player-controls">
            <button className="control-btn" onClick={playPrevTrack}>
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button 
              className="control-btn play-btn" 
              onClick={() => setIsPlaying(!isPlaying)}
              style={{ width: '40px', height: '40px', background: 'var(--text-primary)', color: 'var(--bg-app)', borderRadius: '50%' }}
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />}
            </button>
            <button className="control-btn" onClick={playNextTrack}>
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>
        </div>
      )}

      {/* PWA Install Instructions Modal */}
      {isInstallModalOpen && (
        <div className="modal-overlay" onClick={() => setIsInstallModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Install Web App</h2>
              <button className="modal-close-btn" onClick={() => setIsInstallModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: '1.4' }}>
                Run this music player as a lightweight standalone app on your device for quick access, offline boot, and distraction-free listening!
              </p>
              <div className="pwa-list">
                <div className="pwa-step">
                  <span className="pwa-badge">1</span>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>On iPhone / iPad (Safari)</strong>
                    <p style={{ marginTop: 2, fontSize: '0.8rem' }}>Tap the <strong>Share</strong> button at the bottom of Safari, scroll down, and select <strong>Add to Home Screen</strong>.</p>
                  </div>
                </div>
                <div className="pwa-step">
                  <span className="pwa-badge">2</span>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>On Android (Chrome)</strong>
                    <p style={{ marginTop: 2, fontSize: '0.8rem' }}>Tap the three dots menu at the top-right, and select <strong>Add to Home Screen</strong> or <strong>Install App</strong>.</p>
                  </div>
                </div>
                <div className="pwa-step">
                  <span className="pwa-badge">3</span>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>On Desktop (Chrome, Edge, Brave)</strong>
                    <p style={{ marginTop: 2, fontSize: '0.8rem' }}>Click the <strong>Install</strong> icon (computer screen with down-arrow) in the browser URL address bar.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setIsInstallModalOpen(false)}>Got It</button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {isShortcutsOpen && (
        <div className="modal-overlay" onClick={() => setIsShortcutsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Keyboard Shortcuts</h2>
              <button className="modal-close-btn" onClick={() => setIsShortcutsOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '0 8px 16px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Control your music instantly using these system-wide hotkeys:
              </p>
              <div className="shortcuts-grid">
                <div className="shortcut-item">
                  <span>Play / Pause</span>
                  <span className="shortcut-key">Spacebar</span>
                </div>
                <div className="shortcut-item">
                  <span>Mute / Unmute</span>
                  <span className="shortcut-key">M</span>
                </div>
                <div className="shortcut-item">
                  <span>Toggle Lyrics</span>
                  <span className="shortcut-key">L</span>
                </div>
                <div className="shortcut-item">
                  <span>Toggle Queue</span>
                  <span className="shortcut-key">Q</span>
                </div>
                <div className="shortcut-item">
                  <span>Toggle Fullscreen</span>
                  <span className="shortcut-key">F</span>
                </div>
                <div className="shortcut-item">
                  <span>Seek Forward 5s</span>
                  <span className="shortcut-key">➔</span>
                </div>
                <div className="shortcut-item">
                  <span>Seek Backward 5s</span>
                  <span className="shortcut-key">⬅</span>
                </div>
                <div className="shortcut-item">
                  <span>Volume Up / Down</span>
                  <span className="shortcut-key">▲ / ▼</span>
                </div>
                <div className="shortcut-item" style={{ gridColumn: 'span 2', borderBottom: 'none', justifyContent: 'center', marginTop: 12 }}>
                  <span style={{ fontSize: '0.8rem' }}>Press <strong style={{ color: 'var(--apple-accent)' }}>?</strong> anywhere to view this panel.</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setIsShortcutsOpen(false)}>Got It</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
