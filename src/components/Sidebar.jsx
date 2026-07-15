import React from 'react';
import { 
  PlayCircle, 
  Compass, 
  Radio, 
  Clock, 
  Music, 
  FolderHeart, 
  Disc, 
  ListMusic, 
  Plus, 
  PlusCircle, 
  Search 
} from 'lucide-react';

export default function Sidebar({ 
  activeView, 
  setActiveView, 
  searchQuery, 
  setSearchQuery, 
  onAddSongClick,
  playlists = [],
  onCreatePlaylistClick
}) {
  return (
    <aside className="sidebar">
      {/* Apple Music Logo */}
      <div className="sidebar-logo">
        <svg viewBox="0 0 170 170" width="24" height="24">
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.92-14.34-6.15-3.02-2.52-6.84-7.04-11.45-13.56-4.75-6.7-8.9-14.97-12.44-24.83-3.53-9.87-5.31-19.58-5.31-29.12 0-11.17 2.77-20.4 8.33-27.68 5.56-7.29 12.56-11 21.02-11.12 4.47 0 9.27 1.25 14.39 3.75 5.12 2.5 8.79 3.75 11 3.75 1.95 0 5.43-1.13 10.42-3.37 5-2.24 9.69-3.28 14.08-3.12 11.23.62 19.82 4.75 25.79 12.38-9.43 5.75-14.03 13.68-13.8 23.8 0 8.16 3.03 14.92 9.07 20.3 6.04 5.37 13.32 8.24 21.84 8.61-.13 2.63-.7 5.44-1.7 8.44zM119.22 30.12c0-7.62 2.75-14.28 8.24-19.98 5.5-5.7 12.01-8.77 19.55-9.2 0.12.87.18 1.62.18 2.24 0 7.37-2.73 13.93-8.2 19.68-5.46 5.76-12.03 8.84-19.7 9.24-.05-.62-.07-1.25-.07-1.98z" />
        </svg>
        <span>Music</span>
      </div>

      {/* Sidebar Search - Apple Style */}
      <div className="search-container">
        <Search size={16} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search" 
          className="search-input"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (activeView !== 'search' && e.target.value.trim() !== '') {
              setActiveView('search');
            }
          }}
        />
      </div>

      {/* Main Views */}
      <div className="sidebar-group">
        <button 
          className={`sidebar-item ${activeView === 'listen-now' ? 'active' : ''}`}
          onClick={() => { setActiveView('listen-now'); setSearchQuery(''); }}
        >
          <PlayCircle size={18} />
          <span>Listen Now</span>
        </button>
        <button 
          className={`sidebar-item ${activeView === 'browse' ? 'active' : ''}`}
          onClick={() => { setActiveView('browse'); setSearchQuery(''); }}
        >
          <Compass size={18} />
          <span>Browse</span>
        </button>
      </div>

      {/* Library Section */}
      <div className="sidebar-group">
        <h3 className="sidebar-title">Library</h3>
        <button 
          className={`sidebar-item ${activeView === 'library' ? 'active' : ''}`}
          onClick={() => { setActiveView('library'); setSearchQuery(''); }}
        >
          <Music size={18} />
          <span>Songs</span>
        </button>
      </div>

      {/* Playlists Section */}
      <div className="sidebar-group" style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '8px' }}>
          <h3 className="sidebar-title" style={{ marginBottom: 0 }}>Playlists</h3>
          <button 
            onClick={onCreatePlaylistClick}
            style={{ background: 'transparent', border: 'none', color: 'var(--apple-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Create Playlist"
          >
            <Plus size={16} />
          </button>
        </div>
        
        {playlists.map((playlist) => (
          <button 
            key={playlist.id}
            className={`sidebar-item ${activeView === `playlist-${playlist.id}` ? 'active' : ''}`}
            onClick={() => { setActiveView(`playlist-${playlist.id}`); setSearchQuery(''); }}
          >
            <ListMusic size={18} />
            <span>{playlist.name}</span>
          </button>
        ))}

        {playlists.length === 0 && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', paddingLeft: '8px', fontStyle: 'italic' }}>
            No playlists yet
          </span>
        )}
      </div>

      {/* Add Music Action Button */}
      <div className="sidebar-group" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <button className="sidebar-item" onClick={onAddSongClick} style={{ color: 'var(--apple-accent)', fontWeight: 600 }}>
          <PlusCircle size={18} />
          <span>Add Custom Song</span>
        </button>
      </div>
    </aside>
  );
}
