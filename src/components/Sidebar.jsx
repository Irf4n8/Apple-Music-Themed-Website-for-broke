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
  onCreatePlaylistClick,
  onInstallClick
}) {
  return (
    <aside className="sidebar">
      {/* Premium Music Logo */}
      <div className="sidebar-logo">
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" fill="currentColor" />
          <circle cx="18" cy="16" r="3" fill="currentColor" />
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

      {/* Add Music & PWA Install Button */}
      <div className="sidebar-group" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '16px', gap: '8px' }}>
        <button className="sidebar-item" onClick={onAddSongClick} style={{ color: 'var(--apple-accent)', fontWeight: 600 }}>
          <PlusCircle size={18} />
          <span>Add Custom Song</span>
        </button>
        <button 
          className="sidebar-item" 
          onClick={onInstallClick} 
          style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}
        >
          <Compass size={18} />
          <span>Install Web App</span>
        </button>
      </div>
    </aside>
  );
}
