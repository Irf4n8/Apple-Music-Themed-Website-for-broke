import React, { useState } from 'react';
import { 
  Play, 
  Clock, 
  Plus, 
  Trash2, 
  Music, 
  FolderHeart,
  Search,
  Sun,
  Moon,
  AlignLeft
} from 'lucide-react';

export default function MainContent({
  activeView,
  songs,
  activeTrack,
  isPlaying,
  onPlaySong,
  onAddToQueue,
  searchQuery,
  theme,
  onThemeToggle,
  playlists,
  onRemoveFromPlaylist,
  onDeletePlaylist,
  onAddSongClick,
  onSidebarToggle
}) {
  const [selectedRowId, setSelectedRowId] = useState(null);

  // Formatting seconds to MM:SS
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Filter songs based on search query
  const getFilteredSongs = () => {
    if (!searchQuery) return songs;
    const query = searchQuery.toLowerCase().trim();
    return songs.filter(song => 
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query) ||
      song.album.toLowerCase().includes(query)
    );
  };

  // Render View: Search Results
  if (activeView === 'search') {
    const filtered = getFilteredSongs();
    return (
      <div className="main-wrapper">
        <div className="main-header">
          <div>
            <h1 className="section-title">Search results for "{searchQuery}"</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Found {filtered.length} matching tracks
            </p>
          </div>
          <button className="theme-btn" onClick={onThemeToggle} title="Toggle Dark/Light Mode">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {filtered.length > 0 ? (
          <div className="songs-table-container">
            <div className="table-row table-header">
              <span>#</span>
              <span>Title</span>
              <span>Album</span>
              <span style={{ textAlign: 'right', paddingRight: '8px' }}><Clock size={14} style={{ verticalAlign: 'middle' }} /></span>
              <span></span>
            </div>
            {filtered.map((song, index) => (
              <div 
                key={song.id} 
                className={`table-row ${activeTrack?.id === song.id ? 'active' : ''}`}
                onDoubleClick={() => onPlaySong(song)}
                onClick={() => setSelectedRowId(song.id)}
              >
                <span className="song-index-cell" style={{ display: 'flex', alignItems: 'center' }}>
                  {activeTrack?.id === song.id && isPlaying ? (
                    <div style={{ color: 'var(--apple-accent)', fontWeight: 'bold' }}>▶</div>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </span>
                <div className="song-title-cell">
                  <img src={song.cover} alt="" className="song-cell-artwork" />
                  <div className="song-text-info">
                    <span className="song-name-text">{song.title}</span>
                    <span className="song-artist-text">{song.artist}</span>
                  </div>
                </div>
                <span className="cell-ellipsis">{song.album}</span>
                <span className="cell-duration">{formatTime(song.duration)}</span>
                <button 
                  className="cell-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToQueue(song);
                  }}
                  title="Add to Queue"
                >
                  <Plus size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Music size={48} />
            <p>No results found. Try searching for another track, artist, or album.</p>
          </div>
        )}
      </div>
    );
  }

  // Render View: Playlists
  if (activeView.startsWith('playlist-')) {
    const playlistId = activeView.replace('playlist-', '');
    const playlist = playlists.find(p => p.id === playlistId);
    
    if (!playlist) return <div className="main-wrapper">Playlist not found</div>;

    const playlistSongs = songs.filter(s => playlist.songIds.includes(s.id));

    return (
      <div className="main-wrapper">
        {/* Playlist Banner Header */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div 
            style={{
              width: '180px',
              height: '180px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #fa243c, #b01a2e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <AlignLeft size={64} />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <span className="hero-tagline" style={{ color: 'var(--apple-accent)' }}>Playlist</span>
            <h1 className="section-title" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{playlist.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              {playlistSongs.length} Songs &bull; Created locally
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {playlistSongs.length > 0 && (
                <button className="btn btn-primary" onClick={() => onPlaySong(playlistSongs[0])} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Play size={16} fill="currentColor" /> Play
                </button>
              )}
              <button 
                className="btn btn-secondary" 
                onClick={() => onDeletePlaylist(playlist.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'red', borderColor: 'rgba(255,0,0,0.2)' }}
              >
                <Trash2 size={15} /> Delete Playlist
              </button>
            </div>
          </div>
          <button className="theme-btn" onClick={onThemeToggle} title="Toggle Dark/Light Mode">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {playlistSongs.length > 0 ? (
          <div className="songs-table-container" style={{ marginTop: '24px' }}>
            <div className="table-row table-header">
              <span>#</span>
              <span>Title</span>
              <span>Album</span>
              <span style={{ textAlign: 'right', paddingRight: '8px' }}><Clock size={14} style={{ verticalAlign: 'middle' }} /></span>
              <span></span>
            </div>
            {playlistSongs.map((song, index) => (
              <div 
                key={song.id} 
                className={`table-row ${activeTrack?.id === song.id ? 'active' : ''}`}
                onDoubleClick={() => onPlaySong(song)}
                onClick={() => setSelectedRowId(song.id)}
              >
                <span className="song-index-cell" style={{ display: 'flex', alignItems: 'center' }}>
                  {activeTrack?.id === song.id && isPlaying ? (
                    <div style={{ color: 'var(--apple-accent)', fontWeight: 'bold' }}>▶</div>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </span>
                <div className="song-title-cell">
                  <img src={song.cover} alt="" className="song-cell-artwork" />
                  <div className="song-text-info">
                    <span className="song-name-text">{song.title}</span>
                    <span className="song-artist-text">{song.artist}</span>
                  </div>
                </div>
                <span className="cell-ellipsis">{song.album}</span>
                <span className="cell-duration">{formatTime(song.duration)}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="cell-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToQueue(song);
                    }}
                    title="Add to Queue"
                  >
                    <Plus size={16} />
                  </button>
                  <button 
                    className="cell-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromPlaylist(playlist.id, song.id);
                    }}
                    title="Remove from Playlist"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Music size={48} />
            <p>This playlist has no songs yet. Drag songs here or right click to add songs.</p>
          </div>
        )}
      </div>
    );
  }

  // Render View: Listen Now (Home Screen)
  if (activeView === 'listen-now') {
    return (
      <div className="main-wrapper">
        <div className="main-header">
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>WELCOME TO MUSIC</span>
            <h1 className="section-title" style={{ fontSize: '2.2rem', marginTop: '2px' }}>Listen Now</h1>
          </div>
          <button className="theme-btn" onClick={onThemeToggle} title="Toggle Dark/Light Mode">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Hero Banner Card */}
        <div className="hero-banner hero-banner-glass">
          <span className="hero-tagline">EXCLUSIVE FEATURE</span>
          <h2 className="hero-title">Add Custom Music Instantly</h2>
          <p className="hero-desc">
            Paste direct links to audio files or upload MP3 files from your device. Experiencing music exactly the way you want, with a premium glassmorphic interface.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={onAddSongClick}
            style={{ width: 'fit-content', marginTop: '16px', fontWeight: 700 }}
          >
            Upload Track
          </button>
        </div>

        {/* Categories / Grid items */}
        <div>
          <h3 className="section-title">Recently Played</h3>
          <div className="cards-grid">
            {songs.slice(0, 4).map((song) => (
              <div key={song.id} className="card" onClick={() => onPlaySong(song)}>
                <div className="card-img-wrapper">
                  <img src={song.cover} alt={song.title} className="card-img" />
                  <div className="card-play-overlay">
                    <button className="overlay-play-btn">
                      <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />
                    </button>
                  </div>
                </div>
                <span className="card-title">{song.title}</span>
                <span className="card-subtitle">{song.artist}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="section-title">Featured Station Mixes</h3>
          <div className="cards-grid">
            {/* PROCEDURAL PLAYLIST CARDS */}
            <div className="card" onClick={() => onPlaySong(songs[0])}>
              <div className="card-img-wrapper" style={{ background: 'linear-gradient(135deg, #fa243c, #1f2a44)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', textAlign: 'center', padding: '16px' }}>Favorites Mix</span>
              </div>
              <span className="card-title">Favorites Mix</span>
              <span className="card-subtitle">Vibe Hits</span>
            </div>

            <div className="card" onClick={() => onPlaySong(songs[2])}>
              <div className="card-img-wrapper" style={{ background: 'linear-gradient(135deg, #ff7b00, #990099)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', textAlign: 'center', padding: '16px' }}>Chill Mix</span>
              </div>
              <span className="card-title">Chill Mix</span>
              <span className="card-subtitle">Relaxing Beats</span>
            </div>

            <div className="card" onClick={() => onPlaySong(songs[4])}>
              <div className="card-img-wrapper" style={{ background: 'linear-gradient(135deg, #00f2fe, #4facfe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', textAlign: 'center', padding: '16px' }}>Focus Mix</span>
              </div>
              <span className="card-title">Focus Mix</span>
              <span className="card-subtitle">Study Instrumental</span>
            </div>

            <div className="card" onClick={() => onPlaySong(songs[1])}>
              <div className="card-img-wrapper" style={{ background: 'linear-gradient(135deg, #0575e6, #00f260)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', textAlign: 'center', padding: '16px' }}>Energy Mix</span>
              </div>
              <span className="card-title">Energy Mix</span>
              <span className="card-subtitle">Running & Workout</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render View: Browse
  if (activeView === 'browse') {
    return (
      <div className="main-wrapper">
        <div className="main-header">
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>EXPLORE LATEST TUNES</span>
            <h1 className="section-title" style={{ fontSize: '2.2rem', marginTop: '2px' }}>Browse</h1>
          </div>
          <button className="theme-btn" onClick={onThemeToggle} title="Toggle Dark/Light Mode">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Dynamic banner row */}
        <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
          <div className="hero-banner" style={{ background: 'linear-gradient(135deg, #00c6ff, #0072ff)', flex: '0 0 280px', minHeight: '140px' }}>
            <span className="hero-tagline">CITY LIGHTS</span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Global Sounds</h3>
          </div>
          <div className="hero-banner" style={{ background: 'linear-gradient(135deg, #f857a6, #ff5858)', flex: '0 0 280px', minHeight: '140px' }}>
            <span className="hero-tagline">NEW ALbum</span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Synthetix Launch</h3>
          </div>
          <div className="hero-banner" style={{ background: 'linear-gradient(135deg, #11998e, #38ef7d)', flex: '0 0 280px', minHeight: '140px' }}>
            <span className="hero-tagline">LIVESTREAM</span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Acoustic Sessions</h3>
          </div>
        </div>

        {/* Daily Top 100 Charts */}
        <div>
          <h3 className="section-title">Daily Top Charts</h3>
          <div className="cards-grid">
            {songs.map((song) => (
              <div key={song.id} className="card" onClick={() => onPlaySong(song)}>
                <div className="card-img-wrapper">
                  <img src={song.cover} alt={song.title} className="card-img" />
                  <div className="card-play-overlay">
                    <button className="overlay-play-btn">
                      <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />
                    </button>
                  </div>
                </div>
                <span className="card-title">{song.title}</span>
                <span className="card-subtitle">{song.artist}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default Render View: Songs (Library)
  return (
    <div className="main-wrapper">
      <div className="main-header">
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>YOUR PERSONAL LIBRARY</span>
          <h1 className="section-title" style={{ fontSize: '2.2rem', marginTop: '2px' }}>Songs</h1>
        </div>
        <button className="theme-btn" onClick={onThemeToggle} title="Toggle Dark/Light Mode">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {songs.length > 0 ? (
        <div className="songs-table-container">
          <div className="table-row table-header">
            <span>#</span>
            <span>Title</span>
            <span>Album</span>
            <span style={{ textAlign: 'right', paddingRight: '8px' }}><Clock size={14} style={{ verticalAlign: 'middle' }} /></span>
            <span></span>
          </div>
          {songs.map((song, index) => (
            <div 
              key={song.id} 
              className={`table-row ${activeTrack?.id === song.id ? 'active' : ''} ${selectedRowId === song.id ? 'selected-row' : ''}`}
              onDoubleClick={() => onPlaySong(song)}
              onClick={() => setSelectedRowId(song.id)}
            >
              <span className="song-index-cell" style={{ display: 'flex', alignItems: 'center' }}>
                {activeTrack?.id === song.id && isPlaying ? (
                  <div style={{ color: 'var(--apple-accent)', fontWeight: 'bold' }}>▶</div>
                ) : (
                  <span>{index + 1}</span>
                )}
              </span>
              <div className="song-title-cell">
                <img src={song.cover} alt="" className="song-cell-artwork" />
                <div className="song-text-info">
                  <span className="song-name-text">{song.title}</span>
                  <span className="song-artist-text">{song.artist}</span>
                </div>
              </div>
              <span className="cell-ellipsis">{song.album}</span>
              <span className="cell-duration">{formatTime(song.duration)}</span>
              <button 
                className="cell-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToQueue(song);
                }}
                title="Add to Queue"
              >
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Music size={48} />
          <p>Your library is empty. Add audio links or upload files to populate it!</p>
        </div>
      )}
    </div>
  );
}
