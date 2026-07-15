import React from 'react';
import { Play, Trash2, X } from 'lucide-react';

export default function QueuePanel({
  queue,
  currentQueueIndex,
  onQueueItemClick,
  onRemoveFromQueue,
  onClearQueue,
  queueOpen,
  onClose
}) {
  const currentSong = queue[currentQueueIndex];
  const upcomingSongs = queue.slice(currentQueueIndex + 1);

  return (
    <div className={`queue-panel ${queueOpen ? 'open' : ''}`}>
      {/* Queue Header */}
      <div className="queue-header">
        <h3 className="queue-title">Playing Next</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {upcomingSongs.length > 0 && (
            <button className="queue-clear-btn" onClick={onClearQueue}>
              Clear
            </button>
          )}
          <button 
            className="extra-btn" 
            onClick={onClose} 
            style={{ padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Now Playing section */}
      {currentSong ? (
        <div style={{ marginBottom: '16px' }}>
          <span className="sidebar-title" style={{ paddingLeft: 0 }}>Now Playing</span>
          <div className="queue-item active" style={{ cursor: 'default' }}>
            <img 
              src={currentSong.cover || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&q=80'} 
              alt={currentSong.title} 
              className="queue-item-art" 
            />
            <div className="queue-item-details">
              <div className="queue-item-title">{currentSong.title}</div>
              <div className="queue-item-artist">{currentSong.artist}</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.88rem', padding: '16px 0' }}>
          Queue is empty
        </div>
      )}

      {/* Next Up section */}
      <div>
        <span className="sidebar-title" style={{ paddingLeft: 0, display: 'block', marginBottom: '8px' }}>
          Next Up ({upcomingSongs.length})
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
          {upcomingSongs.map((song, idx) => {
            const absoluteIndex = currentQueueIndex + 1 + idx;
            return (
              <div 
                key={`${song.id}-${absoluteIndex}`} 
                className="queue-item"
                onClick={() => onQueueItemClick(absoluteIndex)}
              >
                <img 
                  src={song.cover || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&q=80'} 
                  alt={song.title} 
                  className="queue-item-art" 
                />
                <div className="queue-item-details">
                  <div className="queue-item-title">{song.title}</div>
                  <div className="queue-item-artist">{song.artist}</div>
                </div>
                <button
                  className="cell-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFromQueue(absoluteIndex);
                  }}
                  style={{ opacity: 1, padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  title="Remove from Queue"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}

          {upcomingSongs.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem', padding: '12px 0', fontStyle: 'italic' }}>
              No upcoming songs
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
